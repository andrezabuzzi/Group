import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { formatCurrency } from '../../lib/utils';
import { 
  Plus, Building2, Store, Target, Trash2, Edit2, TrendingUp, TrendingDown, 
  Calendar, CheckCircle, Clock, PieChart, BarChart2, FileText, Download, MoreVertical, Copy, Eye, EyeOff, FilterX, AlertCircle, ShoppingBag, Lightbulb, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, differenceInDays, getDaysInMonth, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell, 
  LineChart as RLineChart, Line, AreaChart, Area, PieChart as RPieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

// --- TYPES ---
interface Company {
  id: string;
  name: string;
  tradeName: string;
  cnpj: string;
  responsible: string;
  notes: string;
  status: 'ativo' | 'inativo';
}

interface SalesChannel {
  id: string;
  companyId: string;
  marketplace: string;
  accountName: string;
  nickname: string;
  status: 'ativo' | 'inativo';
}

interface SalesGoal {
  id: string;
  companyId: string;
  channelId: string;
  goalName: string;
  periodType: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  revenueGoal: number;
  expectedAverageTicket: number;
  requiredOrders: number;
  manualOrderGoal: number | null;
  expectedMargin: number | null;
  status: string;
  notes: string | null;
  weeklyResults?: WeeklyResult[];
}

interface WeeklyResult {
  id?: string;
  weekLabel: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  realizedRevenue: number;
  realizedOrders: number;
  realAverageTicket: number;
  adsInvestment: number | null;
  notes: string | null;
  weekStatus: string;
}

const MARKETPLACES = ['Mercado Livre', 'Shopee', 'TikTok Shop', 'Shein', 'Loja Própria', 'WhatsApp', 'Instagram', 'Outro'];

// --- MAIN COMPONENT ---
export default function Metas() {
  const { user } = useAuth();
  const { privacyMode, setPrivacyMode } = useAppContext();

  const [activeTab, setActiveTab] = useState('painel');
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [goals, setGoals] = useState<SalesGoal[]>([]);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const [selectedGoal, setSelectedGoal] = useState<SalesGoal | null>(null);

  // Filters
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterCompany, setFilterCompany] = useState('Todos');
  const [filterChannel, setFilterChannel] = useState('Todos');

  // Form States
  const [companyForm, setCompanyForm] = useState<Partial<Company>>({ status: 'ativo' });
  const [channelForm, setChannelForm] = useState<Partial<SalesChannel>>({ status: 'ativo', marketplace: 'Mercado Livre' });

  const defaultGoalForm: Partial<SalesGoal> = {
    periodType: 'mensal',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    status: 'planejada',
    revenueGoal: 0,
    expectedAverageTicket: 0,
    requiredOrders: 0,
  };
  const [goalForm, setGoalForm] = useState<Partial<SalesGoal>>(defaultGoalForm);

  const defaultResultForm: Partial<WeeklyResult> = {
    weekLabel: 'Semana 1',
    weekNumber: 1,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    realizedRevenue: 0,
    realizedOrders: 0,
    realAverageTicket: 0,
  };
  const [resultForm, setResultForm] = useState<Partial<WeeklyResult>>(defaultResultForm);

  // Fetch Data
  useEffect(() => {
    if (!user?.uid) return;
    const qCompanies = query(collection(db, 'prod_companies'), where('userId', '==', user.uid));
    const uCompanies = onSnapshot(qCompanies, (snap) => setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Company))));

    const qChannels = query(collection(db, 'prod_sales_channels'), where('userId', '==', user.uid));
    const uChannels = onSnapshot(qChannels, (snap) => setChannels(snap.docs.map(d => ({ id: d.id, ...d.data() } as SalesChannel))));

    const qGoals = query(collection(db, 'prod_sales_goals'), where('userId', '==', user.uid));
    const uGoals = onSnapshot(qGoals, (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as SalesGoal)));
    });

    return () => { uCompanies(); uChannels(); uGoals(); };
  }, [user]);

  // Handlers
  const togglePrivacy = () => {
    if (privacyMode) setPinDialogOpen(true);
    else setPrivacyMode(true);
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

  const handleSaveCompany = async () => {
    if(!user?.uid) return;
    try {
      if (companyForm.id) {
         await updateDoc(doc(db, 'prod_companies', companyForm.id), { ...companyForm, updatedAt: serverTimestamp() });
         toast.success("Empresa atualizada.");
      } else {
         await addDoc(collection(db, 'prod_companies'), { ...companyForm, userId: user.uid, createdAt: serverTimestamp() });
         toast.success("Empresa cadastrada.");
      }
      setIsCompanyModalOpen(false);
    } catch(e) {
      console.error(e);
      toast.error("Erro ao salvar empresa");
    }
  };

  const handleSaveChannel = async () => {
    if(!user?.uid) return;
    try {
      if (channelForm.id) {
         await updateDoc(doc(db, 'prod_sales_channels', channelForm.id), { ...channelForm, updatedAt: serverTimestamp() });
         toast.success("Canal atualizado.");
      } else {
         await addDoc(collection(db, 'prod_sales_channels'), { ...channelForm, userId: user.uid, createdAt: serverTimestamp() });
         toast.success("Canal cadastrado.");
      }
      setIsChannelModalOpen(false);
    } catch(e) {
      console.error(e);
      toast.error("Erro ao salvar canal");
    }
  };

  const calculateRequiredOrders = (rev: number, tkt: number) => {
    if(tkt > 0) return Math.ceil(rev / tkt);
    return 0;
  };

  const handleSaveGoal = async () => {
    if(!user?.uid) return;
    try {
      const orders = calculateRequiredOrders(Number(goalForm.revenueGoal), Number(goalForm.expectedAverageTicket));
      const payld = {
        ...goalForm,
        revenueGoal: Number(goalForm.revenueGoal),
        expectedAverageTicket: Number(goalForm.expectedAverageTicket),
        requiredOrders: orders
      };
      
      if (goalForm.id) {
         await updateDoc(doc(db, 'prod_sales_goals', goalForm.id), { ...payld, updatedAt: serverTimestamp() });
         toast.success("Meta atualizada.");
      } else {
         await addDoc(collection(db, 'prod_sales_goals'), { ...payld, userId: user.uid, weeklyResults: [], createdAt: serverTimestamp() });
         toast.success("Meta cadastrada.");
      }
      setIsGoalModalOpen(false);
    } catch(e) {
      console.error(e);
      toast.error("Erro ao salvar meta");
    }
  };

  const handleDeleteGoal = async (id: string) => {
     if(!window.confirm("Deseja realmente excluir esta meta?")) return;
     try {
        await deleteDoc(doc(db, 'prod_sales_goals', id));
        toast.success("Meta excluída com sucesso.");
     } catch(e) {
        toast.error("Erro ao excluir meta.");
     }
  };

  const handleDupeGoal = async (g: SalesGoal) => {
     if(!user?.uid) return;
     try {
        const { id, ...payld } = g;
        await addDoc(collection(db, 'prod_sales_goals'), { ...payld, createdAt: serverTimestamp() });
        toast.success("Meta duplicada.");
     } catch(e) {
        toast.error("Erro ao duplicar meta.");
     }
  };

  const handleSaveResult = async () => {
     if(!user?.uid || !selectedGoal) return;
     try {
        const rev = Number(resultForm.realizedRevenue);
        const ord = Number(resultForm.realizedOrders);
        const tkt = ord > 0 ? rev / ord : 0;
        
        let wStat = 'dentro_esperado';
        const expectedWRev = selectedGoal.revenueGoal / 4;
        if(rev < expectedWRev * 0.9) wStat = 'abaixo_meta';
        if(rev > expectedWRev * 1.1) wStat = 'acima_meta';

        const newResult: WeeklyResult = {
           id: Date.now().toString(),
           ...resultForm,
           realizedRevenue: rev,
           realizedOrders: ord,
           realAverageTicket: tkt,
           weekStatus: wStat,
        } as WeeklyResult;

        const currentResults = selectedGoal.weeklyResults || [];
        const newResultsList = [...currentResults, newResult];

        const totalRev = newResultsList.reduce((acc, r) => acc + r.realizedRevenue, 0);
        let newGoalStatus = selectedGoal.status;
        if(totalRev >= selectedGoal.revenueGoal) newGoalStatus = 'batida';
        else if (selectedGoal.status === 'planejada') newGoalStatus = 'em_andamento';

        await updateDoc(doc(db, 'prod_sales_goals', selectedGoal.id), {
           weeklyResults: newResultsList,
           status: newGoalStatus,
           updatedAt: serverTimestamp()
        });

        toast.success("Resultado semanal salvo com sucesso!");
        setIsResultModalOpen(false);
     } catch(e) {
        toast.error("Erro ao salvar resultado.");
     }
  };

  const handleDeleteCompany = async (id: string) => {
      if(!window.confirm("Deseja realmente excluir esta empresa? (Isso não excluirá as metas associadas automaticamente)")) return;
      try {
         await deleteDoc(doc(db, 'prod_companies', id));
         toast.success("Empresa excluída.");
      } catch(e) {
         toast.error("Erro ao excluir.");
      }
  };
  const handleDeleteChannel = async (id: string) => {
      if(!window.confirm("Deseja realmente excluir este canal?")) return;
      try {
         await deleteDoc(doc(db, 'prod_sales_channels', id));
         toast.success("Canal excluído.");
      } catch(e) {
         toast.error("Erro ao excluir.");
      }
  };

  // Derived Data & Filtering
  const filteredGoals = useMemo(() => {
     return goals.filter(g => {
        if(filterCompany !== 'Todos' && g.companyId !== filterCompany) return false;
        if(filterChannel !== 'Todos' && g.channelId !== filterChannel) return false;
        if(filterMonth !== 'Todos' && g.month !== parseInt(filterMonth)) return false;
        if(filterYear !== 'Todos' && g.year !== parseInt(filterYear)) return false;
        return true;
     });
  }, [goals, filterCompany, filterChannel, filterMonth, filterYear]);

  const cardsData = useMemo(() => {
     let metaTotal = 0;
     let realizadoTotal = 0;
     let targetOrdersTotal = 0;
     let realizedOrdersTotal = 0;

     const channMap: any = {};
     const cnpjMap: any = {};

     filteredGoals.forEach(g => {
        metaTotal += g.revenueGoal;
        targetOrdersTotal += g.requiredOrders;
        
        let gRealizado = 0;
        let gOrders = 0;
        if(g.weeklyResults) {
           g.weeklyResults.forEach(r => {
             gRealizado += r.realizedRevenue;
             gOrders += r.realizedOrders;
           });
        }
        realizadoTotal += gRealizado;
        realizedOrdersTotal += gOrders;

        if(!channMap[g.channelId]) channMap[g.channelId] = { meta: 0, realizado: 0 };
        channMap[g.channelId].meta += g.revenueGoal;
        channMap[g.channelId].realizado += gRealizado;

        if(!cnpjMap[g.companyId]) cnpjMap[g.companyId] = { meta: 0, realizado: 0 };
        cnpjMap[g.companyId].meta += g.revenueGoal;
        cnpjMap[g.companyId].realizado += gRealizado;
     });

     const percent = metaTotal > 0 ? (realizadoTotal / metaTotal) * 100 : 0;
     const falta = Math.max(0, metaTotal - realizadoTotal);
     const remainingOrders = Math.max(0, targetOrdersTotal - realizedOrdersTotal);
     const actualTicketTotal = realizedOrdersTotal > 0 ? realizadoTotal / realizedOrdersTotal : 0;

     let bestChannelId = null;
     let bestChPercent = -1;
     Object.keys(channMap).forEach(k => {
        const met = channMap[k].meta;
        const rel = channMap[k].realizado;
        if(met > 0 && (rel/met) > bestChPercent) {
          bestChPercent = rel/met;
          bestChannelId = k;
        }
     });

     let bestCnpjId = null;
     let bestCnjPercent = -1;
     Object.keys(cnpjMap).forEach(k => {
        const met = cnpjMap[k].meta;
        const rel = cnpjMap[k].realizado;
        if(met > 0 && (rel/met) > bestCnjPercent) {
           bestCnjPercent = rel/met;
           bestCnpjId = k;
        }
     });

     return {
        metaTotal, realizadoTotal, percent, falta, remainingOrders, actualTicketTotal, bestChannelId, bestChPercent, bestCnpjId, bestCnjPercent, channMap, cnpjMap
     };
  }, [filteredGoals]);

  // Insights Logic
  const generateInsights = () => {
     const msgs = [];
     if(cardsData.percent >= 100) msgs.push({ text: "Parabéns! A meta global foi atingida.", type: 'success' });
     if(cardsData.bestChannelId) {
        const ch = channels.find(c=>c.id === cardsData.bestChannelId)?.nickname;
        msgs.push({ text: `O canal ${ch} apresenta o melhor desempenho com ${(cardsData.bestChPercent * 100).toFixed(1)}% da meta.`, type: 'info' });
     }
     if(cardsData.bestCnpjId) {
        const cp = companies.find(c=>c.id === cardsData.bestCnpjId)?.tradeName;
        msgs.push({ text: `A empresa ${cp} está mais próxima de atingir a sua meta mensal.`, type: 'info' });
     }
     if(cardsData.falta > 0 && cardsData.percent < 100) {
        msgs.push({ text: `Ainda faltam ${formatCurrency(cardsData.falta, false)} para atingir a meta global.`, type: 'warning' });
     }
     if(cardsData.percent > 0 && cardsData.percent < 100) {
        const dayOfMonth = getDate(new Date());
        const daysInMonth = getDaysInMonth(new Date());
        const expectedP = (dayOfMonth / daysInMonth) * 100;
        if (cardsData.percent < expectedP - 10) {
           msgs.push({ text: "Atenção: O ritmo atual de vendas está abaixo do esperado para a data de hoje.", type: 'risk' });
        } else if (cardsData.percent > expectedP + 5) {
           msgs.push({ text: "Ótimo ritmo! As vendas estão acima da média diária esperada.", type: 'success' });
        }
     }
     return msgs;
  };
  const insights = generateInsights();

  // Helper formats
  const formatVal = (v: number) => privacyMode ? 'R$ •••••' : formatCurrency(v, false);
  const COLORS = ['#6D4AFF', '#9B8CFF', '#D8B4E2', '#A5ADBD', '#6B7280'];

  // Data mapping for charts and rankings
  const channelRanking = Object.keys(cardsData.channMap).map(k => {
     const ch = channels.find(c => c.id === k);
     return {
        id: k,
        name: ch?.nickname || 'Desconhecido',
        meta: cardsData.channMap[k].meta,
        realizado: cardsData.channMap[k].realizado,
        percent: cardsData.channMap[k].meta > 0 ? (cardsData.channMap[k].realizado / cardsData.channMap[k].meta) * 100 : 0
     };
  }).sort((a,b) => b.percent - a.percent);

  const companyRanking = Object.keys(cardsData.cnpjMap).map(k => {
     const cnj = companies.find(c => c.id === k);
     return {
        id: k,
        name: cnj?.tradeName || 'Desconhecido',
        cnpj: cnj?.cnpj,
        meta: cardsData.cnpjMap[k].meta,
        realizado: cardsData.cnpjMap[k].realizado,
        percent: cardsData.cnpjMap[k].meta > 0 ? (cardsData.cnpjMap[k].realizado / cardsData.cnpjMap[k].meta) * 100 : 0
     };
  }).sort((a,b) => b.percent - a.percent);

  // Projeção
  const getProjecao = () => {
      if(cardsData.metaTotal === 0 || cardsData.realizadoTotal === 0) return { projecao: 0, dailyNeeded: 0, daysLeft: 0 };
      const today = new Date();
      const end = endOfMonth(today);
      const daysLeft = Math.max(0, differenceInDays(end, today));
      const passedDays = getDate(today);
      
      const velocity = cardsData.realizadoTotal / passedDays;
      const projecao = cardsData.realizadoTotal + (velocity * daysLeft);
      const dailyNeeded = daysLeft > 0 ? Math.max(0, cardsData.metaTotal - cardsData.realizadoTotal) / daysLeft : 0;

      return { projecao, dailyNeeded, daysLeft };
  };
  const proj = getProjecao();

  const getStatusBadge = (percent: number) => {
     if(percent >= 100) return <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Atingida</span>;
     if(percent >= 80) return <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">No Ritmo</span>;
     if(percent >= 50) return <span className="bg-orange-500/10 text-orange-500 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Atenção</span>;
     return <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Em Risco</span>;
  };


  // Monthly Comparative Data
  const monthlyData = useMemo(() => {
     const data = [];
     const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
     for(let i = 1; i <= 12; i++) {
        let meta = 0;
        let realizado = 0;
        
        goals.filter(g => {
           if(filterCompany !== 'Todos' && g.companyId !== filterCompany) return false;
           if(filterChannel !== 'Todos' && g.channelId !== filterChannel) return false;
           if(filterYear !== 'Todos' && g.year !== parseInt(filterYear)) return false;
           if(g.month !== i) return false;
           return true;
        }).forEach(g => {
           meta += g.revenueGoal || 0;
           if(g.weeklyResults) {
              g.weeklyResults.forEach(r => {
                 realizado += r.realizedRevenue || 0;
              });
           }
        });

        data.push({
           name: months[i-1],
           meta,
           realizado
        });
     }
     return data;
  }, [goals, filterCompany, filterChannel, filterYear]);

  // Evolution Chart (Mock/Calculated data)
  const evolutionData = [
     { name: 'Sem 1', meta: cardsData.metaTotal * 0.25, realizado: cardsData.realizadoTotal * 0.2 },
     { name: 'Sem 2', meta: cardsData.metaTotal * 0.5, realizado: cardsData.realizadoTotal * 0.4 },
     { name: 'Sem 3', meta: cardsData.metaTotal * 0.75, realizado: cardsData.realizadoTotal * 0.7 },
     { name: 'Sem 4', meta: cardsData.metaTotal, realizado: cardsData.realizadoTotal }
  ];

  const clearFilters = () => {
      setFilterCompany('Todos');
      setFilterChannel('Todos');
      setFilterMonth((new Date().getMonth() + 1).toString());
      setFilterYear(new Date().getFullYear().toString());
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 px-6 lg:px-10 pt-6 pb-24 md:pb-12 w-full max-w-none mx-auto">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6D4AFF]/20">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[34px] font-bold tracking-tight text-gray-900 dark:text-white leading-none">
                Metas de Vendas
              </h1>
              <button 
                onClick={togglePrivacy}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[15px] text-gray-500 dark:text-[#A8B0C0] mt-1 font-medium">
              Gerencie metas por empresa, CNPJ e canal de vendas.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button onClick={()=>{setChannelForm({status:'ativo'}); setIsChannelModalOpen(true);}} variant="outline" className="h-12 rounded-xl font-bold bg-white dark:bg-[#181B24] border-gray-100 dark:border-white/10 shadow-sm"><Store className="w-4 h-4 mr-2"/> Novo Canal</Button>
          <Button onClick={()=>{setCompanyForm({status:'ativo'}); setIsCompanyModalOpen(true);}} variant="outline" className="h-12 rounded-xl font-bold bg-white dark:bg-[#181B24] border-gray-100 dark:border-white/10 shadow-sm"><Building2 className="w-4 h-4 mr-2"/> Nova Empresa</Button>
          <Button onClick={()=>{setGoalForm(defaultGoalForm); setIsGoalModalOpen(true);}} className="h-12 rounded-xl bg-[#6D4AFF] hover:bg-[#5B3EE6] text-white font-bold shadow-md shadow-[#6D4AFF]/20">
             <Plus className="w-5 h-5 mr-1" /> Nova Meta
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="w-full overflow-x-auto pb-2 -mb-2">
        <TabsList className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 p-1.5 rounded-2xl inline-flex min-w-max">
          <TabsTrigger value="painel" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#181B24] data-[state=active]:shadow-sm data-[state=active]:text-[#6D4AFF] dark:data-[state=active]:text-[#7B61FF]">
            Painel de Metas
          </TabsTrigger>
          <TabsTrigger value="config" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#181B24] data-[state=active]:shadow-sm data-[state=active]:text-[#6D4AFF] dark:data-[state=active]:text-[#7B61FF]">
            Configurações e Canais
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="painel">
        <div className="space-y-8">
          
          {/* GLASS FILTER PANEL */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-[#181B24]/80 backdrop-blur-2xl rounded-[24px] p-6 border border-gray-100 dark:border-white/5 shadow-sm"
          >
             <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="h-12 flex items-center bg-gray-50 dark:bg-white/5 rounded-[18px] px-1 border border-gray-100 dark:border-white/5">
                        <Select value={filterMonth} onValueChange={setFilterMonth}>
                        <SelectTrigger className="w-[140px] h-10 border-0 bg-transparent shadow-none font-bold focus:ring-0">
                            <Calendar className="w-4 h-4 mr-2 text-[#6D4AFF] dark:text-[#7B61FF]" />
                            <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            {Array.from({length: 12}).map((_, i) => (
                                <SelectItem key={i+1} value={(i+1).toString()} className="font-medium rounded-xl">{format(new Date(2024, i, 1), 'MMMM', {locale: ptBR})}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="h-12 flex items-center bg-gray-50 dark:bg-white/5 rounded-[18px] px-1 border border-gray-100 dark:border-white/5">
                        <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger className="w-[110px] h-10 border-0 bg-transparent shadow-none font-bold focus:ring-0">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            {['2024', '2025', '2026'].map(y => (
                                <SelectItem key={y} value={y} className="font-medium rounded-xl">{y}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="h-12 flex items-center bg-gray-50 dark:bg-white/5 rounded-[18px] px-1 border border-gray-100 dark:border-white/5">
                        <Select value={filterCompany} onValueChange={setFilterCompany}>
                        <SelectTrigger className="w-[180px] h-10 border-0 bg-transparent shadow-none font-bold focus:ring-0">
                            <Building2 className="w-4 h-4 mr-2 text-[#6D4AFF] dark:text-[#7B61FF]" />
                            <SelectValue placeholder="Empresa" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="Todos" className="font-medium rounded-xl">Todas Empresas</SelectItem>
                            {companies.map(c => (
                                <SelectItem key={c.id} value={c.id} className="font-medium rounded-xl">{c.tradeName}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="h-12 flex items-center bg-gray-50 dark:bg-white/5 rounded-[18px] px-1 border border-gray-100 dark:border-white/5">
                        <Select value={filterChannel} onValueChange={setFilterChannel}>
                        <SelectTrigger className="w-[180px] h-10 border-0 bg-transparent shadow-none font-bold focus:ring-0">
                            <Store className="w-4 h-4 mr-2 text-[#6D4AFF] dark:text-[#7B61FF]" />
                            <SelectValue placeholder="Canal" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="Todos" className="font-medium rounded-xl">Todos Canais</SelectItem>
                            {channels.map(c => (
                                <SelectItem key={c.id} value={c.id} className="font-medium rounded-xl">{c.nickname}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button variant="ghost" onClick={clearFilters} className="rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold h-12">
                   <FilterX className="w-4 h-4 mr-2" /> Limpar Filtros
                </Button>
             </div>
          </motion.div>

          {/* 6 EXEC KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[
                { title: 'Meta Total', value: formatCurrency(cardsData.metaTotal), icon: Target, color: 'text-[#6D4AFF]', bg: 'bg-[#6D4AFF]/10', trend: null },
                { title: 'Realizado', value: formatCurrency(cardsData.realizadoTotal), icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: `${cardsData.percent.toFixed(1)}% atingido` },
                { title: 'Falta Faturar', value: formatCurrency(cardsData.falta), icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10', trend: null }
             ].map((card, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-[#181B24] rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-gray-100 dark:border-white/5 flex flex-col justify-between"
                >
                   <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.bg}`}>
                         <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <span className="text-[13px] font-bold text-gray-500 dark:text-[#A8B0C0] tracking-wide uppercase">{card.title}</span>
                   </div>
                   <div>
                      <div className="text-xl xl:text-2xl font-black text-gray-900 dark:text-white truncate">{card.value}</div>
                      {card.trend && <div className="text-[12px] font-bold text-gray-400 mt-1">{card.trend}</div>}
                   </div>
                </motion.div>
             ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
             
             {/* RANKING PRINCIPAL E CARDS (OCUPA 8 COLUNAS NO DESKTOP) */}
             <div className="xl:col-span-8 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6D4AFF]/20">
                      <TrendingUp className="w-5 h-5 text-white" />
                   </div>
                   <h2 className="text-4xl font-bold tracking-tight text-foreground text-gray-900 dark:text-white">Ranking de Performance</h2>
                </div>

                <div className="space-y-4">
                   {filteredGoals.sort((a,b) => {
                      const pA = a.revenueGoal > 0 ? ((a.weeklyResults?.reduce((acc, r) => acc + r.realizedRevenue, 0) || 0) / a.revenueGoal) * 100 : 0;
                      const pB = b.revenueGoal > 0 ? ((b.weeklyResults?.reduce((acc, r) => acc + r.realizedRevenue, 0) || 0) / b.revenueGoal) * 100 : 0;
                      return pB - pA;
                   }).map((g, idx) => {
                      const channel = channels.find(c => c.id === g.channelId);
                      const comp = companies.find(c => c.id === g.companyId);
                      const real = g.weeklyResults?.reduce((acc, r) => acc + r.realizedRevenue, 0) || 0;
                      const p = g.revenueGoal > 0 ? (real / g.revenueGoal) * 100 : 0;
                      const falta = Math.max(0, g.revenueGoal - real);
                      
                      let badge = null;
                      if (p >= 100) badge = <span className="bg-emerald-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center shadow-md shadow-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Meta Batida</span>;
                      else if (p >= 90) badge = <span className="bg-blue-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center shadow-md shadow-blue-500/20"><Target className="w-3 h-3 mr-1" /> Quase Lá</span>;
                      else if (p >= 70) badge = <span className="bg-[#6D4AFF] text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center shadow-md shadow-[#6D4AFF]/20"><TrendingUp className="w-3 h-3 mr-1" /> Em Alta</span>;
                      else if (p <= 30) badge = <span className="bg-red-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center shadow-md shadow-red-500/20"><AlertCircle className="w-3 h-3 mr-1" /> Precisa Acelerar</span>;
                      
                      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx+1}º`;
                      const isTop3 = idx < 3;

                      return (
                         <motion.div key={g.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                            className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-gray-100 dark:border-white/5 relative overflow-hidden group"
                         >
                            {isTop3 && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#6D4AFF]/10 to-transparent rounded-bl-full pointer-events-none" />}
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                               <div className="flex items-start md:items-center gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm ${isTop3 ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                     {medal}
                                  </div>
                                  <div>
                                     <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{channel?.nickname || 'Canal'}</h3>
                                        {badge}
                                     </div>
                                     <p className="text-sm font-medium text-gray-500">{comp?.tradeName} • {channel?.marketplace}</p>
                                  </div>
                               </div>

                               <div className="flex items-center gap-2">
                                  <DropdownMenu>
                                     <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 h-10 w-10 p-0 text-gray-400 hover:text-gray-600 transition-colors">
                                        <MoreVertical className="h-5 w-5" />
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
                                        <DropdownMenuItem onClick={() => { setSelectedGoal(g); setResultForm({...defaultResultForm, weekLabel: `Semana ${(g.weeklyResults?.length||0)+1}`, weekNumber: (g.weeklyResults?.length||0)+1}); setIsResultModalOpen(true); }} className="rounded-xl font-bold text-sm cursor-pointer py-2">
                                           <Plus className="mr-2 h-4 w-4" /> Registrar Resultado
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setGoalForm(g); setIsGoalModalOpen(true); }} className="rounded-xl font-bold text-sm cursor-pointer py-2">
                                           <Edit2 className="mr-2 h-4 w-4" /> Editar Meta
                                        </DropdownMenuItem>
                                     </DropdownMenuContent>
                                  </DropdownMenu>
                               </div>
                            </div>

                            {/* PREMIUM PROGRESS BAR */}
                            <div className="mt-8">
                               <div className="flex items-center justify-between mb-3 text-sm font-bold">
                                  <span className="text-[#6D4AFF]">{p.toFixed(1)}% Concluído</span>
                                  <span className="text-gray-400">Meta: {formatCurrency(g.revenueGoal)}</span>
                               </div>
                               <div className="h-6 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner relative">
                                  <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${Math.min(p, 100)}%` }}
                                     transition={{ duration: 1, ease: "easeOut" }}
                                     className={`h-full rounded-full relative overflow-hidden ${p >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#6D4AFF] to-[#8B5CF6]'}`}
                                     style={{ boxShadow: p < 100 ? '0 0 20px rgba(109, 74, 255, 0.4)' : 'none' }}
                                  >
                                     {p < 100 && (
                                        <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-white/20 to-transparent transform -skew-x-12 translate-x-10 animate-shimmer" />
                                     )}
                                  </motion.div>
                               </div>
                               
                               <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
                                  <div>
                                     <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Realizado</p>
                                     <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(real)}</p>
                                  </div>
                                  <div>
                                     <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Falta Faturar</p>
                                     <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(falta)}</p>
                                  </div>
                                  <div>
                                     <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Meta Diária (Hoje em Diante)</p>
                                     <p className="text-lg font-black text-[#6D4AFF]">{formatCurrency(proj.daysLeft > 0 ? falta / proj.daysLeft : 0)}/dia</p>
                                  </div>
                               </div>
                            </div>
                         </motion.div>
                      );
                   })}
                   
                   {filteredGoals.length === 0 && (
                      <div className="py-20 text-center">
                         <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-gray-400" />
                         </div>
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma meta encontrada</h3>
                         <p className="text-gray-500 font-medium">Crie uma nova meta ou ajuste os filtros.</p>
                      </div>
                   )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

                {/* GRÁFICO (REDUZIDO) */}
                <div className="bg-white dark:bg-[#181B24] rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-gray-100 dark:border-white/5 h-full">
                   <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Evolução Geral</h3>
                      <p className="text-sm text-gray-500 font-medium">Meta vs. Realizado</p>
                   </div>
                   <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={evolutionData}>
                            <defs>
                               <linearGradient id="colorRealMini" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6D4AFF" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#6D4AFF" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF5" opacity={0.5} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A8B0C0', fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A8B0C0', fontWeight: 600 }} tickFormatter={(val)=>`R$${(val/1000).toFixed(0)}k`} width={40} />
                            <RechartsTooltip 
                               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                               formatter={(val: number)=>formatCurrency(val, false)}
                            />
                            <Area type="monotone" dataKey="meta" stroke="#A8B0C0" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                            <Area type="monotone" dataKey="realizado" stroke="#6D4AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorRealMini)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                {/* COMPARATIVO MENSAL */}
                <div className="bg-white dark:bg-[#181B24] rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-gray-100 dark:border-white/5 h-full">
                   <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Comparativo Mês a Mês</h3>
                      <p className="text-sm text-gray-500 font-medium">Meta vs. Realizado (Ano)</p>
                   </div>
                   <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF5" opacity={0.5} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A8B0C0', fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A8B0C0', fontWeight: 600 }} tickFormatter={(val)=>`R$${(val/1000).toFixed(0)}k`} width={40} />
                            <RechartsTooltip 
                               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                               formatter={(val) => formatCurrency(val, false)}
                               cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="meta" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={8} />
                            <Bar dataKey="realizado" fill="#6D4AFF" radius={[4, 4, 0, 0]} barSize={8} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                </div>
             </div>

             {/* RESUMO EXECUTIVO (COCKPIT) E GRÁFICO (OCUPA 4 COLUNAS) */}
             <div className="xl:col-span-4 space-y-6">
                
                {/* COCKPIT */}
                <div className="bg-[#6D4AFF] rounded-[32px] p-8 text-white shadow-xl shadow-[#6D4AFF]/20 relative overflow-hidden">
                   <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                   
                   <h3 className="text-xl font-bold mb-8 flex items-center"><Activity className="w-5 h-5 mr-2" /> Cockpit do Mês</h3>
                   
                   <div className="flex justify-center mb-8">
                      <div className="relative w-40 h-40">
                         {/* CIRCULAR PROGRESS */}
                         <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                            <motion.circle 
                               initial={{ strokeDasharray: "0 251.2" }}
                               animate={{ strokeDasharray: `${Math.min(cardsData.percent, 100) * 2.512} 251.2` }}
                               transition={{ duration: 1.5, ease: "easeOut" }}
                               cx="50" cy="50" r="40" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" 
                            />
                         </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-4xl font-black">{cardsData.percent.toFixed(0)}%</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Atingido</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                         <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">Dias Restantes</p>
                         <p className="text-3xl font-black">{proj.daysLeft} dias</p>
                      </div>
                      
                      <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                         <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">Venda Média Necessária</p>
                         <p className="text-3xl font-black">{formatCurrency(proj.dailyNeeded)}<span className="text-lg font-bold text-white/70">/dia</span></p>
                      </div>
                   </div>
                </div>

                {/* INSIGHTS */}
                <div className="space-y-3">
                   {generateInsights().map((ins, i) => (
                      <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${ins.type==='success'?'bg-emerald-50 border-emerald-100 text-emerald-700':ins.type==='warning'?'bg-orange-50 border-orange-100 text-orange-700':ins.type==='risk'?'bg-red-50 border-red-100 text-red-700':'bg-[#6D4AFF]/5 border-[#6D4AFF]/20 text-[#6D4AFF]'}`}>
                         <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
                         <p className="text-sm font-bold">{ins.text}</p>
                      </div>
                   ))}
                </div>

             </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="config">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* EMPRESAS */}
            <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-gray-100 dark:border-white/5">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Empresas e CNPJs</h3>
                  <Button onClick={()=>{setCompanyForm({status:'ativo'}); setIsCompanyModalOpen(true);}} variant="outline" className="h-9 rounded-xl font-bold text-xs"><Plus className="w-3 h-3 mr-1"/> Adicionar</Button>
               </div>
               <div className="space-y-3">
                  {companies.map(c => (
                     <div key={c.id} className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between group">
                        <div>
                           <div className="font-bold text-gray-900 dark:text-white text-sm">{c.tradeName}</div>
                           <div className="text-xs text-gray-500 font-medium">{c.cnpj}</div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button variant="ghost" size="icon" onClick={()=>{setCompanyForm(c); setIsCompanyModalOpen(true);}} className="h-8 w-8 rounded-lg"><Edit2 className="w-3 h-3 text-gray-500"/></Button>
                           <Button variant="ghost" size="icon" onClick={()=>handleDeleteCompany(c.id)} className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3 h-3"/></Button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* CANAIS */}
            <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-gray-100 dark:border-white/5">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Canais de Venda</h3>
                  <Button onClick={()=>{setChannelForm({status:'ativo'}); setIsChannelModalOpen(true);}} variant="outline" className="h-9 rounded-xl font-bold text-xs"><Plus className="w-3 h-3 mr-1"/> Adicionar</Button>
               </div>
               <div className="space-y-3">
                  {channels.map(c => {
                     const cmp = companies.find(cp => cp.id === c.companyId)?.tradeName || 'Desconhecida';
                     return (
                     <div key={c.id} className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between group">
                        <div>
                           <div className="font-bold text-gray-900 dark:text-white text-sm">{c.nickname}</div>
                           <div className="text-xs text-gray-500 font-medium">{c.marketplace} • {cmp}</div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button variant="ghost" size="icon" onClick={()=>{setChannelForm(c); setIsChannelModalOpen(true);}} className="h-8 w-8 rounded-lg"><Edit2 className="w-3 h-3 text-gray-500"/></Button>
                           <Button variant="ghost" size="icon" onClick={()=>handleDeleteChannel(c.id)} className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3 h-3"/></Button>
                        </div>
                     </div>
                     );
                  })}
               </div>
            </div>
         </div>
      </TabsContent>
      </Tabs>
      {/* MODALS */}
      {/* PIN Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-4xl font-bold tracking-tight text-foreground text-center">Modo Confidencial</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePinSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Digite o PIN para visualizar</label>
              <Input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} className="h-14 rounded-2xl text-center text-2xl tracking-[0.5em] font-bold" autoFocus placeholder="••••" maxLength={4} />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-[#6D4AFF] hover:bg-[#5b3ce0] text-white font-bold">Desbloquear</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Empresa Modal */}
      <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8">
             <DialogHeader><DialogTitle className="text-4xl font-bold tracking-tight text-foreground">Empresa / CNPJ</DialogTitle></DialogHeader>
             <div className="space-y-4 mt-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Razão Social</label><Input value={companyForm.name||''} onChange={e=>setCompanyForm({...companyForm, name: e.target.value})} className="h-12 rounded-xl font-bold" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Nome Fantasia</label><Input value={companyForm.tradeName||''} onChange={e=>setCompanyForm({...companyForm, tradeName: e.target.value})} className="h-12 rounded-xl font-bold" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">CNPJ</label><Input value={companyForm.cnpj||''} onChange={e=>setCompanyForm({...companyForm, cnpj: e.target.value})} className="h-12 rounded-xl font-bold" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Responsável</label><Input value={companyForm.responsible||''} onChange={e=>setCompanyForm({...companyForm, responsible: e.target.value})} className="h-12 rounded-xl font-bold" /></div>
             </div>
             <DialogFooter className="mt-6"><Button onClick={handleSaveCompany} className="h-12 px-8 rounded-xl bg-[#6D4AFF] text-white font-bold w-full">Salvar Empresa</Button></DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Canal Modal */}
      <Dialog open={isChannelModalOpen} onOpenChange={setIsChannelModalOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8">
             <DialogHeader><DialogTitle className="text-4xl font-bold tracking-tight text-foreground">Canal de Venda</DialogTitle></DialogHeader>
             <div className="space-y-4 mt-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Empresa Vinculada</label>
                   <Select value={channelForm.companyId||''} onValueChange={v=>setChannelForm({...channelForm, companyId: v})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Selecione"/></SelectTrigger>
                      <SelectContent className="rounded-xl">{companies.map(c=><SelectItem key={c.id} value={c.id} className="font-bold">{c.tradeName}</SelectItem>)}</SelectContent>
                   </Select>
                </div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Marketplace/Origem</label>
                   <Select value={channelForm.marketplace||''} onValueChange={v=>setChannelForm({...channelForm, marketplace: v})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Selecione"/></SelectTrigger>
                      <SelectContent className="rounded-xl">{MARKETPLACES.map(m=><SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}</SelectContent>
                   </Select>
                </div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Nome/Apelido da Conta</label><Input value={channelForm.nickname||''} onChange={e=>setChannelForm({...channelForm, nickname: e.target.value})} className="h-12 rounded-xl font-bold" placeholder="Ex: ML Oficial" /></div>
             </div>
             <DialogFooter className="mt-6"><Button onClick={handleSaveChannel} className="h-12 px-8 rounded-xl bg-[#6D4AFF] text-white font-bold w-full">Salvar Canal</Button></DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Meta Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8 max-h-[90vh] overflow-y-auto">
             <DialogHeader><DialogTitle className="text-4xl font-bold tracking-tight text-foreground">Configurar Meta</DialogTitle></DialogHeader>
             <div className="space-y-4 mt-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Empresa</label>
                   <Select value={goalForm.companyId||''} onValueChange={v=>setGoalForm({...goalForm, companyId: v})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Selecione"/></SelectTrigger>
                      <SelectContent className="rounded-xl">{companies.map(c=><SelectItem key={c.id} value={c.id} className="font-bold">{c.tradeName}</SelectItem>)}</SelectContent>
                   </Select>
                </div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Canal de Venda</label>
                   <Select value={goalForm.channelId||''} onValueChange={v=>setGoalForm({...goalForm, channelId: v})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Selecione"/></SelectTrigger>
                      <SelectContent className="rounded-xl">{channels.filter(c=>!goalForm.companyId || c.companyId === goalForm.companyId).map(c=><SelectItem key={c.id} value={c.id} className="font-bold">{c.nickname}</SelectItem>)}</SelectContent>
                   </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Mês</label>
                      <Select value={goalForm.month?.toString()} onValueChange={v=>setGoalForm({...goalForm, month: parseInt(v)})}>
                         <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Mês"/></SelectTrigger>
                         <SelectContent className="rounded-xl">{Array.from({length:12}).map((_,i)=><SelectItem key={i+1} value={(i+1).toString()} className="font-bold">{i+1}</SelectItem>)}</SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Ano</label>
                      <Select value={goalForm.year?.toString()} onValueChange={v=>setGoalForm({...goalForm, year: parseInt(v)})}>
                         <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Ano"/></SelectTrigger>
                         <SelectContent className="rounded-xl">{['2024','2025','2026'].map(y=><SelectItem key={y} value={y} className="font-bold">{y}</SelectItem>)}</SelectContent>
                      </Select>
                   </div>
                </div>

                <div className="p-4 bg-[#6D4AFF]/5 rounded-2xl border border-[#6D4AFF]/20 space-y-4">
                   <div className="space-y-1"><label className="text-xs font-bold text-[#6D4AFF] uppercase tracking-wider">Meta de Faturamento (R$)</label>
                      <Input type="number" value={goalForm.revenueGoal||''} onChange={e=>setGoalForm({...goalForm, revenueGoal: Number(e.target.value)})} className="h-14 rounded-2xl font-black text-2xl text-[#6D4AFF] bg-white border-[#6D4AFF]/20" />
                   </div>
                   <div className="space-y-1"><label className="text-xs font-bold text-[#6D4AFF] uppercase tracking-wider">Ticket Médio Esperado (R$)</label>
                      <Input type="number" value={goalForm.expectedAverageTicket||''} onChange={e=>setGoalForm({...goalForm, expectedAverageTicket: Number(e.target.value)})} className="h-12 rounded-xl font-bold border-[#6D4AFF]/20" />
                   </div>
                </div>
             </div>
             <DialogFooter className="mt-6"><Button onClick={handleSaveGoal} className="h-12 px-8 rounded-xl bg-[#6D4AFF] text-white font-bold w-full">Salvar Meta</Button></DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Result Modal */}
      <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8">
             <DialogHeader><DialogTitle className="text-4xl font-bold tracking-tight text-foreground">Registrar Resultado</DialogTitle></DialogHeader>
             <div className="space-y-4 mt-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Semana/Período</label><Input value={resultForm.weekLabel||''} onChange={e=>setResultForm({...resultForm, weekLabel: e.target.value})} className="h-12 rounded-xl font-bold" /></div>
                
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-4">
                   <div className="space-y-1"><label className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Faturamento Realizado (R$)</label>
                      <Input type="number" value={resultForm.realizedRevenue||''} onChange={e=>setResultForm({...resultForm, realizedRevenue: Number(e.target.value)})} className="h-14 rounded-2xl font-black text-2xl text-emerald-700 bg-white border-emerald-200" />
                   </div>
                   <div className="space-y-1"><label className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Pedidos Vendidos</label>
                      <Input type="number" value={resultForm.realizedOrders||''} onChange={e=>setResultForm({...resultForm, realizedOrders: Number(e.target.value)})} className="h-12 rounded-xl font-bold border-emerald-200" />
                   </div>
                </div>
             </div>
             <DialogFooter className="mt-6"><Button onClick={handleSaveResult} className="h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold w-full">Salvar Resultado</Button></DialogFooter>
          </DialogContent>
      </Dialog>

    </div>
  );
}
