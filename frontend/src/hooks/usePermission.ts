import { useState, useEffect, useCallback, useRef } from 'react';
import { PermissionResult } from '@/types/workshop';
import api from '@/services/api';
import { useSocketEvent } from './useSocket';

interface PermissionCacheEntry {
  result: PermissionResult;
  timestamp: number;
}

// Global permission cache with TTL
const permissionCache = new Map<string, PermissionCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(
  workshopId: string,
  action: string,
  resource: string,
  context?: { projectId?: string; teamId?: string }
): string {
  return `${workshopId}:${action}:${resource}:${context?.projectId || ''}:${context?.teamId || ''}`;
}

function getCachedPermission(key: string): PermissionResult | null {
  const entry = permissionCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.result;
  }
  if (entry) {
    permissionCache.delete(key);
  }
  return null;
}

function setCachedPermission(key: string, result: PermissionResult): void {
  permissionCache.set(key, { result, timestamp: Date.now() });
}

function invalidateWorkshopCache(workshopId: string): void {
  for (const key of permissionCache.keys()) {
    if (key.startsWith(`${workshopId}:`)) {
      permissionCache.delete(key);
    }
  }
}

interface UsePermissionReturn {
  hasPermission: boolean;
  permissionResult: PermissionResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for checking a specific permission with caching
 */
export function usePermission(
  workshopId: string | undefined,
  action: string,
  resource: string,
  context?: { projectId?: string; teamId?: string }
): UsePermissionReturn {
  const [permissionResult, setPermissionResult] = useState<PermissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = useCallback(async () => {
    if (!workshopId) {
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey(workshopId, action, resource, context);
    const cached = getCachedPermission(cacheKey);

    if (cached) {
      setPermissionResult(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.checkPermission(workshopId, action, resource, context);
      setPermissionResult(response.data);
      setCachedPermission(cacheKey, response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check permission');
      setPermissionResult({ granted: false, reason: 'Error checking permission' });
    } finally {
      setLoading(false);
    }
  }, [workshopId, action, resource, context?.projectId, context?.teamId]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Invalidate cache on permission changes
  useSocketEvent('role:assigned', () => {
    if (workshopId) {
      invalidateWorkshopCache(workshopId);
      checkPermission();
    }
  });

  useSocketEvent('role:revoked', () => {
    if (workshopId) {
      invalidateWorkshopCache(workshopId);
      checkPermission();
    }
  });

  useSocketEvent('role:updated', () => {
    if (workshopId) {
      invalidateWorkshopCache(workshopId);
      checkPermission();
    }
  });

  useSocketEvent('membership:removed', () => {
    if (workshopId) {
      invalidateWorkshopCache(workshopId);
      checkPermission();
    }
  });

  return {
    hasPermission: permissionResult?.granted ?? false,
    permissionResult,
    loading,
    error,
    refetch: checkPermission
  };
}

interface UsePermissionsReturn {
  permissions: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  checkPermission: (action: string, resource: string) => boolean;
  can: (action: string, resource: string) => Promise<boolean>;
  refetch: () => void;
}

/**
 * Hook for checking multiple permissions at once
 */
export function usePermissions(
  workshopId: string | undefined,
  permissionChecks: Array<{ action: string; resource: string }> = [],
  context?: { projectId?: string; teamId?: string }
): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const checksRef = useRef(permissionChecks);

  const fetchPermissions = useCallback(async (forceRefresh = false) => {
    if (!workshopId) {
      setLoading(false);
      return;
    }

    console.log(`🔍 [usePermissions] Fetching permissions for workshop ${workshopId}`, {
      forceRefresh,
      checksCount: checksRef.current.length,
      context
    });

    try {
      setLoading(true);
      setError(null);

      const results: Record<string, boolean> = {};

      // If checks are provided, check them all
      if (checksRef.current.length > 0) {
        await Promise.all(
          checksRef.current.map(async ({ action, resource }) => {
            const cacheKey = getCacheKey(workshopId, action, resource, context);

            // Force bypass cache if forceRefresh is true
            const cached = forceRefresh ? null : getCachedPermission(cacheKey);

            if (cached && !forceRefresh) {
              console.log(`✅ [usePermissions] Using cached permission: ${action}:${resource} = ${cached.granted}`);
              results[`${action}:${resource}`] = cached.granted;
              return;
            }

            try {
              console.log(`🌐 [usePermissions] Fetching permission from API: ${action}:${resource}`);
              const response = await api.checkPermission(workshopId, action, resource, context);
              results[`${action}:${resource}`] = response.data.granted;
              setCachedPermission(cacheKey, response.data);
              console.log(`✅ [usePermissions] Permission fetched: ${action}:${resource} = ${response.data.granted}`);
            } catch {
              console.error(`❌ [usePermissions] Failed to fetch permission: ${action}:${resource}`);
              results[`${action}:${resource}`] = false;
            }
          })
        );
      }

      console.log(`📊 [usePermissions] Final permissions:`, results);
      setPermissions(results);
    } catch (err: any) {
      console.error(`❌ [usePermissions] Error fetching permissions:`, err);
      setError(err.response?.data?.message || 'Failed to check permissions');
    } finally {
      setLoading(false);
    }
  }, [workshopId, context?.projectId, context?.teamId, refreshTrigger]);

  useEffect(() => {
    checksRef.current = permissionChecks;
    fetchPermissions(false);
  }, [fetchPermissions, JSON.stringify(permissionChecks)]);

  const checkPermissionSync = useCallback((action: string, resource: string): boolean => {
    return permissions[`${action}:${resource}`] ?? false;
  }, [permissions]);

  const can = useCallback(async (action: string, resource: string): Promise<boolean> => {
    if (!workshopId) return false;
    const cacheKey = getCacheKey(workshopId, action, resource, context);
    const cached = getCachedPermission(cacheKey);
    if (cached) return cached.granted;

    try {
      const response = await api.checkPermission(workshopId, action, resource, context);
      setCachedPermission(cacheKey, response.data);
      return response.data.granted;
    } catch {
      return false;
    }
  }, [workshopId, context?.projectId, context?.teamId]);

  // Invalidate cache and refetch on all relevant events
  const handleEvent = useCallback((data?: any) => {
    console.log('🔄 [usePermissions] Permission event received, invalidating cache and refetching...', {
      event: data,
      workshopId,
      currentPermissions: permissions
    });

    if (workshopId) {
      // Aggressively clear the cache
      invalidateWorkshopCache(workshopId);

      // Force a complete refresh by incrementing trigger
      setRefreshTrigger(prev => prev + 1);

      // Immediately fetch with force refresh flag
      fetchPermissions(true);
    }
  }, [workshopId, fetchPermissions, permissions]);

  useSocketEvent('role:assigned', handleEvent);
  useSocketEvent('role:revoked', handleEvent);
  useSocketEvent('role:updated', handleEvent);
  useSocketEvent('membership:removed', handleEvent);
  useSocketEvent('membership:joined', handleEvent);
  useSocketEvent('membership:request:approved', handleEvent);
  useSocketEvent('workshop:manager:assigned', handleEvent);
  useSocketEvent('workshop:manager:removed', handleEvent);

  return {
    permissions,
    loading,
    error,
    checkPermission: checkPermissionSync,
    can,
    refetch: fetchPermissions
  };
}

/**
 * Utility to clear all cached permissions (useful on logout)
 */
export function clearPermissionCache(): void {
  permissionCache.clear();
}
