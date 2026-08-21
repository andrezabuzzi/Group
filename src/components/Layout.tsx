import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Settings, LogOut, Menu, Bell, Factory, Wallet, TrendingUp, RefreshCcw, ChevronDown, Building, Eye, EyeOff, Lock, Sun, Moon, Pin, PinOff, Command } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';
import { useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { useTheme } from './ThemeProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type MenuItem = {
  name: string;
  href?: string;
  icon: any;
  subItems?: { name: string; href: string }[];
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isPessoal, setIsPessoal, privacyMode, setPrivacyMode } = useAppContext();
  
  const [open, setOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false); 
  
  const location = useLocation();
  const navigate = useNavigate();

  const isFinanceiro = location.pathname.startsWith('/financeiro');

  useEffect(() => {
    const handleOpen = () => setPinDialogOpen(true);
    window.addEventListener('open-pin-dialog', handleOpen);
    return () => window.removeEventListener('open-pin-dialog', handleOpen);
  }, []);

  
  // Privacy
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const navigation: MenuItem[] = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    {
      name: 'Confecção',
      icon: Factory,
      subItems: [
        { name: 'Dashboard', href: '/confeccao/dashboard' },
        { name: 'Produtos', href: '/produtos' },
        { name: 'Produção', href: '/producao' },
        { name: 'Compras', href: '/insumos' },
        { name: 'Calculadora', href: '/confeccao/calculadora' },
        { name: 'Relatórios', href: '/relatorios' },
      ]
    },
    {
      name: 'Financeiro',
      icon: Wallet,
      subItems: [
        { name: 'Despesas Fixas', href: '/financeiro/despesas-fixas' },
        { name: 'Despesas Variáveis', href: '/financeiro/despesas-variaveis' },
        { name: 'Contas a Pagar', href: '/financeiro/contas-pagar' },
        { name: 'Relatórios', href: '/financeiro/relatorios' },
      ]
    },
    {
      name: 'Performance',
      icon: TrendingUp,
      subItems: [
        { name: 'Metas', href: '/performance/metas' },
        { name: 'Tarefas', href: '/performance/tarefas' },
      ]
    },
    { 
      name: 'Devoluções', 
      href: '/devolucoes/controle', 
      icon: RefreshCcw 
    },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ];

  useEffect(() => {
    const activeNav = navigation.find(n => n.subItems?.some(s => location.pathname.startsWith(s.href)));
    if (activeNav) {
      setExpandedMenu(activeNav.name);
    }
  }, [location.pathname]);

  const handleToggleMenu = (name: string) => {
    setExpandedMenu(prev => (prev === name ? null : name));
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('app_pin') || '1234';
    if (pinInput === savedPin) {
      setPrivacyMode(false);
      setPinDialogOpen(false);
      setPinInput('');
      toast.success('Visualização liberada');
    } else {
      toast.error('PIN Incorreto');
      setPinInput('');
    }
  };


  const handleThemeToggle = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (user) {
      try {
         await updateDoc(doc(db, 'users', user.uid), { theme: newTheme });
      } catch(e) {}
    }
  };

  const SidebarContent = ({ forceExpand = false }: { forceExpand?: boolean }) => {
    const isExpanded = forceExpand || isPinned || isSidebarHovered;

    return (
      <div className={cn(
        "flex flex-col h-full bg-sidebar border-r border-border shadow-soft transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shrink-0 overflow-visible relative",
        forceExpand ? "w-full rounded-none border-none" : isExpanded ? "w-[280px]" : "w-[84px]"
      )}>
        <div className={cn("p-6 flex items-center gap-3 transition-all duration-300", 
          isExpanded ? "justify-start px-7 pt-8" : "justify-center px-0 pt-8", forceExpand && "pt-6 px-6")}>
          <div className={cn("bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0 transition-all duration-300 transform", 
             isExpanded ? "w-10 h-10 rounded-xl" : "w-12 h-12 rounded-[1rem]")}>
            <Factory size={22} strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div initial={{opacity:0, width:0}} animate={{opacity:1, width:'auto'}} exit={{opacity:0, width:0}} className="overflow-hidden whitespace-nowrap">
                <span className="text-xl font-bold tracking-tight text-foreground">Group <span className="text-primary font-black">NMZ</span></span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-visible px-4 mt-6 hide-scrollbar">
          {isExpanded && <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 pl-4">Departamentos</div>}
          <ul className="space-y-2 flex flex-col relative pb-4">
            {navigation.map((item) => {
              const menuExpanded = expandedMenu === item.name;
              const isSingleActive = !item.subItems && (location.pathname === item.href || (item.href === '/' && location.pathname === ''));
              const hasActiveSubItem = item.subItems?.some(sub => location.pathname.startsWith(sub.href)) || false;
              const isActive = isSingleActive || hasActiveSubItem;
              
              return (
                <li key={item.name} className="relative group/nav z-10 hover:z-50">
                  {!item.subItems ? (
                    <NavLink
                      to={item.href || '#'}
                      onClick={() => setOpen(false)}
                      end={item.href === '/'}
                      className={cn(
                        "flex items-center transition-all duration-300 overflow-hidden relative z-10",
                        isExpanded ? "rounded-2xl px-4 py-3 mx-2" : "rounded-[1rem] justify-center w-12 h-12 mx-auto",
                        isActive
                          ? "bg-secondary text-primary shadow-sm"
                          : "text-muted-foreground hover:text-primary hover:bg-muted/50 font-semibold"
                      )}
                    >
                      <item.icon size={20} className={cn("shrink-0 transition-transform duration-300", isActive ? "scale-105" : "group-hover/nav:scale-105", isActive && "drop-shadow-[0_0_8px_rgba(109,74,255,0.4)]")} strokeWidth={isActive ? 2.5 : 2} />
                      {isExpanded && <span className="ml-3 truncate text-[15px] font-bold">{item.name}</span>}
                    </NavLink>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => {
                          if (isExpanded) handleToggleMenu(item.name);
                        }}
                        className={cn(
                          "flex items-center transition-all duration-300 w-full text-left relative z-[45] outline-none",
                          isExpanded ? "rounded-2xl px-4 py-3 mx-2 justify-between overflow-hidden" : "rounded-[1rem] justify-center w-12 h-12 mx-auto",
                          (!isExpanded && isActive) ? "bg-secondary text-primary font-black shadow-sm" : "",
                          (isExpanded && hasActiveSubItem && !menuExpanded) ? "bg-secondary text-primary font-bold" : "",
                          (isExpanded && !hasActiveSubItem) || (!isExpanded && !isActive) ? "text-muted-foreground hover:text-primary hover:bg-muted/50 font-semibold group-hover/nav:text-primary" : ""
                        )}
                      >
                        <div className="flex items-center">
                          <item.icon size={20} className={cn("shrink-0 transition-transform duration-300", isActive ? "scale-105 text-primary drop-shadow-[0_0_8px_rgba(109,74,255,0.4)]" : "group-hover/nav:scale-105 group-hover/nav:drop-shadow-[0_0_8px_rgba(109,74,255,0.4)]")} strokeWidth={isActive && !isExpanded ? 2.5 : 2} />
                          {isExpanded && <span className={cn("ml-3 truncate text-[15px] font-bold", hasActiveSubItem ? "text-primary" : "")}>{item.name}</span>}
                        </div>
                        {isExpanded && <ChevronDown size={16} className={cn("transition-transform duration-300 shrink-0", menuExpanded ? "rotate-180 text-primary" : "text-muted-foreground")} />}
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && menuExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <ul className="pl-[3.5rem] pr-2 py-2 space-y-1">
                              {item.subItems.map(subItem => {
                                const isSubActive = location.pathname === subItem.href || (location.pathname === '' && subItem.href === '/confeccao/dashboard');
                                return (
                                  <li key={subItem.name}>
                                    <NavLink
                                      to={subItem.href}
                                      onClick={() => setOpen(false)}
                                      className={cn(
                                        "block py-2.5 px-3 rounded-xl text-[13px] font-bold transition-all truncate",
                                        isSubActive
                                          ? "text-primary bg-secondary"
                                          : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                                      )}
                                    >
                                      {subItem.name}
                                    </NavLink>
                                  </li>
                                );
                              })}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!isExpanded && (
                         <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover/nav:flex items-center z-[100] pointer-events-none whitespace-nowrap">
                            <div className="glass rounded-xl shadow-premium px-4 py-2 animate-in fade-in zoom-in-95 duration-200 border border-border">
                              <span className="text-sm font-bold text-foreground">{item.name}</span>
                            </div>
                         </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 mt-auto border-t border-border shrink-0 flex flex-col gap-3 bg-sidebar">
          <div className={cn("flex items-center", isExpanded ? "justify-between px-2" : "justify-center flex-col gap-4")}>
            <div className={cn("flex items-center gap-3", !isExpanded && "justify-center")}>
              <Avatar className="h-10 w-10 ring-2 ring-transparent transition-transform hover:scale-105 cursor-pointer shadow-sm bg-background border border-border">
                 <AvatarImage src={user?.photoURL || ''} />
                 <AvatarFallback className="bg-secondary text-primary font-black">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              {isExpanded && (
                <div className="flex-1 overflow-hidden">
                   <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black truncate text-foreground leading-tight">{user?.displayName?.split(' ')[0] || 'Usuário'}</p>
                   </div>
                  <p className="text-[11px] font-bold text-muted-foreground truncate">{user?.email}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className={cn("flex", isExpanded ? "gap-2" : "flex-col gap-2")}>
             {!forceExpand && (
               <button 
                 onClick={() => setIsPinned(!isPinned)} 
                 className={cn("flex items-center justify-center p-2.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-[1rem] transition-all", isExpanded ? "flex-1" : "w-10 h-10 rounded-[1rem] mx-auto")}
                 title={isPinned ? "Desafixar menu" : "Fixar menu"}
               >
                 {isPinned ? <PinOff size={18} strokeWidth={2.5} /> : <Pin size={18} strokeWidth={2.5} />}
               </button>
             )}
             
             <button 
               onClick={logout} 
               className={cn("flex items-center justify-center p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[1rem] transition-all", isExpanded ? "flex-1" : "w-10 h-10 rounded-[1rem] mx-auto")} 
               title="Sair"
             >
                <LogOut size={18} strokeWidth={2.5} />
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col md:flex-row relative selection:bg-primary/20 selection:text-primary overflow-hidden print:h-auto print:overflow-visible">
      {/* Mobile Top Header */}
      <div className="md:hidden print:hidden flex items-center justify-between p-4 glass border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
            <Factory size={16} strokeWidth={2.5}/>
          </div>
          <span className="font-black tracking-tight text-foreground">Group NMZ</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="shrink-0 text-foreground hover:bg-muted rounded-xl" />}>
              <Menu size={24} />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r border-border w-[280px] bg-transparent">
             <SheetTitle className="sr-only">Menu</SheetTitle>
             <SidebarContent forceExpand />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Floating Sidebar */}
      <div 
        className={cn(
          "hidden md:block print:hidden h-full z-40 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex-shrink-0 relative",
          isPinned ? "w-[280px]" : "w-[84px]"
        )}
      >
        <div 
          className="h-full z-50 absolute top-0 left-0"
          onMouseEnter={() => !isPinned && setIsSidebarHovered(true)}
          onMouseLeave={() => !isPinned && setIsSidebarHovered(false)}
        >
             <SidebarContent />
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden print:w-full print:max-w-none w-full max-w-full print:h-auto print:overflow-visible">
         
         {/* Contextual App Content Area */}
         <main className="flex-1 overflow-x-hidden overflow-y-auto relative z-0 hide-scrollbar w-full max-w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full mx-auto"
              >
                  {children}
              </motion.div>
            </AnimatePresence>
         </main>
      </div>

      {/* PIN Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] glass border-border shadow-premium">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center pt-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Lock size={32} strokeWidth={2.5}/>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 pb-8">
            <h3 className="text-2xl font-black tracking-tight text-foreground">Acesso Exclusivo</h3>
            <p className="text-muted-foreground text-sm max-w-[280px] mx-auto font-medium">Insira seu PIN de 4 dígitos para acessar esta visão.</p>
            <form onSubmit={handlePinSubmit} className="space-y-6 max-w-[220px] mx-auto mt-6">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="text-center text-4xl tracking-[0.5em] font-mono rounded-[1.5rem] h-[72px] bg-muted/50 border-border focus-visible:ring-primary shadow-inner"
                autoFocus
              />
              <Button type="submit" size="lg" className="premium-btn-primary w-full rounded-[1.25rem] h-14 font-black tracking-wide text-sm" disabled={pinInput.length !== 4}>
                Validar PIN
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
