// types/telegram.ts - новый файл
import { Profession } from './kanban'; // Добавляем импорт

export interface TelegramUser {
  telegramId: string;
  username: string;
  chatId: string;
  isLinked: boolean;
  linkedAt: Date;
}

export interface TelegramNotification {
  id: string;
  userId: string;
  taskId: string;
  type: 'deadline_warning' | 'task_assigned' | 'task_completed' | 'task_moved';
  message: string;
  scheduledAt: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
}

// Обновление в types/kanban.ts - добавить к существующему User интерфейсу:
export interface User {
  id: string;
  name: string;
  email: string;
  profession: Profession;
  avatar: string;
  role: 'owner' | 'admin' | 'participant' | 'observer';
  telegramId: string | null;
  telegramUsername: string | null;
  telegramChatId?: string | null; // Добавить это поле
  telegramLinked?: boolean; // Добавить это поле
  createdAt: Date;
  updatedAt: Date;
}