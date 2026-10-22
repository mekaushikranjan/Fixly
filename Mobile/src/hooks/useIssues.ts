import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { mobileApi, MobileIssue } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useApiCacheRefresh } from './useApiCacheRefresh';

export function useIssues() {
  const { token } = useAuth();
  const [issues, setIssues] = useState<MobileIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setIssues([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setIssues((await mobileApi.getIssues(token)).issues);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load issues.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));
  useApiCacheRefresh('/issues', token ?? undefined, refresh);

  return { issues, loading, error, refresh };
}
