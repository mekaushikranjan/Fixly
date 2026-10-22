import { useEffect } from 'react';
import { subscribeToApiCache } from '../lib/api';

export function useApiCacheRefresh(
  path: string,
  token: string | undefined,
  refresh: () => void | Promise<void>,
): void {
  useEffect(() => {
    if (!token && path !== '/app/config') return undefined;
    return subscribeToApiCache(path, token, () => {
      void refresh();
    });
  }, [path, refresh, token]);
}
