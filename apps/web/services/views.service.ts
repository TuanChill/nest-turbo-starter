import { apiClient } from './api-client';
import { GroupingKey, OrderingKey, DisplayPropertyKey } from '@/store/display-settings-store';
import type { User } from '@/mock-data/users';
import { View, ViewFilter } from '@/mock-data/views';

export type { View, ViewFilter };

/** Used when a view has no owner on record — never attribute it to a real or mock user. */
const UNKNOWN_OWNER: User = {
   id: 'unknown',
   name: 'Unknown',
   avatarUrl: '',
   email: '',
   status: 'offline',
   role: 'Member',
   joinedDate: '',
   teamIds: [],
   timezone: 'UTC',
};

export interface CustomViewFilter extends ViewFilter {
   filters?: any[];
   grouping?: GroupingKey;
   ordering?: OrderingKey;
   orderCompletedByRecency?: boolean;
   completedIssues?: 'all' | 'none';
   showSubIssues?: boolean;
   nestedSubIssues?: boolean;
   showEmptyGroups?: boolean;
   showEmptyColumns?: boolean;
   displayProperties?: Partial<Record<DisplayPropertyKey, boolean>>;
}

export interface CustomView {
   id: string;
   name: string;
   description?: string;
   icon?: string;
   type?: 'issue' | 'project';
   teamId?: string | null;
   projectId?: string | null;
   layout?: 'list' | 'grid';
   owner?: User;
   createdAt?: string;
   updatedAt?: string;
   filter?: CustomViewFilter;
}

export interface CreateViewPayload {
   id?: string;
   name: string;
   description?: string;
   icon?: string;
   type?: 'issue' | 'project';
   teamId?: string;
   projectId?: string;
   layout?: 'list' | 'grid';
   filter?: CustomViewFilter | ViewFilter | any;
}

export const viewsService = {
   async getViews(
      projectIdOrFilters?: string | { projectId?: string; teamId?: string },
      maybeTeamId?: string
   ): Promise<View[]> {
      const params = new URLSearchParams();
      if (typeof projectIdOrFilters === 'object' && projectIdOrFilters !== null) {
         if (projectIdOrFilters.projectId) params.set('projectId', projectIdOrFilters.projectId);
         if (projectIdOrFilters.teamId) params.set('teamId', projectIdOrFilters.teamId);
      } else if (typeof projectIdOrFilters === 'string') {
         if (maybeTeamId) {
            params.set('projectId', projectIdOrFilters);
            params.set('teamId', maybeTeamId);
         } else {
            if (projectIdOrFilters.includes('-') && projectIdOrFilters.length > 10) {
               params.set('projectId', projectIdOrFilters);
            } else {
               params.set('teamId', projectIdOrFilters);
            }
         }
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await apiClient<any[]>(`/circle/api/views${qs}`);
      return data.map((v) => ({
         ...v,
         owner: v.owner || UNKNOWN_OWNER,
         description: v.description || '',
         createdAt: v.createdAt || new Date().toISOString(),
         updatedAt: v.updatedAt || new Date().toISOString(),
         filter: v.filter || {},
      }));
   },

   async getViewById(id: string): Promise<View> {
      const v = await apiClient<any>(`/circle/api/views/${id}`);
      return {
         ...v,
         owner: v.owner || UNKNOWN_OWNER,
         description: v.description || '',
         createdAt: v.createdAt || new Date().toISOString(),
         updatedAt: v.updatedAt || new Date().toISOString(),
         filter: v.filter || {},
      };
   },

   async createView(payload: CreateViewPayload): Promise<View> {
      const v = await apiClient<any>('/circle/api/views', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
      return {
         ...v,
         owner: v.owner || UNKNOWN_OWNER,
         description: v.description || '',
         createdAt: v.createdAt || new Date().toISOString(),
         updatedAt: v.updatedAt || new Date().toISOString(),
         filter: v.filter || {},
      };
   },

   async updateView(id: string, payload: Partial<CreateViewPayload>): Promise<View> {
      const v = await apiClient<any>(`/circle/api/views/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
      return {
         ...v,
         owner: v.owner || UNKNOWN_OWNER,
         description: v.description || '',
         createdAt: v.createdAt || new Date().toISOString(),
         updatedAt: v.updatedAt || new Date().toISOString(),
         filter: v.filter || {},
      };
   },

   async deleteView(id: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/circle/api/views/${id}`, {
         method: 'DELETE',
      });
   },
};
