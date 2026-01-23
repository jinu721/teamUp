import { useState, useEffect, useCallback } from 'react';
import { Team } from '@/types/workshop';
import api from '@/services/api';
import socket from '@/services/socket';
import { useSocketEvent } from './useSocket';

interface UseTeamsReturn {
  teams: Team[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  removeTeam: (teamId: string) => void;
}

export function useTeams(workshopId: string | undefined): UseTeamsReturn {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!workshopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getWorkshopTeams(workshopId);
      setTeams(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const addTeam = useCallback((team: Team) => {
    setTeams(prev => {
      if (prev.some(t => t._id === team._id)) return prev;
      return [...prev, team];
    });
  }, []);

  const updateTeam = useCallback((updatedTeam: Team) => {
    setTeams(prev => prev.map(t =>
      t._id === updatedTeam._id ? updatedTeam : t
    ));
  }, []);

  const removeTeam = useCallback((teamId: string) => {
    setTeams(prev => prev.filter(t => t._id !== teamId));
  }, []);

  useSocketEvent('workshop:team:created', (team: Team) => {
    const teamWorkshopId = typeof team.workshop === 'string'
      ? team.workshop
      : team.workshop._id;
    if (teamWorkshopId === workshopId) {
      addTeam(team);
    }
  });

  useSocketEvent('workshop:team:updated', (team: Team) => {
    const teamWorkshopId = typeof team.workshop === 'string'
      ? team.workshop
      : team.workshop._id;
    if (teamWorkshopId === workshopId) {
      updateTeam(team);
    }
  });

  useSocketEvent('workshop:team:deleted', (data: { teamId: string; workshopId: string }) => {
    if (data.workshopId === workshopId) {
      removeTeam(data.teamId);
    }
  });

  useSocketEvent('workshop:team:member:added', (team: Team) => {
    const teamWorkshopId = typeof team.workshop === 'string'
      ? team.workshop
      : team.workshop._id;
    if (teamWorkshopId === workshopId) {
      updateTeam(team);
    }
  });

  useSocketEvent('workshop:team:member:removed', (team: Team) => {
    const teamWorkshopId = typeof team.workshop === 'string'
      ? team.workshop
      : team.workshop._id;
    if (teamWorkshopId === workshopId) {
      updateTeam(team);
    }
  });

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
    addTeam,
    updateTeam,
    removeTeam
  };
}

interface UseTeamReturn {
  team: Team | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setTeam: (team: Team | null) => void;
}

export function useTeam(workshopId: string | undefined, teamId: string | undefined): UseTeamReturn {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!workshopId || !teamId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getTeamById(workshopId, teamId);
      setTeam(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [workshopId, teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    if (teamId) {
      socket.joinTeam(teamId);
      return () => {
        socket.leaveTeam(teamId);
      };
    }
  }, [workshopId, teamId]);

  useSocketEvent('workshop:team:updated', (updatedTeam: Team) => {
    if (updatedTeam._id === teamId) {
      setTeam(updatedTeam);
    }
  });

  useSocketEvent('workshop:team:member:added', (updatedTeam: Team) => {
    if (updatedTeam._id === teamId) {
      setTeam(updatedTeam);
    }
  });

  useSocketEvent('workshop:team:member:removed', (updatedTeam: Team) => {
    if (updatedTeam._id === teamId) {
      setTeam(updatedTeam);
    }
  });

  useSocketEvent('workshop:team:role:assigned', (updatedTeam: Team) => {
    if (updatedTeam._id === teamId) {
      setTeam(updatedTeam);
    }
  });

  useSocketEvent('workshop:team:role:removed', (updatedTeam: Team) => {
    if (updatedTeam._id === teamId) {
      setTeam(updatedTeam);
    }
  });

  return {
    team,
    loading,
    error,
    refetch: fetchTeam,
    setTeam
  };
}

export function useTeamRoom(workshopId: string | undefined, teamId: string | undefined) {
  useEffect(() => {
    if (workshopId && teamId) {
      socket.joinTeam(teamId);
      return () => {
        socket.leaveTeam(teamId);
      };
    }
  }, [workshopId, teamId]);
}