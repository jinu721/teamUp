import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

type EventCallback = (data: any) => void;
type ErrorCallback = (error: { message: string; canRetry: boolean }) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private errorListeners: Set<ErrorCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private token: string | null = null;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.notifyError({
          message: 'Connection lost. Attempting to reconnect...',
          canRetry: true
        });
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.notifyError({
          message: 'Unable to connect to server. Please check your connection.',
          canRetry: true
        });
      }
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      this.notifyError({
        message: error.message || 'A connection error occurred',
        canRetry: false
      });
    });

    this.setupEventForwarding();
  }

  retry(): void {
    if (this.token) {
      this.reconnectAttempts = 0;
      this.disconnect();
      this.connect(this.token);
    }
  }

  private setupEventForwarding(): void {
    if (!this.socket) return;

    const events = [

      'user:online',
      'user:offline',

      'workshop:created',
      'workshop:updated',
      'workshop:deleted',
      'workshop:manager:assigned',
      'workshop:manager:removed',

      'membership:invited',
      'membership:joined',
      'membership:left',
      'membership:removed',
      'membership:request:created',
      'membership:request:approved',
      'membership:request:rejected',

      'team:created',
      'team:updated',
      'team:deleted',
      'team:member:added',
      'team:member:removed',
      'team:role:assigned',
      'team:role:removed',

      'role:created',
      'role:updated',
      'role:deleted',
      'role:assigned',
      'role:revoked',

      'workshop:project:created',
      'workshop:project:updated',
      'workshop:project:deleted',
      'workshop:project:team:assigned',
      'workshop:project:team:removed',
      'workshop:project:individual:assigned',
      'workshop:project:individual:removed',
      'workshop:project:manager:assigned',
      'workshop:project:maintainer:assigned',
      'workshop:project:maintainer:removed',

      'workshop:task:created',
      'workshop:task:updated',
      'workshop:task:deleted',
      'workshop:task:status:changed',
      'workshop:task:team:assigned',
      'workshop:task:team:removed',
      'workshop:task:individual:assigned',
      'workshop:task:individual:removed',
      'workshop:task:dependency:added',
      'workshop:task:dependency:removed',

      'project:updated',
      'project:deleted',
      'project:removed',

      'task:created',
      'task:updated',
      'task:deleted',
      'task:moved',

      'message:new',
      'typing:start',
      'typing:stop',

      'community:post:created',
      'community:post:updated',
      'community:post:deleted',
      'community:post:voted',
      'community:post:commented',
      'community:comment:updated',
      'community:comment:deleted',
      'community:join:responded',

      'workshop:project:created',
      'workshop:team:created',
      'role:updated',
      'role:deleted',

      'notification:new',
      'notification:read',
      'notification:allRead',
      'notification:deleted',

      'chat:room:created',
      'chat:room:updated',
      'chat:room:deleted',
      'chat:rooms:sync',
      'chat:message:received',
      'chat:message:edited',
      'chat:message:deleted',
      'chat:typing:start',
      'chat:typing:stop'
    ];

    events.forEach(event => {
      this.socket?.on(event, (data) => {
        console.log(`📡 [Socket] Event received: ${event}`, data);
        this.notifyListeners(event, data);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  joinWorkshop(workshopId: string): void {
    this.socket?.emit('workshop:join', workshopId);
  }

  leaveWorkshop(workshopId: string): void {
    this.socket?.emit('workshop:leave', workshopId);
  }

  joinProject(projectId: string): void {
    this.socket?.emit('project:join', projectId);
  }

  leaveProject(projectId: string): void {
    this.socket?.emit('project:leave', projectId);
  }

  joinTeam(teamId: string): void {
    this.socket?.emit('team:join', teamId);
  }

  leaveTeam(teamId: string): void {
    this.socket?.emit('team:leave', teamId);
  }

  joinChat(roomId: string): void {
    this.socket?.emit('chat:join', roomId);
  }

  leaveChat(roomId: string): void {
    this.socket?.emit('chat:leave', roomId);
  }

  joinCommunity(): void {
    this.socket?.emit('community:join');
  }

  leaveCommunity(): void {
    this.socket?.emit('community:leave');
  }

  startTyping(projectId: string): void {
    this.socket?.emit('typing:start', { projectId });
  }

  stopTyping(projectId: string): void {
    this.socket?.emit('typing:stop', { projectId });
  }

  startChatTyping(roomId: string): void {
    this.socket?.emit('chat:typing:start', { roomId });
  }

  stopChatTyping(roomId: string): void {
    this.socket?.emit('chat:typing:stop', { roomId });
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private notifyListeners(event: string, data: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  onError(callback: ErrorCallback): void {
    this.errorListeners.add(callback);
  }

  offError(callback: ErrorCallback): void {
    this.errorListeners.delete(callback);
  }

  private notifyError(error: { message: string; canRetry: boolean }): void {
    this.errorListeners.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in socket error listener:', err);
      }
    });
  }
}

export default new SocketService();