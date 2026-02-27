// Notifications disabled — expo-notifications removed
export function useNotifications() {
  return {
    notifications: [],
    isLoading: false,
    unreadCount: 0,
    markAsRead: async (_id: string) => {},
    markAllAsRead: async () => {},
  };
}
