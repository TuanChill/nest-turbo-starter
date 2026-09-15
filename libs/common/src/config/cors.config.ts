const PRODUCTION_FRONTEND_ORIGIN = 'https://pm.capylabs.io';
const LOCAL_FRONTEND_ORIGIN = 'http://localhost:3000';
const LOCAL_FRONTEND_ORIGINS = [LOCAL_FRONTEND_ORIGIN, 'http://localhost:3001'];

function normalizeAllowedOrigin(origin: string | undefined) {
  if (!origin) return undefined;
  try {
    const parsed = new URL(origin.trim());
    const isRootOrigin = parsed.pathname === '/' && !parsed.search && !parsed.hash;
    if (!isRootOrigin) return undefined;
    if (parsed.origin === PRODUCTION_FRONTEND_ORIGIN) return PRODUCTION_FRONTEND_ORIGIN;
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      return parsed.origin;
    }
  } catch {
    // Invalid FRONTEND_URL values must never become CORS allow-list entries.
  }
  return undefined;
}

export function getAllowedCorsOrigins(frontendUrl = process.env.FRONTEND_URL) {
  return [
    normalizeAllowedOrigin(frontendUrl),
    PRODUCTION_FRONTEND_ORIGIN,
    ...LOCAL_FRONTEND_ORIGINS,
  ].filter(
    (origin, index, origins): origin is string =>
      Boolean(origin) && origins.indexOf(origin) === index,
  );
}
