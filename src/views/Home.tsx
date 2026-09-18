import React, { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../components/ThemeProvider";
import { motion, AnimatePresence } from "motion/react";
import {
  DollarSign,
  Factory,
  RefreshCcw,
  ListTodo,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Eye,
  EyeOff,
  Building2,
  Bell,
  AlertCircle,
  Clock,
  Package,
  MoreHorizontal,
  LayoutDashboard,
  CalendarDays,
  ShoppingCart,
  Target,
  Users,
  Receipt,
  Coins,
  ArrowRight,
  MonitorSmartphone,
  Sun,
  Moon,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { Button } from "../components/ui/button";
import { PageHeader } from "../components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { formatCurrency, cn } from "../lib/utils";
import { useNavigate } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  format,
  parseISO,
  isAfter,
  isBefore,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [hideValues, setHideValues] = useState(false);
  const isDark = theme === "dark";
  const cBg = isDark ? "#0F1117" : "#F6F7FB";
  const cCard = isDark ? "#FFFFFF" : "#FFFFFF";
  const cCardDark = "#181B24";
  const cCardSec = isDark ? "#202430" : "#F8F9FB";
  const cText = isDark ? "#FFFFFF" : "#111827";
  const cTextSec = isDark ? "#A5ADBD" : "#6B7280";
  const cPrimary = "#6D4AFF";
  const cBorder = isDark ? "#2A2F3D" : "#E5E7EB";
  const cardBg = isDark ? cCardDark : cCard;
  const [periodo, setPeriodo] = useState("Este Mês");
  const [empresa, setEmpresa] = useState("Group NMZ Matriz");
  const [canal, setCanal] = useState("Todos os Canais");
  /*  Firebase Data States  */ const [producoes, setProducoes] = useState<
    any[]
  >([]);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<any[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<any[]>([]);
  const [salesGoals, setSalesGoals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const unsubPromises = [
      onSnapshot(
        query(collection(db, "prod_producoes"), where("userId", "==", uid)),
        (s) => setProducoes(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(
        query(
          collection(db, "prod_fixed_expenses"),
          where("userId", "==", uid),
        ),
        (s) => setFixedExpenses(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(
        query(
          collection(db, "prod_variable_expenses"),
          where("userId", "==", uid),
        ),
        (s) =>
          setVariableExpenses(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(
        query(
          collection(db, "prod_accounts_payable"),
          where("userId", "==", uid),
        ),
        (s) =>
          setAccountsPayable(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(
        query(collection(db, "prod_sales_goals"), where("userId", "==", uid)),
        (s) => setSalesGoals(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(
        query(collection(db, "prod_tasks"), where("userId", "==", uid)),
        (s) => setTasks(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(
        query(collection(db, "prod_returns"), where("userId", "==", uid)),
        (s) => setReturns(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(
        query(collection(db, "prod_companies"), where("userId", "==", uid)),
        (s) => setCompanies(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(
        query(
          collection(db, "prod_sales_channels"),
          where("userId", "==", uid),
        ),
        (s) => setChannels(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
    ];
    setTimeout(() => setLoading(false), 500);
    return () => unsubPromises.forEach((unsub) => unsub());
  }, [user]);
  /* Derived Data - Financeiro */ const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const isCurrentMonth = (dateString: string | undefined) => {
    if (!dateString) return true;
    /*  fallback */ const d = new Date(dateString + "T00:00:00");
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };
  const totalFixed = fixedExpenses
    .filter((e) => isCurrentMonth(e.dueDate) && e.type !== "pessoal")
    .reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const totalVariable = variableExpenses
    .filter((e) => isCurrentMonth(e.date) && e.type !== "pessoal")
    .reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const accountsPending = accountsPayable.filter((a) => a.status !== "Pago");
  const totalAccountsPayable = accountsPending.reduce(
    (acc, curr) => acc + (Number(curr.value) || 0),
    0,
  );
  const qtyAccountsPayable = accountsPending.length;
  let faturamento = 0;
  let totalMeta = 0;
  salesGoals.forEach((g) => {
    totalMeta += Number(g.goalValue) || 0;
    (g.weeklyResults || []).forEach((w: any) => {
      faturamento += Number(w.value) || 0;
    });
  });
  const percAtingido = totalMeta > 0 ? (faturamento / totalMeta) * 100 : 0;
  const faltante = Math.max(0, totalMeta - faturamento);
  /*  Produção  */ const totalPecasMes = producoes.reduce(
    (acc, p) => acc + (Number(p.quantidadeTotal) || 0),
    0,
  );
  const pendenteEntrega = producoes
    .filter((p) => p.status !== "Finalizado")
    .reduce((acc, p) => acc + (Number(p.quantidadeTotal) || 0), 0);
  const totalEntregue = totalPecasMes - pendenteEntrega;
  const pendentePgto = producoes
    .filter((p) => p.statusPgto !== "Pago")
    .reduce((acc, p) => acc + Number(p.valorTotal || 0), 0);
  let prodAtrasadas = producoes.filter(
    (p) =>
      p.status !== "Finalizado" &&
      p.dataPrevisao &&
      new Date(p.dataPrevisao) < new Date(),
  );
  /*  Devoluções  */ const totalReturnsItems = returns.length;
  const returnFreightCost = returns.reduce(
    (acc, r) => acc + (Number(r.freightCost) || 0),
    0,
  );
  const returnOrderValue = returns.reduce(
    (acc, r) => acc + (Number(r.orderValue) || 0),
    0,
  );
  const returnTotalCost = returnFreightCost + returnOrderValue;
  /*  Tarefas  */ const tarefasPendentes = tasks.filter(
    (t) => t.status === "todo",
  ).length;
  const tarefasAndamento = tasks.filter(
    (t) => t.status === "in-progress",
  ).length;
  const tarefasConcluidas = tasks.filter((t) => t.status === "done").length;
  const tarefasUrgentes = tasks.filter(
    (t) => t.priority === "Alta" && t.status !== "done",
  ).length;
  const tarefasAtrasadas = tasks.filter(
    (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date(),
  ).length;
  const todayStr = new Date().toISOString().split("T")[0];
  const tarefasVencemHoje = tasks.filter(
    (t) =>
      t.status !== "done" && t.dueDate && t.dueDate.split("T")[0] === todayStr,
  ).length;
  let nextTasks = tasks
    .filter((t) => t.status !== "done" && t.dueDate)
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )
    .slice(0, 4);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7FB] dark:bg-[#0F1117]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <LayoutDashboard className="w-10 h-10 text-[#6D4AFF] animate-bounce" />
          <span className="text-[#6B7280] dark:text-[#A5ADBD] font-medium">
            Carregando Dashboard Executivo...
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full min-h-screen pb-24 transition-colors duration-300 bg-background text-foreground font-sans">
      {" "}
      <PageHeader
        title="Dashboard Executivo"
        subtitle="Visão geral da operação financeira, produção, devoluções, tarefas e alertas."
        hideValues={hideValues}
        onToggleHideValues={() => setHideValues(!hideValues)}
        filters={
          <div className="flex gap-2 flex-wrap sm:flex-nowrap items-center">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[125px] sm:w-[130px] h-10 rounded-xl premium-input text-[13px] font-semibold shadow-sm border bg-white dark:bg-[#181B24] dark:border-[#2A2F3D] shrink-0">
                <CalendarDays className="w-4 h-4 mr-2 text-primary shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-0 shadow-xl dark:bg-[#181B24]">
                <SelectItem value="Este Mês">Este Mês</SelectItem>
                <SelectItem value="Semana">Esta Semana</SelectItem>
              </SelectContent>
            </Select>

            <Select value={empresa} onValueChange={setEmpresa}>
              <SelectTrigger className="w-[170px] sm:w-[190px] h-10 rounded-xl premium-input text-[13px] font-semibold shadow-sm border bg-white dark:bg-[#181B24] dark:border-[#2A2F3D] shrink-0">
                <Building2 className="w-4 h-4 mr-2 text-primary shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-0 shadow-xl dark:bg-[#181B24]">
                <SelectItem value="Group NMZ Matriz">
                  Group NMZ Matriz
                </SelectItem>
                <SelectItem value="Todas">Todas Empresas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={canal} onValueChange={setCanal}>
              <SelectTrigger className="w-[145px] sm:w-[160px] h-10 rounded-xl premium-input text-[13px] font-semibold shadow-sm border bg-white dark:bg-[#181B24] dark:border-[#2A2F3D] shrink-0">
                <MonitorSmartphone className="w-4 h-4 mr-2 text-primary shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-0 shadow-xl dark:bg-[#181B24]">
                <SelectItem value="Todos os Canais">
                  Todos os Canais
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />{" "}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-none mx-auto px-6 lg:px-10 mt-6 flex flex-col gap-10"
      >
        {" "}
        {/* FINANCEIRO */}{" "}
        <section className="flex flex-col">
          {" "}
          <SectionHeader
            title="Financeiro"
            subtitle="Resumo de despesas, faturamento, metas e compromissos do período."
            linkText="Ver relatório"
            linkUrl="/financeiro/relatorios"
          />{" "}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {" "}
            <CardKPI
              icon={CalendarDays}
              title="Despesas Fixas"
              value={totalFixed}
              hide={hideValues}
              isCurrency
            />{" "}
            <CardKPI
              icon={TrendingDown}
              title="Desp. Variáveis"
              value={totalVariable}
              hide={hideValues}
              isCurrency
            />{" "}
            <CardKPI
              icon={Receipt}
              title="Contas a Pagar"
              value={totalAccountsPayable}
              hide={hideValues}
              isCurrency
              subtitle={`${qtyAccountsPayable} títulos`}
            />{" "}
            <CardKPI
              icon={Coins}
              title="Faturamento"
              value={faturamento}
              hide={hideValues}
              isCurrency
            />{" "}
            <CardKPI
              icon={Target}
              title="Meta do Período"
              value={totalMeta}
              hide={hideValues}
              isCurrency
            />{" "}
          </div>{" "}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {" "}
            <div className="lg:col-span-2 premium-card p-6 flex flex-col min-h-[360px]">
              {" "}
              <div className="flex flex-wrap items-center justify-between mb-6 gap-2">
                {" "}
                <h3 className="text-[16px] font-semibold text-foreground">
                  Faturamento vs Meta
                </h3>{" "}
                <div className="flex items-center gap-4 text-[13px] font-medium text-muted-foreground">
                  {" "}
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>{" "}
                    Realizado
                  </div>{" "}
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-[2px] border-b-2 border-dashed border-muted-foreground"></span>{" "}
                    Meta
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex-1 w-full min-h-[250px]">
                {" "}
                <ResponsiveContainer width="100%" height="100%">
                  {" "}
                  <LineChart
                    data={[
                      { name: "Semana 1", real: 0, meta: 0 },
                      { name: "Semana 2", real: 0, meta: 0 },
                      { name: "Semana 3", real: 0, meta: 0 },
                      { name: "Semana 4", real: 0, meta: 0 },
                      { name: "Semana 5", real: 0, meta: 0 },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    {" "}
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={cBorder}
                      opacity={0.4}
                    />{" "}
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      fontWeight={500}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: cTextSec }}
                      dy={10}
                    />{" "}
                    <YAxis
                      fontSize={12}
                      fontWeight={500}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: cTextSec }}
                      tickFormatter={(val) => `R$ ${val / 1000}k`}
                    />{" "}
                    <Tooltip
                      cursor={{
                        stroke: cBorder,
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                      contentStyle={{
                        borderRadius: "16px",
                        border: `1px solid ${cBorder}`,
                        background: cardBg,
                        color: cText,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                        padding: "12px",
                        fontSize: "13px",
                      }}
                    />{" "}
                    <Line
                      type="monotone"
                      dataKey="real"
                      stroke={cPrimary}
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: cPrimary,
                        strokeWidth: 2,
                        stroke: cardBg,
                      }}
                      activeDot={{ r: 8 }}
                      animationDuration={1000}
                    />{" "}
                    <Line
                      type="monotone"
                      dataKey="meta"
                      stroke={cTextSec}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      opacity={0.5}
                      animationDuration={1000}
                    />{" "}
                  </LineChart>{" "}
                </ResponsiveContainer>{" "}
              </div>{" "}
            </div>{" "}
            <div className="lg:col-span-1 premium-card p-6 flex flex-col min-h-[360px]">
              {" "}
              <div className="flex items-center justify-between mb-6">
                {" "}
                <h3 className="text-[16px] font-semibold text-foreground">
                  Progresso da Meta
                </h3>{" "}
              </div>{" "}
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
                {" "}
                <ResponsiveContainer width="100%" height="100%">
                  {" "}
                  <PieChart>
                    {" "}
                    <Pie
                      data={[
                        { value: percAtingido },
                        { value: 100 - percAtingido },
                      ]}
                      innerRadius={70}
                      outerRadius={90}
                      dataKey="value"
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                      animationDuration={1500}
                    >
                      {" "}
                      <Cell fill={cPrimary} />{" "}
                      <Cell fill={cBorder} opacity={0.5} />{" "}
                    </Pie>{" "}
                  </PieChart>{" "}
                </ResponsiveContainer>{" "}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                  {" "}
                  <span className="text-[36px] font-bold text-foreground leading-none mb-1">
                    {percAtingido.toFixed(0)}%
                  </span>{" "}
                  <span className="text-[12px] font-medium text-muted-foreground">
                    Concluído
                  </span>{" "}
                </div>{" "}
              </div>{" "}
              <div className="mt-4 text-center">
                {" "}
                <p className="text-[20px] font-bold text-foreground">
                  {hideValues ? "••••" : formatCurrency(faltante, false)}
                </p>{" "}
                <p className="text-[13px] font-medium text-muted-foreground mt-1">
                  Faltando para bater a meta
                </p>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        {/* PRODUÇÃO */}{" "}
        <section className="flex flex-col">
          {" "}
          <SectionHeader
            title="Produção"
            subtitle="Acompanhamento de peças produzidas, entregas e pagamentos."
            linkText="Ver produção"
            linkUrl="/producao"
          />{" "}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {" "}
            <CardKPI
              icon={Package}
              title="Peças Cortadas (Mês)"
              value={totalPecasMes}
              hide={hideValues}
            />{" "}
            <CardKPI
              icon={CheckCircle2}
              title="Peças Entregues"
              value={totalEntregue}
              hide={hideValues}
            />{" "}
            <CardKPI
              icon={AlertCircle}
              title="Pendente Entrega"
              value={pendenteEntrega}
              hide={hideValues}
            />{" "}
            <CardKPI
              icon={Receipt}
              title="Pendente Pagamento"
              value={pendentePgto}
              hide={hideValues}
              isCurrency
            />{" "}
          </div>{" "}
        </section>{" "}
        {/* DEVOLUÇÕES & TAREFAS (Split row) */}{" "}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {" "}
          <section className="flex flex-col">
            {" "}
            <SectionHeader
              title="Devoluções"
              subtitle="Resumo de itens devolvidos e impacto financeiro."
              linkText="Ver devoluções"
              linkUrl="/devolucoes/controle"
            />{" "}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {" "}
              <CardKPI
                icon={AlertTriangle}
                title="Devoluções (Mês)"
                value={totalReturnsItems}
                hide={hideValues}
                compact
              />{" "}
              <CardKPI
                icon={TrendingDown}
                title="Custo de Frete"
                value={returnFreightCost}
                hide={hideValues}
                isCurrency
                trendUpIsGood={false}
                compact
              />{" "}
              <CardKPI
                icon={Coins}
                title="Custo Produtos"
                value={returnOrderValue}
                hide={hideValues}
                isCurrency
                trendUpIsGood={false}
                compact
              />{" "}
            </div>{" "}
          </section>{" "}
          <section className="flex flex-col">
            {" "}
            <SectionHeader
              title="Tarefas"
              subtitle="Acompanhamento das atividades da operação."
              linkText="Ver tarefas"
              linkUrl="/performance/tarefas"
            />{" "}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {" "}
              <CardTarefa label="Pendentes" val={tarefasPendentes} />{" "}
              <CardTarefa label="Em andamento" val={tarefasAndamento} />{" "}
              <CardTarefa label="Urgentes" val={tarefasUrgentes} urgent />{" "}
              <CardTarefa label="Atrasadas" val={tarefasAtrasadas} urgent />{" "}
              <CardTarefa label="Vencem hoje" val={tarefasVencemHoje} />{" "}
              <CardTarefa label="Concluídas" val={tarefasConcluidas} />{" "}
            </div>{" "}
          </section>{" "}
        </div>{" "}
        {/* ALERTAS */}{" "}
        <section className="flex flex-col">
          {" "}
          <SectionHeader
            title="Atenção Necessária"
            subtitle="Pontos que precisam de ação imediata."
            linkText="Ver todos"
            linkUrl="#"
          />{" "}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {" "}
            <AlertList
              icon={Clock}
              title="Produções Atrasadas"
              count={prodAtrasadas.length}
              items={prodAtrasadas.slice(0, 4).map((p: any) => ({
                title: p.produtoNome,
                desc: p.id ? `Lote ${p.id.slice(0, 4)}` : "Sem lote",
                value: `${p.quantidadeTotal} un`,
              }))}
              action="Ver atrasos"
              actionUrl="/producao"
            />{" "}
            <AlertList
              icon={Receipt}
              title="Próximos Pagamentos"
              count={accountsPending.slice(0, 4).length}
              items={accountsPending.slice(0, 4).map((a: any) => ({
                title: a.name,
                value: formatCurrency(Number(a.value), false),
                desc: a.dueDate
                  ? new Date(a.dueDate).toLocaleDateString("pt-BR")
                  : "Sem data",
              }))}
              action="Ver pagamentos"
              actionUrl="/financeiro/contas-pagar"
            />{" "}
            <AlertList
              icon={CalendarDays}
              title="Tarefas Vencendo"
              count={nextTasks.length}
              items={nextTasks.map((t: any) => ({
                title: t.title,
                desc: t.assignee || "Sem responsável",
                value: t.dueDate
                  ? new Date(t.dueDate).toLocaleDateString("pt-BR")
                  : "Sem data",
              }))}
              action="Ver tarefas"
              actionUrl="/performance/tarefas"
            />{" "}
          </div>{" "}
        </section>{" "}
      </motion.div>{" "}
    </div>
  );
}
/*  --- DESIGN SYSTEM SUBCOMPONENTS --- */ function SectionHeader({
  title,
  subtitle,
  linkText,
  linkUrl,
}: any) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-center justify-between mb-5 mt-2 gap-4">
      {" "}
      <div>
        {" "}
        <h2 className="text-[28px] font-semibold tracking-tight text-foreground">
          {title}
        </h2>{" "}
        <p className="text-[13px] font-medium text-muted-foreground mt-1">
          {subtitle}
        </p>{" "}
      </div>{" "}
      <Button
        variant="ghost"
        className="h-9 px-4 rounded-xl text-[13px] font-semibold text-primary hover:bg-primary/5 hover:text-primary transition-colors group shadow-sm bg-white dark:bg-card border border-border"
        onClick={() => navigate(linkUrl)}
      >
        {" "}
        {linkText}{" "}
        <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />{" "}
      </Button>{" "}
    </div>
  );
}
function CardKPI({
  icon: Icon,
  title,
  value,
  hide,
  isCurrency,
  trend,
  trendUpIsGood = true,
  subtitle,
  compact,
  className,
}: any) {
  /*  Ajuste do tamanho da fonte dependendo do modo (compact) e se é moeda, para evitar overflow.  */ const valueFontSize =
    compact
      ? "text-[22px]"
      : isCurrency
        ? "text-[22px] lg:text-[24px]"
        : "text-[28px]";
  return (
    <div
      className={cn(
        "premium-card flex flex-col justify-between group overflow-hidden",
        compact ? "p-5" : "p-6",
        className,
      )}
    >
      {" "}
      <div className={cn("flex flex-col gap-3", compact ? "mb-3" : "mb-6")}>
        {" "}
        <div
          className={cn(
            "rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
            compact ? "w-9 h-9" : "w-10 h-10",
          )}
        >
          {" "}
          <Icon size={18} strokeWidth={2.5} />{" "}
        </div>{" "}
        <h3 className="text-[14px] font-semibold text-muted-foreground leading-tight truncate">
          {title}
        </h3>{" "}
      </div>{" "}
      <div>
        {" "}
        <p
          className={cn(
            "font-bold tracking-tight text-foreground leading-none mb-1 truncate",
            valueFontSize,
          )}
        >
          {" "}
          {hide
            ? "••••"
            : isCurrency
              ? formatCurrency(value, false)
              : value.toLocaleString("pt-BR")}{" "}
        </p>{" "}
        {trend !== undefined && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {" "}
            <span
              className={cn(
                "flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-lg",
                (trend > 0 && trendUpIsGood) || (trend < 0 && !trendUpIsGood)
                  ? "bg-green-500/10 text-green-600"
                  : "bg-red-500/10 text-red-600",
              )}
            >
              {" "}
              {trend > 0 ? (
                <TrendingUp size={12} strokeWidth={3} />
              ) : (
                <TrendingDown size={12} strokeWidth={3} />
              )}{" "}
              {Math.abs(trend)}%{" "}
            </span>{" "}
            {!compact && (
              <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                vs mês passado
              </span>
            )}{" "}
          </div>
        )}{" "}
        {subtitle && (
          <div className="flex flex-wrap items-center gap-1 mt-2">
            {" "}
            <span className="text-[12px] font-bold text-foreground truncate">
              {subtitle.split(" ")[0]}
            </span>{" "}
            <span className="text-[11px] font-medium text-muted-foreground truncate">
              {subtitle.split(" ").slice(1).join(" ")}
            </span>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
function CardTarefa({ label, val, urgent }: any) {
  return (
    <div className="premium-card p-3 flex flex-col items-center justify-center transition-all duration-300 hover:bg-muted/30 group col-span-1 min-h-[100px]">
      {" "}
      <p className="text-[11px] font-semibold text-muted-foreground text-center mb-2 leading-tight group-hover:text-foreground transition-colors">
        {label}
      </p>{" "}
      <p
        className={cn(
          "text-[24px] font-bold leading-none",
          urgent ? "text-red-500" : "text-foreground",
        )}
      >
        {val}
      </p>{" "}
    </div>
  );
}
function AlertList({
  icon: Icon,
  title,
  count,
  items,
  action,
  actionUrl,
}: any) {
  const navigate = useNavigate();
  return (
    <div className="premium-card flex flex-col p-6">
      {" "}
      <div className="flex items-center justify-between mb-6">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {" "}
            <Icon size={20} strokeWidth={2.5} />{" "}
          </div>{" "}
          <h3 className="text-[16px] font-semibold text-foreground tracking-tight">
            {title}
          </h3>{" "}
        </div>{" "}
        {count > 0 && (
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[12px] font-bold flex items-center justify-center">
            {" "}
            {count}{" "}
          </span>
        )}{" "}
      </div>{" "}
      <div className="flex flex-col gap-4 flex-1">
        {" "}
        {items.length > 0 ? (
          items.map((item: any, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center group cursor-pointer"
            >
              {" "}
              <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
                {" "}
                <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {item.title}
                </p>{" "}
                <p className="text-[12px] font-medium text-muted-foreground truncate">
                  {item.desc}
                </p>{" "}
              </div>{" "}
              <p className="text-[13px] font-semibold text-foreground whitespace-nowrap">
                {item.value}
              </p>{" "}
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60">
            {" "}
            <CheckCircle2 className="w-8 h-8 mb-2" />{" "}
            <p className="text-[13px] font-medium">Tudo em dia!</p>{" "}
          </div>
        )}{" "}
      </div>{" "}
      <Button
        onClick={() => navigate(actionUrl || "#")}
        variant="ghost"
        className="w-full mt-6 text-[13px] font-semibold h-10 text-primary hover:bg-primary/5 rounded-xl transition-colors"
      >
        {" "}
        {action}{" "}
      </Button>{" "}
    </div>
  );
}
