import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../config/jwt';
import { UserRepository } from '../repositories/UserRepository';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

export class SocketService {
  private io: SocketIOServer;
  private userRepository: UserRepository;
  private connectedUsers: Map<string, string[]> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.userRepository = new UserRepository();
    this.setupMiddleware();
    this.setupConnectionHandlers();
  }

  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = verifyToken(token);
        socket.userId = decoded.id;
        socket.email = decoded.email;

        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupConnectionHandlers(): void {
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      console.log(`✅ User connected: ${userId} (${socket.id})`);

      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, []);
      }
      this.connectedUsers.get(userId)!.push(socket.id);

      await this.userRepository.updatePresence(userId, true);

      socket.join(`user:${userId}`);

      this.io.emit('user:online', { userId, isOnline: true });

      socket.on('project:join', (projectId: string) => {
        socket.join(`project:${projectId}`);
        console.log(`User ${userId} joined project room: ${projectId}`);
      });

      socket.on('project:leave', (projectId: string) => {
        socket.leave(`project:${projectId}`);
        console.log(`User ${userId} left project room: ${projectId}`);
      });

      socket.on('community:join', () => {
        socket.join('community');
        console.log(`User ${userId} joined community room`);
      });

      socket.on('community:leave', () => {
        socket.leave('community');
        console.log(`User ${userId} left community room`);
      });

      socket.on('typing:start', (data: { projectId: string }) => {
        socket.to(`project:${data.projectId}`).emit('typing:start', {
          userId,
          projectId: data.projectId
        });
      });

      socket.on('typing:stop', (data: { projectId: string }) => {
        socket.to(`project:${data.projectId}`).emit('typing:stop', {
          userId,
          projectId: data.projectId
        });
      });

      socket.on('disconnect', async () => {
        console.log(`❌ User disconnected: ${userId} (${socket.id})`);

        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          const index = userSockets.indexOf(socket.id);
          if (index > -1) {
            userSockets.splice(index, 1);
          }

          if (userSockets.length === 0) {
            this.connectedUsers.delete(userId);
            await this.userRepository.updatePresence(userId, false);
            this.io.emit('user:offline', { userId, isOnline: false });
          }
        }
      });
    });
  }

  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToProject(projectId: string, event: string, data: any): void {
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  public emitToCommunity(event: string, data: any): void {
    this.io.to('community').emit(event, data);
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }
}
