/**
 * Supabase Media & Storage Diagnostic Logger
 * 
 * Provides automated tracing, diagnostics, and root-cause analysis
 * for media asset loading failures across Supabase Storage and CDN layers.
 */

export interface ParsedMediaUrl {
  originalUrl: string;
  isSupabaseStorage: boolean;
  isCustomCdn: boolean;
  isPlaceholder: boolean;
  projectRef: string | null;
  host: string | null;
  bucket: string | null;
  objectPath: string | null;
  fileName: string | null;
  endpointType: 'public' | 'authenticated' | 'sign' | 'other' | null;
  matchesConfiguredProject: boolean;
  configuredSupabaseUrl: string;
}

export type StorageIssueType = 
  | 'PUBLIC_BUCKET_DISABLED'
  | 'RLS_POLICY_RESTRICTION'
  | 'OBJECT_NOT_FOUND'
  | 'BUCKET_NOT_FOUND'
  | 'PLACEHOLDER_PROJECT_URL'
  | 'PROJECT_MISMATCH'
  | 'CDN_CONFIG_ERROR'
  | 'CORS_OR_NETWORK_ERROR'
  | 'MALFORMED_URL'
  | 'UNKNOWN_ERROR';

export interface DashboardChecklistItem {
  step: number;
  label: string;
  action: string;
  dashboardPath: string;
  sqlSnippet?: string;
}

export interface MediaDiagnosticReport {
  id: string;
  timestamp: string;
  url: string;
  parsed: ParsedMediaUrl;
  status: 'ok' | 'warning' | 'error';
  statusCode: number | null;
  statusText: string | null;
  issueType: StorageIssueType | null;
  title: string;
  description: string;
  remediationSteps: string[];
  dashboardChecklist: DashboardChecklistItem[];
  responseTimeMs: number;
  headers?: Record<string, string>;
  componentContext?: string;
}

export interface BucketAuditReport {
  bucket: string;
  isConfigured: boolean;
  isPublic: boolean;
  canList: boolean;
  fileCount: number;
  error?: string;
  remediation?: string[];
  dashboardPath?: string;
}

// In-memory ring buffer for media diagnostic events
const MAX_LOG_ENTRIES = 100;
const mediaLogHistory: MediaDiagnosticReport[] = [];
const logListeners = new Set<(report: MediaDiagnosticReport) => void>();

/**
 * Get the currently configured Supabase base URL
 */
export function getConfiguredSupabaseUrl(): string {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://placeholder-project.supabase.co';
}

/**
 * Extract the project ref from a standard supabase URL (e.g. https://xyz.supabase.co -> xyz)
 */
