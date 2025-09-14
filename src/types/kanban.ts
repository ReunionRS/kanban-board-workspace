// types/kanban.ts - обновленная версия с Telegram полями
import { Timestamp } from 'firebase/firestore';

export type Profession = 'developer' | 'designer' | 'manager' | 'qa' | 'unknown';

export interface User {
  id: string;
  name: string;
  email: string;
  profession: Profession;
  avatar: string;
  role: 'owner' | 'admin' | 'participant' | 'observer';
  telegramId: string | null;
  telegramUsername: string | null;
  telegramChatId?: string | null; // Новое поле для chat ID
  telegramLinked?: boolean; // Новое поле для статуса связывания
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  boardId: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  profession?: Profession;
  labels?: string[];
  assignee?: User | null;
  dueDate?: Timestamp | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  comments?: number;
  attachments?: number;
  references?: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  boardId: string;
  order?: number;
}

export interface Board {
  id: string;
  title: string;
  name?: string; // Альтернативное название для совместимости
  description: string;
  columns: Column[];
  members: User[];
  memberEmails: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const PROFESSIONS: Record<Profession, { label: string; icon: string; color: string }> = {
  developer: { 
    label: 'Разработчик', 
    icon: '👨‍💻', 
    color: 'bg-blue-100 text-blue-800 border-blue-200' 
  },
  designer: { 
    label: 'Дизайнер', 
    icon: '🎨', 
    color: 'bg-purple-100 text-purple-800 border-purple-200' 
  },
  manager: { 
    label: 'Менеджер', 
    icon: '👔', 
    color: 'bg-green-100 text-green-800 border-green-200' 
  },
  qa: { 
    label: 'Тестировщик', 
    icon: '🔍', 
    color: 'bg-orange-100 text-orange-800 border-orange-200' 
  },
  unknown: { 
    label: 'Не указано', 
    icon: '❓', 
    color: 'bg-gray-100 text-gray-800 border-gray-200' 
  }
};

export const PRIORITIES: Record<Task['priority'], { label: string; color: string }> = {
  urgent: { 
    label: 'Критический', 
    color: 'text-red-600 bg-red-50 border-red-200' 
  },
  high: { 
    label: 'Высокий', 
    color: 'text-orange-600 bg-orange-50 border-orange-200' 
  },
  medium: { 
    label: 'Средний', 
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200' 
  },
  low: { 
    label: 'Низкий', 
    color: 'text-green-600 bg-green-50 border-green-200' 
  }
};