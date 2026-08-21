import re

with open('/tmp/orig.txt', 'r') as f:
    content = f.read()

# Create a brand new file with the identical logic, but completely new UI
new_file = """import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../../lib/utils';
import { 
  format, isBefore, isAfter, isToday, addDays, differenceInDays, parseISO, 
  startOfMonth, endOfMonth, isSameMonth, addWeeks, addMonths, addYears 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Activity, Edit2, Clock, FileText, CheckCircle2, Plus, RefreshCcw, Paperclip, 
  Download, MoreVertical, TrendingDown, TrendingUp, X, Filter, EyeOff, Trash2, 
  History, Bell, Eye, DollarSign, Archive, Wallet, ArrowRight, ChevronRight, 
  CheckCircle, ChevronDown, CreditCard, Copy, Search, Calendar, LayoutDashboard, 
  AlertCircle, Mic, Camera, Keyboard, MessageSquare, ListTodo, FileDown,
  FileSpreadsheet, FileBarChart, PieChart, Sparkles, Tag, Building2, User
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';

export default function DespesasVariaveis() {
  const { isPessoal, privacyMode, setPrivacyMode } = useAppContext();
  const { user } = useAuth();
  
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'lista' | 'pendentes'>('lista');
  
  // Existing Filters + New Filters
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterOrigin, setFilterOrigin] = useState('Todas');
  const [filterAccount, setFilterAccount] = useState('Todas');
  const [filterPaymentMode, setFilterPaymentMode] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterOrder, setFilterOrder] = useState('Mais recentes');
  
  const defaultExpense = {
    description: '', value: '', category: '', account: '', paymentMethod: '', 
    notes: '', date: new Date().toISOString().split('T')[0], status: 'categorizado',
    origin: 'manual', type: isPessoal ? 'pessoal' : 'empresa'
  };
  
  const [formData, setFormData] = useState(defaultExpense);

  const categories = ['Compras de Produto', 'Insumos', 'Embalagens', 'Aviamentos', 'Tecido', 'Frete', 'Motoboy', 'Correios', 'Combustível', 'Alimentação', 'Marketplace', 'Taxas', 'Anúncios', 'Manutenção', 'Material de Escritório', 'Transporte', 'Viagem', 'Fornecedor', 'Outros'];
  const accounts = ['Nubank PJ', 'Inter PJ', 'Mercado Pago', 'Caixa', 'Dinheiro', 'Cartão', 'Outra'];
  const paymentMethods = ['PIX', 'Boleto', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência', 'Dinheiro'];

  const currentMonthDate = new Date(parseInt(filterYear), parseInt(filterMonth), 1);
  const prevMonthDate = new Date(parseInt(filterYear), parseInt(filterMonth) - 1, 1);

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

  useEffect(() => {
    if (!user) return;
    const typeFilter = isPessoal ? 'pessoal' : 'empresa';
    const q = query(
      collection(db, 'variable_expenses'),
      where('userId', '==', user.uid),
      where('type', '==', typeFilter)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
      setExpenses(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isPessoal, user]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, type: isPessoal ? 'pessoal' : 'empresa' }));
  }, [isPessoal]);

  const handleDescriptionChange = (val: string) => {
    let suggestedCategory = formData.category;
    const valLower = val.toLowerCase();
    
    if (valLower.includes('uber') || valLower.includes('99') || valLower.includes('taxi')) suggestedCategory = 'Transporte';
    else if (valLower.includes('ifood') || valLower.includes('restaurante') || valLower.includes('padaria') || valLower.includes('mercado')) suggestedCategory = 'Alimentação';
    else if (valLower.includes('posto') || valLower.includes('gasolina') || valLower.includes('etanol')) suggestedCategory = 'Combustível';
    else if (valLower.includes('correios') || valLower.includes('sedex') || valLower.includes('pac')) suggestedCategory = 'Correios';
    else if (valLower.includes('motoboy') || valLower.includes('lalamove') || valLower.includes('loggi')) suggestedCategory = 'Motoboy';
    else if (valLower.includes('tecido') || valLower.includes('malha')) suggestedCategory = 'Tecido';
    else if (valLower.includes('linha') || valLower.includes('agulha') || valLower.includes('botão') || valLower.includes('ziper')) suggestedCategory = 'Aviamentos';
    else if (valLower.includes('caixa') || valLower.includes('sacola') || valLower.includes('fita')) suggestedCategory = 'Embalagens';
    
    setFormData(prev => ({...prev, description: val, category: suggestedCategory}));
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData(defaultExpense);
  };

  const handleSaveExpense = async (e: React.FormEvent, asPending = false) => {
    e.preventDefault();
    if (!user) return;
    try {
      const dataToSave: any = { ...formData, value: Number(formData.value) };
      dataToSave.userId = user.uid;
      dataToSave.updatedAt = new Date().toISOString();
      dataToSave.status = asPending ? 'pendente' : 'categorizado';

      if (editingExpense) {
         await updateDoc(doc(db, 'variable_expenses', editingExpense.id), dataToSave);
         toast.success(asPending ? 'Salvo como rascunho' : 'Despesa alterada com sucesso');
      } else {
         dataToSave.createdAt = new Date().toISOString();
         await addDoc(collection(db, 'variable_expenses'), dataToSave);
         toast.success('Despesa adicionada com sucesso');
      }
      setIsManualModalOpen(false);
      setIsReviewModalOpen(false);
      resetForm();
    } catch (e) {
      toast.error('Erro ao salvar despesa');
      console.error(e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Excluir despesa "${name}"?`)) {
       try {
         await deleteDoc(doc(db, 'variable_expenses', id));
         toast.success('Excluída com sucesso');
       } catch {
         toast.error('Erro ao excluir');
       }
    }
  };

  const handleDupe = async (item: any) => {
    if (!user) return;
    try {
      const newItem = { ...item };
      delete newItem.id;
      newItem.description = `${newItem.description} (Cópia)`;
      newItem.createdAt = new Date().toISOString();
      newItem.updatedAt = new Date().toISOString();
      newItem.status = 'pendente'; 
      await addDoc(collection(db, 'variable_expenses'), newItem);
      toast.success('Despesa duplicada');
    } catch(e) {
      toast.error('Erro ao duplicar');
    }
  };

  const handleSimulateAudioSave = async () => {
     if (!user) return;
     toast.loading("Processando áudio com IA...");
     setTimeout(async () => {
       try {
         await addDoc(collection(db, 'variable_expenses'), {
           userId: user.uid,
           description: "Tecido na Loja São Paulo",
           value: 100,
           category: "Tecido",
           paymentMethod: "", 
           account: "", 
           origin: "audio",
           status: "pendente",
           type: isPessoal ? 'pessoal' : 'empresa',
           date: new Date().toISOString().split('T')[0],
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString(),
           transcription: "Comprei 100 reais de tecido na loja São Paulo..."
         });
         toast.dismiss();
         toast.success("Áudio processado e salvo (Faltam dados)");
         setIsAudioModalOpen(false);
         setActiveTab('pendentes');
       } catch(e) {
         toast.dismiss();
         toast.error("Erro ao salvar áudio");
       }
     }, 1500);
  };

  const handleSimulatePhotoSave = async () => {
    if (!user) return;
    toast.loading("Analisando comprovante...");
    setTimeout(async () => {
      try {
        await addDoc(collection(db, 'variable_expenses'), {
          userId: user.uid,
          description: "Posto Ipiranga",
          value: 120,
          category: "Combustível",
          paymentMethod: "",
          account: "", 
          origin: "photo",
          status: "pendente",
          type: isPessoal ? 'pessoal' : 'empresa',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        toast.dismiss();
        toast.success("Comprovante analisado (Faltam dados)");
        setIsPhotoModalOpen(false);
        setActiveTab('pendentes');
      } catch(e) {
        toast.dismiss();
        toast.error("Erro ao salvar comprovante");
      }
    }, 2000);
  };

  const openReview = (item: any) => {
    setEditingExpense(item);
    setFormData({
      description: item.description || '', 
      value: item.value || '', 
      category: item.category || '', 
      account: item.account || '', 
      paymentMethod: item.paymentMethod || '', 
      notes: item.notes || '', 
      date: item.date || new Date().toISOString().split('T')[0], 
      type: item.type,
      origin: item.origin,
      status: item.status
    } as any);
    setIsReviewModalOpen(true);
  };

  const { stats, filteredList, pendentes } = useMemo(() => {
    let totalVar = 0;
    let totalHoje = 0;
    let totalVarPrev = 0;
    const catMap: any = {};
    const originMap: any = {};
    const pendentesArr: any[] = [];
    const listArr: any[] = [];
    
    expenses.forEach(item => {
      if (item.status === 'pendente' || item.status === 'revisado') {
         pendentesArr.push(item);
      } else {
         const d = new Date(item.date + 'T00:00:00');
         if (isSameMonth(d, currentMonthDate)) {
           listArr.push(item);
           totalVar += Number(item.value || 0);
           catMap[item.category || 'Sem Categoria'] = (catMap[item.category || 'Sem Categoria'] || 0) + Number(item.value || 0);
           originMap[item.origin || 'manual'] = (originMap[item.origin || 'manual'] || 0) + Number(item.value || 0);
           if (isToday(d)) totalHoje += Number(item.value || 0);
         }
         if (isSameMonth(d, prevMonthDate)) {
           totalVarPrev += Number(item.value || 0);
         }
      }
    });

    let maiorCat = { name: '-', value: 0 };
    Object.keys(catMap).forEach(k => {
      if (catMap[k] > maiorCat.value) maiorCat = { name: k, value: catMap[k] };
    });
    
    const diffPrev = totalVarPrev ? ((totalVar - totalVarPrev) / totalVarPrev) * 100 : 0;
    const ticketMedio = listArr.length > 0 ? totalVar / listArr.length : 0;

    const finalFiltered = listArr.filter(item => {
      if (filterCategory !== 'Todas' && item.category !== filterCategory) return false;
      if (filterOrigin !== 'Todas' && item.origin !== filterOrigin) return false;
      if (filterAccount !== 'Todas' && item.account !== filterAccount) return false;
      if (filterPaymentMode !== 'Todos' && item.paymentMethod !== filterPaymentMode) return false;
      if (filterStatus !== 'Todos' && item.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => {
      if (filterOrder === 'Mais recentes') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (filterOrder === 'Maior valor') return Number(b.value) - Number(a.value);
      if (filterOrder === 'Menor valor') return Number(a.value) - Number(b.value);
      return 0;
    });

    return { 
      stats: { totalVar, totalHoje, diffPrev, maiorCat, pendentesCount: pendentesArr.length, listCount: listArr.length, ticketMedio },
      filteredList: finalFiltered,
      pendentes: pendentesArr
    };
  }, [expenses, filterMonth, filterYear, filterCategory, filterOrigin, filterAccount, filterPaymentMode, filterStatus, filterOrder]);

  const getOriginLabel = (o: string) => {
    if (o === 'audio') return 'Áudio';
    if (o === 'photo') return 'Foto/Comprovante';
    return 'Manual';
  };

  const getOriginIcon = (o: string) => {
    if (o === 'audio') return <Mic size={14} className="text-[#6D4AFF] dark:text-[#7B61FF]" />;
    if (o === 'photo') return <Camera size={14} className="text-[#10b981]" />;
    return <Keyboard size={14} className="text-[#f59e0b]" />;
  };

  const formatValue = (v: number) => {
    return formatCurrency(v);
  };

  const statusColors: any = {
    'categorizado': 'bg-[#10b981]/10 text-[#10b981] dark:bg-[#10b981]/20',
    'pendente': 'bg-[#f59e0b]/10 text-[#f59e0b] dark:bg-[#f59e0b]/20',
    'revisado': 'bg-[#3b82f6]/10 text-[#3b82f6] dark:bg-[#3b82f6]/20'
  };

  const statusLabels: any = {
    'categorizado': 'OK',
    'pendente': 'Categorização',
    'revisado': 'Revisar'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold text-[#111827] dark:text-white tracking-tight leading-tight">Despesas Variáveis</h1>
          <p className="text-[15px] text-[#6B7280] mt-1">Gerencie gastos rápidos, lançamentos móveis e despesas operacionais.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={togglePrivacy}
            className="w-[48px] h-[48px] flex items-center justify-center bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 hover:text-[#6D4AFF] text-[#6B7280] rounded-[18px] transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            title={privacyMode ? "Mostrar Valores" : "Ocultar Valores"}
          >
            {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          
          <button className="h-[48px] px-6 bg-white dark:bg-[#181B24] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[#111827] dark:text-white rounded-[18px] font-bold text-[15px] transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-2">
            <Download size={20} /> Gerar Relatório
          </button>
          <button 
            onClick={() => { resetForm(); setIsManualModalOpen(true); }}
            className="h-[48px] px-6 bg-[#6D4AFF] dark:bg-[#7B61FF] hover:opacity-90 text-white rounded-[18px] font-bold text-[15px] shadow-[0_4px_14px_0_rgba(109,74,255,0.39)] transition-all flex items-center gap-2"
          >
            <Plus size={20} strokeWidth={2.5} /> Registrar Gasto
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-8 border-b border-[#ECEFF5] dark:border-white/5">
        <button 
          onClick={() => setActiveTab('lista')}
          className={`pb-4 text-[15px] font-bold transition-all relative ${activeTab === 'lista' ? 'text-[#6D4AFF] dark:text-[#7B61FF]' : 'text-[#6B7280] hover:text-[#111827] dark:hover:text-white'}`}
        >
          Lançamentos Concluídos
          {activeTab === 'lista' && (
            <motion.div layoutId="dv-tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#6D4AFF] dark:bg-[#7B61FF] rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('pendentes')}
          className={`pb-4 text-[15px] font-bold transition-all relative flex items-center gap-2 ${activeTab === 'pendentes' ? 'text-[#6D4AFF] dark:text-[#7B61FF]' : 'text-[#6B7280] hover:text-[#111827] dark:hover:text-white'}`}
        >
          Pendentes de Categorização
          {stats.pendentesCount > 0 && (
            <span className="bg-[#ef4444] text-white text-[11px] px-2 py-0.5 rounded-full">{stats.pendentesCount}</span>
          )}
          {activeTab === 'pendentes' && (
            <motion.div layoutId="dv-tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#6D4AFF] dark:bg-[#7B61FF] rounded-t-full" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'lista' && (
          <motion.div key="lista" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            
            {/* KPIs - 6 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { title: "Gasto no Mês", value: stats.totalVar, icon: Wallet, color: "#6D4AFF", trend: stats.diffPrevMonth, isNum: false },
                { title: "Gasto Hoje", value: stats.totalHoje, icon: Clock, color: "#10b981", trend: 0, isNum: false },
                { title: "Ticket Médio", value: stats.ticketMedio, icon: DollarSign, color: "#f59e0b", trend: 0, isNum: false },
                { title: "Maior Categoria", value: stats.maiorCat.name, icon: Tag, color: "#ec4899", trend: 0, isNum: true, subValue: stats.maiorCat.value },
                { title: "Pendentes", value: stats.pendentesCount, icon: AlertCircle, color: "#ef4444", trend: 0, isNum: true },
                { title: "Lançamentos", value: stats.listCount, icon: ListTodo, color: "#3b82f6", trend: 0, isNum: true },
              ].map((kpi, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  key={i} 
                  className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full pointer-events-none" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-opacity-10 dark:bg-opacity-20" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                      <kpi.icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="text-[13px] font-bold text-[#6B7280]">{kpi.title}</div>
                  </div>
                  <div className="text-[24px] font-black text-[#111827] dark:text-white tracking-tight">
                    {kpi.isNum ? kpi.value : (privacyMode ? 'R$ •••••' : formatValue(kpi.value as number))}
                  </div>
                  {!kpi.isNum && kpi.subValue && (
                     <div className="text-[12px] text-[#6B7280] font-bold mt-1">
                        {privacyMode ? '••••' : formatValue(kpi.subValue as number)}
                     </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              
              {/* MAIN COLUMN */}
              <div className="xl:col-span-3 space-y-8">
                
                {/* FILTERS */}
                <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-bold text-[#111827] dark:text-white flex items-center gap-2"><Filter size={18}/> Filtros Ativos</h3>
                    <button 
                      onClick={() => { setFilterCategory('Todas'); setFilterOrigin('Todas'); setFilterAccount('Todas'); setFilterPaymentMode('Todos'); setFilterStatus('Todos'); setFilterOrder('Mais recentes'); }}
                      className="text-[13px] font-bold text-[#6B7280] hover:text-[#6D4AFF] transition-colors"
                    >
                      Limpar filtros
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="relative">
                      <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer">
                        {Array.from({length: 12}).map((_, i) => (
                          <option key={i} value={i}>{format(new Date(2024, i, 1), 'MMMM', {locale: ptBR})}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer">
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer">
                        <option value="Todas">Todas Categorias</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer">
                        <option value="Todas">Todas Contas</option>
                        {accounts.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)} className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer">
                        <option value="Todas">Todas Origens</option>
                        <option value="manual">Manual</option>
                        <option value="audio">Áudio</option>
                        <option value="photo">Foto</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select value={filterPaymentMode} onChange={e => setFilterPaymentMode(e.target.value)} className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer">
                        <option value="Todos">Pagamento (Todos)</option>
                        {paymentMethods.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer">
                        <option value="Todos">Status (Todos)</option>
                        <option value="categorizado">OK</option>
                        <option value="pendente">Categorização</option>
                        <option value="revisado">Revisar</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select value={filterOrder} onChange={e => setFilterOrder(e.target.value)} className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer">
                        <option value="Mais recentes">Mais recentes</option>
                        <option value="Maior valor">Maior valor</option>
                        <option value="Menor valor">Menor valor</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* TABLE */}
                <div className="bg-white dark:bg-[#181B24] rounded-[24px] border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#ECEFF5] dark:border-white/5 bg-[#F6F7FB]/50 dark:bg-[#12141C]/50 backdrop-blur-md">
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Descrição</th>
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Categoria / Conta</th>
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Data / Origem</th>
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Valor</th>
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider w-[80px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-[#6B7280] font-bold">Carregando...</td></tr>
                          ) : filteredList.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-[#6B7280] font-bold">Nenhuma despesa encontrada.</td></tr>
                          ) : (
                            filteredList.map((item, i) => (
                              <motion.tr 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}
                                key={item.id} 
                                className="border-b border-[#ECEFF5] dark:border-white/5 hover:bg-[#F6F7FB]/50 dark:hover:bg-[#12141C]/50 transition-colors group"
                              >
                                <td className="p-5">
                                  <div className="font-bold text-[15px] text-[#111827] dark:text-white">{item.description}</div>
                                  {item.notes && <div className="text-[13px] text-[#6B7280] mt-1 truncate max-w-[200px]">{item.notes}</div>}
                                </td>
                                <td className="p-5">
                                  <div className="font-bold text-[14px] text-[#111827] dark:text-[#A8B0C0]">{item.category || '-'}</div>
                                  <div className="text-[12px] text-[#6B7280] mt-1">{item.account || '-'}</div>
                                </td>
                                <td className="p-5">
                                  <div className="font-bold text-[14px] text-[#111827] dark:text-white">
                                    {item.date ? format(new Date(item.date + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                  </div>
                                  <div className="text-[12px] text-[#6B7280] mt-1 flex items-center gap-1">
                                    {getOriginIcon(item.origin)} {getOriginLabel(item.origin)}
                                  </div>
                                </td>
                                <td className="p-5">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold ${statusColors[item.status || 'categorizado']}`}>
                                    {statusLabels[item.status || 'categorizado']}
                                  </span>
                                </td>
                                <td className="p-5 text-right">
                                  <div className="font-black text-[16px] text-[#111827] dark:text-white">
                                    {privacyMode ? 'R$ •••••' : formatValue(item.value)}
                                  </div>
                                  <div className="text-[12px] text-[#6B7280] mt-1">{item.paymentMethod || '-'}</div>
                                </td>
                                <td className="p-5 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#6B7280] transition-colors">
                                        <MoreVertical size={18} />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px] rounded-[16px] border-[#ECEFF5] dark:border-white/5 bg-white/90 dark:bg-[#181B24]/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-2">
                                      <DropdownMenuItem onClick={() => { setEditingExpense(item); setFormData(item); setIsManualModalOpen(true); }} className="rounded-[12px] font-bold text-[13px] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] hover:text-[#6D4AFF] cursor-pointer"><Edit2 size={14} className="mr-2" /> Editar</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDupe(item)} className="rounded-[12px] font-bold text-[13px] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] hover:text-[#6D4AFF] cursor-pointer"><Copy size={14} className="mr-2" /> Duplicar</DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-[#ECEFF5] dark:bg-white/5 my-1" />
                                      <DropdownMenuItem onClick={() => handleDelete(item.id, item.description)} className="rounded-[12px] font-bold text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"><Trash2 size={14} className="mr-2" /> Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* SIDE COLUMN */}
              <div className="space-y-8">

                {/* QUICK ACTIONS */}
                <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <h3 className="text-[15px] font-bold text-[#111827] dark:text-white mb-4">Ações Rápidas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { resetForm(); setIsManualModalOpen(true); }} className="h-[80px] flex flex-col items-center justify-center gap-2 rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] hover:bg-[#6D4AFF]/10 dark:hover:bg-[#7B61FF]/10 text-[#6B7280] hover:text-[#6D4AFF] transition-colors border border-transparent hover:border-[#6D4AFF]/20">
                      <Keyboard size={24} />
                      <span className="text-[12px] font-bold">Manual</span>
                    </button>
                    <button onClick={() => setIsAudioModalOpen(true)} className="h-[80px] flex flex-col items-center justify-center gap-2 rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] hover:bg-[#6D4AFF]/10 dark:hover:bg-[#7B61FF]/10 text-[#6B7280] hover:text-[#6D4AFF] transition-colors border border-transparent hover:border-[#6D4AFF]/20">
                      <Mic size={24} />
                      <span className="text-[12px] font-bold">Áudio</span>
                    </button>
                    <button onClick={() => setIsPhotoModalOpen(true)} className="h-[80px] flex flex-col items-center justify-center gap-2 rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] hover:bg-[#6D4AFF]/10 dark:hover:bg-[#7B61FF]/10 text-[#6B7280] hover:text-[#6D4AFF] transition-colors border border-transparent hover:border-[#6D4AFF]/20">
                      <Camera size={24} />
                      <span className="text-[12px] font-bold">Foto</span>
                    </button>
                    <button className="h-[80px] flex flex-col items-center justify-center gap-2 rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] hover:bg-[#6D4AFF]/10 dark:hover:bg-[#7B61FF]/10 text-[#6B7280] hover:text-[#6D4AFF] transition-colors border border-transparent hover:border-[#6D4AFF]/20">
                      <FileSpreadsheet size={24} />
                      <span className="text-[12px] font-bold">Excel</span>
                    </button>
                  </div>
                </div>

                {/* INSIGHTS */}
                <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <h3 className="text-[15px] font-bold text-[#111827] dark:text-white mb-6 flex items-center gap-2">
                    <Sparkles size={18} className="text-[#6D4AFF]" /> Insights Inteligentes
                  </h3>
                  <div className="space-y-4">
                    {stats.maiorCat.name !== '-' && (
                      <div className="p-4 rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5">
                        <p className="text-[13px] font-bold text-[#111827] dark:text-white leading-relaxed">
                          A categoria <span className="text-[#6D4AFF]">{stats.maiorCat.name}</span> representa a maior parte dos gastos variáveis este mês.
                        </p>
                      </div>
                    )}
                    {stats.pendentesCount > 0 && (
                      <div className="p-4 rounded-[16px] bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#b45309] dark:text-[#fbbf24]">
                        <p className="text-[13px] font-bold leading-relaxed">
                          Existem {stats.pendentesCount} lançamentos aguardando categorização na aba Pendentes.
                        </p>
                      </div>
                    )}
                    <div className="p-4 rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5">
                      <p className="text-[13px] font-bold text-[#111827] dark:text-white leading-relaxed">
                        O ticket médio está em <span className="text-[#10b981]">{privacyMode ? '••••' : formatValue(stats.ticketMedio)}</span> por lançamento.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ÚLTIMOS LANÇAMENTOS (Mini) */}
                <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <h3 className="text-[15px] font-bold text-[#111827] dark:text-white mb-4">Últimos Registros</h3>
                  <div className="space-y-4">
                    {filteredList.slice(0, 5).map((ev: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <div className="text-[13px] font-bold text-[#111827] dark:text-white">{ev.description}</div>
                          <div className="text-[11px] text-[#6B7280]">{ev.category || 'Sem categoria'}</div>
                        </div>
                        <div className="text-[13px] font-black text-[#111827] dark:text-white">
                          {privacyMode ? '••••' : formatValue(ev.value)}
                        </div>
                      </div>
                    ))}
                    {filteredList.length === 0 && <div className="text-[13px] text-[#6B7280] font-bold">Sem registros recentes</div>}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* PENDENTES TAB CONTENT */}
        {activeTab === 'pendentes' && (
          <motion.div key="pendentes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {pendentes.length === 0 ? (
              <div className="bg-white dark:bg-[#181B24] rounded-[24px] border border-[#ECEFF5] dark:border-white/5 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-[#10b981]/10 text-[#10b981] rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-[20px] font-bold text-[#111827] dark:text-white mb-2">Tudo em dia!</h3>
                <p className="text-[14px] text-[#6B7280] max-w-[300px]">Você não tem lançamentos aguardando revisão ou categorização.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pendentes.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    key={item.id} 
                    className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#f59e0b]/20 dark:border-[#f59e0b]/10 shadow-[0_8px_30px_rgba(245,158,11,0.05)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#f59e0b]/10 text-[#f59e0b]">
                          {getOriginIcon(item.origin)} Pendente
                        </span>
                        <div className="text-[12px] font-bold text-[#6B7280]">
                          {format(new Date(item.date + 'T00:00:00'), 'dd MMM', {locale: ptBR})}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-[16px] font-bold text-[#111827] dark:text-white leading-tight mb-1">{item.description}</div>
                        <div className="text-[24px] font-black text-[#111827] dark:text-white">{privacyMode ? 'R$ •••••' : formatValue(item.value)}</div>
                      </div>

                      {item.transcription && (
                        <div className="bg-[#F6F7FB] dark:bg-[#12141C] p-3 rounded-[12px] text-[12px] text-[#6B7280] italic mb-4">
                          "{item.transcription}"
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => openReview(item)}
                      className="w-full h-[48px] rounded-[16px] bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-[14px] transition-colors shadow-[0_4px_14px_0_rgba(245,158,11,0.3)]"
                    >
                      Categorizar agora
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KEEP MODALS */}

      {/* MANUAL ENTRY MODAL */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-[24px] font-bold text-[#111827] dark:text-white">
              {editingExpense ? 'Editar Despesa' : 'Novo Gasto Variável'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => handleSaveExpense(e, false)} className="space-y-8">
            
            {/* Bloco 1 */}
            <div className="space-y-4">
              <h4 className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#ECEFF5] dark:border-white/5 pb-2">Informações Principais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Descrição do Gasto</Label>
                  <Input required value={formData.description} onChange={e => handleDescriptionChange(e.target.value)} placeholder="Ex: Almoço com cliente, Uber, etc." className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Valor (R$)</Label>
                  <Input required type="number" step="0.01" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="0,00" className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Categoria</Label>
                  <div className="relative">
                    <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none">
                      <option value="">Selecione</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 2 */}
            <div className="space-y-4">
              <h4 className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#ECEFF5] dark:border-white/5 pb-2">Detalhes Financeiros</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Conta / Carteira</Label>
                  <div className="relative">
                    <select value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})} className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none">
                      <option value="">Selecione</option>
                      {accounts.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Forma de Pagamento</Label>
                  <div className="relative">
                    <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none">
                      <option value="">Selecione</option>
                      {paymentMethods.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Data</Label>
                  <Input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Empresa / Contexto</Label>
                  <div className="relative">
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as 'pessoal'|'empresa'})} className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none">
                      <option value="pessoal">Pessoal</option>
                      <option value="empresa">Empresa</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3 */}
            <div className="space-y-4">
              <h4 className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#ECEFF5] dark:border-white/5 pb-2">Adicionais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Observações</Label>
                  <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Informações extras sobre o gasto..." className="min-h-[80px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] p-4 resize-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#ECEFF5] dark:border-white/5">
              <button type="button" onClick={() => setIsManualModalOpen(false)} className="h-[48px] px-6 rounded-[16px] font-bold text-[14px] text-[#6B7280] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] transition-colors">Cancelar</button>
              <button type="submit" className="h-[48px] px-8 rounded-[16px] bg-[#6D4AFF] text-white font-bold text-[14px] shadow-[0_4px_14px_0_rgba(109,74,255,0.39)] hover:opacity-90 transition-opacity">Salvar Gasto</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AUDIO ENTRY */}
      <Dialog open={isAudioModalOpen} onOpenChange={setIsAudioModalOpen}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 p-8 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="w-20 h-20 bg-[#6D4AFF]/10 text-[#6D4AFF] rounded-full flex items-center justify-center animate-pulse mb-4 ring-8 ring-[#6D4AFF]/5">
            <Mic size={36} strokeWidth={2.5}/>
          </div>
          <DialogTitle className="text-[20px] font-black text-[#111827] dark:text-white">Fale seu gasto</DialogTitle>
          <p className="text-[14px] font-bold text-[#6B7280] mt-2 max-w-[250px]">"Comprei 100 reais de tecido na loja São Paulo..."</p>
          <div className="mt-8 text-[32px] font-mono font-black text-[#111827] dark:text-white">00:04</div>
          <div className="flex gap-4 mt-8 w-full">
            <Button onClick={() => setIsAudioModalOpen(false)} variant="outline" className="flex-1 h-[56px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 font-bold text-[#6B7280] hover:text-[#111827] dark:hover:text-white"><X size={20}/></Button>
            <Button onClick={handleSimulateAudioSave} className="flex-[2] h-[56px] rounded-[16px] font-black bg-[#6D4AFF] hover:bg-[#5b3ce0] text-white shadow-[0_4px_14px_0_rgba(109,74,255,0.39)]"><CheckCircle size={20} className="mr-2"/> Processar Áudio</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PHOTO ENTRY */}
      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 p-8 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <DialogTitle className="text-[20px] font-black text-[#111827] dark:text-white mb-4">Enviar Cupom/Nota</DialogTitle>
          <div className="w-full aspect-[3/4] bg-[#F6F7FB] dark:bg-[#12141C] rounded-[20px] border-2 border-dashed border-[#ECEFF5] dark:border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[#ECEFF5]/50 dark:hover:bg-white/5 transition-colors">
             <Camera size={40} className="text-[#6B7280] opacity-50"/>
             <span className="font-bold text-[14px] text-[#111827] dark:text-white">Tocar para abrir câmera</span>
          </div>
          <Button onClick={handleSimulatePhotoSave} className="w-full h-[56px] rounded-[16px] mt-6 font-black bg-[#10b981] hover:bg-[#059669] text-white shadow-[0_4px_14px_0_rgba(16,185,129,0.39)]">Analisar Foto</Button>
        </DialogContent>
      </Dialog>

      {/* REVIEW PENDING MODAL */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-3xl rounded-[24px] bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <DialogHeader className="mb-6 flex flex-row items-center gap-4">
             <div className="w-12 h-12 bg-[#f59e0b] text-white rounded-full flex items-center justify-center shrink-0 shadow-[0_4px_14px_0_rgba(245,158,11,0.3)]">
               {editingExpense?.origin === 'audio' ? <Mic size={24}/> : editingExpense?.origin === 'photo' ? <Camera size={24}/> : <Keyboard size={24}/>}
             </div>
             <div>
                <DialogTitle className="text-[24px] font-bold text-[#111827] dark:text-white">Completar Lançamento</DialogTitle>
                <p className="text-[13px] font-bold text-[#f59e0b] uppercase tracking-wider mt-1">Origem: {getOriginLabel(editingExpense?.origin)}</p>
             </div>
          </DialogHeader>
          
          <form className="space-y-6" onSubmit={(e) => handleSaveExpense(e, false)}>
             {editingExpense?.transcription && (
               <div className="bg-[#F6F7FB] dark:bg-[#12141C] p-4 rounded-[16px] border border-[#ECEFF5] dark:border-white/5 mb-6">
                 <div className="text-[11px] uppercase font-bold text-[#6B7280] tracking-wider mb-2 flex items-center gap-1"><MessageSquare size={14}/> Transcrição Original</div>
                 <span className="text-[14px] font-bold text-[#111827] dark:text-white italic">"{editingExpense.transcription}"</span>
               </div>
             )}
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="space-y-2 md:col-span-2">
                 <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Valor do Gasto (R$)</Label>
                 <Input required type="number" step="0.01" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="h-[56px] text-[20px] font-black rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 focus:border-[#6D4AFF] px-4" placeholder="0,00"/>
               </div>
               <div className="space-y-2 md:col-span-2">
                 <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Descrição</Label>
                 <Input required value={formData.description} onChange={e => handleDescriptionChange(e.target.value)} className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4"/>
               </div>
               
               <div className="space-y-2">
                 <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Categoria</Label>
                 <div className="relative">
                   <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none">
                     <option value="">Selecione</option>
                     {categories.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Conta</Label>
                 <div className="relative">
                   <select value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})} required className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none">
                     <option value="">Selecione</option>
                     {accounts.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                 </div>
               </div>
             </div>
             
             <div className="pt-6 flex flex-col md:flex-row gap-3 w-full mt-4 border-t border-[#ECEFF5] dark:border-white/5">
                <Button type="button" variant="outline" className="h-[56px] font-bold rounded-[16px] border-[#ECEFF5] dark:border-white/5 bg-transparent hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:text-[#6B7280]" onClick={() => { handleDelete(editingExpense.id, editingExpense.description); setIsReviewModalOpen(false); }}>Excluir Registro</Button>
                <div className="flex-1 flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1 h-[56px] rounded-[16px] font-bold bg-[#F6F7FB] dark:bg-[#12141C] text-[#111827] dark:text-white hover:bg-[#ECEFF5] dark:hover:bg-white/5" onClick={(e) => handleSaveExpense(e, true)}>Salvar Rascunho</Button>
                  <Button type="submit" className="flex-[2] h-[56px] rounded-[16px] font-black shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] bg-[#10b981] hover:bg-[#059669] text-white">Confirmar Categorização</Button>
                </div>
             </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PIN DIALOG */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="w-16 h-16 bg-[#6D4AFF]/10 rounded-full flex items-center justify-center mb-2">
              <Eye className="w-8 h-8 text-[#6D4AFF]" />
            </div>
            <div>
              <h2 className="text-[24px] font-bold text-[#111827] dark:text-white tracking-tight">Acesso Restrito</h2>
              <p className="text-[14px] text-[#6B7280] mt-2">
                Digite seu PIN de 4 dígitos para visualizar os valores.
              </p>
            </div>
            <form onSubmit={handlePinSubmit} className="w-full space-y-6 mt-4">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="text-center text-4xl tracking-[0.5em] font-mono rounded-[16px] h-[64px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 focus:border-[#6D4AFF]"
                autoFocus
              />
              <button 
                type="submit" 
                disabled={pinInput.length !== 4}
                className="w-full h-[56px] rounded-[16px] bg-[#6D4AFF] text-white font-bold text-[15px] shadow-[0_4px_14px_0_rgba(109,74,255,0.39)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Validar PIN
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
"""

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(new_file)
    
print("Rewrite complete")
