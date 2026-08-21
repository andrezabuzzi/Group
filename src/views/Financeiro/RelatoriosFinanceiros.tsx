import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { collection, query, where, onSnapshot, collectionGroup } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { formatCurrency } from '../../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isSameMonth, differenceInDays, isToday, addDays, startOfWeek, endOfWeek, subMonths, startOfYear, endOfYear, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart3, Calendar, CheckCircle2, ChevronDown, Clock, CreditCard, DollarSign, Download, 
  Eye, EyeOff, FileText, Filter, MoreVertical, Search, TrendingDown, TrendingUp, AlertTriangle, 
  Lightbulb, Wallet, Building2, ShoppingBag, PieChart as PieChartIcon
} from 'lucide-react';
import { toast } from 'sonner';

const MOCK_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COLORS = ['#6D4AFF', '#9B8CFF', '#D8B4E2', '#A5ADBD', '#6B7280'];

export default function RelatoriosFinanceiros() {
  const { isPessoal, privacyMode, togglePrivacy } = useAppContext();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('este_mes');
  const [customStartDate, setCustomStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);

  // Calculate Date Range based on Period Filter
  const dateRange = useMemo(() => {
    const today = new Date();
    switch (periodFilter) {
      case 'hoje':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'esta_semana':
        return { start: startOfWeek(today, { locale: ptBR }), end: endOfWeek(today, { locale: ptBR }) };
      case 'este_mes':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'ultimos_3_meses':
        return { start: startOfMonth(subMonths(today, 2)), end: endOfMonth(today) };
      case 'ultimos_6_meses':
        return { start: startOfMonth(subMonths(today, 5)), end: endOfMonth(today) };
      case 'este_ano':
        return { start: startOfYear(today), end: endOfYear(today) };
      case 'personalizado':
        return { start: startOfDay(parseISO(customStartDate)), end: endOfDay(parseISO(customEndDate)) };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  }, [periodFilter, customStartDate, customEndDate]);

  useEffect(() => {
    if (!user) return;

    const mode = isPessoal ? 'pessoal' : 'empresa';

    // Fetch Fixed Expenses
    const qFixed = query(collection(db, 'prod_fixed_expenses'), where('userId', '==', user.uid), where('type', '==', mode));
    const unsubFixed = onSnapshot(qFixed, snapshot => {
      setFixedExpenses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Variable Expenses
    const qVar = query(collection(db, 'prod_variable_expenses'), where('userId', '==', user.uid), where('type', '==', mode));
    const unsubVar = onSnapshot(qVar, snapshot => {
      setVariableExpenses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Accounts Payable Installments
    const qInst = query(collectionGroup(db, 'installments'), where('userId', '==', user.uid), where('type', '==', mode));
    const unsubInst = onSnapshot(qInst, snapshot => {
      setInstallments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubFixed();
      unsubVar();
      unsubInst();
    };
  }, [isPessoal, user]);

  // Derived Data (in date range)
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    try {
       const date = parseISO(dateStr);
       return date >= dateRange.start && date <= dateRange.end;
    } catch(e) {
      return false;
    }
  };

  const currentFixed = fixedExpenses.filter(e => isDateInRange(e.nextDueDate || e.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()));
  const currentVar = variableExpenses.filter(e => isDateInRange(e.date || e.createdAt?.toDate?.()?.toISOString()));
  const currentInst = installments.filter(e => isDateInRange(e.dueDate));

  let totalFixas = 0;
  let totalFixasPagas = 0;
  let atrasadoFixas = 0;
  const fixasCatMap: any = {};
  
  currentFixed.forEach(e => {
    const val = Number(e.value || 0);
    totalFixas += val;
    if (e.status === 'pago') totalFixasPagas += val;
    else if (e.status === 'atrasado') atrasadoFixas += val;
    
    if (e.category) fixasCatMap[e.category] = (fixasCatMap[e.category] || 0) + val;
  });

  let totalVariaveis = 0;
  let pendentesCatCount = 0;
  let totalVariaveisAtrasado = 0; // Se aplicavel
  const variaveisCatMap: any = {};
  currentVar.forEach(e => {
    const val = Number(e.value || 0);
    totalVariaveis += val;
    if (e.status === 'pendente') pendentesCatCount++;
    if (e.category) variaveisCatMap[e.category] = (variaveisCatMap[e.category] || 0) + val;
  });

  let totalAPagar = 0;
  let totalAPagarPago = 0;
  let totalAtrasado = 0;
  let cartaoTotal = 0;
  let boletoTotal = 0;
  const aPagarCatMap: any = {};
  
  currentInst.forEach(e => {
    const val = Number(e.value || 0);
    totalAPagar += val;
    if (e.status.includes('pago')) totalAPagarPago += Number(e.paidValue || val);
    if (e.status === 'atrasado') totalAtrasado += val;
    
    if (e.paymentMethod === 'Cartão de Crédito') cartaoTotal += val;
    if (e.paymentMethod === 'Boleto') boletoTotal += val;

    if (e.category) aPagarCatMap[e.category] = (aPagarCatMap[e.category] || 0) + val;
  });

  const totalGeral = totalFixas + totalVariaveis + totalAPagar;
  const totalPagoGeral = totalFixasPagas + totalVariaveis + totalAPagarPago; 
  const totalPendenteGeral = (totalFixas - totalFixasPagas) + (totalAPagar - totalAPagarPago);
  const totalAtrasadoGeral = atrasadoFixas + totalAtrasado;

  let maiorCat = { name: 'Nenhuma', value: 0 };
  const allCatMap = { ...variaveisCatMap };
  Object.keys(aPagarCatMap).forEach(k => allCatMap[k] = (allCatMap[k] || 0) + aPagarCatMap[k]);
  Object.keys(fixasCatMap).forEach(k => allCatMap[k] = (allCatMap[k] || 0) + fixasCatMap[k]);
  Object.keys(allCatMap).forEach(k => {
    if (allCatMap[k] > maiorCat.value) maiorCat = { name: k, value: allCatMap[k] };
  });

  // Chart Data preparation
  const getPieData = (map: any) => Object.keys(map).map(k => ({ name: k, value: map[k] })).sort((a,b)=>b.value-a.value);
  
  const fixasPie = getPieData(fixasCatMap);
  const varPie = getPieData(variaveisCatMap);
  const apagarPie = getPieData(aPagarCatMap);

  // Status Chart Data
  const statusData = [
     { name: 'Pago', Fixas: totalFixasPagas, Variáveis: totalVariaveis, APagar: totalAPagarPago },
     { name: 'Pendente', Fixas: totalFixas - totalFixasPagas - atrasadoFixas, Variáveis: 0, APagar: totalAPagar - totalAPagarPago - totalAtrasado },
     { name: 'Atrasado', Fixas: atrasadoFixas, Variáveis: 0, APagar: totalAtrasado },
  ];

  // Monthly history calculated from real data
  const monthlyMap: Record<string, { Fixas: number, Variaveis: number, APagar: number }> = {};
  
  fixedExpenses.forEach(e => {
    const month = e.dueDate ? e.dueDate.substring(0, 7) : '';
    if (month) {
      if (!monthlyMap[month]) monthlyMap[month] = { Fixas: 0, Variaveis: 0, APagar: 0 };
      monthlyMap[month].Fixas += Number(e.value || 0);
    }
  });

  variableExpenses.forEach(e => {
    const month = e.date ? e.date.substring(0, 7) : '';
    if (month) {
      if (!monthlyMap[month]) monthlyMap[month] = { Fixas: 0, Variaveis: 0, APagar: 0 };
      monthlyMap[month].Variaveis += Number(e.value || 0);
    }
  });

  installments.forEach(e => {
    const month = e.dueDate ? e.dueDate.substring(0, 7) : '';
    if (month) {
      if (!monthlyMap[month]) monthlyMap[month] = { Fixas: 0, Variaveis: 0, APagar: 0 };
      monthlyMap[month].APagar += Number(e.value || 0);
    }
  });

  const monthlyData = Object.keys(monthlyMap).sort().map(k => {
    const date = new Date(k + '-01T00:00:00');
    return {
      name: date.toLocaleDateString('pt-BR', { month: 'short' }),
      Fixas: monthlyMap[k].Fixas,
      Variaveis: monthlyMap[k].Variaveis,
      APagar: monthlyMap[k].APagar
    };
  });


  // Export
  const handleExport = () => {
    toast.success('Gerando relatório...');
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 w-full max-w-7xl mx-auto mb-20 md:mb-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-4">
        <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Relatórios Financeiros</h1>
          <Button variant="ghost" size="icon" onClick={togglePrivacy} className="rounded-full text-muted-foreground hover:bg-[#6D4AFF]/10 hover:text-[#6D4AFF]">
             {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </Button>
        </div>
          <p className="text-sm font-semibold text-muted-foreground mt-1">
            Acompanhe a saúde financeira, despesas e previsões do {isPessoal ? 'seu perfil pessoal' : 'da sua empresa'}.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="h-11 rounded-xl border-border shadow-sm font-semibold w-full md:w-[180px]">
              <Calendar size={16} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="esta_semana">Esta Semana</SelectItem>
              <SelectItem value="este_mes">Este Mês</SelectItem>
              <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
              <SelectItem value="ultimos_6_meses">Últimos 6 Meses</SelectItem>
              <SelectItem value="este_ano">Este Ano</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          
          {periodFilter === 'personalizado' && (
            <div className="flex gap-2 w-full md:w-auto">
              <Input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="h-11 rounded-xl w-full md:w-auto" />
              <Input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="h-11 rounded-xl w-full md:w-auto" />
            </div>
          )}

          <Button onClick={handleExport} className="h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full md:w-auto xl:w-auto">
            <Download size={18} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground font-semibold flex items-center justify-center gap-2">
           <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"/> Mapeando dados financeiros...
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
                    {/* Main Top Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 flex-none overflow-x-auto hide-scrollbar pb-2">
            {[
              { title: "Despesas Fixas", value: totalFixas, icon: Building2 },
              { title: "Despesas Variáveis", value: totalVariaveis, icon: ShoppingBag },
              { title: "Contas a Pagar", value: totalAPagar, icon: Calendar },
              { title: "Custo Total (Período)", value: totalGeral, icon: TrendingDown },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] rounded-[24px] p-5 flex flex-col justify-between shadow-[0_8px_30px_rgba(109,74,255,0.2)] hover:scale-[1.02] transition-transform duration-300 min-w-[150px]">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[12px] font-[700] text-white/90 leading-tight uppercase tracking-wider">{kpi.title}</span>
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

          {/* Section 1: RESUMO POR TIPO */}
          <div className="grid lg:grid-cols-3 gap-4">
             <Card className="rounded-3xl border-border/50 shadow-sm">
               <CardHeader className="pb-2 px-6 pt-6">
                 <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><Building2 size={18}/> Despesas Fixas</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4 px-6 pb-6 pt-0">
                  <div className="text-3xl font-black text-foreground">{formatCurrency(totalFixas, privacyMode)}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div className="bg-muted/40 p-2 rounded-xl border border-border/50"><span className="text-muted-foreground uppercase text-[9px] block">Pago</span> <span className="text-emerald-500">{formatCurrency(totalFixasPagas, privacyMode)}</span></div>
                    <div className="bg-muted/40 p-2 rounded-xl border border-border/50"><span className="text-muted-foreground uppercase text-[9px] block">Pendente</span> <span>{formatCurrency(totalFixas - totalFixasPagas - atrasadoFixas, privacyMode)}</span></div>
                    <div className="bg-muted/40 p-2 rounded-xl border border-border/50 col-span-2 flex justify-between">
                       <span className="text-muted-foreground uppercase text-[9px]">Registros</span> <span>{currentFixed.length} contos</span>
                    </div>
                  </div>
               </CardContent>
             </Card>
             
             <Card className="rounded-3xl border-border/50 shadow-sm">
               <CardHeader className="pb-2 px-6 pt-6">
                 <CardTitle className="text-sm font-bold flex items-center gap-2 text-teal-600 dark:text-teal-400"><CreditCard size={18}/> Despesas Variáveis</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4 px-6 pb-6 pt-0">
                  <div className="text-3xl font-black text-foreground">{formatCurrency(totalVariaveis, privacyMode)}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div className="bg-muted/40 p-2 rounded-xl border border-border/50 col-span-2 flex justify-between text-orange-500">
                       <span className="uppercase text-[9px]">Pendentes p/ Categorizar</span> <span>{pendentesCatCount} alertas</span>
                    </div>
                    <div className="bg-muted/40 p-2 rounded-xl border border-border/50 col-span-2 flex justify-between">
                       <span className="text-muted-foreground uppercase text-[9px]">Registros</span> <span>{currentVar.length} inserts</span>
                    </div>
                  </div>
               </CardContent>
             </Card>

             <Card className="rounded-3xl border-border/50 shadow-sm">
               <CardHeader className="pb-2 px-6 pt-6">
                 <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-600 dark:text-orange-400"><FileText size={18}/> Contas a Pagar</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4 px-6 pb-6 pt-0">
                  <div className="text-3xl font-black text-foreground">{formatCurrency(totalAPagar, privacyMode)}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div className="bg-muted/40 p-2 rounded-xl border border-border/50"><span className="text-muted-foreground uppercase text-[9px] block">Boleto</span> <span>{formatCurrency(boletoTotal, privacyMode)}</span></div>
                    <div className="bg-muted/40 p-2 rounded-xl border border-border/50"><span className="text-muted-foreground uppercase text-[9px] block">Cartão de Crédito</span> <span>{formatCurrency(cartaoTotal, privacyMode)}</span></div>
                    <div className="bg-muted/40 p-2 rounded-xl border border-border/50 col-span-2 flex justify-between text-red-500 bg-red-50 dark:bg-red-950/20">
                       <span className="uppercase text-[9px]">Atrasado</span> <span>{formatCurrency(totalAtrasado, privacyMode)}</span>
                    </div>
                  </div>
               </CardContent>
             </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
             {/* General Financial Chart */}
             <Card className="lg:col-span-2 rounded-3xl border-border/50 shadow-sm">
                <CardHeader className="px-6 py-5 border-b border-border/50">
                   <CardTitle className="text-base font-bold flex items-center gap-2">
                      <BarChart3 size={18} className="text-primary" /> 
                      Histórico Geral (Meses)
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[320px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} className="text-muted-foreground" />
                         <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} className="text-muted-foreground" tickFormatter={(v)=>`R$ ${v/1000}k`} />
                         <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v: number)=>formatCurrency(v, privacyMode)} />
                         <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 10 }} />
                         <Bar dataKey="Fixas" fill="#8b5cf6" radius={[4,4,0,0]} barSize={12} />
                         <Bar dataKey="Variaveis" fill="#9B8CFF" radius={[4,4,0,0]} barSize={12} />
                         <Bar dataKey="APagar" fill="#A5ADBD" radius={[4,4,0,0]} barSize={12} />
                      </BarChart>
                   </ResponsiveContainer>
                </CardContent>
             </Card>

             {/* Side Insights */}
             <Card className="rounded-3xl border-border/50 shadow-sm bg-muted/20">
                <CardHeader className="px-6 py-5 border-b border-border/50 bg-background rounded-t-3xl">
                   <CardTitle className="text-base font-bold flex items-center gap-2">
                       <Lightbulb size={18} className="text-amber-500" />
                       Indicadores Inteligentes
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                   <div className="p-4 bg-background rounded-2xl border border-border/50 text-sm font-semibold shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-primary font-black uppercase text-[10px] tracking-wider"><Wallet size={14}/> Impacto de Saídas</div>
                      O total de <b>Contas a Pagar</b> representa {totalGeral > 0 ? Math.round((totalAPagar/totalGeral)*100) : 0}% de suas estimativas no período selecionado.
                   </div>
                   <div className="p-4 bg-background rounded-2xl border border-border/50 text-sm font-semibold shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-indigo-500 font-black uppercase text-[10px] tracking-wider"><PieChartIcon size={14}/> Concentração de Categoria</div>
                      A categoria <b className="text-foreground">{maiorCat.name}</b> foi a de maior impacto financeiro geral, com {formatCurrency(maiorCat.value, privacyMode)}.
                   </div>
                   {totalAtrasadoGeral > 0 && (
                     <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/50 text-sm font-semibold text-red-800 dark:text-red-400">
                        <div className="flex items-center gap-2 mb-2 font-black uppercase text-[10px] tracking-wider text-red-600"><AlertTriangle size={14}/> Alerta de Inadimplência</div>
                        Você possui <b>{formatCurrency(totalAtrasadoGeral, privacyMode)}</b> em atraso neste período. (Fixas + Boletos)
                     </div>
                   )}
                   {pendentesCatCount > 0 && (
                     <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-200 dark:border-orange-900/50 text-sm font-semibold text-orange-800 dark:text-orange-400">
                        <div className="flex items-center gap-2 mb-2 font-black uppercase text-[10px] tracking-wider text-orange-600"><Filter size={14}/> Organização Necessária</div>
                        Existem <b>{pendentesCatCount}</b> lançamento(s) pendente(s) de categorização. Classifique para corrigir os relatórios de Categoria.
                     </div>
                   )}
                </CardContent>
             </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
             {/* Category Charts */}
             <Card className="rounded-3xl border-border/50 shadow-sm">
                <CardHeader className="text-center px-6 pt-6 pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Despesas Fixas / Categoria</CardTitle></CardHeader>
                <CardContent className="h-[220px] px-2">
                   {fixasPie.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={fixasPie} cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="none" dataKey="value" paddingAngle={2}>
                              {fixasPie.map((e,i)=> <Cell key={`cell-${i}`} fill={COLORS[i%COLORS.length]}/>)}
                           </Pie>
                           <RechartsTooltip formatter={(v:number)=>formatCurrency(v,privacyMode)} />
                         </PieChart>
                      </ResponsiveContainer>
                   ) : <div className="h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">Sem dados de categorias</div>}
                </CardContent>
             </Card>

             <Card className="rounded-3xl border-border/50 shadow-sm">
                <CardHeader className="text-center px-6 pt-6 pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Variáveis / Categoria</CardTitle></CardHeader>
                <CardContent className="h-[220px] px-2">
                   {varPie.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={varPie} cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="none" dataKey="value" paddingAngle={2}>
                              {varPie.map((e,i)=> <Cell key={`cell-${i}`} fill={COLORS[i%COLORS.length]}/>)}
                           </Pie>
                           <RechartsTooltip formatter={(v:number)=>formatCurrency(v,privacyMode)} />
                         </PieChart>
                      </ResponsiveContainer>
                   ) : <div className="h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">Sem dados de categorias</div>}
                </CardContent>
             </Card>

             <Card className="rounded-3xl border-border/50 shadow-sm">
                <CardHeader className="text-center px-6 pt-6 pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">A Pagar / Categoria</CardTitle></CardHeader>
                <CardContent className="h-[220px] px-2">
                   {apagarPie.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={apagarPie} cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="none" dataKey="value" paddingAngle={2}>
                              {apagarPie.map((e,i)=> <Cell key={`cell-${i}`} fill={COLORS[i%COLORS.length]}/>)}
                           </Pie>
                           <RechartsTooltip formatter={(v:number)=>formatCurrency(v,privacyMode)} />
                         </PieChart>
                      </ResponsiveContainer>
                   ) : <div className="h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">Sem dados de categorias</div>}
                </CardContent>
             </Card>
          </div>

          {/* Status Stacked Bar Chart */}
          <Card className="rounded-3xl border-border/50 shadow-sm">
              <CardHeader className="px-6 py-5 border-b border-border/50">
                 <CardTitle className="text-base font-bold flex items-center gap-2">
                    <AlertTriangle size={18} className="text-muted-foreground" /> 
                    Situação (Pago, Pendente, Atrasado)
                 </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] p-6">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border/40" />
                       <XAxis type="number" axisLine={false} tickLine={false} className="text-muted-foreground" tickFormatter={(v)=>`R$ ${v/1000}k`} />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} className="font-bold text-xs" />
                       <RechartsTooltip formatter={(v:number)=>formatCurrency(v, privacyMode)} cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                       <Legend iconType="circle" />
                       <Bar dataKey="Fixas" stackId="a" fill="#8b5cf6" barSize={20} radius={[0,0,0,0]} />
                       <Bar dataKey="Variáveis" stackId="a" fill="#9B8CFF" barSize={20} radius={[0,0,0,0]} />
                       <Bar dataKey="APagar" stackId="a" fill="#A5ADBD" barSize={20} radius={[0,4,4,0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </CardContent>
          </Card>
          
        </div>
      )}
    </div>
  );
}

