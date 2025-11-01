/**
 * useCurrentUser Hook - Get current authenticated user ID
 */

import { useAuth } from './useAuth';

export const useCurrentUser = () => {
  const { user, isAuthenticated } = useAuth();
  
  return {
    userId: user?.id || null,
    user,
    isAuthenticated,
  };
};

