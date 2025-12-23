import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async register(name: string, email: string, password: string) {
    const response = await this.api.post('/auth/register', { name, email, password });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async getProjects() {
    const response = await this.api.get('/projects');
    return response.data;
  }

  async getProjectById(id: string) {
    const response = await this.api.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: any) {
    const response = await this.api.post('/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: any) {
    const response = await this.api.put(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string) {
    const response = await this.api.delete(`/projects/${id}`);
    return response.data;
  }

  async inviteTeamMember(projectId: string, email: string) {
    const response = await this.api.post(`/projects/${projectId}/invite`, { email });
    return response.data;
  }

  async getProjectTasks(projectId: string) {
    const response = await this.api.get(`/projects/${projectId}/tasks`);
    return response.data;
  }

  async createTask(projectId: string, data: any) {
    const response = await this.api.post(`/projects/${projectId}/tasks`, data);
    return response.data;
  }

  async updateTask(taskId: string, data: any) {
    const response = await this.api.put(`/tasks/${taskId}`, data);
    return response.data;
  }

  async updateTaskStatus(taskId: string, status: string) {
    const response = await this.api.put(`/tasks/${taskId}/status`, { status });
    return response.data;
  }

  async deleteTask(taskId: string) {
    const response = await this.api.delete(`/tasks/${taskId}`);
    return response.data;
  }

  async getProjectMessages(projectId: string, limit?: number) {
    const response = await this.api.get(`/projects/${projectId}/messages`, {
      params: { limit }
    });
    return response.data;
  }

  async sendMessage(projectId: string, content: string, attachments?: string[]) {
    const response = await this.api.post(`/projects/${projectId}/messages`, {
      content,
      attachments
    });
    return response.data;
  }

  async getNotifications(limit?: number) {
    const response = await this.api.get('/notifications', { params: { limit } });
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.api.put(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.api.put('/notifications/read-all');
    return response.data;
  }

  async getCommunityProjects(limit?: number, skip?: number) {
    const response = await this.api.get('/community/projects', {
      params: { limit, skip }
    });
    return response.data;
  }

  async createCommunityProject(data: any) {
    const response = await this.api.post('/community/projects', data);
    return response.data;
  }

  async likeCommunityProject(id: string) {
    const response = await this.api.post(`/community/projects/${id}/like`);
    return response.data;
  }

  async commentOnCommunityProject(id: string, content: string) {
    const response = await this.api.post(`/community/projects/${id}/comment`, { content });
    return response.data;
  }

  async requestToJoinCommunityProject(id: string) {
    const response = await this.api.post(`/community/projects/${id}/join`);
    return response.data;
  }
}

export default new ApiService();
