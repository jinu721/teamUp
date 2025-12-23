# TeamUp - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "skills": [],
      "interests": [],
      "isOnline": false
    },
    "token": "jwt_token_here"
  }
}
```

### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_here"
  }
}
```

### Get Current User
```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "skills": ["JavaScript", "React"],
    "interests": ["Web Development"],
    "isOnline": true,
    "lastActive": "2024-01-15T10:30:00Z"
  }
}
```

---

## 📁 Project Endpoints

### Create Project
```http
POST /api/projects
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "My Awesome Project",
  "description": "A project to build something amazing",
  "category": "web_development",
  "startDate": "2024-01-15",
  "endDate": "2024-06-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "project_id",
    "title": "My Awesome Project",
    "description": "A project to build something amazing",
    "category": "web_development",
    "owner": { /* user object */ },
    "teamMembers": [ /* array of users */ ],
    "startDate": "2024-01-15T00:00:00Z",
    "endDate": "2024-06-15T00:00:00Z",
    "isPublic": false,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### Get User's Projects
```http
GET /api/projects
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    { /* project object */ },
    { /* project object */ }
  ]
}
```

### Get Project by ID
```http
GET /api/projects/:id
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": { /* project object with populated team members */ }
}
```

### Update Project
```http
PUT /api/projects/:id
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Project Title",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated project object */ }
}
```

**Real-Time Event:** Emits `project:updated` to all project members

### Delete Project
```http
DELETE /api/projects/:id
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Invite Team Member
```http
POST /api/projects/:id/invite
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "teammate@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated project with new team member */ }
}
```

**Real-Time Events:**
- Emits `notification:new` to invited user
- Emits `project:updated` to all project members

---

## ✅ Task Endpoints

### Create Task
```http
POST /api/projects/:projectId/tasks
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication",
  "assignedTo": "user_id",
  "dueDate": "2024-01-20"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "task_id",
    "project": "project_id",
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication",
    "status": "todo",
    "assignedTo": { /* user object */ },
    "createdBy": { /* user object */ },
    "dueDate": "2024-01-20T00:00:00Z",
    "attachments": [],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Real-Time Events:**
- Emits `task:created` to all project members
- Emits `notification:new` to assigned user

### Get Project Tasks
```http
GET /api/projects/:projectId/tasks
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    { /* task object */ },
    { /* task object */ }
  ]
}
```

### Update Task
```http
PUT /api/tasks/:id
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "assignedTo": "new_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated task object */ }
}
```

**Real-Time Event:** Emits `task:updated` to all project members

### Update Task Status
```http
PUT /api/tasks/:id/status
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Status Options:** `todo`, `in_progress`, `done`

**Response:**
```json
{
  "success": true,
  "data": { /* updated task object */ }
}
```

**Real-Time Event:** Emits `task:moved` to all project members

### Delete Task
```http
DELETE /api/tasks/:id
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Real-Time Event:** Emits `task:deleted` to all project members

---

## 💬 Message Endpoints

### Send Message
```http
POST /api/projects/:projectId/messages
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Hello team! Let's discuss the project.",
  "attachments": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "message_id",
    "project": "project_id",
    "sender": { /* user object */ },
    "content": "Hello team! Let's discuss the project.",
    "attachments": [],
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Real-Time Event:** Emits `message:new` to all project members

### Get Project Messages
```http
GET /api/projects/:projectId/messages?limit=50
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of messages to retrieve (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    { /* message object */ },
    { /* message object */ }
  ]
}
```

---

## 🔔 Notification Endpoints

### Get Notifications
```http
GET /api/notifications?limit=50
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of notifications (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "notification_id",
      "user": "user_id",
      "type": "task_assigned",
      "title": "New Task Assigned",
      "message": "You have been assigned to task: Implement authentication",
      "relatedProject": { /* project object */ },
      "relatedTask": { /* task object */ },
      "isRead": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Unread Notifications
```http
GET /api/notifications/unread
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [ /* array of unread notifications */ ]
}
```

### Mark Notification as Read
```http
PUT /api/notifications/:id/read
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": { /* updated notification */ }
}
```

### Mark All Notifications as Read
```http
PUT /api/notifications/read-all
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 🌍 Community Endpoints

