import React, { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { isProductionOverdue, formatLote, calcProducaoFinanceiro } from "../lib/erpUtils";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../components/ThemeProvider";
import { motion } from "motion/react";
import {
  Factory,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  Scissors,
  TrendingUp,
  DollarSign,
  LayoutDashboard,
  CalendarDays,
} from "lucide-react";
import {
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
} from "recharts";
import { PageHeader } from "../components/PageHeader";
import { formatCurrency, cn } from "../lib/utils";
import { useNavigate } from "react-router";
import { format, parseISO } from "date-fns";
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
export default function DashboardConfeccao() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [hideValues, setHideValues] = useState(false);
  const isDark = theme === "dark";
  const cCard = isDark ? "#181B24" : "#FFFFFF";
  const cText = isDark ? "#FFFFFF" : "#111827";
  const cTextSec = isDark ? "#A5ADBD" : "#6B7280";
  const cPrimary = "#6D4AFF";
  const cBorder = isDark ? "#2A2F3D" : "#E5E7EB";
  const [producoes, setProducoes] = useState<any[]>([]);
  const [costureiras, setCostureiras] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const unsubPromises = [
      onSnapshot(
        query(collection(db, "prod_producoes"), where("userId", "==", uid)),
        (s) => setProducoes(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(
        query(collection(db, "prod_costureiras"), where("userId", "==", uid)),
        (s) => setCostureiras(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
    ];
    setTimeout(() => setLoading(false), 500);
    return () => unsubPromises.forEach((unsub) => unsub());
  }, [user]);
  /* Derived Data */
  const totalLotes = producoes.length;
  const totalPecasCortadas = producoes.reduce(
    (acc, p) => acc + (Number(p.quantidadeTotal) || 0),
    0,
  );
  const totalPecasEntregues = producoes.reduce((acc, p) => {
    if (p.totalEntregue !== undefined) return acc + (Number(p.totalEntregue) || 0);
    const recs = p.recebimentos || [];
    return acc + recs.reduce((sum: number, r: any) => sum + (Number(r.quantidade) || 0), 0);
  }, 0);
  const pecasEmProducao = producoes.reduce((acc, p) => {
    if (p.totalPendente !== undefined) return acc + (Number(p.totalPendente) || 0);
    const totalQtd = Number(p.quantidadeTotal) || 0;
    const ent = p.totalEntregue !== undefined ? Number(p.totalEntregue) : 0;
    return acc + Math.max(0, totalQtd - ent);
  }, 0);
  const pgtoPendente = producoes.reduce((acc, p) => {
    const fin = calcProducaoFinanceiro(p);
    return acc + fin.saldoPendenteLote;
  }, 0);
  const costuraPendente = producoes.reduce((acc, p) => {
    const fin = calcProducaoFinanceiro(p);
    return acc + fin.saldoCostura;
  }, 0);
  const prodAtrasadas = producoes.filter((p) => {
    const pendente = p.totalPendente !== undefined ? Number(p.totalPendente) : Math.max(0, (Number(p.quantidadeTotal) || 0) - (Number(p.totalEntregue) || 0));
    return p.statusProducao !== "Finalizado" && isProductionOverdue(p.dataPrevisao, pendente);
  });

  const taxaEficiencia = totalPecasCortadas > 0 ? (totalPecasEntregues / totalPecasCortadas) * 100 : 0;

  /* Ranking de costureiras */
  const rankingCostureiras = costureiras
    .map((c) => {
      const prodsDaCostureira = producoes.filter(
        (p) => p.costureiraId === c.id || p.costureiraNome === c.nome,
      );
      const entreguesPorEla = prodsDaCostureira.reduce(
        (acc, p) => acc + (Number(p.totalEntregue) || (p.recebimentos ? p.recebimentos.reduce((s: number, r: any) => s + (Number(r.quantidade) || 0), 0) : 0)),
        0,
      );
      const valorGanho = prodsDaCostureira.reduce((acc, p) => {
        if (p.totalPagoCostura !== undefined) return acc + Number(p.totalPagoCostura);
        const pags = p.pagamentos || p.pagamentosCostura || [];
        return acc + pags.filter((pg: any) => !pg.categoria || pg.categoria === "Costura").reduce((s: number, pg: any) => s + (Number(pg.valor) || 0), 0);
      }, 0);
      return { ...c, entreguesPorEla, valorGanho };
    })
    .sort((a, b) => b.entreguesPorEla - a.entreguesPorEla)
    .slice(0, 5);

  /* Weekly Evolution Data */
  const weeklyProductionData = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    return [1, 2, 3, 4, 5].map((wNum) => {
      let previsto = 0;
      let entregue = 0;
      let pendente = 0;
      producoes.forEach((p) => {
        let pDate: Date | null = null;
        if (p.dataPrevisao) {
          try { pDate = parseISO(p.dataPrevisao); } catch { pDate = null; }
        } else if (p.createdAt) {
          pDate = new Date(p.createdAt?.toMillis ? p.createdAt.toMillis() : p.createdAt);
        }
        if (pDate && pDate.getFullYear() === curYear && pDate.getMonth() === curMonth) {
          const day = pDate.getDate();
          const batchWeek = Math.min(5, Math.ceil(day / 7));
          if (batchWeek === wNum) {
            previsto += Number(p.quantidadeTotal) || 0;
            const pEntregue = Number(p.totalEntregue) || 0;
            entregue += pEntregue;
            pendente += p.totalPendente !== undefined ? Number(p.totalPendente) : Math.max(0, (Number(p.quantidadeTotal) || 0) - pEntregue);
          }
        }
      });
      return { name: `Semana ${wNum}`, previsto, entregue, pendente };
    });
  }, [producoes]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7FB] dark:bg-[#0F1117]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <LayoutDashboard className="w-10 h-10 text-[#6D4AFF] animate-bounce" />
          <span className="text-[#6B7280] dark:text-[#A5ADBD] font-medium">
            Carregando Dashboard de Confecção...
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full min-h-screen pb-24 transition-colors duration-300 bg-background text-foreground font-sans">
      {" "}
      <PageHeader
        title="Dashboard de Confecção"
        subtitle="Métricas avançadas e acompanhamento detalhado do departamento de produção."
        hideValues={hideValues}
        onToggleHideValues={() => setHideValues(!hideValues)}
      />{" "}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-none mx-auto px-6 lg:px-10 mt-6 flex flex-col gap-6"
      >
        {" "}
        {/* KPIs Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {" "}
          <CardKPI
            icon={Scissors}
            title="Total de Peças Cortadas"
            value={totalPecasCortadas}
            hide={hideValues}
          />{" "}
          <CardKPI
            icon={Clock}
            title="Pendente para Entrega"
            value={pecasEmProducao}
            hide={hideValues}
          />{" "}
          <CardKPI
            icon={CheckCircle2}
            title="Total Já Entregue"
            value={totalPecasEntregues}
            hide={hideValues}
          />{" "}
          <CardKPI
            icon={DollarSign}
            title="Pendente de Pagamento"
            value={costuraPendente}
            hide={hideValues}
            isCurrency
            subtitle={
              pgtoPendente > 0 && pgtoPendente !== costuraPendente
                ? `Costura (Lote: ${formatCurrency(pgtoPendente, false)})`
                : "Apenas Costura"
            }
          />{" "}
        </div>{" "}
        {/* Gráficos de Produção */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {" "}
          {/* Eficiência da Produção (Pie Chart) */}
          <div className="lg:col-span-1 premium-card p-6 flex flex-col">
            {" "}
            <div className="flex items-center justify-between mb-6">
              {" "}
              <h3 className="text-[16px] font-semibold text-foreground">
                Eficiência (Mês)
              </h3>{" "}
            </div>{" "}
            <div className="flex-1 flex flex-col items-center justify-center relative min-h-[220px]">
              {" "}
              <ResponsiveContainer width="100%" height="100%">
                {" "}
                <PieChart>
                  {" "}
                  <Pie
                    data={[
                      { value: Math.min(100, Math.max(0, taxaEficiencia)) },
                      { value: Math.max(0, 100 - taxaEficiencia) },
                    ]}
                    innerRadius={75}
                    outerRadius={95}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                    animationDuration={1500}
                  >
                    {" "}
                    <Cell fill={cPrimary} />{" "}
                    <Cell fill={isDark ? "#2A2F3D" : "#F3F4F6"} />{" "}
                  </Pie>{" "}
                </PieChart>{" "}
              </ResponsiveContainer>{" "}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                {" "}
                <span className="text-[38px] font-black text-foreground leading-none mb-1">
                  {taxaEficiencia.toFixed(0)}%
                </span>{" "}
                <span className="text-[12px] font-medium text-muted-foreground">
                  de eficiência
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <p className="text-[13px] font-medium text-center text-muted-foreground mt-4">
              Meta de eficiência: 90%
            </p>{" "}
          </div>{" "}
          {/* Evolução Semanal da Produção (Bar Chart) */}
          <div className="lg:col-span-2 premium-card p-6 flex flex-col">
            {" "}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              {" "}
              <h3 className="text-[16px] font-semibold text-foreground">
                Evolução Semanal da Produção
              </h3>{" "}
              <div className="flex items-center gap-4 text-[13px] font-medium text-muted-foreground">
                {" "}
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: "#D8B4E2" }}
                  ></span>{" "}
                  Previsto
                </div>{" "}
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cPrimary }}
                  ></span>{" "}
                  Entregue
                </div>{" "}
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: isDark ? "#4B5563" : "#D1D5DB" }}
                  ></span>{" "}
                  Pendente
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex-1 w-full min-h-[250px]">
              {" "}
              <ResponsiveContainer width="100%" height="100%">
                {" "}
                <BarChart
                  data={weeklyProductionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barGap={4}
                  barSize={14}
                >
                  {" "}
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={cBorder}
                    opacity={0.5}
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
                    tickFormatter={(val) => `${val / 1000}k`}
                  />{" "}
                  <Tooltip
                    cursor={{ fill: cBorder, opacity: 0.2 }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: `1px solid ${cBorder}`,
                      background: cCard,
                      color: cText,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                      padding: "12px",
                      fontSize: "13px",
                    }}
                  />{" "}
                  <Bar
                    dataKey="previsto"
                    fill="#D8B4E2"
                    radius={[4, 4, 0, 0]}
                  />{" "}
                  <Bar
                    dataKey="entregue"
                    fill={cPrimary}
                    radius={[4, 4, 0, 0]}
                  />{" "}
                  <Bar
                    dataKey="pendente"
                    fill={isDark ? "#4B5563" : "#D1D5DB"}
                    radius={[4, 4, 0, 0]}
                  />{" "}
                </BarChart>{" "}
              </ResponsiveContainer>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Tabelas Inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {" "}
          {/* Produções Atrasadas (Tabela Detalhada do Histórico) */}
          <div className="premium-card p-6 flex flex-col min-h-[350px]">
            {" "}
            <div className="flex items-center justify-between mb-6">
              {" "}
              <h3 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
                {" "}
                <AlertTriangle className="w-5 h-5 text-red-500" /> Produções
                Atrasadas{" "}
              </h3>{" "}
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[12px] font-bold">
                {" "}
                {prodAtrasadas.length} Atrasos{" "}
              </span>{" "}
            </div>{" "}
            <div className="w-full overflow-x-auto">
              {" "}
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="pb-3 text-[12px] font-semibold text-muted-foreground tracking-wider uppercase">
                      Produção
                    </th>
                    <th className="pb-3 text-[12px] font-semibold text-muted-foreground tracking-wider uppercase">
                      Lote
                    </th>
                    <th className="pb-3 text-[12px] font-semibold text-muted-foreground tracking-wider uppercase">
                      Pendente
                    </th>
                    <th className="pb-3 text-[12px] font-semibold text-muted-foreground tracking-wider uppercase">
                      Prevista
                    </th>
                    <th className="pb-3 text-[12px] font-semibold text-muted-foreground tracking-wider uppercase text-right">
                      Atraso
                    </th></tr></thead>
                <tbody>
                  {prodAtrasadas.map((p, i) => {
                    const daysLate = Math.floor(
                      (new Date().getTime() -
                        new Date(p.dataPrevisao).getTime()) /
                        (1000 * 3600 * 24),
                    );
                    return (
                      <tr
                        key={i}
                        className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 text-[13px] font-bold text-foreground">
                          {p.produtoNome}
                        </td>
                        <td className="py-4 text-[13px] font-medium text-muted-foreground">
                          {formatLote(p.lote) || (p.id ? `L${p.id.slice(0, 4).toUpperCase()}` : "L0001")}
                        </td>
                        <td className="py-4 text-[13px] font-medium text-foreground">
                          {p.totalPendente !== undefined ? p.totalPendente : Math.max(0, (Number(p.quantidadeTotal) || 0) - (Number(p.totalEntregue) || 0))} un
                        </td>
                        <td className="py-4 text-[13px] font-medium text-foreground">
                          {format(parseISO(p.dataPrevisao), "dd/MM/yyyy")}
                        </td>
                        <td className="py-4 text-right">
                          {" "}
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-1 rounded text-[11px] font-bold border",
                              daysLate > 1
                                ? "bg-red-500/10 text-red-600 border-red-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20",
                            )}
                          >
                            {" "}
                            {daysLate === 0
                              ? "Hoje"
                              : `${daysLate} ${daysLate === 1 ? "dia" : "dias"}`}
                          </span>{" "}
                        </td></tr>
                    );
                  })}
                  {prodAtrasadas.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-[13px] text-muted-foreground"
                      >
                        Nenhuma produção atrasada.
                      </td></tr>
                  )}</tbody></table>{" "}
            </div>{" "}
          </div>{" "}
          {/* Ranking de Costureiras */}
          <div className="premium-card p-6 flex flex-col min-h-[350px]">
            {" "}
            <div className="flex items-center justify-between mb-6">
              {" "}
              <h3 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
                {" "}
                <Factory className="w-5 h-5 text-primary" /> Top Costureiras
                (Entregas Realizadas){" "}
              </h3>{" "}
            </div>{" "}
            <div className="w-full overflow-x-auto">
              {" "}
              <table className="w-full min-w-[400px] border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pb-3 pl-2">
                      Pos
                    </th>
                    <th className="text-left text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">
                      Nome
                    </th>
                    <th className="text-right text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">
                      Entregues
                    </th>
                    <th className="text-right text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pb-3 pr-2">
                      Valor Ganho
                    </th></tr></thead>
                <tbody>
                  {rankingCostureiras.map((c, i) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 pl-2">
                        {" "}
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold",
                            i === 0
                              ? "bg-amber-500/10 text-amber-500"
                              : i === 1
                                ? "bg-slate-400/10 text-slate-400"
                                : i === 2
                                  ? "bg-amber-700/10 text-amber-700"
                                  : "text-muted-foreground",
                          )}
                        >
                          {" "}
                          {i + 1}º{" "}
                        </span>{" "}
                      </td>
                      <td className="py-4 text-[14px] font-medium text-foreground">
                        {c.name}
                      </td>
                      <td className="py-4 text-right text-[14px] font-bold text-foreground">
                        {c.entreguesPorEla} un
                      </td>
                      <td className="py-4 text-right text-[14px] font-medium text-primary pr-2">
                        {" "}
                        {hideValues
                          ? "••••"
                          : formatCurrency(c.valorGanho, false)}
                      </td></tr>
                  ))}
                  {rankingCostureiras.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-[13px] text-muted-foreground"
                      >
                        Nenhuma entrega realizada.
                      </td></tr>
                  )}</tbody></table>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </motion.div>{" "}
    </div>
  );
}
function CardKPI({
  icon: Icon,
  title,
  value,
  hide,
  isCurrency,
  subtitle,
  className,
}: any) {
  return (
    <div
      className={cn(
        "premium-card flex flex-col justify-between p-6 overflow-hidden group",
        className,
      )}
    >
      {" "}
      <div className="flex flex-col gap-3 mb-6">
        {" "}
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          {" "}
          <Icon size={18} strokeWidth={2.5} />{" "}
        </div>{" "}
        <h3 className="text-[14px] font-semibold text-muted-foreground leading-tight">
          {title}
        </h3>{" "}
      </div>{" "}
      <div>
        {" "}
        <p className="text-[38px] font-bold tracking-tight text-foreground tracking-tight text-foreground leading-none mb-1 truncate">
          {" "}
          {hide
            ? "••••"
            : isCurrency
              ? formatCurrency(value, false)
              : value.toLocaleString("pt-BR")}
        </p>{" "}
        {subtitle && (
          <p className="text-[12px] font-medium text-muted-foreground mt-2 truncate">
            {subtitle}
          </p>
        )}
      </div>{" "}
    </div>
  );
}
