import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, X, Send, Check } from 'lucide-react';
import { FirestoreService } from '@/services/firestoreService';
import { User } from '@/types/kanban';

interface InviteMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  currentMembers: User[];
  onMembersInvited?: () => void;
}

export const InviteMembersDialog = ({
  open,
  onOpenChange,
  boardId,
  currentMembers,
  onMembersInvited
}: InviteMembersDialogProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<User[]>([]);

  const addMember = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const existingUser = await FirestoreService.getUserByEmail(email);
      if (existingUser) {
        const isAlreadyMember = currentMembers.some(m => m.email === email) || 
                               invitedUsers.some(u => u.email === email);
        
        if (isAlreadyMember) {
          setError('Пользователь уже добавлен в доску');
          return;
        }

        setInvitedUsers([...invitedUsers, existingUser]);
        setEmail('');
      } else {
        setError('Пользователь с таким email не найден');
      }
    } catch (error) {
      console.error('Error finding user:', error);
      setError('Ошибка при поиске пользователя');
    } finally {
      setLoading(false);
    }
  };

  const removeInvitedUser = (email: string) => {
    setInvitedUsers(invitedUsers.filter(u => u.email !== email));
  };

  const sendInvitations = async () => {
    if (invitedUsers.length === 0) return;

    setLoading(true);
    try {
      const boards = await FirestoreService.getBoards(currentMembers[0]?.email || '');
      const board = boards.find(b => b.id === boardId);
      
      if (board) {
        const updatedMembers = [...board.members, ...invitedUsers];
        const updatedMemberEmails = [...board.memberEmails, ...invitedUsers.map(u => u.email)];

        await FirestoreService.saveBoard({
          ...board,
          members: updatedMembers,
          memberEmails: updatedMemberEmails,
          updatedAt: new Date()
        });

        setInvitedUsers([]);
        onMembersInvited?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      setError('Ошибка при отправке приглашений');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addMember();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Пригласить участников</DialogTitle>
          <DialogDescription>
            Добавьте участников по их email-адресу
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email участника</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <Button onClick={addMember} disabled={!email.trim() || loading}>
                <Users className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </div>
          </div>

          {invitedUsers.length > 0 && (
            <div>
              <Label>Будут приглашены:</Label>
              <div className="space-y-2 mt-2">
                {invitedUsers.map((user) => (
                  <div key={user.email} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInvitedUser(user.email)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={sendInvitations} 
            disabled={invitedUsers.length === 0 || loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-transparent border-t-white mr-2" />
                Отправка...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Отправить приглашения ({invitedUsers.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};