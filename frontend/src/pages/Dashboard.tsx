import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Project, Notification } from '../types';
import api from '../services/api';
import socketService from '../services/socket';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    setupSocketListeners();

    return () => {
      socketService.off('project:updated', handleProjectUpdate);
      socketService.off('notification:new', handleNewNotification);
    };
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, notificationsRes] = await Promise.all([
        api.getProjects(),
        api.getNotifications(10)
      ]);
      setProjects(projectsRes.data);
      setNotifications(notificationsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('project:updated', handleProjectUpdate);
    socketService.on('notification:new', handleNewNotification);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prev =>
      prev.map(p => p._id === updatedProject._id ? updatedProject : p)
    );
  };

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10));
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1>Dashboard</h1>
        <div>
          <span style={{ marginRight: '20px' }}>Welcome, {user?.name}!</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h2>My Projects</h2>
            <Link to="/projects/new">
              <button>+ New Project</button>
            </Link>
          </div>
          {projects.length === 0 ? (
            <p>No projects yet. Create your first project!</p>
          ) : (
            <div>
              {projects.map(project => (
                <div key={project._id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px' }}>
                  <h3>
                    <Link to={`/projects/${project._id}`}>{project.title}</Link>
                  </h3>
                  <p>{project.description}</p>
                  <small>Team: {project.teamMembers.length} members</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2>Notifications</h2>
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            <div>
              {notifications.map(notif => (
                <div
                  key={notif._id}
                  style={{
                    border: '1px solid #ddd',
                    padding: '10px',
                    marginBottom: '10px',
                    backgroundColor: notif.isRead ? '#fff' : '#f0f8ff'
                  }}
                >
                  <strong>{notif.title}</strong>
                  <p style={{ fontSize: '14px', margin: '5px 0' }}>{notif.message}</p>
                  <small>{new Date(notif.createdAt).toLocaleString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <Link to="/community">
          <button>Explore Community Projects</button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
