const PRODUCTION_FRONTEND_ORIGIN = 'https://pm.capylabs.io';
const LOCAL_FRONTEND_ORIGIN = 'http://localhost:3000';

export function getAllowedCorsOrigins(frontendUrl = process.env.FRONTEND_URL) {
  return [frontendUrl, PRODUCTION_FRONTEND_ORIGIN, LOCAL_FRONTEND_ORIGIN].filter(
    (origin, index, origins): origin is string =>
      Boolean(origin) && origins.indexOf(origin) === index,
  );
}
