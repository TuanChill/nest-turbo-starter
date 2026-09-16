import { apiClient } from './client';
import type { InboxItem } from '@/mock-data/inbox';

export type { InboxItem };
export type Notification = InboxItem;

export interface NotificationPreferences {
   memberId: string;
   channels: {
      desktop: boolean;
      mobile: boolean;
      email: boolean;
      slack: boolean;
   };
   emailFormat: 'digest' | 'immediate';
   categories: {
      comments: boolean;
      mentions: boolean;
      assignments: boolean;
      statusChanges: boolean;
      projectUpdates: boolean;
   };
}

export type NotificationPreferencesPatch = {
   desktop?: boolean;
   mobile?: boolean;
   email?: boolean;
   slack?: boolean;
   emailFormat?: NotificationPreferences['emailFormat'];
   categories?: Partial<NotificationPreferences['categories']>;
};

export async function getInboxNotifications(includeSnoozed = false): Promise<InboxItem[]> {
   const query = includeSnoozed ? '?includeSnoozed=true' : '';
   return apiClient<InboxItem[]>(`/circle/api/inbox${query}`);
}

export const fetchInbox = getInboxNotifications;

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
   return apiClient<NotificationPreferences>('/circle/api/inbox/preferences');
}

export async function updateNotificationPreferences(
   patch: NotificationPreferencesPatch
): Promise<NotificationPreferences> {
   return apiClient<NotificationPreferences>('/circle/api/inbox/preferences', {
      method: 'PATCH',
      body: JSON.stringify(patch),
   });
}

export async function markNotificationAsRead(
   id: string,
   read: boolean = true
): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>(`/circle/api/inbox/${id}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ read }),
   });
}

export async function snoozeNotification(
   id: string,
   until: string | null
): Promise<{ success: boolean; id: string; snoozedUntil: string | null }> {
   return apiClient<{ success: boolean; id: string; snoozedUntil: string | null }>(
      `/circle/api/inbox/${id}/snooze`,
      {
         method: 'PATCH',
         body: JSON.stringify({ until }),
      }
   );
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>('/circle/api/inbox/read-all', {
      method: 'POST',
   });
}

export async function deleteNotification(id: string): Promise<{ success: boolean; id: string }> {
   return apiClient<{ success: boolean; id: string }>(`/circle/api/inbox/${id}`, {
      method: 'DELETE',
   });
}

export async function deleteAllNotifications(): Promise<{
   success: boolean;
   deletedCount: number;
}> {
   return apiClient<{ success: boolean; deletedCount: number }>('/circle/api/inbox', {
      method: 'DELETE',
   });
}

export async function deleteReadNotifications(): Promise<{
   success: boolean;
   deletedCount: number;
}> {
   return apiClient<{ success: boolean; deletedCount: number }>('/circle/api/inbox/read', {
      method: 'DELETE',
   });
}

export async function deleteCompletedIssueNotifications(): Promise<{
   success: boolean;
   deletedCount: number;
}> {
   return apiClient<{ success: boolean; deletedCount: number }>(
      '/circle/api/inbox/completed-issues',
      { method: 'DELETE' }
   );
}
