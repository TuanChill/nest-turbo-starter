import type { Issue } from '@/mock-data/issues';
import type { Priority } from '@/mock-data/priorities';
import type { Project } from '@/mock-data/projects';
import type { Status } from '@/mock-data/status';
import type { User } from '@/mock-data/users';
import {
   deleteIssue as apiDeleteIssue,
   fetchIssues as apiFetchIssues,
   IssueFilterParams,
   updateIssue as apiUpdateIssue,
   UpdateIssuePayload,
} from '@/lib/api/issues';
import { issueKeys } from '@/hooks/queries/keys';
import { getQueryClient } from '@/providers/query-provider';
import { groupIssuesByStatus } from '@/lib/issue-grouping';
import { create } from 'zustand';

interface FilterOptions {
   status?: string[];
   assignee?: string[];
   priority?: string[];
   labels?: string[];
   project?: string[];
   cycle?: string[];
   statusType?: string[];
}

interface IssuesState {
   // Data
   issues: Issue[];
   issuesByStatus: Record<string, Issue[]>;
   isLoading: boolean;
   isInitialized: boolean;
   error: string | null;

   //
   getAllIssues: () => Issue[];
   initIssues: (params?: IssueFilterParams) => Promise<void>;

   // Actions
   addIssue: (issue: Issue) => Promise<void>;
   updateIssue: (id: string, updatedIssue: Partial<Issue>) => Promise<void>;
   deleteIssue: (id: string) => Promise<void>;

   // Filters
   filterByStatus: (statusId: string) => Issue[];
   filterByPriority: (priorityId: string) => Issue[];
   filterByAssignee: (userId: string | null) => Issue[];
   filterByLabel: (labelId: string) => Issue[];
   filterByProject: (projectId: string) => Issue[];
   filterByCycle: (cycleId: string) => Issue[];
   searchIssues: (query: string) => Issue[];
   filterIssues: (filters: FilterOptions) => Issue[];

   // Status management
   updateIssueStatus: (issueId: string, newStatus: Status) => void;

   // Priority management
   updateIssuePriority: (issueId: string, newPriority: Priority) => void;

   // Assignee management
   updateIssueAssignee: (issueId: string, newAssignee: User | null) => void;

   // Project management
   updateIssueProject: (issueId: string, newProject: Project | undefined) => void;

   // Utility functions
   getIssueById: (id: string) => Issue | undefined;
}

