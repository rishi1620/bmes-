/**
 * Supabase Media & Storage Diagnostic Logger Service
 * 
 * Provides:
 * 1. Storage bucket policy verification and public access validation
 * 2. fetchMedia wrapper to inspect and log 403 Forbidden, 404 Not Found, and broken links
 * 3. Diagnostic reports and status mapping for broken assets
 */

import { supabase } from "@/integrations/supabase/client";

export type MediaErrorType = 
  | '403_FORBIDDEN'
  | '404_NOT_FOUND'
  | '401_UNAUTHORIZED'
  | '500_SERVER_ERROR'
  | 'CORS_OR_NETWORK_ERROR'
  | 'INVALID_URL'
  | 'TIMEOUT';

export interface MediaFetchResult {
  url: string;
  ok: boolean;
  status: number | null;
  statusText: string;
  errorType?: MediaErrorType;
  errorTitle?: string;
  errorMessage?: string;
  remediation?: string;
  contentType?: string | null;
  contentLength?: number | null;
  durationMs: number;
  timestamp: string;
}

export interface BucketPolicyVerification {
  bucket: string;
  isConfigured: boolean;
  isPublic: boolean;
  canList: boolean;
  canRead: boolean;
  statusCode?: number;
  status: 'healthy' | 'restricted' | 'missing' | 'error';
  message: string;
  remediationSteps: string[];
  timestamp: string;
}

// In-memory cache for media URL probe results to prevent duplicate network calls
const mediaCache = new Map<string, MediaFetchResult>();
const subscribers = new Set<(result: MediaFetchResult) => void>();

/**
 * Helper to get current Supabase URL from environment
 */
export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (url && typeof url === 'string' && url.startsWith('http')) {
    return url.replace(/\/+$/, '');
  }
  return 'https://placeholder-project.supabase.co';
}

/**
 * Verifies Supabase storage bucket policies, listing access, and public read permissions.
 * 
 * @param bucketName Name of the storage bucket (e.g. 'media' or 'resources')
 * @returns BucketPolicyVerification summary
 */
export async function verifyStorageBucketPolicies(bucketName: string = 'media'): Promise<BucketPolicyVerification> {
  const timestamp = new Date().toISOString();
  const configuredUrl = getSupabaseUrl();
  const isPlaceholder = configuredUrl.includes('placeholder-project.supabase.co');

  if (isPlaceholder) {
    return {
      bucket: bucketName,
      isConfigured: false,
      isPublic: false,
      canList: false,
      canRead: false,
      status: 'error',
      message: 'VITE_SUPABASE_URL is currently using placeholder credentials.',
      remediationSteps: [
        'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file or project settings.'
      ],
      timestamp
    };
  }

  try {
    // 1. Test listing permission (RLS storage.objects SELECT / list permissions)
    const { data: listData, error: listError } = await supabase.storage.from(bucketName).list('', {
      limit: 5,
      offset: 0
    });

    const canList = !listError;
    let canRead = false;
    let publicCheckStatus: number | null = null;

    // 2. Test public object access using public URL
    const probeFileName = listData && listData.length > 0 && listData[0].name 
      ? listData[0].name 
      : `_probe_test_${Date.now()}.png`;

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(probeFileName);
    const publicUrl = urlData?.publicUrl;

    if (publicUrl) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        
        // Attempt HEAD or GET probe
        const probeRes = await fetch(publicUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Range': 'bytes=0-0' }
        });
        clearTimeout(timer);

        publicCheckStatus = probeRes.status;
        
        // 200, 206, or 404 (if probe file doesn't exist, 404 still indicates public route is active)
        if (probeRes.status === 200 || probeRes.status === 206) {
          canRead = true;
        } else if (probeRes.status === 404 && (!listData || listData.length === 0)) {
          // Empty bucket: 404 means the public endpoint is reachable but file doesn't exist
          canRead = true;
        } else if (probeRes.status === 403 || probeRes.status === 401) {
          canRead = false;
        }
      } catch (probeErr: unknown) {
        console.warn(`[MediaLogger] Bucket "${bucketName}" public probe check encountered an issue:`, probeErr);
      }
    }

    // Determine status & remediation
    const remediationSteps: string[] = [];
    let status: BucketPolicyVerification['status'] = 'healthy';
    let message = `Storage bucket "${bucketName}" is active and public read access is enabled.`;

    if (!canList && !canRead) {
      status = 'restricted';
      message = `Storage bucket "${bucketName}" blocked public access (HTTP ${publicCheckStatus || '403'}).`;
      remediationSteps.push(
        `Open Supabase Dashboard -> Storage -> Buckets -> "${bucketName}" -> Click three dots -> Edit Bucket -> Enable "Public bucket".`,
        `Open Supabase Dashboard -> Storage -> Policies -> Ensure SELECT policy on "storage.objects" is granted for role "anon".`
      );
    } else if (!canRead && publicCheckStatus === 403) {
      status = 'restricted';
      message = `Bucket "${bucketName}" is marked private or storage.objects RLS policy denies anonymous reads (403 Forbidden).`;
      remediationSteps.push(
        `Ensure "Public bucket" is toggled ON under Storage -> Buckets -> ${bucketName}.`,
        `Add RLS policy: CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO anon USING (bucket_id = '${bucketName}');`
      );
    } else if (listError && listError.message?.toLowerCase().includes('not found')) {
      status = 'missing';
      message = `Bucket "${bucketName}" was not found in your Supabase project.`;
      remediationSteps.push(
        `Go to Supabase Dashboard -> Storage -> Create bucket named "${bucketName}" and enable "Public bucket".`
      );
    }

    const verification: BucketPolicyVerification = {
      bucket: bucketName,
      isConfigured: true,
      isPublic: canRead,
      canList,
      canRead,
      statusCode: publicCheckStatus ?? (canRead ? 200 : 403),
      status,
      message,
      remediationSteps,
      timestamp
    };

    console.info(`[MediaLogger] Bucket Policy Verification for "${bucketName}":`, verification);
    return verification;

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown bucket verification error';
    return {
      bucket: bucketName,
      isConfigured: true,
      isPublic: false,
      canList: false,
      canRead: false,
      status: 'error',
      message: `Failed to verify bucket "${bucketName}": ${errorMsg}`,
      remediationSteps: [
        'Check network connectivity and verify your Supabase API credentials in project settings.'
      ],
      timestamp
    };
  }
}

