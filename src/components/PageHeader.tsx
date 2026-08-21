import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Eye, EyeOff, Sun, Moon, Bell, Search } from 'lucide-react';
import { Input } from './ui/input';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  filters?: React.ReactNode;
  primaryAction?: React.ReactNode;
  hideValues?: boolean;
  onToggleHideValues?: () => void;
  showSearch?: boolean;
}

export function PageHeader({ 
  title, 
  subtitle, 
  filters, 
  primaryAction,
  hideValues,
  onToggleHideValues,
  showSearch = true
}: PageHeaderProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-50 w-full px-6 lg:px-10 py-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-background/80 backdrop-blur-xl border-b border-border transition-colors duration-300">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-[15px] font-medium text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {showSearch && (
          <div className="relative group mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-9 w-[220px] premium-input border-transparent shadow-sm focus-visible:shadow-md h-11 text-sm font-medium"
            />
          </div>
        )}

        {filters && (
          <div className="flex items-center gap-2">
            {filters}
          </div>
        )}
        
        {primaryAction && (
          <div className="flex items-center ml-2">
            {primaryAction}
          </div>
        )}

        <div className="h-6 w-px mx-1 bg-border hidden sm:block"></div>

        {onToggleHideValues && (
          <Button variant="ghost" size="icon" onClick={onToggleHideValues} className="rounded-2xl h-11 w-11 hover:bg-secondary text-muted-foreground hover:text-primary transition-colors" title="Ocultar Valores">
            {hideValues ? <EyeOff size={18} strokeWidth={2.5}/> : <Eye size={18} strokeWidth={2.5}/>}
          </Button>
        )}
        
        <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')} className="rounded-2xl h-11 w-11 hover:bg-secondary text-muted-foreground hover:text-primary transition-colors" title="Alternar Tema">
          {isDark ? <Sun size={18} strokeWidth={2.5}/> : <Moon size={18} strokeWidth={2.5}/>}
        </Button>
        
        <Button variant="ghost" size="icon" className="rounded-2xl h-11 w-11 hover:bg-secondary text-muted-foreground hover:text-primary transition-colors relative">
          <Bell size={18} strokeWidth={2.5}/>
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary ring-2 ring-background"></span>
        </Button>
        
        <Avatar className="w-11 h-11 ml-2 rounded-[1rem] border-2 border-transparent hover:border-primary transition-colors cursor-pointer shadow-sm">
          <AvatarImage src={user?.photoURL || ''} />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
            {user?.displayName?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
