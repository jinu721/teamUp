import { useEffect, useCallback, useRef, useState } from 'react';
import socketService from '@/services/socket';
import { useToast } from '@/hooks/use-toast';

type EventCallback = (data: any) => void;

/**
 * Hook for subscribing to socket events with automatic cleanup
 */
export function useSocketEvent(event: string, callback: EventCallback) {
  const callbackRef = useRef(callback);

  // Keep callback ref updated
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

/**
 * Hook for multiple socket events
 */
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

/**
 * Hook for joining/leaving project room
 */
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

/**
 * Hook for joining/leaving workshop room
 */
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

/**
 * Hook for joining/leaving team room
 */
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

/**
 * Hook for joining/leaving community room
 */
export function useCommunityRoom() {
  useEffect(() => {
    socketService.joinCommunity();
    return () => {
      socketService.leaveCommunity();
    };
  }, []);
}

/**
 * Hook for typing indicators
 */
export function useTypingIndicator(projectId: string) {
  const startTyping = useCallback(() => {
    socketService.startTyping(projectId);
  }, [projectId]);

  const stopTyping = useCallback(() => {
    socketService.stopTyping(projectId);
  }, [projectId]);

  return { startTyping, stopTyping };
}

/**
 * Hook for easy access to the socket service
 */
export function useSocket() {
  return socketService;
}

export function useSocketStatus() {
  return {
    isConnected: socketService.isConnected(),
    socketId: socketService.getSocketId()
  };
}

/**
 * Hook for socket error handling with toast notifications
 * Shows toast notifications for WebSocket errors and provides retry functionality
 */
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
