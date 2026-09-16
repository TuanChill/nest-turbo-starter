const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (process.env.NODE_ENV === 'production' && !configuredApiUrl) {
   throw new Error('NEXT_PUBLIC_API_URL must be configured for production builds');
}

if (configuredApiUrl) {
   let parsedApiUrl: URL;
   try {
      parsedApiUrl = new URL(configuredApiUrl);
   } catch {
      throw new Error('NEXT_PUBLIC_API_URL must be an absolute HTTP(S) URL');
   }
   if (!['http:', 'https:'].includes(parsedApiUrl.protocol)) {
      throw new Error('NEXT_PUBLIC_API_URL must use HTTP or HTTPS');
   }
}

export const API_BASE_URL = (configuredApiUrl ?? 'http://localhost:9080').replace(/\/$/, '');
