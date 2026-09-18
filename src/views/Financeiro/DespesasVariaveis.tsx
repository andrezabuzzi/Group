import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../contexts/AppContext";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "../../lib/utils";
import {
  format,
  isBefore,
  isAfter,
  isToday,
  addDays,
  differenceInDays,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  addWeeks,
  addMonths,
  addYears,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  Edit2,
  Clock,
  FileText,
  CheckCircle2,
  Plus,
  RefreshCcw,
  Paperclip,
  Download,
  MoreVertical,
  TrendingDown,
  TrendingUp,
  X,
  Filter,
  EyeOff,
  Trash2,
  History,
  Bell,
  Eye,
  DollarSign,
  Archive,
  Wallet,
  ArrowRight,
  ChevronRight,
  CheckCircle,
  ChevronDown,
  CreditCard,
  Copy,
  Search,
  Calendar,
  LayoutDashboard,
  AlertCircle,
  Mic,
  Camera,
  Keyboard,
  MessageSquare,
  ListTodo,
  FileDown,
  FileSpreadsheet,
  FileBarChart2,
  PieChart,
  BarChart2,
  Sparkles,
  Tag,
  Building2,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
export default function DespesasVariaveis() {
  const { isPessoal, privacyMode, setPrivacyMode, config } = useAppContext();
  const { user } = useAuth();
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"lista" | "pendentes">("lista");
  /*  Existing Filters + New Filters */ const [search, setSearch] =
    useState("");
  const [filterMonth, setFilterMonth] = useState(
    new Date().getMonth().toString(),
  );
  const [filterYear, setFilterYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [filterOrigin, setFilterOrigin] = useState("Todas");
  const [filterAccount, setFilterAccount] = useState("Todas");
  const [filterPaymentMode, setFilterPaymentMode] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterOrder, setFilterOrder] = useState("Mais recentes");
  const defaultExpense = {
    description: "",
    value: "",
    category: "",
    account: "",
    paymentMethod: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
    status: "categorizado",
    origin: "manual",
    type: isPessoal ? "pessoal" : "empresa",
  };
  const [formData, setFormData] = useState(defaultExpense);
  const categories = config.categoriasFinanceiro;
  const accounts = config.bancos;
  const paymentMethods = [
    "PIX",
    "Boleto",
    "Cartão de Crédito",
    "Cartão de Débito",
    "Transferência",
    "Dinheiro",
  ];
  const currentMonthDate = new Date(
    parseInt(filterYear),
    parseInt(filterMonth),
    1,
  );
  const prevMonthDate = new Date(
    parseInt(filterYear),
    parseInt(filterMonth) - 1,
    1,
  );
  const togglePrivacy = () => {
    if (privacyMode) setPinDialogOpen(true);
    else setPrivacyMode(true);
  };
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem("app_pin") || "1234";
    if (pinInput === savedPin) {
      setPrivacyMode(false);
      setPinDialogOpen(false);
      setPinInput("");
      toast.success("Visualização liberada");
    } else {
      toast.error("PIN Incorreto");
      setPinInput("");
    }
  };
  useEffect(() => {
    if (!user) return;
    const typeFilter = isPessoal ? "pessoal" : "empresa";
    const q = query(
      collection(db, "prod_variable_expenses"),
      where("userId", "==", user.uid),
      where("type", "==", typeFilter),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort(
        (a: any, b: any) =>
          new Date(b.date || b.createdAt).getTime() -
          new Date(a.date || a.createdAt).getTime(),
      );
      setExpenses(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, isPessoal]);
  const resetForm = () => {
    setFormData(defaultExpense);
    setEditingExpense(null);
  };
  const stats = useMemo(() => {
    let totalVar = 0;
    let listCount = 0;
    const catMap: Record<string, number> = {};
    let pendentesCount = 0;
    expenses.forEach((ev) => {
      if (ev.status === "pendente" || ev.status === "analise") {
        pendentesCount++;
      } else {
        const val = Number(ev.value) || 0;
        totalVar += val;
        listCount++;
        catMap[ev.category || "Outros"] =
          (catMap[ev.category || "Outros"] || 0) + val;
      }
    });
    const maiorCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0] || [
      "Nenhuma",
      0,
    ];
    const ticketMedio = listCount > 0 ? totalVar / listCount : 0;
    return {
      totalVar,
      listCount,
      maiorCat: { name: maiorCat[0], value: maiorCat[1] },
      ticketMedio,
      pendentesCount,
    };
  }, [expenses]);
  const filteredList = useMemo(() => {
    return expenses
      .filter((ev) => {
        if (ev.status === "pendente" || ev.status === "analise") return false;
        if (filterCategory !== "Todas" && ev.category !== filterCategory)
          return false;
        if (filterOrigin !== "Todas" && ev.origin !== filterOrigin)
          return false;
        if (filterAccount !== "Todas" && ev.account !== filterAccount)
          return false;
        if (
          filterPaymentMode !== "Todos" &&
          ev.paymentMethod !== filterPaymentMode
        )
          return false;
        if (filterStatus !== "Todos" && ev.status !== filterStatus)
          return false;
        if (
          search &&
          !ev.description.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (filterOrder === "Mais recentes")
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (filterOrder === "Mais antigas")
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (filterOrder === "Maior valor")
          return Number(b.value) - Number(a.value);
        if (filterOrder === "Menor valor")
          return Number(a.value) - Number(b.value);
        return 0;
      });
  }, [
    expenses,
    filterCategory,
    filterOrigin,
    filterAccount,
    filterPaymentMode,
    filterStatus,
    search,
    filterOrder,
  ]);
  const pendentes = useMemo(
    () =>
      expenses.filter(
        (ev) => ev.status === "pendente" || ev.status === "analise",
      ),
    [expenses],
  );
  const getOriginIcon = (origin: string) =>
    origin === "audio" ? (
      <Mic size={14} />
    ) : origin === "camera" ? (
      <Camera size={14} />
    ) : (
      <Keyboard size={14} />
    );
  const getOriginLabel = (origin: string) =>
    origin === "audio" ? "Áudio" : origin === "camera" ? "Foto" : "Manual";
  const statusColors: any = {
    categorizado: "bg-green-500/10 text-green-500",
    pendente: "bg-orange-500/10 text-orange-500",
    analise: "bg-blue-500/10 text-blue-500",
  };
  const statusLabels: any = {
    categorizado: "Categorizado",
    pendente: "Pendente",
    analise: "Em Análise",
  };
  const handleSaveExpense = async (e: any, isDraft = false) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingExpense) {
        await updateDoc(doc(db, "prod_variable_expenses", editingExpense.id), {
          ...formData,
        });
        toast.success("Despesa atualizada!");
      } else {
        await addDoc(collection(db, "prod_variable_expenses"), {
          ...formData,
          userId: user.uid,
          createdAt: new Date().toISOString(),
        });
        toast.success("Despesa adicionada!");
      }
      setIsManualModalOpen(false);
      resetForm();
    } catch (e) {
      toast.error("Erro ao salvar despesa.");
    }
  };
  const handleDupe = async (ev: any) => {
    if (!user) return;
    try {
      const { id, ...data } = ev;
      await addDoc(collection(db, "prod_variable_expenses"), {
        ...data,
        createdAt: new Date().toISOString(),
      });
      toast.success("Despesa duplicada!");
    } catch (e) {
      toast.error("Erro ao duplicar.");
    }
  };
  const handleDelete = async (id: string, description?: string) => {
    if (!confirm("Tem certeza?")) return;
    try {
      await deleteDoc(doc(db, "prod_variable_expenses", id));
      toast.success("Despesa excluída!");
    } catch (e) {
      toast.error("Erro ao excluir.");
    }
  };
  const openReview = (ev: any) => {
    setEditingExpense(ev);
    setFormData(ev);
    setIsReviewModalOpen(true);
  };
  const handleSimulateAudioSave = () => {};
  const handleSimulatePhotoSave = () => {};
  const handleDescriptionChange = (val: string) =>
    setFormData({ ...formData, description: val });
  const formatValue = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);
  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-8 w-full max-w-none mx-auto mb-20 md:mb-0">
      {" "}
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        {" "}
        <div>
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <h1 className="text-[36px] font-bold tracking-tight text-foreground leading-tight">
              Despesas Variáveis
            </h1>{" "}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePrivacy}
              className="rounded-full text-muted-foreground hover:bg-[#6D4AFF]/10 hover:text-[#6D4AFF]"
            >
              {" "}
              {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
            </Button>{" "}
          </div>{" "}
          <p className="text-[15px] font-[500] text-[#6B7280] dark:text-[#A8B0C0] mt-1">
            {" "}
            Registro de custos não recorrentes e compras pontuais.{" "}
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {" "}
          <Button
            onClick={() => {
              resetForm();
              setIsManualModalOpen(true);
            }}
            className="bg-[#6D4AFF] dark:bg-[#7B61FF] hover:bg-[#6D4AFF]/90 text-white shadow-lg shadow-[#6D4AFF]/20 active:scale-95 transition-all rounded-[18px] px-6 h-12 border-none font-bold flex-1 md:flex-none"
          >
            {" "}
            <Plus size={18} className="mr-2" strokeWidth={3} /> Nova Despesa
            Variável{" "}
          </Button>{" "}
        </div>{" "}
      </div>{" "}
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
        {" "}
        {[
          { title: "Total Variável", value: stats.totalVar, icon: Wallet },
          {
            title: "Maior Despesa",
            value: stats.maiorCat.value,
            icon: TrendingUp,
          },
          {
            title: "Qtd. Despesas",
            value: stats.listCount,
            icon: FileText,
            isCount: true,
          },
          {
            title: "Média por Despesa",
            value: stats.ticketMedio,
            icon: BarChart2,
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] rounded-[24px] p-5 flex flex-col justify-between shadow-[0_8px_30px_rgba(109,74,255,0.2)] hover:scale-[1.02] transition-transform duration-300"
          >
            {" "}
            <div className="flex justify-between items-start mb-4">
              {" "}
              <span className="text-[12px] font-[700] text-white/90 leading-tight uppercase tracking-wider">
                {kpi.title}
              </span>{" "}
              <div className="premium-card w-10 h-10 rounded-[14px] /20 text-white flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                {" "}
                <kpi.icon size={18} strokeWidth={2.5} />{" "}
              </div>{" "}
            </div>{" "}
            <span className="text-[20px] font-[900] text-white tracking-tight">
              {" "}
              {kpi.isCount
                ? kpi.value
                : formatCurrency(kpi.value, privacyMode)}
            </span>{" "}
          </div>
        ))}
      </div>{" "}
      {/* TABS */}
      <div className="flex items-center gap-8 border-b border-[#ECEFF5] dark:border-white/5 mb-8">
        {" "}
        <button
          onClick={() => setActiveTab("lista")}
          className={`pb-4 text-[15px] font-bold transition-all relative ${activeTab === "lista" ? "text-[#6D4AFF] dark:text-[#7B61FF]" : "text-[#6B7280] hover:text-[#111827] dark:hover:text-white"}`}
        >
          {" "}
          Lançamentos Concluídos{" "}
          {activeTab === "lista" && (
            <motion.div
              layoutId="dv-tab"
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#6D4AFF] dark:bg-[#7B61FF] rounded-t-full"
            />
          )}
        </button>{" "}
        <button
          onClick={() => setActiveTab("pendentes")}
          className={`pb-4 text-[15px] font-bold transition-all relative flex items-center gap-2 ${activeTab === "pendentes" ? "text-[#6D4AFF] dark:text-[#7B61FF]" : "text-[#6B7280] hover:text-[#111827] dark:hover:text-white"}`}
        >
          {" "}
          Pendentes de Categorização{" "}
          {stats.pendentesCount > 0 && (
            <span className="bg-[#A5ADBD] text-white text-[11px] px-2 py-0.5 rounded-full">
              {stats.pendentesCount}
            </span>
          )}
          {activeTab === "pendentes" && (
            <motion.div
              layoutId="dv-tab"
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#6D4AFF] dark:bg-[#7B61FF] rounded-t-full"
            />
          )}
        </button>{" "}
      </div>{" "}
      <AnimatePresence mode="wait">
        {activeTab === "lista" && (
          <motion.div
            key="lista"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {" "}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {" "}
              {/* MAIN COLUMN */}
              <div className="xl:col-span-3 space-y-8">
                {" "}
                {/* FILTERS */}
                <div className="premium-card dark:bg-[#181B24] rounded-[24px] p-6 -[#ECEFF5] dark:border-white/5 -[0_4px_20px_rgba(0,0,0,0.03)]">
                  {" "}
                  <div className="flex items-center justify-between mb-4">
                    {" "}
                    <h3 className="text-[15px] font-bold text-[#111827] dark:text-white flex items-center gap-2">
                      <Filter size={18} /> Filtros Ativos
                    </h3>{" "}
                    <button
                      onClick={() => {
                        setFilterCategory("Todas");
                        setFilterOrigin("Todas");
                        setFilterAccount("Todas");
                        setFilterPaymentMode("Todos");
                        setFilterStatus("Todos");
                        setFilterOrder("Mais recentes");
                      }}
                      className="text-[13px] font-bold text-[#6B7280] hover:text-[#6D4AFF] transition-colors"
                    >
                      {" "}
                      Limpar filtros{" "}
                    </button>{" "}
                  </div>{" "}
                  <div className="flex flex-wrap gap-3">
                    {" "}
                    <div className="relative">
                      {" "}
                      <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer"
                      >
                        {" "}
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i} value={i}>
                            {format(new Date(2024, i, 1), "MMMM", {
                              locale: ptBR,
                            })}
                          </option>
                        ))}
                      </select>{" "}
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                      />{" "}
                    </div>{" "}
                    <div className="relative">
                      {" "}
                      <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer"
                      >
                        {" "}
                        {[2024, 2025, 2026].map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>{" "}
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                      />{" "}
                    </div>{" "}
                    <div className="relative">
                      {" "}
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer"
                      >
                        {" "}
                        <option value="Todas">Todas Categorias</option>{" "}
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>{" "}
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                      />{" "}
                    </div>{" "}
                    <div className="relative">
                      {" "}
                      <select
                        value={filterAccount}
                        onChange={(e) => setFilterAccount(e.target.value)}
                        className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer"
                      >
                        {" "}
                        <option value="Todas">Todas Contas</option>{" "}
                        {accounts.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>{" "}
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                      />{" "}
                    </div>{" "}
                    <div className="relative">
                      {" "}
                      <select
                        value={filterOrigin}
                        onChange={(e) => setFilterOrigin(e.target.value)}
                        className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer"
                      >
                        {" "}
                        <option value="Todas">Todas Origens</option>{" "}
                        <option value="manual">Manual</option>{" "}
                        <option value="audio">Áudio</option>{" "}
                        <option value="photo">Foto</option>{" "}
                      </select>{" "}
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                      />{" "}
                    </div>{" "}
                    <div className="relative">
                      {" "}
                      <select
                        value={filterPaymentMode}
                        onChange={(e) => setFilterPaymentMode(e.target.value)}
                        className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer"
                      >
                        {" "}
                        <option value="Todos">Pagamento (Todos)</option>{" "}
                        {paymentMethods.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>{" "}
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                      />{" "}
                    </div>{" "}
                    <div className="relative">
                      {" "}
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer"
                      >
                        {" "}
                        <option value="Todos">Status (Todos)</option>{" "}
                        <option value="categorizado">OK</option>{" "}
                        <option value="pendente">Categorização</option>{" "}
                        <option value="revisado">Revisar</option>{" "}
                      </select>{" "}
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                      />{" "}
                    </div>{" "}
                    <div className="relative">
                      {" "}
                      <select
                        value={filterOrder}
                        onChange={(e) => setFilterOrder(e.target.value)}
                        className="appearance-none h-[48px] pl-4 pr-10 rounded-[18px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold text-[#111827] dark:text-white focus:border-[#6D4AFF] outline-none cursor-pointer"
                      >
                        {" "}
                        <option value="Mais recentes">
                          Mais recentes
                        </option>{" "}
                        <option value="Maior valor">Maior valor</option>{" "}
                        <option value="Menor valor">Menor valor</option>{" "}
                      </select>{" "}
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                {/* TABLE */}
                <div className="premium-card dark:bg-[#181B24] rounded-[24px] -[#ECEFF5] dark:border-white/5 -[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                  {" "}
                  <div className="overflow-x-auto">
                    {" "}
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#ECEFF5] dark:border-white/5 bg-[#F6F7FB]/50 dark:bg-[#12141C]/50 backdrop-blur-md">
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                            Descrição
                          </th>
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                            Categoria / Conta
                          </th>
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                            Data / Origem
                          </th>
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                            Status
                          </th>
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider text-right">
                            Valor
                          </th>
                          <th className="p-5 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider w-[80px]"></th></tr></thead>
                      <tbody>
                        <AnimatePresence>
                          {loading ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="p-8 text-center text-[#6B7280] font-bold"
                              >
                                Carregando...
                              </td>
                            </tr>
                          ) : filteredList.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="p-8 text-center text-[#6B7280] font-bold"
                              >
                                Nenhuma despesa encontrada.
                              </td>
                            </tr>
                          ) : (
                            filteredList.map((item, i) => (
                              <motion.tr
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: i * 0.02 }}
                                key={item.id}
                                className="border-b border-[#ECEFF5] dark:border-white/5 hover:bg-[#F6F7FB]/50 dark:hover:bg-[#12141C]/50 transition-colors group"
                              >
                                <td className="p-5">
                                  {" "}
                                  <div className="font-bold text-[15px] text-[#111827] dark:text-white">
                                    {item.description}
                                  </div>{" "}
                                  {item.notes && (
                                    <div className="text-[13px] text-[#6B7280] mt-1 truncate max-w-[200px]">
                                      {item.notes}
                                    </div>
                                  )}
                                </td>
                                <td className="p-5">
                                  {" "}
                                  <div className="font-bold text-[14px] text-[#111827] dark:text-[#A8B0C0]">
                                    {item.category || "-"}
                                  </div>{" "}
                                  <div className="text-[12px] text-[#6B7280] mt-1">
                                    {item.account || "-"}
                                  </div>{" "}
                                </td>
                                <td className="p-5">
                                  {" "}
                                  <div className="font-bold text-[14px] text-[#111827] dark:text-white">
                                    {" "}
                                    {item.date
                                      ? format(
                                          new Date(item.date + "T00:00:00"),
                                          "dd/MM/yyyy",
                                        )
                                      : "-"}
                                  </div>{" "}
                                  <div className="text-[12px] text-[#6B7280] mt-1 flex items-center gap-1">
                                    {" "}
                                    {getOriginIcon(item.origin)}
                                    {getOriginLabel(item.origin)}
                                  </div>{" "}
                                </td>
                                <td className="p-5">
                                  {" "}
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold ${statusColors[item.status || "categorizado"]}`}
                                  >
                                    {" "}
                                    {
                                      statusLabels[
                                        item.status || "categorizado"
                                      ]
                                    }
                                  </span>{" "}
                                </td>
                                <td className="p-5 text-right">
                                  {" "}
                                  <div className="font-black text-[16px] text-[#111827] dark:text-white">
                                    {" "}
                                    {privacyMode
                                      ? "R$ •••••"
                                      : formatValue(item.value)}
                                  </div>{" "}
                                  <div className="text-[12px] text-[#6B7280] mt-1">
                                    {item.paymentMethod || "-"}
                                  </div>{" "}
                                </td>
                                <td className="p-5 text-right">
                                  {" "}
                                  <DropdownMenu>
                                    {" "}
                                    <DropdownMenuTrigger
                                      render={
                                        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#6B7280] transition-colors">
                                          {" "}
                                          <MoreVertical size={18} />{" "}
                                        </button>
                                      }
                                    />{" "}
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-[180px] rounded-[16px] border-[#ECEFF5] dark:border-white/5 bg-white/90 dark:bg-[#181B24]/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-2"
                                    >
                                      {" "}
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditingExpense(item);
                                          setFormData(item);
                                          setIsManualModalOpen(true);
                                        }}
                                        className="rounded-[12px] font-bold text-[13px] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] hover:text-[#6D4AFF] cursor-pointer"
                                      >
                                        <Edit2 size={14} className="mr-2" />{" "}
                                        Editar
                                      </DropdownMenuItem>{" "}
                                      <DropdownMenuItem
                                        onClick={() => handleDupe(item)}
                                        className="rounded-[12px] font-bold text-[13px] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] hover:text-[#6D4AFF] cursor-pointer"
                                      >
                                        <Copy size={14} className="mr-2" />{" "}
                                        Duplicar
                                      </DropdownMenuItem>{" "}
                                      <DropdownMenuSeparator className="bg-[#ECEFF5] dark:bg-white/5 my-1" />{" "}
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDelete(
                                            item.id,
                                            item.description,
                                          )
                                        }
                                        className="rounded-[12px] font-bold text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                                      >
                                        <Trash2 size={14} className="mr-2" />{" "}
                                        Excluir
                                      </DropdownMenuItem>{" "}
                                    </DropdownMenuContent>{" "}
                                  </DropdownMenu>{" "}
                                </td></motion.tr>
                            ))
                          )}
                        </AnimatePresence></tbody></table>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              {/* SIDE COLUMN */}
              <div className="space-y-8">
                {" "}
                {/* INSIGHTS */}
                <div className="premium-card dark:bg-[#181B24] rounded-[24px] p-6 -[#ECEFF5] dark:border-white/5 -[0_4px_20px_rgba(0,0,0,0.03)]">
                  {" "}
                  <h3 className="text-[15px] font-bold text-[#111827] dark:text-white mb-6 flex items-center gap-2">
                    {" "}
                    <Sparkles size={18} className="text-[#6D4AFF]" /> Insights
                    Inteligentes{" "}
                  </h3>{" "}
                  <div className="space-y-4">
                    {" "}
                    {stats.maiorCat.name !== "-" && (
                      <div className="p-4 rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5">
                        {" "}
                        <p className="text-[13px] font-bold text-[#111827] dark:text-white leading-relaxed">
                          {" "}
                          A categoria{" "}
                          <span className="text-[#6D4AFF]">
                            {stats.maiorCat.name}
                          </span>{" "}
                          representa a maior parte dos gastos variáveis este
                          mês.{" "}
                        </p>{" "}
                      </div>
                    )}
                    {stats.pendentesCount > 0 && (
                      <div className="p-4 rounded-[16px] bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#b45309] dark:text-[#fbbf24]">
                        {" "}
                        <p className="text-[13px] font-bold leading-relaxed">
                          {" "}
                          Existem {stats.pendentesCount} lançamentos aguardando
                          categorização na aba Pendentes.{" "}
                        </p>{" "}
                      </div>
                    )}
                    <div className="p-4 rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5">
                      {" "}
                      <p className="text-[13px] font-bold text-[#111827] dark:text-white leading-relaxed">
                        {" "}
                        O ticket médio está em{" "}
                        <span className="text-[#6D4AFF]">
                          {privacyMode
                            ? "••••"
                            : formatValue(stats.ticketMedio)}
                        </span>{" "}
                        por lançamento.{" "}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                {/* ÚLTIMOS LANÇAMENTOS (Mini) */}
                <div className="premium-card dark:bg-[#181B24] rounded-[24px] p-6 -[#ECEFF5] dark:border-white/5 -[0_4px_20px_rgba(0,0,0,0.03)]">
                  {" "}
                  <h3 className="text-[15px] font-bold text-[#111827] dark:text-white mb-4">
                    Últimos Registros
                  </h3>{" "}
                  <div className="space-y-4">
                    {" "}
                    {filteredList.slice(0, 5).map((ev: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        {" "}
                        <div>
                          {" "}
                          <div className="text-[13px] font-bold text-[#111827] dark:text-white">
                            {ev.description}
                          </div>{" "}
                          <div className="text-[11px] text-[#6B7280]">
                            {ev.category || "Sem categoria"}
                          </div>{" "}
                        </div>{" "}
                        <div className="text-[13px] font-black text-[#111827] dark:text-white">
                          {" "}
                          {privacyMode ? "••••" : formatValue(ev.value)}
                        </div>{" "}
                      </div>
                    ))}
                    {filteredList.length === 0 && (
                      <div className="text-[13px] text-[#6B7280] font-bold">
                        Sem registros recentes
                      </div>
                    )}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </motion.div>
        )}
        {/* PENDENTES TAB CONTENT */}
        {activeTab === "pendentes" && (
          <motion.div
            key="pendentes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {" "}
            {pendentes.length === 0 ? (
              <div className="premium-card dark:bg-[#181B24] rounded-[24px] -[#ECEFF5] dark:border-white/5 p-12 flex flex-col items-center justify-center text-center">
                {" "}
                <div className="w-20 h-20 bg-[#6D4AFF]/10 text-[#6D4AFF] rounded-full flex items-center justify-center mb-4">
                  {" "}
                  <CheckCircle2 size={40} />{" "}
                </div>{" "}
                <h3 className="text-[20px] font-bold text-[#111827] dark:text-white mb-2">
                  Tudo em dia!
                </h3>{" "}
                <p className="text-[14px] text-[#6B7280] max-w-[300px]">
                  Você não tem lançamentos aguardando revisão ou categorização.
                </p>{" "}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {" "}
                {pendentes.map((item, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={item.id}
                    className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#f59e0b]/20 dark:border-[#f59e0b]/10 shadow-[0_8px_30px_rgba(245,158,11,0.05)] flex flex-col justify-between"
                  >
                    {" "}
                    <div>
                      {" "}
                      <div className="flex items-center justify-between mb-4">
                        {" "}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#f59e0b]/10 text-[#f59e0b]">
                          {" "}
                          {getOriginIcon(item.origin)} Pendente{" "}
                        </span>{" "}
                        <div className="text-[12px] font-bold text-[#6B7280]">
                          {" "}
                          {format(new Date(item.date + "T00:00:00"), "dd MMM", {
                            locale: ptBR,
                          })}
                        </div>{" "}
                      </div>{" "}
                      <div className="mb-4">
                        {" "}
                        <div className="text-[16px] font-bold text-[#111827] dark:text-white leading-tight mb-1">
                          {item.description}
                        </div>{" "}
                        <div className="text-[24px] font-black text-[#111827] dark:text-white">
                          {privacyMode ? "R$ •••••" : formatValue(item.value)}
                        </div>{" "}
                      </div>{" "}
                      {item.transcription && (
                        <div className="bg-[#F6F7FB] dark:bg-[#12141C] p-3 rounded-[12px] text-[12px] text-[#6B7280] italic mb-4">
                          {" "}
                          "{item.transcription}"{" "}
                        </div>
                      )}
                    </div>{" "}
                    <button
                      onClick={() => openReview(item)}
                      className="w-full h-[48px] rounded-[16px] bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-[14px] transition-colors shadow-[0_4px_14px_0_rgba(245,158,11,0.3)]"
                    >
                      {" "}
                      Categorizar agora{" "}
                    </button>{" "}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>{" "}
      {/* KEEP MODALS */} {/* MANUAL ENTRY MODAL */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        {" "}
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          {" "}
          <DialogHeader className="mb-6">
            {" "}
            <DialogTitle className="text-[24px] font-bold text-[#111827] dark:text-white">
              {" "}
              {editingExpense ? "Editar Despesa" : "Novo Gasto Variável"}
            </DialogTitle>{" "}
          </DialogHeader>{" "}
          <form
            onSubmit={(e) => handleSaveExpense(e, false)}
            className="space-y-8"
          >
            {" "}
            {/* Bloco 1 */}
            <div className="space-y-4">
              {" "}
              <h4 className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#ECEFF5] dark:border-white/5 pb-2">
                Informações Principais
              </h4>{" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {" "}
                <div className="space-y-2 md:col-span-2">
                  {" "}
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Descrição do Gasto
                  </Label>{" "}
                  <Input
                    required
                    value={formData.description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Ex: Almoço com cliente, Uber, etc."
                    className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4"
                  />{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Valor (R$)
                  </Label>{" "}
                  <Input
                    required
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    placeholder="0,00"
                    className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4"
                  />{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Categoria
                  </Label>{" "}
                  <div className="relative">
                    {" "}
                    <select
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none"
                    >
                      {" "}
                      <option value="">Selecione</option>{" "}
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>{" "}
                    <ChevronDown
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                    />{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Bloco 2 */}
            <div className="space-y-4">
              {" "}
              <h4 className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#ECEFF5] dark:border-white/5 pb-2">
                Detalhes Financeiros
              </h4>{" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {" "}
                <div className="space-y-2">
                  {" "}
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Conta / Carteira
                  </Label>{" "}
                  <div className="relative">
                    {" "}
                    <select
                      value={formData.account}
                      onChange={(e) =>
                        setFormData({ ...formData, account: e.target.value })
                      }
                      className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none"
                    >
                      {" "}
                      <option value="">Selecione</option>{" "}
                      {accounts.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>{" "}
                    <ChevronDown
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Forma de Pagamento
                  </Label>{" "}
                  <div className="relative">
                    {" "}
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none"
                    >
                      {" "}
                      <option value="">Selecione</option>{" "}
                      {paymentMethods.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>{" "}
                    <ChevronDown
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Data
                  </Label>{" "}
                  <Input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4"
                  />{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Empresa / Contexto
                  </Label>{" "}
                  <div className="relative">
                    {" "}
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as "pessoal" | "empresa",
                        })
                      }
                      className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none"
                    >
                      {" "}
                      <option value="pessoal">Pessoal</option>{" "}
                      <option value="empresa">Empresa</option>{" "}
                    </select>{" "}
                    <ChevronDown
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                    />{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Bloco 3 */}
            <div className="space-y-4">
              {" "}
              <h4 className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#ECEFF5] dark:border-white/5 pb-2">
                Adicionais
              </h4>{" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {" "}
                <div className="space-y-2 md:col-span-2">
                  {" "}
                  <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Observações
                  </Label>{" "}
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Informações extras sobre o gasto..."
                    className="min-h-[80px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] p-4 resize-none"
                  />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex justify-end gap-3 pt-6 border-t border-[#ECEFF5] dark:border-white/5">
              {" "}
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="h-[48px] px-6 rounded-[16px] font-bold text-[14px] text-[#6B7280] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] transition-colors"
              >
                Cancelar
              </button>{" "}
              <button
                type="submit"
                className="h-[48px] px-8 rounded-[16px] bg-[#6D4AFF] text-white font-bold text-[14px] shadow-[0_4px_14px_0_rgba(109,74,255,0.39)] hover:opacity-90 transition-opacity"
              >
                Salvar Gasto
              </button>{" "}
            </div>{" "}
          </form>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      {/* AUDIO ENTRY */}
      <Dialog open={isAudioModalOpen} onOpenChange={setIsAudioModalOpen}>
        {" "}
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 p-8 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          {" "}
          <div className="w-20 h-20 bg-[#6D4AFF]/10 text-[#6D4AFF] rounded-full flex items-center justify-center animate-pulse mb-4 ring-8 ring-[#6D4AFF]/5">
            {" "}
            <Mic size={36} strokeWidth={2.5} />{" "}
          </div>{" "}
          <DialogTitle className="text-[20px] font-black text-[#111827] dark:text-white">
            Fale seu gasto
          </DialogTitle>{" "}
          <p className="text-[14px] font-bold text-[#6B7280] mt-2 max-w-[250px]">
            "Comprei 100 reais de tecido na loja São Paulo..."
          </p>{" "}
          <div className="mt-8 text-[32px] font-mono font-black text-[#111827] dark:text-white">
            00:04
          </div>{" "}
          <div className="flex gap-4 mt-8 w-full">
            {" "}
            <Button
              onClick={() => setIsAudioModalOpen(false)}
              variant="outline"
              className="flex-1 h-[56px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 font-bold text-[#6B7280] hover:text-[#111827] dark:hover:text-white"
            >
              <X size={20} />
            </Button>{" "}
            <Button
              onClick={handleSimulateAudioSave}
              className="premium-btn-primary flex-[2] h-[56px] rounded-[16px] font-black bg-[#6D4AFF] hover:bg-[#5b3ce0] text-white shadow-[0_4px_14px_0_rgba(109,74,255,0.39)]"
            >
              <CheckCircle size={20} className="mr-2" /> Processar Áudio
            </Button>{" "}
          </div>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      {/* PHOTO ENTRY */}
      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        {" "}
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 p-8 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          {" "}
          <DialogTitle className="text-[20px] font-black text-[#111827] dark:text-white mb-4">
            Enviar Cupom/Nota
          </DialogTitle>{" "}
          <div className="premium-card w-full aspect-[3/4] bg-[#F6F7FB] dark:bg-[#12141C] rounded-[20px] -2 -dashed -[#ECEFF5] dark:border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[#ECEFF5]/50 dark:hover:/5 transition-colors">
            {" "}
            <Camera size={40} className="text-[#6B7280] opacity-50" />{" "}
            <span className="font-bold text-[14px] text-[#111827] dark:text-white">
              Tocar para abrir câmera
            </span>{" "}
          </div>{" "}
          <Button
            onClick={handleSimulatePhotoSave}
            className="premium-btn-primary w-full h-[56px] rounded-[16px] mt-6 font-black bg-[#6D4AFF] hover:bg-[#059669] text-white shadow-[0_4px_14px_0_rgba(16,185,129,0.39)]"
          >
            Analisar Foto
          </Button>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      {/* REVIEW PENDING MODAL */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        {" "}
        <DialogContent className="sm:max-w-3xl rounded-[24px] bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          {" "}
          <DialogHeader className="mb-6 flex flex-row items-center gap-4">
            {" "}
            <div className="w-12 h-12 bg-[#f59e0b] text-white rounded-full flex items-center justify-center shrink-0 shadow-[0_4px_14px_0_rgba(245,158,11,0.3)]">
              {" "}
              {editingExpense?.origin === "audio" ? (
                <Mic size={24} />
              ) : editingExpense?.origin === "photo" ? (
                <Camera size={24} />
              ) : (
                <Keyboard size={24} />
              )}
            </div>{" "}
            <div>
              {" "}
              <DialogTitle className="text-[24px] font-bold text-[#111827] dark:text-white">
                Completar Lançamento
              </DialogTitle>{" "}
              <p className="text-[13px] font-bold text-[#f59e0b] uppercase tracking-wider mt-1">
                Origem: {getOriginLabel(editingExpense?.origin)}
              </p>{" "}
            </div>{" "}
          </DialogHeader>{" "}
          <form
            className="space-y-6"
            onSubmit={(e) => handleSaveExpense(e, false)}
          >
            {" "}
            {editingExpense?.transcription && (
              <div className="bg-[#F6F7FB] dark:bg-[#12141C] p-4 rounded-[16px] border border-[#ECEFF5] dark:border-white/5 mb-6">
                {" "}
                <div className="text-[11px] uppercase font-bold text-[#6B7280] tracking-wider mb-2 flex items-center gap-1">
                  <MessageSquare size={14} /> Transcrição Original
                </div>{" "}
                <span className="text-[14px] font-bold text-[#111827] dark:text-white italic">
                  "{editingExpense.transcription}"
                </span>{" "}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {" "}
              <div className="space-y-2 md:col-span-2">
                {" "}
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Valor do Gasto (R$)
                </Label>{" "}
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  className="h-[56px] text-[20px] font-black rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 focus:border-[#6D4AFF] px-4"
                  placeholder="0,00"
                />{" "}
              </div>{" "}
              <div className="space-y-2 md:col-span-2">
                {" "}
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Descrição
                </Label>{" "}
                <Input
                  required
                  value={formData.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4"
                />{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Categoria
                </Label>{" "}
                <div className="relative">
                  {" "}
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                    className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none"
                  >
                    {" "}
                    <option value="">Selecione</option>{" "}
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>{" "}
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                  />{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Conta
                </Label>{" "}
                <div className="relative">
                  {" "}
                  <select
                    value={formData.account}
                    onChange={(e) =>
                      setFormData({ ...formData, account: e.target.value })
                    }
                    required
                    className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none"
                  >
                    {" "}
                    <option value="">Selecione</option>{" "}
                    {accounts.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>{" "}
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                  />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="pt-6 flex flex-col md:flex-row gap-3 w-full mt-4 border-t border-[#ECEFF5] dark:border-white/5">
              {" "}
              <Button
                type="button"
                variant="outline"
                className="h-[56px] font-bold rounded-[16px] border-[#ECEFF5] dark:border-white/5 bg-transparent hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:text-[#6B7280]"
                onClick={() => {
                  handleDelete(editingExpense.id, editingExpense.description);
                  setIsReviewModalOpen(false);
                }}
              >
                Excluir Registro
              </Button>{" "}
              <div className="flex-1 flex gap-3">
                {" "}
                <Button
                  type="button"
                  variant="secondary"
                  className="premium-btn-primary flex-1 h-[56px] rounded-[16px] font-bold bg-[#F6F7FB] dark:bg-[#12141C] text-[#111827] dark:text-white hover:bg-[#ECEFF5] dark:hover:bg-white/5"
                  onClick={(e) => handleSaveExpense(e, true)}
                >
                  Salvar Rascunho
                </Button>{" "}
                <Button
                  type="submit"
                  className="premium-btn-primary flex-[2] h-[56px] rounded-[16px] font-black shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] bg-[#6D4AFF] hover:bg-[#059669] text-white"
                >
                  Confirmar Categorização
                </Button>{" "}
              </div>{" "}
            </div>{" "}
          </form>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      {/* PIN DIALOG */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        {" "}
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          {" "}
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            {" "}
            <div className="w-16 h-16 bg-[#6D4AFF]/10 rounded-full flex items-center justify-center mb-2">
              {" "}
              <Eye className="w-8 h-8 text-[#6D4AFF]" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h2 className="text-[28px] font-semibold tracking-tight text-foreground">
                Acesso Restrito
              </h2>{" "}
              <p className="text-[14px] text-[#6B7280] mt-2">
                {" "}
                Digite seu PIN de 4 dígitos para visualizar os valores.{" "}
              </p>{" "}
            </div>{" "}
            <form onSubmit={handlePinSubmit} className="w-full space-y-6 mt-4">
              {" "}
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="text-center text-4xl tracking-[0.5em] font-mono rounded-[16px] h-[64px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 focus:border-[#6D4AFF]"
                autoFocus
              />{" "}
              <button
                type="submit"
                disabled={pinInput.length !== 4}
                className="w-full h-[56px] rounded-[16px] bg-[#6D4AFF] text-white font-bold text-[15px] shadow-[0_4px_14px_0_rgba(109,74,255,0.39)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {" "}
                Validar PIN{" "}
              </button>{" "}
            </form>{" "}
          </div>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
    </div>
  );
}
