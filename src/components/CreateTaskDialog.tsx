import { useState } from 'react';
import { CalendarDays, Plus, Flag, Briefcase, Loader2, Link } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FirestoreService } from '@/services/firestoreService';
import { Task, PRIORITIES, PROFESSIONS } from '@/types/kanban';
import { Timestamp } from 'firebase/firestore';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  boardId: string;
  onTaskCreated: () => void;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  columnId,
  boardId,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<keyof typeof PRIORITIES>('medium');
  const [profession, setProfession] = useState<keyof typeof PROFESSIONS>('unknown');
  const [dueDate, setDueDate] = useState('');
  const [references, setReferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTask = async () => {
    if (!title.trim()) {
      setError('Название задачи обязательно');
      return;
    }

    if (title.trim().length < 3) {
      setError('Название должно содержать минимум 3 символа');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newTask: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        description: description.trim() || '',
        columnId,
        boardId,
        priority,
        profession,
        labels: [],
        references: references.trim() || undefined,
        dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
        createdAt: Timestamp.fromDate(new Date()), 
        updatedAt: Timestamp.fromDate(new Date()), 
      };

      console.log('Creating task:', newTask);
      await FirestoreService.saveCard(newTask);
      
      resetForm();
      onTaskCreated();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Error creating task:', error);
      setError(`Не удалось создать задачу: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setProfession('unknown');
    setDueDate('');
    setReferences('');
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const getPriorityColor = (priorityKey: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[priorityKey as keyof typeof colors] || colors.medium;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Создать новую задачу</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Добавьте задачу в текущую колонку
              </p>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Название задачи *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Создать макет главной страницы"
              className="h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Минимум 3 символа</span>
              <span>{title.length}/100</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Описание
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание задачи, требования, критерии выполнения..."
              className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {description.length}/500
            </div>
          </div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
      <Flag className="w-4 h-4 inline mr-1" />
      Приоритет
    </Label>
    <Select 
      value={priority} 
      onValueChange={(value) => setPriority(value as keyof typeof PRIORITIES)}
    >
      <SelectTrigger id="priority" className="h-11">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`text-xs px-2 py-1 ${getPriorityColor(priority)}`}
            >
              {PRIORITIES[priority]?.label}
            </Badge>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
        {Object.entries(PRIORITIES).map(([key, value]) => (
          <SelectItem key={key} value={key} className="hover:bg-gray-50 focus:bg-gray-50">
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`text-xs px-2 py-1 ${getPriorityColor(key)}`}
              >
                {value.label}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  <div className="space-y-2">
    <Label htmlFor="profession" className="text-sm font-medium text-gray-700">
      <Briefcase className="w-4 h-4 inline mr-1" />
      Профессия
    </Label>
    <Select 
      value={profession} 
      onValueChange={(value) => setProfession(value as keyof typeof PROFESSIONS)}
    >
      <SelectTrigger id="profession" className="h-11">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span className="text-lg">{PROFESSIONS[profession]?.icon}</span>
            <span>{PROFESSIONS[profession]?.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
        {Object.entries(PROFESSIONS).map(([key, value]) => (
          <SelectItem 
            key={key} 
            value={key} 
            className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{value.icon}</span>
              <span>{value.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
              <CalendarDays className="w-4 h-4 inline mr-1" />
              Срок выполнения
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="references" className="text-sm font-medium text-gray-700">
              <Link className="w-4 h-4 inline mr-1" />
              Референсы (необязательно)
            </Label>
            <Input
              id="references"
              value={references}
              onChange={(e) => setReferences(e.target.value)}
              placeholder="Ссылки на примеры, документацию, макеты..."
              className="h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500">
              Добавьте ссылки на примеры или документацию для лучшего понимания задачи
            </p>
          </div>
        </div>

        <DialogFooter className="pt-6 gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Отмена
          </Button>
          <Button 
            onClick={handleCreateTask} 
            disabled={loading || !title.trim() || title.trim().length < 3}
            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Создать задачу
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};