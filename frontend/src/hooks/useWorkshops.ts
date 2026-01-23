import { useState, useEffect, useCallback } from 'react';
import { Workshop } from '@/types/workshop';
import api from '@/services/api';
import socket from '@/services/socket';
import { useSocketEvent } from './useSocket';

interface UseWorkshopsReturn {
  workshops: Workshop[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addWorkshop: (workshop: Workshop) => void;
  updateWorkshop: (workshop: Workshop) => void;
  removeWorkshop: (workshopId: string) => void;
}

export function useWorkshops(): UseWorkshopsReturn {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkshops = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getWorkshops();
      setWorkshops(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load workshops');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  const addWorkshop = useCallback((workshop: Workshop) => {
    setWorkshops(prev => {
      if (prev.some(w => w._id === workshop._id)) return prev;
      return [workshop, ...prev];
    });
  }, []);

  const updateWorkshop = useCallback((updatedWorkshop: Workshop) => {
    setWorkshops(prev => prev.map(w =>
      w._id === updatedWorkshop._id ? updatedWorkshop : w
    ));
  }, []);

  const removeWorkshop = useCallback((workshopId: string) => {
    setWorkshops(prev => prev.filter(w => w._id !== workshopId));
  }, []);

  useSocketEvent('workshop:created', (workshop: Workshop) => {
    addWorkshop(workshop);
  });

  useSocketEvent('workshop:updated', (workshop: Workshop) => {
    updateWorkshop(workshop);
  });

  useSocketEvent('workshop:deleted', (data: { workshopId: string }) => {
    removeWorkshop(data.workshopId);
  });

  return {
    workshops,
    loading,
    error,
    refetch: fetchWorkshops,
    addWorkshop,
    updateWorkshop,
    removeWorkshop
  };
}

interface UseWorkshopReturn {
  workshop: Workshop | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setWorkshop: (workshop: Workshop | null) => void;
}

export function useWorkshop(workshopId: string | undefined): UseWorkshopReturn {
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkshop = useCallback(async () => {
    if (!workshopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getWorkshopById(workshopId);
      setWorkshop(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load workshop');
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    fetchWorkshop();
  }, [fetchWorkshop]);

  useEffect(() => {
    if (workshopId) {
      socket.joinWorkshop(workshopId);
      return () => {
        socket.leaveWorkshop(workshopId);
      };
    }
  }, [workshopId]);

  useSocketEvent('workshop:updated', (updatedWorkshop: Workshop) => {
    if (updatedWorkshop._id === workshopId) {
      setWorkshop(updatedWorkshop);
    }
  });

  return {
    workshop,
    loading,
    error,
    refetch: fetchWorkshop,
    setWorkshop
  };
}

export function useWorkshopRoom(workshopId: string | undefined) {
  useEffect(() => {
    if (workshopId) {
      socket.joinWorkshop(workshopId);
      return () => {
        socket.leaveWorkshop(workshopId);
      };
    }
  }, [workshopId]);
}