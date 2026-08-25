import { supabase } from "@/integrations/supabase/client";

// Media management and robust fallback utilities

export interface MediaItem {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  alt_text: string | null;
}

export const FALLBACK_IMAGES = {
  general: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
  lab: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80",
  event: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80",
  project: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
  achievement: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
  article: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop&q=80",
};

/**
 * Converts a browser File object to a Base64 data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) || "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

/**
 * Fetches all media files by combining both the Supabase Storage Bucket ('media')
 * and the 'media_library' database table to guarantee every uploaded file is shown.
 */
export async function fetchUnifiedMediaFiles(): Promise<MediaItem[]> {
  const mergedMap = new Map<string, MediaItem>();

  // 1. Fetch from database media_library table
  try {
    const { data: dbData } = await supabase
      .from("media_library")
      .select("*")
      .order("created_at", { ascending: false });

    if (Array.isArray(dbData)) {
      for (const item of dbData) {
        if (item && item.file_name) {
          mergedMap.set(item.file_name, {
            id: String(item.id || item.file_name),
            file_name: item.file_name,
            file_url: item.file_url,
            file_size: item.file_size ? Number(item.file_size) : null,
            file_type: item.file_type || (item.file_name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
            created_at: item.created_at || new Date().toISOString(),
            alt_text: item.alt_text || null,
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not query media_library table:", err);
  }

  // 2. Fetch directly from Supabase Storage 'media' bucket
  try {
    const { data: storageFiles, error: storageError } = await supabase.storage.from("media").list("", {
      limit: 200,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (!storageError && Array.isArray(storageFiles)) {
      for (const file of storageFiles) {
        if (!file.name || file.name === ".emptyFolderPlaceholder") continue;

        const { data: urlData } = supabase.storage.from("media").getPublicUrl(file.name);
        const publicUrl = urlData?.publicUrl || "";

        const existing = mergedMap.get(file.name);
        if (existing) {
          // If existing had an empty or fallback URL, upgrade with the real public URL
          if (!existing.file_url || existing.file_url.includes("placeholder-")) {
            existing.file_url = publicUrl;
          }
        } else {
          // File exists in Storage bucket but wasn't in media_library DB table yet
          const isPdf = file.name.toLowerCase().endsWith(".pdf");
          const isVid = /\.(mp4|webm|mov|avi)$/i.test(file.name);
          mergedMap.set(file.name, {
            id: file.id || file.name,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.metadata?.size ?? null,
            file_type: file.metadata?.mimetype ?? (isPdf ? "application/pdf" : isVid ? "video/mp4" : "image/jpeg"),
            created_at: file.created_at || new Date().toISOString(),
            alt_text: file.name.replace(/^\d+-/, "").replace(/[-_]/g, " "),
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not list files from media storage bucket:", err);
  }

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Validates and normalizes any image URL.
 * Automatically substitutes unreachable Supabase placeholder domains with high-quality themed fallbacks.
 */
export function resolveMediaUrl(
  url?: string | null,
  fallback?: string,
  category: keyof typeof FALLBACK_IMAGES = "general"
): string {
  if (!url || typeof url !== "string") {
    return fallback || FALLBACK_IMAGES[category] || FALLBACK_IMAGES.general;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return fallback || FALLBACK_IMAGES[category] || FALLBACK_IMAGES.general;
  }

  // Base64 Data URLs and Blobs are fully self-contained and valid
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // Check if it's a non-existent / placeholder Supabase domain
  if (
    trimmed.includes("placeholder-project.supabase.co") ||
    trimmed.includes("placeholder-supabase-url") ||
    trimmed.includes("example.com")
  ) {
    // Check if we have a locally cached data URL in localStorage for this filename
    try {
      const fileNameMatch = trimmed.match(/\/([^/?#]+)$/);
      if (fileNameMatch) {
        const stored = localStorage.getItem(`mock_storage_file_${fileNameMatch[1]}`);
        if (stored) return stored;
      }
    } catch {
      // ignore
    }

    return fallback || FALLBACK_IMAGES[category] || FALLBACK_IMAGES.general;
  }

  return trimmed;
}
