import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Task } from '@/types/kanban';
import { KanbanCard } from './KanbanCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const KanbanColumn = ({ 
  column, 
  tasks, 
  onAddTask, 
  onTaskClick, 
  onDeleteTask 
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="bg-gray-100 rounded-lg p-4 min-h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{column.title}</h3>
        <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <Button
        variant="ghost"
        className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-200 mb-4"
        onClick={onAddTask}
      >
        <Plus className="w-4 h-4 mr-2" />
        Добавить задачу
      </Button>

      <div 
        ref={setNodeRef} 
        className={`min-h-[400px] transition-colors duration-200 rounded-lg p-2 ${
          isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'bg-transparent'
        }`}
      >
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};