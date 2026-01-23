
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface ChatParticipant {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
}

export interface ChatRoom {
    _id: string;
    roomType: 'workshop' | 'project' | 'team' | 'direct';
    workshop: string;
    project?: any;
    team?: any;
    participants: ChatParticipant[];
    name: string;
    description?: string;
    lastMessage?: any;
    lastMessageAt?: string;
    createdBy: string;
    admins: string[];
    settings: {
        allowFileSharing: boolean;
        allowAudioMessages: boolean;
        maxFileSize: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    _id: string;
    chatRoom: string;
    sender: ChatParticipant;
    messageType: 'text' | 'audio' | 'image' | 'document';
    content: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    seenBy: Array<{ user: string; seenAt: string }>;
    replyTo?: any;
    isEdited: boolean;
    editedAt?: string;
    isDeleted: boolean;
    deletedAt?: string;
    reactions: Array<{ user: string; emoji: string; createdAt: string }>;
    createdAt: string;
    updatedAt: string;
}

export const chatApi = {

    async createRoom(workshopId: string, data: {
        roomType?: string;
        projectId?: string;
        teamId?: string;
        participants?: string[];
        name: string;
        description?: string;
    }) {
        const response = await api.post(`/chat/workshops/${workshopId}/chat/rooms`, data);
        return response.data;
    },

    async getRooms(workshopId: string) {
        const response = await api.get(`/chat/workshops/${workshopId}/chat/rooms`);
        return response.data;
    },

    async getRoom(roomId: string) {
        const response = await api.get(`/chat/rooms/${roomId}`);
        return response.data;
    },

    async getOrCreateDirectRoom(workshopId: string, recipientId: string) {
        const response = await api.post(`/chat/workshops/${workshopId}/chat/direct`, { recipientId });
        return response.data;
    },

    async updateRoom(roomId: string, data: { name?: string; description?: string }) {
        const response = await api.put(`/chat/rooms/${roomId}`, data);
        return response.data;
    },

    async deleteRoom(roomId: string) {
        const response = await api.delete(`/chat/rooms/${roomId}`);
        return response.data;
    },

    async sendMessage(roomId: string, data: {
        messageType?: string;
        content: string;
        replyTo?: string;
    }) {
        const response = await api.post(`/chat/rooms/${roomId}/messages`, data);
        return response.data;
    },

    async getMessages(roomId: string, page = 1, limit = 50) {
        const response = await api.get(`/chat/rooms/${roomId}/messages`, { params: { page, limit } });
        return response.data;
    },

    async editMessage(messageId: string, content: string) {
        const response = await api.put(`/chat/messages/${messageId}`, { content });
        return response.data;
    },

    async deleteMessage(messageId: string) {
        const response = await api.delete(`/chat/messages/${messageId}`);
        return response.data;
    },

    async markAsSeen(messageId: string) {
        const response = await api.put(`/chat/messages/${messageId}/seen`);
        return response.data;
    },

    async markAllAsSeen(roomId: string) {
        const response = await api.put(`/chat/rooms/${roomId}/seen`);
        return response.data;
    },

    async getUnreadCount(roomId: string) {
        const response = await api.get(`/chat/rooms/${roomId}/unread`);
        return response.data;
    },

    async addReaction(messageId: string, emoji: string) {
        const response = await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
        return response.data;
    },

    async removeReaction(messageId: string, emoji: string) {
        const response = await api.delete(`/chat/messages/${messageId}/reactions`, { data: { emoji } });
        return response.data;
    },

    async searchMessages(roomId: string, query: string, page = 1, limit = 20) {
        const response = await api.get(`/chat/rooms/${roomId}/search`, { params: { q: query, page, limit } });
        return response.data;
    },

    async uploadMedia(roomId: string, file: File, messageType: 'image' | 'audio' | 'document', replyTo?: string) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('roomId', roomId);
        formData.append('messageType', messageType);
        if (replyTo) {
            formData.append('replyTo', replyTo);
        }

        const response = await api.post('/chat/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};