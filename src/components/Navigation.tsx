import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Bell, 
  User, 
  Grid3X3, 
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navigationItems = [
  {
    title: 'Доска',
    href: '/',
    icon: Grid3X3,
  },
  {
    title: 'Список досок',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Мои задачи',
    href: '/my-tasks',
    icon: CheckSquare,
    badge: 3,
  },
  {
    title: 'Уведомления',
    href: '/notifications',
    icon: Bell,
    badge: 2,
  },
  {
    title: 'Профиль',
    href: '/profile',
    icon: User,
  },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {navigationItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <Badge className="absolute -top-2 -right-2 w-4 h-4 p-0 text-xs flex items-center justify-center">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          );
        })}
        
        <Link
          to="/profile"
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
            location.pathname === '/profile'
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Профиль</span>
        </Link>
      </div>
    </nav>
  );
};