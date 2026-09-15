import type { CycleHistory } from '../../data-access';

export interface CycleBurnupPoint {
  date: string;
  scope: number;
  started: number;
  completed: number;
  ideal: number;
}

export function toCycleBurnupPoint(snapshot: CycleHistory): CycleBurnupPoint {
  return {
    date: snapshot.recordedOn.toISOString().slice(0, 10),
    scope: snapshot.scope,
    started: snapshot.started,
    completed: snapshot.completed,
    ideal: snapshot.ideal,
  };
}

export function calculateIdealProgress(
  startDate: Date,
  endDate: Date,
  recordedOn: Date,
  scope: number,
): number {
  const duration = endDate.getTime() - startDate.getTime();
  if (duration <= 0) return scope;
  const elapsed = recordedOn.getTime() - startDate.getTime();
  const fraction = Math.max(0, Math.min(1, elapsed / duration));
  return Math.round(scope * fraction * 100) / 100;
}

export function mergeCycleBurnup(
  persisted: CycleBurnupPoint[],
  snapshots: CycleBurnupPoint[],
): CycleBurnupPoint[] {
  const byDate = new Map(persisted.map((point) => [point.date, point]));
  for (const point of snapshots) byDate.set(point.date, point);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
