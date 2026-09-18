import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from 'sonner';

// Views
import Login from './views/Login';
import Home from './views/Home';
import DashboardConfeccao from './views/DashboardConfeccao';
import Layout from './components/Layout';
import Produtos from './views/Produtos';
import Producao from './views/Producao';
import Costureiras from './views/Costureiras';
import Relatorios from './views/Relatorios';
import Configuracoes from './views/Configuracoes';
import Insumos from './views/Insumos';
import DespesasFixas from './views/Financeiro/DespesasFixas';
import DespesasVariaveis from './views/Financeiro/DespesasVariaveis';
import ContasAPagar from './views/Financeiro/ContasAPagar';
import RelatoriosFinanceiros from './views/Financeiro/RelatoriosFinanceiros';
import ControleDevolucoes from './views/Devolucoes/ControleDevolucoes';
import Metas from './views/Performance/Metas';
import Tarefas from './views/Performance/Tarefas';
import AnaliseMercado from './views/Performance/AnaliseMercado';
import CalculadoraMarketplace from './views/Performance/CalculadoraMarketplace';
import CalculadoraConfeccao from './views/CalculadoraConfeccao';

// PlacHolders for new views
const PlaceholderView = ({ title }: { title: string }) => (
  <div className="p-8"><h1 className="text-[36px] font-bold tracking-tight text-foreground leading-tight">{title}</h1></div>
);

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Layout><Outlet /></Layout>;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { path: '', element: <Home /> },
      { path: 'confeccao/dashboard', element: <DashboardConfeccao /> },
      { path: 'produtos', element: <Produtos /> },
      { path: 'producao', element: <Producao /> },
      { path: 'costureiras', element: <Costureiras /> },
      { path: 'insumos', element: <Insumos /> },
      { path: 'relatorios', element: <Relatorios /> },
      { path: 'configuracoes', element: <Configuracoes /> },
      
      // Confecção extra
      { path: 'confeccao/calculadora', element: <CalculadoraConfeccao /> },
      
      // Financeiro
      { path: 'financeiro/despesas-fixas', element: <DespesasFixas /> },
      { path: 'financeiro/despesas-variaveis', element: <DespesasVariaveis /> },
      { path: 'financeiro/contas-pagar', element: <ContasAPagar /> },
      { path: 'financeiro/relatorios', element: <RelatoriosFinanceiros /> },
      
      // Performance
      { path: 'performance/ads', element: <PlaceholderView title="Análise ADS" /> },
      { path: 'performance/marketplace', element: <CalculadoraMarketplace /> },
      { path: 'performance/mercado', element: <AnaliseMercado /> },
      { path: 'performance/tarefas', element: <Tarefas /> },
      { path: 'performance/metas', element: <Metas /> },
      
      // Devoluções
      { path: 'devolucoes/controle', element: <ControleDevolucoes /> },
    ]
  }
], {
  basename: '/',
});

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="erp-theme">
      <AuthProvider>
        <AppProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
