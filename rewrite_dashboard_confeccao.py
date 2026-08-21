import re

content = """import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Factory, CheckCircle2, AlertTriangle, Clock, Package,
  Scissors, TrendingUp, DollarSign, LayoutDashboard, CalendarDays
} from 'lucide-react';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { formatCurrency, cn } from '../lib/utils';
import { useNavigate } from 'react-router';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

export default function DashboardConfeccao() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [hideValues, setHideValues] = useState(false);

  const isDark = theme === 'dark';
  const cCard = isDark ? '#181B24' : '#FFFFFF';
  const cText = isDark ? '#FFFFFF' : '#111827';
  const cTextSec = isDark ? '#A5ADBD' : '#6B7280';
  const cPrimary = '#6D4AFF';
  const cBorder = isDark ? '#2A2F3D' : '#E5E7EB';

  const [producoes, setProducoes] = useState<any[]>([]);
  const [costureiras, setCostureiras] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    const unsubPromises = [
      onSnapshot(query(collection(db, 'producoes'), where('userId', '==', uid)), s => setProducoes(s.docs.map(d => ({id: d.id, ...d.data()})))),
      onSnapshot(query(collection(db, 'costureiras'), where('userId', '==', uid)), s => setCostureiras(s.docs.map(d => ({id: d.id, ...d.data()}))))
    ];

    setTimeout(() => setLoading(false), 500);

    return () => unsubPromises.forEach(unsub => unsub());
  }, [user]);

  // Derived Data
  const totalLotes = producoes.length;
  
  // Total peças cortadas vs Entregues
  const totalPecasCortadas = producoes.reduce((acc, p) => acc + (Number(p.quantidadeTotal) || 0), 0);
  const entregues = producoes.filter(p => p.status === 'Finalizado');
  const totalPecasEntregues = entregues.reduce((acc, p) => acc + (Number(p.quantidadeTotal) || 0), 0);
  const pecasEmProducao = totalPecasCortadas - totalPecasEntregues;
  
  const pgtoPendente = producoes.filter(p => p.statusPgto !== 'Pago').reduce((acc, p) => acc + (Number(p.valorTotal) || 0), 0);

  const emAtraso = producoes.filter(p => p.status !== 'Finalizado' && p.dataPrevisao && new Date(p.dataPrevisao) < new Date());
  
  // Ranking de costureiras
  const rankingCostureiras = costureiras.map(c => {
     const prodsDaCostureira = producoes.filter(p => p.costureiraId === c.id);
     const entreguesPorEla = prodsDaCostureira.filter(p => p.status === 'Finalizado').reduce((acc, p) => acc + (Number(p.quantidadeTotal) || 0), 0);
     const valorGanho = prodsDaCostureira.filter(p => p.status === 'Finalizado').reduce((acc, p) => acc + (Number(p.valorTotal) || 0), 0);
     return { ...c, entreguesPorEla, valorGanho };
  }).sort((a,b) => b.entreguesPorEla - a.entreguesPorEla).slice(0, 5);

  const statusData = [
     { name: 'Em Produção', value: pecasEmProducao },
     { name: 'Entregues', value: totalPecasEntregues }
  ];
  const COLORS = [cBorder, cPrimary];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F6F7FB] dark:bg-[#0F1117]"><div className="animate-pulse flex flex-col items-center gap-4"><LayoutDashboard className="w-10 h-10 text-[#6D4AFF] animate-bounce" /><span className="text-[#6B7280] dark:text-[#A5ADBD] font-medium">Carregando Dashboard de Confecção...</span></div></div>;
  }

  return (
    <div className="w-full min-h-screen pb-24 transition-colors duration-300 bg-background text-foreground font-sans">
      <PageHeader 
        title="Dashboard de Confecção" 
        subtitle="Métricas e acompanhamento do departamento de produção."
        hideValues={hideValues}
        onToggleHideValues={() => setHideValues(!hideValues)}
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[1440px] mx-auto px-4 md:px-8 mt-6 flex flex-col gap-8"
      >
         {/* KPIs Principais */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardKPI icon={Scissors} title="Peças Cortadas (Total)" value={totalPecasCortadas} hide={hideValues} />
            <CardKPI icon={Package} title="Peças em Produção" value={pecasEmProducao} hide={hideValues} />
            <CardKPI icon={CheckCircle2} title="Peças Entregues" value={totalPecasEntregues} hide={hideValues} />
            <CardKPI icon={DollarSign} title="Pendente de Pagamento" value={pgtoPendente} hide={hideValues} isCurrency />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Status */}
            <div className="lg:col-span-2 premium-card p-6 flex flex-col min-h-[350px]">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-semibold text-foreground">Progresso da Produção</h3>
               </div>
               <div className="flex-1 w-full min-h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={[
                        { name: 'Cortadas', qty: totalPecasCortadas },
                        { name: 'Em Produção', qty: pecasEmProducao },
                        { name: 'Entregues', qty: totalPecasEntregues }
                     ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cBorder} opacity={0.4} />
                        <XAxis dataKey="name" fontSize={12} fontWeight={500} axisLine={false} tickLine={false} tick={{fill: cTextSec}} dy={10} />
                        <YAxis fontSize={12} fontWeight={500} axisLine={false} tickLine={false} tick={{fill: cTextSec}} />
                        <Tooltip cursor={{fill: cBorder, opacity: 0.2}} contentStyle={{borderRadius:'16px', border:`1px solid ${cBorder}`, background: cCard, color: cText, boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '12px', fontSize: '13px'}} />
                        <Bar dataKey="qty" fill={cPrimary} radius={[6,6,0,0]} barSize={40} animationDuration={1000} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Atrasos */}
            <div className="lg:col-span-1 premium-card p-6 flex flex-col min-h-[350px]">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-red-500" />
                     Lotes em Atraso
                  </h3>
                  <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 text-[12px] font-bold flex items-center justify-center">
                     {emAtraso.length}
                  </span>
               </div>
               <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2">
                  {emAtraso.length > 0 ? emAtraso.slice(0, 5).map((p: any, i: number) => (
                     <div key={i} className="flex justify-between items-center group cursor-pointer" onClick={() => navigate('/producao')}>
                        <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
                           <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors truncate">{p.produtoNome}</p>
                           <p className="text-[12px] font-medium text-muted-foreground truncate">{p.costureiraNome || 'Sem costureira'}</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                           <p className="text-[13px] font-semibold text-foreground whitespace-nowrap">{p.quantidadeTotal} un</p>
                           <p className="text-[11px] font-bold text-red-500 whitespace-nowrap mt-0.5">{new Date(p.dataPrevisao).toLocaleDateString('pt-BR')}</p>
                        </div>
                     </div>
                  )) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60">
                        <CheckCircle2 className="w-8 h-8 mb-2" />
                        <p className="text-[13px] font-medium">Nenhum lote atrasado!</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Ranking de Costureiras */}
         <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="premium-card p-6 flex flex-col">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
                     <Factory className="w-5 h-5 text-primary" />
                     Top Costureiras (Entregas Realizadas)
                  </h3>
               </div>
               <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse">
                     <thead>
                        <tr className="border-b border-border/50">
                           <th className="text-left text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pb-3 pl-4">Posição</th>
                           <th className="text-left text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">Nome</th>
                           <th className="text-right text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">Peças Entregues</th>
                           <th className="text-right text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pb-3 pr-4">Valor Gerado</th>
                        </tr>
                     </thead>
                     <tbody>
                        {rankingCostureiras.map((c, i) => (
                           <tr key={c.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors group">
                              <td className="py-4 pl-4">
                                 <span className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold",
                                    i === 0 ? "bg-amber-500/10 text-amber-500" :
                                    i === 1 ? "bg-slate-400/10 text-slate-400" :
                                    i === 2 ? "bg-amber-700/10 text-amber-700" : "text-muted-foreground"
                                 )}>
                                    {i + 1}º
                                 </span>
                              </td>
                              <td className="py-4 text-[14px] font-medium text-foreground">{c.name}</td>
                              <td className="py-4 text-right text-[14px] font-bold text-foreground">{c.entreguesPorEla} un</td>
                              <td className="py-4 text-right text-[14px] font-medium text-primary pr-4">
                                 {hideValues ? '••••' : formatCurrency(c.valorGanho, false)}
                              </td>
                           </tr>
                        ))}
                        {rankingCostureiras.length === 0 && (
                           <tr>
                              <td colSpan={4} className="py-8 text-center text-[13px] text-muted-foreground">Nenhuma costureira finalizou lotes ainda.</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </motion.div>
    </div>
  );
}

function CardKPI({ icon: Icon, title, value, hide, isCurrency, className }: any) {
  return (
    <div className={cn("premium-card flex flex-col justify-between p-6 overflow-hidden group", className)}>
      <div className="flex flex-col gap-3 mb-6">
         <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Icon size={18} strokeWidth={2.5}/>
         </div>
         <h3 className="text-[14px] font-semibold text-muted-foreground leading-tight">{title}</h3>
      </div>
      <div>
         <p className="text-[28px] font-bold tracking-tight text-foreground leading-none mb-1 truncate" >
            {hide ? '••••' : (isCurrency ? formatCurrency(value, false) : value.toLocaleString('pt-BR'))}
         </p>
      </div>
    </div>
  );
}
"""

with open('src/views/DashboardConfeccao.tsx', 'w') as f:
    f.write(content)
