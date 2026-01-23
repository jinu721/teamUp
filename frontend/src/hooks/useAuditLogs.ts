import { useState, useEffect, useCallback } from 'react';
import { AuditLog, AuditLogFilters } from '@/types/workshop';
import api from '@/services/api';

interface UseAuditLogsReturn {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  totalPages: number;
  refetch: () => void;
  loadMore: () => void;
  setFilters: (filters: AuditLogFilters) => void;
}

export function useAuditLogs(
  workshopId: string | undefined,
  initialFilters?: AuditLogFilters,
  pageSize: number = 20
): UseAuditLogsReturn {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFiltersState] = useState<AuditLogFilters>(initialFilters || {});

  const fetchLogs = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!workshopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getWorkshopAuditLogs(workshopId, filters, pageNum, pageSize);

      if (append) {
        setLogs(prev => [...prev, ...response.data]);
      } else {
        setLogs(response.data);
      }

      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [workshopId, filters, pageSize]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1, false);
  }, [fetchLogs]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLogs(nextPage, true);
    }
  }, [page, totalPages, loading, fetchLogs]);

  const setFilters = useCallback((newFilters: AuditLogFilters) => {
    setFiltersState(newFilters);
    setPage(1);
  }, []);

  return {
    logs,
    loading,
    error,
    hasMore: page < totalPages,
    page,
    totalPages,
    refetch: () => fetchLogs(1, false),
    loadMore,
    setFilters
  };
}