import React, { useEffect, useState } from 'react';
import { CommunityProject } from '../types';
import api from '../services/api';
import socketService from '../services/socket';

const Community: React.FC = () => {
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tags: '',
    requiredSkills: ''
  });

  useEffect(() => {
    loadProjects();
    socketService.joinCommunity();
    setupSocketListeners();

    return () => {
      socketService.leaveCommunity();
      cleanupSocketListeners();
    };
  }, []);

  const loadProjects = async () => {
    try {
      const response = await api.getCommunityProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load community projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('community:project:new', handleNewProject);
    socketService.on('community:project:liked', handleProjectLiked);
    socketService.on('community:project:commented', handleProjectCommented);
  };

  const cleanupSocketListeners = () => {
    socketService.off('community:project:new', handleNewProject);
    socketService.off('community:project:liked', handleProjectLiked);
    socketService.off('community:project:commented', handleProjectCommented);
  };

  const handleNewProject = (project: CommunityProject) => {
    setProjects(prev => [project, ...prev]);
  };

  const handleProjectLiked = (data: { projectId: string; likesCount: number }) => {
    setProjects(prev =>
      prev.map(p =>
        p._id === data.projectId
          ? { ...p, likes: Array(data.likesCount).fill('') }
          : p
      )
    );
  };

  const handleProjectCommented = (data: { projectId: string; comment: any }) => {
    setProjects(prev =>
      prev.map(p =>
        p._id === data.projectId
          ? { ...p, comments: [...p.comments, data.comment] }
          : p
      )
    );
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCommunityProject({
        title: newProject.title,
        description: newProject.description,
        tags: newProject.tags.split(',').map(t => t.trim()),
        requiredSkills: newProject.requiredSkills.split(',').map(s => s.trim())
      });
      setNewProject({ title: '', description: '', tags: '', requiredSkills: '' });
      setShowNewProject(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleLike = async (projectId: string) => {
    try {
      await api.likeCommunityProject(projectId);
    } catch (error) {
      console.error('Failed to like project:', error);
    }
  };

  const handleJoinRequest = async (projectId: string) => {
    try {
      await api.requestToJoinCommunityProject(projectId);
      alert('Join request sent!');
    } catch (error) {
      console.error('Failed to send join request:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading community projects...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Community Projects</h1>
      <p>Discover and join exciting projects from the community</p>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowNewProject(!showNewProject)}>
          {showNewProject ? 'Cancel' : '+ Post New Project'}
        </button>
      </div>

      {showNewProject && (
        <form onSubmit={handleCreateProject} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9' }}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Project title"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea
              placeholder="Project description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', minHeight: '100px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={newProject.tags}
              onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Required skills (comma separated)"
              value={newProject.requiredSkills}
              onChange={(e) => setNewProject({ ...newProject, requiredSkills: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <button type="submit">Post Project</button>
        </form>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {projects.map(project => (
          <div key={project._id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <h2>{project.title}</h2>
            <p>{project.description}</p>
            <div style={{ marginTop: '10px' }}>
              <strong>Tags:</strong> {project.tags.join(', ')}
            </div>
            <div style={{ marginTop: '5px' }}>
              <strong>Required Skills:</strong> {project.requiredSkills.join(', ')}
            </div>
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <button onClick={() => handleLike(project._id)}>
                👍 Like ({project.likes.length})
              </button>
              <button onClick={() => handleJoinRequest(project._id)}>
                Join Project
              </button>
            </div>
            <div style={{ marginTop: '15px' }}>
              <strong>Comments ({project.comments.length})</strong>
              {project.comments.slice(-3).map((comment, idx) => (
                <div key={idx} style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5' }}>
                  <strong>{comment.user.name}:</strong> {comment.content}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Community;
