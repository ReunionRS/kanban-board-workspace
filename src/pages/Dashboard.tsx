import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Grid, List, MoreVertical, Users, Calendar, Settings, Trash2, LogOut, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { FirestoreService } from '@/services/firestoreService';
import { CreateBoardDialog } from './CreateBoardDialog';
import { InviteMembersDialog } from '@/components/InviteMembersDialog';
import { Board } from '@/types/kanban';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface BoardPreview extends Board {
  tasksCount: number;
  isOwner: boolean;
}

const Dashboard = () => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterBy, setFilterBy] = useState('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<BoardPreview | null>(null);

  useEffect(() => {
    if (userProfile) {
      loadBoards();
    }
  }, [userProfile]);

  const loadBoards = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const userBoards = await FirestoreService.getBoards(userProfile.email);
      
      const boardsWithStats = await Promise.all(userBoards.map(async (board) => {
        const columns = await FirestoreService.getBoardColumns(board.id);
        let tasksCount = 0;
        for (const column of columns) {
          const columnTasks = await FirestoreService.getColumnCards(column.id);
          tasksCount += columnTasks.length;
        }
        
        return {
          ...board,
          tasksCount,
          isOwner: board.members.some(member => 
            member.email === userProfile.email && member.role === 'owner'
          )
        };
      }));
      
      setBoards(boardsWithStats);
    } catch (error) {
      console.error('Error loading boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBoardCreated = (newBoard: Board) => {
    loadBoards();
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await FirestoreService.deleteBoard(boardId);
      loadBoards();
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const handleInviteClick = (board: BoardPreview) => {
    setSelectedBoard(board);
    setShowInviteDialog(true);
  };

  const handleInviteSuccess = () => {
    loadBoards(); 
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const formatLastActivity = (date: Date) => {
    return format(date, 'MMM dd', { locale: ru });
  };

  const filteredBoards = boards.filter(board => {
    const matchesSearch = board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         board.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'owner' && board.isOwner) ||
                         (filterBy === 'participant' && !board.isOwner);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">K</span>
              </div>
              <h1 className="text-xl font-semibold">Kanban Board</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userProfile?.avatar} alt={userProfile?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userProfile?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-white border border-gray-200 shadow-lg z-50" 
                align="end" 
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Профиль</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Настройки</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50" 
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Доски</h1>
            <p className="text-muted-foreground">Управляйте своими проектами и задачами</p>
          </div>
          <CreateBoardDialog onBoardCreated={handleBoardCreated}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Создать доску
            </Button>
          </CreateBoardDialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Поиск досок..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="grid" className="hover:bg-gray-50 focus:bg-gray-50">
                <div className="flex items-center">
                  <Grid className="w-4 h-4 mr-2" />
                  Сетка
                </div>
              </SelectItem>
              <SelectItem value="list" className="hover:bg-gray-50 focus:bg-gray-50">
                <div className="flex items-center">
                  <List className="w-4 h-4 mr-2" />
                  Список
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all" className="hover:bg-gray-50 focus:bg-gray-50">Все</SelectItem>
              <SelectItem value="owner" className="hover:bg-gray-50 focus:bg-gray-50">Мои доски</SelectItem>
              <SelectItem value="participant" className="hover:bg-gray-50 focus:bg-gray-50">Участие</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </div>

        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredBoards.map((board) => (
            <Card key={board.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className={`p-6 ${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}>
                {viewMode === 'grid' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{board.title}</h3>
                          <p className="text-sm text-muted-foreground">{board.members.length} участников</p>
                        </div>
                      </div>
                      {board.isOwner && (
                        <Badge variant="secondary">Владелец</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{board.description}</p>
                  </div>
                )}

                {viewMode === 'list' && (
                  <Link to={`/board/${board.id}`} className="flex items-center gap-4 flex-1">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    
                    <div className="flex-1">
                      <h3 className="font-medium hover:text-primary transition-colors">{board.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {board.description || 'Описание отсутствует'}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>{board.tasksCount} задач</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{board.members.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatLastActivity(new Date(board.updatedAt))}</span>
                      </div>
                    </div>
                  </Link>
                )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="bg-white border border-gray-200 shadow-lg z-50"
                >
                  <DropdownMenuItem asChild className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                    <Link to={`/board/${board.id}`}>
                      Открыть
                    </Link>
                  </DropdownMenuItem>
                  {board.isOwner && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => handleInviteClick(board)}
                        className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Пригласить участников
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Настройки
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                        onClick={() => handleDeleteBoard(board.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBoards.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Нет досок</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterBy !== 'all' 
                ? 'Попробуйте изменить параметры поиска или фильтры'
                : 'Создайте свою первую доску для управления задачами'
              }
            </p>
            {!searchQuery && filterBy === 'all' && (
              <CreateBoardDialog onBoardCreated={handleBoardCreated}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать доску
                </Button>
              </CreateBoardDialog>
            )}
          </div>
        )}
      </div>

      {selectedBoard && (
        <InviteMembersDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          boardId={selectedBoard.id}
          currentMembers={selectedBoard.members}
          onMembersInvited={handleInviteSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;