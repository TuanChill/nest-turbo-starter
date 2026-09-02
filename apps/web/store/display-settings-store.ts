import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type GroupingKey = 'status' | 'assignee' | 'priority' | 'project' | 'none';
export type OrderingKey = 'priority' | 'created' | 'title';
export type CompletedIssuesFilter = 'all' | 'none';

export type DisplayPropertyKey =
   | 'id'
   | 'status'
   | 'priority'
   | 'assignee'
   | 'labels'
   | 'project'
   | 'dueDate'
   | 'milestone'
   | 'links'
   | 'timeInStatus'
   | 'cycle'
   | 'created'
   | 'updated';

export const DISPLAY_PROPERTIES: { key: DisplayPropertyKey; label: string }[] = [
   { key: 'id', label: 'ID' },
   { key: 'status', label: 'Status' },
   { key: 'assignee', label: 'Assignee' },
   { key: 'priority', label: 'Priority' },
   { key: 'project', label: 'Project' },
   { key: 'cycle', label: 'Cycle' },
   { key: 'dueDate', label: 'Due date' },
   { key: 'milestone', label: 'Milestone' },
   { key: 'labels', label: 'Labels' },
   { key: 'links', label: 'Links' },
   { key: 'timeInStatus', label: 'Time in status' },
   { key: 'created', label: 'Created' },
   { key: 'updated', label: 'Updated' },
];

const DEFAULT_DISPLAY_PROPERTIES: Record<DisplayPropertyKey, boolean> = {
   id: true,
   status: true,
   priority: true,
   assignee: true,
   labels: true,
   project: true,
   dueDate: false,
   milestone: false,
   links: false,
   timeInStatus: false,
   cycle: false,
   created: true,
   updated: false,
};

interface DisplaySettingsState {
   grouping: GroupingKey;
   ordering: OrderingKey;
   sortDirection: 'asc' | 'desc';
   orderCompletedByRecency: boolean;
   completedIssues: CompletedIssuesFilter;
   showSubIssues: boolean;
   nestedSubIssues: boolean;
   showEmptyGroups: boolean;
   showEmptyColumns: boolean;
   displayProperties: Record<DisplayPropertyKey, boolean>;

   setGrouping: (grouping: GroupingKey) => void;
   setOrdering: (ordering: OrderingKey) => void;
   setSortDirection: (direction: 'asc' | 'desc') => void;
   toggleSortDirection: () => void;
   setOrderCompletedByRecency: (value: boolean) => void;
   setCompletedIssues: (value: CompletedIssuesFilter) => void;
   setShowSubIssues: (value: boolean) => void;
   setNestedSubIssues: (value: boolean) => void;
   setShowEmptyGroups: (value: boolean) => void;
   setShowEmptyColumns: (value: boolean) => void;
   toggleDisplayProperty: (key: DisplayPropertyKey) => void;
   setDisplaySettings: (settings: Partial<DisplaySettingsState>) => void;
   resetDisplaySettings: () => void;
}

const DEFAULTS = {
   grouping: 'status' as GroupingKey,
   ordering: 'priority' as OrderingKey,
   sortDirection: 'asc' as 'asc' | 'desc',
   orderCompletedByRecency: false,
   completedIssues: 'all' as CompletedIssuesFilter,
   showSubIssues: true,
   nestedSubIssues: false,
   showEmptyGroups: false,
   showEmptyColumns: false,
   displayProperties: DEFAULT_DISPLAY_PROPERTIES,
};

/**
 * View display settings (Linear's "Display" popover): grouping, ordering,
 * completed-issue visibility and per-row display properties.
 * Persisted to localStorage.
 */
export const useDisplaySettingsStore = create<DisplaySettingsState>()(
   persist(
      (set) => ({
         ...DEFAULTS,

         setGrouping: (grouping) => set({ grouping }),
         setOrdering: (ordering) => set({ ordering }),
         setSortDirection: (sortDirection) => set({ sortDirection }),
         toggleSortDirection: () =>
            set((state) => ({
               sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
            })),
         setOrderCompletedByRecency: (orderCompletedByRecency) => set({ orderCompletedByRecency }),
         setCompletedIssues: (completedIssues) => set({ completedIssues }),
         setShowSubIssues: (showSubIssues) => set({ showSubIssues }),
         setNestedSubIssues: (nestedSubIssues) => set({ nestedSubIssues }),
         setShowEmptyGroups: (showEmptyGroups) => set({ showEmptyGroups }),
         setShowEmptyColumns: (showEmptyColumns) => set({ showEmptyColumns }),
         setDisplaySettings: (settings) => set((state) => ({ ...state, ...settings })),
         toggleDisplayProperty: (key) =>
            set((state) => ({
               displayProperties: {
                  ...state.displayProperties,
                  [key]: !state.displayProperties[key],
               },
            })),
         resetDisplaySettings: () => set({ ...DEFAULTS }),
      }),
      {
         name: 'display-settings',
         storage: createJSONStorage(() => localStorage),
      }
   )
);
