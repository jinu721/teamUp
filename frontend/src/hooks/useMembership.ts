import { useState, useEffect, useCallback } from 'react';
import { Membership, MembershipState } from '@/types/workshop';
import api from '@/services/api';
import { useSocketEvent } from './useSocket';

interface UseMembershipsReturn {
  members: Membership[];
  pendingRequests: Membership[];
  activeMembers: Membership[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching workshop memberships with real-time updates
 */
export function useMemberships(workshopId: string | undefined): UseMembershipsReturn {
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!workshopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getWorkshopMembers(workshopId);
      setMembers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Socket event handlers
  useSocketEvent('membership:invited', (membership: Membership) => {
    if (typeof membership.workshop === 'string'
      ? membership.workshop === workshopId
      : membership.workshop._id === workshopId) {
      setMembers(prev => {
        if (prev.some(m => m._id === membership._id)) return prev;
        return [...prev, membership];
      });
    }
  });

  useSocketEvent('membership:joined', (membership: Membership) => {
    const memberWorkshopId = typeof membership.workshop === 'string'
      ? membership.workshop
      : membership.workshop._id;
    if (memberWorkshopId === workshopId) {
      setMembers(prev => prev.map(m =>
        m._id === membership._id ? membership : m
      ));
    }
  });

  useSocketEvent('membership:request:created', (membership: Membership) => {
    const memberWorkshopId = typeof membership.workshop === 'string'
      ? membership.workshop
      : membership.workshop._id;
    if (memberWorkshopId === workshopId) {
      setMembers(prev => {
        // Prevent duplicates
        if (prev.some(m => m._id === membership._id)) {
          return prev;
        }
        return [...prev, membership];
      });
    }
  });

  useSocketEvent('membership:request:approved', (membership: Membership) => {
    const memberWorkshopId = typeof membership.workshop === 'string'
      ? membership.workshop
      : membership.workshop._id;
    if (memberWorkshopId === workshopId) {
      setMembers(prev => prev.map(m =>
        m._id === membership._id ? membership : m
      ));
    }
  });

  useSocketEvent('membership:request:rejected', (data: { membershipId: string }) => {
    setMembers(prev => prev.filter(m => m._id !== data.membershipId));
  });

  useSocketEvent('membership:left', (data: { membershipId: string }) => {
    setMembers(prev => prev.filter(m => m._id !== data.membershipId));
  });

  useSocketEvent('membership:removed', (data: { membershipId: string }) => {
    setMembers(prev => prev.filter(m => m._id !== data.membershipId));
  });

  useSocketEvent('role:assigned', () => {
    fetchMembers();
  });

  useSocketEvent('role:revoked', () => {
    fetchMembers();
  });

  // Computed values
  const pendingRequests = members.filter(m => m.state === MembershipState.PENDING);
  const activeMembers = members.filter(m => m.state === MembershipState.ACTIVE);

  return {
    members,
    pendingRequests,
    activeMembers,
    loading,
    error,
    refetch: fetchMembers
  };
}

interface UseUserMembershipReturn {
  membership: Membership | null;
  isOwner: boolean;
  isManager: boolean;
  isMember: boolean;
  isPending: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for getting current user's membership status in a workshop
 */
export function useUserMembership(
  workshopId: string | undefined,
  userId: string | undefined
): UseUserMembershipReturn {
  const { members, loading, error } = useMemberships(workshopId);

  const membership = members.find(m => {
    const memberId = typeof m.user === 'string' ? m.user : m.user._id;
    return memberId === userId;
  }) || null;

  const isOwner = false; // This would need workshop data to determine
  const isManager = false; // This would need workshop data to determine
  const isMember = membership?.state === MembershipState.ACTIVE;
  const isPending = membership?.state === MembershipState.PENDING;

  return {
    membership,
    isOwner,
    isManager,
    isMember,
    isPending,
    loading,
    error
  };
}
