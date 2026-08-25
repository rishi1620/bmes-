import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { handlePostgrestFallback, handleAuthFallback, handleStorageFallback } from './fallbackStore';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SUPABASE_URL = (envUrl && envUrl.startsWith('http')) ? envUrl : "https://placeholder-project.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = envKey || "placeholder-key";

const isPlaceholder = SUPABASE_URL === "https://placeholder-project.supabase.co";

// Cache the client instance to prevent "Lock broken by another request with the 'steal' option."
// during Vite HMR.
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient<Database>> | undefined;
};

const createMockResponse = (input: RequestInfo | URL, init?: RequestInit): Response => {
  const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';
  const headers = new Headers(init?.headers);
  let bodyData: unknown = undefined;
  if (init?.body && typeof init.body === 'string') {
    try {
      bodyData = JSON.parse(init.body);
    } catch {
      bodyData = init.body;
    }
  }

  // Check if it's a REST PostgREST call
  if (urlString.includes('/rest/v1/')) {
    const { status, data } = handlePostgrestFallback(urlString, method, bodyData);
    
    // Check if accept header requests single object
    const accept = headers.get('accept') || headers.get('Accept') || '';
    let responseData = data;
    if (accept.includes('vnd.pgrst.object') && Array.isArray(data)) {
      responseData = data.length > 0 ? data[0] : null;
    }

    const range = Array.isArray(data) ? `0-${Math.max(0, data.length - 1)}/${data.length}` : '*/*';
    return new Response(JSON.stringify(responseData ?? {}), {
      status: responseData === null && accept.includes('vnd.pgrst.object') ? 200 : status,
      headers: {
        'Content-Type': 'application/json',
        'Content-Range': range,
        'Preference-Applied': 'return=representation'
      }
    });
  }

  // Storage fallback
  if (urlString.includes('/storage/v1/')) {
    const { status, data } = handleStorageFallback(urlString, method, bodyData);
    return new Response(
      JSON.stringify(data ?? {}),
      {
        status: status || 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Auth fallback
  if (urlString.includes('/auth/v1/')) {
    const { status, data } = handleAuthFallback(urlString, method, bodyData, headers);
    return new Response(JSON.stringify(data ?? {}), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Generic fallback
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
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
          return createMockResponse(input, init);
        }

        try {
          // Attempt network fetch with a 4s timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          
          const response = await fetch(input, {
            ...init,
            signal: init?.signal || controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            try {
              const clone = response.clone();
              const data = await clone.json();
              const errorDesc = data?.error_description || data?.msg || data?.message || data?.error || "";
              const lowerError = errorDesc.toLowerCase();
              if (
                lowerError.includes("refresh token") ||
                lowerError.includes("invalid_grant") ||
                lowerError.includes("invalid grant") ||
                lowerError.includes("session_not_found") ||
                lowerError.includes("invalid_refresh_token") ||
                lowerError.includes("refresh token not found")
              ) {
                console.warn("Intercepted invalid refresh token error, clearing session:", errorDesc);
                
                const keysToRemove: string[] = [];
                for (let j = 0; j < localStorage.length; j++) {
                  const key = localStorage.key(j);
                  if (key && (key.includes('supabase') || key.includes('sb-'))) {
                    keysToRemove.push(key);
                  }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                sessionStorage.clear();
                
                setTimeout(() => {
                  if (window.location.pathname !== '/auth') {
                    window.location.href = '/auth';
                  }
                }, 100);
              }
            } catch {
              // ignore json parse error
            }

            // If Supabase returns HTTP error on REST, Auth, or Storage (project deleted/paused/rate limited), fallback
            const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            if ((urlString.includes('/rest/v1/') || urlString.includes('/auth/v1/') || urlString.includes('/storage/v1/')) && response.status >= 400) {
              console.warn(`Supabase API response status ${response.status}, serving local fallback data for: ${urlString}`);
              return createMockResponse(input, init);
            }
          }

          return response;
        } catch {
          // Network fetch failed (e.g. Failed to fetch, DNS error, offline, CORS, timeout)
          const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
          console.warn("Supabase network unavailable, serving local fallback data for:", urlString);
          return createMockResponse(input, init);
        }
      },
    },
  });

if (import.meta.env.DEV) {
  globalForSupabase.supabase = supabase;
}
