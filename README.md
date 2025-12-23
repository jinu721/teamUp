# TeamUp - Real-Time Team Collaboration Platform

A production-ready, real-time MERN stack web application for team collaboration and community project sharing.

## 🚀 Features

### Real-Time Capabilities
- **Live Task Board**: Kanban board with instant updates across all team members
- **Real-Time Chat**: Socket.io based messaging with typing indicators
- **Live Notifications**: Instant delivery of task updates, messages, and invites
- **User Presence**: Online/offline status tracking
- **Community Feed**: Real-time project posts, likes, and comments
- **Join Requests**: Instant updates when users request to join projects

### Core Features
- **User Management**: Authentication, profiles, skills, and interests
- **Private Projects**: Team workspaces with task management
- **Team Chat**: Real-time messaging within projects
- **File Uploads**: Attach files to tasks and chat messages
- **Public Community**: Share and discover project ideas
- **Dashboard**: Unified view of projects and notifications

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Socket.io Client** for real-time features
- **React Router** for navigation
- **Axios** for REST API calls
- **Context API** for state management

### Backend
- **Node.js** with Express and TypeScript
- **Socket.io** for WebSocket communication
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads

### Architecture
- **Repository Pattern**: Database logic isolation
- **Service Layer**: Business logic separation
- **Controller Layer**: Request handling
- **SOLID Principles**: Clean, maintainable code
- **Real-Time Events**: Socket.io rooms and namespaces

## 📁 Project Structure

```
teamup/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Database operations
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Auth, validation, error handling
│   │   ├── sockets/        # Socket.io handlers
│   │   ├── events/         # Event definitions
│   │   ├── utils/          # Helper functions
│   │   └── server.ts       # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and Socket services
│   │   ├── context/        # React Context providers
│   │   ├── utils/          # Helper functions
│   │   └── App.tsx         # Root component
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/teamup
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

4. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 🔌 API Overview

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `PUT /api/users/:id/presence` - Update presence status

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - Get user's projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/invite` - Invite team member