export function extractProjectRef(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr);
    const hostParts = parsed.hostname.split('.');
    if (parsed.hostname.endsWith('.supabase.co') && hostParts.length >= 3) {
      return hostParts[0];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse any media URL to identify Supabase Storage parameters, bucket, object path, and CDN configuration.
 */
export function parseMediaUrl(url: string): ParsedMediaUrl {
  const configuredUrl = getConfiguredSupabaseUrl();
  const configuredRef = extractProjectRef(configuredUrl);

  const defaultResult: ParsedMediaUrl = {
    originalUrl: url,
    isSupabaseStorage: false,
    isCustomCdn: false,
    isPlaceholder: false,
    projectRef: null,
    host: null,
    bucket: null,
    objectPath: null,
    fileName: null,
    endpointType: null,
    matchesConfiguredProject: false,
    configuredSupabaseUrl: configuredUrl,
  };

  if (!url || typeof url !== 'string') {
    return defaultResult;
  }

  const isPlaceholderUrl = url.includes('placeholder-project.supabase.co') || configuredUrl.includes('placeholder-project.supabase.co');

  try {
    const parsed = new URL(url, window.location.origin);
    defaultResult.host = parsed.hostname;

    const currentRef = extractProjectRef(url);
    defaultResult.projectRef = currentRef;
    defaultResult.isPlaceholder = isPlaceholderUrl;

    // Check for Supabase storage path: /storage/v1/object/(public|authenticated|sign)/<bucket>/<path>
    const storagePublicMatch = parsed.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    const storageAuthMatch = parsed.pathname.match(/\/storage\/v1\/object\/authenticated\/([^/]+)\/(.+)$/);
    const storageSignMatch = parsed.pathname.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/);

    if (storagePublicMatch) {
      defaultResult.isSupabaseStorage = true;
      defaultResult.endpointType = 'public';
      defaultResult.bucket = decodeURIComponent(storagePublicMatch[1]);
      defaultResult.objectPath = decodeURIComponent(storagePublicMatch[2]);
    } else if (storageAuthMatch) {
      defaultResult.isSupabaseStorage = true;
      defaultResult.endpointType = 'authenticated';
      defaultResult.bucket = decodeURIComponent(storageAuthMatch[1]);
      defaultResult.objectPath = decodeURIComponent(storageAuthMatch[2]);
    } else if (storageSignMatch) {
      defaultResult.isSupabaseStorage = true;
      defaultResult.endpointType = 'sign';
      defaultResult.bucket = decodeURIComponent(storageSignMatch[1]);
      defaultResult.objectPath = decodeURIComponent(storageSignMatch[2]);
    } else if (parsed.pathname.includes('/storage/v1/')) {
      defaultResult.isSupabaseStorage = true;
      defaultResult.endpointType = 'other';
    }

    if (defaultResult.objectPath) {
      const parts = defaultResult.objectPath.split('/');
      defaultResult.fileName = parts[parts.length - 1];
    }

    // Check if URL belongs to configured Supabase project or a custom CDN
    if (defaultResult.isSupabaseStorage) {
      if (currentRef && configuredRef && currentRef === configuredRef) {
        defaultResult.matchesConfiguredProject = true;
      } else if (parsed.origin === configuredUrl) {
        defaultResult.matchesConfiguredProject = true;
      } else if (currentRef && configuredRef && currentRef !== configuredRef) {
        defaultResult.matchesConfiguredProject = false;
      } else {
        // Likely a custom CDN or reverse proxy
        defaultResult.isCustomCdn = true;
        defaultResult.matchesConfiguredProject = false;
      }
    }

    return defaultResult;
  } catch {
    return defaultResult;
  }
}

/**
 * Generate actionable troubleshooting steps and Supabase Dashboard checklists based on issue type.
 */
