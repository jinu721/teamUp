import { useState, useEffect, useCallback } from 'react';
import { WorkshopProject } from '@/types/workshop';
import api from '@/services/api';
import { useSocketEvent } from './useSocket';

interface UseWorkshopProjectsReturn {
  projects: WorkshopProject[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addProject: (project: WorkshopProject) => void;
  updateProject: (project: WorkshopProject) => void;
  removeProject: (projectId: string) => void;
}

const normalizeProject = (project: WorkshopProject): WorkshopProject => ({
  ...project,
  assignedTeams: project.assignedTeams || [],
  assignedIndividuals: project.assignedIndividuals || [],
  maintainers: project.maintainers || []
});

/**
 * Hook for fetching workshop projects with real-time updates
 */
export function useWorkshopProjects(workshopId: string | undefined): UseWorkshopProjectsReturn {
  const [projects, setProjects] = useState<WorkshopProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!workshopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getWorkshopProjects(workshopId);
      setProjects(response.data.map(normalizeProject));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = useCallback((project: WorkshopProject) => {
    setProjects(prev => {
      if (prev.some(p => p._id === project._id)) return prev;
      return [...prev, project];
    });
  }, []);

  const updateProject = useCallback((updatedProject: WorkshopProject) => {
    setProjects(prev => prev.map(p =>
      p._id === updatedProject._id ? updatedProject : p
    ));
  }, []);

  const removeProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p._id !== projectId));
  }, []);

  // Socket event handlers
  useSocketEvent('workshop:project:created', (project: WorkshopProject) => {
    const projectWorkshopId = typeof project.workshop === 'string'
      ? project.workshop
      : project.workshop._id;
    if (projectWorkshopId === workshopId) {
      addProject(project);
    }
  });

  useSocketEvent('workshop:project:updated', (project: WorkshopProject) => {
    const projectWorkshopId = typeof project.workshop === 'string'
      ? project.workshop
      : project.workshop._id;
    if (projectWorkshopId === workshopId) {
      updateProject(project);
    }
  });

  useSocketEvent('workshop:project:deleted', (data: { projectId: string; workshopId: string }) => {
    if (data.workshopId === workshopId) {
      removeProject(data.projectId);
    }
  });

  // Assignment events
  const handleProjectUpdate = (project: WorkshopProject) => {
    const projectWorkshopId = typeof project.workshop === 'string'
      ? project.workshop
      : project.workshop._id;
    if (projectWorkshopId === workshopId) {
      updateProject(project);
    }
  };

  useSocketEvent('workshop:project:team:assigned', handleProjectUpdate);
  useSocketEvent('workshop:project:team:removed', handleProjectUpdate);
  useSocketEvent('workshop:project:individual:assigned', handleProjectUpdate);
  useSocketEvent('workshop:project:individual:removed', handleProjectUpdate);
  useSocketEvent('workshop:project:manager:assigned', handleProjectUpdate);
  useSocketEvent('workshop:project:maintainer:assigned', handleProjectUpdate);
  useSocketEvent('workshop:project:maintainer:removed', handleProjectUpdate);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    addProject,
    updateProject,
    removeProject
  };
}

interface UseWorkshopProjectReturn {
  project: WorkshopProject | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setProject: (project: WorkshopProject | null) => void;
}

/**
 * Hook for fetching a single workshop project with real-time updates
 */
export function useWorkshopProject(
  workshopId: string | undefined,
  projectId: string | undefined
): UseWorkshopProjectReturn {
  const [project, setProject] = useState<WorkshopProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!workshopId || !projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getWorkshopProjectById(workshopId, projectId);
      setProject(normalizeProject(response.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [workshopId, projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Socket event handlers for this specific project
  const handleSpecificUpdate = (updatedProject: WorkshopProject) => {
    if (updatedProject._id === projectId) {
      setProject(normalizeProject(updatedProject));
    }
  };

  useSocketEvent('workshop:project:updated', handleSpecificUpdate);
  useSocketEvent('workshop:project:team:assigned', handleSpecificUpdate);
  useSocketEvent('workshop:project:team:removed', handleSpecificUpdate);
  useSocketEvent('workshop:project:individual:assigned', handleSpecificUpdate);
  useSocketEvent('workshop:project:individual:removed', handleSpecificUpdate);
  useSocketEvent('workshop:project:manager:assigned', handleSpecificUpdate);
  useSocketEvent('workshop:project:maintainer:assigned', handleSpecificUpdate);
  useSocketEvent('workshop:project:maintainer:removed', handleSpecificUpdate);

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
    setProject
  };
}
