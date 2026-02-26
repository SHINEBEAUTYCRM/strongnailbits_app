import { useAuthStore } from '@/stores/auth';

export function useAuth() {
  const { user, profile, isLoading, isAuthenticated } = useAuthStore();

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    isB2B: profile?.is_b2b ?? false,
  };
}
