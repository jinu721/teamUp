# TeamUp - Architecture Documentation

## 🏗️ System Architecture Overview

TeamUp is built using a **layered architecture** with clear separation of concerns. The application follows **SOLID principles** and implements the **Repository Pattern** for clean, maintainable code.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Pages      │  │  Components  │  │   Context    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Services (API + Socket.io Client)        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Socket.io Server                     │  │
│  │  (Real-time event broadcasting & room management) │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Controllers  │→ │   Services   │→ │ Repositories │  │
│  │ (Thin layer) │  │ (Business    │  │ (Database    │  │
│  │              │  │  Logic)      │  │  Operations) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                  MongoDB Database                        │
│  Users | Projects | Tasks | Messages | Notifications    │
└─────────────────────────────────────────────────────────┘
```

## 📊 Backend Architecture

### Layered Structure

#### 1. **Controller Layer** (Request Handling)
- **Responsibility**: Handle HTTP requests, validate input, call services
- **Rules**: 
  - No business logic
  - No database operations
  - Only request/response handling
- **Example**: `AuthController.login()` validates credentials and calls `AuthService`

#### 2. **Service Layer** (Business Logic)
- **Responsibility**: Implement business rules, orchestrate operations
- **Rules**:
  - Contains all business logic
  - Calls repositories for data
  - Emits socket events for real-time updates
  - No direct database queries
- **Example**: `TaskService.createTask()` validates permissions, creates task, sends notifications

#### 3. **Repository Layer** (Data Access)
- **Responsibility**: Direct database operations only
- **Rules**:
  - No business logic
  - Only CRUD operations
  - Returns data or throws errors
- **Example**: `TaskRepository.create()` saves task to MongoDB

#### 4. **Socket Layer** (Real-Time Communication)
- **Responsibility**: WebSocket connection management, event broadcasting
- **Rules**:
  - Authenticates socket connections
  - Manages rooms (user, project, community)
  - Broadcasts events to relevant clients
- **Example**: `SocketService.emitToProject()` sends updates to all project members

### Why This Architecture?

**Separation of Concerns**: Each layer has a single responsibility
- Controllers don't know about databases
- Services don't know about HTTP
- Repositories don't know about business rules

**Testability**: Each layer can be tested independently
- Mock repositories to test services
- Mock services to test controllers

**Maintainability**: Changes are isolated
- Change database? Only update repositories
- Change business rules? Only update services
- Add new endpoint? Only add controller

**Scalability**: Easy to extend
- Add new features without touching existing code
- Replace components without breaking others

## 🔄 Real-Time Communication Flow

### How Real-Time Updates Work

```
User A performs action (e.g., creates task)
         ↓
Frontend sends HTTP POST request
         ↓
Backend Controller receives request
         ↓
Controller calls Service
         ↓
Service validates & calls Repository
         ↓
Repository saves to MongoDB
         ↓
Service emits Socket event to project room
         ↓
Socket.io broadcasts to all clients in room
         ↓
All connected users (A, B, C) receive event
         ↓
Frontend updates UI instantly (no refresh)
```

### REST vs WebSocket Responsibility

**REST API (HTTP)**:
- User authentication (login/register)
- Data mutations (create, update, delete)
- Data fetching (get projects, tasks, messages)
- File uploads
- Initial data loading

**WebSocket (Socket.io)**:
- Real-time notifications
- Live task updates
- Chat messages
- Typing indicators
- User presence (online/offline)
- Live likes and comments

**Why Both?**
- REST for reliability and data persistence
- WebSocket for instant updates
- REST ensures data is saved before broadcasting
- WebSocket provides real-time UX

## 🔐 Authentication Flow

### Registration/Login Flow

```
1. User submits credentials
   ↓
2. Backend validates and hashes password (bcrypt)
   ↓
3. User saved to MongoDB
   ↓
4. JWT token generated with user ID and email
   ↓
5. Token sent to frontend
   ↓
6. Frontend stores token in localStorage
   ↓
7. Frontend connects to Socket.io with token
   ↓
8. Socket.io verifies token and associates with user
   ↓
