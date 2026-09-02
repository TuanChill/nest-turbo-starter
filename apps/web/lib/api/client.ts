import { getCookie, setCookie, removeCookie } from '@/lib/utils/cookies';

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9080';

export type QueryParamValue =
   | string
   | number
   | boolean
   | (string | number | boolean)[]
   | undefined
   | null;

export interface RequestOptions extends RequestInit {
   params?: Record<string, QueryParamValue>;
   skipAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
   refreshSubscribers.forEach((cb) => cb(token));
   refreshSubscribers = [];
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
   const { params, headers, skipAuth, ...customConfig } = options;

   // Normalize URL: if starts with /circle or /auth, prepend gateway URL
   const basePath = GATEWAY_URL;
   let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

   // If not specified prefix, default to /circle/api
   if (!path.startsWith('/circle') && !path.startsWith('/auth')) {
      path = `/circle/api${path}`;
   }

   let url = `${basePath}${path}`;

   if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
         if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
               searchParams.append(key, value.join(','));
            } else {
               searchParams.append(key, String(value));
            }
         }
      });
      const queryString = searchParams.toString();
      if (queryString) {
         url += `?${queryString}`;
      }
   }

   const token = getCookie('accessToken');

   const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
   };

   if (!skipAuth && token && !requestHeaders['Authorization']) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
   }

   const config: RequestInit = {
      method: customConfig.method || 'GET',
      headers: requestHeaders,
      ...customConfig,
   };

   try {
      let response = await fetch(url, config);

      // Handle 401 & Silent Refresh
      if (
         response.status === 401 &&
         !skipAuth &&
         !url.includes('/auth/api/refresh-token') &&
         !url.includes('/auth/api/login')
      ) {
         const refreshToken = getCookie('refreshToken');
         if (refreshToken) {
            if (!isRefreshing) {
               isRefreshing = true;
               try {
                  const refreshRes = await fetch(`${GATEWAY_URL}/auth/api/refresh-token`, {
                     method: 'POST',
                     headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${refreshToken}`,
                     },
                  });

                  if (refreshRes.ok) {
                     const data = await refreshRes.json();
                     const newAccessToken = data.accessToken || data.token;
                     if (newAccessToken) {
                        setCookie('accessToken', newAccessToken, 7);
                        onRefreshed(newAccessToken);
                     }
                  } else {
                     // Refresh failed -> clear session
                     removeCookie('accessToken');
                     removeCookie('refreshToken');
                     removeCookie('currentUser');
                  }
               } catch (refreshErr) {
                  console.error('Failed to refresh token:', refreshErr);
               } finally {
                  isRefreshing = false;
               }
            }

            // Retry original request with new token
            const newToken = getCookie('accessToken');
            if (newToken) {
               requestHeaders['Authorization'] = `Bearer ${newToken}`;
               response = await fetch(url, { ...config, headers: requestHeaders });
            }
         }

         if (response.status === 401) {
            removeCookie('accessToken');
            removeCookie('refreshToken');
            removeCookie('currentUser');
            if (typeof window !== 'undefined') {
               window.location.href = '/login';
            }
            throw new Error('Session expired. Please log in again.');
         }
      }

      if (!response.ok) {
         const errorBody = await response.text();
         let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
         try {
            const parsed = JSON.parse(errorBody);
            errorMessage = parsed.message || parsed.error || errorMessage;
         } catch {
            // response was not JSON
         }
         throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
         return await response.json();
      }
      return (await response.text()) as unknown as T;
   } catch (error) {
      console.error(`API Error [${config.method} ${url}]:`, error);
      throw error;
   }
}
