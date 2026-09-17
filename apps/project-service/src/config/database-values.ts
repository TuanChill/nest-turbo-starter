export const readDatabaseValue = (names: string[], localFallback?: string) => {
  const configured = names.map((name) => process.env[name]?.trim()).find(Boolean);
  if (process.env.NODE_ENV === 'production' && !configured) {
    throw new Error(`Database environment variable ${names[0]} is not configured`);
  }
  return configured ?? localFallback;
};

export const readOptionalDatabaseValue = (name: string, fallback: string) =>
  process.env[name]?.trim() || fallback;
