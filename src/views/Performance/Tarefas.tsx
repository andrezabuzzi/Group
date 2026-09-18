import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Calendar,
  User,
  Briefcase,
  Filter,
  ListTodo,
  ChartNoAxesCombined,
  LayoutGrid,
  ListChecks,
  LoaderCircle,
  CircleCheckBig,
  CircleAlert,
  Flame,
  CalendarClock,
  CalendarDays,
  MoreVertical,
  Trash2,
  Edit2,
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Paperclip,
  MessageSquare,
  CheckSquare,
  X,
  Lightbulb,
  FileText,
  ChevronLeft,
  ChevronDown,
  Check,
  ChevronUp,
  Expand,
  Eye,
} from "lucide-react";
import {
  format,
  isToday,
  isThisWeek,
  isPast,
  parseISO,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { cn } from "../../lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
type TaskStatus =
  "a_fazer" | "em_andamento" | "aguardando" | "concluido" | "cancelado";
type TaskPriority = "urgente" | "alta" | "media" | "baixa";
interface Task {
  id: string;
  title: string;
  description: string;
  companyId: string | null;
  companyName: string | null;
  salesChannel: string | null;
  responsible: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string | null;
  dueDate: string | null;
  reminderEnabled: boolean;
  reminderType: string | null;
  progress: number;
  labels: string[];
  attachments: string[];
  commentsCount: number;
  subtasksCount?: number;
  createdAt: any;
  updatedAt: any;
}
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: any;
}
interface Company {
  id: string;
  tradeName: string;
}
interface SalesChannel {
  id: string;
  accountName: string;
}
const STATUS_CONFIG = {
  a_fazer: {
    label: "A Fazer",
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800",
    icon: Clock,
  },
  em_andamento: {
    label: "Em Andamento",
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: PlayCircle,
  },
  aguardando: {
    label: "Aguardando",
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    icon: AlertCircle,
  },
  concluido: {
    label: "Concluído",
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: CheckCircle2,
  },
  cancelado: {
    label: "Cancelado",
    color: "text-red-500",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: XCircle,
  },
};
const PRIORITY_CONFIG = {
  urgente: {
    label: "Urgente",
    color: "text-red-500",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  alta: {
    label: "Alta",
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  media: {
    label: "Média",
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  baixa: {
    label: "Baixa",
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
};
const PREDEFINED_LABELS = [
  "Marketplace",
  "Produção",
  "Financeiro",
  "Urgente",
  "Produto Novo",
  "Fornecedor",
  "ADS",
  "Estoque",
  "Shopee",
  "Mercado Livre",
  "TikTok",
  "Shein",
  "Marketing",
  "Conteúdo",
  "Foto",
  "Vídeo",
  "Lançamento",
  "Meta",
  "Compras",
];
export default function Tarefas() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "dashboard">("list");
  /*  Filters */ const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("todas");
  const [filterChannel, setFilterChannel] = useState<string>("todos");
  const [filterResponsible, setFilterResponsible] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterPriority, setFilterPriority] = useState<string>("todas");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<string>("recentes");
  /*  Modals */ const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  /*  Selection */ const [selectedTasksIds, setSelectedTasksIds] = useState<
    Set<string>
  >(new Set());
  /*  Task Form State */ const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [salesChannel, setSalesChannel] = useState("");
  const [responsible, setResponsible] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("media");
  const [status, setStatus] = useState<TaskStatus>("a_fazer");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  /*  Pagination */ const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const qTasks = query(
      collection(db, "prod_tasks"),
      where("userId", "==", user.uid),
    );
    const uTasks = onSnapshot(qTasks, (snap) => {
      setTasks(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Task));
    });
    const qCompanies = query(
      collection(db, "prod_companies"),
      where("userId", "==", user.uid),
    );
    const uCompanies = onSnapshot(qCompanies, (snap) => {
      setCompanies(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Company),
      );
    });
    const qChannels = query(
      collection(db, "prod_sales_channels"),
      where("userId", "==", user.uid),
    );
    const uChannels = onSnapshot(qChannels, (snap) => {
      setChannels(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as SalesChannel),
      );
    });
    return () => {
      uTasks();
      uCompanies();
      uChannels();
    };
  }, []);
  const loadSubtasks = async (taskId: string) => {
    const q = query(
      collection(db, `prod_tasks/${taskId}/subtasks`),
      orderBy("createdAt", "asc"),
    );
    const snap = await getDocs(q);
    setSubtasks(
      snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Subtask),
    );
  };
  const handleOpenNewTask = () => {
    setSelectedTask(null);
    setTitle("");
    setDescription("");
    setCompanyId("");
    setSalesChannel("");
    setResponsible("");
    setPriority("media");
    setStatus("a_fazer");
    setStartDate("");
    setDueDate("");
    setLabels([]);
    setSubtasks([]);
    setIsTaskModalOpen(true);
  };
  const handleBulkStatusChange = async (newStatus: TaskStatus) => {
    for (const id of Array.from(selectedTasksIds)) {
      await updateDoc(doc(db, "prod_tasks", id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    }
    setSelectedTasksIds(new Set());
  };
  const handleBulkDelete = async () => {
    for (const id of Array.from(selectedTasksIds)) {
      await deleteDoc(doc(db, "prod_tasks", id));
    }
    setSelectedTasksIds(new Set());
  };
  const toggleTaskExpansion = (id: string) => {
    const newExp = new Set(expandedTasks);
    if (newExp.has(id)) newExp.delete(id);
    else newExp.add(id);
    setExpandedTasks(newExp);
  };
  const handleOpenEditTask = (task: Task) => {
    setSelectedTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setCompanyId(task.companyId || "");
    setSalesChannel(task.salesChannel || "");
    setResponsible(task.responsible || "");
    setPriority(task.priority);
    setStatus(task.status);
    setStartDate(task.startDate || "");
    setDueDate(task.dueDate || "");
    setLabels(task.labels || []);
    loadSubtasks(task.id);
    setIsTaskModalOpen(true);
  };
  const handleSaveTask = async () => {
    const user = auth.currentUser;
    if (!user || !title.trim()) return;
    const companyName =
      companies.find((c) => c.id === companyId)?.tradeName || null;
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter((s) => s.completed).length;
    const progress =
      totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;
    const taskData = {
      userId: user.uid,
      title,
      description,
      companyId: companyId || null,
      companyName,
      salesChannel: salesChannel || null,
      responsible,
      priority,
      status,
      startDate: startDate || null,
      dueDate: dueDate || null,
      progress,
      labels,
      updatedAt: serverTimestamp(),
    };
    let taskId = selectedTask?.id;
    if (taskId) {
      await updateDoc(doc(db, "prod_tasks", taskId), taskData);
    } else {
      const docRef = await addDoc(collection(db, "prod_tasks"), {
        ...taskData,
        createdAt: serverTimestamp(),
        commentsCount: 0,
        attachments: [],
      });
      taskId = docRef.id;
    }
    const subtasksRef = collection(db, `prod_tasks/${taskId}/subtasks`);
    const existingSubtasks = await getDocs(query(subtasksRef));
    for (const doc of existingSubtasks.docs) {
      await deleteDoc(doc.ref);
    }
    for (const st of subtasks) {
      await addDoc(subtasksRef, {
        title: st.title,
        completed: st.completed,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });
    }
    setIsTaskModalOpen(false);
  };
  const handleTaskStatusChange = async (
    taskId: string,
    newStatus: TaskStatus,
  ) => {
    await updateDoc(doc(db, "prod_tasks", taskId), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  };
  const addSubtask = (title: string) => {
    if (!title.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: Date.now().toString(),
        title,
        completed: false,
        createdAt: new Date(),
      },
    ]);
  };
  const toggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) =>
        s.id === id ? { ...s, completed: !s.completed } : s,
      ),
    );
  };
  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };
  const toggleLabel = (lbl: string) => {
    if (labels.includes(lbl)) {
      setLabels(labels.filter((l) => l !== lbl));
    } else {
      setLabels([...labels, lbl]);
    }
  };
  const toggleTaskSelection = (id: string) => {
    const newSel = new Set(selectedTasksIds);
    if (newSel.has(id)) newSel.delete(id);
    else newSel.add(id);
    setSelectedTasksIds(newSel);
  };
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description &&
          t.description.toLowerCase().includes(search.toLowerCase())) ||
        (t.responsible &&
          t.responsible.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === "todos" || t.status === filterStatus;
      const matchPriority =
        filterPriority === "todas" || t.priority === filterPriority;
      const matchCompany =
        filterCompany === "todas" || t.companyId === filterCompany;
      const matchChannel =
        filterChannel === "todos" || t.salesChannel === filterChannel;
      const matchResponsible =
        filterResponsible === "todos" || t.responsible === filterResponsible;
      let matchKpi = true;
      if (kpiFilter === "emAndamento") matchKpi = t.status === "em_andamento";
      else if (kpiFilter === "concluidas") matchKpi = t.status === "concluido";
      else if (kpiFilter === "atrasadas")
        matchKpi = !!(
          t.dueDate &&
          isPast(parseISO(t.dueDate)) &&
          t.status !== "concluido" &&
          t.status !== "cancelado"
        );
      else if (kpiFilter === "altaPrioridade")
        matchKpi =
          (t.priority === "urgente" || t.priority === "alta") &&
          t.status !== "concluido" &&
          t.status !== "cancelado";
      else if (kpiFilter === "venceHoje")
        matchKpi = !!(
          t.dueDate &&
          isToday(parseISO(t.dueDate)) &&
          t.status !== "concluido" &&
          t.status !== "cancelado"
        );
      else if (kpiFilter === "venceSemana")
        matchKpi = !!(
          t.dueDate &&
          isThisWeek(parseISO(t.dueDate)) &&
          t.status !== "concluido" &&
          t.status !== "cancelado"
        );
      let matchCompleted = true;
      if (
        !showCompleted &&
        t.status === "concluido" &&
        kpiFilter !== "concluidas"
      ) {
        matchCompleted = false;
      }
      return (
        matchSearch &&
        matchStatus &&
        matchPriority &&
        matchCompany &&
        matchChannel &&
        matchResponsible &&
        matchKpi &&
        matchCompleted
      );
    });
    result = result.sort((a, b) => {
      if (sortMode === "recentes")
        return (
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        );
      if (sortMode === "antigas")
        return (
          (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)
        );
      if (sortMode === "prioridade") {
        const p = { urgente: 4, alta: 3, media: 2, baixa: 1 };
        return p[b.priority] - p[a.priority];
      }
      if (sortMode === "vencimento") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
      }
      if (sortMode === "az") return a.title.localeCompare(b.title);
      if (sortMode === "za") return b.title.localeCompare(a.title);
      return 0;
    });
    return result;
  }, [
    tasks,
    search,
    filterStatus,
    filterPriority,
    filterCompany,
    filterChannel,
    filterResponsible,
    sortMode,
  ]);
  const toggleAllSelection = () => {
    if (selectedTasksIds.size === filteredTasks.length) {
      setSelectedTasksIds(new Set());
    } else {
      setSelectedTasksIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const cardsStats = useMemo(() => {
    return {
      total: tasks.length,
      emAndamento: tasks.filter((t) => t.status === "em_andamento").length,
      concluidas: tasks.filter((t) => t.status === "concluido").length,
      atrasadas: tasks.filter(
        (t) =>
          t.dueDate &&
          isPast(parseISO(t.dueDate)) &&
          t.status !== "concluido" &&
          t.status !== "cancelado",
      ).length,
      altaPrioridade: tasks.filter(
        (t) =>
          (t.priority === "urgente" || t.priority === "alta") &&
          t.status !== "concluido" &&
          t.status !== "cancelado",
      ).length,
      venceHoje: tasks.filter(
        (t) =>
          t.dueDate &&
          isToday(parseISO(t.dueDate)) &&
          t.status !== "concluido" &&
          t.status !== "cancelado",
      ).length,
      venceSemana: tasks.filter(
        (t) =>
          t.dueDate &&
          isThisWeek(parseISO(t.dueDate)) &&
          t.status !== "concluido" &&
          t.status !== "cancelado",
      ).length,
    };
  }, [tasks]);
  const uniqueResponsibles = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.responsible && set.add(t.responsible));
    return Array.from(set);
  }, [tasks]);
  const statusData = Object.entries(STATUS_CONFIG)
    .map(([k, v]) => ({
      name: v.label,
      value: tasks.filter((t) => t.status === k).length,
      fill:
        k === "concluido"
          ? "#6D4AFF"
          : k === "em_andamento"
            ? "#ECE8FF"
            : k === "aguardando"
              ? "#9CA3AF"
              : k === "cancelado"
                ? "#F3F4F6"
                : "#D1D5DB",
    }))
    .filter((d) => d.value > 0);
  const priorityData = Object.entries(PRIORITY_CONFIG).map(([k, v]) => ({
    name: v.label,
    Tarefas: tasks.filter((t) => t.priority === k).length,
    fill: "#6D4AFF",
  }));
  const renderDashboard = () => {
    return (
      <div className="flex flex-col gap-6 p-1 pb-10">
        {" "}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {" "}
          <Card className="rounded-[24px] border border-border/40 shadow-[0_4px_24px_rgba(0,0,0,0.02)] bg-card">
            {" "}
            <CardHeader className="pb-2">
              {" "}
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Tarefas por Status
              </CardTitle>{" "}
            </CardHeader>{" "}
            <CardContent className="p-6 pt-0">
              {" "}
              <div className="h-64 w-full">
                {" "}
                <ResponsiveContainer width="100%" height="100%">
                  {" "}
                  <PieChart>
                    {" "}
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {" "}
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}{" "}
                    </Pie>{" "}
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                      }}
                    />{" "}
                    <Legend />{" "}
                  </PieChart>{" "}
                </ResponsiveContainer>{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>{" "}
          <Card className="rounded-[24px] border border-border/40 shadow-[0_4px_24px_rgba(0,0,0,0.02)] bg-card">
            {" "}
            <CardHeader className="pb-2">
              {" "}
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Por Prioridade
              </CardTitle>{" "}
            </CardHeader>{" "}
            <CardContent className="p-6 pt-0">
              {" "}
              <div className="h-64 w-full">
                {" "}
                <ResponsiveContainer width="100%" height="100%">
                  {" "}
                  <BarChart
                    data={priorityData}
                    margin={{ top: 20, right: 20, bottom: 20, left: -20 }}
                  >
                    {" "}
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                    />{" "}
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                    />{" "}
                    <RechartsTooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                      }}
                    />{" "}
                    <Bar dataKey="Tarefas" radius={[6, 6, 0, 0]} />{" "}
                  </BarChart>{" "}
                </ResponsiveContainer>{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>{" "}
          <Card className="rounded-[24px] border border-border/40 shadow-[0_4px_24px_rgba(0,0,0,0.02)] bg-card">
            {" "}
            <CardHeader className="pb-2">
              {" "}
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Tarefas por Canal
              </CardTitle>{" "}
            </CardHeader>{" "}
            <CardContent className="p-6 pt-0">
              {" "}
              <div className="flex flex-col gap-4 mt-4">
                {" "}
                {channels.slice(0, 5).map((c) => {
                  const count = tasks.filter(
                    (t) => t.salesChannel === c.accountName,
                  ).length;
                  return count > 0 ? (
                    <div
                      key={c.id}
                      className="flex items-center justify-between"
                    >
                      {" "}
                      <span className="text-sm font-medium text-foreground">
                        {c.accountName}
                      </span>{" "}
                      <span className="text-sm font-bold text-primary">
                        {count}
                      </span>{" "}
                    </div>
                  ) : null;
                })}{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </div>{" "}
        <div className="mt-8">
          {" "}
          <h2 className="text-[28px] font-semibold tracking-tight text-foreground">
            {" "}
            <Lightbulb className="w-5 h-5 text-primary" /> Insights
            Operacionais{" "}
          </h2>{" "}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {" "}
            <div className="premium-card p-5 -primary/20 rounded-[24px] -[0_4px_24px_rgba(0,0,0,0.02)] flex items-start gap-4">
              {" "}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {" "}
                <CheckCircle2 className="w-5 h-5 text-primary" />{" "}
              </div>{" "}
              <div>
                {" "}
                <h4 className="text-[15px] font-bold text-foreground mb-1">
                  A equipe concluiu{" "}
                  {Math.round(
                    (cardsStats.concluidas / Math.max(1, cardsStats.total)) *
                      100,
                  )}
                  % das tarefas
                </h4>{" "}
                <p className="text-[13px] text-muted-foreground">
                  Continue acompanhando o progresso diário para manter o ritmo.
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="premium-card p-5 -primary/20 rounded-[24px] -[0_4px_24px_rgba(0,0,0,0.02)] flex items-start gap-4">
              {" "}
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                {" "}
                <AlertCircle className="w-5 h-5 text-red-500" />{" "}
              </div>{" "}
              <div>
                {" "}
                <h4 className="text-[15px] font-bold text-foreground mb-1">
                  Existem {cardsStats.atrasadas} tarefas atrasadas
                </h4>{" "}
                <p className="text-[13px] text-muted-foreground">
                  Realoque os responsáveis ou ajuste os prazos para regularizar.
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="premium-card p-5 -primary/20 rounded-[24px] -[0_4px_24px_rgba(0,0,0,0.02)] flex items-start gap-4">
              {" "}
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                {" "}
                <Flame className="w-5 h-5 text-orange-500" />{" "}
              </div>{" "}
              <div>
                {" "}
                <h4 className="text-[15px] font-bold text-foreground mb-1">
                  Prioridade Média representa a maioria
                </h4>{" "}
                <p className="text-[13px] text-muted-foreground">
                  O fluxo de trabalho está estabilizado sem picos de urgência no
                  momento.
                </p>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="mt-8">
          {" "}
          <h2 className="text-[28px] font-semibold tracking-tight text-foreground">
            {" "}
            <Clock className="w-5 h-5 text-primary" /> Últimas Atividades{" "}
          </h2>{" "}
          <div className="premium-card -/40 rounded-[24px] -[0_4px_24px_rgba(0,0,0,0.02)] p-6">
            {" "}
            <div className="flex flex-col gap-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/60 before:to-transparent">
              {" "}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {" "}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  {" "}
                  <CheckCircle2 className="w-5 h-5" />{" "}
                </div>{" "}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-muted/20 p-4 rounded-[16px] border border-border/40 shadow-sm">
                  {" "}
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    {" "}
                    <div className="font-bold text-[14px] text-foreground">
                      Tarefa Concluída
                    </div>{" "}
                    <time className="font-medium text-[12px] text-muted-foreground">
                      Agora
                    </time>{" "}
                  </div>{" "}
                  <div className="text-[13px] text-muted-foreground">
                    Revisar material da campanha foi marcada como concluída por
                    Andreza.
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {" "}
                <div className="premium-card flex items-center justify-center w-10 h-10 rounded-full - text-muted-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  {" "}
                  <MessageSquare className="w-5 h-5" />{" "}
                </div>{" "}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-muted/20 p-4 rounded-[16px] border border-border/40 shadow-sm">
                  {" "}
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    {" "}
                    <div className="font-bold text-[14px] text-foreground">
                      Comentário Adicionado
                    </div>{" "}
                    <time className="font-medium text-[12px] text-muted-foreground">
                      Há 2 horas
                    </time>{" "}
                  </div>{" "}
                  <div className="text-[13px] text-muted-foreground">
                    Carlos comentou em "Configurar Shopee": "Os banners já estão
                    prontos."
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {" "}
                <div className="premium-card flex items-center justify-center w-10 h-10 rounded-full - text-muted-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  {" "}
                  <Plus className="w-5 h-5" />{" "}
                </div>{" "}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-muted/20 p-4 rounded-[16px] border border-border/40 shadow-sm">
                  {" "}
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    {" "}
                    <div className="font-bold text-[14px] text-foreground">
                      Nova Tarefa
                    </div>{" "}
                    <time className="font-medium text-[12px] text-muted-foreground">
                      Ontem
                    </time>{" "}
                  </div>{" "}
                  <div className="text-[13px] text-muted-foreground">
                    "Análise de Concorrentes" foi criada e atribuída a Mariana.
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>
    );
  };
  const renderListView = () => {
    return (
      <div className="flex flex-col gap-3 pb-8">
        {" "}
        {selectedTasksIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-[20px] mb-2 sticky top-0 z-10 backdrop-blur-md"
          >
            {" "}
            <span className="text-sm font-bold text-primary">
              {selectedTasksIds.size}{" "}
              {selectedTasksIds.size === 1
                ? "tarefa selecionada"
                : "tarefas selecionadas"}
            </span>{" "}
            <div className="flex gap-2">
              {" "}
              <DropdownMenu>
                {" "}
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-[14px] text-[13px] font-bold border-border bg-card"
                    >
                      Alterar Status <ChevronDown className="ml-2 w-4 h-4" />
                    </Button>
                  }
                />{" "}
                <DropdownMenuContent className="rounded-[16px] border-border shadow-lg">
                  {" "}
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <DropdownMenuItem
                      key={k}
                      onClick={() => handleBulkStatusChange(k as TaskStatus)}
                      className="rounded-xl font-bold text-[13px] py-2 cursor-pointer"
                    >
                      {" "}
                      <v.icon className="mr-2 w-4 h-4" /> {v.label}{" "}
                    </DropdownMenuItem>
                  ))}{" "}
                </DropdownMenuContent>{" "}
              </DropdownMenu>{" "}
              <Button
                onClick={handleBulkDelete}
                variant="outline"
                size="sm"
                className="h-9 rounded-[14px] text-[13px] font-bold text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:text-red-600"
              >
                Excluir
              </Button>{" "}
            </div>{" "}
          </motion.div>
        )}{" "}
        <div className="flex items-center px-4 mb-2 text-[13px] font-bold text-muted-foreground">
          {" "}
          <div className="w-[40px] flex justify-center">
            {" "}
            <Checkbox
              checked={
                selectedTasksIds.size > 0 &&
                selectedTasksIds.size === filteredTasks.length
              }
              onCheckedChange={toggleAllSelection}
              className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />{" "}
          </div>{" "}
          <div className="flex-1">Título</div>{" "}
          <div className="w-[180px] hidden md:block">Vínculos</div>{" "}
          <div className="w-[160px] hidden lg:block">Responsável</div>{" "}
          <div className="w-[140px] hidden lg:block">Prazo</div>{" "}
          <div className="w-[140px] hidden xl:block">Progresso</div>{" "}
          <div className="w-[160px] hidden xl:block">Prioridade & Status</div>{" "}
          <div className="w-[60px] text-right">Ações</div>{" "}
        </div>{" "}
        {paginatedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 premium-card/40 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            {" "}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {" "}
              <ListTodo className="w-8 h-8 text-primary" />{" "}
            </div>{" "}
            <h3 className="text-lg font-bold text-foreground">
              Nenhuma tarefa encontrada
            </h3>{" "}
            <p className="text-sm text-muted-foreground mt-1">
              Ajuste os filtros ou crie uma nova tarefa.
            </p>{" "}
            <Button
              onClick={handleOpenNewTask}
              className="premium-btn-primary mt-6 rounded-[16px] px-6 h-11 font-bold text-[14px] bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {" "}
              <Plus className="w-4 h-4 mr-2" /> Nova Tarefa{" "}
            </Button>{" "}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {" "}
            {paginatedTasks.map((task, i) => (
              <div key={task.id} className="flex flex-col gap-1">
                {" "}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="group flex flex-col md:flex-row items-start md:items-center p-3 md:p-4 premium-card/40 hover:border-primary/20 hover:shadow-[0_10px_40px_rgba(109,74,255,0.06)] transition-all cursor-pointer relative"
                  onClick={() => toggleTaskExpansion(task.id)}
                >
                  {" "}
                  <div className="flex items-center w-full md:w-auto flex-1">
                    {" "}
                    <div className="w-[40px] flex justify-center shrink-0">
                      {" "}
                      <Checkbox
                        checked={selectedTasksIds.has(task.id)}
                        onCheckedChange={() => toggleTaskSelection(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />{" "}
                    </div>{" "}
                    <div className="flex-1 flex flex-col min-w-0">
                      {" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <span
                          className={cn(
                            "text-[15px] font-bold truncate",
                            task.status === "concluido"
                              ? "text-muted-foreground line-through"
                              : "text-foreground",
                          )}
                        >
                          {task.title}
                        </span>{" "}
                        {task.status === "concluido" && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-muted text-muted-foreground rounded-full">
                            CONCLUÍDA
                          </span>
                        )}{" "}
                      </div>{" "}
                      {task.description && (
                        <span className="text-[13px] text-muted-foreground truncate max-w-[300px] md:max-w-[500px] hidden md:block">
                          {task.description}
                        </span>
                      )}{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex items-center w-full md:w-auto mt-3 md:mt-0 ml-10 md:ml-0 gap-4 md:gap-0">
                    {" "}
                    <div className="w-[180px] hidden md:flex items-center gap-2">
                      {" "}
                      {task.companyId || task.salesChannel ? (
                        <div className="flex flex-col">
                          {" "}
                          {task.companyId && (
                            <span className="text-[12px] font-semibold text-foreground truncate max-w-[150px]">
                              <LayoutGrid className="w-3 h-3 inline mr-1 text-muted-foreground" />
                              {companies.find((c) => c.id === task.companyId)
                                ?.tradeName || task.companyId}
                            </span>
                          )}{" "}
                          {task.salesChannel && (
                            <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[150px]">
                              {task.salesChannel}
                            </span>
                          )}{" "}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}{" "}
                    </div>{" "}
                    <div className="w-[160px] hidden lg:flex items-center gap-2">
                      {" "}
                      {task.responsible ? (
                        <>
                          {" "}
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {" "}
                            {task.responsible.charAt(0).toUpperCase()}{" "}
                          </div>{" "}
                          <span className="text-[13px] font-semibold text-foreground truncate">
                            {task.responsible}
                          </span>{" "}
                        </>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}{" "}
                    </div>{" "}
                    <div className="w-[140px] hidden lg:flex flex-col">
                      {" "}
                      {task.dueDate ? (
                        <>
                          {" "}
                          <span className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                            {" "}
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                            {format(parseISO(task.dueDate), "dd MMM")}{" "}
                          </span>{" "}
                          {isToday(parseISO(task.dueDate)) && (
                            <span className="text-[10px] font-bold text-orange-500 uppercase">
                              Hoje
                            </span>
                          )}{" "}
                          {isPast(parseISO(task.dueDate)) &&
                            !isToday(parseISO(task.dueDate)) &&
                            task.status !== "concluido" && (
                              <span className="text-[10px] font-bold text-red-500 uppercase">
                                Atrasada
                              </span>
                            )}{" "}
                        </>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}{" "}
                    </div>{" "}
                    <div className="w-[140px] hidden xl:flex items-center gap-2 pr-4">
                      {" "}
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        {" "}
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${task.subtasksCount ? 0 : task.status === "concluido" ? 100 : 0}%`,
                          }}
                        />{" "}
                      </div>{" "}
                      <span className="text-[11px] font-bold text-muted-foreground w-8 text-right">
                        {" "}
                        {task.subtasksCount
                          ? 0
                          : task.status === "concluido"
                            ? 100
                            : 0}
                        %{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="w-[160px] flex justify-between items-center md:block flex-shrink-0">
                      {" "}
                      <div className="flex flex-col gap-1.5 items-start">
                        {" "}
                        {(() => {
                          const pri = PRIORITY_CONFIG[task.priority];
                          return (
                            pri && (
                              <span
                                className={cn(
                                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[8px]",
                                  pri.bg,
                                  pri.color,
                                )}
                              >
                                {" "}
                                {pri.label}{" "}
                              </span>
                            )
                          );
                        })()}{" "}
                        {(() => {
                          const st = STATUS_CONFIG[task.status];
                          return (
                            st && (
                              <div
                                className={cn(
                                  "flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-[11px] font-bold border",
                                  st.bg,
                                  st.color,
                                )}
                              >
                                {" "}
                                <st.icon className="w-3.5 h-3.5" />{" "}
                                {st.label}{" "}
                              </div>
                            )
                          );
                        })()}{" "}
                      </div>{" "}
                    </div>{" "}
                    <div
                      className="w-[60px] flex items-center justify-end gap-1 shrink-0 ml-auto md:ml-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {" "}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskExpansion(task.id);
                        }}
                      >
                        {" "}
                        {expandedTasks.has(task.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}{" "}
                      </Button>{" "}
                      <DropdownMenu>
                        {" "}
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          }
                        />{" "}
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-[16px] border-border shadow-lg p-2 font-medium"
                        >
                          {" "}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                              setIsDetailModalOpen(true);
                            }}
                            className="rounded-xl cursor-pointer py-2.5 px-3 hover:bg-muted font-bold text-[13px]"
                          >
                            {" "}
                            <Eye className="w-4 h-4 mr-2" /> Visualizar{" "}
                          </DropdownMenuItem>{" "}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditTask(task);
                            }}
                            className="rounded-xl cursor-pointer py-2.5 px-3 hover:bg-muted font-bold text-[13px]"
                          >
                            {" "}
                            <Edit2 className="w-4 h-4 mr-2" /> Editar{" "}
                          </DropdownMenuItem>{" "}
                          <DropdownMenuSeparator className="bg-border/60 my-1" />{" "}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDoc(doc(db, "prod_tasks", task.id));
                            }}
                            className="rounded-xl cursor-pointer py-2.5 px-3 hover:bg-red-500/10 text-red-500 font-bold text-[13px]"
                          >
                            {" "}
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir{" "}
                          </DropdownMenuItem>{" "}
                        </DropdownMenuContent>{" "}
                      </DropdownMenu>{" "}
                    </div>{" "}
                  </div>{" "}
                </motion.div>{" "}
                <AnimatePresence>
                  {" "}
                  {expandedTasks.has(task.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {" "}
                      <div className="bg-muted/10 border border-border/40 rounded-[20px] p-5 mt-1 mb-2 ml-0 md:ml-[40px] mr-0 md:mr-[60px] flex flex-col gap-4">
                        {" "}
                        {task.description && (
                          <div>
                            {" "}
                            <h4 className="text-[11px] font-bold uppercase text-muted-foreground mb-1">
                              Descrição
                            </h4>{" "}
                            <p className="text-[14px] text-foreground whitespace-pre-wrap">
                              {task.description}
                            </p>{" "}
                          </div>
                        )}{" "}
                        {task.labels && task.labels.length > 0 && (
                          <div>
                            {" "}
                            <h4 className="text-[11px] font-bold uppercase text-muted-foreground mb-2">
                              Etiquetas
                            </h4>{" "}
                            <div className="flex flex-wrap gap-2">
                              {" "}
                              {task.labels.map((l) => (
                                <span
                                  key={l}
                                  className="text-[11px] font-bold px-3 py-1 rounded-full bg-card border border-border/60 text-muted-foreground"
                                >
                                  {l}
                                </span>
                              ))}{" "}
                            </div>{" "}
                          </div>
                        )}{" "}
                        <div className="flex gap-2">
                          {" "}
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-[12px] h-9 text-[12px] font-bold border-border bg-card"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            {" "}
                            <Expand className="w-3.5 h-3.5 mr-1.5" /> Detalhes
                            Completos{" "}
                          </Button>{" "}
                        </div>{" "}
                      </div>{" "}
                    </motion.div>
                  )}{" "}
                </AnimatePresence>{" "}
              </div>
            ))}{" "}
          </div>
        )}{" "}
        {!showCompleted && tasks.some((t) => t.status === "concluido") && (
          <div className="flex justify-center mt-6">
            {" "}
            <Button
              variant="outline"
              className="rounded-full px-6 font-bold text-muted-foreground hover:text-foreground border-border bg-card"
              onClick={() => setShowCompleted(true)}
            >
              {" "}
              Mostrar tarefas concluídas{" "}
            </Button>{" "}
          </div>
        )}{" "}
        {showCompleted && tasks.some((t) => t.status === "concluido") && (
          <div className="flex justify-center mt-6">
            {" "}
            <Button
              variant="outline"
              className="rounded-full px-6 font-bold text-muted-foreground hover:text-foreground border-border bg-card"
              onClick={() => setShowCompleted(false)}
            >
              {" "}
              Ocultar tarefas concluídas{" "}
            </Button>{" "}
          </div>
        )}{" "}
        {/* Pagination Controls */}{" "}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-4">
            {" "}
            <span className="text-[13px] font-medium text-muted-foreground">
              Mostrando {paginatedTasks.length} de {filteredTasks.length}{" "}
              tarefas
            </span>{" "}
            <div className="flex items-center gap-2">
              {" "}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-9 rounded-[12px] border-border bg-card"
              >
                Anterior
              </Button>{" "}
              <div className="flex items-center gap-1">
                {" "}
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-9 h-9 rounded-[12px]",
                      currentPage === i + 1
                        ? "bg-primary text-primary-foreground"
                        : "",
                    )}
                  >
                    {" "}
                    {i + 1}{" "}
                  </Button>
                ))}{" "}
              </div>{" "}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="h-9 rounded-[12px] border-border bg-card"
              >
                Próximo
              </Button>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-background flex flex-col p-4 md:p-8 font-sans">
      {" "}
      <div className="max-w-none w-full mx-auto flex flex-col gap-6 h-full">
        {" "}
        {/* Header Section */}{" "}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {" "}
          <div>
            {" "}
            <h1 className="text-[36px] font-bold tracking-tight text-foreground leading-tight">
              Tarefas
            </h1>{" "}
            <p className="text-[15px] font-normal text-muted-foreground mt-1">
              Gerencie atividades, prioridades e responsáveis por toda a
              operação.
            </p>{" "}
          </div>{" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="premium-card flex items-center p-1 -/60 -[0_4px_24px_rgba(0,0,0,0.02)]">
              {" "}
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-[14px] text-sm font-bold transition-all",
                  viewMode === "list"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {" "}
                <ListTodo className="w-4 h-4" /> Lista{" "}
              </button>{" "}
              <button
                onClick={() => setViewMode("dashboard")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-[14px] text-sm font-bold transition-all",
                  viewMode === "dashboard"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {" "}
                <ChartNoAxesCombined className="w-4 h-4" /> Gráficos{" "}
              </button>{" "}
            </div>{" "}
            <Button
              onClick={handleOpenNewTask}
              className="premium-btn-primary rounded-[16px] h-11 px-6 font-bold text-[15px] shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
            >
              {" "}
              <Plus className="w-5 h-5 mr-1" /> Nova Tarefa{" "}
            </Button>{" "}
            <DropdownMenu>
              {" "}
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-11 h-11 rounded-[16px] border-border bg-card hover:bg-muted p-0 flex items-center justify-center text-muted-foreground transition-all shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
                  />
                }
              >
                {" "}
                <MoreVertical className="w-5 h-5" />{" "}
              </DropdownMenuTrigger>{" "}
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-[20px] border-border bg-card shadow-lg p-2 font-medium"
              >
                {" "}
                <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 px-3 hover:bg-muted font-bold text-[13px]">
                  {" "}
                  Nova Etiqueta{" "}
                </DropdownMenuItem>{" "}
                <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 px-3 hover:bg-muted font-bold text-[13px]">
                  {" "}
                  Novo Responsável{" "}
                </DropdownMenuItem>{" "}
                <DropdownMenuSeparator className="bg-border/60 my-1" />{" "}
                <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 px-3 hover:bg-muted font-bold text-[13px]">
                  {" "}
                  Exportar Tarefas{" "}
                </DropdownMenuItem>{" "}
              </DropdownMenuContent>{" "}
            </DropdownMenu>{" "}
          </div>{" "}
        </div>{" "}
        {/* Executive Cards */}{" "}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {" "}
          {[
            {
              id: "total",
              label: "Total de Tarefas",
              value: cardsStats.total,
              icon: ListChecks,
            },
            {
              id: "emAndamento",
              label: "Em Andamento",
              value: cardsStats.emAndamento,
              icon: LoaderCircle,
            },
            {
              id: "concluidas",
              label: "Concluídas",
              value: cardsStats.concluidas,
              icon: CircleCheckBig,
            },
            {
              id: "atrasadas",
              label: "Atrasadas",
              value: cardsStats.atrasadas,
              icon: CircleAlert,
              critical: cardsStats.atrasadas > 0,
            },
            {
              id: "altaPrioridade",
              label: "Alta Prioridade",
              value: cardsStats.altaPrioridade,
              icon: Flame,
              critical: cardsStats.altaPrioridade > 0,
            },
            {
              id: "venceHoje",
              label: "Vencem Hoje",
              value: cardsStats.venceHoje,
              icon: CalendarClock,
            },
            {
              id: "venceSemana",
              label: "Vencem Esta Semana",
              value: cardsStats.venceSemana,
              icon: CalendarDays,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{
                scale: 1.04,
                rotate: 1,
                boxShadow: "0 10px 40px rgba(109,74,255,0.08)",
              }}
              onClick={() =>
                setKpiFilter(kpiFilter === stat.id ? null : stat.id)
              }
              className={cn(
                "rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border flex flex-col justify-between h-32 cursor-pointer transition-all",
                kpiFilter === stat.id
                  ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
                  : "bg-card border-border/40",
              )}
            >
              {" "}
              <div className="flex items-center gap-3">
                {" "}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    stat.critical ? "bg-red-50" : "bg-muted",
                    kpiFilter === stat.id ? "bg-primary/10" : "",
                  )}
                >
                  {" "}
                  <stat.icon
                    className={cn(
                      "w-5 h-5",
                      stat.critical ? "text-red-500" : "text-muted-foreground",
                      kpiFilter === stat.id ? "text-primary" : "",
                    )}
                  />{" "}
                </div>{" "}
                <span
                  className={cn(
                    "text-[12px] font-bold leading-tight",
                    kpiFilter === stat.id
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {stat.label}
                </span>{" "}
              </div>{" "}
              <div
                className={cn(
                  "text-[32px] font-bold tracking-tight mt-2",
                  kpiFilter === stat.id ? "text-primary" : "text-foreground",
                )}
              >
                {stat.value}
              </div>{" "}
            </motion.div>
          ))}{" "}
        </div>{" "}
        {/* Search & Filters */}{" "}
        {viewMode === "list" && (
          <div className="premium-card rounded-[24px] p-5 -[0_4px_24px_rgba(0,0,0,0.02)] -/40">
            {" "}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {" "}
              <div className="relative w-full md:w-80 shrink-0">
                {" "}
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />{" "}
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 w-full rounded-[16px] bg-muted/40 border-transparent font-medium text-[14px]"
                  placeholder="Buscar por título, descrição, responsável..."
                />{" "}
              </div>{" "}
              <div className="flex gap-3 w-full overflow-x-auto hide-scrollbar">
                {" "}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  {" "}
                  <SelectTrigger className="w-[150px] h-12 rounded-[16px] font-bold bg-muted/40 border-transparent text-[13px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>{" "}
                  <SelectContent className="rounded-[16px]">
                    {" "}
                    <SelectItem value="todos">Status: Todos</SelectItem>{" "}
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}{" "}
                  </SelectContent>{" "}
                </Select>{" "}
                <Select
                  value={filterPriority}
                  onValueChange={setFilterPriority}
                >
                  {" "}
                  <SelectTrigger className="w-[150px] h-12 rounded-[16px] font-bold bg-muted/40 border-transparent text-[13px]">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>{" "}
                  <SelectContent className="rounded-[16px]">
                    {" "}
                    <SelectItem value="todas">
                      Prioridade: Todas
                    </SelectItem>{" "}
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}{" "}
                  </SelectContent>{" "}
                </Select>{" "}
                <Select value={filterCompany} onValueChange={setFilterCompany}>
                  {" "}
                  <SelectTrigger className="w-[150px] h-12 rounded-[16px] font-bold bg-muted/40 border-transparent text-[13px]">
                    <SelectValue placeholder="Empresa" />
                  </SelectTrigger>{" "}
                  <SelectContent className="rounded-[16px]">
                    {" "}
                    <SelectItem value="todas">Empresa: Todas</SelectItem>{" "}
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.tradeName}
                      </SelectItem>
                    ))}{" "}
                  </SelectContent>{" "}
                </Select>{" "}
                <Select
                  value={filterResponsible}
                  onValueChange={setFilterResponsible}
                >
                  {" "}
                  <SelectTrigger className="w-[150px] h-12 rounded-[16px] font-bold bg-muted/40 border-transparent text-[13px]">
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>{" "}
                  <SelectContent className="rounded-[16px]">
                    {" "}
                    <SelectItem value="todos">
                      Responsável: Todos
                    </SelectItem>{" "}
                    {uniqueResponsibles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}{" "}
                  </SelectContent>{" "}
                </Select>{" "}
                <Select value={sortMode} onValueChange={setSortMode}>
                  {" "}
                  <SelectTrigger className="w-[150px] h-12 rounded-[16px] font-bold bg-muted/40 border-transparent text-[13px] ml-auto">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>{" "}
                  <SelectContent className="rounded-[16px]">
                    {" "}
                    <SelectItem value="recentes">Mais Recentes</SelectItem>{" "}
                    <SelectItem value="antigas">Mais Antigas</SelectItem>{" "}
                    <SelectItem value="vencimento">
                      Vencimento Próximo
                    </SelectItem>{" "}
                    <SelectItem value="prioridade">Maior Prioridade</SelectItem>{" "}
                    <SelectItem value="az">A-Z</SelectItem>{" "}
                    <SelectItem value="za">Z-A</SelectItem>{" "}
                  </SelectContent>{" "}
                </Select>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        )}{" "}
        {viewMode === "list" ? renderListView() : renderDashboard()}{" "}
      </div>{" "}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        {" "}
        <DialogContent className="rounded-[32px] border-border w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-hidden p-0 flex flex-col bg-card shadow-[0_10px_60px_rgba(0,0,0,0.1)]">
          {" "}
          <div className="flex items-center justify-between px-8 py-6 border-b border-border/40">
            {" "}
            <div>
              {" "}
              <DialogTitle className="text-xl font-bold text-foreground">
                {selectedTask ? "Editar Tarefa" : "Nova Tarefa"}
              </DialogTitle>{" "}
              <p className="text-[13px] text-muted-foreground mt-1">
                Preencha as informações e organize a execução da atividade.
              </p>{" "}
            </div>{" "}
            <DialogClose className="rounded-full p-2 hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </DialogClose>{" "}
          </div>{" "}
          <div className="flex-1 overflow-y-auto p-8 hide-scrollbar flex flex-col gap-8">
            {" "}
            <div className="flex flex-col gap-6">
              {" "}
              <div className="space-y-4">
                {" "}
                <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  1. Informações principais
                </h3>{" "}
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="O que precisa ser feito?"
                  className="text-lg font-semibold h-14 rounded-[16px] border-border bg-muted/20"
                />{" "}
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Adicione detalhes, links ou orientações sobre a tarefa..."
                  className="h-32 resize-none rounded-[16px] border-border bg-muted/20 text-[14px]"
                />{" "}
              </div>{" "}
              <div className="space-y-4">
                {" "}
                <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  2. Organização
                </h3>{" "}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {" "}
                  <Select value={companyId} onValueChange={setCompanyId}>
                    {" "}
                    <SelectTrigger className="h-12 rounded-[16px] bg-muted/20">
                      <SelectValue placeholder="Selecione a Empresa" />
                    </SelectTrigger>{" "}
                    <SelectContent className="rounded-[16px]">
                      {" "}
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.tradeName}
                        </SelectItem>
                      ))}{" "}
                    </SelectContent>{" "}
                  </Select>{" "}
                  <Select value={salesChannel} onValueChange={setSalesChannel}>
                    {" "}
                    <SelectTrigger className="h-12 rounded-[16px] bg-muted/20">
                      <SelectValue placeholder="Selecione o Canal" />
                    </SelectTrigger>{" "}
                    <SelectContent className="rounded-[16px]">
                      {" "}
                      {channels.map((c) => (
                        <SelectItem key={c.id} value={c.accountName}>
                          {c.accountName}
                        </SelectItem>
                      ))}{" "}
                    </SelectContent>{" "}
                  </Select>{" "}
                  <Input
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    placeholder="Responsável"
                    className="h-12 rounded-[16px] bg-muted/20"
                  />{" "}
                  <Select
                    value={priority}
                    onValueChange={(v: TaskPriority) => setPriority(v)}
                  >
                    {" "}
                    <SelectTrigger className="h-12 rounded-[16px] bg-muted/20">
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>{" "}
                    <SelectContent className="rounded-[16px]">
                      {" "}
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label}
                        </SelectItem>
                      ))}{" "}
                    </SelectContent>{" "}
                  </Select>{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-4">
                {" "}
                <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  3. Datas
                </h3>{" "}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {" "}
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-12 rounded-[16px] bg-muted/20 text-muted-foreground"
                  />{" "}
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-12 rounded-[16px] bg-muted/20 text-muted-foreground"
                  />{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-4">
                {" "}
                <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  4. Etiquetas
                </h3>{" "}
                <div className="flex flex-wrap gap-2">
                  {" "}
                  {PREDEFINED_LABELS.map((lbl) => {
                    const active = labels.includes(lbl);
                    return (
                      <button
                        key={lbl}
                        onClick={() => toggleLabel(lbl)}
                        className={cn(
                          "px-3 py-1.5 rounded-[12px] text-[12px] font-bold border transition-colors",
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border/60 text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {" "}
                        {lbl}{" "}
                      </button>
                    );
                  })}{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-4">
                {" "}
                <div className="flex items-center justify-between">
                  {" "}
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    5. Subtarefas
                  </h3>{" "}
                </div>{" "}
                <div className="flex gap-2">
                  {" "}
                  <Input
                    id="new-subtask"
                    placeholder="Adicionar subtarefa..."
                    className="premium-input h-12 rounded-[16px] bg-muted/20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubtask(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />{" "}
                  <Button
                    variant="outline"
                    className="h-12 px-6 rounded-[16px] font-bold"
                    onClick={() => {
                      const input = document.getElementById(
                        "new-subtask",
                      ) as HTMLInputElement;
                      if (input.value) {
                        addSubtask(input.value);
                        input.value = "";
                      }
                    }}
                  >
                    Add
                  </Button>{" "}
                </div>{" "}
                <div className="flex flex-col gap-2 mt-4">
                  {" "}
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between bg-muted/10 border border-border/40 p-3 rounded-[16px]"
                    >
                      {" "}
                      <div className="flex items-center gap-3">
                        {" "}
                        <Checkbox
                          checked={st.completed}
                          onCheckedChange={() => toggleSubtask(st.id)}
                          className="rounded-md w-5 h-5"
                        />{" "}
                        <span
                          className={cn(
                            "text-[14px] font-medium",
                            st.completed
                              ? "line-through text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {st.title}
                        </span>{" "}
                      </div>{" "}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubtask(st.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-[10px]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>{" "}
                    </div>
                  ))}{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="premium-card px-8 py-5 border-t -/40 /50 backdrop-blur-md flex items-center justify-end gap-3 shrink-0">
            {" "}
            <Button
              variant="outline"
              onClick={() => setIsTaskModalOpen(false)}
              className="rounded-[16px] h-12 px-8 font-bold border-border bg-card"
            >
              Cancelar
            </Button>{" "}
            <Button
              onClick={handleSaveTask}
              className="premium-btn-primary rounded-[16px] h-12 px-8 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              Salvar Tarefa
            </Button>{" "}
          </div>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        {" "}
        <DialogContent className="!translate-x-0 !translate-y-0 !top-0 !right-0 !left-auto !bottom-0 h-full w-full sm:w-[600px] max-w-[100vw] m-0 p-0 overflow-y-auto bg-card shadow-[-20px_0_60px_rgba(0,0,0,0.1)] rounded-none sm:rounded-l-[32px] border-l border-y-0 border-r-0 border-border/40 data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full duration-300">
          {" "}
          {selectedTask && (
            <div className="flex flex-col h-full min-h-screen">
              {" "}
              <div className="premium-card flex items-center justify-between px-8 py-6 border-b -/40 sticky top-0 /80 backdrop-blur-md z-10">
                {" "}
                <div className="flex items-center gap-3">
                  {" "}
                  {(() => {
                    const st = STATUS_CONFIG[selectedTask.status];
                    return (
                      st && (
                        <span
                          className={cn(
                            "text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide",
                            st.bg,
                            st.color,
                          )}
                        >
                          {st.label}
                        </span>
                      )
                    );
                  })()}{" "}
                  {(() => {
                    const pri = PRIORITY_CONFIG[selectedTask.priority];
                    return (
                      pri && (
                        <span
                          className={cn(
                            "text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide",
                            pri.bg,
                            pri.color,
                          )}
                        >
                          {pri.label}
                        </span>
                      )
                    );
                  })()}{" "}
                </div>{" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenEditTask(selectedTask);
                    }}
                    className="rounded-[12px] hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>{" "}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="rounded-[12px] hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </Button>{" "}
                </div>{" "}
              </div>{" "}
              <div className="p-8 flex flex-col gap-8 flex-1">
                {" "}
                <div>
                  {" "}
                  <h2 className="text-[28px] font-semibold tracking-tight text-foreground">
                    {selectedTask.title}
                  </h2>{" "}
                  <p className="text-[14px] text-muted-foreground whitespace-pre-wrap">
                    {selectedTask.description || "Nenhuma descrição fornecida."}
                  </p>{" "}
                  {selectedTask.labels && selectedTask.labels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {" "}
                      {selectedTask.labels.map((l) => (
                        <span
                          key={l}
                          className="text-[11px] font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground"
                        >
                          {l}
                        </span>
                      ))}{" "}
                    </div>
                  )}{" "}
                </div>{" "}
                <div className="grid grid-cols-2 gap-4">
                  {" "}
                  <div className="flex flex-col gap-1 p-4 rounded-[16px] bg-muted/20 border border-border/40">
                    {" "}
                    <span className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Responsável
                    </span>{" "}
                    <span className="text-[14px] font-semibold text-foreground mt-1">
                      {selectedTask.responsible || "Não atribuído"}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex flex-col gap-1 p-4 rounded-[16px] bg-muted/20 border border-border/40">
                    {" "}
                    <span className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Vencimento
                    </span>{" "}
                    <span className="text-[14px] font-semibold text-foreground mt-1">
                      {selectedTask.dueDate
                        ? format(parseISO(selectedTask.dueDate), "dd/MM/yyyy")
                        : "Sem prazo"}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex flex-col gap-1 p-4 rounded-[16px] bg-muted/20 border border-border/40">
                    {" "}
                    <span className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Empresa
                    </span>{" "}
                    <span className="text-[14px] font-semibold text-foreground mt-1">
                      {selectedTask.companyName || "-"}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex flex-col gap-1 p-4 rounded-[16px] bg-muted/20 border border-border/40">
                    {" "}
                    <span className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5" /> Canal
                    </span>{" "}
                    <span className="text-[14px] font-semibold text-foreground mt-1">
                      {selectedTask.salesChannel || "-"}
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="space-y-4">
                  {" "}
                  <h3 className="text-[14px] font-bold text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" /> Subtarefas
                  </h3>{" "}
                  {subtasks.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">
                      Nenhuma subtarefa.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {" "}
                      {subtasks.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center gap-3 p-3 rounded-[12px] bg-muted/10 border border-border/40"
                        >
                          {" "}
                          <div
                            className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center border",
                              st.completed
                                ? "bg-primary border-primary text-white"
                                : "border-muted-foreground/30",
                            )}
                          >
                            {" "}
                            {st.completed && <Check className="w-3 h-3" />}{" "}
                          </div>{" "}
                          <span
                            className={cn(
                              "text-[14px] font-medium",
                              st.completed
                                ? "line-through text-muted-foreground"
                                : "text-foreground",
                            )}
                          >
                            {st.title}
                          </span>{" "}
                        </div>
                      ))}{" "}
                    </div>
                  )}{" "}
                </div>{" "}
                <div className="space-y-4">
                  {" "}
                  <h3 className="text-[14px] font-bold text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Histórico e
                    Comentários
                  </h3>{" "}
                  <p className="text-[13px] text-muted-foreground">
                    Nenhum histórico recente.
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          )}{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
    </div>
  );
}
