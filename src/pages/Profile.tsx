import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Bell, User, Settings, Save, MessageCircle, Briefcase, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { PROFESSIONS } from '@/types/kanban';
import { TelegramLinkSection } from '@/components/TelegramLinkSection';

const Profile = () => {
  const { userProfile, updateUserProfile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    profession: userProfile?.profession || 'unknown',
    telegramUsername: userProfile?.telegramUsername || '',
    telegramLinked: userProfile?.telegramLinked || false,
    telegramChatId: userProfile?.telegramChatId || null,
    notifications: {
      telegram: true,
      email: true,
      push: false,
      deadlineReminders: true,
      newTasks: true,
      taskUpdates: true,
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateUserProfile({
        name: profile.name,
        profession: profile.profession as any,
        telegramUsername: profile.telegramUsername || null,
        telegramLinked: profile.telegramLinked,
        telegramChatId: profile.telegramChatId,
      });
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramUpdate = async (telegramData: any) => {
    try {
      const updatedProfile = {
        ...profile,
        ...telegramData
      };
      setProfile(updatedProfile);
      
      await updateUserProfile(telegramData);
    } catch (error) {
      console.error('Error updating telegram data:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const profession = PROFESSIONS[profile.profession as keyof typeof PROFESSIONS];

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                К доскам
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Профиль пользователя</h1>
              <p className="text-sm text-muted-foreground">Управление личными данными и настройками</p>
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
              <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-lg z-50" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
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

      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Личная информация
                </CardTitle>
                <CardDescription>
                  Основные данные вашего профиля
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={userProfile?.avatar} alt={profile.name} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      Изменить фото
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG до 2MB
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        value={profile.email}
                        disabled
                        placeholder="Email нельзя изменить"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="profession">Профессия</Label>
                    <Select 
                      value={profile.profession}
                      onValueChange={(value) => setProfile({...profile, profession: value})}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg z-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                        {Object.entries(PROFESSIONS).map(([key, prof]) => (
                          <SelectItem key={key} value={key} className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
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

                <Button onClick={handleSave} disabled={isLoading} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </CardContent>
            </Card>

            <TelegramLinkSection
              telegramUsername={profile.telegramUsername}
              telegramLinked={profile.telegramLinked}
              telegramChatId={profile.telegramChatId}
              onUpdate={handleTelegramUpdate}
            />

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Настройки уведомлений
                </CardTitle>
                <CardDescription>
                  Выберите, как вы хотите получать уведомления
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Telegram уведомления</h4>
                    <p className="text-sm text-muted-foreground">
                      Получать уведомления в Telegram
                    </p>
                  </div>
                  <Switch
                    checked={profile.notifications.telegram && profile.telegramLinked}
                    disabled={!profile.telegramLinked}
                    onCheckedChange={(checked) => 
                      setProfile({
                        ...profile,
                        notifications: {...profile.notifications, telegram: checked}
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Напоминания о дедлайнах</h4>
                    <p className="text-sm text-muted-foreground">
                      За 5, 3 дня и в день срока
                    </p>
                  </div>
                  <Switch
                    checked={profile.notifications.deadlineReminders}
                    onCheckedChange={(checked) => 
                      setProfile({
                        ...profile,
                        notifications: {...profile.notifications, deadlineReminders: checked}
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Новые задачи</h4>
                    <p className="text-sm text-muted-foreground">
                      Уведомления о назначенных задачах
                    </p>
                  </div>
                  <Switch
                    checked={profile.notifications.newTasks}
                    onCheckedChange={(checked) => 
                      setProfile({
                        ...profile,
                        notifications: {...profile.notifications, newTasks: checked}
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email уведомления</h4>
                    <p className="text-sm text-muted-foreground">
                      Получать уведомления на email
                    </p>
                  </div>
                  <Switch
                    checked={profile.notifications.email}
                    onCheckedChange={(checked) => 
                      setProfile({
                        ...profile,
                        notifications: {...profile.notifications, email: checked}
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Браузерные уведомления</h4>
                    <p className="text-sm text-muted-foreground">
                      Push уведомления в браузере
                    </p>
                  </div>
                  <Switch
                    checked={profile.notifications.push}
                    onCheckedChange={(checked) => 
                      setProfile({
                        ...profile,
                        notifications: {...profile.notifications, push: checked}
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Сводка профиля</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={profession?.color || 'bg-gray-100 text-gray-800'} variant="secondary">
                    <span className="mr-1">{profession?.icon}</span>
                    {profession?.label}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Роль: <span className="font-medium text-foreground">{userProfile?.role || 'Участник'}</span></p>
                  <p>Статус: <span className="font-medium text-success">Активен</span></p>
                  {profile.telegramLinked ? (
                    <p>Telegram: <span className="font-medium text-green-600">Подключен</span></p>
                  ) : (
                    <p>Telegram: <span className="font-medium text-gray-500">Не подключен</span></p>
                  )}
                </div>
              </CardContent>
            </Card>

            {profile.telegramLinked && (
              <Card className="animate-fade-in">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Telegram бот
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-2">Доступные команды:</p>
                    <ul className="space-y-1 text-xs">
                      <li><code>/tasks</code> - Посмотреть ваши задачи</li>
                      <li><code>/help</code> - Справка по командам</li>
                      <li><code>/start</code> - Начать работу с ботом</li>
                    </ul>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Открыть бота
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Быстрые действия
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link to="/dashboard">
                    <Button variant="outline" className="w-full justify-start">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Мои доски
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Уведомления
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Выйти из аккаунта
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;