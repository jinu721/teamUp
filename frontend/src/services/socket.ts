import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    if (!this.socket) return;

    const events = [
      'user:online',
      'user:offline',
      'project:updated',
      'task:created',
      'task:updated',
      'task:deleted',
      'task:moved',
      'message:new',
      'typing:start',
      'typing:stop',
      'community:project:new',
      'community:project:liked',
      'community:project:commented',
      'community:project:join-request',
      'notification:new',
      'notification:read'
    ];

    events.forEach(event => {
      this.socket?.on(event, (data) => {
        this.emit(event, data);
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

  joinProject(projectId: string): void {
    this.socket?.emit('project:join', projectId);
  }

  leaveProject(projectId: string): void {
    this.socket?.emit('project:leave', projectId);
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

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
