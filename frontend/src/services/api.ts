import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  User,
  Notification
} from '../types';
import {
  Workshop,
  Membership,
  Team,
  Role,
  RoleAssignment,
  WorkshopProject,
  WorkshopTask,
  AuditLog,
  PermissionResult,
  CreateWorkshopData,
  UpdateWorkshopData,
  CreateTeamData,
  UpdateTeamData,
  CreateRoleData,
  UpdateRoleData,
  CreateWorkshopProjectData,
  UpdateWorkshopProjectData,
  CreateWorkshopTaskData,
  UpdateWorkshopTaskData,
  AuditLogFilters
} from '../types/workshop';

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
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
            const { token } = response.data.data;

            localStorage.setItem('token', token);

            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async register(name: string, email: string, password: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.post('/auth/register', { name, email, password });
    return response.data;
  }

  async verifyOTP(email: string, otp: string): Promise<ApiResponse<{ token: string; refreshToken: string; user: User }>> {
    const response = await this.api.post('/auth/verify-otp', { email, otp });
    return response.data;
  }

  async resendOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.post('/auth/resend-otp', { email });
    return response.data;
  }

  async login(email: string, password: string): Promise<ApiResponse<{ token: string; refreshToken: string; user: User }>> {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.post('/auth/reset-password', { token, password });
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.api.put('/auth/profile', data);
    return response.data;
  }

  async getInvitationDetails(token: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/invites/${token}`);
    return response.data;
  }

  async acceptInvitation(token: string): Promise<ApiResponse<any> & { message?: string }> {
    const response = await this.api.post(`/invites/${token}/accept`);
    return response.data;
  }

  async getNotifications(limit?: number): Promise<ApiResponse<Notification[]>> {
    const response = await this.api.get('/notifications', { params: { limit } });
    return response.data;
  }

  async getUnreadNotifications(): Promise<ApiResponse<Notification[]>> {
    const response = await this.api.get('/notifications/unread');
    return response.data;
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await this.api.get('/notifications/count');
    return response.data;
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<Notification>> {
    const response = await this.api.put(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    const response = await this.api.put('/notifications/read-all');
    return response.data;
  }

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/notifications/${id}`);
    return response.data;
  }

  async getPublicWorkshops(
    filters?: { search?: string; category?: string; tags?: string[]; sort?: string },
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<Workshop>> {
    const response = await this.api.get('/workshops/public', {
      params: {
        ...filters,
        page,
        limit
      }
    });
    return response.data;
  }

  async upvoteWorkshop(workshopId: string): Promise<ApiResponse<Workshop>> {
    const response = await this.api.post(`/workshops/${workshopId}/upvote`);
    return response.data;
  }

  async downvoteWorkshop(workshopId: string): Promise<ApiResponse<Workshop>> {
    const response = await this.api.post(`/workshops/${workshopId}/downvote`);
    return response.data;
  }

  async getWorkshops(): Promise<ApiResponse<Workshop[]>> {
    const response = await this.api.get('/workshops/my-workshops');
    return response.data;
  }

  async getWorkshopById(id: string): Promise<ApiResponse<Workshop>> {
    const response = await this.api.get(`/workshops/${id}`);
    return response.data;
  }

  async createWorkshop(data: CreateWorkshopData): Promise<ApiResponse<Workshop>> {
    const response = await this.api.post('/workshops', data);
    return response.data;
  }

  async updateWorkshop(id: string, data: UpdateWorkshopData): Promise<ApiResponse<Workshop>> {
    const response = await this.api.put(`/workshops/${id}`, data);
    return response.data;
  }

  async deleteWorkshop(id: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/workshops/${id}`);
    return response.data;
  }

  async assignWorkshopManager(workshopId: string, userId: string): Promise<ApiResponse<Workshop>> {
    const response = await this.api.post(`/workshops/${workshopId}/managers`, { userId });
    return response.data;
  }

  async removeWorkshopManager(workshopId: string, userId: string): Promise<ApiResponse<Workshop>> {
    const response = await this.api.delete(`/workshops/${workshopId}/managers/${userId}`);
    return response.data;
  }

  async getWorkshopMembers(workshopId: string): Promise<ApiResponse<Membership[]>> {
    const response = await this.api.get(`/workshops/${workshopId}/members`);
    return response.data;
  }

  async inviteWorkshopMember(workshopId: string, email: string, roleId?: string): Promise<ApiResponse<Membership>> {
    const response = await this.api.post(`/workshops/${workshopId}/invite`, { email, roleId });
    return response.data;
  }

  async requestToJoinWorkshop(workshopId: string, message?: string): Promise<ApiResponse<Membership>> {
    const response = await this.api.post(`/workshops/${workshopId}/join`, { message });
    return response.data;
  }

  async respondToWorkshopJoinRequest(
    workshopId: string,
    membershipId: string,
    status: 'approved' | 'rejected'
  ): Promise<ApiResponse<Membership>> {
    const endpoint = status === 'approved'
      ? `/workshops/${workshopId}/approve/${membershipId}`
      : `/workshops/${workshopId}/reject/${membershipId}`;
    const response = await this.api.post(endpoint);
    return response.data;
  }

  async revokeWorkshopMembership(workshopId: string, userId: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/workshops/${workshopId}/members/${userId}`);
    return response.data;
  }

  async leaveWorkshop(workshopId: string): Promise<ApiResponse<void>> {
    const response = await this.api.post(`/workshops/${workshopId}/leave`);
    return response.data;
  }

  async getWorkshopTeams(workshopId: string): Promise<ApiResponse<Team[]>> {
    const response = await this.api.get(`/workshops/${workshopId}/teams`);
    return response.data;
  }

  async getTeamById(workshopId: string, teamId: string): Promise<ApiResponse<Team>> {
    const response = await this.api.get(`/workshops/${workshopId}/teams/${teamId}`);
    return response.data;
  }

  async createTeam(workshopId: string, data: CreateTeamData): Promise<ApiResponse<Team>> {
    const response = await this.api.post(`/workshops/${workshopId}/teams`, data);
    return response.data;
  }

  async updateTeam(workshopId: string, teamId: string, data: UpdateTeamData): Promise<ApiResponse<Team>> {
    const response = await this.api.put(`/workshops/${workshopId}/teams/${teamId}`, data);
    return response.data;
  }

  async deleteTeam(workshopId: string, teamId: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/workshops/${workshopId}/teams/${teamId}`);
    return response.data;
  }

  async addTeamMember(workshopId: string, teamId: string, userId: string): Promise<ApiResponse<Team>> {
    const response = await this.api.post(`/workshops/${workshopId}/teams/${teamId}/members/${userId}`);
    return response.data;
  }

  async removeWorkshopTeamMember(workshopId: string, teamId: string, userId: string): Promise<ApiResponse<Team>> {
    const response = await this.api.delete(`/workshops/${workshopId}/teams/${teamId}/members/${userId}`);
    return response.data;
  }

  async assignTeamInternalRole(
    workshopId: string,
    teamId: string,
    userId: string,
    roleName: string
  ): Promise<ApiResponse<Team>> {
    const response = await this.api.post(`/workshops/${workshopId}/teams/${teamId}/roles`, { userId, roleName });
    return response.data;
  }

  async removeTeamInternalRole(
    workshopId: string,
    teamId: string,
    userId: string,
    roleName: string
  ): Promise<ApiResponse<Team>> {
    const response = await this.api.delete(`/workshops/${workshopId}/teams/${teamId}/roles/${userId}/${roleName}`);
    return response.data;
  }

  async getWorkshopRoles(workshopId: string): Promise<ApiResponse<Role[]>> {
    const response = await this.api.get(`/workshops/${workshopId}/roles`);
    return response.data;
  }

  async getRoleById(workshopId: string, roleId: string): Promise<ApiResponse<Role>> {
    const response = await this.api.get(`/workshops/${workshopId}/roles/${roleId}`);
    return response.data;
  }

  async createRole(workshopId: string, data: CreateRoleData): Promise<ApiResponse<Role>> {
    const response = await this.api.post(`/workshops/${workshopId}/roles`, data);
    return response.data;
  }

  async updateRole(workshopId: string, roleId: string, data: UpdateRoleData): Promise<ApiResponse<Role>> {
    const response = await this.api.put(`/workshops/${workshopId}/roles/${roleId}`, data);
    return response.data;
  }

  async deleteRole(workshopId: string, roleId: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/workshops/${workshopId}/roles/${roleId}`);
    return response.data;
  }

  async assignRole(workshopId: string, roleId: string, userId: string, scopeId?: string): Promise<ApiResponse<RoleAssignment>> {
    const response = await this.api.post(`/workshops/${workshopId}/roles/${roleId}/assign`, { userId, scopeId });
    return response.data;
  }

  async revokeRole(workshopId: string, roleId: string, userId: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/workshops/${workshopId}/roles/${roleId}/assign/${userId}`);
    return response.data;
  }

  async getCommunityPosts(
    filters?: any,
    sort?: string,
    page?: number,
    limit?: number
  ): Promise<any> {

    const combinedFilters = { ...filters };
    if (sort) combinedFilters.sort = sort;

    return this.getPublicWorkshops(combinedFilters, page, limit);
  }

  async upvotePost(postId: string): Promise<ApiResponse<any>> {
    return this.upvoteWorkshop(postId);
  }

  async downvotePost(postId: string): Promise<ApiResponse<any>> {
    return this.downvoteWorkshop(postId);
  }

  async requestToJoin(postId: string): Promise<ApiResponse<any>> {
    return this.requestToJoinWorkshop(postId);
  }

  async deleteCommunityPost(postId: string): Promise<ApiResponse<void>> {
    return this.deleteWorkshop(postId);
  }

  async addComment(_postId: string, _content: string): Promise<ApiResponse<any>> {
    console.warn('addComment is partially implemented (maps to task comment log for now)');

    return { success: false, data: null, message: 'Not implemented' } as any;
  }

  async updateComment(_postId: string, _commentId: string, _content: string): Promise<ApiResponse<any>> {
    return { success: false, data: null, message: 'Not implemented' } as any;
  }

  async deleteComment(_postId: string, _commentId: string): Promise<ApiResponse<void>> {
    return { success: false, data: null, message: 'Not implemented' } as any;
  }

  async getJoinRequests(workshopId: string): Promise<ApiResponse<any[]>> {
    const response = await this.api.get(`/workshops/${workshopId}/pending-requests`);
    return response.data;
  }

  async respondToJoinRequest(workshopId: string, membershipId: string, status: 'approved' | 'rejected'): Promise<ApiResponse<any>> {
    return this.respondToWorkshopJoinRequest(workshopId, membershipId, status);
  }

  async getWorkshopProjects(workshopId: string): Promise<ApiResponse<WorkshopProject[]>> {
    const response = await this.api.get(`/workshops/${workshopId}/projects`);
    return response.data;
  }

  async getWorkshopProjectById(workshopId: string, projectId: string): Promise<ApiResponse<WorkshopProject>> {
    const response = await this.api.get(`/workshops/${workshopId}/projects/${projectId}`);
    return response.data;
  }

  async createWorkshopProject(workshopId: string, data: CreateWorkshopProjectData): Promise<ApiResponse<WorkshopProject>> {
    const response = await this.api.post(`/workshops/${workshopId}/projects`, data);
    return response.data;
  }

  async updateWorkshopProject(workshopId: string, projectId: string, data: UpdateWorkshopProjectData): Promise<ApiResponse<WorkshopProject>> {
    const response = await this.api.put(`/workshops/${workshopId}/projects/${projectId}`, data);
    return response.data;
  }

  async deleteWorkshopProject(workshopId: string, projectId: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/workshops/${workshopId}/projects/${projectId}`);
    return response.data;
  }

  async assignTeamToProject(workshopId: string, projectId: string, teamId: string): Promise<ApiResponse<WorkshopProject>> {
    const response = await this.api.post(`/workshops/${workshopId}/projects/${projectId}/teams`, { teamId });
    return response.data;
  }

  async removeTeamFromProject(workshopId: string, projectId: string, teamId: string): Promise<ApiResponse<WorkshopProject>> {
    const response = await this.api.delete(`/workshops/${workshopId}/projects/${projectId}/teams/${teamId}`);
    return response.data;
  }

  async assignIndividualToProject(workshopId: string, projectId: string, userId: string): Promise<ApiResponse<WorkshopProject>> {
    const response = await this.api.post(`/workshops/${workshopId}/projects/${projectId}/individuals`, { userId });
    return response.data;
  }

  async removeIndividualFromProject(workshopId: string, projectId: string, userId: string): Promise<ApiResponse<WorkshopProject>> {
    const response = await this.api.delete(`/workshops/${workshopId}/projects/${projectId}/individuals/${userId}`);
    return response.data;
  }

  async assignProjectManager(workshopId: string, projectId: string, userId: string): Promise<ApiResponse<WorkshopProject>> {
    const response = await this.api.post(`/workshops/${workshopId}/projects/${projectId}/manager`, { userId });
    return response.data;
  }

  async addProjectMaintainer(workshopId: string, projectId: string, userId: string): Promise<ApiResponse<WorkshopProject>> {
    const response = await this.api.post(`/workshops/${workshopId}/projects/${projectId}/maintainers`, { userId });
    return response.data;
  }

  async removeProjectMaintainer(workshopId: string, projectId: string, userId: string): Promise<ApiResponse<WorkshopProject>> {
    const response = await this.api.delete(`/workshops/${workshopId}/projects/${projectId}/maintainers/${userId}`);
    return response.data;
  }

  async getWorkshopProjectTasks(workshopId: string, projectId: string): Promise<ApiResponse<WorkshopTask[]>> {
    const response = await this.api.get(`/workshops/${workshopId}/projects/${projectId}/tasks`);
    return response.data;
  }

  async getWorkshopTaskById(workshopId: string, projectId: string, taskId: string): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.get(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  }

  async createWorkshopTask(workshopId: string, projectId: string, data: CreateWorkshopTaskData): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.post(`/workshops/${workshopId}/projects/${projectId}/tasks`, data);
    return response.data;
  }

  async updateWorkshopTask(workshopId: string, projectId: string, taskId: string, data: UpdateWorkshopTaskData): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.put(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}`, data);
    return response.data;
  }

  async deleteWorkshopTask(workshopId: string, projectId: string, taskId: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  }

  async updateWorkshopTaskStatus(workshopId: string, projectId: string, taskId: string, status: string): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.put(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}/status`, { status });
    return response.data;
  }

  async addWorkshopTaskComment(workshopId: string, projectId: string, taskId: string, content: string, mentions: string[] = []): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.post(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}/comments`, { content, mentions });
    return response.data;
  }

  async addWorkshopTaskAttachment(workshopId: string, projectId: string, taskId: string, fileData: { fileName: string; fileUrl: string; fileType: string; fileSize: number }): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.post(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}/attachments`, fileData);
    return response.data;
  }

  async assignTeamToTask(workshopId: string, projectId: string, taskId: string, teamId: string): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.post(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}/teams`, { teamId });
    return response.data;
  }

  async removeTeamFromTask(workshopId: string, projectId: string, taskId: string, teamId: string): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.delete(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}/teams/${teamId}`);
    return response.data;
  }

  async assignIndividualToTask(workshopId: string, projectId: string, taskId: string, userId: string): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.post(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}/individuals`, { userId });
    return response.data;
  }

  async removeIndividualFromTask(workshopId: string, projectId: string, taskId: string, userId: string): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.delete(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}/individuals/${userId}`);
    return response.data;
  }

  async addTaskDependency(workshopId: string, projectId: string, taskId: string, dependencyId: string): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.post(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}/dependencies`, { dependencyId });
    return response.data;
  }

  async removeTaskDependency(workshopId: string, projectId: string, taskId: string, dependencyId: string): Promise<ApiResponse<WorkshopTask>> {
    const response = await this.api.delete(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}/dependencies/${dependencyId}`);
    return response.data;
  }

  async getTaskActivityHistory(workshopId: string, projectId: string, taskId: string): Promise<ApiResponse<WorkshopTask['activityHistory']>> {
    const response = await this.api.get(`/workshops/${workshopId}/projects/${projectId}/tasks/${taskId}/activity`);
    return response.data;
  }

  async getWorkshopAuditLogs(
    workshopId: string,
    filters?: AuditLogFilters,
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<AuditLog>> {
    const response = await this.api.get(`/workshops/${workshopId}/audit`, {
      params: {
        ...filters,
        page,
        limit
      }
    });
    return response.data;
  }

  async checkPermission(
    workshopId: string,
    action: string,
    resource: string,
    context?: { projectId?: string; teamId?: string }
  ): Promise<ApiResponse<PermissionResult>> {
    const response = await this.api.get(`/workshops/${workshopId}/permissions/check`, {
      params: {
        action,
        resource,
        ...context
      }
    });
    return response.data;
  }
  async uploadFile(file: File, type: 'image' | 'audio' | 'document' = 'document'): Promise<ApiResponse<{ fileUrl: string; fileName: string; fileType: string; fileSize: number }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await this.api.post('/chat/upload-only', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
}

export default new ApiService();