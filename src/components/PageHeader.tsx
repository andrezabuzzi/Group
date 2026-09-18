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
  showSearch = true,
}: PageHeaderProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const utilityActions = (
    <div className="flex items-center gap-1.5 shrink-0">
      {onToggleHideValues && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleHideValues}
          className="rounded-xl h-10 w-10 hover:bg-secondary text-muted-foreground hover:text-primary transition-colors shrink-0"
          title="Ocultar Valores"
        >
          {hideValues ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="rounded-xl h-10 w-10 hover:bg-secondary text-muted-foreground hover:text-primary transition-colors shrink-0"
        title="Alternar Tema"
      >
        {isDark ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl h-10 w-10 hover:bg-secondary text-muted-foreground hover:text-primary transition-colors relative shrink-0"
        title="Notificações"
      >
        <Bell size={18} strokeWidth={2.5} />
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary ring-2 ring-background"></span>
      </Button>

      <Avatar className="w-10 h-10 ml-1 rounded-[14px] border-2 border-transparent hover:border-primary transition-colors cursor-pointer shadow-sm shrink-0">
        <AvatarImage src={user?.photoURL || ''} />
        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
          {user?.displayName?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full px-6 lg:px-10 py-5 bg-background/80 backdrop-blur-xl border-b border-border transition-colors duration-300">
      <div className="w-full flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Top / Left Section: Title & Subtitle + Utility actions on smaller viewports */}
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-2xl sm:text-[28px] lg:text-[32px] font-bold tracking-tight text-foreground leading-tight truncate">
              {title}
            </h1>
            <p className="text-[13px] sm:text-[14px] font-medium text-muted-foreground truncate">
              {subtitle}
            </p>
          </div>

          {/* Utility actions on mobile/tablet (aligned with title row) */}
          <div className="flex xl:hidden items-center shrink-0">
            {utilityActions}
          </div>
        </div>

        {/* Right Section: Search + Filters + Actions (Single line on xl+) */}
        <div className="flex items-center gap-3 flex-wrap xl:flex-nowrap justify-start xl:justify-end min-w-0">
          {showSearch && (
            <div className="relative group shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Pesquisar..."
                className="pl-9 w-[160px] sm:w-[190px] xl:w-[210px] premium-input border-transparent shadow-sm focus-visible:shadow-md h-10 text-sm font-medium"
              />
            </div>
          )}

          {filters && (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
              {filters}
            </div>
          )}

          {primaryAction && (
            <div className="flex items-center shrink-0">
              {primaryAction}
            </div>
          )}

          {/* Divider visible only on xl+ where utility actions join this row */}
          <div className="h-6 w-px bg-border shrink-0 hidden xl:block mx-1"></div>

          {/* Utility actions on desktop (single row with search and filters) */}
          <div className="hidden xl:flex items-center shrink-0">
            {utilityActions}
          </div>
        </div>
      </div>
    </header>
  );
}