/**
 * Fetch wrapper for media URLs that intercepts, logs, and classifies potential 403 or 404 errors.
 * 
 * @param url The media or image URL to retrieve or probe
 * @param options Optional timeout and cache flags
 * @returns MediaFetchResult with error categorization and remediation advice
 */
export async function fetchMedia(
  url: string, 
  options: { timeoutMs?: number; skipCache?: boolean; context?: string } = {}
): Promise<MediaFetchResult> {
  const { timeoutMs = 5000, skipCache = false, context = 'fetchMedia' } = options;
  const startTime = performance.now();
  const timestamp = new Date().toISOString();

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    const res: MediaFetchResult = {
      url: url || '',
      ok: false,
      status: null,
      statusText: 'Invalid or missing URL',
      errorType: 'INVALID_URL',
      errorTitle: 'Invalid Media URL',
      errorMessage: 'The provided media URL is empty or is not a valid HTTP/HTTPS address.',
      durationMs: 0,
      timestamp
    };
    return res;
  }

  // Return cached result if fresh
  if (!skipCache && mediaCache.has(url)) {
    return mediaCache.get(url)!;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        // Request single byte range for images/media to reduce network overhead if supported
        'Range': 'bytes=0-0'
      }
    });

    clearTimeout(timer);
    const durationMs = Math.round(performance.now() - startTime);
    const contentType = response.headers.get('content-type');
    const contentLengthStr = response.headers.get('content-length');
    const contentLength = contentLengthStr ? parseInt(contentLengthStr, 10) : null;

    let result: MediaFetchResult;

    if (response.ok || response.status === 206) {
      result = {
        url,
        ok: true,
        status: response.status,
        statusText: response.statusText || 'OK',
        contentType,
        contentLength,
        durationMs,
        timestamp
      };
    } else if (response.status === 403) {
      result = {
        url,
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        errorType: '403_FORBIDDEN',
        errorTitle: '403 Forbidden (Public Access Denied)',
        errorMessage: `Access to "${url}" is forbidden. The Supabase storage bucket is private or RLS SELECT policies are missing on storage.objects.`,
        remediation: 'Go to Supabase Dashboard -> Storage -> Edit Bucket -> enable "Public bucket", or add a SELECT policy for the "anon" role.',
        durationMs,
        timestamp
      };

      console.warn(
        `%c[MediaLogger] ⛔ 403 Forbidden [${context}]: %c${url}\n%cCause: Storage bucket is private or missing public read RLS policy.\nFix: Supabase Dashboard -> Storage -> Make bucket public & check storage.objects policies.`,
        'background: #dc2626; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
        'color: #f87171; font-family: monospace;',
        'color: #9ca3af;'
      );
    } else if (response.status === 404) {
      result = {
        url,
        ok: false,
        status: 404,
        statusText: 'Not Found',
        errorType: '404_NOT_FOUND',
        errorTitle: '404 Not Found (Missing Asset)',
        errorMessage: `The file at "${url}" was not found in Supabase Storage. It may have been deleted, renamed, or the path is incorrect.`,
        remediation: 'Verify the file exists in the Supabase Storage bucket or upload a replacement file.',
        durationMs,
        timestamp
      };

      console.warn(
        `%c[MediaLogger] ⚠️ 404 Not Found [${context}]: %c${url}\n%cCause: Object does not exist in storage bucket or file path was modified.`,
        'background: #d97706; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
        'color: #fbbf24; font-family: monospace;',
        'color: #9ca3af;'
      );
    } else if (response.status === 401) {
      result = {
        url,
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        errorType: '401_UNAUTHORIZED',
        errorTitle: '401 Unauthorized (Authentication Required)',
        errorMessage: `Authentication or a signed token is required to view "${url}".`,
        remediation: 'Use a signed URL (createSignedUrl) or make the storage bucket public.',
        durationMs,
        timestamp
      };

      console.warn(`[MediaLogger] 🔒 401 Unauthorized for media: ${url}`);
    } else {
      result = {
        url,
        ok: false,
        status: response.status,
        statusText: response.statusText || `HTTP ${response.status}`,
        errorType: response.status >= 500 ? '500_SERVER_ERROR' : 'INVALID_URL',
        errorTitle: `HTTP ${response.status} Error`,
        errorMessage: `Failed to load media (HTTP ${response.status} ${response.statusText}).`,
        remediation: 'Check Supabase status or verify the storage URL configuration.',
        durationMs,
        timestamp
      };
    }

    mediaCache.set(url, result);
    notifySubscribers(result);
    return result;

  } catch (err: unknown) {
    clearTimeout(timer);
    const durationMs = Math.round(performance.now() - startTime);
    const errorObj = err as { name?: string; message?: string } | null;

    let errorType: MediaErrorType = 'CORS_OR_NETWORK_ERROR';
    let errorTitle = 'Network / CORS Error';
    let errorMessage = 'Failed to connect to media host or CORS blocked the request.';

    if (errorObj?.name === 'AbortError') {
      errorType = 'TIMEOUT';
      errorTitle = 'Request Timed Out';
      errorMessage = `Media request timed out after ${timeoutMs}ms.`;
    }

    const result: MediaFetchResult = {
      url,
      ok: false,
      status: null,
      statusText: errorMessage,
      errorType,
      errorTitle,
      errorMessage,
      remediation: 'Check your internet connection, custom domain CDN settings, or Supabase CORS configuration.',
      durationMs,
      timestamp
    };

    console.warn(
      `%c[MediaLogger] 🌐 ${errorTitle} [${context}]: %c${url}\n%c${errorMessage}`,
      'background: #4b5563; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
      'color: #9ca3af; font-family: monospace;',
      'color: #6b7280;'
    );

    mediaCache.set(url, result);
    notifySubscribers(result);
    return result;
  }
}

