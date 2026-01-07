import { useState, useEffect, useCallback } from 'react';
import { WorkshopTask, TaskActivity } from '@/types/workshop';
import api from '@/services/api';
import { useSocketEvent, useProjectRoom } from './useSocket';

interface UseWorkshopTasksReturn {
  tasks: WorkshopTask[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addTask: (task: WorkshopTask) => void;
  updateTask: (task: WorkshopTask) => void;
  removeTask: (taskId: string) => void;
}

/**
 * Hook for fetching workshop project tasks with real-time updates
 */
export function useWorkshopTasks(
  workshopId: string | undefined,
  projectId: string | undefined
): UseWorkshopTasksReturn {
  const [tasks, setTasks] = useState<WorkshopTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join project room for real-time task updates
  useProjectRoom(projectId);

  const fetchTasks = useCallback(async () => {
    if (!workshopId || !projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getWorkshopProjectTasks(workshopId, projectId);
      setTasks(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [workshopId, projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback((task: WorkshopTask) => {
    setTasks(prev => [...prev, task]);
  }, []);

  const updateTask = useCallback((updatedTask: WorkshopTask) => {
    setTasks(prev => prev.map(t =>
      t._id === updatedTask._id ? updatedTask : t
    ));
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
  }, []);

  // Socket event handlers
  useSocketEvent('workshop:task:created', (task: WorkshopTask) => {
    const taskProjectId = typeof task.project === 'string'
      ? task.project
      : task.project._id;
    if (taskProjectId === projectId) {
      addTask(task);
    }
  });

  useSocketEvent('workshop:task:updated', (task: WorkshopTask) => {
    const taskProjectId = typeof task.project === 'string'
      ? task.project
      : task.project._id;
    if (taskProjectId === projectId) {
      updateTask(task);
    }
  });

  useSocketEvent('workshop:task:deleted', (data: { taskId: string; projectId: string }) => {
    if (data.projectId === projectId) {
      removeTask(data.taskId);
    }
  });

  useSocketEvent('workshop:task:status:changed', (task: WorkshopTask) => {
    const taskProjectId = typeof task.project === 'string'
      ? task.project
      : task.project._id;
    if (taskProjectId === projectId) {
      updateTask(task);
    }
  });

  // Assignment events
  useSocketEvent('workshop:task:team:assigned', (task: WorkshopTask) => {
    const taskProjectId = typeof task.project === 'string'
      ? task.project
      : task.project._id;
    if (taskProjectId === projectId) {
      updateTask(task);
    }
  });

  useSocketEvent('workshop:task:team:removed', (task: WorkshopTask) => {
    const taskProjectId = typeof task.project === 'string'
      ? task.project
      : task.project._id;
    if (taskProjectId === projectId) {
      updateTask(task);
    }
  });

  useSocketEvent('workshop:task:individual:assigned', (task: WorkshopTask) => {
    const taskProjectId = typeof task.project === 'string'
      ? task.project
      : task.project._id;
    if (taskProjectId === projectId) {
      updateTask(task);
    }
  });

  useSocketEvent('workshop:task:individual:removed', (task: WorkshopTask) => {
    const taskProjectId = typeof task.project === 'string'
      ? task.project
      : task.project._id;
    if (taskProjectId === projectId) {
      updateTask(task);
    }
  });

  // Dependency events
  useSocketEvent('workshop:task:dependency:added', (task: WorkshopTask) => {
    const taskProjectId = typeof task.project === 'string'
      ? task.project
      : task.project._id;
    if (taskProjectId === projectId) {
      updateTask(task);
    }
  });

  useSocketEvent('workshop:task:dependency:removed', (task: WorkshopTask) => {
    const taskProjectId = typeof task.project === 'string'
      ? task.project
      : task.project._id;
    if (taskProjectId === projectId) {
      updateTask(task);
    }
  });

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    addTask,
    updateTask,
    removeTask
  };
}

interface UseWorkshopTaskReturn {
  task: WorkshopTask | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setTask: (task: WorkshopTask | null) => void;
}

/**
 * Hook for fetching a single workshop task with real-time updates
 */
export function useWorkshopTask(
  workshopId: string | undefined,
  projectId: string | undefined,
  taskId: string | undefined
): UseWorkshopTaskReturn {
  const [task, setTask] = useState<WorkshopTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join project room for real-time task updates
  useProjectRoom(projectId);

  const fetchTask = useCallback(async () => {
    if (!workshopId || !projectId || !taskId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getWorkshopTaskById(workshopId, projectId, taskId);
      setTask(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [workshopId, projectId, taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // Socket event handlers for this specific task
  useSocketEvent('workshop:task:updated', (updatedTask: WorkshopTask) => {
    if (updatedTask._id === taskId) {
      setTask(updatedTask);
    }
  });

  useSocketEvent('workshop:task:status:changed', (updatedTask: WorkshopTask) => {
    if (updatedTask._id === taskId) {
      setTask(updatedTask);
    }
  });

  useSocketEvent('workshop:task:team:assigned', (updatedTask: WorkshopTask) => {
    if (updatedTask._id === taskId) {
      setTask(updatedTask);
    }
  });

  useSocketEvent('workshop:task:team:removed', (updatedTask: WorkshopTask) => {
    if (updatedTask._id === taskId) {
      setTask(updatedTask);
    }
  });

  useSocketEvent('workshop:task:individual:assigned', (updatedTask: WorkshopTask) => {
    if (updatedTask._id === taskId) {
      setTask(updatedTask);
    }
  });

  useSocketEvent('workshop:task:individual:removed', (updatedTask: WorkshopTask) => {
    if (updatedTask._id === taskId) {
      setTask(updatedTask);
    }
  });

  useSocketEvent('workshop:task:dependency:added', (updatedTask: WorkshopTask) => {
    if (updatedTask._id === taskId) {
      setTask(updatedTask);
    }
  });

  useSocketEvent('workshop:task:dependency:removed', (updatedTask: WorkshopTask) => {
    if (updatedTask._id === taskId) {
      setTask(updatedTask);
    }
  });

  return {
    task,
    loading,
    error,
    refetch: fetchTask,
    setTask
  };
}

interface UseTaskActivityReturn {
  activities: TaskActivity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching task activity history
 */
export function useTaskActivity(
  workshopId: string | undefined,
  projectId: string | undefined,
  taskId: string | undefined
): UseTaskActivityReturn {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!workshopId || !projectId || !taskId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getTaskActivityHistory(workshopId, projectId, taskId);
      setActivities(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load activity history');
    } finally {
      setLoading(false);
    }
  }, [workshopId, projectId, taskId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Refetch on task updates to get new activity
  useSocketEvent('workshop:task:updated', (updatedTask: WorkshopTask) => {
    if (updatedTask._id === taskId) {
      fetchActivities();
    }
  });

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities
  };
}
