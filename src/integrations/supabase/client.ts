// This file provides the configured Supabase client instance.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function cleanEnvString(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

function resolveSupabaseUrl(): string {
  const customLocal = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_URL') || localStorage.getItem('SUPABASE_URL') : '';
  const raw = import.meta.env.VITE_SUPABASE_URL 
    || import.meta.env.SUPABASE_URL 
    || customLocal 
    || '';
  const clean = cleanEnvString(raw);
  if (!clean) return "https://placeholder-project.supabase.co";
  const withProtocol = clean.startsWith('http://') || clean.startsWith('https://') ? clean : `https://${clean}`;
  return withProtocol.replace(/\/+$/, '');
}

function resolveSupabaseKey(): string {
  const customLocal = typeof window !== 'undefined' 
    ? localStorage.getItem('VITE_SUPABASE_PUBLISHABLE_KEY') 
      || localStorage.getItem('VITE_SUPABASE_ANON_KEY')
      || localStorage.getItem('SUPABASE_ANON_KEY')
    : '';
  const raw = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || import.meta.env.VITE_SUPABASE_ANON_KEY
    || import.meta.env.VITE_SUPABASE_KEY
    || import.meta.env.VITE_SUPABASE_API_KEY
    || import.meta.env.SUPABASE_PUBLISHABLE_KEY
    || import.meta.env.SUPABASE_ANON_KEY
    || import.meta.env.SUPABASE_KEY
    || customLocal
    || '';
  const clean = cleanEnvString(raw);
  return clean || "placeholder-key";
}

const SUPABASE_URL = resolveSupabaseUrl();
const SUPABASE_PUBLISHABLE_KEY = resolveSupabaseKey();

export const isPlaceholder = SUPABASE_URL === "https://placeholder-project.supabase.co" || SUPABASE_PUBLISHABLE_KEY === "placeholder-key";

export function isSupabaseConfigured(): boolean {
  return !isPlaceholder && !!SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY !== "placeholder-key";
}

export function getSupabaseConfigStatus(): { configured: boolean; url: string; hasKey: boolean } {
  return {
    configured: isSupabaseConfigured(),
    url: SUPABASE_URL,
    hasKey: SUPABASE_PUBLISHABLE_KEY !== "placeholder-key"
  };
}

export function getSupabaseDiagnosticsDetails() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || "";
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY 
    || import.meta.env.VITE_SUPABASE_ANON_KEY 
    || import.meta.env.VITE_SUPABASE_KEY 
    || import.meta.env.SUPABASE_PUBLISHABLE_KEY 
    || import.meta.env.SUPABASE_ANON_KEY 
    || "";
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_URL') || localStorage.getItem('SUPABASE_URL') || "" : "";
  const localKey = typeof window !== 'undefined' 
    ? localStorage.getItem('VITE_SUPABASE_PUBLISHABLE_KEY') 
      || localStorage.getItem('VITE_SUPABASE_ANON_KEY') 
      || localStorage.getItem('SUPABASE_ANON_KEY') 
      || "" 
    : "";

  const effectiveKey = SUPABASE_PUBLISHABLE_KEY;
  const isKeyJWT = effectiveKey.startsWith('eyJ') && effectiveKey.split('.').length === 3;

  const mask = (str: string) => {
    if (!str || str === "placeholder-key") return "placeholder-key (not set)";
    if (str.length <= 10) return `${str.slice(0, 3)}...${str.slice(-2)}`;
    return `${str.slice(0, 8)}...${str.slice(-6)} (length: ${str.length})`;
  };

  return {
    isPlaceholder,
    isConfigured: isSupabaseConfigured(),
    url: SUPABASE_URL,
    rawEnvUrl: envUrl ? `${envUrl.slice(0, 20)}...` : "(empty)",
    hasEnvUrl: !!envUrl,
    hasEnvKey: !!envKey,
    hasLocalOverride: !!(localUrl || localKey),
    maskedKey: mask(effectiveKey),
    isKeyJWT,
    keyLength: effectiveKey.length,
    rawKeyPreview: mask(effectiveKey),
  };
}

if (isPlaceholder) {
  console.warn("[Supabase] Running with placeholder configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY in your environment.");
} else {
  console.info(`[Supabase] Initialized with endpoint: ${SUPABASE_URL}`);
}

// Cache the client instance to prevent "Lock broken by another request with the 'steal' option."
// during Vite HMR.
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient<Database>> | undefined;
};

export const supabase =
  globalForSupabase.supabase ||
  createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: async (input, init) => {
        if (isPlaceholder) {
          console.warn("[Supabase] Placeholder URL in use. Mocking response for:", input);
          const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
          const isRest = urlString.includes('/rest/v1/');
          return new Response(JSON.stringify(isRest ? [] : {}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        let lastError;
        for (let i = 0; i < 3; i++) {
          try {
            const response = await fetch(input, init);
            if (!response.ok) {
              try {
                const clone = response.clone();
                const data = await clone.json();
                const errorDesc = data?.error_description || data?.msg || data?.message || data?.error || "";
                const lowerError = String(errorDesc).toLowerCase();

                // Storage-specific request diagnostics
                const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
                if (urlStr.includes('/storage/v1/')) {
                  console.warn(
                    `[Supabase Storage Service] HTTP ${response.status} on storage endpoint: ${urlStr}\n` +
                    `Error payload:`, data
                  );
                  if (response.status === 403 || response.status === 401) {
                    console.error(
                      `[Supabase Storage Diagnostic] 🔒 Storage access denied (HTTP ${response.status}). ` +
                      `Possible causes:\n` +
                      `1. Bucket is private instead of public (Dashboard -> Storage -> Buckets -> Edit Bucket -> Make Public).\n` +
                      `2. Missing RLS SELECT/INSERT policy on 'storage.objects' for anon/authenticated users.`
                    );
                  } else if (response.status === 404) {
                    console.error(
                      `[Supabase Storage Diagnostic] 🔍 Storage resource not found (HTTP 404). ` +
                      `Verify that the bucket and object path exist in Supabase Dashboard -> Storage -> Buckets.`
                    );
                  }
                }

                if (
                  lowerError.includes("refresh token") ||
                  lowerError.includes("invalid_grant") ||
                  lowerError.includes("invalid grant") ||
                  lowerError.includes("session_not_found") ||
                  lowerError.includes("invalid_refresh_token") ||
                  lowerError.includes("refresh token not found")
                ) {
                  console.warn("Intercepted invalid refresh token error, clearing session:", errorDesc);
                  
                  // Clear storage
                  const keysToRemove: string[] = [];
                  for (let j = 0; j < localStorage.length; j++) {
                    const key = localStorage.key(j);
                    if (key && (key.includes('supabase') || key.includes('sb-'))) {
                      keysToRemove.push(key);
                    }
                  }
                  keysToRemove.forEach(key => localStorage.removeItem(key));
                  sessionStorage.clear();
                  
                  // Only redirect to /auth if the user is trying to access a protected /admin route
                  setTimeout(() => {
                    if (window.location.pathname.startsWith('/admin')) {
                      window.location.href = '/auth';
                    }
                  }, 100);
                }
              } catch {
                // ignore JSON parse errors
              }
            }
            return response;
          } catch (err) {
            lastError = err;
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
          }
        }
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        console.error("Supabase network error for URL:", url, "Error:", lastError);
        throw lastError;
      },
    },
  });

if (import.meta.env.DEV) {
  globalForSupabase.supabase = supabase;
}