export function generateDashboardRemediation(
  issueType: StorageIssueType, 
  parsed: ParsedMediaUrl, 
  statusCode: number | null
): { title: string; description: string; steps: string[]; checklist: DashboardChecklistItem[] } {
  const bucketName = parsed.bucket || 'media';
  const fileName = parsed.fileName || 'your-file';

  switch (issueType) {
    case 'PUBLIC_BUCKET_DISABLED':
    case 'RLS_POLICY_RESTRICTION':
      return {
        title: `Public Access Blocked for '${bucketName}' Bucket (HTTP ${statusCode || 403})`,
        description: `The media bucket '${bucketName}' in Supabase is either set to Private or lacks an Anonymous SELECT Policy on storage.objects.`,
        steps: [
          `Open your Supabase Dashboard for project "${parsed.projectRef || 'your project'}".`,
          `Navigate to "Storage" -> "Buckets" -> click the options menu (three dots) on the "${bucketName}" bucket.`,
          `Select "Edit Bucket" and ensure "Public bucket" is toggled ON (Green).`,
          `Navigate to "Storage" -> "Policies" (or "Authentication" -> "Policies").`,
          `Under "storage.objects", add a SELECT policy for public/anonymous access so visitors can view media assets.`
        ],
        checklist: [
          {
            step: 1,
            label: 'Make Bucket Public in Dashboard',
            action: `Go to Storage -> Buckets -> "${bucketName}" -> Edit Bucket -> Toggle "Public bucket" ON.`,
            dashboardPath: `Storage -> Buckets -> ${bucketName}`
          },
          {
            step: 2,
            label: 'Ensure Anon Read Policy Exists',
            action: `In SQL Editor or Storage Policies, verify an open read policy exists for ${bucketName}.`,
            dashboardPath: `Storage -> Configuration -> Policies`,
            sqlSnippet: `CREATE POLICY "Public Access" \nON storage.objects FOR SELECT \nTO anon, authenticated \nUSING (bucket_id = '${bucketName}');`
          }
        ]
      };

    case 'OBJECT_NOT_FOUND':
      return {
        title: `Media Asset Not Found (HTTP 404)`,
        description: `The file "${fileName}" could not be located in bucket "${bucketName}". It may have been deleted, renamed, or not uploaded.`,
        steps: [
          `Open your Supabase Dashboard -> "Storage" -> "Buckets" -> "${bucketName}".`,
          `Search for "${fileName}" to verify whether the object exists.`,
          `If the file is missing, re-upload it via the Admin Media Library or directly in the Supabase Dashboard.`,
          `Check whether the file path contains unexpected URL encoding (e.g. spaces converted to %20 or dashes).`
        ],
        checklist: [
          {
            step: 1,
            label: 'Verify File Existence',
            action: `Check if "${fileName}" is present in the "${bucketName}" bucket directory.`,
            dashboardPath: `Storage -> Buckets -> ${bucketName}`
          },
          {
            step: 2,
            label: 'Re-upload Media Asset',
            action: `Upload the file to bucket "${bucketName}" with matching file name.`,
            dashboardPath: `Admin Media Library (/admin/media) or Supabase Dashboard`
          }
        ]
      };

    case 'BUCKET_NOT_FOUND':
      return {
        title: `Storage Bucket '${bucketName}' Does Not Exist`,
        description: `The requested bucket "${bucketName}" has not been created in this Supabase project.`,
        steps: [
          `Open your Supabase Dashboard -> "Storage" -> "Buckets".`,
          `Click "New Bucket".`,
          `Name the bucket "${bucketName}" (case-sensitive).`,
          `Toggle "Public bucket" to ON so assets are publicly accessible.`,
          `Click "Save bucket".`
        ],
        checklist: [
          {
            step: 1,
            label: 'Create Bucket in Supabase Dashboard',
            action: `Go to Storage -> Click "New bucket" -> Name: "${bucketName}" -> Toggle "Public bucket" ON.`,
            dashboardPath: `Storage -> Buckets`
          }
        ]
      };

    case 'PLACEHOLDER_PROJECT_URL':
      return {
        title: `Supabase Environment Variable Not Configured`,
        description: `The app is using the fallback placeholder URL ("https://placeholder-project.supabase.co"). Real media assets from Supabase Storage cannot load without valid credentials.`,
        steps: [
          `Open your Supabase Dashboard -> "Project Settings" -> "API".`,
          `Copy the "Project URL" (e.g., https://xyzcompany.supabase.co).`,
          `Copy the "anon / public" API Key.`,
          `Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your deployment environment (or .env file).`
        ],
        checklist: [
          {
            step: 1,
            label: 'Retrieve Supabase Credentials',
            action: 'Copy Project URL and Anon Key from Supabase Dashboard -> Settings -> API.',
            dashboardPath: 'Project Settings -> API'
          },
          {
            step: 2,
            label: 'Set Environment Variables',
            action: 'Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
            dashboardPath: 'Hosting Settings / Environment'
          }
        ]
      };

    case 'PROJECT_MISMATCH':
      return {
        title: `Project Ref Mismatch in Media URL`,
        description: `The asset URL belongs to project "${parsed.projectRef || 'other'}", but your app is configured with "${extractProjectRef(parsed.configuredSupabaseUrl) || 'different'}".`,
        steps: [
          `Verify whether this media URL was migrated from a staging or older Supabase project.`,
          `Update the database record in media_library to point to the current project's storage URL.`,
          `Alternatively, check if VITE_SUPABASE_URL is pointing to the correct production project.`
        ],
        checklist: [
          {
            step: 1,
            label: 'Audit Project Reference',
            action: `Compare URL project ref (${parsed.projectRef}) with configured project (${extractProjectRef(parsed.configuredSupabaseUrl)}).`,
            dashboardPath: 'Project Settings -> General'
          }
        ]
      };

    case 'CDN_CONFIG_ERROR':
      return {
        title: `Custom CDN / Domain Configuration Issue`,
        description: `The media URL is routed through a custom CDN or domain ("${parsed.host}") that is not responding correctly.`,
        steps: [
          `Verify your CDN CNAME DNS records point to your Supabase project domain.`,
          `If using Supabase Custom Domains, verify status in Supabase Dashboard -> Project Settings -> Custom Domains.`,
          `Check SSL / TLS certificate status on your CDN proxy.`,
          `Ensure origin request headers preserve Host headers if required by Supabase Storage.`
        ],
        checklist: [
          {
            step: 1,
            label: 'Check Custom Domain Status',
            action: 'Verify Custom Domain active status in Supabase Dashboard.',
            dashboardPath: 'Project Settings -> Custom Domains'
          },
          {
            step: 2,
            label: 'Validate CDN CNAME & SSL',
            action: 'Test DNS resolution and SSL certificate validity for CDN domain.',
            dashboardPath: 'Cloudflare / DNS Provider'
          }
        ]
      };

    case 'CORS_OR_NETWORK_ERROR':
    default:
      return {
        title: `Media Asset Network / CORS Error`,
        description: `The browser failed to fetch or render the media asset. This can be caused by CORS restrictions, adblockers, or network interruptions.`,
        steps: [
          `Check browser DevTools Network tab for CORS or blocked status.`,
          `In Supabase Dashboard -> Project Settings -> API, verify Allowed Origins / CORS settings.`,
          `Ensure the asset URL uses HTTPS to avoid Mixed Content blocking.`,
          `Verify that the media URL is reachable directly by opening it in a new browser tab.`
        ],
        checklist: [
          {
            step: 1,
            label: 'Test Direct URL Access',
            action: `Open the URL directly in browser: ${parsed.originalUrl}`,
            dashboardPath: 'Browser Tab'
          },
          {
            step: 2,
            label: 'Check Storage & API Settings',
            action: 'Verify API CORS and Storage settings in Supabase Dashboard.',
            dashboardPath: 'Project Settings -> API'
          }
        ]
      };
  }
}

