export function allocateCycleNumber(
  existingNumbers: number[],
  requestedNumber: number | undefined,
): number {
  const currentMax = Math.max(0, ...existingNumbers.filter(Number.isFinite));
  const requested = Number.isFinite(requestedNumber) ? Number(requestedNumber) : 0;
  return Math.max(currentMax + 1, requested);
}

/** IDs are globally keyed, so a client-provided legacy numeric ID must not be reused. */
export function allocateCycleId(
  requestedId: string | undefined,
  requestedIdExists: boolean,
  generatedId: string,
): string {
  const normalized = requestedId?.trim();
  return normalized && !requestedIdExists ? normalized : generatedId;
}
