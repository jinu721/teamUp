import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Project, Task, Message } from '../types';
import api from '../services/api';
import socketService from '../services/socket';
import TaskBoard from '../components/TaskBoard';
import Chat from '../components/Chat';

const ProjectWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat'>('tasks');

  useEffect(() => {
    if (id) {
      loadProjectData();
      socketService.joinProject(id);
      setupSocketListeners();
    }

    return () => {
      if (id) {
        socketService.leaveProject(id);
        cleanupSocketListeners();
      }
    };
  }, [id]);

  const loadProjectData = async () => {
    try {
      const [projectRes, tasksRes, messagesRes] = await Promise.all([
        api.getProjectById(id!),
        api.getProjectTasks(id!),
        api.getProjectMessages(id!)
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setMessages(messagesRes.data.reverse());
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('task:created', handleTaskCreated);
    socketService.on('task:updated', handleTaskUpdated);
    socketService.on('task:deleted', handleTaskDeleted);
    socketService.on('task:moved', handleTaskMoved);
    socketService.on('message:new', handleNewMessage);
    socketService.on('project:updated', handleProjectUpdated);
  };

  const cleanupSocketListeners = () => {
    socketService.off('task:created', handleTaskCreated);
    socketService.off('task:updated', handleTaskUpdated);
    socketService.off('task:deleted', handleTaskDeleted);
    socketService.off('task:moved', handleTaskMoved);
    socketService.off('message:new', handleNewMessage);
    socketService.off('project:updated', handleProjectUpdated);
  };

  const handleTaskCreated = (task: Task) => {
    setTasks(prev => [task, ...prev]);
  };

  const handleTaskUpdated = (task: Task) => {
    setTasks(prev => prev.map(t => t._id === task._id ? task : t));
  };

  const handleTaskDeleted = (data: { taskId: string }) => {
    setTasks(prev => prev.filter(t => t._id !== data.taskId));
  };

  const handleTaskMoved = (data: { task: Task }) => {
    setTasks(prev => prev.map(t => t._id === data.task._id ? data.task : t));
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading project...</div>;
  }

  if (!project) {
    return <div style={{ padding: '20px' }}>Project not found</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      <div style={{ marginBottom: '20px' }}>
        <strong>Team:</strong> {project.teamMembers.map(m => m.name).join(', ')}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: activeTab === 'tasks' ? '#007bff' : '#fff',
            color: activeTab === 'tasks' ? '#fff' : '#000'
          }}
        >
          Task Board
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'chat' ? '#007bff' : '#fff',
            color: activeTab === 'chat' ? '#fff' : '#000'
          }}
        >
          Team Chat
        </button>
      </div>

      {activeTab === 'tasks' ? (
        <TaskBoard tasks={tasks} projectId={id!} />
      ) : (
        <Chat messages={messages} projectId={id!} />
      )}
    </div>
  );
};

export default ProjectWorkspace;
