# TeamUp - Advanced Collaboration Platform

TeamUp is a modern, real-time collaboration suite designed to streamline project management, team communication, and workflow automation. Built with a robust MERN stack architecture, it combines powerful project management tools with real-time interactivity.

## Core Features

### Workshop & Project Management
- **Workshops**: centralized hubs for collaboration with configurable visibility (Public/Private).
- **Hierarchical Structure**: Organize work into Workshops > Projects > Tasks.
- **Kanban & List Views**: Flexible task management interfaces.
- **Task Dependencies**:  Define relationships between tasks to ensure proper execution order.

### Automation Engine
- **Custom Rules**: Create "If This Then That" style automation rules.
- **Event Triggers**: Automate actions based on task creation, status changes, priority updates, or new comments.
- **Smart Actions**: Automatically assign users, update statuses, or send notifications when conditions are met.
- **Visual Builder**: Interactive UI for building complex logic without code.

### Advanced Access Control
- **RBAC System**: sophisticated Role-Based Access Control.
- **Custom Roles**: Define granular permissions for every aspect of the workshop (e.g., `can_delete_tasks`, `can_invite_members`).
- **Team Permissions**: Assign roles to entire teams or individual members.

### Real-Time Communication
- **Instant Chat**: Built-in messaging system for workshops and teams.
- **Live Updates**: Real-time reflection of task changes, comments, and status updates across all connected clients via Socket.io.
- **Notifications**: Centralized notification center for mentions, assignments, and system alerts.

### Security & Authentication
- **Multi-Factor Auth**: Secure registration with OTP verification.
- **Social Login**: Seamless integration with Google and GitHub OAuth.
- **Audit Logging**: Comprehensive activity logs tracking every action within the system for security and compliance.

## Technology Stack

### Backend
- **Runtime**: Node.js & Express
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: Passport.js (JWT, Google, GitHub strategies)
- **Storage**: Cloudinary
- **Language**: TypeScript

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & Radix UI (Headless components)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State/Network**: Axios, React Query patterns

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas connection string)
- Cloudinary Account (for file uploads)
- Google/GitHub OAuth Credentials (optional, for social login)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jinu721/teamUp.git
   cd teamUp
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your credentials
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Update .env with your backend URL
   npm run dev
   ```

## Development

The project uses a monorepo-style structure with separate `backend` and `frontend` directories.

- **Backend**: Located in `/backend`. Run with `npm run dev`.
- **Frontend**: Located in `/frontend`. Run with `npm run dev`.

### Key Commands

- **Backend Dev**: `npm run dev` (Runs server with nodemon and ts-node)
- **Frontend Dev**: `npm run dev` (Starts Vite development server)
- **Build**: `npm run build` (Compiles TypeScript and bundles assets)

## License

This project is licensed under the MIT License.
