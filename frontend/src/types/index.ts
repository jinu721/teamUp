export interface User {
  _id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  skills: string[];
  interests: string[];
  isOnline: boolean;
  lastActive: Date;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  owner: User;
  teamMembers: User[];
  startDate: Date;
  endDate?: Date;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: string;
  project: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  assignedTo?: User;
  createdBy: User;
  dueDate?: Date;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  project: string;
  sender: User;
  content: string;
  attachments: string[];
  createdAt: Date;
}

export interface CommunityProject {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  requiredSkills: string[];
  owner: User;
  likes: string[];
  comments: Comment[];
  joinRequests: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  user: User;
  content: string;
  createdAt: Date;
}

export interface Notification {
  _id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  relatedProject?: Project;
  relatedTask?: Task;
  relatedUser?: User;
  isRead: boolean;
  createdAt: Date;
}