/**
 * Actively probe a media asset URL using fetch/HEAD to inspect response codes and headers.
 */
export async function diagnoseMediaAsset(url: string, context?: { component?: string; fileName?: string }): Promise<MediaDiagnosticReport> {
  const startTime = performance.now();
  const parsed = parseMediaUrl(url);
  const reportId = `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (parsed.isPlaceholder) {
    const remediation = generateDashboardRemediation('PLACEHOLDER_PROJECT_URL', parsed, null);
    const report: MediaDiagnosticReport = {
      id: reportId,
      timestamp: new Date().toISOString(),
      url,
      parsed,
      status: 'error',
      statusCode: null,
      statusText: 'Placeholder Supabase URL',
      issueType: 'PLACEHOLDER_PROJECT_URL',
      title: remediation.title,
      description: remediation.description,
      remediationSteps: remediation.steps,
      dashboardChecklist: remediation.checklist,
      responseTimeMs: 0,
      componentContext: context?.component,
    };
    registerDiagnosticReport(report);
    return report;
  }

  let statusCode: number | null = null;
  let statusText: string | null = null;
  const responseHeaders: Record<string, string> = {};
  let issueType: StorageIssueType = 'UNKNOWN_ERROR';

  try {
    // Try lightweight HEAD or GET probe with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'image/*,video/*,application/pdf,*/*'
      }
    });

    clearTimeout(timeoutId);
    statusCode = response.status;
    statusText = response.statusText;

    response.headers.forEach((val, key) => {
      responseHeaders[key.toLowerCase()] = val;
    });

    if (response.ok) {
      const responseTimeMs = Math.round(performance.now() - startTime);
      const report: MediaDiagnosticReport = {
        id: reportId,
        timestamp: new Date().toISOString(),
        url,
        parsed,
        status: 'ok',
        statusCode,
        statusText,
        issueType: null,
        title: 'Media Asset Reachable',
        description: `Successfully reached media asset (HTTP ${statusCode}) in ${responseTimeMs}ms.`,
        remediationSteps: [],
        dashboardChecklist: [],
        responseTimeMs,
        headers: responseHeaders,
        componentContext: context?.component,
      };
      registerDiagnosticReport(report);
      return report;
    }

    // Classify non-OK status codes
    if (statusCode === 403 || statusCode === 401) {
      issueType = 'PUBLIC_BUCKET_DISABLED';
    } else if (statusCode === 404) {
      // Check response body for bucket vs object error
      try {
        const bodyText = await response.text();
        if (bodyText.toLowerCase().includes('bucket not found')) {
          issueType = 'BUCKET_NOT_FOUND';
        } else {
          issueType = 'OBJECT_NOT_FOUND';
        }
      } catch {
        issueType = 'OBJECT_NOT_FOUND';
      }
    } else if (statusCode === 400) {
      issueType = 'MALFORMED_URL';
    } else if (parsed.isCustomCdn) {
      issueType = 'CDN_CONFIG_ERROR';
    } else {
      issueType = 'UNKNOWN_ERROR';
    }

  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string } | null;
    if (errorObj?.name === 'AbortError') {
      issueType = 'CORS_OR_NETWORK_ERROR';
      statusText = 'Request Timed Out (6s)';
    } else if (!navigator.onLine) {
      issueType = 'CORS_OR_NETWORK_ERROR';
      statusText = 'Client Offline';
    } else if (parsed.isCustomCdn) {
      issueType = 'CDN_CONFIG_ERROR';
      statusText = 'CDN Unreachable';
    } else {
      issueType = 'CORS_OR_NETWORK_ERROR';
      statusText = errorObj?.message || 'Network Fetch Failed';
    }
  }

  // Check if project mismatch is suspected
  if (parsed.projectRef && !parsed.matchesConfiguredProject && !parsed.isPlaceholder) {
    issueType = 'PROJECT_MISMATCH';
  }

  const responseTimeMs = Math.round(performance.now() - startTime);
  const remediation = generateDashboardRemediation(issueType, parsed, statusCode);

  const report: MediaDiagnosticReport = {
    id: reportId,
    timestamp: new Date().toISOString(),
    url,
    parsed,
    status: 'error',
    statusCode,
    statusText,
    issueType,
    title: remediation.title,
    description: remediation.description,
    remediationSteps: remediation.steps,
    dashboardChecklist: remediation.checklist,
    responseTimeMs,
    headers: responseHeaders,
    componentContext: context?.component,
  };

  registerDiagnosticReport(report);
  return report;
}

/**
 * Register diagnostic report in memory and notify listeners.
 */
function registerDiagnosticReport(report: MediaDiagnosticReport) {
  // Avoid duplicate flooding if the same URL failed in the last 2 seconds
  const existingIdx = mediaLogHistory.findIndex(
    r => r.url === report.url && Math.abs(new Date(r.timestamp).getTime() - new Date(report.timestamp).getTime()) < 2000
  );

  if (existingIdx !== -1) {
    mediaLogHistory[existingIdx] = report;
  } else {
    mediaLogHistory.unshift(report);
    if (mediaLogHistory.length > MAX_LOG_ENTRIES) {
      mediaLogHistory.pop();
    }
  }

  logListeners.forEach(listener => {
    try {
      listener(report);
    } catch (e) {
      console.error('Error in media log listener:', e);
    }
  });
}

/**
 * High-visibility logger to trace why a media asset failed to load.
 * Prints structured troubleshooting guidance directly into the browser console
 * with actionable Supabase Dashboard steps.
 */
export function logMediaLoadError(
  url: string, 
  context?: { component?: string; fileName?: string; error?: unknown; element?: HTMLImageElement | null }
) {
  const parsed = parseMediaUrl(url);

  // Grouped console output with high visibility
  const badgeStyle = 'background: #dc2626; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: monospace;';
  const headerStyle = 'color: #dc2626; font-weight: bold; font-size: 13px;';
  const labelStyle = 'color: #64748b; font-weight: bold;';
  const actionStyle = 'color: #059669; font-weight: bold;';

  console.groupCollapsed(
    `%c[Supabase Storage Diagnostic]%c ❌ Media asset failed to load: ${parsed.fileName || url}`,
    badgeStyle,
    headerStyle
  );

  console.log(`%cURL:%c ${url}`, labelStyle, 'color: #0284c7;');
  console.log(`%cComponent:%c ${context?.component || 'Unknown'}`, labelStyle, 'color: #334155;');
  console.log(`%cBucket:%c ${parsed.bucket || 'Unknown'}`, labelStyle, 'color: #334155;');
  console.log(`%cFile Path:%c ${parsed.objectPath || 'Unknown'}`, labelStyle, 'color: #334155;');
  console.log(`%cSupabase Project Ref:%c ${parsed.projectRef || 'None'} (Configured: ${extractProjectRef(parsed.configuredSupabaseUrl) || 'None'})`, labelStyle, 'color: #334155;');
  console.log(`%cEndpoint Type:%c ${parsed.endpointType || 'Non-Supabase URL'}`, labelStyle, 'color: #334155;');

  // Run async probe to output exact status code and dashboard checklist
  diagnoseMediaAsset(url, context).then((report) => {
    console.log(`\n%c🔍 Root Cause Analysis:%c ${report.title}`, 'color: #d97706; font-weight: bold;', 'color: #1e293b; font-weight: 600;');
    console.log(`%cDetails:%c ${report.description}`, labelStyle, 'color: #475569;');
    if (report.statusCode) {
      console.log(`%cHTTP Status:%c ${report.statusCode} ${report.statusText || ''}`, labelStyle, 'color: #dc2626; font-weight: bold;');
    }

    console.log(`\n%c🛠️ Supabase Dashboard Checklist:%c`, actionStyle, '');
    report.remediationSteps.forEach((step, idx) => {
      console.log(`  ${idx + 1}. ${step}`);
    });

    if (report.dashboardChecklist.some(c => c.sqlSnippet)) {
      console.log(`\n%c📄 Quick SQL Fix (Supabase SQL Editor):%c`, 'color: #2563eb; font-weight: bold;', '');
      report.dashboardChecklist.filter(c => c.sqlSnippet).forEach(c => {
        console.log(c.sqlSnippet);
      });
    }

    console.groupEnd();
  }).catch(() => {
    console.groupEnd();
  });
}

/**
 * Log a media asset load attempt (useful for debugging storage access in development)
 */
export function logMediaLoadAttempt(url: string, context?: { component?: string }) {
  if (import.meta.env.DEV) {
    const parsed = parseMediaUrl(url);
    if (parsed.isSupabaseStorage) {
      console.debug(`[Supabase Storage Trace] Loading ${parsed.bucket}/${parsed.fileName} (${url}) from ${context?.component || 'component'}`);
    }
  }
}

/**
 * Subscribe to live media diagnostic reports (for UI diagnostic drawers, devtools, or toast notifications)
 */
export function subscribeToMediaLogs(listener: (report: MediaDiagnosticReport) => void): () => void {
  logListeners.add(listener);
  return () => {
    logListeners.delete(listener);
  };
}

/**
 * Get current diagnostic log history
 */
export function getMediaLogHistory(): MediaDiagnosticReport[] {
  return [...mediaLogHistory];
}

/**
 * Clear diagnostic log history
 */
export function clearMediaLogHistory(): void {
  mediaLogHistory.length = 0;
}
