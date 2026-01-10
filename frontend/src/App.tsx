import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { useSocketErrorHandler } from '@/hooks/useSocket';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import VerifyEmail from '@/pages/VerifyEmail';
import Dashboard from '@/pages/Dashboard';
import PublicWorkshops from '@/pages/PublicWorkshops';
import Notifications from '@/pages/Notifications';
import InviteAccept from '@/pages/InviteAccept';
import WorkshopList from '@/pages/WorkshopList';
import WorkshopDashboard from '@/pages/WorkshopDashboard';
import TeamDetail from '@/pages/TeamDetail';
import ProjectDetail from '@/pages/ProjectDetail';
import TaskDetail from '@/pages/TaskDetail';
import WorkshopAuditLog from '@/pages/WorkshopAuditLog';
import ChatPage from '@/pages/Chat';
import Landing from '@/pages/Landing';
import { Loader2 } from 'lucide-react';

// Component to handle socket errors globally
const SocketErrorHandler: React.FC = () => {
  useSocketErrorHandler();
  return null;
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <VerifyEmail />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/community"
        element={
          <PrivateRoute>
            <PublicWorkshops />
          </PrivateRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        }
      />
      <Route
        path="/workshops"
        element={
          <PrivateRoute>
            <WorkshopList />
          </PrivateRoute>
        }
      />
      <Route
        path="/workshops/:workshopId"
        element={
          <PrivateRoute>
            <WorkshopDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/workshops/:workshopId/teams/:teamId"
        element={
          <PrivateRoute>
            <TeamDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/workshops/:workshopId/projects/:projectId"
        element={
          <PrivateRoute>
            <ProjectDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/workshops/:workshopId/projects/:projectId/tasks/:taskId"
        element={
          <PrivateRoute>
            <TaskDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/workshops/:workshopId/audit"
        element={
          <PrivateRoute>
            <WorkshopAuditLog />
          </PrivateRoute>
        }
      />
      <Route
        path="/workshops/:workshopId/chat"
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/workshops/:workshopId/chat/:roomId"
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/invite/:token"
        element={<InviteAccept />}
      />
      <Route path="/" element={<Landing />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketErrorHandler />
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
