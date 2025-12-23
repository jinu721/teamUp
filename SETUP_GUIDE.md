# TeamUp - Complete Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** - Comes with Node.js
- **Git** - For version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd teamup
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
# Required variables:
# - PORT=5000
# - MONGODB_URI=mongodb://localhost:27017/teamup
# - JWT_SECRET=your_super_secret_key_change_in_production
# - JWT_EXPIRES_IN=7d

# Start MongoDB (if not running)
# On Windows: Start MongoDB service
# On Mac/Linux: mongod

# Run the backend server
npm run dev
```

Backend will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Open new terminal
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file:
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000

# Start the frontend development server
npm run dev
```

Frontend will start on `http://localhost:3000`

### 4. Verify Installation

1. Open browser to `http://localhost:3000`
2. Register a new account
3. Create a project
4. Open project in two browser windows
5. Create a task in one window
6. Watch it appear instantly in the other window ✨

## 🔧 Detailed Configuration

### Backend Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/teamup

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# File Upload (Optional)
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🗄️ Database Setup

### MongoDB Local Installation

**Windows**:
1. Download MongoDB Community Server
2. Install with default settings
3. MongoDB runs as a Windows service automatically

**Mac (using Homebrew)**:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu)**:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Verify MongoDB is Running

```bash
# Connect to MongoDB shell
mongosh

# You should see MongoDB shell prompt
# Type 'exit' to quit
```

### MongoDB Atlas (Cloud Alternative)

If you prefer cloud database:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create cluster
4. Get connection string
5. Update `MONGODB_URI` in `.env`

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teamup
```

## 📦 Production Build

### Backend Production Build

```bash
cd backend

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Frontend Production Build

```bash
cd frontend

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deploy to Production

**Backend Deployment** (Example: Heroku, Railway, Render):
1. Set environment variables
2. Ensure MongoDB is accessible
3. Deploy built code
4. Run migrations if needed

**Frontend Deployment** (Example: Vercel, Netlify):
1. Connect Git repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set environment variables
5. Deploy

## 🧪 Testing the Application

### Test Real-Time Features

**1. Test Task Board Real-Time Updates**:
- Open project in two browser windows
- Create task in window 1
- Verify it appears instantly in window 2
- Move task to different column in window 1
- Verify it moves in window 2

**2. Test Real-Time Chat**:
- Open project in two browser windows
- Send message in window 1
- Verify it appears instantly in window 2
- Start typing in window 1
- Verify "typing..." indicator in window 2

**3. Test User Presence**:
- Login in two different browsers
- Verify online status updates
- Close one browser
- Verify offline status updates

**4. Test Community Feed**:
- Open community page in two windows
- Post project in window 1
- Verify it appears instantly in window 2
- Like project in window 1
- Verify like count updates in window 2

**5. Test Notifications**:
- Create task and assign to another user
- Verify notification appears instantly
- Check notification panel updates in real-time

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Cannot connect to MongoDB
```
Solution:
1. Verify MongoDB is running: mongosh
2. Check MONGODB_URI in .env
3. Ensure no firewall blocking port 27017
```

**Problem**: JWT authentication fails
```
Solution:
1. Check JWT_SECRET is set in .env
2. Verify token is being sent in Authorization header
3. Clear localStorage and login again
```

**Problem**: Socket.io connection fails
```
Solution:
1. Check CORS configuration in server.ts
2. Verify FRONTEND_URL in .env
3. Check browser console for errors
```

### Frontend Issues

**Problem**: API requests fail
```
Solution:
1. Verify backend is running on port 5000
2. Check VITE_API_URL in .env
3. Check browser network tab for errors
```

**Problem**: Socket connection not working
```
Solution:
1. Verify VITE_SOCKET_URL in .env
2. Check token is stored in localStorage
3. Open browser console and look for socket errors
```

**Problem**: Real-time updates not appearing
```
Solution:
1. Verify socket connection is established
2. Check if user joined correct room
3. Verify event listeners are set up
4. Check browser console for errors
```

### Common Errors

**Error**: `EADDRINUSE: address already in use`
```
Solution: Port is already in use
- Kill process using port: 
  Windows: netstat -ano | findstr :5000
  Mac/Linux: lsof -ti:5000 | xargs kill
```

**Error**: `MongooseServerSelectionError`
```
Solution: Cannot connect to MongoDB
- Start MongoDB service
- Check connection string
- Verify network connectivity
```

**Error**: `JsonWebTokenError: invalid token`
```
Solution: Token is invalid or expired
- Clear localStorage
- Login again
- Check JWT_SECRET matches between requests
```

## 📊 Monitoring and Logs

### Backend Logs

The backend logs important events:
- ✅ MongoDB connected
- ✅ User connected (Socket.io)
- ❌ User disconnected
- 🔄 Real-time events

### Frontend Logs

Open browser console to see:
- Socket connection status
- Real-time events received
- API request/response
- Errors and warnings

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to strong random string
- [ ] Use HTTPS for all connections
- [ ] Enable MongoDB authentication
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables (never commit .env)
- [ ] Enable MongoDB encryption at rest
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Input validation on all endpoints

## 📈 Performance Tips

### Backend Performance
- Enable MongoDB indexing (already configured)
- Use connection pooling
- Implement caching for frequent queries
- Optimize socket room management

### Frontend Performance
- Lazy load routes
- Optimize re-renders
- Use React.memo for expensive components
- Debounce frequent events (typing indicators)

## 🎯 Next Steps

After successful setup:

1. **Explore the Code**:
   - Read ARCHITECTURE.md for system design
   - Review backend services and repositories
   - Understand socket event flow

2. **Customize**:
   - Add your own features
   - Modify UI/UX
   - Extend real-time capabilities

3. **Deploy**:
   - Choose hosting provider
   - Set up CI/CD pipeline
   - Configure production environment

4. **Scale**:
   - Add Redis for caching
   - Implement load balancing
   - Set up monitoring

## 📚 Additional Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 💡 Tips for Development

1. **Use Two Browsers**: Test real-time features with Chrome and Firefox
2. **Check Network Tab**: Monitor WebSocket connections
3. **Use MongoDB Compass**: Visual tool for database inspection
4. **Enable Source Maps**: Easier debugging in production
5. **Use React DevTools**: Inspect component state and props

---

Need help? Check the troubleshooting section or review the architecture documentation.