export const useIssuesStore = create<IssuesState>((set, get) => ({
   issues: [],
   issuesByStatus: {},
   isLoading: false,
   isInitialized: false,
   error: null,

   //
   getAllIssues: () => get().issues,

   initIssues: async (params?: IssueFilterParams) => {
      try {
         set({ isLoading: true });
         const fetchedIssues = await apiFetchIssues(params);
         const list = fetchedIssues ?? [];
         const sorted = list.sort((a, b) => b.rank.localeCompare(a.rank));
         set({
            issues: sorted,
            issuesByStatus: groupIssuesByStatus(sorted),
            isInitialized: true,
            isLoading: false,
            error: null,
         });
      } catch (err) {
         console.error('Could not fetch issues from API:', err);
         set({
            isInitialized: true,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Could not load issues',
         });
      }
   },

   // Actions with Optimistic Updates
   addIssue: async (issue: Issue) => {
      // Local optimistic UI update only. Callers are responsible for persisting
      // the issue to the backend themselves (e.g. via useCreateIssue) before
      // calling this — see create-new-issue/index.tsx.
      set((state) => {
         const newIssues = [issue, ...state.issues];
         return {
            issues: newIssues,
            issuesByStatus: groupIssuesByStatus(newIssues),
         };
      });
   },

   updateIssue: async (id: string, updatedIssue: Partial<Issue>) => {
      // 1. Optimistic update
      const previousIssues = get().issues;
      const targetIssue = previousIssues.find((i) => i.id === id || i.identifier === id);
      const identifier = targetIssue?.identifier || id;

      set((state) => {
         const newIssues = state.issues.map((issue) =>
            issue.id === id || issue.identifier === id ? { ...issue, ...updatedIssue } : issue
         );

         return {
            issues: newIssues,
            issuesByStatus: groupIssuesByStatus(newIssues),
         };
      });

      // 2. Async API Sync
      try {
         const payload: UpdateIssuePayload = {};
         if (updatedIssue.title !== undefined) payload.title = updatedIssue.title;
         if (updatedIssue.description !== undefined) payload.description = updatedIssue.description;
         if (updatedIssue.status !== undefined) {
            payload.statusId = updatedIssue.status.id;
            payload.statusCategory = updatedIssue.status.category;
         }
         if (updatedIssue.priority !== undefined) payload.priorityId = updatedIssue.priority.id;
         if (updatedIssue.assignee !== undefined)
            payload.assigneeId = updatedIssue.assignee?.id ?? null;
         if (updatedIssue.cycleId !== undefined) payload.cycleId = updatedIssue.cycleId;
         if (updatedIssue.project !== undefined) payload.projectId = updatedIssue.project?.id;
         if (updatedIssue.labels !== undefined)
            payload.labelIds = updatedIssue.labels.map((l) => l.id);
         if (updatedIssue.rank !== undefined) payload.rank = updatedIssue.rank;
         if (updatedIssue.dueDate !== undefined) payload.dueDate = updatedIssue.dueDate;

         await apiUpdateIssue(identifier, payload);
         // Board/list views read from the React Query cache (useIssues()), not this
         // store directly, so it must be invalidated or they'd keep showing stale data.
         getQueryClient().invalidateQueries({ queryKey: issueKeys.lists() });
      } catch (err) {
         console.error(`Failed to update issue ${identifier} on API:`, err);
      }
   },

   deleteIssue: async (id: string) => {
      const targetIssue = get().issues.find((i) => i.id === id || i.identifier === id);
      const identifier = targetIssue?.identifier || id;

      set((state) => {
         const newIssues = state.issues.filter(
            (issue) => issue.id !== id && issue.identifier !== id
         );
         return {
            issues: newIssues,
            issuesByStatus: groupIssuesByStatus(newIssues),
         };
      });

      try {
         await apiDeleteIssue(identifier);
         getQueryClient().invalidateQueries({ queryKey: issueKeys.lists() });
      } catch (err) {
         console.error(`Failed to delete issue ${identifier} on API:`, err);
      }
   },

   // Filters
   filterByStatus: (statusId: string) => {
      return get().issues.filter((issue) => issue.status.id === statusId);
   },

   filterByPriority: (priorityId: string) => {
      return get().issues.filter((issue) => issue.priority.id === priorityId);
   },

   filterByAssignee: (userId: string | null) => {
      if (userId === null) {
         return get().issues.filter((issue) => issue.assignee === null);
      }
      return get().issues.filter((issue) => issue.assignee?.id === userId);
   },

   filterByLabel: (labelId: string) => {
      return get().issues.filter((issue) => issue.labels.some((label) => label.id === labelId));
   },

   filterByProject: (projectId: string) => {
      return get().issues.filter((issue) => issue.project?.id === projectId);
   },

   filterByCycle: (cycleId: string) => {
      return get().issues.filter((issue) => issue.cycleId === cycleId);
   },

   searchIssues: (query: string) => {
      const lowerCaseQuery = query.toLowerCase();
      return get().issues.filter(
         (issue) =>
            issue.title.toLowerCase().includes(lowerCaseQuery) ||
            issue.identifier.toLowerCase().includes(lowerCaseQuery)
      );
   },

   filterIssues: (filters: FilterOptions) => {
      let filteredIssues = get().issues;

      // Filter by status
      if (filters.status && filters.status.length > 0) {
         filteredIssues = filteredIssues.filter((issue) =>
            filters.status!.includes(issue.status.id)
         );
      }

      // Filter by assignee
      if (filters.assignee && filters.assignee.length > 0) {
         filteredIssues = filteredIssues.filter((issue) => {
            if (filters.assignee!.includes('unassigned')) {
               if (issue.assignee === null) {
                  return true;
               }
            }
            return issue.assignee && filters.assignee!.includes(issue.assignee.id);
         });
      }

      // Filter by priority
      if (filters.priority && filters.priority.length > 0) {
         filteredIssues = filteredIssues.filter((issue) =>
            filters.priority!.includes(issue.priority.id)
         );
      }

      // Filter by labels
      if (filters.labels && filters.labels.length > 0) {
         filteredIssues = filteredIssues.filter((issue) =>
            issue.labels.some((label) => filters.labels!.includes(label.id))
         );
      }

      // Filter by project
      if (filters.project && filters.project.length > 0) {
         filteredIssues = filteredIssues.filter(
            (issue) => issue.project && filters.project!.includes(issue.project.id)
         );
      }

      // Filter by cycle
      if (filters.cycle && filters.cycle.length > 0) {
         filteredIssues = filteredIssues.filter((issue) => {
            if (filters.cycle!.includes('no-cycle') && issue.cycleId === '') {
               return true;
            }
            return filters.cycle!.includes(issue.cycleId);
         });
      }

      // Filter by status type (status category)
      if (filters.statusType && filters.statusType.length > 0) {
         filteredIssues = filteredIssues.filter((issue) =>
            filters.statusType!.includes(issue.status.category)
         );
      }

      return filteredIssues;
   },

   // Status management
   updateIssueStatus: (issueId: string, newStatus: Status) => {
      get().updateIssue(issueId, { status: newStatus });
   },

   // Priority management
   updateIssuePriority: (issueId: string, newPriority: Priority) => {
      get().updateIssue(issueId, { priority: newPriority });
   },

   // Assignee management
   updateIssueAssignee: (issueId: string, newAssignee: User | null) => {
      get().updateIssue(issueId, { assignee: newAssignee });
   },

   // Project management
   updateIssueProject: (issueId: string, newProject: Project | undefined) => {
      get().updateIssue(issueId, { project: newProject });
   },

   // Utility functions
   getIssueById: (id: string) => {
      return get().issues.find((issue) => issue.id === id || issue.identifier === id);
   },
}));
