/**
 * Push notifications are temporarily disabled.
 * expo-notifications was removed to fix startup crash (SIGABRT in TurboModule).
 * TODO: re-add expo-notifications when ready to enable push.
 */

export async function registerForPushNotifications(
  _userId?: string
): Promise<string | null> {
  return null;
}

export function addNotificationResponseListener(
  _callback: (response: unknown) => void
) {
  return { remove: () => {} };
}
