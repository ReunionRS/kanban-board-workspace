import { useState, useEffect } from 'react';
import { Plus, Users, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { FirestoreService } from '@/services/firestoreService';
import { Board, User, Profession } from '@/types/kanban';

interface CreateBoardDialogProps {
  onBoardCreated?: (board: Board) => void;
  children?: React.ReactNode;
}

export const CreateBoardDialog: React.FC<CreateBoardDialogProps> = ({
  onBoardCreated,
  children
}) => {
  const { userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateProfession = (profession: string | undefined): Profession => {
    const validProfessions: Profession[] = ['developer', 'designer', 'manager', 'qa', 'unknown'];
    return validProfessions.includes(profession as Profession) ? (profession as Profession) : 'unknown';
  };

  useEffect(() => {
    console.log('userProfile:', userProfile);
    if (!userProfile) {
      setError('Пользователь не авторизован');
    } else if (!userProfile.email) {
      setError('Email пользователя отсутствует');
    } else {
      setError(null);
    }
  }, [userProfile]);

  const handleCreateBoard = async () => {
    if (!title.trim() || !userProfile || !userProfile.email) {
      setError(!title.trim() ? 'Название доски обязательно' : 'Пользователь не авторизован или отсутствует email');
      return;
    }

    setLoading(true);
    setError(null);
    try {
        const owner: User = {
          id: userProfile.uid || '',
          name: userProfile.name || 'Unknown',
          email: userProfile.email,
          profession: validateProfession(userProfile.profession),
          avatar: userProfile.avatar || '',
          telegramId: userProfile.telegramId || null, 
          role: 'owner',
          telegramUsername: userProfile.telegramUsername || null, 
          createdAt: new Date(),
          updatedAt: new Date()
        };

      console.log('Owner object:', owner);
      if (!owner.email) {
        throw new Error('Owner email is undefined');
      }

      const newBoard: Board = {
        id: `board_${Date.now()}`,
        title: title.trim(),
        description: description.trim() || '',
        columns: [],
        members: [owner, ...members.map(member => ({
          ...member,
          telegramId: member.telegramId || null,
          telegramUsername: member.telegramUsername || null,
        }))],
        memberEmails: [owner.email, ...members.map(m => m.email).filter(email => email != null)],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('New board object:', newBoard);

      const hasUndefined = (obj: any): boolean => {
        return Object.values(obj).some(value => 
          value === undefined || 
          (typeof value === 'object' && value !== null && hasUndefined(value)) ||
          (Array.isArray(value) && value.some(item => 
            item === undefined || (typeof item === 'object' && item !== null && hasUndefined(item))
          ))
        );
      };

      if (hasUndefined(newBoard)) {
        throw new Error('New board contains undefined values');
      }

      await FirestoreService.saveBoard(newBoard);

      const defaultColumns = [
        { id: `col_${Date.now()}_1`, title: 'Бэклог', tasks: [], boardId: newBoard.id, order: 0 },
        { id: `col_${Date.now()}_2`, title: 'В работе', tasks: [], boardId: newBoard.id, order: 1 },
        { id: `col_${Date.now()}_3`, title: 'На проверке', tasks: [], boardId: newBoard.id, order: 2 },
        { id: `col_${Date.now()}_4`, title: 'Готово', tasks: [], boardId: newBoard.id, order: 3 }
      ];

      for (const column of defaultColumns) {
        await FirestoreService.saveColumn(column);
      }

      onBoardCreated?.(newBoard);
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating board:', error);
      setError(`Не удалось создать доску: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMembers([]);
    setMemberEmail('');
    setError(null);
  };

  const addMember = async () => {
    if (!memberEmail.trim()) return;

    try {
      const existingUser = await FirestoreService.getUserByEmail(memberEmail);
      if (existingUser && !members.find(m => m.email === memberEmail)) {
        const validatedUser: User = {
          ...existingUser,
          profession: validateProfession(existingUser.profession),
          telegramId: existingUser.telegramId || null,
          telegramUsername: existingUser.telegramUsername || null,
        };
        setMembers([...members, validatedUser]);
        setMemberEmail('');
      } else {
          const placeholderUser: User = {
            id: `placeholder_${Date.now()}`,
            name: memberEmail.split('@')[0],
            email: memberEmail,
            profession: 'unknown',
            avatar: '',
            role: 'participant',
            telegramId: null, 
            telegramUsername: null, 
            createdAt: new Date(),
            updatedAt: new Date()
          };
        if (!members.find(m => m.email === memberEmail)) {
          setMembers([...members, placeholderUser]);
          setMemberEmail('');
        }
      }
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Не удалось добавить участника');
    }
  };

  const removeMember = (email: string) => {
    setMembers(members.filter(m => m.email !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addMember();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создать новую доску</DialogTitle>
          <DialogDescription>Организуйте свою работу и делегируйте задачи команде</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название доски</Label>
            <Input
              id="title"
              placeholder="Например: 'Разработка сайта'"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                console.log('Title updated:', e.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Опишите цель проекта..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Участники</Label>
            <div className="flex gap-2">
              <Input
                placeholder="email@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={addMember} variant="outline" disabled={!memberEmail.trim()}>
                <Users className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Владелец доски:</p>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={userProfile?.avatar || ''} />
                  <AvatarFallback>
                    {userProfile?.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{userProfile?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{userProfile?.email || 'No email'}</p>
                </div>
                <Badge variant="secondary">Владелец</Badge>
              </div>
            </div>

            {members.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Участники ({members.length}):</p>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.email} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.email)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleCreateBoard} disabled={!title.trim() || loading || !userProfile || !userProfile.email}>
            {loading ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-transparent border-t-white mr-2" />
                Создание...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Создать доску
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};