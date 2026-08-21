content = """import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogPortal, DialogOverlay } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { formatCurrency, cn } from '../../lib/utils';
import { Plus, Search, Trash2, Edit2, Eye, Download, MoreHorizontal, Package, ArrowUpRight, ArrowDownRight, Printer, RefreshCw, Filter, AlertCircle, Box, CheckCircle2, Lightbulb, PackageOpen, SlidersHorizontal, PieChart as PieChartIcon, ChevronRight, ChevronLeft, Calendar, FileText, Check, Truck, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths, parseISO, isSameMonth } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

export default function ControleDevolucoes() {
  const { user } = useAuth();
  const { isPessoal } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);

  // Filtros Globais / Modal
  const [activeTab, setActiveTab] = useState('lancamentos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Lista
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarketplace, setFilterMarketplace] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterReputation, setFilterReputation] = useState('Todos');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Form State
  const defaultForm = {
    orderNumber: '',
    marketplace: 'Mercado Livre',
    customerName: '',
    returnDate: format(new Date(), 'yyyy-MM-dd'),
    productId: '',
    sku: '',
    variation: '',
    quantity: '1',
    orderValue: '',
    freightCost: '',
    hasImpact: 'false',
    returnReason: 'Produto com defeito',
    productStatus: 'Defeito',
    reputationStatus: 'Verificar',
    inspectionNotes: '',
    overallStatus: 'Pendente'
  };
  const [formData, setFormData] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Fetch Products
    const qProd = query(collection(db, 'produtos'), where('userId', '==', user.uid));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      setProdutos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Returns
    const mode = isPessoal ? 'pessoal' : 'empresa';
    const q = query(
      collection(db, 'returns'),
      where('userId', '==', user.uid),
      where('type', '==', mode)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const dateA = a.returnDate || a.createdAt;
        const dateB = b.returnDate || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      setReturns(data);
      setLoading(false);
    });
    return () => { unsub(); unsubProd(); };
  }, [user, isPessoal]);

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingId(null);
    setCurrentStep(1);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setFormData({
      ...defaultForm,
      ...item,
      orderValue: item.orderValue?.toString() || '',
      freightCost: item.freightCost?.toString() || '',
      quantity: item.quantity?.toString() || '1',
      hasImpact: item.hasImpact ? 'true' : 'false'
    });
    setEditingId(item.id);
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      if (!confirm("Tem certeza que deseja excluir esta devolução?")) return;
      await deleteDoc(doc(db, 'returns', id));
      toast.success("Devolução excluída!");
    } catch(e) {
      toast.error("Erro ao excluir");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const mode = isPessoal ? 'pessoal' : 'empresa';
      
      const prod = produtos.find(p => p.id === formData.productId);
      const skuToSave = prod ? prod.sku : formData.sku;

      const dataToSave = {
        ...formData,
        sku: skuToSave,
        userId: user.uid,
        type: mode,
        quantity: parseInt(formData.quantity) || 1,
        orderValue: parseFloat(formData.orderValue.replace(',', '.')) || 0,
        freightCost: parseFloat(formData.freightCost.replace(',', '.')) || 0,
        hasImpact: formData.hasImpact === 'true',
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'returns', editingId), dataToSave);
        toast.success("Devolução atualizada!");
      } else {
        await addDoc(collection(db, 'returns'), { ...dataToSave, createdAt: serverTimestamp() });
        toast.success("Nova devolução registrada!");
      }
      setIsModalOpen(false);
      resetForm();
    } catch(e) {
      toast.error("Erro ao salvar devolução.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  }
  
  const handleUpdateStatus = async (id: string, field: string, value: string) => {
    try {
      await updateDoc(doc(db, 'returns', id), { [field]: value, updatedAt: serverTimestamp() });
      toast.success("Status atualizado com sucesso!");
    } catch (e) {
      toast.error("Erro ao atualizar status");
    }
  }

  const currentMonthDate = new Date();
  const lastMonthDate = subMonths(currentMonthDate, 1);
  
  const currentMonthReturns = returns.filter(r => r.returnDate && r.returnDate.startsWith(format(currentMonthDate, 'yyyy-MM')));
  const lastMonthReturns = returns.filter(r => r.returnDate && r.returnDate.startsWith(format(lastMonthDate, 'yyyy-MM')));

  const thisMonthTotal = currentMonthReturns.length;
  const lastMonthTotal = lastMonthReturns.length;
  
  const aguardandoConf = returns.filter(r => r.overallStatus === 'Pendente').length;
  const pendentesTratativa = returns.filter(r => r.reputationStatus === 'Verificar' || r.reputationStatus === 'Pendente').length;
  
  const recoveredProducts = returns.filter(r => r.productStatus === 'Retorno estoque').length;
  const recoveredValue = returns.filter(r => r.productStatus === 'Retorno estoque').reduce((acc, v) => acc + (v.orderValue || 0), 0);
  
  // Perdas (Frete + Impactos)
  const freightLoss = returns.filter(r => r.hasImpact).reduce((acc, v) => acc + (v.freightCost || 0), 0);
  const totalOrderValueReturned = returns.reduce((acc, v) => acc + (v.orderValue || 0), 0);

  const confRate = returns.length > 0 ? Math.round(((returns.length - aguardandoConf) / returns.length) * 100) : 0;

  // Chart Data Preparation
  const mkMap: any = {};
  const reasonMap: any = {};
  const statusMap: any = {};
  const prodStatusMap: any = {};
  const repMap: any = { 'Impactou': 0, 'Sem Impacto/Revertido': 0, 'Pendente': 0 };
  const monthsMap: any = {};

  returns.forEach(r => {
    mkMap[r.marketplace] = (mkMap[r.marketplace] || 0) + 1;
    reasonMap[r.returnReason] = (reasonMap[r.returnReason] || 0) + 1;
    statusMap[r.overallStatus] = (statusMap[r.overallStatus] || 0) + 1;
    prodStatusMap[r.productStatus] = (prodStatusMap[r.productStatus] || 0) + 1;
    
    if (r.reputationStatus === 'Impactou Reputação') repMap['Impactou']++;
    else if (r.reputationStatus === 'Não Impactou Reputação') repMap['Sem Impacto/Revertido']++;
    else repMap['Pendente']++;

    if (r.returnDate) {
      const m = r.returnDate.substring(0, 7); // yyyy-mm
      monthsMap[m] = (monthsMap[m] || 0) + 1;
    }
  });

  const getChartData = (map: any) => Object.keys(map).map(k => ({ name: k, value: map[k] })).sort((a,b)=>b.value-a.value);
  const pieStatus = getChartData(statusMap);
  const barRazao = getChartData(reasonMap);
  const barCanais = getChartData(mkMap);
  const pieProdStatus = getChartData(prodStatusMap);
  const pieReputation = getChartData(repMap).filter(x => x.value > 0);
  
  const barMonths = Object.keys(monthsMap).sort().map(k => ({
    name: k.substring(5, 7) + '/' + k.substring(2, 4), // mm/yy
    value: monthsMap[k]
  })).slice(-6);
  
  // Custom Purple Palette
  const PURPLE_COLORS = ['#6D4AFF', '#8B6FFF', '#4F31CC', '#A38FFF', '#351F99', '#C3B5FF', '#221466'];

  // Lançamentos filtrados
  const filteredReturns = returns.filter(r => {
    if (filterMarketplace !== 'Todos' && r.marketplace !== filterMarketplace) return false;
    if (filterStatus !== 'Todos' && r.overallStatus !== filterStatus) return false;
    if (filterReputation !== 'Todos' && r.reputationStatus !== filterReputation) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!r.sku?.toLowerCase().includes(q) && 
          !r.orderNumber?.toLowerCase().includes(q) && 
          !r.customerName?.toLowerCase().includes(q) &&
          !r.marketplace?.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  
  const mockSparklineData = Array.from({length: 10}).map((_, i) => ({ value: Math.floor(Math.random() * 20) + 5 }));

  const getBadgeStyle = (status: string) => {
    if (!status) return 'bg-muted/50 text-muted-foreground border-transparent';
    const s = status.toLowerCase();
    if (s.includes('pendente') || s.includes('verificar')) return 'bg-muted/60 text-muted-foreground border-transparent';
    if (s.includes('tratativa') || s.includes('análise')) return 'bg-foreground/10 text-foreground border-transparent';
    if (s.includes('finalizado') || s.includes('estoque') || s.includes('conferido') || s.includes('ok') || s.includes('não impactou')) return 'bg-primary text-primary-foreground border-transparent shadow-[0_0_12px_rgba(109,74,255,0.3)]';
    if (s.includes('impactou')) return 'bg-destructive text-destructive-foreground border-transparent shadow-[0_0_12px_rgba(239,68,68,0.3)]';
    return 'bg-muted/50 text-muted-foreground border-transparent';
  };

  const RenderExecutiveCards = () => (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
           { title: 'Aguardando Conf.', value: aguardandoConf, icon: Box, trend: '+2', trendUp: false, alert: aguardandoConf > 0 },
           { title: 'Reputação Pendente', value: pendentesTratativa, icon: AlertCircle, trend: '-1', trendUp: true, alert: pendentesTratativa > 0 },
           { title: 'Devoluções Mês', value: thisMonthTotal, icon: Package, trend: '+12%', trendUp: false },
           { title: 'Prejuízo Fretes', value: formatCurrency(freightLoss, false), icon: TrendingDown, trend: '-2%', trendUp: true },
           { title: 'Valor Recuperado', value: formatCurrency(recoveredValue, false), icon: RefreshCw, trend: '+5%', trendUp: true },
           { title: 'Taxa de Conf.', value: `${confRate}%`, icon: CheckCircle2, trend: '+2%', trendUp: true },
        ].map((card, i) => (
           <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all overflow-hidden relative group">
                 <CardContent className="p-5 flex flex-col gap-3 relative z-10">
                    <div className="flex justify-between items-start">
                       <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", card.alert ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                          <card.icon className="w-5 h-5" />
                       </div>
                       <div className={cn("flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full", card.trendUp ? "text-foreground bg-foreground/5" : "text-muted-foreground bg-muted/50")}>
                          {card.trendUp ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                          {card.trend}
                       </div>
                    </div>
                    <div>
                       <div className="text-[12px] font-bold text-muted-foreground tracking-wide mt-2">{card.title}</div>
                       <div className="text-[24px] font-black text-foreground mt-1 tracking-tight">{card.value}</div>
                    </div>
                 </CardContent>
                 <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity", card.alert ? "from-destructive/5 to-transparent" : "from-primary/5 to-transparent")} />
              </Card>
           </motion.div>
        ))}
     </div>
  );

  const StepIndicator = () => (
    <div className="flex items-center justify-between px-8 py-4 bg-muted/20 border-b border-border/40">
      {[
        { num: 1, title: 'Venda' },
        { num: 2, title: 'Produto' },
        { num: 3, title: 'Conferência' }
      ].map((step, idx) => (
        <React.Fragment key={step.num}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black transition-all",
              currentStep === step.num ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(109,74,255,0.4)]" :
              currentStep > step.num ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
            </div>
            <span className={cn(
              "text-[12px] font-bold hidden sm:block",
              currentStep === step.num ? "text-foreground" : "text-muted-foreground"
            )}>{step.title}</span>
          </div>
          {idx < 2 && <div className={cn("flex-1 h-0.5 mx-4", currentStep > step.num ? "bg-primary/30" : "bg-border/50")} />}
        </React.Fragment>
      ))}
    </div>
  );

  const CheckChip = ({ label, selected, onClick, activeColor = 'bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(109,74,255,0.3)] border-transparent' }: { label: string, selected: boolean, onClick: () => void, activeColor?: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-3 rounded-[16px] text-[13px] font-bold border transition-all duration-200 text-left flex items-center justify-between",
        selected 
          ? activeColor 
          : "bg-background/50 border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border"
      )}
    >
      {label}
      {selected && <CheckCircle2 className="w-4 h-4 opacity-70" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-24 md:pb-8 selection:bg-primary/20">
      
      {/* HEADER */}
      <div className="px-6 md:px-8 pt-8 pb-6 sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40">
         <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <h1 className="text-[28px] md:text-[32px] font-black tracking-tight text-foreground flex items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-primary" strokeWidth={2.5}/> Controle de Devoluções
               </h1>
               <p className="text-[15px] font-medium text-muted-foreground mt-1 tracking-wide">
                  Gerencie devoluções, reputação, conferência e prejuízos com fretes.
               </p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
               <Button onClick={openNewModal} className="h-12 px-6 rounded-[16px] font-bold text-[14px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_24px_rgba(109,74,255,0.4)] hover:shadow-[0_4px_32px_rgba(109,74,255,0.6)] transition-all w-full md:w-auto group overflow-hidden relative">
                  <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-[16px]" />
                  <Plus className="w-5 h-5 mr-2 relative z-10 group-hover:scale-110 transition-transform" strokeWidth={3} />
                  <span className="relative z-10">Nova Devolução</span>
               </Button>
            </div>
         </div>
         
         {/* TABS PREMIUM */}
         <div className="max-w-[1600px] mx-auto mt-8 flex gap-2 overflow-x-auto hide-scrollbar">
            {['lancamentos', 'dashboard'].map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                     "relative px-6 py-2.5 rounded-full text-[14px] font-bold transition-all duration-300 capitalize flex-shrink-0",
                     activeTab === tab ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
               >
                  {activeTab === tab && (
                     <motion.div 
                        layoutId="activeTabDev" 
                        className="absolute inset-0 bg-primary rounded-full shadow-[0_2px_12px_rgba(109,74,255,0.3)]" 
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                     />
                  )}
                  <span className="relative z-10">{tab === 'lancamentos' ? 'Lançamentos' : tab}</span>
               </button>
            ))}
         </div>
      </div>

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
         
         <AnimatePresence mode="wait">
            {activeTab === 'lancamentos' && (
               <motion.div 
                  key="lancamentos"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
               >
                  <RenderExecutiveCards />

                  {/* BARRA DE FILTROS INTELIGENTES */}
                  <div className="flex flex-col md:flex-row gap-3 bg-card/60 backdrop-blur-xl p-3 rounded-[18px] border border-border/40 shadow-[0_4px_24px_rgba(0,0,0,0.02)] items-center">
                     <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input 
                           className="h-11 pl-11 rounded-[12px] bg-background border-transparent hover:border-border focus:border-primary shadow-none font-medium text-[14px] transition-colors" 
                           placeholder="Pesquisar pedido, cliente, SKU..." 
                           value={searchTerm} 
                           onChange={e=>setSearchTerm(e.target.value)} 
                        />
                     </div>
                     <div className={cn("flex flex-col md:flex-row gap-3 w-full md:w-auto overflow-hidden transition-all duration-300", showFiltersMobile ? "h-auto opacity-100" : "h-0 md:h-auto opacity-0 md:opacity-100")}>
                        <Select value={filterMarketplace} onValueChange={setFilterMarketplace}>
                           <SelectTrigger className="h-11 rounded-[12px] w-full md:w-[160px] font-semibold bg-background border-transparent hover:border-border shadow-none text-[13px]"><SelectValue placeholder="Marketplace"/></SelectTrigger>
                           <SelectContent className="rounded-[16px] border-border/50 shadow-xl">
                              <SelectItem value="Todos" className="rounded-xl font-medium">Todos Canais</SelectItem>
                              <SelectItem value="Mercado Livre" className="rounded-xl font-medium">Mercado Livre</SelectItem>
                              <SelectItem value="Shopee" className="rounded-xl font-medium">Shopee</SelectItem>
                              <SelectItem value="TikTok Shop" className="rounded-xl font-medium">TikTok Shop</SelectItem>
                              <SelectItem value="Shein" className="rounded-xl font-medium">Shein</SelectItem>
                           </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                           <SelectTrigger className="h-11 rounded-[12px] w-full md:w-[150px] font-semibold bg-background border-transparent hover:border-border shadow-none text-[13px]"><SelectValue placeholder="Status"/></SelectTrigger>
                           <SelectContent className="rounded-[16px] border-border/50 shadow-xl">
                              <SelectItem value="Todos" className="rounded-xl font-medium">Todos Status</SelectItem>
                              <SelectItem value="Pendente" className="rounded-xl font-medium">Pendente</SelectItem>
                              <SelectItem value="Tratativa" className="rounded-xl font-medium">Tratativa</SelectItem>
                              <SelectItem value="Finalizado" className="rounded-xl font-medium">Finalizado</SelectItem>
                           </SelectContent>
                        </Select>
                        <Select value={filterReputation} onValueChange={setFilterReputation}>
                           <SelectTrigger className="h-11 rounded-[12px] w-full md:w-[160px] font-semibold bg-background border-transparent hover:border-border shadow-none text-[13px]"><SelectValue placeholder="Reputação"/></SelectTrigger>
                           <SelectContent className="rounded-[16px] border-border/50 shadow-xl">
                              <SelectItem value="Todos" className="rounded-xl font-medium">Toda Reputação</SelectItem>
                              <SelectItem value="Verificar" className="rounded-xl font-medium">Verificar</SelectItem>
                              <SelectItem value="Pendente" className="rounded-xl font-medium">Pendente</SelectItem>
                              <SelectItem value="Em Tratativa" className="rounded-xl font-medium">Em Tratativa</SelectItem>
                              <SelectItem value="Impactou Reputação" className="rounded-xl font-medium">Impactou</SelectItem>
                              <SelectItem value="Não Impactou Reputação" className="rounded-xl font-medium">Não Impactou</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <Button variant="ghost" className="h-11 rounded-[12px] px-4 font-bold text-[13px] text-muted-foreground hover:bg-muted md:hidden w-full" onClick={() => setShowFiltersMobile(!showFiltersMobile)}>
                        <Filter className="w-4 h-4 mr-2" /> {showFiltersMobile ? 'Menos Filtros' : 'Mais Filtros'}
                     </Button>
                  </div>

                  {/* MAIN CONTENT AREA */}
                  <div className="flex flex-col gap-6">
                     
                     {/* TABELA PRINCIPAL */}
                     <div className="flex-1 min-w-0">
                        <Card className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                           <div className="overflow-x-auto hide-scrollbar">
                              <table className="w-full text-left border-collapse">
                                 <thead className="bg-muted/20">
                                    <tr>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap">Produto</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap">Pedido / Cliente</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap">Motivo</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap">Status</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap text-right">Valores</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap text-right">Ações</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {loading ? (
                                       <tr><td colSpan={6} className="text-center py-16 font-medium text-muted-foreground">Carregando...</td></tr>
                                    ) : filteredReturns.length === 0 ? (
                                       <tr>
                                          <td colSpan={6} className="text-center py-20">
                                             <div className="flex flex-col items-center justify-center gap-4">
                                                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                                                   <PackageOpen className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
                                                </div>
                                                <div className="space-y-1">
                                                   <h3 className="text-lg font-black text-foreground">Nenhuma devolução encontrada.</h3>
                                                   <p className="text-sm font-medium text-muted-foreground">Você ainda não possui devoluções cadastradas neste período ou filtro.</p>
                                                </div>
                                                <Button onClick={openNewModal} className="mt-4 rounded-[16px] px-6 h-11 font-bold text-[14px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_16px_rgba(109,74,255,0.3)]">
                                                   Nova Devolução
                                                </Button>
                                             </div>
                                          </td>
                                       </tr>
                                    ) : (
                                       filteredReturns.map((r, i) => (
                                          <motion.tr 
                                             key={r.id}
                                             initial={{ opacity: 0, y: 10 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             transition={{ delay: i * 0.03 }}
                                             className="border-b border-border/40 hover:bg-muted/30 transition-colors group"
                                          >
                                             <td className="px-6 py-4">
                                                <div className="text-[14px] font-bold text-foreground">{r.sku}</div>
                                                <div className="text-[12px] font-medium text-muted-foreground mt-0.5">{r.marketplace}</div>
                                             </td>
                                             <td className="px-6 py-4">
                                                <div className="text-[13px] font-bold text-foreground">{r.orderNumber}</div>
                                                <div className="text-[12px] font-medium text-muted-foreground mt-0.5 truncate max-w-[150px]">{r.customerName || 'Sem nome'}</div>
                                             </td>
                                             <td className="px-6 py-4">
                                                <div className="text-[13px] font-medium text-foreground max-w-[180px] truncate">{r.returnReason}</div>
                                                <div className="text-[11px] font-bold text-muted-foreground mt-1 uppercase">{format(parseISO(r.returnDate || new Date().toISOString()), 'dd/MM/yyyy')}</div>
                                             </td>
                                             <td className="px-6 py-4 space-y-2">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                   <span className={cn("px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap", getBadgeStyle(r.overallStatus))}>
                                                      Conf: {r.overallStatus}
                                                   </span>
                                                   <span className={cn("px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap", getBadgeStyle(r.reputationStatus))}>
                                                      Rep: {r.reputationStatus}
                                                   </span>
                                                </div>
                                             </td>
                                             <td className="px-6 py-4 text-right">
                                                <div className="text-[14px] font-black text-muted-foreground line-through decoration-muted-foreground/50">{formatCurrency(r.orderValue || 0, false)}</div>
                                                {r.hasImpact && r.freightCost > 0 && (
                                                   <div className="text-[12px] font-bold text-destructive mt-0.5" title="Prejuízo de Frete">
                                                      - {formatCurrency(r.freightCost, false)}
                                                   </div>
                                                )}
                                             </td>
                                             <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                   <DropdownMenuTrigger render={
                                                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[12px] text-muted-foreground hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity">
                                                         <MoreHorizontal className="w-4 h-4" />
                                                      </Button>
                                                   } />
                                                   <DropdownMenuContent align="end" className="w-56 rounded-[20px] bg-card/80 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-2 font-medium">
                                                      <DropdownMenuItem onClick={() => handleEdit(r)} className="rounded-[12px] cursor-pointer py-2.5 px-3 hover:bg-muted/50 font-bold text-[13px]">
                                                         <Edit2 className="w-4 h-4 mr-2" /> Editar / Ver
                                                      </DropdownMenuItem>
                                                      
                                                      <DropdownMenuSeparator className="bg-border/40 my-1" />
                                                      <div className="px-3 py-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Ações Rápidas</div>
                                                      <DropdownMenuItem onClick={() => handleUpdateStatus(r.id, 'overallStatus', 'Finalizado')} className="rounded-[12px] cursor-pointer py-2 px-3 hover:bg-muted/50 font-bold text-[12px] text-foreground">
                                                         Finalizar Conferência
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => handleUpdateStatus(r.id, 'reputationStatus', 'Não Impactou Reputação')} className="rounded-[12px] cursor-pointer py-2 px-3 hover:bg-muted/50 font-bold text-[12px] text-foreground">
                                                         Reputação OK
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => handleUpdateStatus(r.id, 'productStatus', 'Retorno estoque')} className="rounded-[12px] cursor-pointer py-2 px-3 hover:bg-muted/50 font-bold text-[12px] text-foreground">
                                                         Retornou ao Estoque
                                                      </DropdownMenuItem>
                                                      <DropdownMenuSeparator className="bg-border/40 my-1" />
                                                      
                                                      <DropdownMenuItem onClick={() => handleDelete(r.id)} className="rounded-[12px] cursor-pointer py-2.5 px-3 hover:bg-destructive/10 text-destructive font-bold text-[13px]">
                                                         <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                                      </DropdownMenuItem>
                                                   </DropdownMenuContent>
                                                </DropdownMenu>
                                             </td>
                                          </motion.tr>
                                       ))
                                    )}
                                 </tbody>
                              </table>
                           </div>
                        </Card>
                     </div>
                  </div>
               </motion.div>
            )}

            {activeTab === 'dashboard' && (
               <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
               >
                  <RenderExecutiveCards />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                     
                     {/* Devoluções por Mês */}
                     <Card className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] xl:col-span-2">
                        <div className="px-6 pt-6 pb-2">
                           <h3 className="text-[12px] font-black uppercase text-muted-foreground tracking-widest">Evolução de Devoluções</h3>
                        </div>
                        <CardContent className="h-[280px] px-2 pb-4">
                           {barMonths.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={barMonths} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'var(--muted-foreground)', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill:'var(--muted-foreground)', fontSize: 11, fontWeight: 'bold'}} />
                                    <RechartsTooltip cursor={{fill: 'var(--muted)'}} contentStyle={{borderRadius:'16px',border:'1px solid var(--border)',backgroundColor:'var(--card)',boxShadow:'0 8px 32px rgba(0,0,0,0.1)'}} itemStyle={{color:'var(--foreground)',fontWeight:'bold',fontSize:'13px'}} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                       {barMonths.map((entry, index) => <Cell key={`cell-${index}`} fill={PURPLE_COLORS[index % PURPLE_COLORS.length]} />)}
                                    </Bar>
                                 </BarChart>
                              </ResponsiveContainer>
                           ) : <div className="h-full flex items-center justify-center text-[11px] font-black text-muted-foreground uppercase tracking-wider">Sem dados</div>}
                        </CardContent>
                     </Card>

                     {/* Canais */}
                     <Card className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                        <div className="px-6 pt-6 pb-2">
                           <h3 className="text-[12px] font-black uppercase text-muted-foreground tracking-widest">Devoluções por Canal</h3>
                        </div>
                        <CardContent className="h-[250px] px-2 pb-4 flex justify-center">
                           {barCanais.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie data={barCanais} cx="50%" cy="50%" innerRadius={60} outerRadius={85} stroke="none" dataKey="value" paddingAngle={3}>
                                       {barCanais.map((e,i)=> <Cell key={`cell-${i}`} fill={PURPLE_COLORS[i%PURPLE_COLORS.length]}/>)}
                                    </Pie>
                                    <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius:'16px',border:'1px solid var(--border)',backgroundColor:'var(--card)',boxShadow:'0 8px 32px rgba(0,0,0,0.1)'}} itemStyle={{color:'var(--foreground)',fontWeight:'bold',fontSize:'13px'}} />
                                 </PieChart>
                              </ResponsiveContainer>
                           ) : <div className="m-auto text-[11px] font-black text-muted-foreground uppercase tracking-wider">Sem dados</div>}
                        </CardContent>
                        {barCanais.length > 0 && (
                           <div className="px-6 pb-6 flex flex-wrap justify-center gap-3">
                              {barCanais.slice(0, 4).map((e,i)=> (
                                 <div key={i} className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: PURPLE_COLORS[i%PURPLE_COLORS.length]}}/>
                                    {e.name}
                                 </div>
                              ))}
                           </div>
                        )}
                     </Card>

                     {/* Impacto na Reputação */}
                     <Card className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                        <div className="px-6 pt-6 pb-2">
                           <h3 className="text-[12px] font-black uppercase text-muted-foreground tracking-widest">Impacto na Reputação</h3>
                        </div>
                        <CardContent className="h-[250px] px-2 pb-4 flex justify-center">
                           {pieReputation.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie data={pieReputation} cx="50%" cy="50%" innerRadius={0} outerRadius={80} stroke="none" dataKey="value">
                                       {pieReputation.map((e,i)=> {
                                          const color = e.name === 'Impactou' ? '#ef4444' : e.name === 'Sem Impacto/Revertido' ? '#22c55e' : '#f59e0b';
                                          return <Cell key={`cell-${i}`} fill={color}/>
                                       })}
                                    </Pie>
                                    <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius:'16px',border:'1px solid var(--border)',backgroundColor:'var(--card)',boxShadow:'0 8px 32px rgba(0,0,0,0.1)'}} itemStyle={{color:'var(--foreground)',fontWeight:'bold',fontSize:'13px'}} />
                                 </PieChart>
                              </ResponsiveContainer>
                           ) : <div className="m-auto text-[11px] font-black text-muted-foreground uppercase tracking-wider">Sem dados</div>}
                        </CardContent>
                        {pieReputation.length > 0 && (
                           <div className="px-6 pb-6 flex flex-wrap justify-center gap-3">
                              {pieReputation.map((e,i)=> {
                                 const color = e.name === 'Impactou' ? '#ef4444' : e.name === 'Sem Impacto/Revertido' ? '#22c55e' : '#f59e0b';
                                 return (
                                 <div key={i} className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: color}}/>
                                    {e.name}
                                 </div>
                              )})}
                           </div>
                        )}
                     </Card>

                     {/* Status do Produto */}
                     <Card className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                        <div className="px-6 pt-6 pb-2">
                           <h3 className="text-[12px] font-black uppercase text-muted-foreground tracking-widest">Destino do Produto</h3>
                        </div>
                        <CardContent className="h-[250px] px-2 pb-4 flex justify-center">
                           {pieProdStatus.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie data={pieProdStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} stroke="none" dataKey="value" paddingAngle={2}>
                                       {pieProdStatus.map((e,i)=> <Cell key={`cell-${i}`} fill={PURPLE_COLORS[i%PURPLE_COLORS.length]}/>)}
                                    </Pie>
                                    <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius:'16px',border:'1px solid var(--border)',backgroundColor:'var(--card)',boxShadow:'0 8px 32px rgba(0,0,0,0.1)'}} itemStyle={{color:'var(--foreground)',fontWeight:'bold',fontSize:'13px'}} />
                                 </PieChart>
                              </ResponsiveContainer>
                           ) : <div className="m-auto text-[11px] font-black text-muted-foreground uppercase tracking-wider">Sem dados</div>}
                        </CardContent>
                        {pieProdStatus.length > 0 && (
                           <div className="px-6 pb-6 flex flex-wrap justify-center gap-3">
                              {pieProdStatus.map((e,i)=> (
                                 <div key={i} className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: PURPLE_COLORS[i%PURPLE_COLORS.length]}}/>
                                    {e.name}
                                 </div>
                              ))}
                           </div>
                        )}
                     </Card>

                     {/* Motivos Top */}
                     <Card className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                        <div className="px-6 pt-6 pb-2">
                           <h3 className="text-[12px] font-black uppercase text-muted-foreground tracking-widest">Principais Motivos</h3>
                        </div>
                        <CardContent className="h-[280px] px-6 pb-6">
                           {barRazao.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                 <BarChart layout="vertical" data={barRazao.slice(0,5)} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill:'var(--muted-foreground)', fontSize: 11, fontWeight: 'bold'}} width={100} />
                                    <RechartsTooltip cursor={{fill: 'var(--muted)'}} contentStyle={{borderRadius:'16px',border:'1px solid var(--border)',backgroundColor:'var(--card)',boxShadow:'0 8px 32px rgba(0,0,0,0.1)'}} itemStyle={{color:'var(--foreground)',fontWeight:'bold',fontSize:'13px'}} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                                       {barRazao.map((entry, index) => <Cell key={`cell-${index}`} fill={PURPLE_COLORS[index % PURPLE_COLORS.length]} />)}
                                    </Bar>
                                 </BarChart>
                              </ResponsiveContainer>
                           ) : <div className="h-full flex items-center justify-center text-[11px] font-black text-muted-foreground uppercase tracking-wider">Sem dados</div>}
                        </CardContent>
                     </Card>

                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
      
      {/* WIZARD MODAL: NOVA/EDITAR DEVOLUÇÃO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
         <DialogPortal>
            <DialogOverlay className="bg-background/80 backdrop-blur-sm" />
            <DialogContent className="w-[95vw] sm:max-w-[80vw] md:max-w-[70vw] rounded-[32px] p-0 border border-border/50 shadow-[0_24px_64px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[95vh] bg-card">
               <div className="px-8 py-6 sticky top-0 z-10 bg-card/80 backdrop-blur-md">
                  <DialogTitle className="text-[20px] font-black text-foreground tracking-tight">{editingId ? 'Editar Devolução' : 'Nova Devolução'}</DialogTitle>
                  <p className="text-[13px] font-medium text-muted-foreground mt-1">Siga as etapas para registrar as informações da devolução.</p>
               </div>
               
               <StepIndicator />

               <form className="flex-1 flex flex-col overflow-hidden" onSubmit={handleSave}>
                  <div className="p-8 overflow-y-auto hide-scrollbar flex-1 min-h-[400px]">
                     
                     <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                           <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                              <div>
                                 <label className="text-[13px] font-bold text-foreground mb-3 block">Canal / Marketplace *</label>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['Mercado Livre', 'Shopee', 'TikTok Shop', 'Shein', 'Loja Própria', 'WhatsApp'].map(mk => (
                                       <CheckChip key={mk} label={mk} selected={formData.marketplace === mk} onClick={() => setFormData({...formData, marketplace: mk})} />
                                    ))}
                                 </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-3">
                                    <label className="text-[13px] font-bold text-foreground ml-1">Nº do Pedido *</label>
                                    <Input required value={formData.orderNumber} onChange={e => setFormData({...formData, orderNumber:e.target.value})} className="h-14 font-bold rounded-[16px] bg-background/50 border-border/50 focus:border-primary shadow-none text-[15px]" placeholder="#2024..." />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[13px] font-bold text-foreground ml-1">Cliente</label>
                                    <Input value={formData.customerName} onChange={e => setFormData({...formData, customerName:e.target.value})} className="h-14 font-medium rounded-[16px] bg-background/50 border-border/50 focus:border-primary shadow-none text-[15px]" placeholder="Nome do comprador" />
                                 </div>
                                 <div className="space-y-3 md:col-span-2">
                                    <label className="text-[13px] font-bold text-foreground ml-1">Data Devolução *</label>
                                    <Input type="date" required value={formData.returnDate} onChange={e => setFormData({...formData, returnDate:e.target.value})} className="h-14 font-medium rounded-[16px] bg-background/50 border-border/50 focus:border-primary shadow-none text-[15px]" />
                                 </div>
                              </div>
                           </motion.div>
                        )}

                        {currentStep === 2 && (
                           <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                              <div className="space-y-3">
                                 <label className="text-[13px] font-bold text-foreground ml-1">Produto *</label>
                                 <Select value={formData.productId} onValueChange={v => setFormData({...formData, productId:v})}>
                                    <SelectTrigger className="h-14 bg-background/50 border-border/50 hover:border-border focus:border-primary rounded-[16px] font-medium text-[15px] shadow-none">
                                       <SelectValue placeholder="Selecione um produto cadastrado..."/>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[20px] border-border/50 shadow-xl p-1 max-h-[300px]">
                                       {produtos.map(p => (
                                          <SelectItem key={p.id} value={p.id} className="rounded-[12px] font-medium py-3">
                                             {p.sku} - {p.name}
                                          </SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                                 {!formData.productId && (
                                    <Input value={formData.sku} onChange={e => setFormData({...formData, sku:e.target.value})} className="h-14 mt-3 font-medium rounded-[16px] bg-background/50 border-border/50 focus:border-primary shadow-none text-[15px]" placeholder="Ou digite o SKU manualmente..." />
                                 )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-3">
                                    <label className="text-[13px] font-bold text-foreground ml-1">Quantidade *</label>
                                    <Input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity:e.target.value})} className="h-14 font-black rounded-[16px] bg-background/50 border-border/50 focus:border-primary shadow-none text-[15px]" min="1" />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[13px] font-bold text-foreground ml-1">Valor do Pedido (R$) *</label>
                                    <Input required type="number" step="0.01" value={formData.orderValue} onChange={e => setFormData({...formData, orderValue:e.target.value})} className="h-14 font-black rounded-[16px] bg-background/50 border-border/50 focus:border-primary shadow-none text-[15px]" placeholder="0.00" />
                                 </div>
                              </div>

                              <div className="pt-4 border-t border-border/40">
                                 <label className="text-[13px] font-bold text-foreground mb-3 block">Houve impacto na plataforma / prejuízo de frete? *</label>
                                 <div className="grid grid-cols-2 gap-4">
                                    <CheckChip label="Não (Apenas estorno)" selected={formData.hasImpact === 'false'} onClick={() => setFormData({...formData, hasImpact: 'false', freightCost: ''})} activeColor="bg-primary/10 text-primary border-primary shadow-none" />
                                    <CheckChip label="Sim (Prejuízo frete)" selected={formData.hasImpact === 'true'} onClick={() => setFormData({...formData, hasImpact: 'true'})} activeColor="bg-destructive text-destructive-foreground shadow-[0_4px_16px_rgba(239,68,68,0.3)] border-transparent" />
                                 </div>
                              </div>
                              
                              <AnimatePresence>
                                 {formData.hasImpact === 'true' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                                       <label className="text-[13px] font-bold text-destructive ml-1">Custo / Prejuízo do Frete (R$)</label>
                                       <Input required type="number" step="0.01" value={formData.freightCost} onChange={e => setFormData({...formData, freightCost:e.target.value})} className="h-14 font-black rounded-[16px] border-destructive/30 focus:border-destructive shadow-none text-[15px] bg-destructive/5 text-destructive" placeholder="0.00" />
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                           </motion.div>
                        )}

                        {currentStep === 3 && (
                           <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                              <div>
                                 <label className="text-[13px] font-bold text-foreground mb-3 block">Motivo Real da Devolução *</label>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {['Tamanho incorreto', 'Produto com defeito', 'Produto errado', 'Cliente desistiu', 'Cor diferente', 'Problema de qualidade', 'Problema de transporte', 'Outro'].map(motivo => (
                                       <CheckChip key={motivo} label={motivo} selected={formData.returnReason === motivo} onClick={() => setFormData({...formData, returnReason: motivo})} />
                                    ))}
                                 </div>
                              </div>
                              
                              <div>
                                 <label className="text-[13px] font-bold text-foreground mb-3 block">Status da Reputação *</label>
                                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {['Verificar', 'Pendente', 'Em Tratativa', 'Impactou Reputação', 'Não Impactou Reputação'].map(rep => (
                                       <CheckChip key={rep} label={rep} selected={formData.reputationStatus === rep} onClick={() => setFormData({...formData, reputationStatus: rep})} activeColor={rep === 'Impactou Reputação' ? 'bg-destructive text-destructive-foreground' : rep === 'Não Impactou Reputação' ? 'bg-green-600 text-white' : undefined} />
                                    ))}
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border/40 pt-6">
                                 <div>
                                    <label className="text-[13px] font-bold text-foreground mb-3 block">Destino do Produto *</label>
                                    <div className="flex flex-col gap-3">
                                       {['Defeito', 'Retorno estoque', 'Reparo'].map(st => (
                                          <CheckChip key={st} label={st} selected={formData.productStatus === st} onClick={() => setFormData({...formData, productStatus: st})} />
                                       ))}
                                    </div>
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[13px] font-bold text-foreground ml-1">Status Geral / Conferência *</label>
                                    <Select value={formData.overallStatus} onValueChange={v => setFormData({...formData, overallStatus:v})} required>
                                       <SelectTrigger className="h-14 bg-background/50 border-border/50 hover:border-border focus:border-primary rounded-[16px] font-medium text-[15px] shadow-none"><SelectValue/></SelectTrigger>
                                       <SelectContent className="rounded-[20px] border-border/50 shadow-xl p-1">
                                          <SelectItem value="Pendente" className="rounded-[12px] font-medium py-2.5">Pendente</SelectItem>
                                          <SelectItem value="Tratativa" className="rounded-[12px] font-medium py-2.5">Em Tratativa</SelectItem>
                                          <SelectItem value="Finalizado" className="rounded-[12px] font-medium py-2.5">Finalizado</SelectItem>
                                       </SelectContent>
                                    </Select>

                                    <div className="pt-2">
                                       <label className="text-[13px] font-bold text-foreground ml-1 mb-2 block">Anotações Internas</label>
                                       <Textarea value={formData.inspectionNotes} onChange={e => setFormData({...formData, inspectionNotes:e.target.value})} className="min-h-[100px] font-medium rounded-[16px] bg-background/50 border-border/50 focus:border-primary shadow-none text-[15px] p-4" placeholder="Informações adicionais..." />
                                    </div>
                                 </div>
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                     
                  </div>
                  
                  <div className="p-6 border-t border-border/40 bg-card flex items-center justify-between gap-4 mt-auto">
                     <Button type="button" variant="ghost" className="h-14 font-bold px-8 rounded-[16px] bg-muted/50 hover:bg-muted text-[15px]" onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setIsModalOpen(false)}>
                        {currentStep > 1 ? <><ChevronLeft className="w-5 h-5 mr-2" /> Voltar</> : 'Cancelar'}
                     </Button>
                     
                     {currentStep < 3 ? (
                        <Button type="button" className="h-14 font-bold px-10 rounded-[16px] bg-primary text-primary-foreground shadow-[0_4px_24px_rgba(109,74,255,0.4)]" onClick={() => setCurrentStep(currentStep + 1)}>
                           Próximo <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                     ) : (
                        <Button type="submit" disabled={isSubmitting} className="h-14 font-bold px-10 rounded-[16px] bg-primary text-primary-foreground shadow-[0_4px_24px_rgba(109,74,255,0.4)] hover:shadow-[0_4px_32px_rgba(109,74,255,0.6)]">
                           {isSubmitting ? 'Salvando...' : editingId ? 'Atualizar Devolução' : 'Registrar Devolução'}
                        </Button>
                     )}
                  </div>
               </form>
            </DialogContent>
         </DialogPortal>
      </Dialog>
    </div>
  );
}
"""

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "w") as f:
    f.write(content)