### Tasks
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/projects/:projectId/tasks` - Get project tasks
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Community
- `POST /api/community/projects` - Post public project
- `GET /api/community/projects` - Get public projects
- `POST /api/community/projects/:id/like` - Like project
- `POST /api/community/projects/:id/comment` - Comment on project
- `POST /api/community/projects/:id/join` - Request to join

### Messages
- `GET /api/projects/:projectId/messages` - Get chat history
- `POST /api/projects/:projectId/messages` - Send message (also via Socket)

## 🔄 Socket Events

### Connection
- `connection` - Client connects
- `disconnect` - Client disconnects
- `authenticate` - Authenticate socket connection

### Presence
- `user:online` - User comes online
- `user:offline` - User goes offline
- `user:typing` - User is typing

### Projects
- `project:join` - Join project room
- `project:leave` - Leave project room
- `project:updated` - Project details changed

### Tasks
- `task:created` - New task created
- `task:updated` - Task updated (status, assignee, etc.)
- `task:deleted` - Task deleted
- `task:moved` - Task moved between columns

### Chat
- `message:send` - Send chat message
- `message:new` - New message received
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

### Community
- `community:project:new` - New public project posted
- `community:project:liked` - Project liked
- `community:project:commented` - New comment added
- `community:project:join-request` - Join request received

### Notifications
- `notification:new` - New notification received
- `notification:read` - Notification marked as read

## 🏗️ Architecture Explanation

### Layered Architecture

**Controller Layer**: Handles HTTP requests, validates input, calls services, returns responses. No business logic.

**Service Layer**: Contains all business logic, orchestrates operations, calls repositories, emits socket events.

**Repository Layer**: Direct database operations only. No business logic. Returns data or throws errors.

**Socket Layer**: Handles WebSocket connections, authentication, room management, event broadcasting.

### Real-Time Communication Flow

1. **Client Action**: User performs action (e.g., creates task)
2. **REST API Call**: Client sends HTTP request to backend
3. **Controller**: Validates and forwards to service
4. **Service**: Executes business logic, saves to database
5. **Socket Emission**: Service emits event to relevant room
6. **Broadcast**: Socket.io broadcasts to all clients in room
7. **Client Update**: All connected clients receive update and refresh UI

### Socket Room Strategy

- **User Rooms**: `user:{userId}` - Personal notifications
- **Project Rooms**: `project:{projectId}` - Project-specific updates
- **Community Room**: `community` - Public feed updates

### Authentication Flow

1. User registers/logs in via REST API
2. Server returns JWT token
3. Client stores token in localStorage
4. REST requests include token in Authorization header
5. Socket connection sends token in auth handshake
6. Server verifies token and associates socket with user
7. User joins relevant rooms based on their projects

### Data Consistency

- **Optimistic Updates**: UI updates immediately, rolls back on error
- **Event Sourcing**: All changes emit events for real-time sync
- **Room Isolation**: Updates only sent to relevant users
- **Reconnection Handling**: Clients fetch latest data on reconnect

## 📝 Git Commit Summary

1. **Initial project setup** - Project structure, .gitignore, README
2. **Backend architecture setup** - Folder structure, TypeScript config
3. **Database models** - User, Project, Task, Message, Community models
4. **Repository pattern** - Database layer implementation
5. **Service layer** - Business logic implementation
6. **Authentication system** - JWT, bcrypt, auth middleware
7. **REST API controllers** - All CRUD endpoints
8. **Socket.io base setup** - Server initialization, authentication
9. **Real-time presence system** - Online/offline tracking
10. **Real-time task board** - Task CRUD with socket events
11. **Real-time chat system** - Messaging with typing indicators
12. **Community real-time feed** - Public projects with live updates
13. **Notifications system** - Real-time notification delivery
14. **Frontend project setup** - React, TypeScript, routing
15. **Socket service** - Frontend WebSocket client
16. **Authentication pages** - Login, register, profile
17. **Dashboard page** - Projects overview, notifications
18. **Project workspace** - Task board, chat, team management
19. **Community page** - Public projects, filtering, interactions
20. **Real-time UI integration** - Socket event handlers, live updates
21. **File upload feature** - Multer backend, upload UI
22. **Error handling** - Global error middleware, user feedback
23. **Final cleanup and documentation** - Code review, README, comments

## 🚀 Future Improvements

- **Calendar Integration**: Real-time calendar with event updates
- **Video/Voice Calls**: WebRTC integration for team calls
- **Skill Matching Algorithm**: AI-powered project recommendations
- **Gamification**: Points, badges, leaderboards
- **Analytics Dashboard**: Real-time project metrics
- **Mobile App**: React Native version
- **Email Notifications**: Backup for offline users
- **Advanced Search**: Elasticsearch integration
- **Rate Limiting**: API protection
- **Caching**: Redis for performance

## 🎯 Interview Explanation Tips

### "Explain the real-time architecture"
"TeamUp uses Socket.io for bidirectional communication. When a user performs an action, it goes through REST API first for validation and persistence. After saving to MongoDB, the service layer emits a socket event to the relevant room. All connected clients in that room receive the event and update their UI instantly. We use room-based broadcasting to ensure updates only go to relevant users."

### "How do you handle authentication for sockets?"
"Socket connections authenticate during the handshake by sending the JWT token. The server verifies the token, extracts the user ID, and stores it in the socket object. This allows us to associate every socket event with an authenticated user and enforce permissions."

### "Why use the repository pattern?"
"The repository pattern isolates database logic from business logic. Services don't need to know about MongoDB queries - they just call repository methods. This makes the code testable, maintainable, and allows us to swap databases without changing business logic."

### "How do you ensure data consistency?"
"We use a single source of truth - MongoDB. REST API handles writes and validation. Socket events are emitted after successful database operations. Clients use optimistic updates for better UX but always sync with server state. On reconnection, clients fetch the latest data."

### "What happens if a user is offline?"
"Offline users miss real-time events, but when they reconnect, the frontend fetches the latest data via REST API. We also store notifications in the database, so users see what they missed. Future enhancement would add email notifications for critical updates."

## 📄 License

MIT License - Feel free to use this project for learning and development.

## 👥 Contributing

This is a learning project. Feel free to fork and experiment!

---

Built with ❤️ using MERN Stack + Socket.io
