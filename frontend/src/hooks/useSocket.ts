import { useEffect, useCallback, useRef, useState } from 'react';
import socketService from '@/services/socket';
import { useToast } from '@/hooks/use-toast';

type EventCallback = (data: any) => void;

export function useSocketEvent(event: string, callback: EventCallback) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler: EventCallback = (data) => {
      callbackRef.current(data);
    };

    socketService.on(event, handler);

    return () => {
      socketService.off(event, handler);
    };
  }, [event]);
}

export function useSocketEvents(events: Record<string, EventCallback>) {
  useEffect(() => {
    const handlers: Array<{ event: string; handler: EventCallback }> = [];

    Object.entries(events).forEach(([event, callback]) => {
      const handler: EventCallback = (data) => callback(data);
      socketService.on(event, handler);
      handlers.push({ event, handler });
    });

    return () => {
      handlers.forEach(({ event, handler }) => {
        socketService.off(event, handler);
      });
    };
  }, []);
}

export function useProjectRoom(projectId: string | undefined) {
  useEffect(() => {
    if (projectId) {
      socketService.joinProject(projectId);
      return () => {
        socketService.leaveProject(projectId);
      };
    }
  }, [projectId]);
}

export function useWorkshopRoom(workshopId: string | undefined) {
  useEffect(() => {
    if (workshopId) {
      socketService.joinWorkshop(workshopId);
      return () => {
        socketService.leaveWorkshop(workshopId);
      };
    }
  }, [workshopId]);
}

export function useTeamRoom(teamId: string | undefined) {
  useEffect(() => {
    if (teamId) {
      socketService.joinTeam(teamId);
      return () => {
        socketService.leaveTeam(teamId);
      };
    }
  }, [teamId]);
}

export function useCommunityRoom() {
  useEffect(() => {
    socketService.joinCommunity();
    return () => {
      socketService.leaveCommunity();
    };
  }, []);
}

export function useTypingIndicator(projectId: string) {
  const startTyping = useCallback(() => {
    socketService.startTyping(projectId);
  }, [projectId]);

  const stopTyping = useCallback(() => {
    socketService.stopTyping(projectId);
  }, [projectId]);

  return { startTyping, stopTyping };
}

export function useSocket() {
  return socketService;
}

export function useSocketStatus() {
  return {
    isConnected: socketService.isConnected(),
    socketId: socketService.getSocketId()
  };
}

export function useSocketErrorHandler() {
  const { toast } = useToast();
  const [lastError, setLastError] = useState<{ message: string; canRetry: boolean } | null>(null);

  const handleRetry = useCallback(() => {
    socketService.retry();
    setLastError(null);
    toast({
      title: 'Reconnecting',
      description: 'Attempting to reconnect to the server...',
    });
  }, [toast]);

  useEffect(() => {
    const errorHandler = (error: { message: string; canRetry: boolean }) => {
      setLastError(error);

      toast({
        title: error.canRetry ? 'Connection Error' : 'Error',
        description: error.canRetry
          ? `${error.message}. Click to retry connection.`
          : error.message,
        variant: 'destructive',
      });
    };

    socketService.onError(errorHandler);

    return () => {
      socketService.offError(errorHandler);
    };
  }, [toast]);

  return { lastError, retry: handleRetry };
}