import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, Users, Settings, Search, Filter, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { FirestoreService } from '@/services/firestoreService';
import { Board, Column, Task } from '@/types/kanban';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { PROFESSIONS } from '@/types/kanban';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  closestCorners,
  DragOverlay
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskViewDialog } from '@/components/TaskViewDialog';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { KanbanCard } from '@/components/kanban/KanbanCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Timestamp } from 'firebase/firestore';

const safeToDate = (dateInput: any): Date => {
  if (!dateInput) return new Date(0); 
  
  try {
    if (dateInput instanceof Date) {
      return dateInput;
    }
    
    if (dateInput && typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    }
    
    if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput) {
      return new Date(dateInput.seconds * 1000);
    }
    
    if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? new Date(0) : date;
    }
    
    return new Date(0);
  } catch (error) {
    console.error('Error converting date:', error, dateInput);
    return new Date(0);
  }
};

const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { userProfile } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [columnTasks, setColumnTasks] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [professionFilter, setProfessionFilter] = useState<string>('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskView, setShowTaskView] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3
      },
    })
  );

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskView(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await FirestoreService.deleteCard(taskToDelete);
      setColumnTasks(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(columnId => {
          updated[columnId] = updated[columnId].filter(task => task.id !== taskToDelete);
        });
        return updated;
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const loadBoardData = async () => {
    if (!boardId || !userProfile?.email) return;

    setLoading(true);
    try {
      const allBoards = await FirestoreService.getBoards(userProfile.email);
      const boardData = allBoards.find(b => b.id === boardId);
      
      if (!boardData) {
        console.error('Board not found');
        setLoading(false);
        return;
      }
      
      setBoard(boardData);

      const boardColumns = await FirestoreService.getBoardColumns(boardId);
      setColumns(boardColumns.sort((a, b) => (a.order || 0) - (b.order || 0)));

      const tasksByColumn: Record<string, Task[]> = {};
      for (const col of boardColumns) {
        try {
          const tasks = await FirestoreService.getColumnCards(col.id);
          tasksByColumn[col.id] = tasks.sort((a, b) => {
            const dateA = safeToDate(a.updatedAt);
            const dateB = safeToDate(b.updatedAt);
            return dateB.getTime() - dateA.getTime();
          });
        } catch (error) {
          console.error(`Error loading tasks for column ${col.id}:`, error);
          tasksByColumn[col.id] = [];
        }
      }
      setColumnTasks(tasksByColumn);
      
    } catch (error) {
      console.error('Error loading board data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoardData();
  }, [boardId, userProfile?.email]);

  useEffect(() => {
    if (!boardId) return;

    console.log('Setting up real-time subscription for board:', boardId);

    const unsubscribe = FirestoreService.subscribeToBoardCards(boardId, (tasks) => {
      console.log('Real-time update received:', tasks.length, 'tasks');
      
      const tasksByColumn: Record<string, Task[]> = {};
      
      tasks.forEach(task => {
        if (!tasksByColumn[task.columnId]) {
          tasksByColumn[task.columnId] = [];
        }
        tasksByColumn[task.columnId].push(task);
      });

      Object.keys(tasksByColumn).forEach(columnId => {
        tasksByColumn[columnId].sort((a, b) => {
          const dateA = safeToDate(a.updatedAt);
          const dateB = safeToDate(b.updatedAt);
          return dateB.getTime() - dateA.getTime();
        });
      });

      console.log('Tasks by column:', tasksByColumn);
      setColumnTasks(tasksByColumn);
    });

    return () => {
      console.log('Unsubscribing from real-time updates');
      unsubscribe();
    };
  }, [boardId]);

  const [originalColumnTasks, setOriginalColumnTasks] = useState<Record<string, Task[]>>({});

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    setOriginalColumnTasks({ ...columnTasks });
    
    Object.keys(columnTasks).forEach(columnId => {
      const task = columnTasks[columnId].find(t => t.id === activeId);
      if (task) {
        setActiveTask(task);
      }
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = Object.keys(originalColumnTasks).find(key => 
      originalColumnTasks[key].some(task => task.id === activeId)
    );
    
    if (!activeContainer) return;

    let overContainer: string;
    
    if (columns.some(col => col.id === overId)) {
      overContainer = overId;
    } else {
      overContainer = Object.keys(originalColumnTasks).find(key => 
        originalColumnTasks[key].some(task => task.id === overId)
      ) || activeContainer;
    }

    if (activeContainer === overContainer) {
      setColumnTasks({ ...originalColumnTasks });
      return;
    }

    console.log('DragOver: moving from', activeContainer, 'to', overContainer);

    const activeItems = [...originalColumnTasks[activeContainer]];
    const overItems = originalColumnTasks[overContainer] ? [...originalColumnTasks[overContainer]] : [];

    const activeIndex = activeItems.findIndex(task => task.id === activeId);
    if (activeIndex === -1) return;

    const [movedTask] = activeItems.splice(activeIndex, 1);
    overItems.push(movedTask);

    setColumnTasks({
      ...originalColumnTasks,
      [activeContainer]: activeItems,
      [overContainer]: overItems,
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      setColumnTasks({ ...originalColumnTasks });
      setOriginalColumnTasks({});
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('=== DRAG DEBUG ===');
    console.log('Active task ID:', activeId);
    console.log('Over ID:', overId);

    try {
      let originalContainer = '';
      let task: Task | null = null;
      
      Object.keys(originalColumnTasks).forEach(columnId => {
        const foundTask = originalColumnTasks[columnId].find(t => t.id === activeId);
        if (foundTask) {
          originalContainer = columnId;
          task = foundTask;
        }
      });

      if (!originalContainer || !task) {
        console.log('Task or original container not found');
        setColumnTasks({ ...originalColumnTasks });
        setOriginalColumnTasks({});
        return;
      }

      console.log('Original container:', originalContainer);

      let targetColumn = '';
      
      if (columns.some(col => col.id === overId)) {
        targetColumn = overId;
        console.log('Dropped on column:', targetColumn);
      } else {
        Object.keys(originalColumnTasks).forEach(columnId => {
          if (originalColumnTasks[columnId].some(t => t.id === overId)) {
            targetColumn = columnId;
          }
        });
        console.log('Dropped on task, target column:', targetColumn);
      }

      if (!targetColumn) {
        console.log('Target column not found');
        setColumnTasks({ ...originalColumnTasks });
        setOriginalColumnTasks({});
        return;
      }

      console.log('Moving from:', originalContainer, 'to:', targetColumn);

      if (originalContainer !== targetColumn) {
        console.log('Column changed - updating Firestore');
        
        const updatedTask = {
          ...task,
          columnId: targetColumn,
          updatedAt: Timestamp.fromDate(new Date())
        };
        
        console.log('Saving to Firestore:', { 
          taskId: updatedTask.id, 
          newColumnId: updatedTask.columnId 
        });
        
        await FirestoreService.updateCard(updatedTask);
        console.log(`Task ${activeId} moved successfully to column ${targetColumn}`);
        
      } else {
        console.log('No column change - restoring original state');
        setColumnTasks({ ...originalColumnTasks });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setColumnTasks({ ...originalColumnTasks });
    } finally {
      setOriginalColumnTasks({});
    }
    console.log('=== END DRAG DEBUG ===');
  };

  const handleTaskCreated = () => {
    loadBoardData();
  };

  const handleCreateTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setShowCreateTask(true);
  };

  const getFilteredTasks = (tasks: Task[]) => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProfession = professionFilter === 'all' || task.profession === professionFilter;
      
      return matchesSearch && matchesProfession;
    });
  };

  const getTotalTasks = () => {
    return Object.values(columnTasks).reduce((total, tasks) => total + tasks.length, 0);
  };

  const getTasksByStatus = (status: string) => {
    const statusMap = {
      'backlog': 'Бэклог',
      'in-progress': 'В работе',
      'review': 'На проверке',
      'done': 'Готово'
    };
    const columnTitle = statusMap[status as keyof typeof statusMap];
    const column = columns.find(col => col.title === columnTitle);
    return column ? columnTasks[column.id]?.length || 0 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin rounded-full border-3 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Загрузка доски...</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Доска не найдена</h2>
          <p className="text-gray-600 mb-6">Возможно, у вас нет доступа к этой доске</p>
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Вернуться к доскам
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Назад
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
              <p className="text-gray-600">{board.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={professionFilter} onValueChange={setProfessionFilter}>
              <SelectTrigger className="w-48 border-gray-300">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Фильтр по профессии" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="all" className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                  Все профессии
                </SelectItem>
                {Object.entries(PROFESSIONS).map(([key, prof]) => (
                  <SelectItem 
                    key={key} 
                    value={key} 
                    className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>{prof.icon}</span>
                      <span>{prof.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Всего задач</h3>
                <p className="text-2xl font-bold text-blue-700">{getTotalTasks()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-orange-900">В работе</h3>
                <p className="text-2xl font-bold text-orange-700">{getTasksByStatus('in-progress')}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-purple-900">На проверке</h3>
                <p className="text-2xl font-bold text-purple-700">{getTasksByStatus('review')}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-900">Завершено</h3>
                <p className="text-2xl font-bold text-green-700">{getTasksByStatus('done')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Input
              placeholder="Поиск задач..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={professionFilter} onValueChange={setProfessionFilter}>
              <SelectTrigger className="w-48 border-gray-300">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Фильтр по профессии" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="all" className="hover:bg-gray-50 focus:bg-gray-50">Все профессии</SelectItem>
                {Object.entries(PROFESSIONS).map(([key, prof]) => (
                  <SelectItem key={key} value={key} className="hover:bg-gray-50 focus:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span>{prof.icon}</span>
                      <span>{prof.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="px-6 py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SortableContext items={columns.map(col => col.id)} strategy={verticalListSortingStrategy}>
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={getFilteredTasks(columnTasks[column.id] || [])}
                  onAddTask={() => handleCreateTask(column.id)}
                  onTaskClick={handleTaskClick}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 w-80">
                <h4 className="font-medium text-gray-900 mb-2">{activeTask.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{activeTask.description}</p>
                {activeTask.profession && (
                  <Badge variant="secondary" className="mt-2">
                    {PROFESSIONS[activeTask.profession]?.label || activeTask.profession}
                  </Badge>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        columnId={selectedColumnId}
        onTaskCreated={handleTaskCreated}
        boardId={boardId!}
      />
      <TaskViewDialog
        open={showTaskView}
        onOpenChange={setShowTaskView}
        task={selectedTask}
        onTaskUpdated={handleTaskCreated}
        onDeleteTask={handleDeleteTask}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Задача будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BoardPage;