### Create Community Project
```http
POST /api/community/projects
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Looking for React developers",
  "description": "Building a social media platform",
  "tags": ["react", "nodejs", "mongodb"],
  "requiredSkills": ["React", "Node.js", "MongoDB"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "community_project_id",
    "title": "Looking for React developers",
    "description": "Building a social media platform",
    "tags": ["react", "nodejs", "mongodb"],
    "requiredSkills": ["React", "Node.js", "MongoDB"],
    "owner": { /* user object */ },
    "likes": [],
    "comments": [],
    "joinRequests": [],
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Real-Time Event:** Emits `community:project:new` to all community viewers

### Get Community Projects
```http
GET /api/community/projects?limit=20&skip=0
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of projects (default: 20)
- `skip` (optional): Number to skip for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [ /* array of community projects */ ]
}
```

### Get Community Project by ID
```http
GET /api/community/projects/:id
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": { /* community project with populated comments */ }
}
```

### Like Community Project
```http
POST /api/community/projects/:id/like
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": { /* updated project with new like */ }
}
```

**Real-Time Event:** Emits `community:project:liked` to all community viewers

### Comment on Community Project
```http
POST /api/community/projects/:id/comment
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Great project! I'd love to join."
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated project with new comment */ }
}
```

**Real-Time Events:**
- Emits `community:project:commented` to all community viewers
- Emits `notification:new` to project owner

### Request to Join Community Project
```http
POST /api/community/projects/:id/join
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": { /* updated project with join request */ }
}
```

**Real-Time Events:**
- Emits `community:project:join-request` to all community viewers
- Emits `notification:new` to project owner

---

## 🏥 Health Check

### Check API Health
```http
GET /api/health
```

**No authentication required**

**Response:**
```json
{
  "success": true,
  "message": "TeamUp API is running",
  "timestamp": "2024-01-15T10:00:00Z",
  "onlineUsers": 42
}
```

---

## 🔌 Socket.io Events

### Connection Events

**Client → Server:**
- `connection` - Establish connection (automatic)
- `disconnect` - Close connection (automatic)

**Server → Client:**
- `connect` - Connection established
- `disconnect` - Connection closed
- `connect_error` - Connection error

### User Presence Events

**Server → All Clients:**
- `user:online` - User comes online
  ```json
  { "userId": "user_id", "isOnline": true }
  ```

- `user:offline` - User goes offline
  ```json
  { "userId": "user_id", "isOnline": false }
  ```

### Project Events

**Client → Server:**
- `project:join` - Join project room
  ```json
  "project_id"
  ```

- `project:leave` - Leave project room
  ```json
  "project_id"
  ```

**Server → Project Members:**
- `project:updated` - Project details changed
  ```json
  { /* updated project object */ }
  ```

### Task Events

**Server → Project Members:**
- `task:created` - New task created
  ```json
  { /* task object */ }
  ```

- `task:updated` - Task updated
  ```json
  { /* updated task object */ }
  ```

- `task:deleted` - Task deleted
  ```json
  { "taskId": "task_id" }
  ```

- `task:moved` - Task status changed
  ```json
  {
    "task": { /* task object */ },
    "oldStatus": "todo",
    "newStatus": "in_progress"
  }
  ```

### Chat Events

**Client → Server:**
- `typing:start` - User started typing
  ```json
  { "projectId": "project_id" }
  ```

- `typing:stop` - User stopped typing
  ```json
  { "projectId": "project_id" }
  ```

**Server → Project Members:**
- `message:new` - New message received
  ```json
  { /* message object */ }
  ```

- `typing:start` - Someone is typing
  ```json
  { "userId": "user_id", "projectId": "project_id" }
  ```

- `typing:stop` - Someone stopped typing
  ```json
  { "userId": "user_id", "projectId": "project_id" }
  ```

### Community Events

**Client → Server:**
- `community:join` - Join community room
- `community:leave` - Leave community room

**Server → Community Viewers:**
- `community:project:new` - New project posted
  ```json
  { /* community project object */ }
  ```

- `community:project:liked` - Project liked
  ```json
  {
    "projectId": "project_id",
    "userId": "user_id",
    "likesCount": 42
  }
  ```

- `community:project:commented` - New comment
  ```json
  {
    "projectId": "project_id",
    "comment": { /* comment object */ }
  }
  ```

- `community:project:join-request` - Join request
  ```json
  {
    "projectId": "project_id",
    "userId": "user_id"
  }
  ```

### Notification Events

**Server → Specific User:**
- `notification:new` - New notification
  ```json
  {
    "type": "task_assigned",
    "title": "New Task Assigned",
    "message": "You have been assigned to a task"
  }
  ```

- `notification:read` - Notification marked as read
  ```json
  { "notificationId": "notification_id" }
  ```

---

## ❌ Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

### Common Status Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### Example Errors

**Validation Error:**
```json
{
  "success": false,
  "message": "Email and password are required",
  "statusCode": 400
}
```

**Authentication Error:**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "statusCode": 401
}
```

**Authorization Error:**
```json
{
  "success": false,
  "message": "You are not a member of this project",
  "statusCode": 403
}
```

**Not Found Error:**
```json
{
  "success": false,
  "message": "Project not found",
  "statusCode": 404
}
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are MongoDB ObjectIds (24-character hex strings)
- Real-time events are emitted after successful database operations
- Socket.io automatically handles reconnection
- JWT tokens expire after 7 days (configurable)
- File uploads are not yet implemented (future enhancement)

---

For more details, see ARCHITECTURE.md and SETUP_GUIDE.md
