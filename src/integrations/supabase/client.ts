import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if a token string is a syntactically valid 3-part JWT
function isValidJwt(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.trim().split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

// Check whether a valid Supabase project URL is provided
const hasValidUrl = !!(
  envUrl &&
  typeof envUrl === 'string' &&
  envUrl.startsWith('http') &&
  !envUrl.includes('placeholder-project.supabase.co')
);

// Check whether a valid Supabase anon key (3-part JWT) is provided
const hasValidKey = isValidJwt(envKey);

// If either the URL is missing/placeholder or the key is not a valid 3-part JWT, operate in robust local/fallback mode
export const isPlaceholder = !hasValidUrl || !hasValidKey;

// Standard valid 3-part JWT format to ensure PostgREST and Supabase JS never crash on token splitting
const DEMO_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwMTk2MzUyMDB9.demo_signature_token_bmes_portal';

const SUPABASE_URL = hasValidUrl ? envUrl.trim() : 'https://placeholder-project.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = hasValidKey ? (envKey as string).trim() : DEMO_JWT;

if (isPlaceholder) {
  console.info('Supabase running in local fallback mode (mock database enabled).');
}

// In-memory / localStorage mock database store for seamless local operations
const getMockTable = (tableName: string): Record<string, unknown>[] => {
  try {
    const raw = localStorage.getItem(`mock_sb_${tableName}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parsing errors
  }
  return [];
};

const setMockTable = (tableName: string, data: Record<string, unknown>[]) => {
  try {
    localStorage.setItem(`mock_sb_${tableName}`, JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }
};

// Custom fetch handler for placeholder / fallback mode
const handleMockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = (init?.method || 'GET').toUpperCase();
  const headers = new Headers(init?.headers);
  const accept = headers.get('Accept') || '';
  const isSingle = accept.includes('vnd.pgrst.object+json');

  let bodyData: unknown = null;
  if (init?.body && typeof init.body === 'string') {
    try {
      bodyData = JSON.parse(init.body);
    } catch {
      // ignore
    }
  }

  // Handle Supabase Auth Endpoints
  if (urlString.includes('/auth/v1/')) {
    if (urlString.includes('/token') || urlString.includes('/signup') || urlString.includes('/user')) {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000001',
        aud: 'authenticated',
        role: 'authenticated',
        email:
          typeof bodyData === 'object' && bodyData && 'email' in bodyData
            ? String((bodyData as Record<string, unknown>).email)
            : 'admin@cuetbmes.ac.bd',
        phone: '',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {
          full_name:
            typeof bodyData === 'object' &&
            bodyData &&
            'data' in bodyData &&
            typeof (bodyData as Record<string, unknown>).data === 'object'
              ? (bodyData as { data?: { full_name?: string } }).data?.full_name || 'Admin User'
              : 'Admin User',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSession = {
        access_token: DEMO_JWT,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      };

      if (urlString.includes('/user')) {
        return new Response(JSON.stringify(mockUser), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(mockSession), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (urlString.includes('/logout') || urlString.includes('/recover')) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle Storage Endpoints
  if (urlString.includes('/storage/v1/')) {
    if (urlString.includes('/object/list/')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ Key: 'media/demo.png' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle PostgREST REST Endpoints (/rest/v1/<table_name>)
  const restMatch = urlString.match(/\/rest\/v1\/([^?/#]+)/);
  if (restMatch) {
    const tableName = restMatch[1];
    let items = getMockTable(tableName);

    const urlObj = new URL(urlString, 'http://localhost');
    const params = urlObj.searchParams;

    // Filter by columns (e.g., id=eq.xxx, setting_key=eq.xxx, user_id=eq.xxx, etc.)
    params.forEach((val, key) => {
      if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') return;
      if (val.startsWith('eq.')) {
        const targetVal = val.slice(3);
        items = items.filter((item) => String(item[key]) === targetVal);
      } else if (val.startsWith('in.(')) {
        const inVals = val.slice(4, -1).split(',').map((s) => s.trim().replace(/^"(.*)"$/, '$1'));
        items = items.filter((item) => inVals.includes(String(item[key])));
      }
    });

    if (method === 'GET' || method === 'HEAD') {
      const isHead = method === 'HEAD' || headers.get('Range-Unit') === 'items';
      const countHeader = {
        'Content-Type': 'application/json',
        'Content-Range': `0-${Math.max(0, items.length - 1)}/${items.length}`,
      };

      if (isSingle) {
        if (items.length > 0) {
          return new Response(JSON.stringify(items[0]), { status: 200, headers: countHeader });
        }
        return new Response(JSON.stringify(null), { status: 200, headers: countHeader });
      }

      return new Response(isHead ? null : JSON.stringify(items), {
        status: 200,
        headers: countHeader,
      });
    }

    if (method === 'POST') {
      const newItems = Array.isArray(bodyData)
        ? (bodyData as Record<string, unknown>[])
        : [bodyData as Record<string, unknown>];
      const tableData = getMockTable(tableName);

      const inserted = newItems.map((item) => ({
        id: (item && item.id) || crypto.randomUUID(),
        created_at: (item && item.created_at) || new Date().toISOString(),
        ...item,
      }));

      tableData.push(...inserted);
      setMockTable(tableName, tableData);

      if (isSingle) {
        return new Response(JSON.stringify(inserted[0] || null), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(inserted), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PATCH' || method === 'PUT') {
      const tableData = getMockTable(tableName);
      const updatedRows: Record<string, unknown>[] = [];

      const updated = tableData.map((item) => {
        let matches = true;
        params.forEach((val, key) => {
          if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') return;
          if (val.startsWith('eq.') && String(item[key]) !== val.slice(3)) {
            matches = false;
          }
        });

        if (matches && bodyData && typeof bodyData === 'object') {
          const newRow = { ...item, ...bodyData, updated_at: new Date().toISOString() };
          updatedRows.push(newRow);
          return newRow;
        }
        return item;
      });

      setMockTable(tableName, updated);

      if (isSingle) {
        return new Response(JSON.stringify(updatedRows[0] || null), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(updatedRows), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      const tableData = getMockTable(tableName);
      const remaining = tableData.filter((item) => {
        let matches = true;
        params.forEach((val, key) => {
          if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') return;
          if (val.startsWith('eq.') && String(item[key]) !== val.slice(3)) {
            matches = false;
          }
        });
        return !matches;
      });

      setMockTable(tableName, remaining);
      return new Response(null, { status: 204 });
    }
  }

  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Cache the client instance to prevent "Lock broken by another request" during Vite HMR
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
      fetch: isPlaceholder
        ? handleMockFetch
        : async (input, init) => {
            let lastError;
            for (let i = 0; i < 3; i++) {
              try {
                const response = await fetch(input, init);
                if (!response.ok) {
                  try {
                    const clone = response.clone();
                    const data = await clone.json();
                    const errorDesc =
                      data?.error_description || data?.msg || data?.message || data?.error || data?.code || '';
                    const lowerError = String(errorDesc).toLowerCase();

                    // If JWT format error (PGRST301), invalid grant, or corrupted refresh token occurs
                    if (
                      lowerError.includes('pgrst301') ||
                      lowerError.includes('expected 3 parts') ||
                      lowerError.includes('refresh token') ||
                      lowerError.includes('invalid_grant') ||
                      lowerError.includes('invalid grant') ||
                      lowerError.includes('session_not_found') ||
                      lowerError.includes('invalid_refresh_token') ||
                      lowerError.includes('refresh token not found')
                    ) {
                      console.warn('Intercepted Supabase auth/JWT error, clearing invalid storage tokens:', errorDesc);

                      // Clear invalid tokens from localStorage
                      const keysToRemove: string[] = [];
                      for (let j = 0; j < localStorage.length; j++) {
                        const key = localStorage.key(j);
                        if (key && (key.includes('supabase') || key.includes('sb-'))) {
                          keysToRemove.push(key);
                        }
                      }
                      keysToRemove.forEach((key) => localStorage.removeItem(key));
                      sessionStorage.clear();
                    }
                  } catch {
                    // ignore JSON parse errors
                  }
                }
                return response;
              } catch (err) {
                lastError = err;
                await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
              }
            }
            const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            console.error('Supabase network error for URL:', url, 'Error:', lastError);
            throw lastError;
          },
    },
  });

if (import.meta.env.DEV) {
  globalForSupabase.supabase = supabase;
}
