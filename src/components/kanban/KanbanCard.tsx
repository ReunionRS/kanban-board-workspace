import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/kanban';
import { Badge } from '@/components/ui/badge';
import { PROFESSIONS, PRIORITIES } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Calendar, User } from 'lucide-react';

interface KanbanCardProps {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
}

export const KanbanCard = ({ task, onClick, onDelete }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const profession = task.profession ? PROFESSIONS[task.profession] : null;
  const priority = PRIORITIES[task.priority];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const formatDate = (dateInput: any): string => {
    if (!dateInput || (typeof dateInput === 'object' && Object.keys(dateInput).length === 0)) {
      return '';
    }
    
    try {
      let date: Date;
      
      if (dateInput && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
      }
      else if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput) {
        date = new Date(dateInput.seconds * 1000);
        if ('nanoseconds' in dateInput) {
          date = new Date(dateInput.seconds * 1000 + dateInput.nanoseconds / 1000000);
        }
      }
      else if (dateInput instanceof Date) {
        date = dateInput;
      }
      else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput);
      }
      else {
        console.warn('Неизвестный формат даты:', dateInput);
        return '';
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Некорректная дата:', dateInput);
        return '';
      }
      
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateInput);
      return '';
    }
  };

  const checkIsOverdue = (dateInput: any): boolean => {
    if (!dateInput || (typeof dateInput === 'object' && Object.keys(dateInput).length === 0)) {
      return false;
    }
    
    try {
      let date: Date;
      
      if (dateInput && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
      }
      else if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput) {
        date = new Date(dateInput.seconds * 1000);
      }
      else if (dateInput instanceof Date) {
        date = dateInput;
      }
      else {
        date = new Date(dateInput);
      }
      
      if (isNaN(date.getTime())) {
        return false;
      }
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayTimestamp = todayStart.getTime();

      const dueDateStart = new Date(date);
      dueDateStart.setHours(0, 0, 0, 0);
      const dueDateTimestamp = dueDateStart.getTime();
      
      return dueDateTimestamp < todayTimestamp;
    } catch (error) {
      console.error('Error checking overdue:', error);
      return false;
    }
  };

  const isOverdue = checkIsOverdue(task.dueDate);
  const formattedDueDate = formatDate(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg border border-gray-200 p-4 cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow duration-200
        ${isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''}
        ${isOverdue ? 'border-red-200 bg-red-50' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
            {task.title}
          </h4>
          
          <div className="flex flex-wrap gap-1 mb-2">
            {profession && (
              <Badge variant="secondary" className="text-xs">
                {profession.icon} {profession.label}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ${priority.color}`}>
              {priority.label}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            onClick={handleView}
          >
            <Eye className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      
      {formattedDueDate && (
        <div className={`flex items-center gap-1.5 mb-3 text-xs ${
          isOverdue ? 'text-red-600' : 'text-gray-500'
        }`}>
          <Calendar className="w-3 h-3" />
          <span>{formattedDueDate}</span>
          {isOverdue && <span className="font-medium">• Просрочено</span>}
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
              {task.assignee.name?.charAt(0) || 'U'}
            </div>
            <span className="text-xs text-gray-600 truncate max-w-20">
              {task.assignee.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <User className="w-4 h-4" />
            <span className="text-xs">Не назначен</span>
          </div>
        )}
        
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {task.comments > 0 && (
            <div className="flex items-center gap-1">
              <span>{task.comments}</span>
            </div>
          )}
          
          {task.attachments > 0 && (
            <div className="flex items-center gap-1">
              <span>{task.attachments}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};