/**
 * Batch probe/fetch multiple media URLs in parallel with concurrency control
 */
export async function batchFetchMedia(
  urls: string[], 
  options?: { concurrency?: number; skipCache?: boolean }
): Promise<Map<string, MediaFetchResult>> {
  const concurrency = options?.concurrency || 6;
  const results = new Map<string, MediaFetchResult>();
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));

  const chunks: string[][] = [];
  for (let i = 0; i < uniqueUrls.length; i += concurrency) {
    chunks.push(uniqueUrls.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(url => fetchMedia(url, { skipCache: options?.skipCache, context: 'batchFetchMedia' }))
    );
    chunkResults.forEach(res => results.set(res.url, res));
  }

  return results;
}

/**
 * Subscribe to media fetch events
 */
export function subscribeToMediaFetch(callback: (result: MediaFetchResult) => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function notifySubscribers(result: MediaFetchResult) {
  subscribers.forEach(cb => {
    try {
      cb(result);
    } catch (e) {
      console.error('[MediaLogger] Subscriber error:', e);
    }
  });
}

/**
 * Get all cached media status reports
 */
export function getCachedMediaResults(): Map<string, MediaFetchResult> {
  return new Map(mediaCache);
}

/**
 * Clear the media verification cache
 */
export function clearMediaCache() {
  mediaCache.clear();
}
