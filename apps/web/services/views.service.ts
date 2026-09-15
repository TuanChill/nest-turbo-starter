import { apiClient } from './api-client';
import { GroupingKey, OrderingKey, DisplayPropertyKey } from '@/store/display-settings-store';
export type ViewType = 'issue' | 'project';

export interface ViewFilter {
   statusCategories?: string[];
   statusIds?: string[];
   labelIds?: string[];
   priorityIds?: string[];
   hasProject?: boolean;
   unassigned?: boolean;
   assigneeId?: 'me';
   filters?: any[];
   [key: string]: any;
}

export interface View {
   id: string;
   name: string;
   description: string;
   icon: string;
   type: ViewType;
   teamId?: string;
   projectId?: string;
   layout?: 'list' | 'grid';
   owner?: { id: string; name: string; avatarUrl?: string | null };
   createdAt: string;
   updatedAt: string;
   filter: ViewFilter;
}

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

export type CustomView = View & { filter: CustomViewFilter };

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
      projectIdOrFilters?: string | { projectId?: string; teamId?: string; workspaceId?: string },
      maybeTeamId?: string
   ): Promise<View[]> {
      const params = new URLSearchParams();
      if (typeof projectIdOrFilters === 'object' && projectIdOrFilters !== null) {
         if (projectIdOrFilters.projectId) params.set('projectId', projectIdOrFilters.projectId);
         if (projectIdOrFilters.teamId) params.set('teamId', projectIdOrFilters.teamId);
         if (projectIdOrFilters.workspaceId)
            params.set('workspaceId', projectIdOrFilters.workspaceId);
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
      return data as View[];
   },

   async getViewById(id: string): Promise<View> {
      const v = await apiClient<any>(`/circle/api/views/${id}`);
      return v as View;
   },

   async createView(payload: CreateViewPayload): Promise<View> {
      const v = await apiClient<any>('/circle/api/views', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
      return v as View;
   },

   async updateView(id: string, payload: Partial<CreateViewPayload>): Promise<View> {
      const v = await apiClient<any>(`/circle/api/views/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
      return v as View;
   },

   async deleteView(id: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/circle/api/views/${id}`, {
         method: 'DELETE',
      });
   },
};
