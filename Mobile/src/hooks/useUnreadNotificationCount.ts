import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { mobileApi } from '../lib/api';
import { useApiCacheRefresh } from './useApiCacheRefresh';

export function useUnreadNotificationCount() {
  const { token } = useAuth();
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setCount(0);
      setError(null);
      return;
    }
    setError(null);
    try {
      const response = await mobileApi.getUnreadNotificationCount(token);
      setCount(response.unreadCount);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load notification count.');
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));
  useApiCacheRefresh('/notifications/unread-count', token ?? undefined, refresh);

  return { count, error, refresh };
}
