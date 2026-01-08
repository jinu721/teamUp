import { useState, useEffect, useCallback } from 'react';
import { Role } from '@/types/workshop';
import api from '@/services/api';
import { useSocketEvent } from './useSocket';

interface UseRolesReturn {
  roles: Role[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addRole: (role: Role) => void;
  updateRole: (role: Role) => void;
  removeRole: (roleId: string) => void;
}

/**
 * Hook for fetching workshop roles with real-time updates
 */
export function useRoles(workshopId: string | undefined): UseRolesReturn {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    if (!workshopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getWorkshopRoles(workshopId);
      setRoles(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const addRole = useCallback((role: Role) => {
    setRoles(prev => {
      if (prev.some(r => r._id === role._id)) return prev;
      return [...prev, role];
    });
  }, []);

  const updateRole = useCallback((updatedRole: Role) => {
    setRoles(prev => prev.map(r =>
      r._id === updatedRole._id ? updatedRole : r
    ));
  }, []);

  const removeRole = useCallback((roleId: string) => {
    setRoles(prev => prev.filter(r => r._id !== roleId));
  }, []);

  // Socket event handlers
  useSocketEvent('role:created', (role: Role) => {
    const roleWorkshopId = typeof role.workshop === 'string'
      ? role.workshop
      : role.workshop._id;
    if (roleWorkshopId === workshopId) {
      addRole(role);
    }
  });

  useSocketEvent('role:updated', (role: Role) => {
    const roleWorkshopId = typeof role.workshop === 'string'
      ? role.workshop
      : role.workshop._id;
    if (roleWorkshopId === workshopId) {
      updateRole(role);
    }
  });

  useSocketEvent('role:deleted', (data: { roleId: string; workshopId: string }) => {
    if (data.workshopId === workshopId) {
      removeRole(data.roleId);
    }
  });

  return {
    roles,
    loading,
    error,
    refetch: fetchRoles,
    addRole,
    updateRole,
    removeRole
  };
}

interface UseRoleReturn {
  role: Role | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setRole: (role: Role | null) => void;
}

/**
 * Hook for fetching a single role
 */
export function useRole(workshopId: string | undefined, roleId: string | undefined): UseRoleReturn {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = useCallback(async () => {
    if (!workshopId || !roleId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getRoleById(workshopId, roleId);
      setRole(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load role');
    } finally {
      setLoading(false);
    }
  }, [workshopId, roleId]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  // Socket event handler
  useSocketEvent('role:updated', (updatedRole: Role) => {
    if (updatedRole._id === roleId) {
      setRole(updatedRole);
    }
  });

  return {
    role,
    loading,
    error,
    refetch: fetchRole,
    setRole
  };
}
