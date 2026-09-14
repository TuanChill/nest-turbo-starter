const DEFAULT_SITE_URL = 'http://localhost:3001';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

export const SITE_HOST = (() => {
   try {
      return new URL(SITE_URL).host;
   } catch {
      return SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
   }
})();
