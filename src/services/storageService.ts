/**
 * Supabase Storage Service Layer
 * 
 * Provides unified, logged storage operations with automatic validation,
 * CDN URL checks, public bucket reachability verification, and diagnostic tracing.
 */

import { supabase } from "@/integrations/supabase/client";
import { 
  diagnoseMediaAsset,
  BucketAuditReport,
  getConfiguredSupabaseUrl
} from "./mediaLogger";

export interface StorageUploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

export interface StorageUploadResult {
  data: { path: string; publicUrl: string } | null;
  error: Error | null;
  durationMs: number;
}

/**
 * Storage Service Wrapper with rich logging & diagnostics
 */
export const storageService = {
  /**
   * Get the public URL for a storage file with automatic configuration verification.
   * Logs a warning if the Supabase project URL is not configured or uses a placeholder.
   */
  getPublicUrl(bucket: string, path: string): { publicUrl: string; isConfigured: boolean } {
    const configuredUrl = getConfiguredSupabaseUrl();
    const isPlaceholder = configuredUrl.includes("placeholder-project.supabase.co");

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data.publicUrl;

    if (isPlaceholder) {
      console.warn(
        `[Supabase Storage Service] ⚠️ Generated public URL using placeholder project for ${bucket}/${path}. ` +
        `Please configure VITE_SUPABASE_URL in your environment.`
      );
    } else if (import.meta.env.DEV) {
      console.debug(`[Supabase Storage Service] Generated public URL for ${bucket}/${path}: ${publicUrl}`);
    }

    return {
      publicUrl,
      isConfigured: !isPlaceholder
    };
  },

  /**
   * Upload a file to Supabase Storage with latency tracing and automated error logging.
   */
  async upload(
    bucket: string, 
    path: string, 
    file: File | Blob, 
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    const startTime = performance.now();
    console.info(`[Supabase Storage Service] 📤 Uploading "${path}" (${file.size} bytes) to bucket "${bucket}"...`);

    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: options?.cacheControl || "3600",
        contentType: options?.contentType || (file instanceof File ? file.type : undefined),
        upsert: options?.upsert ?? false,
      });

      const durationMs = Math.round(performance.now() - startTime);

      if (error) {
        console.error(
          `[Supabase Storage Service] ❌ Failed to upload to bucket "${bucket}" (${durationMs}ms):`, 
          error.message,
          { bucket, path, error }
        );

        // Check for common storage upload errors
        if (error.message?.toLowerCase().includes("bucket not found")) {
          console.warn(
            `[Supabase Storage Hint] Bucket "${bucket}" does not exist. ` +
            `Create it in Supabase Dashboard -> Storage -> New Bucket ("${bucket}") -> Enable Public Bucket.`
          );
        } else if (error.message?.toLowerCase().includes("row-level security") || error.message?.toLowerCase().includes("policy")) {
          console.warn(
            `[Supabase Storage Hint] Upload blocked by RLS policies on bucket "${bucket}". ` +
            `Ensure an INSERT policy exists for authenticated/anon users in Supabase Dashboard -> Storage -> Policies.`
          );
        }

        return { data: null, error, durationMs };
      }

      // Generate public URL for the newly uploaded file
      const { publicUrl } = storageService.getPublicUrl(bucket, data.path);
      console.info(`[Supabase Storage Service] ✅ Successfully uploaded "${path}" to "${bucket}" in ${durationMs}ms. URL: ${publicUrl}`);

      return {
        data: { path: data.path, publicUrl },
        error: null,
        durationMs
      };
    } catch (err: unknown) {
      const durationMs = Math.round(performance.now() - startTime);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error(`[Supabase Storage Service] ❌ Unexpected upload error in bucket "${bucket}":`, err);
      return { data: null, error: errorObj, durationMs };
    }
  },

  /**
   * Remove one or more files from Supabase Storage with logging.
   */
  async remove(bucket: string, paths: string[]): Promise<{ success: boolean; error: Error | null }> {
    console.info(`[Supabase Storage Service] 🗑️ Removing ${paths.length} file(s) from bucket "${bucket}"...`, paths);
    try {
      const { error } = await supabase.storage.from(bucket).remove(paths);
      if (error) {
        console.error(`[Supabase Storage Service] ❌ Delete error in bucket "${bucket}":`, error.message);
        return { success: false, error };
      }
      console.info(`[Supabase Storage Service] ✅ Successfully removed ${paths.length} file(s) from "${bucket}".`);
      return { success: true, error: null };
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error(`[Supabase Storage Service] ❌ Delete exception:`, err);
      return { success: false, error: errorObj };
    }
  },

  /**
   * List files in a bucket with logging and folder placeholder filtering.
   */
  async list(
    bucket: string, 
    path: string = "", 
    options?: { limit?: number; offset?: number; sortBy?: { column: string; order: string } }
  ) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(path, options);
      if (error) {
        console.error(`[Supabase Storage Service] ❌ Failed to list files in bucket "${bucket}":`, error.message);
        return { data: [], error };
      }
      return { data: data || [], error: null };
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error(`[Supabase Storage Service] ❌ Exception listing files in "${bucket}":`, err);
      return { data: [], error: errorObj };
    }
  },

  /**
   * Perform an end-to-end audit on a storage bucket:
   * 1. Tests listing capabilities
   * 2. Tests public URL generation
   * 3. Tests public accessibility probe against a sample file (if present)
   * 4. Reports dashboard troubleshooting advice if any issue is detected
   */
  async auditBucket(bucketName: string = "media"): Promise<BucketAuditReport> {
    const configuredUrl = getConfiguredSupabaseUrl();
    const isPlaceholder = configuredUrl.includes("placeholder-project.supabase.co");

    if (isPlaceholder) {
      return {
        bucket: bucketName,
        isConfigured: false,
        isPublic: false,
        canList: false,
        fileCount: 0,
        error: "Supabase URL is set to placeholder.",
        remediation: [
          "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your deployment environment variables.",
          "Obtain credentials from Supabase Dashboard -> Project Settings -> API."
        ],
        dashboardPath: "Project Settings -> API"
      };
    }

    try {
      // 1. Test listing
      const { data: listData, error: listError } = await supabase.storage.from(bucketName).list("", { limit: 10 });
      
      if (listError) {
        const isNotFound = listError.message?.toLowerCase().includes("not found");
        return {
          bucket: bucketName,
          isConfigured: true,
          isPublic: false,
          canList: false,
          fileCount: 0,
          error: listError.message,
          remediation: isNotFound ? [
            `Bucket "${bucketName}" does not exist in Supabase.`,
            `Go to Supabase Dashboard -> Storage -> "New Bucket" -> Name: "${bucketName}".`,
            `Make sure to toggle "Public bucket" ON.`
          ] : [
            `Listing files in "${bucketName}" failed (${listError.message}).`,
            `Check RLS policies under Supabase Dashboard -> Storage -> Policies.`
          ],
          dashboardPath: `Storage -> Buckets -> ${bucketName}`
        };
      }

      const files = (listData || []).filter(f => f.name !== ".emptyFolderPlaceholder");
      let isPublic = true;
      let probeError: string | undefined;

      // 2. If files exist, probe the first file's public URL
      if (files.length > 0) {
        const sampleFile = files[0];
        const { publicUrl } = storageService.getPublicUrl(bucketName, sampleFile.name);
        const diag = await diagnoseMediaAsset(publicUrl, { component: "StorageAudit", fileName: sampleFile.name });

        if (diag.status === "error") {
          isPublic = false;
          probeError = `Public asset check failed (HTTP ${diag.statusCode || 'N/A'}: ${diag.title})`;
        }
      }

      return {
        bucket: bucketName,
        isConfigured: true,
        isPublic,
        canList: true,
        fileCount: files.length,
        error: probeError,
        remediation: isPublic ? undefined : [
          `Bucket "${bucketName}" is marked as private or blocked by RLS policies.`,
          `Go to Supabase Dashboard -> Storage -> Buckets -> "${bucketName}" -> Edit Bucket.`,
          `Toggle "Public bucket" ON and save.`,
          `Ensure an Anonymous SELECT policy is active in Storage Policies.`
        ],
        dashboardPath: `Storage -> Buckets -> ${bucketName}`
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Storage audit failed";
      return {
        bucket: bucketName,
        isConfigured: true,
        isPublic: false,
        canList: false,
        fileCount: 0,
        error: errorMsg,
        remediation: [
          "Check your network connection and Supabase project status in the Supabase Dashboard."
        ],
        dashboardPath: "Storage -> Buckets"
      };
    }
  }
};
