import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { Textarea } from '../../components/ui/textarea';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Check, CheckCircle2, ChevronDown, Clock, CreditCard, DollarSign, Download, Edit2, Eye, EyeOff, FileText, Filter, MoreVertical, Plus, Search, TrendingUp, AlertTriangle, Building2, Trash2, Copy, Wallet, ChevronLeft, ChevronRight, CheckSquare, Sparkles, X, FileUp, Paperclip, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar, Legend, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isSameMonth, differenceInDays, isToday, addDays, addMonths, setDate, isAfter, isBefore, isSameDay, startOfDay, endOfDay, eachDayOfInterval, getDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ContasAPagar() {
  const { isPessoal, privacyMode, togglePrivacy, config } = useAppContext();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data
  const [accountsPayable, setAccountsPayable] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);

  // Modals
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);

  // Filters
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterFornecedor, setFilterFornecedor] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterFormaPagamento, setFilterFormaPagamento] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrdenacao, setFilterOrdenacao] = useState('mais_recentes');

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form State
  const defaultForm = {
    description: '',
    launchType: 'compra',
    category: '',
    supplier: '',
    totalValue: '',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'PIX',
    isInstallment: false,
    installmentCount: '1',
    firstDueDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    creditCardName: '',
    barcode: '',
    isLongTermInvestment: false,
    competencia: format(new Date(), 'yyyy-MM'),
  };

  const [formData, setFormData] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => setFormData(defaultForm);

  const handleMarkAsPaid = async (inst: any) => {
    try {
      if (!user) return;
      await updateDoc(doc(db, `prod_accounts_payable/${inst.accountId}/installments/${inst.id}`), {
        status: 'pago',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paidValue: inst.value,
        updatedAt: serverTimestamp()
      });
      toast.success('Parcela marcada como paga!');
    } catch (error) {
      toast.error('Erro ao atualizar parcela.');
    }
  };

  const handleDeleteInstallment = async (inst: any) => {
    if(!confirm('Tem certeza que deseja excluir esta parcela?')) return;
    try {
      await deleteDoc(doc(db, `prod_accounts_payable/${inst.accountId}/installments/${inst.id}`));
      toast.success('Parcela excluída!');
    } catch (error) {
      toast.error('Erro ao excluir parcela.');
    }
  };

  const handleSaveNovaConta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setIsSubmitting(true);
      const isInv = formData.launchType.includes('investimento') || formData.launchType === 'investimento';
      const total = parseFloat(formData.totalValue.replace(',', '.'));
      
      const newAccount = {
        userId: user.uid,
        description: formData.description,
        launchType: formData.launchType,
        category: formData.category,
        supplier: formData.supplier,
        type: isPessoal ? 'pessoal' : 'empresa',
        totalValue: total,
        purchaseDate: formData.purchaseDate,
        paymentMethod: formData.paymentMethod,
        isInstallment: formData.isInstallment,
        installmentCount: parseInt(formData.installmentCount) || 1,
        firstDueDate: formData.firstDueDate,
        notes: formData.notes,
        isLongTermInvestment: isInv || formData.isLongTermInvestment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'prod_accounts_payable'), newAccount);

      const count = newAccount.isInstallment ? newAccount.installmentCount : 1;
      const instValue = total / count;

      let cDate = parseISO(newAccount.firstDueDate);
      
      for (let i = 1; i <= count; i++) {
        let status = 'pendente';
        if (isBefore(cDate, startOfDay(new Date()))) status = 'atrasado';
        else if (isSameDay(cDate, new Date())) status = 'vence_hoje';

        const inst = {
          userId: user.uid,
          accountId: docRef.id,
          type: newAccount.type,
          installmentNumber: i,
          totalInstallments: count,
          description: formData.description,
          supplier: formData.supplier,
          category: formData.category,
          value: instValue,
          dueDate: format(cDate, 'yyyy-MM-dd'),
          paymentDate: null,
          paidValue: null,
          remainingValue: instValue,
          status,
          paymentMethod: newAccount.paymentMethod,
          creditCardName: formData.creditCardName || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, `prod_accounts_payable/${docRef.id}/installments`), inst);
        cDate = addMonths(cDate, 1);
      }

      toast.success('Conta registrada com sucesso!');
      setIsNewAccountModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao registrar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const qCards = query(collection(db, 'prod_credit_cards'), where('userId', '==', user.uid), where('type', '==', isPessoal ? 'pessoal' : 'empresa'));
    const unsubCards = onSnapshot(qCards, snapshot => {
       setCreditCards(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qInstallments = query(collectionGroup(db, 'installments'), where('userId', '==', user.uid), where('type', '==', isPessoal ? 'pessoal' : 'empresa'));
    const unsubInst = onSnapshot(qInstallments, snapshot => {
       const instData = snapshot.docs.map(d => {
         const data = d.data();
         let st = data.status;
         // Dynamic status recalculation
         if (st !== 'pago' && st !== 'pago_parcial' && st !== 'cancelado') {
             const dueDate = parseISO(data.dueDate);
             if (isBefore(dueDate, startOfDay(new Date()))) st = 'atrasado';
             else if (isSameDay(dueDate, new Date())) st = 'vence_hoje';
             else st = 'pendente';
         }
         return {
           id: d.id,
           ref: d.ref,
           ...(data as any),
           status: st
         };
       });
       instData.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
       setInstallments(instData);
       setLoading(false);
    });

    const qAccounts = query(collection(db, 'prod_accounts_payable'), where('userId', '==', user.uid), where('type', '==', isPessoal ? 'pessoal' : 'empresa'));
    const unsubAcc = onSnapshot(qAccounts, snapshot => {
       setAccountsPayable(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubCards();
      unsubInst();
      unsubAcc();
    };
  }, [isPessoal, user]);

  // Derived Calculations
  const stats = useMemo(() => {
    let totalAPagar = 0;
    let venceHoje = 0;
    let vence7Dias = 0;
    let atrasado = 0;
    let parcelasFuturas = 0;
    let cartaoCredito = 0;
    let boletos = 0;

    const future30Days = addDays(new Date(), 30);
    const future90Days = addDays(new Date(), 90);

    let totalMes = 0;
    let total30Dias = 0;
    let total90Dias = 0;
    
    const supplierTotals: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};
    let maxVencimento = 0;

    installments.forEach(inst => {
      if (inst.status === 'pago' || inst.status === 'cancelado') return;
      
      const v = Number(inst.value || 0);
      totalAPagar += v;
      parcelasFuturas++;

      if (inst.paymentMethod === 'Cartão de Crédito') cartaoCredito += v;
      if (inst.paymentMethod === 'Boleto') boletos += v;

      const dueDate = new Date(inst.dueDate);
      if (isBefore(dueDate, startOfDay(new Date()))) {
        atrasado += v;
      } else if (isSameDay(dueDate, new Date())) {
        venceHoje += v;
      } else if (differenceInDays(dueDate, new Date()) <= 7 && differenceInDays(dueDate, new Date()) > 0) {
        vence7Dias += v;
      }

      if (isSameMonth(dueDate, new Date())) totalMes += v;
      if (isBefore(dueDate, future30Days)) total30Dias += v;
      if (isBefore(dueDate, future90Days)) total90Dias += v;

      if (v > maxVencimento) maxVencimento = v;

      const sup = inst.supplier || 'Outros';
      supplierTotals[sup] = (supplierTotals[sup] || 0) + v;

      const cat = inst.category || 'Outros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + v;
    });

    const maiorFornecedor = Object.keys(supplierTotals).reduce((a, b) => supplierTotals[a] > supplierTotals[b] ? a : b, 'Nenhum');
    const maiorCategoria = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b, 'Nenhuma');

    const investimentosLP = accountsPayable
      .filter(a => a.isLongTermInvestment)
      .reduce((acc, a) => acc + Number(a.totalValue || 0), 0);

    return {
        totalAPagar, venceHoje, vence7Dias, atrasado, parcelasFuturas, cartaoCredito, boletos, investimentosLP,
        totalMes, total30Dias, total90Dias, maxVencimento, maiorFornecedor, maiorCategoria,
        categoryTotals
    };
  }, [installments, accountsPayable]);

  // Chart Data Preparation
  const areaChartData = useMemo(() => {
      const data: Record<string, number> = {};
      installments.forEach(inst => {
          if (inst.status === 'pago' || inst.status === 'cancelado') return;
          const month = format(parseISO(inst.dueDate), 'MMM/yy', { locale: ptBR });
          data[month] = (data[month] || 0) + Number(inst.value || 0);
      });
      return Object.entries(data).slice(0, 6).map(([name, value]) => ({ name, value }));
  }, [installments]);

  const lineChartData = useMemo(() => {
      const data: Record<string, number> = {};
      const today = new Date();
      for(let i=0; i<14; i++) {
          data[format(addDays(today, i), 'dd/MM')] = 0;
      }
      installments.forEach(inst => {
          if (inst.status === 'pago' || inst.status === 'cancelado') return;
          const day = format(parseISO(inst.dueDate), 'dd/MM');
          if (data[day] !== undefined) {
              data[day] += Number(inst.value || 0);
          }
      });
      return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [installments]);

  const barChartData = useMemo(() => {
      const data: Record<string, number> = {};
      installments.forEach(inst => {
          if (inst.status === 'pago' || inst.status === 'cancelado') return;
          const month = format(parseISO(inst.dueDate), 'MMM/yy', { locale: ptBR });
          data[month] = (data[month] || 0) + 1;
      });
      return Object.entries(data).slice(0, 6).map(([name, count]) => ({ name, count }));
  }, [installments]);

  const donutChartData = useMemo(() => {
      return Object.entries(stats.categoryTotals)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
  }, [stats.categoryTotals]);

  const radialChartData = useMemo(() => {
      const totalMes = stats.totalMes;
      const comprometimento = Math.min(Math.round((totalMes / (totalMes + 10000)) * 100), 100);
      return [{ name: 'Comprometido', value: comprometimento, fill: '#6D4AFF' }];
  }, [stats.totalMes]);

  const COLORS = ['#6D4AFF', '#9B8CFF', '#D8B4E2', '#A5ADBD', '#6B7280'];

  // Filtering
  const filteredInstallments = useMemo(() => {
    return installments.filter(inst => {
       if (filterEmpresa && inst.type !== filterEmpresa) return false;
       if (filterFornecedor && inst.supplier !== filterFornecedor) return false;
       if (filterCategoria && inst.category !== filterCategoria) return false;
       if (filterFormaPagamento && inst.paymentMethod !== filterFormaPagamento) return false;
       if (filterStatus && inst.status !== filterStatus) return false;
       if (selectedDate && !isSameDay(parseISO(inst.dueDate), selectedDate)) return false;
       return true;
    }).sort((a, b) => {
        if (filterOrdenacao === 'mais_recentes') return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        if (filterOrdenacao === 'mais_antigas') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (filterOrdenacao === 'maior_valor') return Number(b.value) - Number(a.value);
        if (filterOrdenacao === 'menor_valor') return Number(a.value) - Number(b.value);
        return 0;
    });
  }, [installments, filterEmpresa, filterFornecedor, filterCategoria, filterFormaPagamento, filterStatus, filterOrdenacao, selectedDate]);

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfDay(monthStart);
  const endDate = endOfDay(monthEnd);
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const startDay = getDay(startDate);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'pago': return <span className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 w-max"><CheckCircle2 size={12}/> PAGO</span>;
          case 'pago_parcial': return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 w-max"><DollarSign size={12}/> PARCIAL</span>;
          case 'vence_hoje': return <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 w-max"><Clock size={12}/> VENCE HOJE</span>;
          case 'atrasado': return <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 w-max"><AlertTriangle size={12}/> ATRASADO</span>;
          case 'cancelado': return <span className="bg-gray-500/10 text-gray-500 border border-gray-500/20 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 w-max"><X size={12}/> CANCELADO</span>;
          default: return <span className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 w-max"><Clock size={12}/> PENDENTE</span>;
      }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-none mx-auto mb-20 md:mb-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-[34px] font-[800] text-[#111827] dark:text-white tracking-tight">Contas a Pagar</h1>
             <Button variant="ghost" size="icon" onClick={togglePrivacy} className="rounded-full text-muted-foreground hover:bg-[#6D4AFF]/10 hover:text-[#6D4AFF]">
                {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
             </Button>
          </div>
          <p className="text-[15px] font-[500] text-[#6B7280] dark:text-[#A8B0C0] mt-1">
            Controle todas as obrigações financeiras futuras da empresa.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button onClick={() => setIsNewAccountModalOpen(true)} className="bg-[#6D4AFF] dark:bg-[#7B61FF] hover:bg-[#6D4AFF]/90 text-white shadow-lg shadow-[#6D4AFF]/20 active:scale-95 transition-all rounded-[18px] px-6 h-12 border-none font-bold flex-1 md:flex-none">
            <Plus size={18} className="mr-2" strokeWidth={3} />
            Nova Conta a Pagar
          </Button>
        </div>
      </div>

            {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {[
          { label: 'Total a Pagar', value: stats.totalAPagar, icon: DollarSign },
          { label: 'Atrasado', value: stats.atrasado, icon: AlertTriangle },
          { label: 'Vence Hoje', value: stats.venceHoje, icon: Clock },
          { label: 'Próximos 7 Dias', value: stats.vence7Dias, icon: CalendarIcon },
          { label: 'Cartões', value: stats.cartaoCredito, icon: CreditCard },
          { label: 'Boletos', value: stats.boletos, icon: FileText },
          { label: 'Investimentos', value: stats.investimentosLP, icon: TrendingUp },
        ].map((kpi, i) => (
           <div key={i} className="bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] rounded-[24px] p-5 flex flex-col justify-between shadow-[0_8px_30px_rgba(109,74,255,0.2)] hover:scale-[1.02] transition-transform duration-300">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-[12px] font-[700] text-white/90 leading-tight uppercase tracking-wider">{kpi.label}</span>
                 <div className="w-10 h-10 rounded-[14px] bg-white/20 text-white flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <kpi.icon size={18} strokeWidth={2.5} />
                 </div>
              </div>
              <span className="text-[20px] font-[900] text-white tracking-tight">
                 {formatCurrency(kpi.value, privacyMode)}
              </span>
           </div>
        ))}
      </div>

      {/* MAIN GRID: INSIGHTS + CHARTS + RESUMO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Insights & Calendar & Resumo */}
        <div className="lg:col-span-12 flex flex-col gap-6">
           
                      {/* FILTERS */}
           <div className="flex flex-wrap gap-3 items-center">
              <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                 <SelectTrigger className="h-[48px] rounded-[18px] bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 font-[600] w-[140px] shadow-sm text-[#111827] dark:text-white">
                    <SelectValue placeholder="Empresa" />
                 </SelectTrigger>
                 <SelectContent className="rounded-[18px]">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="pessoal">Pessoal</SelectItem>
                 </SelectContent>
              </Select>

              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                 <SelectTrigger className="h-[48px] rounded-[18px] bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 font-[600] w-[140px] shadow-sm text-[#111827] dark:text-white">
                    <SelectValue placeholder="Categoria" />
                 </SelectTrigger>
                 <SelectContent className="rounded-[18px]">
                    <SelectItem value="all">Todas</SelectItem>
                    {config?.categoriasFinanceiro?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                 </SelectContent>
              </Select>
              
              <Select value={filterFormaPagamento} onValueChange={setFilterFormaPagamento}>
                 <SelectTrigger className="h-[48px] rounded-[18px] bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 font-[600] w-[150px] shadow-sm text-[#111827] dark:text-white">
                    <SelectValue placeholder="Pagamento" />
                 </SelectTrigger>
                 <SelectContent className="rounded-[18px]">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                 </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                 <SelectTrigger className="h-[48px] rounded-[18px] bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 font-[600] w-[140px] shadow-sm text-[#111827] dark:text-white">
                    <SelectValue placeholder="Status" />
                 </SelectTrigger>
                 <SelectContent className="rounded-[18px]">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="vence_hoje">Vence Hoje</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                 </SelectContent>
              </Select>

              <Select value={filterOrdenacao} onValueChange={setFilterOrdenacao}>
                 <SelectTrigger className="h-[48px] rounded-[18px] bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 font-[600] w-[160px] shadow-sm text-[#111827] dark:text-white">
                    <SelectValue placeholder="Ordenação" />
                 </SelectTrigger>
                 <SelectContent className="rounded-[18px]">
                    <SelectItem value="mais_recentes">Mais Recentes</SelectItem>
                    <SelectItem value="mais_antigas">Mais Antigas</SelectItem>
                    <SelectItem value="maior_valor">Maior Valor</SelectItem>
                    <SelectItem value="menor_valor">Menor Valor</SelectItem>
                 </SelectContent>
              </Select>

              {(filterEmpresa || filterCategoria || filterFormaPagamento || filterStatus || filterOrdenacao !== 'mais_recentes') && (
                 <Button variant="ghost" onClick={()=>{setFilterEmpresa(''); setFilterCategoria(''); setFilterFormaPagamento(''); setFilterStatus(''); setFilterOrdenacao('mais_recentes'); setSelectedDate(null);}} className="h-[48px] rounded-[18px] font-bold text-[#6B7280]">
                    Limpar Filtros
                 </Button>
              )}
           </div>

           {/* TABLE */}
           <div className="bg-white dark:bg-[#181B24] rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#ECEFF5] dark:border-white/5 overflow-hidden">
              <div className="overflow-x-auto hide-scrollbar p-2">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-[#ECEFF5] dark:border-white/5">
                          <th className="px-5 py-4 text-[12px] font-[700] text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider whitespace-nowrap">Vencimento</th>
                          <th className="px-5 py-4 text-[12px] font-[700] text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider">Descrição</th>
                          <th className="px-5 py-4 text-[12px] font-[700] text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider hidden md:table-cell">Fornecedor</th>
                          <th className="px-5 py-4 text-[12px] font-[700] text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider hidden xl:table-cell">Pagamento</th>
                          <th className="px-5 py-4 text-[12px] font-[700] text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider text-right">Valor</th>
                          <th className="px-5 py-4 text-[12px] font-[700] text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider text-center">Status</th>
                          <th className="px-5 py-4 text-[12px] font-[700] text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider text-right">Ações</th>
                       </tr>
                    </thead>
                    <tbody>
                       {loading ? (
                          <tr><td colSpan={7} className="text-center py-10 text-[#6B7280] font-semibold">Carregando...</td></tr>
                       ) : filteredInstallments.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-20 text-[#6B7280] font-semibold flex flex-col items-center justify-center gap-3"><Wallet size={48} className="opacity-20"/> Nenhuma conta encontrada.</td></tr>
                       ) : (
                          filteredInstallments.map((item) => (
                             <motion.tr 
                                key={item.id}
                                whileHover={{ backgroundColor: 'rgba(109,74,255,0.02)' }}
                                className="group border-b border-[#ECEFF5] dark:border-white/5 last:border-0 transition-colors"
                             >
                                <td className="px-5 py-4 whitespace-nowrap">
                                   <div className="text-[14px] font-[700] text-[#111827] dark:text-white flex items-center gap-2">
                                      <CalendarIcon size={14} className="text-[#6B7280]"/>
                                      {format(parseISO(item.dueDate), 'dd/MM/yyyy')}
                                   </div>
                                </td>
                                <td className="px-5 py-4">
                                   <div className="text-[15px] font-[700] text-[#111827] dark:text-white line-clamp-1">{item.description}</div>
                                   <div className="text-[12px] font-[600] text-[#6B7280] dark:text-[#A8B0C0] mt-0.5 uppercase tracking-wider flex items-center gap-2">
                                      <span className="bg-[#F6F7FB] dark:bg-white/5 px-1.5 py-0.5 rounded text-[10px]">{item.category || 'Outros'}</span>
                                      {item.totalInstallments > 1 && <span className="text-[#6D4AFF]">Parc {item.installmentNumber}/{item.totalInstallments}</span>}
                                   </div>
                                </td>
                                <td className="px-5 py-4 hidden md:table-cell text-[14px] font-[600] text-[#6B7280] dark:text-[#A8B0C0]">{item.supplier || '-'}</td>
                                <td className="px-5 py-4 hidden xl:table-cell text-[14px] font-[600] text-[#6B7280] dark:text-[#A8B0C0]">{item.paymentMethod}</td>
                                <td className="px-5 py-4 text-right">
                                   <div className="text-[16px] font-[800] text-[#111827] dark:text-white whitespace-nowrap">{formatCurrency(item.value, privacyMode)}</div>
                                </td>
                                <td className="px-5 py-4 flex items-center justify-center">
                                   {getStatusBadge(item.status)}
                                </td>
                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                   <DropdownMenu>
                                      <DropdownMenuTrigger render={
                                         <Button variant="ghost" size="icon" className="h-10 w-10 rounded-[14px] hover:bg-black/5 dark:hover:bg-white/10 text-[#6B7280]"><MoreVertical size={18}/></Button>
                                      } />
                                      <DropdownMenuContent align="end" className="w-[200px] rounded-[18px] font-[600] p-2 border-[#ECEFF5] dark:border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.08)] bg-white/90 dark:bg-[#181B24]/90 backdrop-blur-xl">
                                         {item.status !== 'pago' && (
                                            <>
                                               <DropdownMenuItem onClick={() => handleMarkAsPaid(item)} className="rounded-[12px] py-2.5 focus:bg-[#22C55E]/10 focus:text-[#22C55E] cursor-pointer"><CheckCircle2 size={16} className="mr-3" /> Registrar Pagamento</DropdownMenuItem>
                                               <DropdownMenuItem onClick={() => { setSelectedInstallment(item); setIsPayModalOpen(true); }} className="rounded-[12px] py-2.5 cursor-pointer"><DollarSign size={16} className="mr-3 text-blue-500" /> Pagamento Parcial</DropdownMenuItem>
                                               <DropdownMenuSeparator className="bg-[#ECEFF5] dark:bg-white/10 my-1"/>
                                            </>
                                         )}
                                         <DropdownMenuItem className="rounded-[12px] py-2.5 cursor-pointer"><Eye size={16} className="mr-3 text-[#6B7280]" /> Visualizar</DropdownMenuItem>
                                         <DropdownMenuItem className="rounded-[12px] py-2.5 cursor-pointer"><Edit2 size={16} className="mr-3 text-[#6B7280]" /> Editar</DropdownMenuItem>
                                         <DropdownMenuItem className="rounded-[12px] py-2.5 cursor-pointer"><Copy size={16} className="mr-3 text-[#6B7280]" /> Duplicar</DropdownMenuItem>
                                         <DropdownMenuSeparator className="bg-[#ECEFF5] dark:bg-white/10 my-1"/>
                                         <DropdownMenuItem onClick={() => handleDeleteInstallment(item)} className="text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-[12px] py-2.5 cursor-pointer"><Trash2 size={16} className="mr-3" /> Excluir</DropdownMenuItem>
                                      </DropdownMenuContent>
                                   </DropdownMenu>
                                </td>
                             </motion.tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

        </div>
      </div>

      {/* MODALS */}
      <Dialog open={isNewAccountModalOpen} onOpenChange={setIsNewAccountModalOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[32px] p-0 border-[#ECEFF5] dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh] bg-white dark:bg-[#181B24] shadow-2xl">
          <div className="px-8 py-6 bg-[#F6F7FB] dark:bg-[#12141C] border-b border-[#ECEFF5] dark:border-white/5 flex justify-between items-center sticky top-0 z-10">
            <div>
              <DialogTitle className="text-[24px] font-[800] text-[#111827] dark:text-white tracking-tight">Nova Conta a Pagar</DialogTitle>
              <p className="text-[14px] font-[600] text-[#6B7280] dark:text-[#A8B0C0] mt-1">Preencha os detalhes da obrigação financeira.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsNewAccountModalOpen(false)} className="h-10 w-10 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 text-[#111827] dark:text-white"><X size={18}/></Button>
          </div>
          
          <form className="p-8 space-y-8 overflow-y-auto hide-scrollbar text-left" onSubmit={handleSaveNovaConta}>
            
            {/* Bloco 1 */}
            <div className="space-y-5">
              <h3 className="text-[13px] font-[800] text-[#6D4AFF] uppercase tracking-wider flex items-center gap-2 mb-4"><FileText size={16}/> Informações Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[12px] font-[700] uppercase text-[#6B7280] tracking-wider ml-1">Descrição</Label>
                  <Input required value={formData.description} onChange={e => setFormData({...formData, description:e.target.value})} className="h-14 text-[16px] font-[700] rounded-[18px] border-[#ECEFF5] dark:border-white/10 bg-[#F6F7FB] dark:bg-[#12141C] focus:bg-white focus:ring-2 focus:ring-[#6D4AFF]/20" placeholder="Ex: Compra de Tecidos" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-[700] uppercase text-[#6B7280] tracking-wider ml-1">Fornecedor</Label>
                  <Input value={formData.supplier} onChange={e => setFormData({...formData, supplier:e.target.value})} className="h-14 text-[15px] font-[600] rounded-[18px] border-[#ECEFF5] dark:border-white/10 bg-[#F6F7FB] dark:bg-[#12141C]" placeholder="Nome do fornecedor" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-[700] uppercase text-[#6B7280] tracking-wider ml-1">Categoria</Label>
                  <Select value={formData.category} onValueChange={v => setFormData({...formData, category:v})} required>
                    <SelectTrigger className="h-14 rounded-[18px] font-[600] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/10"><SelectValue placeholder="Selecione"/></SelectTrigger>
                    <SelectContent className="rounded-[18px]">
                      {config?.categoriasFinanceiro?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bloco 2 */}
            <div className="space-y-5 pt-6 border-t border-[#ECEFF5] dark:border-white/5">
              <h3 className="text-[13px] font-[800] text-[#6D4AFF] uppercase tracking-wider flex items-center gap-2 mb-4"><DollarSign size={16}/> Valores e Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[12px] font-[700] uppercase text-[#6B7280] tracking-wider ml-1">Valor Total</Label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#111827] dark:text-white font-[800] text-[18px]">R$</span>
                     <Input required type="number" step="0.01" value={formData.totalValue} onChange={e => setFormData({...formData, totalValue:e.target.value})} className="h-16 pl-12 text-[24px] font-[800] rounded-[20px] border-[#ECEFF5] dark:border-white/10 bg-[#F6F7FB] dark:bg-[#12141C] text-[#6D4AFF]" placeholder="0,00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-[700] uppercase text-[#6B7280] tracking-wider ml-1">Forma de Pagamento</Label>
                  <Select value={formData.paymentMethod} onValueChange={v => setFormData({...formData, paymentMethod:v})}>
                    <SelectTrigger className="h-16 rounded-[20px] font-[700] text-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-[18px]">
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 items-center bg-[#F6F7FB] dark:bg-[#12141C] p-4 rounded-[20px] border border-[#ECEFF5] dark:border-white/5 mt-4">
                 <div className="flex-1">
                   <Label className="text-[15px] font-[800] text-[#111827] dark:text-white">É parcelado?</Label>
                   <p className="text-[13px] text-[#6B7280] font-[500]">Dividir em múltiplas faturas/boletos.</p>
                 </div>
                 <Button type="button" variant={formData.isInstallment ? "default" : "outline"} onClick={() => setFormData({...formData, isInstallment: true})} className={`rounded-[14px] px-6 h-12 font-[800] ${formData.isInstallment ? 'bg-[#6D4AFF] text-white' : 'border-[#ECEFF5] dark:border-white/10 bg-white dark:bg-[#181B24]'}`}>Sim</Button>
                 <Button type="button" variant={!formData.isInstallment ? "default" : "outline"} onClick={() => setFormData({...formData, isInstallment: false})} className={`rounded-[14px] px-6 h-12 font-[800] ${!formData.isInstallment ? 'bg-[#6D4AFF] text-white' : 'border-[#ECEFF5] dark:border-white/10 bg-white dark:bg-[#181B24]'}`}>Não</Button>
              </div>

              {formData.isInstallment && (
                <div className="grid grid-cols-2 gap-5 bg-[#6D4AFF]/5 p-5 rounded-[20px] border border-[#6D4AFF]/10 mt-4">
                  <div className="space-y-2">
                    <Label className="text-[12px] font-[800] uppercase text-[#6D4AFF] tracking-wider ml-1">Qtd Parcelas</Label>
                    <Input type="number" min="2" max="360" required value={formData.installmentCount} onChange={e => setFormData({...formData, installmentCount:e.target.value})} className="h-14 rounded-[16px] border-[#6D4AFF]/20 bg-white dark:bg-[#181B24] font-[800] text-[18px]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[12px] font-[800] uppercase text-[#6D4AFF] tracking-wider ml-1">1º Vencimento</Label>
                    <Input type="date" required value={formData.firstDueDate} onChange={e => setFormData({...formData, firstDueDate:e.target.value})} className="h-14 rounded-[16px] border-[#6D4AFF]/20 bg-white dark:bg-[#181B24] font-[700]" />
                  </div>
                </div>
              )}
            </div>

            {/* Bloco 3 */}
            <div className="space-y-5 pt-6 border-t border-[#ECEFF5] dark:border-white/5">
              <h3 className="text-[13px] font-[800] text-[#6D4AFF] uppercase tracking-wider flex items-center gap-2 mb-4"><CalendarIcon size={16}/> Prazos e Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 {!formData.isInstallment && (
                    <div className="space-y-2">
                      <Label className="text-[12px] font-[700] uppercase text-[#6B7280] tracking-wider ml-1">Data de Vencimento</Label>
                      <Input type="date" required value={formData.firstDueDate} onChange={e => setFormData({...formData, firstDueDate:e.target.value})} className="h-14 rounded-[18px] border-[#ECEFF5] dark:border-white/10 bg-[#F6F7FB] dark:bg-[#12141C] font-[700]" />
                    </div>
                 )}
                 <div className="space-y-2">
                    <Label className="text-[12px] font-[700] uppercase text-[#6B7280] tracking-wider ml-1">Competência</Label>
                    <Input type="month" required value={formData.competencia} onChange={e => setFormData({...formData, competencia:e.target.value})} className="h-14 rounded-[18px] border-[#ECEFF5] dark:border-white/10 bg-[#F6F7FB] dark:bg-[#12141C] font-[700]" />
                 </div>
              </div>
            </div>

            {/* Bloco 4 */}
            <div className="space-y-5 pt-6 border-t border-[#ECEFF5] dark:border-white/5">
              <h3 className="text-[13px] font-[800] text-[#6D4AFF] uppercase tracking-wider flex items-center gap-2 mb-4"><Paperclip size={16}/> Anexos</h3>
              <div className="border-2 border-dashed border-[#ECEFF5] dark:border-white/10 rounded-[24px] p-10 flex flex-col items-center justify-center text-center bg-[#F6F7FB]/50 dark:bg-[#12141C]/50 hover:bg-[#F6F7FB] transition-colors cursor-pointer group">
                 <div className="w-14 h-14 bg-white dark:bg-[#181B24] rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileUp size={24} className="text-[#6D4AFF]"/>
                 </div>
                 <p className="text-[15px] font-[700] text-[#111827] dark:text-white">Arraste a Nota Fiscal ou Comprovante</p>
                 <p className="text-[13px] font-[500] text-[#6B7280] mt-1">PDF, JPG ou PNG até 5MB</p>
                 <Button variant="outline" type="button" className="mt-4 rounded-[16px] h-10 font-[700] border-[#ECEFF5] dark:border-white/10">Procurar Arquivo</Button>
              </div>
            </div>
            
            <div className="pt-8 flex gap-3 w-full sticky bottom-0 bg-white dark:bg-[#181B24] pb-2">
               <Button type="button" variant="outline" className="h-14 font-[800] px-8 rounded-[20px] border-[#ECEFF5] dark:border-white/10 text-[#6B7280]" onClick={() => setIsNewAccountModalOpen(false)}>Cancelar</Button>
               <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-[20px] h-14 font-[800] text-[16px] bg-[#6D4AFF] hover:bg-[#6D4AFF]/90 shadow-xl shadow-[#6D4AFF]/30 text-white">
                 {isSubmitting ? 'Processando...' : 'Confirmar e Salvar'}
               </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* MODAL: PAGAMENTO PARCIAL */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8 border-[#ECEFF5] dark:border-white/10 text-center bg-white dark:bg-[#181B24] shadow-2xl">
           <div className="w-16 h-16 bg-[#6D4AFF]/10 text-[#6D4AFF] rounded-[20px] flex items-center justify-center mx-auto mb-6">
              <DollarSign size={32} strokeWidth={2.5}/>
           </div>
           <DialogTitle className="text-[24px] font-[800] text-[#111827] dark:text-white mb-2 tracking-tight">Pagamento Parcial</DialogTitle>
           <p className="text-[15px] font-[500] text-[#6B7280] mb-8">Informe o valor pago desta parcela.</p>
           
           {selectedInstallment && (
             <div className="space-y-6 text-left">
               <div className="bg-[#F6F7FB] dark:bg-[#12141C] p-5 rounded-[24px] border border-[#ECEFF5] dark:border-white/5 flex items-center justify-between">
                 <div className="text-[13px] font-[700] text-[#6B7280] uppercase tracking-wider">Valor Restante</div>
                 <div className="text-[20px] font-[800] text-[#111827] dark:text-white">{formatCurrency(selectedInstallment.remainingValue, privacyMode)}</div>
               </div>
               <div className="space-y-2">
                 <Label className="text-[12px] font-[700] uppercase text-[#6B7280] tracking-wider ml-1">Valor Pago Agora</Label>
                 <Input type="number" step="0.01" id="partialValue" max={selectedInstallment.remainingValue} className="h-16 text-[24px] text-center font-[800] rounded-[20px] border-[#ECEFF5] dark:border-white/10 bg-[#F6F7FB] dark:bg-[#12141C] focus:bg-white text-[#6D4AFF]" placeholder="0,00" />
               </div>
               <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="h-14 font-[800] flex-1 rounded-[20px] border-[#ECEFF5] dark:border-white/10" onClick={()=>setIsPayModalOpen(false)}>Cancelar</Button>
                  <Button className="flex-1 h-14 rounded-[20px] font-[800] shadow-xl bg-[#22C55E] hover:bg-[#22C55E]/90 shadow-[#22C55E]/30 text-white" onClick={async () => {
                    const el = document.getElementById('partialValue') as HTMLInputElement;
                    const val = parseFloat(el.value);
                    if (!val || val <= 0) return toast.error('Valor inválido');
                    if (val >= selectedInstallment.remainingValue) {
                       await handleMarkAsPaid(selectedInstallment);
                    } else {
                       await updateDoc(doc(db, `prod_accounts_payable/${selectedInstallment.accountId}/installments/${selectedInstallment.id}`), {
                         status: 'pago_parcial',
                         paidValue: (selectedInstallment.paidValue || 0) + val,
                         remainingValue: selectedInstallment.remainingValue - val,
                         updatedAt: serverTimestamp()
                       });
                       toast.success('Pagamento parcial registrado!');
                    }
                    setIsPayModalOpen(false);
                  }}>Confirmar</Button>
               </div>
             </div>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
