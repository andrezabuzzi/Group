import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { 
  Home, 
  Package, 
  Scissors, 
  Settings, 
  Users, 
  LogOut,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Calculator,
  LayoutDashboard,
  Wallet,
  Receipt,
  PieChart,
  Target,
  FileSpreadsheet,
  Megaphone,
  Briefcase,
  AlertTriangle,
  Boxes
} from 'lucide-react';
import { Button } from './ui/button';

interface MenuItem {
  title: string;
  icon: any;
  path?: string;
  subItems?: { title: string; path: string }[];
}

const MENU_ITEMS: MenuItem[] = [
  { title: 'Visão Geral', icon: Home, path: '/' },
  { 
    title: 'Confecção', 
    icon: Scissors,
    subItems: [
      { title: 'Dashboard', path: '/confeccao/dashboard' },
      { title: 'Calculadora', path: '/confeccao/calculadora' },
      { title: 'Linha de Produção', path: '/producao' },
      { title: 'Fichas de Produtos', path: '/produtos' },
      { title: 'Equipe de Costura', path: '/costureiras' },
      { title: 'Gestão de Insumos', path: '/insumos' },
    ]
  },
  { 
    title: 'Financeiro', 
    icon: Wallet,
    subItems: [
      { title: 'Despesas Fixas', path: '/financeiro/despesas-fixas' },
      { title: 'Despesas Variáveis', path: '/financeiro/despesas-variaveis' },
      { title: 'Contas a Pagar', path: '/financeiro/contas-pagar' },
      { title: 'Relatórios', path: '/financeiro/relatorios' },
    ]
  },
  { 
    title: 'Performance', 
    icon: TrendingUp,
    subItems: [
      { title: 'Metas & Resultados', path: '/performance/metas' },
      { title: 'Análise de Mercado', path: '/performance/mercado' },
      { title: 'Calculadora Marketplace', path: '/performance/marketplace' },
      { title: 'Análise ADS', path: '/performance/ads' },
      { title: 'Tarefas Operacionais', path: '/performance/tarefas' },
    ]
  },
  { 
    title: 'Devoluções', 
    icon: AlertTriangle,
    subItems: [
      { title: 'Controle de Devoluções', path: '/devolucoes/controle' },
    ]
  },
  { title: 'Relatórios Gerenciais', icon: BarChart3, path: '/relatorios' },
  { title: 'Configurações', icon: Settings, path: '/configuracoes' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if current path belongs to a submenu
  useEffect(() => {
    const currentItem = MENU_ITEMS.find(item => 
      item.subItems?.some(sub => location.pathname.startsWith(sub.path))
    );
    if (currentItem) {
      setOpenSubmenu(currentItem.title);
    }
  }, [location.pathname]);

  const handleSubmenuToggle = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-border bg-sidebar shadow-premium",
          isSidebarOpen ? "w-[280px]" : "w-[84px]"
        )}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Area */}
          <div className="h-[88px] flex items-center px-6 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <Boxes className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className={cn(
              "ml-4 transition-all duration-300 overflow-hidden whitespace-nowrap",
              isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              <h1 className="font-bold text-lg tracking-tight">ERP Premium</h1>
              <p className="text-xs text-muted-foreground font-medium">Gestão Integrada</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto hide-scrollbar px-4 py-6 flex flex-col gap-2">
            {MENU_ITEMS.map((item) => {
              const isActive = item.path ? location.pathname === item.path : false;
              const hasSubmenu = !!item.subItems;
              const isSubmenuOpen = openSubmenu === item.title;
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex flex-col">
                  {item.path ? (
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center h-12 rounded-[1rem] px-3 transition-all duration-200 group relative",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:bg-secondary hover:text-primary"
                      )}
                    >
                      <Icon className="w-[22px] h-[22px] shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                      <span className={cn(
                        "ml-4 font-semibold text-[14px] transition-all duration-300 whitespace-nowrap",
                        isSidebarOpen ? "opacity-100" : "opacity-0 w-0"
                      )}>
                        {item.title}
                      </span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleSubmenuToggle(item.title)}
                      className={cn(
                        "flex items-center justify-between h-12 rounded-[1rem] px-3 transition-all duration-200 group relative",
                        isSubmenuOpen
                          ? "bg-secondary text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-primary"
                      )}
                    >
                      <div className="flex items-center">
                        <Icon className="w-[22px] h-[22px] shrink-0" strokeWidth={isSubmenuOpen ? 2.5 : 2} />
                        <span className={cn(
                          "ml-4 font-semibold text-[14px] transition-all duration-300 whitespace-nowrap",
                          isSidebarOpen ? "opacity-100" : "opacity-0 w-0 hidden"
                        )}>
                          {item.title}
                        </span>
                      </div>
                      {hasSubmenu && isSidebarOpen && (
                        <ChevronRight className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          isSubmenuOpen ? "rotate-90" : ""
                        )} />
                      )}
                    </button>
                  )}

                  {/* Submenu */}
                  {hasSubmenu && isSubmenuOpen && isSidebarOpen && (
                    <div className="mt-1 flex flex-col gap-1 overflow-hidden transition-all duration-300">
                      {item.subItems?.map((subItem) => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={cn(
                              "flex items-center h-10 ml-[22px] pl-6 border-l border-border rounded-r-[0.75rem] transition-colors relative",
                              isSubActive
                                ? "text-primary font-semibold"
                                : "text-muted-foreground hover:text-foreground font-medium"
                            )}
                          >
                            <span className="text-[13px] whitespace-nowrap">{subItem.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 shrink-0 mt-auto border-t border-border">
            <button
              onClick={() => logout()}
              className={cn(
                "flex items-center h-12 rounded-[1rem] px-3 transition-colors text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 w-full group",
                !isSidebarOpen && "justify-center"
              )}
            >
              <LogOut className="w-[22px] h-[22px] shrink-0" strokeWidth={2} />
              <span className={cn(
                "ml-4 font-semibold text-[14px] transition-all duration-300 whitespace-nowrap",
                isSidebarOpen ? "opacity-100" : "opacity-0 w-0 hidden"
              )}>
                Sair do Sistema
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "ml-[280px]" : "ml-[84px]"
        )}
      >
        <main className="flex-1 overflow-auto bg-background/50">
          <div className="w-full min-w-0 pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
