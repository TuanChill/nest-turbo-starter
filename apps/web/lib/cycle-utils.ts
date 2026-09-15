import { format, parseISO } from 'date-fns';
import type { Cycle, CycleStatus } from '@/services/cycles.service';

export const cycleStatusLabel: Record<CycleStatus, string> = {
   planned: 'Planned',
   upcoming: 'Upcoming',
   current: 'Current',
   completed: 'Completed',
};

export function formatCycleDateRange(cycle: Pick<Cycle, 'startDate' | 'endDate'>): string {
   return `${format(parseISO(cycle.startDate), 'MMM d')} – ${format(parseISO(cycle.endDate), 'MMM d, yyyy')}`;
}
