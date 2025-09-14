import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Task } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PROFESSIONS, PRIORITIES } from '@/types/kanban';
import { Calendar, User, Trash2, Edit, MessageCircle, Paperclip } from 'lucide-react';

interface TaskViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskUpdated: () => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskViewDialog = ({
  open,
  onOpenChange,
  task,
  onTaskUpdated,
  onDeleteTask,
}: TaskViewDialogProps) => {
  if (!task) return null;

  const profession = task.profession ? PROFESSIONS[task.profession] : null;
  const priority = PRIORITIES[task.priority];

  const handleDelete = () => {
    onDeleteTask(task.id);
    onOpenChange(false);
  };

  const formatDate = (dateInput: any): string => {
    if (!dateInput) return 'Не указано';
    
    try {
      let date: Date;
      
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      } else if (dateInput.seconds) {
        date = new Date(dateInput.seconds * 1000);
      } else if (dateInput.toDate) {
        date = dateInput.toDate();
      } else {
        date = new Date(dateInput);
      }
      
      if (isNaN(date.getTime())) {
        return 'Неверная дата';
      }
      
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateInput);
      return 'Неверная дата';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Просмотр задачи</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Редактировать
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{task.title}</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {profession && (
                <Badge variant="secondary" className={profession.color}>
                  {profession.icon} {profession.label}
                </Badge>
              )}
              <Badge variant={getPriorityVariant(task.priority)} className={priority.color}>
                {priority.label}
              </Badge>
            </div>
          </div>
          {task.description && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Описание</h3>
              <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
                {task.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Основная информация</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Создана</p>
                    <p className="text-sm font-medium">{formatDate(task.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Обновлена</p>
                    <p className="text-sm font-medium">{formatDate(task.updatedAt)}</p>
                  </div>
                </div>

                {task.dueDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Срок выполнения</p>
                      <p className="text-sm font-medium">{formatDate(task.dueDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Участники</h3>
              
              <div className="space-y-3">
                {task.assignee ? (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Исполнитель</p>
                      <p className="text-sm font-medium">{task.assignee.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Исполнитель</p>
                      <p className="text-sm font-medium text-gray-500">Не назначен</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {task.labels && task.labels.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Метки</h3>
              <div className="flex flex-wrap gap-2">
                {task.labels.map((label, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
            {(task.comments && task.comments > 0) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageCircle className="w-4 h-4" />
                <span>{task.comments} комментариев</span>
              </div>
            )}
            
            {(task.attachments && task.attachments > 0) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Paperclip className="w-4 h-4" />
                <span>{task.attachments} вложений</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};