import type { InboxItem, NotificationType } from '@/mock-data/inbox';
import {
   deleteAllNotifications as apiDeleteAllNotifications,
   deleteCompletedIssueNotifications as apiDeleteCompletedIssueNotifications,
   deleteNotification as apiDeleteNotification,
   deleteReadNotifications as apiDeleteReadNotifications,
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
   markAsRead: (id: string) => Promise<void>;
   markAllAsRead: () => Promise<void>;
   markAsUnread: (id: string) => Promise<void>;
   deleteNotification: (id: string) => Promise<void>;
   deleteAllNotifications: () => Promise<void>;
   deleteReadNotifications: () => Promise<void>;
   deleteCompletedIssueNotifications: () => Promise<void>;

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

   markAsRead: async (id: string) => {
      const previous = get().notifications;
      const previousSelected = get().selectedNotification;
      set((state) => ({
         notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
         ),
         selectedNotification:
            state.selectedNotification?.id === id
               ? { ...state.selectedNotification, read: true }
               : state.selectedNotification,
         error: null,
      }));

      try {
         await apiMarkNotificationAsRead(id);
      } catch (err) {
         set({
            notifications: previous,
            selectedNotification: previousSelected,
            error: err instanceof Error ? err.message : 'Could not update notification',
         });
      }
   },

   markAllAsRead: async () => {
      const previous = get().notifications;
      const previousSelected = get().selectedNotification;
      set((state) => ({
         notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
         })),
         selectedNotification: state.selectedNotification
            ? { ...state.selectedNotification, read: true }
            : undefined,
         error: null,
      }));

      try {
         await apiMarkAllNotificationsAsRead();
      } catch (err) {
         set({
            notifications: previous,
            selectedNotification: previousSelected,
            error: err instanceof Error ? err.message : 'Could not update notifications',
         });
      }
   },

   markAsUnread: async (id: string) => {
      const previous = get().notifications;
      const previousSelected = get().selectedNotification;
      set((state) => ({
         notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: false } : notification
         ),
         selectedNotification:
            state.selectedNotification?.id === id
               ? { ...state.selectedNotification, read: false }
               : state.selectedNotification,
         error: null,
      }));

      try {
         await apiMarkNotificationAsRead(id, false);
      } catch (err) {
         set({
            notifications: previous,
            selectedNotification: previousSelected,
            error: err instanceof Error ? err.message : 'Could not update notification',
         });
      }
   },

   deleteNotification: async (id: string) => {
      const previous = get().notifications;
      const previousSelected = get().selectedNotification;
      set((state) => ({
         notifications: state.notifications.filter((notification) => notification.id !== id),
         selectedNotification:
            state.selectedNotification?.id === id ? undefined : state.selectedNotification,
      }));
      try {
         await apiDeleteNotification(id);
      } catch (err) {
         set({ notifications: previous, selectedNotification: previousSelected });
         throw err;
      }
   },

   deleteAllNotifications: async () => {
      const previous = get().notifications;
      const previousSelected = get().selectedNotification;
      set({ notifications: [], selectedNotification: undefined });
      try {
         await apiDeleteAllNotifications();
      } catch (err) {
         set({ notifications: previous, selectedNotification: previousSelected });
         throw err;
      }
   },

   deleteReadNotifications: async () => {
      const previous = get().notifications;
      const previousSelected = get().selectedNotification;
      set((state) => {
         const notifications = state.notifications.filter((notification) => !notification.read);
         const selectedNotification = state.selectedNotification?.read
            ? undefined
            : state.selectedNotification;
         return { notifications, selectedNotification };
      });
      try {
         await apiDeleteReadNotifications();
      } catch (err) {
         set({ notifications: previous, selectedNotification: previousSelected });
         throw err;
      }
   },

   deleteCompletedIssueNotifications: async () => {
      const previous = get().notifications;
      const previousSelected = get().selectedNotification;
      const isCompleted = (notification: InboxItem) =>
         notification.status?.category === 'completed';
      set((state) => {
         const notifications = state.notifications.filter(
            (notification) => !isCompleted(notification)
         );
         const selectedNotification =
            state.selectedNotification && isCompleted(state.selectedNotification)
               ? undefined
               : state.selectedNotification;
         return { notifications, selectedNotification };
      });
      try {
         await apiDeleteCompletedIssueNotifications();
      } catch (err) {
         set({ notifications: previous, selectedNotification: previousSelected });
         throw err;
      }
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
      return get().notifications.filter((notification) => notification.user?.id === userId);
   },

   // Utility functions
   getNotificationById: (id: string) => {
      return get().notifications.find((notification) => notification.id === id);
   },

   getUnreadCount: () => {
      return get().notifications.filter((notification) => !notification.read).length;
   },
}));
