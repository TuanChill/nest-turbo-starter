import type { NextRequest } from 'next/server';
import { getCookie, removeCookie, setCookie } from './cookies';

export const ACTIVE_WORKSPACE_COOKIE = 'lastWorkspace';
export const LEGACY_WORKSPACE_COOKIE = 'defaultWorkspace';
export const WORKSPACE_STORAGE_KEY = 'circle_last_workspace';

/**
 * Persists the active workspace slug to cookies (365 days) and localStorage.
 * Used when a user switches, views, creates, or joins a workspace.
 */
export function saveActiveWorkspace(slug: string): void {
   if (!slug || slug === 'undefined' || slug === 'null') return;

   // Save to cookies with 1 year expiration
   setCookie(ACTIVE_WORKSPACE_COOKIE, slug, 365);
   setCookie(LEGACY_WORKSPACE_COOKIE, slug, 365);

   // Also save to localStorage for client-only hydration fallback
   if (typeof window !== 'undefined' && window.localStorage) {
      try {
         localStorage.setItem(WORKSPACE_STORAGE_KEY, slug);
      } catch {
         // Ignore quota/private browsing errors
      }
   }
}

/**
 * Client-side helper to get the active workspace slug.
 * Prioritizes cookies, falls back to localStorage.
 */
export function getActiveWorkspace(): string | null {
   const fromCookie = getCookie(ACTIVE_WORKSPACE_COOKIE) || getCookie(LEGACY_WORKSPACE_COOKIE);
   if (fromCookie && fromCookie !== 'undefined' && fromCookie !== 'null') {
      return fromCookie;
   }

   if (typeof window !== 'undefined' && window.localStorage) {
      try {
         const fromStorage = localStorage.getItem(WORKSPACE_STORAGE_KEY);
         if (fromStorage && fromStorage !== 'undefined' && fromStorage !== 'null') {
            return fromStorage;
         }
      } catch {
         // Ignore
      }
   }

   return null;
}

/**
 * Clears saved workspace cookies and localStorage.
 */
export function clearActiveWorkspace(): void {
   removeCookie(ACTIVE_WORKSPACE_COOKIE);
   removeCookie(LEGACY_WORKSPACE_COOKIE);
   if (typeof window !== 'undefined' && window.localStorage) {
      try {
         localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      } catch {
         // Ignore
      }
   }
}

/**
 * Server-side helper to read the saved workspace from Next.js cookies().
 */
export function getSavedWorkspaceFromCookieStore(cookieStore: {
   get(name: string): { value: string } | undefined;
}): string | null {
   const val =
      cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value ||
      cookieStore.get(LEGACY_WORKSPACE_COOKIE)?.value;
   if (val && val !== 'undefined' && val !== 'null') {
      return decodeURIComponent(val);
   }
   return null;
}

/**
 * Middleware helper to read the saved workspace from NextRequest.
 */
export function getSavedWorkspaceFromRequest(request: NextRequest): string | null {
   const val =
      request.cookies.get(ACTIVE_WORKSPACE_COOKIE)?.value ||
      request.cookies.get(LEGACY_WORKSPACE_COOKIE)?.value;
   if (val && val !== 'undefined' && val !== 'null') {
      return decodeURIComponent(val);
   }
   return null;
}
