import type { InboxItem, NotificationType } from '@/mock-data/inbox';
import {
   fetchInbox as apiFetchInbox,
   markAllNotificationsAsRead as apiMarkAllNotificationsAsRead,
   markNotificationAsRead as apiMarkNotificationAsRead,
} from '@/lib/api/inbox';
import { create } from 'zustand';

interface NotificationsState {
   // Data
   notifications: InboxItem[];
   selectedNotification: InboxItem | undefined;
   isLoading: boolean;
   isInitialized: boolean;
   error: string | null;

   // Actions
   initNotifications: () => Promise<void>;
   setSelectedNotification: (notification: InboxItem | undefined) => void;
   markAsRead: (id: string) => void;
   markAllAsRead: () => void;
   markAsUnread: (id: string) => void;

   // Filters
   getUnreadNotifications: () => InboxItem[];
   getReadNotifications: () => InboxItem[];
   getNotificationsByType: (type: NotificationType) => InboxItem[];
   getNotificationsByUser: (userId: string) => InboxItem[];

   // Utility functions
   getNotificationById: (id: string) => InboxItem | undefined;
   getUnreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
   // Initial state
   notifications: [],
   selectedNotification: undefined,
   isLoading: false,
   isInitialized: false,
   error: null,

   initNotifications: async () => {
      try {
         set({ isLoading: true, error: null });
         const fetched = await apiFetchInbox();
         set({
            notifications: fetched ?? [],
            isInitialized: true,
            isLoading: false,
         });
      } catch (err) {
         // Surface the failure instead of substituting mock data: an inbox that
         // silently shows fake notifications is worse than an empty one.
         set({
            notifications: [],
            isInitialized: true,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Could not load notifications',
         });
      }
   },

   // Actions
   setSelectedNotification: (notification: InboxItem | undefined) => {
      set({ selectedNotification: notification });
   },

   markAsRead: (id: string) => {
      set((state) => ({
         notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
         ),
         selectedNotification:
            state.selectedNotification?.id === id
               ? { ...state.selectedNotification, read: true }
               : state.selectedNotification,
      }));

      apiMarkNotificationAsRead(id).catch((err) =>
         console.error(`Failed to mark notification ${id} as read:`, err)
      );
   },

   markAllAsRead: () => {
      set((state) => ({
         notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
         })),
         selectedNotification: state.selectedNotification
            ? { ...state.selectedNotification, read: true }
            : undefined,
      }));

      apiMarkAllNotificationsAsRead().catch((err) =>
         console.error('Failed to mark all notifications as read:', err)
      );
   },

   markAsUnread: (id: string) => {
      set((state) => ({
         notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: false } : notification
         ),
         selectedNotification:
            state.selectedNotification?.id === id
               ? { ...state.selectedNotification, read: false }
               : state.selectedNotification,
      }));

      apiMarkNotificationAsRead(id, false).catch((err) =>
         console.error(`Failed to mark notification ${id} as unread:`, err)
      );
   },

   // Filters
   getUnreadNotifications: () => {
      return get().notifications.filter((notification) => !notification.read);
   },

   getReadNotifications: () => {
      return get().notifications.filter((notification) => notification.read);
   },

   getNotificationsByType: (type: NotificationType) => {
      return get().notifications.filter((notification) => notification.type === type);
   },

   getNotificationsByUser: (userId: string) => {
      return get().notifications.filter((notification) => notification.user.id === userId);
   },

   // Utility functions
   getNotificationById: (id: string) => {
      return get().notifications.find((notification) => notification.id === id);
   },

   getUnreadCount: () => {
      return get().notifications.filter((notification) => !notification.read).length;
   },
}));
