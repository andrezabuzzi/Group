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
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
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
  BarChart3 as BarChartIcon,
  Copy,
  Search,
  Calendar,
  LayoutDashboard,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Checkbox } from "../../components/ui/checkbox";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "../../lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
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
export default function DespesasFixas() {
  const { isPessoal, privacyMode, setPrivacyMode, config } = useAppContext();
  const { user } = useAuth();
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  /*  Filters */ const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState(
    new Date().getMonth().toString(),
  );
  const [filterYear, setFilterYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterPaymentMode, setFilterPaymentMode] = useState("Todos");
  const [filterAccount, setFilterAccount] = useState("Todas");
  /*  Form State */ const initialForm = {
    name: "",
    category: "",
    value: "",
    type: isPessoal ? "pessoal" : "empresa",
    dueDate: "",
    paymentMethod: "",
    account: "",
    notes: "",
    attachmentUrl: "",
    recurring: false,
    recurrenceType: "unica",
    recurrenceDay: "",
    recurrenceEndDate: "",
    autoGenerate: true,
    status: "pendente",
    paymentDate: "",
    paidValue: "",
    paidAccount: "",
    paidMethod: "",
  };
  const [formData, setFormData] = useState(initialForm);
  const togglePrivacy = () => {
    if (privacyMode) {
      setPinDialogOpen(true);
    } else {
      setPrivacyMode(true);
    }
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
      collection(db, "prod_fixed_expenses"),
      where("userId", "==", user.uid),
      where("type", "==", typeFilter),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setExpenses(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isPessoal, user]);
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      type: isPessoal ? "pessoal" : "empresa",
    }));
  }, [isPessoal]);
  const resetForm = () => {
    setEditingExpense(null);
    setFormData(initialForm);
  };
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const dataToSave: any = { ...formData, value: Number(formData.value) };
      dataToSave.userId = user.uid;
      dataToSave.updatedAt = new Date().toISOString();
      /*  Ensure required fields */ if (
        !dataToSave.name ||
        !dataToSave.value ||
        !dataToSave.dueDate ||
        !dataToSave.category
      ) {
        toast.error("Preencha os campos obrigatórios");
        return;
      }
      if (dataToSave.status === "pago") {
        dataToSave.paidValue = Number(dataToSave.paidValue) || dataToSave.value;
      } else {
        dataToSave.paidValue = null;
        dataToSave.paymentDate = null;
      }
      if (editingExpense) {
        await updateDoc(
          doc(db, "prod_fixed_expenses", editingExpense.id),
          dataToSave,
        );
        toast.success("Despesa alterada com sucesso");
      } else {
        dataToSave.createdAt = new Date().toISOString();
        if (
          dataToSave.recurring &&
          dataToSave.recurrenceType &&
          dataToSave.recurrenceType !== "unica"
        ) {
          const baseDate = new Date(dataToSave.dueDate + "T00:00:00");
          const promises = [];
          let occurrences = 1;
          if (dataToSave.recurrenceType === "semanal")
            occurrences = 12; /*  12 weeks */
          else if (dataToSave.recurrenceType === "mensal")
            occurrences = 12; /*  12 months */
          else if (dataToSave.recurrenceType === "semestral")
            occurrences = 4; /*  2 years */
          else if (dataToSave.recurrenceType === "anual") occurrences = 5;
          /*  5 years */ for (let i = 0; i < occurrences; i++) {
            let nextDate = baseDate;
            if (i > 0) {
              if (dataToSave.recurrenceType === "semanal")
                nextDate = addWeeks(baseDate, i);
              else if (dataToSave.recurrenceType === "mensal")
                nextDate = addMonths(baseDate, i);
              else if (dataToSave.recurrenceType === "semestral")
                nextDate = addMonths(baseDate, i * 6);
              else if (dataToSave.recurrenceType === "anual")
                nextDate = addYears(baseDate, i);
            }
            const recData = {
              ...dataToSave,
              dueDate: format(nextDate, "yyyy-MM-dd"),
            };
            promises.push(
              addDoc(collection(db, "prod_fixed_expenses"), recData),
            );
          }
          await Promise.all(promises);
          toast.success(`${occurrences} ocorrências geradas com sucesso`);
        } else {
          await addDoc(collection(db, "prod_fixed_expenses"), dataToSave);
          toast.success("Despesa adicionada com sucesso");
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (e) {
      toast.error("Erro ao salvar despesa");
      console.error(e);
    }
  };
  const handleDelete = async (item: any) => {
    if (confirm(`Excluir despesa "${item.name}"?`)) {
      try {
        await deleteDoc(doc(db, "prod_fixed_expenses", item.id));
        toast.success("Excluída com sucesso");
      } catch {
        toast.error("Erro ao excluir");
      }
    }
  };
  const handleDupe = async (item: any) => {
    if (!user) return;
    try {
      const newItem = { ...item };
      delete newItem.id;
      newItem.name = `${newItem.name} (Cópia)`;
      newItem.createdAt = new Date().toISOString();
      newItem.updatedAt = new Date().toISOString();
      newItem.status = "pendente";
      newItem.paidValue = null;
      newItem.paymentDate = null;
      await addDoc(collection(db, "prod_fixed_expenses"), newItem);
      toast.success("Despesa duplicada");
    } catch (e) {
      toast.error("Erro ao duplicar");
    }
  };
  const openPayModal = (item: any) => {
    setEditingExpense(item);
    setFormData({
      ...initialForm,
      id: item.id,
      paymentDate: new Date().toISOString().split("T")[0],
      paidValue: item.value.toString(),
      paidAccount: item.account || "",
      paidMethod: item.paymentMethod || "",
      notes: item.notes || "",
    } as any);
    setIsPayModalOpen(true);
  };
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    try {
      await updateDoc(doc(db, "prod_fixed_expenses", editingExpense.id), {
        status: "pago",
        paymentDate: formData.paymentDate,
        paidValue: Number(formData.paidValue),
        account: formData.paidAccount,
        paymentMethod: formData.paidMethod,
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Despesa marcada como paga");
      setIsPayModalOpen(false);
    } catch (e) {
      toast.error("Erro ao baixar pagamento");
    }
  };
  const calculateStatus = (item: any) => {
    if (item.status === "pago") return "pago";
    if (!item.dueDate) return "pendente";
    /*  Data check based on local timezone (stripping time) */ const due =
      new Date(item.dueDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = differenceInDays(due, today);
    if (diff < 0) return "atrasado";
    if (diff === 0) return "vence_hoje";
    if (diff <= 7) return "vence_em_breve";
    return "pendente";
  };
  const currentMonthDate = new Date(Number(filterYear), Number(filterMonth), 1);
  const prevMonthDate = new Date(
    Number(filterYear),
    Number(filterMonth) - 1,
    1,
  );
  /*  Compute stats based on the selected month */ const stats = useMemo(() => {
    let totalFixas = 0;
    let totalPago = 0;
    let totalPendente = 0;
    let totalAtrasado = 0;
    let totalFixasPrevMonth = 0;
    let proxVencimentos = 0;
    let maiorDespesa = { name: "-", value: 0 };
    expenses.forEach((item) => {
      /*  Calculate real status */ const cStatus = calculateStatus(item);
      item._computedStatus = cStatus;
      const due = item.dueDate
        ? new Date(item.dueDate + "T00:00:00")
        : new Date();
      if (isSameMonth(due, currentMonthDate)) {
        totalFixas += Number(item.value);
        if (item.value > maiorDespesa.value) {
          maiorDespesa = { name: item.name, value: item.value };
        }
        if (cStatus === "pago")
          totalPago += Number(item.paidValue || item.value);
        if (
          cStatus === "pendente" ||
          cStatus === "vence_hoje" ||
          cStatus === "vence_em_breve"
        )
          totalPendente += Number(item.value);
        if (cStatus === "atrasado") totalAtrasado += Number(item.value);
        if (cStatus === "vence_em_breve" || cStatus === "vence_hoje")
          proxVencimentos += 1;
      }
      if (isSameMonth(due, prevMonthDate)) {
        totalFixasPrevMonth += Number(item.value);
      }
    });
    const diffPrevMonth = totalFixasPrevMonth
      ? ((totalFixas - totalFixasPrevMonth) / totalFixasPrevMonth) * 100
      : 0;
    /*  Category Distribution (for pie) */ const categoryMap: any = {};
    /*  Monthly Evolution */ const monthlyMap: any = {};
    expenses.forEach((item) => {
      const d = item.dueDate
        ? new Date(item.dueDate + "T00:00:00")
        : new Date();
      if (isSameMonth(d, currentMonthDate)) {
        categoryMap[item.category] =
          (categoryMap[item.category] || 0) + Number(item.value);
      }
      const monRaw = format(d, "MMM");
      monthlyMap[monRaw] = (monthlyMap[monRaw] || 0) + Number(item.value);
    });
    const categoryData = Object.keys(categoryMap).map((k) => ({
      name: k,
      value: categoryMap[k],
    }));
    const monthlyData = Object.keys(monthlyMap)
      .slice(-6)
      .map((k) => ({ name: k, value: monthlyMap[k] }));
    return {
      totalFixas,
      totalPago,
      totalPendente,
      totalAtrasado,
      maiorDespesa,
      diffPrevMonth,
      proxVencimentos,
      categoryData,
      monthlyData,
    };
  }, [expenses, filterMonth, filterYear]);
  /*  Filters apply */ const filteredList = useMemo(() => {
    return expenses
      .filter((item) => {
        const cStatus = item._computedStatus;
        const d = item.dueDate
          ? new Date(item.dueDate + "T00:00:00")
          : new Date();
        if (!isSameMonth(d, currentMonthDate)) return false;
        if (filterCategory !== "Todas" && item.category !== filterCategory)
          return false;
        if (filterStatus !== "Todos" && cStatus !== filterStatus) return false;
        if (
          filterPaymentMode !== "Todos" &&
          item.paymentMethod !== filterPaymentMode
        )
          return false;
        if (filterAccount !== "Todas" && item.account !== filterAccount)
          return false;
        if (search && !item.name.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.dueDate || 0).getTime();
        const db = new Date(b.dueDate || 0).getTime();
        return da - db; /* sort ascending by date */
      });
  }, [
    expenses,
    search,
    filterCategory,
    filterStatus,
    filterPaymentMode,
    filterAccount,
    filterMonth,
    filterYear,
  ]);
  const statusColors: any = {
    pago: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400",
    pendente:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300",
    vence_hoje:
      "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400",
    vence_em_breve:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400",
    atrasado:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400",
  };
  const statusLabels: any = {
    pago: "Pago",
    pendente: "Pendente",
    vence_hoje: "Vence Hoje",
    vence_em_breve: "Vence em Breve",
    atrasado: "Atrasado",
  };
  const categories = config.categoriasFinanceiro;
  const paymentMethods = [
    "PIX",
    "Boleto",
    "Cartão de Crédito",
    "Cartão de Débito",
    "Transferência",
    "Débito Automático",
    "Dinheiro",
  ];
  const accounts = config.bancos;
  const alerts = useMemo(() => {
    return expenses.filter((e) => {
      const st = e._computedStatus;
      return (
        st === "vence_hoje" || st === "atrasado" || st === "vence_em_breve"
      );
    });
  }, [expenses]);
  /*  --- UI Derived Data --- */ const accountMap: any = {};
  expenses.forEach((item) => {
    const d = item.dueDate ? new Date(item.dueDate + "T00:00:00") : new Date();
    if (isSameMonth(d, currentMonthDate)) {
      accountMap[item.account || "Sem Conta"] =
        (accountMap[item.account || "Sem Conta"] || 0) + Number(item.value);
    }
  });
  const accountData = Object.keys(accountMap).map((k) => ({
    name: k,
    value: accountMap[k],
  }));
  /* Helper for formatting */ const formatValue = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);
  /* Timeline events (Mocked from alerts/history for visual purpose, matching existing data) */ const recentEvents =
    expenses
      .slice(0, 4)
      .map((e) => ({
        title: e.status === "pago" ? "Pagamento registrado" : "Despesa criada",
        desc: e.name,
        date: e.updatedAt || e.createdAt || new Date().toISOString(),
      }));
  /*  Insights */ const insights = [
    `A despesa com ${stats.maiorDespesa.name} representa maior custo fixo (${formatValue(stats.maiorDespesa.value)}).`,
    `O custo fixo teve ${stats.diffPrevMonth > 0 ? "aumento" : "queda"} de ${Math.abs(stats.diffPrevMonth).toFixed(1)}% neste mês.`,
    `Existem ${stats.proxVencimentos} despesas vencendo nos próximos 7 dias.`,
    `O total comprometido restante é ${formatValue(stats.totalPendente + stats.totalAtrasado)}.`,
  ];
  return (
    <>
      {" "}
      <div className="min-h-screen bg-[#F6F7FB] dark:bg-[#0F1117] text-[#111827] dark:text-white p-4 md:p-8 font-sans transition-colors duration-300">
        {" "}
        {/* HEADER */}{" "}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          {" "}
          <div>
            {" "}
            <div className="flex items-center gap-3">
              {" "}
              <h1 className="text-[36px] font-bold tracking-tight text-foreground leading-tight">
                Despesas Fixas
              </h1>{" "}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePrivacy}
                className="rounded-full text-muted-foreground hover:bg-[#6D4AFF]/10 hover:text-[#6D4AFF]"
              >
                {" "}
                {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}{" "}
              </Button>{" "}
            </div>{" "}
            <p className="text-[15px] font-[500] text-[#6B7280] dark:text-[#A8B0C0] mt-1">
              {" "}
              Gerencie todas as despesas recorrentes da empresa.{" "}
            </p>{" "}
          </div>{" "}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {" "}
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-[#6D4AFF] dark:bg-[#7B61FF] hover:bg-[#6D4AFF]/90 text-white shadow-lg shadow-[#6D4AFF]/20 active:scale-95 transition-all rounded-[18px] px-6 h-12 border-none font-bold flex-1 md:flex-none"
            >
              {" "}
              <Plus size={18} className="mr-2" strokeWidth={3} /> Nova Despesa
              Fixa{" "}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
        {/* KPIs */}{" "}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {" "}
          {[
            {
              title: "Total de Despesas",
              value: stats.totalFixas,
              icon: Wallet,
            },
            { title: "Pago no Mês", value: stats.totalPago, icon: CheckCircle },
            { title: "Pendente", value: stats.totalPendente, icon: Calendar },
            {
              title: "Atrasado",
              value: stats.totalAtrasado,
              icon: AlertCircle,
            },
            {
              title: "Maior Despesa",
              value: stats.maiorDespesa.value,
              icon: TrendingUp,
            },
            {
              title: "Vence em 7 dias",
              value: stats.proxVencimentos,
              icon: Clock,
              isCount: true,
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
                  : privacyMode
                    ? "••••"
                    : formatValue(kpi.value)}{" "}
              </span>{" "}
            </div>
          ))}{" "}
        </div>{" "}
        {/* MAIN COLUMN */}{" "}
        <div className="xl:col-span-3 space-y-8">
          {" "}
          {/* FILTERS */}{" "}
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
                  setFilterStatus("Todos");
                  setFilterPaymentMode("Todos");
                  setFilterAccount("Todas");
                }}
                className="text-[13px] font-bold text-[#6B7280] hover:text-[#6D4AFF] transition-colors"
              >
                {" "}
                Limpar filtros{" "}
              </button>{" "}
            </div>{" "}
            <div className="flex flex-wrap gap-3">
              {" "}
              {[
                {
                  label: "Mês",
                  val: filterMonth,
                  set: setFilterMonth,
                  options: Array.from({ length: 12 }).map((_, i) => ({
                    label: format(new Date(2024, i, 1), "MMM"),
                    value: i.toString(),
                  })),
                },
                {
                  label: "Ano",
                  val: filterYear,
                  set: setFilterYear,
                  options: ["2023", "2024", "2025", "2026"],
                },
                {
                  label: "Categoria",
                  val: filterCategory,
                  set: setFilterCategory,
                  options: ["Todas", ...categories],
                },
                {
                  label: "Status",
                  val: filterStatus,
                  set: setFilterStatus,
                  options: [
                    "Todos",
                    "pago",
                    "pendente",
                    "atrasado",
                    "vence_hoje",
                  ],
                },
                {
                  label: "Conta",
                  val: filterAccount,
                  set: setFilterAccount,
                  options: ["Todas", ...accounts],
                },
                {
                  label: "Pagamento",
                  val: filterPaymentMode,
                  set: setFilterPaymentMode,
                  options: ["Todos", ...paymentMethods],
                },
              ].map((f) => (
                <div key={f.label} className="relative group">
                  {" "}
                  <select
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    className="appearance-none h-[48px] pl-4 pr-10 bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 rounded-[18px] text-[14px] font-bold text-[#111827] dark:text-white outline-none focus:border-[#6D4AFF] transition-colors cursor-pointer"
                  >
                    {" "}
                    {f.options.map((opt: any) => (
                      <option
                        key={opt.value || opt}
                        value={opt.value !== undefined ? opt.value : opt}
                      >
                        {" "}
                        {f.label}: {opt.label || opt}{" "}
                      </option>
                    ))}{" "}
                  </select>{" "}
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                  />{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          {/* TABLE */}{" "}
          <div className="premium-card dark:bg-[#181B24] rounded-[24px] -[#ECEFF5] dark:border-white/5 -[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            {" "}
            <div className="overflow-x-auto">
              {" "}
              <table className="w-full text-left border-collapse">
<thead>
<tr className="bg-[#F6F7FB]/50 dark:bg-[#12141C]/50 border-b border-[#ECEFF5] dark:border-white/5">
<th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider">
                      Despesa
                    </th>
<th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider">
                      Categoria / Conta
                    </th>
<th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider">
                      Vencimento
                    </th>
<th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider">
                      Status
                    </th>
<th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider text-right">
                      Valor
                    </th>
<th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider text-center">
                      Ações
                    </th>
</tr>
</thead>
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
                            
                            <div className="font-bold text-[15px] text-[#111827] dark:text-white">
                              {item.name}
                            </div>
                            {item.notes && (
                              <div className="text-[13px] text-[#6B7280] mt-1 truncate max-w-[200px]">
                                {item.notes}
                              </div>
                            )}
                          </td>
<td className="p-5">
                            
                            <div className="font-bold text-[14px] text-[#111827] dark:text-[#A8B0C0]">
                              {item.category}
                            </div>
                            <div className="text-[12px] text-[#6B7280] mt-1">
                              {item.account || "-"}
                            </div>
                          </td>
<td className="p-5">
                            
                            <div className="font-bold text-[14px] text-[#111827] dark:text-white">
                              
                              {item.dueDate
                                ? format(
                                    new Date(item.dueDate + "T00:00:00"),
                                    "dd/MM/yyyy",
                                  )
                                : "-"}
                            </div>
                            <div className="text-[12px] text-[#6B7280] mt-1">
                              {item.paymentMethod || "-"}
                            </div>
                          </td>
<td className="p-5">
                            
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold ${statusColors[item._computedStatus]}`}
                            >
                              
                              {statusLabels[item._computedStatus]}
                            </span>
                          </td>
<td className="p-5 text-right">
                            
                            <div className="font-black text-[16px] text-[#111827] dark:text-white">
                              
                              {privacyMode
                                ? "R$ •••••"
                                : formatValue(item.value)}
                            </div>
                            {item.status === "pago" && item.paidValue && (
                              <div className="text-[12px] text-emerald-500 font-bold mt-1">
                                
                                Pago:
                                {privacyMode
                                  ? "••••"
                                  : formatValue(item.paidValue)}
                              </div>
                            )}
                          </td>
<td className="p-5 text-center">
                            
                            <DropdownMenu>
                              
                              <DropdownMenuTrigger className="p-2 rounded-[12px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors outline-none">
                                
                                <MoreVertical
                                  size={18}
                                  className="text-[#6B7280]"
                                />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-2"
                              >
                                
                                {item.status !== "pago" && (
                                  <DropdownMenuItem
                                    onClick={() => openPayModal(item)}
                                    className="rounded-[12px] focus:bg-[#6D4AFF]/10 focus:text-[#6D4AFF] cursor-pointer font-bold text-[14px] py-2.5"
                                  >
                                    
                                    <CheckCircle
                                      size={16}
                                      className="mr-2"
                                    />
                                    Registrar Pagamento
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingExpense(item);
                                    setFormData({ ...item });
                                    setIsModalOpen(true);
                                  }}
                                  className="rounded-[12px] focus:bg-[#F6F7FB] dark:focus:bg-[#12141C] cursor-pointer font-bold text-[14px] py-2.5"
                                >
                                  
                                  <Edit2 size={16} className="mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDupe(item)}
                                  className="rounded-[12px] focus:bg-[#F6F7FB] dark:focus:bg-[#12141C] cursor-pointer font-bold text-[14px] py-2.5"
                                >
                                  
                                  <Copy size={16} className="mr-2" />
                                  Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#ECEFF5] dark:bg-white/5 my-1" />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(item)}
                                  className="rounded-[12px] focus:bg-rose-500/10 focus:text-rose-500 text-rose-600 cursor-pointer font-bold text-[14px] py-2.5"
                                >
                                  
                                  <Trash2 size={16} className="mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
</motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
</table>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* SIDE COLUMN */}{" "}
        <div className="space-y-8">
          {" "}
          {/* TIMELINE */}{" "}
          <div className="premium-card dark:bg-[#181B24] rounded-[24px] p-6 -[#ECEFF5] dark:border-white/5 -[0_4px_20px_rgba(0,0,0,0.03)]">
            {" "}
            <h3 className="text-[15px] font-bold text-[#111827] dark:text-white mb-6">
              Últimas Atividades
            </h3>{" "}
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#ECEFF5] dark:before:via-white/10 before:to-transparent">
              {" "}
              {recentEvents.length > 0 ? (
                recentEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    {" "}
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white dark:border-[#181B24] bg-[#6D4AFF] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>{" "}
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-[16px] border border-[#ECEFF5] dark:border-white/5 bg-[#F6F7FB] dark:bg-[#12141C] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      {" "}
                      <div className="text-[11px] font-bold text-[#6D4AFF] mb-1">
                        {format(new Date(ev.date), "dd MMM, HH:mm", {
                          locale: ptBR,
                        })}
                      </div>{" "}
                      <div className="text-[13px] font-bold text-[#111827] dark:text-white">
                        {ev.title}
                      </div>{" "}
                      <div className="text-[12px] text-[#6B7280] mt-0.5 truncate">
                        {ev.desc}
                      </div>{" "}
                    </div>{" "}
                  </div>
                ))
              ) : (
                <div className="text-center text-[13px] text-[#6B7280] font-bold py-4">
                  Sem atividades recentes
                </div>
              )}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* KEEP EXISTING MODALS BELOW */}{" "}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {" "}
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          {" "}
          <DialogHeader className="mb-6">
            {" "}
            <DialogTitle className="text-[24px] font-bold text-[#111827] dark:text-white">
              {" "}
              {editingExpense
                ? "Editar Despesa Fixa"
                : "Nova Despesa Fixa"}{" "}
            </DialogTitle>{" "}
          </DialogHeader>{" "}
          <form onSubmit={handleSaveExpense} className="space-y-6">
            {" "}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {" "}
              <div className="space-y-2 md:col-span-2">
                {" "}
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Descrição
                </Label>{" "}
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Aluguel do Escritório"
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
                  Data do Vencimento
                </Label>{" "}
                <Input
                  required
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
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
                    ))}{" "}
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
                    ))}{" "}
                  </select>{" "}
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                  />{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-2 md:col-span-2 pt-2 border-t border-[#ECEFF5] dark:border-white/5 mt-2">
                {" "}
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider block mb-3">
                  Configurações de Pagamento
                </Label>{" "}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {" "}
                  <div className="space-y-2">
                    {" "}
                    <Label className="text-[11px] font-bold text-[#6B7280]">
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
                        className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none"
                      >
                        {" "}
                        <option value="">Selecione</option>{" "}
                        <option value="À vista">À vista</option>{" "}
                        <option value="Cartão">Cartão</option>{" "}
                        <option value="Boleto">Boleto</option>{" "}
                        <option value="PIX">PIX</option>{" "}
                        <option value="Transferência">
                          Transferência
                        </option>{" "}
                      </select>{" "}
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="space-y-2">
                    {" "}
                    <Label className="text-[11px] font-bold text-[#6B7280]">
                      Repetição da Despesa
                    </Label>{" "}
                    <div className="relative">
                      {" "}
                      <select
                        value={formData.recurrenceType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrenceType: e.target.value,
                            recurring: e.target.value !== "unica",
                          })
                        }
                        className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none"
                      >
                        {" "}
                        <option value="unica">Única (Não repete)</option>{" "}
                        <option value="semanal">Semanal</option>{" "}
                        <option value="mensal">Mensal</option>{" "}
                        <option value="semestral">Semestral</option>{" "}
                        <option value="anual">Anual</option>{" "}
                      </select>{" "}
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex justify-end gap-3 pt-6">
              {" "}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-[48px] px-6 rounded-[16px] font-bold text-[14px] text-[#6B7280] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] transition-colors"
              >
                Cancelar
              </button>{" "}
              <button
                type="submit"
                className="h-[48px] px-8 rounded-[16px] bg-[#6D4AFF] text-white font-bold text-[14px] shadow-[0_4px_14px_0_rgba(109,74,255,0.39)] hover:opacity-90 transition-opacity"
              >
                Salvar Despesa
              </button>{" "}
            </div>{" "}
          </form>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      {/* Pay Modal */}{" "}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        {" "}
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          {" "}
          <DialogHeader className="mb-6">
            {" "}
            <DialogTitle className="text-[24px] font-bold text-[#111827] dark:text-white flex items-center gap-2">
              {" "}
              <CheckCircle className="text-emerald-500" size={24} /> Registrar
              Pagamento{" "}
            </DialogTitle>{" "}
          </DialogHeader>{" "}
          <form onSubmit={handlePay} className="space-y-6">
            {" "}
            <div className="space-y-2">
              {" "}
              <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                Valor Pago (R$)
              </Label>{" "}
              <Input
                required
                type="number"
                step="0.01"
                value={formData.paidValue}
                onChange={(e) =>
                  setFormData({ ...formData, paidValue: e.target.value })
                }
                className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-emerald-500 px-4"
              />{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                Data do Pagamento
              </Label>{" "}
              <Input
                required
                type="date"
                value={formData.paymentDate}
                onChange={(e) =>
                  setFormData({ ...formData, paymentDate: e.target.value })
                }
                className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-emerald-500 px-4"
              />{" "}
            </div>{" "}
            <div className="flex justify-end gap-3 pt-4">
              {" "}
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="h-[48px] px-6 rounded-[16px] font-bold text-[14px] text-[#6B7280] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] transition-colors"
              >
                Cancelar
              </button>{" "}
              <button
                type="submit"
                className="h-[48px] px-8 rounded-[16px] bg-emerald-500 text-white font-bold text-[14px] shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:opacity-90 transition-opacity"
              >
                Confirmar
              </button>{" "}
            </div>{" "}
          </form>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      {/* Pin Modal */}{" "}
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
    </>
  );
}
