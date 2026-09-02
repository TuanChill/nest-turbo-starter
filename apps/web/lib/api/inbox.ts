import { apiClient } from './client';
import type { InboxItem } from '@/mock-data/inbox';

export type { InboxItem };
export type Notification = InboxItem;

export async function getInboxNotifications(): Promise<InboxItem[]> {
   return apiClient<InboxItem[]>('/circle/api/inbox');
}

export const fetchInbox = getInboxNotifications;

export async function markNotificationAsRead(
   id: string,
   read: boolean = true
): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>(`/circle/api/inbox/${id}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ read }),
   });
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>('/circle/api/inbox/read-all', {
      method: 'POST',
   });
}

export async function deleteNotification(id: string): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>(`/circle/api/inbox/${id}`, {
      method: 'DELETE',
   });
}