9. User joins personal room (user:{userId})
```

### Authenticated Request Flow

**HTTP Requests**:
```
Request → Auth Middleware → Verify JWT → Extract user → Continue
```

**Socket Connections**:
```
Connect → Socket Middleware → Verify JWT → Store userId → Join rooms
```

## 🏠 Socket Room Strategy

### Room Types

**1. User Rooms** (`user:{userId}`)
- Personal notifications
- Private messages
- Account updates

**2. Project Rooms** (`project:{projectId}`)
- Task updates
- Team chat
- Project changes
- Only team members join

**3. Community Room** (`community`)
- New public projects
- Likes and comments
- Join requests
- All authenticated users can join

### Room Management

**Joining Rooms**:
- User rooms: Automatic on connection
- Project rooms: When user opens project
- Community room: When user visits community page

**Leaving Rooms**:
- Automatic on disconnect
- Manual when leaving project/community page

**Broadcasting**:
- `emitToUser()`: Send to specific user
- `emitToProject()`: Send to all project members
- `emitToCommunity()`: Send to all community viewers
- `emitToAll()`: Send to everyone (rare)

## 📡 Socket Event Flow

### Example: Creating a Task

**Step-by-Step**:

1. **User A** clicks "Create Task" in Project X
2. **Frontend** sends POST `/api/projects/X/tasks`
3. **TaskController** validates request
4. **TaskService** checks if user is project member
5. **TaskRepository** saves task to MongoDB
6. **TaskService** emits `task:created` event to `project:X` room
7. **Socket.io** broadcasts to all clients in `project:X`
8. **User A, B, C** (all in Project X) receive event
9. **Frontend** adds task to UI without refresh

### Example: Sending a Chat Message

**Step-by-Step**:

1. **User A** types message and hits send
2. **Frontend** sends POST `/api/projects/X/messages`
3. **MessageController** validates message
4. **MessageService** checks permissions
5. **MessageRepository** saves to MongoDB
6. **MessageService** emits `message:new` to `project:X`
7. **All team members** see message instantly
8. **Typing indicator** stops for User A

### Example: Liking a Community Project

**Step-by-Step**:

1. **User A** clicks like on community project
2. **Frontend** sends POST `/api/community/projects/Y/like`
3. **CommunityController** processes request
4. **CommunityService** adds like to project
5. **CommunityRepository** updates MongoDB
6. **CommunityService** emits `community:project:liked` to `community` room
7. **All users** viewing community see like count update instantly

## 🔄 Data Consistency Strategy

### How We Maintain Consistency

**1. Single Source of Truth**
- MongoDB is the only source of truth
- All writes go through REST API
- Socket events are notifications, not data sources

**2. Optimistic Updates**
- Frontend updates UI immediately
- If server fails, rollback UI change
- Better UX with instant feedback

**3. Event Sourcing**
- Every change emits an event
- Events contain full updated data
- Clients sync with server state

**4. Reconnection Handling**
- On disconnect, client marks as offline
- On reconnect, fetch latest data via REST
- Ensures no missed updates

**5. Room Isolation**
- Updates only sent to relevant users
- Reduces unnecessary network traffic
- Improves performance

### Handling Edge Cases

**User Offline**:
- Misses real-time events
- On reconnect, fetches latest data
- Notifications stored in database

**Network Issues**:
- Socket.io auto-reconnects
- Frontend shows connection status
- Queues messages during disconnect

**Concurrent Updates**:
- Last write wins (MongoDB)
- Optimistic locking for critical operations
- Conflict resolution in service layer

## 📁 Folder Structure Explanation

### Backend Structure

```
backend/src/
├── config/          # Configuration files (DB, JWT)
├── controllers/     # HTTP request handlers (thin)
├── services/        # Business logic (thick)
├── repositories/    # Database operations (data layer)
├── models/          # Mongoose schemas
├── routes/          # API route definitions
├── middlewares/     # Auth, validation, error handling
├── sockets/         # Socket.io setup and handlers
├── events/          # Event name constants
├── utils/           # Helper functions, error classes
└── server.ts        # Entry point
```

**Why This Structure?**
- Clear separation of concerns
- Easy to find code
- Scalable for large teams
- Follows industry standards

### Frontend Structure

```
frontend/src/
├── components/      # Reusable React components
├── pages/           # Page-level components
├── context/         # React Context providers
├── services/        # API and Socket services
├── types/           # TypeScript interfaces
├── utils/           # Helper functions
├── App.tsx          # Root component with routing
└── main.tsx         # Entry point
```

**Why This Structure?**
- Component reusability
- Clear page hierarchy
- Centralized state management
- Type safety with TypeScript

## 🎯 Key Design Decisions

### 1. Why Repository Pattern?
- Isolates database logic
- Easy to test with mocks
- Can swap databases without changing business logic
- Follows SOLID principles

### 2. Why Socket.io?
- Bidirectional communication
- Automatic reconnection
- Room-based broadcasting
- Fallback to polling
- Wide browser support

### 3. Why JWT?
- Stateless authentication
- Works with REST and WebSocket
- Easy to scale horizontally
- No server-side session storage

### 4. Why MongoDB?
- Flexible schema for rapid development
- Good performance for real-time apps
- Easy to scale
- Native JSON support

### 5. Why TypeScript?
- Type safety prevents bugs
- Better IDE support
- Self-documenting code
- Easier refactoring

## 🚀 Performance Considerations

### Backend Optimizations
- Database indexing on frequently queried fields
- Connection pooling for MongoDB
- Efficient socket room management
- Minimal data in socket events

### Frontend Optimizations
- Lazy loading of routes
- Optimistic UI updates
- Debounced typing indicators
- Efficient re-renders with React

### Real-Time Optimizations
- Room-based broadcasting (not global)
- Event throttling for high-frequency updates
- Selective data in events (not full documents)
- Client-side caching

## 🔒 Security Measures

### Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration
- Token verification on every request
- Socket authentication on connection

### Authorization
- Project membership checks
- Owner-only operations
- User-specific data filtering
- Rate limiting (future enhancement)

### Data Validation
- Input validation on all endpoints
- Mongoose schema validation
- XSS prevention
- SQL injection prevention (NoSQL)

## 📈 Scalability Path

### Current Architecture Supports
- Horizontal scaling (multiple server instances)
- Load balancing
- Database replication
- CDN for static assets

### Future Enhancements
- Redis for session storage
- Message queue for async tasks
- Microservices for specific features
- Kubernetes for orchestration

---

This architecture provides a solid foundation for a production-ready, real-time collaboration platform that can scale with your needs.
