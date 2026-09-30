import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Download,
  TrendingUp,
  Scissors,
  DollarSign,
  Activity,
  Percent,
  Filter,
  Target,
  Calendar,
  Package as PackageIcon,
  TrendingDown,
  Clock,
  RotateCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, getDocs, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import autoTable from "jspdf-autotable";
export default function Relatorios() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [producoes, setProducoes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [costureiras, setCostureiras] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  /*  Filters */ const [filterPeriodo, setFilterPeriodo] = useState("Todos");
  const [filterCostureira, setFilterCostureira] = useState("Todos");
  const [filterProduto, setFilterProduto] = useState("Todos");
  const reportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!user) return;
    const unsubProd = onSnapshot(
      query(collection(db, "prod_producoes"), where("userId", "==", user.uid)),
      (snap) => {
        setProducoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    const unsubProdut = onSnapshot(
      query(collection(db, "prod_produtos"), where("userId", "==", user.uid)),
      (snap) => setProdutos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubCost = onSnapshot(
      query(collection(db, "prod_costureiras"), where("userId", "==", user.uid)),
      (snap) => setCostureiras(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubCompras = onSnapshot(
      query(collection(db, "prod_compras"), where("userId", "==", user.uid)),
      (snap) => setCompras(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubProd();
      unsubProdut();
      unsubCost();
      unsubCompras();
    };
  }, [user]);
  const filteredProducoes = useMemo(() => {
    return producoes.filter((p) => {
      if (filterCostureira !== "Todos" && p.costureiraId !== filterCostureira)
        return false;
      if (filterProduto !== "Todos" && p.produtoId !== filterProduto)
        return false;
      if (filterPeriodo !== "Todos" && p.createdAt) {
        const d = new Date(
          p.createdAt?.toMillis ? p.createdAt.toMillis() : p.createdAt,
        );
        const now = new Date();
        const inicio = new Date();
        inicio.setHours(0, 0, 0, 0);
        const fim = new Date();
        fim.setHours(23, 59, 59, 999);
        if (filterPeriodo === "Mês Atual") {
          inicio.setDate(1);
        } else if (filterPeriodo === "Mês Passado") {
          inicio.setMonth(inicio.getMonth() - 1);
          inicio.setDate(1);
          fim.setMonth(fim.getMonth());
          fim.setDate(0);
        } else if (filterPeriodo === "Esta Semana") {
          const day = inicio.getDay();
          inicio.setDate(inicio.getDate() - day);
        } else if (filterPeriodo === "Ultimos 3 Meses") {
          inicio.setMonth(inicio.getMonth() - 3);
        }
        if (d < inicio || d > fim) return false;
      }
      return true;
    });
  }, [producoes, filterCostureira, filterProduto, filterPeriodo]);
  const metricsCompras = useMemo(() => {
    let gastosAtrasados = 0;
    let gastosNoPrazo = 0;
    let totalPago = 0;
    const pendingList: any[] = [];
    compras.forEach((c) => {
      if (c.tipoPagamento === "a_vista") {
        const valor = parseFloat(c.valorTotal) || 0;
        if (c.statusPagamento === "pago") {
          totalPago += valor;
        } else {
          pendingList.push({
            ...c,
            valor,
            diasAtraso: 0,
            descOriginal: c.descricao,
          });
          gastosNoPrazo += valor;
        }
      } else if (c.parcelas && c.parcelas.length > 0) {
        c.parcelas.forEach((p: any) => {
          const valor = parseFloat(p.valor) || 0;
          if (p.status === "pago") {
            totalPago += valor;
          } else {
            const dVencimento = new Date(p.dataVencimento);
            const agora = new Date();
            agora.setHours(0, 0, 0, 0);
            const diasAtraso = Math.floor(
              (agora.getTime() - dVencimento.getTime()) / (1000 * 3600 * 24),
            );
            pendingList.push({
              ...c,
              valor,
              dataVencimento: p.dataVencimento,
              diasAtraso,
              descOriginal: `${c.descricao} (Parc. ${p.numero})`,
            });
            if (dVencimento < agora) {
              gastosAtrasados += valor;
            } else {
              gastosNoPrazo += valor;
            }
          }
        });
      }
    });
    pendingList.sort(
      (a, b) =>
        new Date(a.dataVencimento || a.dataCompra).getTime() -
        new Date(b.dataVencimento || b.dataCompra).getTime(),
    );
    return { gastosAtrasados, gastosNoPrazo, totalPago, pendingList };
  }, [compras]);
  const metrics = useMemo(() => {
    let producaoTotal = 0;
    let pecasPendentes = 0;
    let pecasEntregues = 0;
    let investimentoTotal = 0;
    let lucroEstimadoTotal = 0;
    let receitaTotal = 0;
    filteredProducoes.forEach((p) => {
      const qtd = parseInt(p.quantidadeTotal) || 0;
      const custoReal = parseFloat(p.custoTotal) || 0;
      const entregue = p.totalEntregue !== undefined ? Number(p.totalEntregue) : (p.recebimentos ? p.recebimentos.reduce((s: number, r: any) => s + (Number(r.quantidade) || 0), 0) : (p.statusProducao === "Finalizado" ? qtd : 0));
      const pendente = p.totalPendente !== undefined ? Number(p.totalPendente) : Math.max(0, qtd - entregue);
      producaoTotal += qtd;
      pecasEntregues += entregue;
      pecasPendentes += pendente;
      investimentoTotal += custoReal;
      const prodRef = produtos.find(
        (pr) => pr.nome === p.produtoNome || pr.id === p.produtoId,
      );
      if (prodRef) {
        const precoVenda = parseFloat(prodRef.precoVendaMedio) || 0;
        const lucroPorPeca = parseFloat(prodRef.lucroMedioReais) || 0;
        const lucroPercentual = parseFloat(prodRef.lucroMedioPercentual) || 0;
        let lucroCalculado = lucroPorPeca * qtd;
        if (!lucroCalculado && lucroPercentual) {
          lucroCalculado = precoVenda * qtd * (lucroPercentual / 100);
        } else if (!lucroCalculado) {
          lucroCalculado = precoVenda * qtd - custoReal;
        }
        receitaTotal += precoVenda * qtd;
        lucroEstimadoTotal += lucroCalculado;
      }
    });
    const margemMedia =
      receitaTotal > 0 ? (lucroEstimadoTotal / receitaTotal) * 100 : 0;
    return {
      producaoTotal,
      pecasPendentes,
      pecasEntregues,
      investimentoTotal,
      receitaTotal,
      lucroEstimadoTotal,
      margemMedia,
    };
  }, [filteredProducoes, produtos]);
  const chartCustoVenda = useMemo(() => {
    const agrupado: Record<
      string,
      {
        name: string;
        custo: number;
        vendas: number;
        lucro: number;
        count: number;
      }
    > = {};
    filteredProducoes.forEach((p) => {
      if (!p.createdAt) return;
      const date = new Date(
        p.createdAt?.toMillis ? p.createdAt.toMillis() : p.createdAt,
      );
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!agrupado[key]) {
        const monthNames = [
          "Jan",
          "Fev",
          "Mar",
          "Abr",
          "Mai",
          "Jun",
          "Jul",
          "Ago",
          "Set",
          "Out",
          "Nov",
          "Dez",
        ];
        agrupado[key] = {
          name: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
          custo: 0,
          vendas: 0,
          lucro: 0,
          count: 0,
        };
      }
      const qtd = parseInt(p.quantidadeTotal) || 0;
      const custo = parseFloat(p.custoTotal) || 0;
      let vendas = 0;
      let lucroCalculado = 0;
      const prodRef = produtos.find(
        (pr) => pr.id === p.produtoId || pr.nome === p.produtoNome,
      );
      if (prodRef) {
        const precoVenda = parseFloat(prodRef.precoVendaMedio) || 0;
        const lucroPorPeca = parseFloat(prodRef.lucroMedioReais) || 0;
        const lucroPercentual = parseFloat(prodRef.lucroMedioPercentual) || 0;
        vendas = precoVenda * qtd;
        lucroCalculado = lucroPorPeca * qtd;
        if (!lucroCalculado && lucroPercentual) {
          lucroCalculado = precoVenda * qtd * (lucroPercentual / 100);
        } else if (!lucroCalculado) {
          lucroCalculado = precoVenda * qtd - custo;
        }
      } else {
        /*  If product not found, estimate based on vendas if any */ lucroCalculado =
          vendas > custo ? vendas - custo : 0;
      }
      agrupado[key].custo += custo;
      agrupado[key].vendas += vendas;
      agrupado[key].lucro += lucroCalculado;
      agrupado[key].count += qtd;
    });
    const arr = Object.values(agrupado).sort((a, b) => {
      const msA = new Date(
        a.name.split(" ")[1] +
          "-" +
          [
            "Jan",
            "Fev",
            "Mar",
            "Abr",
            "Mai",
            "Jun",
            "Jul",
            "Ago",
            "Set",
            "Out",
            "Nov",
            "Dez",
          ].indexOf(a.name.split(" ")[0]),
      ).getTime();
      const msB = new Date(
        b.name.split(" ")[1] +
          "-" +
          [
            "Jan",
            "Fev",
            "Mar",
            "Abr",
            "Mai",
            "Jun",
            "Jul",
            "Ago",
            "Set",
            "Out",
            "Nov",
            "Dez",
          ].indexOf(b.name.split(" ")[0]),
      ).getTime();
      return msA - msB;
    });
    return arr;
  }, [filteredProducoes, produtos]);
  const chartResumoFinanceiro = useMemo(() => {
    let totalModelagemPrevisto = 0;
    let totalRiscoPrevisto = 0;
    let totalCortePrevisto = 0;
    let totalCosturaPrevisto = 0;
    let totalTecidoPrevisto = 0;
    let totalInsumosPrevisto = 0;
    filteredProducoes.forEach((p) => {
      const total = Number(p.quantidadeTotal) || 0;
      const valorCosturaUnit = Number(p.valorCostura) || 0;
      const costuraLocal = valorCosturaUnit * total;
      totalCosturaPrevisto += costuraLocal;
      totalModelagemPrevisto += Number(p.valorModelagem) || 0;
      totalRiscoPrevisto += Number(p.valorRisco) || 0;
      totalCortePrevisto += Number(p.valorCorte) || 0;
      totalTecidoPrevisto += Number(p.valorTecido) || 0;
      totalInsumosPrevisto +=
        (Number(p.valorInsumos) || 0) + (Number(p.outrosGastos) || 0);
    });
    return [
      { name: "Costura", value: totalCosturaPrevisto, color: "#10B981" },
      { name: "Corte", value: totalCortePrevisto, color: "#F59E0B" },
      { name: "Modelagem", value: totalModelagemPrevisto, color: "#8B5CF6" },
      { name: "Risco", value: totalRiscoPrevisto, color: "#EC4899" },
      { name: "Tecido", value: totalTecidoPrevisto, color: "#3B82F6" },
      { name: "Insumos", value: totalInsumosPrevisto, color: "#64748B" },
    ].filter((item) => item.value > 0);
  }, [filteredProducoes]);
  const chartTopProdutos = useMemo(() => {
    const agrupado: Record<string, { name: string; qty: number }> = {};
    filteredProducoes.forEach((p) => {
      const prodName =
        produtos.find((pr) => pr.id === p.produtoId)?.nome ||
        p.produtoNome ||
        "Desconhecido";
      if (!agrupado[prodName]) agrupado[prodName] = { name: prodName, qty: 0 };
      agrupado[prodName].qty += parseInt(p.quantidadeTotal) || 0;
    });
    return Object.values(agrupado)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredProducoes, produtos]);
  const chartCostureiras = useMemo(() => {
    const agrupado: Record<
      string,
      {
        id: string;
        name: string;
        pecas: number;
        custoAcumulado: number;
        tempoEmDiasTotal: number;
        count: number;
      }
    > = {};
    filteredProducoes.forEach((p) => {
      const cnomeStr =
        p.costureiraNome ||
        costureiras.find((c) => c.id === p.costureiraId)?.nome ||
        "(Sem Costureira)";
      const cid = p.costureiraId || cnomeStr;
      if (!agrupado[cid]) {
        agrupado[cid] = {
          id: cid,
          name: cnomeStr.split(" ")[0],
          pecas: 0,
          custoAcumulado: 0,
          tempoEmDiasTotal: 0,
          count: 0,
        };
      }
      const qtd = parseInt(p.quantidadeTotal) || 0;
      agrupado[cid].pecas += qtd;
      agrupado[cid].custoAcumulado += parseFloat(p.custoTotal) || 0;
      agrupado[cid].count += 1;
      if (p.createdAt && p.updatedAt && p.statusEntrega === "Completo") {
        const inicio = new Date(
          p.dataInicioCostura
            ? p.dataInicioCostura
            : p.createdAt?.toMillis
              ? p.createdAt.toMillis()
              : p.createdAt,
        );
        const fim = new Date(
          p.updatedAt?.toMillis ? p.updatedAt.toMillis() : p.updatedAt,
        );
        const diffTime = Math.abs(fim.getTime() - inicio.getTime());
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) diffDays = 1;
        agrupado[cid].tempoEmDiasTotal += diffDays;
      }
    });
    return Object.values(agrupado)
      .map((c) => ({
        name: c.name,
        pecas: c.pecas,
        custoPorPeca: c.pecas > 0 ? c.custoAcumulado / c.pecas : 0,
        tempoMedio: c.count > 0 ? c.tempoEmDiasTotal / c.count : 0,
      }))
      .sort((a, b) => b.pecas - a.pecas);
  }, [filteredProducoes, costureiras]);
  const produtoTabela = useMemo(() => {
    const agrupado: Record<
      string,
      {
        name: string;
        qtd: number;
        custo: number;
        lucro: number;
        vendas: number;
      }
    > = {};
    filteredProducoes.forEach((p) => {
      const prodName =
        produtos.find((pr) => pr.id === p.produtoId)?.nome ||
        p.produtoNome ||
        "Desconhecido";
      if (!agrupado[prodName])
        agrupado[prodName] = {
          name: prodName,
          qtd: 0,
          custo: 0,
          lucro: 0,
          vendas: 0,
        };
      const qtd = parseInt(p.quantidadeTotal) || 0;
      const custoReal = parseFloat(p.custoTotal) || 0;
      const prodRef = produtos.find(
        (pr) => pr.nome === prodName || pr.id === p.produtoId,
      );
      let lucroProduto = 0;
      let vendasProduto = 0;
      if (prodRef) {
        const precoVenda = parseFloat(prodRef.precoVendaMedio) || 0;
        const lucroReaisRef = parseFloat(prodRef.lucroMedioReais) || 0;
        vendasProduto = precoVenda * qtd;
        /* Lucro exato como preenchido no produto R$ * qtd produzida */ lucroProduto =
          lucroReaisRef * qtd;
      }
      agrupado[prodName].qtd += qtd;
      agrupado[prodName].custo += custoReal;
      agrupado[prodName].lucro += lucroProduto;
      agrupado[prodName].vendas += vendasProduto;
    });
    return Object.values(agrupado)
      .map((item) => ({
        name: item.name,
        qtd: item.qtd,
        custo: item.custo,
        lucro: item.lucro,
        margem: item.custo > 0 ? (item.lucro / item.custo) * 100 : 0,
      }))
      .sort((a, b) => b.lucro - a.lucro);
  }, [filteredProducoes, produtos]);
  /*  1. Desempenho e Cumprimento de Prazos (Lead Time / Deadlines) */ const chartPrazos =
    useMemo(() => {
      let noPrazo = 0;
      let atrasado = 0;
      filteredProducoes.forEach((p) => {
        if (
          p.dataPrevistaEntrega &&
          (p.statusEntrega === "Concluído" || p.statusEntrega === "Entregue")
        ) {
          if (p.recebimentos && p.recebimentos.length > 0) {
            const lastRecebimento = p.recebimentos[p.recebimentos.length - 1];
            const dataEntrega = new Date(lastRecebimento.data);
            const dataPrevista = new Date(p.dataPrevistaEntrega);
            if (dataEntrega <= dataPrevista) {
              noPrazo++;
            } else {
              atrasado++;
            }
          } else {
            /* Default assumes on time if finished but no history */ noPrazo++;
          }
        } else if (
          p.dataPrevistaEntrega &&
          p.statusEntrega !== "Concluído" &&
          p.statusEntrega !== "Entregue"
        ) {
          const dataPrevista = new Date(p.dataPrevistaEntrega);
          if (new Date() > dataPrevista) {
            atrasado++;
          }
        }
      });
      if (noPrazo === 0 && atrasado === 0) return [];
      return [
        { name: "No Prazo", value: noPrazo, color: "#10B981" },
        { name: "Em Atraso", value: atrasado, color: "#EF4444" },
      ];
    }, [filteredProducoes]);
  /*  2. Volume de Produção por Categoria */ const chartCategorias =
    useMemo(() => {
      const agrupado: Record<string, number> = {};
      filteredProducoes.forEach((p) => {
        let categoria = "Sem Categoria";
        const prod = produtos.find(
          (pr) => pr.id === p.produtoId || pr.nome === p.produtoNome,
        );
        if (prod && prod.categoria) {
          categoria = prod.categoria;
        }
        agrupado[categoria] =
          (agrupado[categoria] || 0) + (parseInt(p.quantidadeTotal) || 0);
      });
      return Object.entries(agrupado)
        .map(([name, value], index) => {
          const colors = [
            "#3B82F6",
            "#8B5CF6",
            "#F59E0B",
            "#10B981",
            "#EC4899",
            "#6366F1",
          ];
          return { name, value, fill: colors[index % colors.length] };
        })
        .sort((a, b) => b.value - a.value);
    }, [filteredProducoes, produtos]);
  /*  3. Rentabilidade por Categoria */ const chartRentabilidadeCategoria =
    useMemo(() => {
      const categoriasInfo: Record<
        string,
        { totalReceita: number; totalLucro: number; pecas: number }
      > = {};
      filteredProducoes.forEach((p) => {
        let categoria = "Sem Categoria";
        const prodRef = produtos.find(
          (pr) => pr.id === p.produtoId || pr.nome === p.produtoNome,
        );
        const qtd = parseInt(p.quantidadeTotal) || 0;
        const custo = parseFloat(p.custoTotal) || 0;
        let receita = 0;
        let lucro = 0;
        if (prodRef) {
          if (prodRef.categoria) categoria = prodRef.categoria;
          const precoVenda = parseFloat(prodRef.precoVendaMedio) || 0;
          const lucroPorPeca = parseFloat(prodRef.lucroMedioReais) || 0;
          const lucroPercentual = parseFloat(prodRef.lucroMedioPercentual) || 0;
          receita = precoVenda * qtd;
          lucro = lucroPorPeca * qtd;
          if (!lucro && lucroPercentual) {
            lucro = receita * (lucroPercentual / 100);
          } else if (!lucro) {
            lucro = receita - custo;
          }
        } else {
          lucro = 0 - custo;
        }
        if (!categoriasInfo[categoria])
          categoriasInfo[categoria] = {
            totalReceita: 0,
            totalLucro: 0,
            pecas: 0,
          };
        categoriasInfo[categoria].totalReceita += receita;
        categoriasInfo[categoria].totalLucro += lucro;
        categoriasInfo[categoria].pecas += qtd;
      });
      return Object.entries(categoriasInfo)
        .filter(([_, info]) => info.totalReceita > 0)
        .map(([name, info]) => {
          const margem = (info.totalLucro / info.totalReceita) * 100;
          return { name, margemMedia: margem, pecas: info.pecas };
        })
        .sort((a, b) => b.margemMedia - a.margemMedia)
        .slice(0, 7);
    }, [filteredProducoes, produtos]);
  const exportPDF = async () => {
    setIsExporting(true);
    toast.info("Gerando PDF, aguarde...");
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const docAny: any = pdf;
      let startY = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      /*  --- HEADER --- */ pdf.setFillColor(30, 41, 59);
      /*  slate-800 */ pdf.rect(0, 0, pageWidth, 40, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Relatório de Produção", 14, 20);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(203, 213, 225);
      /*  slate-300 */ const periodoTexto =
        filterPeriodo === "30"
          ? "Últimos 30 Dias"
          : filterPeriodo === "90"
            ? "Últimos 90 Dias"
            : filterPeriodo === "365"
              ? "Último Ano"
              : "Tudo";
      const prodTexto =
        filterProduto === "todos"
          ? "Todos"
          : produtos.find((p) => p.id === filterProduto)?.nome || "Todos";
      const costTexto =
        filterCostureira === "todas"
          ? "Todas"
          : costureiras.find((c) => c.id === filterCostureira)?.nome || "Todas";
      pdf.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 28);
      pdf.text(
        `Período: ${periodoTexto} | Produto: ${prodTexto} | Costureira: ${costTexto}`,
        14,
        34,
      );
      startY = 50;
      /*  --- TOPIC 1: RESUMO EXECUTIVO --- */ pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      /*  slate-900 */ pdf.text("1. Resumo Executivo", 14, startY);
      startY += 6;
      autoTable(docAny, {
        startY,
        head: [["Métrica Operacional", "Valor", "Métrica Financeira", "Valor"]],
        body: [
          [
            "Total Produzido (peças)",
            metrics.producaoTotal,
            "Investimento Total",
            `R$ ${metrics.investimentoTotal.toFixed(2)}`,
          ],
          [
            "Peças Entregues",
            metrics.pecasEntregues,
            "Receita Prevista",
            `R$ ${metrics.receitaTotal.toFixed(2)}`,
          ],
          [
            "Peças Pendentes",
            metrics.pecasPendentes,
            "Lucro Estimado",
            `R$ ${metrics.lucroEstimadoTotal.toFixed(2)}`,
          ],
          ["", "", "Margem Bruta (Mkt)", `${metrics.margemMedia.toFixed(1)}%`],
        ],
        theme: "striped",
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: {
          fillColor: [30, 41, 59] as [number, number, number],
          textColor: [255, 255, 255] as [number, number, number],
          fontStyle: "bold" as const,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] as [number, number, number],
        },
      });
      startY = docAny.lastAutoTable.finalY + 15;
      /*  --- HELPER FOR CHARTS --- */ const appendChart = async (
        elementId: string,
        title?: string,
      ) => {
        const el = document.getElementById(elementId);
        if (el) {
          const imgData = await toPng(el, { pixelRatio: 2, cacheBust: true });
          const imgWidth = pageWidth - 28;
          const imgHeight = (el.offsetHeight * imgWidth) / el.offsetWidth;
          if (title && startY + 10 > pageHeight) {
            pdf.addPage();
            startY = 20;
          }
          if (title) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(12);
            pdf.setTextColor(15, 23, 42);
            pdf.text(title, 14, startY);
            startY += 4;
          }
          if (startY + imgHeight + 5 > pageHeight) {
            pdf.addPage();
            startY = 20;
          }
          pdf.addImage(imgData, "PNG", 14, startY, imgWidth, imgHeight);
          startY += imgHeight + 15;
        }
      };
      /*  --- TOPIC 2: ANÁLISE FINANCEIRA --- */ if (startY > pageHeight - 40) {
        pdf.addPage();
        startY = 20;
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text("2. Análise Financeira", 14, startY);
      startY += 6;
      if (chartResumoFinanceiro.length > 0) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(71, 85, 105);
        pdf.text("Detalhamento Financeiro:", 14, startY);
        startY += 4;
        autoTable(docAny, {
          startY,
          head: [["Categoria (Custo)", "Valor Investido (R$)"]],
          body: chartResumoFinanceiro.map((item) => [
            item.name,
            `R$ ${item.value.toFixed(2)}`,
          ]),
          theme: "striped",
          styles: { fontSize: 10, cellPadding: 5 },
          headStyles: {
            fillColor: [30, 41, 59] as [number, number, number],
            textColor: [255, 255, 255] as [number, number, number],
            fontStyle: "bold" as const,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252] as [number, number, number],
          },
        });
        startY = docAny.lastAutoTable.finalY + 15;
      }
      await appendChart("chart-investimento");
      await appendChart("chart-resumo");
      /*  --- TOPIC 3: PRODUTOS E RENTABILIDADE --- */ if (
        startY >
        pageHeight - 40
      ) {
        pdf.addPage();
        startY = 20;
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text("3. Produtos e Rentabilidade", 14, startY);
      startY += 6;
      if (produtoTabela.length > 0) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(71, 85, 105);
        /*  slate-600 */ pdf.text(
          "Detalhamento de Rentabilidade por Produto:",
          14,
          startY,
        );
        startY += 4;
        autoTable(docAny, {
          startY,
          head: [
            [
              "Produto",
              "Qtd (peças)",
              "Custo Total",
              "Lucro Estimado",
              "Margem (%)",
            ],
          ],
          body: produtoTabela.map((item) => [
            item.name,
            item.qtd,
            `R$ ${item.custo.toFixed(2)}`,
            `R$ ${item.lucro.toFixed(2)}`,
            `${item.margem.toFixed(1)}%`,
          ]),
          theme: "striped",
          styles: { fontSize: 9, cellPadding: 4 },
          headStyles: {
            fillColor: [30, 41, 59] as [number, number, number],
            textColor: [255, 255, 255] as [number, number, number],
            fontStyle: "bold" as const,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252] as [number, number, number],
          },
        });
        startY = docAny.lastAutoTable.finalY + 15;
      }
      await appendChart("chart-top");
      await appendChart("chart-rentabilidade");
      /*  --- TOPIC 4: EQUIPE E PRODUÇÃO --- */ if (startY > pageHeight - 40) {
        pdf.addPage();
        startY = 20;
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text("4. Equipe e Produção", 14, startY);
      startY += 6;
      if (chartCostureiras.length > 0) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(71, 85, 105);
        pdf.text("Detalhamento de Produção por Costureira:", 14, startY);
        startY += 4;
        autoTable(docAny, {
          startY,
          head: [
            [
              "Costureira",
              "Peças Costuradas",
              "Custo Acumulado",
              "Tempo Médio (dias)",
            ],
          ],
          body: chartCostureiras.map((item) => [
            item.name,
            item.pecas,
            `R$ ${(item.custoPorPeca * item.pecas).toFixed(2)}`,
            item.tempoMedio.toFixed(1),
          ]),
          theme: "striped",
          styles: { fontSize: 9, cellPadding: 4 },
          headStyles: {
            fillColor: [30, 41, 59] as [number, number, number],
            textColor: [255, 255, 255] as [number, number, number],
            fontStyle: "bold" as const,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252] as [number, number, number],
          },
        });
        startY = docAny.lastAutoTable.finalY + 15;
      }
      await appendChart("chart-equipe");
      await appendChart("chart-categorias");
      /*  --- TOPIC 5: PRAZOS E HISTÓRICO --- */ if (startY > pageHeight - 40) {
        pdf.addPage();
        startY = 20;
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text("5. Prazos e Histórico", 14, startY);
      startY += 6;
      if (filteredProducoes.length > 0) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(71, 85, 105);
        pdf.text("Logs de Lotes de Produção:", 14, startY);
        startY += 4;
        autoTable(docAny, {
          startY,
          head: [
            ["Data", "Produto", "Costureira", "Qtd", "Status", "Custo Total"],
          ],
          body: filteredProducoes.map((p) => {
            const d = p.createdAt?.toMillis
              ? new Date(p.createdAt.toMillis())
              : p.createdAt
                ? new Date(p.createdAt)
                : new Date();
            return [
              d.toLocaleDateString("pt-BR"),
              p.produtoNome || "S/ Nome",
              p.costureiraNome || "S/ Costureira",
              p.quantidadeTotal || "0",
              p.statusEntrega || "Pendente",
              `R$ ${parseFloat(p.custoTotal || 0).toFixed(2)}`,
            ];
          }),
          theme: "striped",
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: {
            fillColor: [30, 41, 59] as [number, number, number],
            textColor: [255, 255, 255] as [number, number, number],
            fontStyle: "bold" as const,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252] as [number, number, number],
          },
        });
        startY = docAny.lastAutoTable.finalY + 15;
      }
      await appendChart("chart-prazos");
      pdf.save("Relatorio_Producao.pdf");
      toast.success("PDF gerado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsExporting(false);
    }
  };
  const InsightCard = ({
    title,
    value,
    prefix,
    suffix,
    icon: Icon,
    color,
    index = 0,
    trend,
  }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      className="h-full"
    >
      {" "}
      <Card className="glass-card rounded-[2rem] overflow-hidden border border-border/40 shadow-sm hover:shadow-xl transition-all duration-300 h-full relative group bg-white/70">
        {" "}
        <div
          className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${color} opacity-[0.08] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}
        ></div>{" "}
        <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between gap-6">
          {" "}
          <div className="flex justify-between items-start">
            {" "}
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className={`p-3.5 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg overflow-hidden relative`}
            >
              {" "}
              <div
                className="absolute inset-0 bg-white/20 w-full animate-shimmer"
                style={{ transform: "skewX(-20deg)", left: "-150%" }}
              ></div>{" "}
              <Icon
                size={24}
                strokeWidth={2.5}
                className="relative z-10 drop-shadow-sm"
              />{" "}
            </motion.div>{" "}
            {trend !== undefined && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border ${trend > 0 ? "text-emerald-700 bg-emerald-100/80 border-emerald-200" : "text-red-700 bg-red-100/80 border-red-200"} shadow-sm`}
              >
                {" "}
                {trend > 0 ? (
                  <TrendingUp size={14} strokeWidth={3} />
                ) : (
                  <TrendingDown size={14} strokeWidth={3} />
                )}{" "}
                {Math.abs(trend)}%{" "}
              </motion.div>
            )}{" "}
          </div>{" "}
          <div className="mt-auto relative">
            {" "}
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 group-hover:text-foreground/70 transition-colors">
              {title}
            </p>{" "}
            <h3 className="text-3xl font-black text-foreground tracking-tight flex items-baseline gap-1 group-hover:scale-[1.02] origin-left transition-transform duration-300">
              {" "}
              {prefix && (
                <span className="text-lg font-extrabold text-muted-foreground/60">
                  {prefix}
                </span>
              )}{" "}
              {value}{" "}
              {suffix && (
                <span className="text-lg font-extrabold text-muted-foreground/60">
                  {suffix}
                </span>
              )}{" "}
            </h3>{" "}
          </div>{" "}
        </CardContent>{" "}
      </Card>{" "}
    </motion.div>
  );
  return (
    <div className="space-y-8 max-w-none mx-auto p-4 md:p-8 pb-10">
      {" "}
      {/* Header Premium */}{" "}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-[2.5rem] border border-primary/10 shadow-sm print:hidden"
      >
        {" "}
        <div className="flex items-center gap-4">
          {" "}
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
            {" "}
            <Activity size={28} strokeWidth={2.5} />{" "}
          </div>{" "}
          <div>
            {" "}
            <h1 className="text-[36px] font-bold tracking-tight text-foreground leading-tight">
              Relatórios Premium
            </h1>{" "}
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              Insights estratégicos e análise de performance da sua confecção.
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <Button
          onClick={exportPDF}
          disabled={isExporting}
          className="premium-btn-primary bg-primary hover:bg-primary/90 text-white rounded-full h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all border-none"
        >
          {" "}
          {isExporting ? (
            <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full mr-2" />
          ) : (
            <Download size={20} className="mr-2" strokeWidth={2.5} />
          )}{" "}
          Baixar Resumo (PDF){" "}
        </Button>{" "}
      </motion.div>{" "}
      {/* Filtros em Glassmorphism */}{" "}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 bg-white/60 backdrop-blur-xl p-3 rounded-[2rem] border border-border/50 shadow-sm sticky top-24 z-20 glass-card print:hidden"
      >
        {" "}
        <div className="flex items-center justify-center bg-accent/50 rounded-2xl px-4 py-2 font-black text-sm text-foreground uppercase tracking-widest border border-border/50">
          {" "}
          <Filter
            size={16}
            className="mr-2 text-primary"
            strokeWidth={3}
          />{" "}
          Filtros{" "}
        </div>{" "}
        <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
          {" "}
          <SelectTrigger className="rounded-2xl border-none bg-white font-bold h-12 w-full sm:w-[220px] shadow-sm">
            {" "}
            <SelectValue placeholder="Período">
              {" "}
              <div className="flex items-center">
                <Calendar
                  size={18}
                  className="mr-2 text-primary"
                  strokeWidth={2.5}
                />
                {filterPeriodo}
              </div>{" "}
            </SelectValue>{" "}
          </SelectTrigger>{" "}
          <SelectContent className="rounded-2xl font-semibold">
            {" "}
            <SelectItem value="Todos">Todo Período</SelectItem>{" "}
            <SelectItem value="Esta Semana">Esta Semana</SelectItem>{" "}
            <SelectItem value="Mês Atual">Mês Atual</SelectItem>{" "}
            <SelectItem value="Mês Passado">Mês Passado</SelectItem>{" "}
            <SelectItem value="Ultimos 3 Meses">
              Últimos 3 Meses
            </SelectItem>{" "}
          </SelectContent>{" "}
        </Select>{" "}
        <Select value={filterProduto} onValueChange={setFilterProduto}>
          {" "}
          <SelectTrigger className="rounded-2xl border-none bg-white font-bold h-12 w-full sm:w-[240px] shadow-sm">
            {" "}
            <SelectValue placeholder="Produto">
              {" "}
              <div className="flex items-center">
                <Target
                  size={18}
                  className="mr-2 text-primary"
                  strokeWidth={2.5}
                />
                {filterProduto === "Todos"
                  ? "Todos os Produtos"
                  : produtos.find((p) => p.id === filterProduto)?.nome || ""}
              </div>{" "}
            </SelectValue>{" "}
          </SelectTrigger>{" "}
          <SelectContent className="rounded-2xl font-semibold">
            {" "}
            <SelectItem value="Todos">Todos os Produtos</SelectItem>{" "}
            {produtos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}{" "}
          </SelectContent>{" "}
        </Select>{" "}
        <Select value={filterCostureira} onValueChange={setFilterCostureira}>
          {" "}
          <SelectTrigger className="rounded-2xl border-none bg-white font-bold h-12 w-full sm:w-[240px] shadow-sm">
            {" "}
            <SelectValue placeholder="Costureira">
              {" "}
              <div className="flex items-center">
                <Scissors
                  size={18}
                  className="mr-2 text-primary"
                  strokeWidth={2.5}
                />
                {filterCostureira === "Todos"
                  ? "Todas Costureiras"
                  : costureiras.find((c) => c.id === filterCostureira)?.nome ||
                    ""}
              </div>{" "}
            </SelectValue>{" "}
          </SelectTrigger>{" "}
          <SelectContent className="rounded-2xl font-semibold">
            {" "}
            <SelectItem value="Todos">Todas as Costureiras</SelectItem>{" "}
            {costureiras.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}{" "}
          </SelectContent>{" "}
        </Select>{" "}
      </motion.div>{" "}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-b-4 border-primary rounded-full" />
        </div>
      ) : (
        <div
          ref={reportRef}
          className="space-y-8 bg-background p-2 rounded-[3rem]"
        >
          {" "}
          <div className="hidden print-header mb-8 text-center border-b pb-4">
            {" "}
            <h1 className="text-[36px] font-bold tracking-tight text-foreground leading-tight">
              Relatório Executivo
            </h1>{" "}
            <p className="text-gray-500 font-semibold mt-2">
              Data de Geração: {new Date().toLocaleDateString("pt-BR")} •
              Filtro: {filterPeriodo}
            </p>{" "}
          </div>{" "}
          {/* KPIs */}{" "}
          <div className="space-y-8">
            {" "}
            <div className="premium-card /40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] -/40 relative overflow-hidden">
              {" "}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"></div>{" "}
              <div className="flex items-center gap-3 mb-6">
                {" "}
                <div className="bg-blue-500/10 p-2.5 rounded-2xl text-blue-600">
                  {" "}
                  <Activity size={24} strokeWidth={2.5} />{" "}
                </div>{" "}
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  Operacional
                </h3>{" "}
              </div>{" "}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 print-break-inside-avoid">
                {" "}
                <InsightCard
                  index={0}
                  title="Total Produzido"
                  value={metrics.producaoTotal.toLocaleString("pt-BR")}
                  suffix="un"
                  icon={PackageIcon}
                  color="from-blue-500 to-indigo-600"
                />{" "}
                <InsightCard
                  index={1}
                  title="Peças Entregues"
                  value={metrics.pecasEntregues.toLocaleString("pt-BR")}
                  suffix="un"
                  icon={Activity}
                  color="from-emerald-400 to-green-500"
                />{" "}
                <InsightCard
                  index={2}
                  title="Peças Pendentes"
                  value={metrics.pecasPendentes.toLocaleString("pt-BR")}
                  suffix="un"
                  icon={RotateCw}
                  color="from-amber-400 to-orange-600"
                />{" "}
              </div>{" "}
            </div>{" "}
            <div className="premium-card /40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] -/40 relative overflow-hidden">
              {" "}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-fuchsia-500 to-emerald-500"></div>{" "}
              <div className="flex items-center gap-3 mb-6">
                {" "}
                <div className="bg-rose-500/10 p-2.5 rounded-2xl text-rose-600">
                  {" "}
                  <DollarSign size={24} strokeWidth={2.5} />{" "}
                </div>{" "}
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  Estatísticas Financeiras
                </h3>{" "}
              </div>{" "}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print-break-inside-avoid">
                {" "}
                <InsightCard
                  index={3}
                  title="Investimento Total"
                  value={metrics.investimentoTotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  prefix="R$"
                  icon={DollarSign}
                  color="from-rose-400 to-red-600"
                />{" "}
                <InsightCard
                  index={4}
                  title="Receita Prevista"
                  value={metrics.receitaTotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  prefix="R$"
                  icon={TrendingUp}
                  color="from-blue-500 to-cyan-600"
                />{" "}
                <InsightCard
                  index={5}
                  title="Lucro Estimado"
                  value={metrics.lucroEstimadoTotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  prefix="R$"
                  icon={DollarSign}
                  color="from-emerald-500 to-teal-600"
                />{" "}
                <InsightCard
                  index={6}
                  title="Margem Bruta Mkt"
                  value={metrics.margemMedia.toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                  suffix="%"
                  icon={Percent}
                  color="from-amber-400 to-orange-600"
                />{" "}
              </div>{" "}
            </div>{" "}
            {/* CONTAS A PAGAR / INSUMOS */}{" "}
            <div className="premium-card /40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] -/40 relative overflow-hidden">
              {" "}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-red-400 to-pink-500"></div>{" "}
              <div className="flex items-center gap-3 mb-6">
                {" "}
                <div className="bg-orange-500/10 p-2.5 rounded-2xl text-orange-600">
                  {" "}
                  <Calendar size={24} strokeWidth={2.5} />{" "}
                </div>{" "}
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  Compras e Contas a Pagar (Insumos)
                </h3>{" "}
              </div>{" "}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print-break-inside-avoid mb-8">
                {" "}
                <InsightCard
                  index={7}
                  title="Pagamentos em Atraso"
                  value={metricsCompras.gastosAtrasados.toLocaleString(
                    "pt-BR",
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                  )}
                  prefix="R$"
                  icon={TrendingDown}
                  color="from-red-400 to-rose-600"
                />{" "}
                <InsightCard
                  index={8}
                  title="A Vencer (No Prazo)"
                  value={metricsCompras.gastosNoPrazo.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  prefix="R$"
                  icon={Clock}
                  color="from-amber-400 to-orange-500"
                />{" "}
              </div>{" "}
              {metricsCompras.pendingList.length > 0 && (
                <div className="mt-8 border-t border-border/40 pt-8">
                  {" "}
                  <h4 className="font-bold text-foreground text-lg mb-4">
                    Próximos Vencimentos
                  </h4>{" "}
                  <div className="space-y-3">
                    {" "}
                    {metricsCompras.pendingList
                      .slice(0, 10)
                      .map((c: any, idx: number) => (
                        <div
                          key={idx}
                          className="premium-card flex flex-col sm:flex-row sm:items-center justify-between p-4 -/50 hover: transition- gap-4"
                        >
                          {" "}
                          <div>
                            {" "}
                            <div className="font-bold text-foreground text-sm uppercase tracking-wider">
                              {c.descOriginal || c.descricao}
                            </div>{" "}
                            <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2 mt-1">
                              {" "}
                              <span>Forma: {c.formaPagamento}</span>{" "}
                              <span className="opacity-40">•</span>{" "}
                              <span>
                                Compra:{" "}
                                {new Date(c.dataCompra).toLocaleDateString(
                                  "pt-BR",
                                )}
                              </span>{" "}
                            </div>{" "}
                          </div>{" "}
                          <div className="flex items-center gap-6">
                            {" "}
                            <div className="text-right">
                              {" "}
                              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                Vencimento
                              </div>{" "}
                              <div
                                className={`font-black text-sm px-3 py-1 rounded-lg ${c.diasAtraso > 0 ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"}`}
                              >
                                {" "}
                                {c.dataVencimento
                                  ? new Date(
                                      c.dataVencimento,
                                    ).toLocaleDateString("pt-BR")
                                  : new Date(c.dataCompra).toLocaleDateString(
                                      "pt-BR",
                                    )}{" "}
                                {c.diasAtraso > 0 &&
                                  ` (Atrasado ${c.diasAtraso}d)`}{" "}
                              </div>{" "}
                            </div>{" "}
                            <div className="text-right min-w-[120px]">
                              {" "}
                              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                Valor
                              </div>{" "}
                              <div className="font-black text-lg text-foreground">
                                {" "}
                                R${" "}
                                {c.valor.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                              </div>{" "}
                            </div>{" "}
                          </div>{" "}
                        </div>
                      ))}{" "}
                  </div>{" "}
                </div>
              )}{" "}
            </div>{" "}
          </div>{" "}
          {/* Linha de Gráficos 1: Financeiro + Distribuição */}{" "}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print-break-inside-avoid">
            {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2"
            >
              {" "}
              <div
                id="chart-investimento"
                className="premium-card /40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] -/40 hover: transition- duration-300 relative overflow-hidden h-[480px] flex flex-col group"
              >
                {" "}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>{" "}
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  {" "}
                  <div className="bg-blue-500/10 p-2.5 rounded-2xl text-blue-600">
                    {" "}
                    <TrendingUp size={24} strokeWidth={2.5} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      Investimento x Lucro
                    </h3>{" "}
                    <p className="font-semibold text-xs text-muted-foreground mt-0.5">
                      Comparativo (Investimento vs Lucro Estimado)
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="premium-card flex-1 /30 p-4 sm:p-6 -/30 min-h-0">
                  {" "}
                  {chartCustoVenda.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {" "}
                      <BarChart
                        data={chartCustoVenda}
                        margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                      >
                        {" "}
                        <CartesianGrid
                          strokeDasharray="4 4"
                          vertical={false}
                          stroke="#E5E7EB"
                          opacity={0.5}
                        />{" "}
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: "#6B7280",
                            fontWeight: 700,
                          }}
                          dy={10}
                        />{" "}
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: "#9CA3AF",
                            fontWeight: 700,
                          }}
                          tickFormatter={(val) => `R$${val / 1000}k`}
                          dx={-10}
                        />{" "}
                        <RechartsTooltip
                          cursor={{ fill: "rgba(0,0,0,0.02)" }}
                          contentStyle={{
                            borderRadius: "20px",
                            border: "none",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)",
                            fontWeight: "bold",
                            padding: "12px",
                          }}
                          formatter={(value: number) => [
                            `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                            "",
                          ]}
                          labelStyle={{ color: "#1F2937", marginBottom: "8px" }}
                        />{" "}
                        <Legend
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: "13px",
                            fontWeight: 700,
                            paddingTop: "10px",
                          }}
                        />{" "}
                        <Bar
                          dataKey="custo"
                          name="Investimento"
                          fill="#9B8CFF"
                          radius={[6, 6, 0, 0]}
                          barSize={24}
                        />{" "}
                        <Bar
                          dataKey="lucro"
                          name="Lucro Estimado"
                          fill="#6D4AFF"
                          radius={[6, 6, 0, 0]}
                          barSize={24}
                        />{" "}
                      </BarChart>{" "}
                    </ResponsiveContainer>
                  ) : (
                    <div className="premium-card h-full flex flex-col items-center justify-center text-muted-foreground font-semibold /40 -dashed -/50">
                      {" "}
                      <Activity
                        size={40}
                        className="mb-4 opacity-50"
                        strokeWidth={1.5}
                      />{" "}
                      Nenhum dado financeiro.{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </motion.div>{" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-1"
            >
              {" "}
              <div
                id="chart-resumo"
                className="premium-card /40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] -/40 hover: transition- duration-300 relative overflow-hidden h-[480px] flex flex-col group"
              >
                {" "}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500"></div>{" "}
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  {" "}
                  <div className="bg-rose-500/10 p-2.5 rounded-2xl text-rose-600">
                    {" "}
                    <DollarSign size={24} strokeWidth={2.5} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      Resumo Financeiro
                    </h3>{" "}
                    <p className="font-semibold text-xs text-muted-foreground mt-0.5">
                      Total investido (R$)
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="premium-card flex-1 /30 p-4 sm:p-6 -/30 min-h-0">
                  {" "}
                  {chartResumoFinanceiro.length > 0 ? (
                    <div className="flex-1 h-full w-full">
                      {" "}
                      <ResponsiveContainer width="100%" height="100%">
                        {" "}
                        <BarChart
                          data={chartResumoFinanceiro}
                          margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                        >
                          {" "}
                          <CartesianGrid
                            strokeDasharray="4 4"
                            vertical={false}
                            stroke="#E5E7EB"
                            opacity={0.5}
                          />{" "}
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 11,
                              fill: "#6B7280",
                              fontWeight: 700,
                            }}
                            dy={10}
                          />{" "}
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 11,
                              fill: "#9CA3AF",
                              fontWeight: 700,
                            }}
                            tickFormatter={(val) =>
                              `R$${val >= 1000 ? val / 1000 + "k" : val}`
                            }
                            dx={-5}
                          />{" "}
                          <RechartsTooltip
                            cursor={{ fill: "rgba(0,0,0,0.02)" }}
                            contentStyle={{
                              borderRadius: "15px",
                              border: "none",
                              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                              fontWeight: "bold",
                            }}
                            itemStyle={{ color: "#1F2937" }}
                            formatter={(val: number) => [
                              `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                              "Investimento",
                            ]}
                          />{" "}
                          <Bar
                            dataKey="value"
                            name="Investido"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                          >
                            {" "}
                            {chartResumoFinanceiro.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}{" "}
                          </Bar>{" "}
                        </BarChart>{" "}
                      </ResponsiveContainer>{" "}
                    </div>
                  ) : (
                    <div className="premium-card h-full flex flex-col items-center justify-center text-muted-foreground font-semibold /40 -dashed -/50">
                      {" "}
                      <DollarSign
                        size={40}
                        className="mb-4 opacity-50"
                        strokeWidth={1.5}
                      />{" "}
                      Sem registros financeiros.{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>{" "}
          {/* Linha de Gráficos 2: Performance Equipe e Produtos */}{" "}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print-break-inside-avoid">
            {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {" "}
              <div
                id="chart-equipe"
                className="premium-card /40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] -/40 hover: transition- duration-300 relative overflow-hidden h-[480px] flex flex-col group"
              >
                {" "}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>{" "}
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  {" "}
                  <div className="bg-indigo-500/10 p-2.5 rounded-2xl text-indigo-600">
                    {" "}
                    <Scissors size={24} strokeWidth={2.5} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      Equipe
                    </h3>{" "}
                    <p className="font-semibold text-xs text-muted-foreground mt-0.5">
                      Volume produzido
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="premium-card flex-1 /30 p-4 sm:p-6 -/30 min-h-0">
                  {" "}
                  {chartCostureiras.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {" "}
                      <BarChart
                        data={chartCostureiras.slice(0, 8)}
                        margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
                      >
                        {" "}
                        <CartesianGrid
                          strokeDasharray="4 4"
                          vertical={false}
                          stroke="#E5E7EB"
                          opacity={0.5}
                        />{" "}
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: "#6B7280",
                            fontWeight: 700,
                          }}
                          dy={10}
                        />{" "}
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "#9CA3AF",
                            fontWeight: 700,
                          }}
                          tickFormatter={(val) => `${val} pçs`}
                          dx={-5}
                        />{" "}
                        <RechartsTooltip
                          cursor={{ fill: "rgba(0,0,0,0.02)" }}
                          contentStyle={{
                            borderRadius: "20px",
                            border: "none",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)",
                            fontWeight: "bold",
                            padding: "12px",
                          }}
                        />{" "}
                        <Legend
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: "13px",
                            fontWeight: 700,
                            paddingTop: "10px",
                          }}
                        />{" "}
                        <Bar
                          dataKey="pecas"
                          name="Volume Produzido (peças)"
                          fill="#6D4AFF"
                          radius={[6, 6, 0, 0]}
                          barSize={28}
                        />{" "}
                      </BarChart>{" "}
                    </ResponsiveContainer>
                  ) : (
                    <div className="premium-card h-full flex flex-col items-center justify-center text-muted-foreground font-semibold /40 -dashed -/50">
                      {" "}
                      <Scissors
                        size={40}
                        className="mb-4 opacity-50"
                        strokeWidth={1.5}
                      />{" "}
                      Nenhum dado produtivo.{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </motion.div>{" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
            >
              {" "}
              <div
                id="chart-top"
                className="premium-card /40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] -/40 hover: transition- duration-300 relative overflow-hidden h-[480px] flex flex-col group"
              >
                {" "}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"></div>{" "}
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  {" "}
                  <div className="bg-emerald-500/10 p-2.5 rounded-2xl text-emerald-600">
                    {" "}
                    <PackageIcon size={24} strokeWidth={2.5} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      Top 5 Produtos
                    </h3>{" "}
                    <p className="font-semibold text-xs text-muted-foreground mt-0.5">
                      Mais fabricados
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="premium-card flex-1 /30 p-4 sm:p-6 -/30 min-h-0">
                  {" "}
                  {chartTopProdutos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {" "}
                      <BarChart
                        data={chartTopProdutos}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                      >
                        {" "}
                        <CartesianGrid
                          strokeDasharray="4 4"
                          horizontal={false}
                          stroke="#E5E7EB"
                          opacity={0.5}
                        />{" "}
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: "#6B7280",
                            fontWeight: 700,
                          }}
                          dx={5}
                        />{" "}
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: "#4B5563",
                            fontWeight: 700,
                          }}
                          width={120}
                        />{" "}
                        <RechartsTooltip
                          cursor={{ fill: "rgba(0,0,0,0.02)" }}
                          contentStyle={{
                            borderRadius: "20px",
                            border: "none",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)",
                            fontWeight: "bold",
                            padding: "12px",
                          }}
                        />{" "}
                        <Bar
                          dataKey="qty"
                          name="Quantidade (pçs)"
                          fill="#6D4AFF"
                          radius={[0, 6, 6, 0]}
                          barSize={24}
                        >
                          {" "}
                          {chartTopProdutos.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                [
                                  "#6D4AFF",
                                  "#8A71FF",
                                  "#9B8CFF",
                                  "#B3A8FF",
                                  "#C7C2FF",
                                ][index % 5]
                              }
                            />
                          ))}{" "}
                        </Bar>{" "}
                      </BarChart>{" "}
                    </ResponsiveContainer>
                  ) : (
                    <div className="premium-card h-full flex flex-col items-center justify-center text-muted-foreground font-semibold /40 -dashed -/50">
                      {" "}
                      <PackageIcon
                        size={40}
                        className="mb-4 opacity-50"
                        strokeWidth={1.5}
                      />{" "}
                      Nenhum produto fabricado.{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>{" "}
          {/* Linha de Gráficos 3: Novos Insights */}{" "}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print-break-inside-avoid">
            {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {" "}
              <div
                id="chart-prazos"
                className="premium-card /40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] -/40 hover: transition- duration-300 relative overflow-hidden h-[480px] flex flex-col group"
              >
                {" "}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"></div>{" "}
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  {" "}
                  <div className="bg-amber-500/10 p-2.5 rounded-2xl text-amber-600">
                    {" "}
                    <Clock size={24} strokeWidth={2.5} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      Prazos
                    </h3>{" "}
                    <p className="font-semibold text-xs text-muted-foreground mt-0.5">
                      Status de entrega
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="premium-card flex-1 /30 p-4 sm:p-6 -/30 min-h-0 flex flex-col items-center justify-center">
                  {" "}
                  {chartPrazos.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      {" "}
                      <PieChart>
                        {" "}
                        <Pie
                          data={chartPrazos}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {" "}
                          {chartPrazos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}{" "}
                        </Pie>{" "}
                        <RechartsTooltip
                          cursor={{ fill: "rgba(0,0,0,0.02)" }}
                          contentStyle={{
                            borderRadius: "20px",
                            border: "none",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)",
                            fontWeight: "bold",
                          }}
                        />{" "}
                        <Legend
                          iconType="circle"
                          wrapperStyle={{ fontSize: "13px", fontWeight: 700 }}
                        />{" "}
                      </PieChart>{" "}
                    </ResponsiveContainer>
                  ) : (
                    <div className="premium-card flex flex-col items-center justify-center text-muted-foreground font-semibold h-full w-full /40 -dashed -/50">
                      {" "}
                      <Activity
                        size={40}
                        className="mb-4 opacity-50"
                        strokeWidth={1.5}
                      />{" "}
                      Sem dados de prazo.{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </motion.div>{" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
            >
              {" "}
              <div
                id="chart-categorias"
                className="premium-card /40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] -/40 hover: transition- duration-300 relative overflow-hidden h-[480px] flex flex-col group"
              >
                {" "}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"></div>{" "}
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  {" "}
                  <div className="bg-purple-500/10 p-2.5 rounded-2xl text-purple-600">
                    {" "}
                    <Target size={24} strokeWidth={2.5} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      Volume / Categoria
                    </h3>{" "}
                    <p className="font-semibold text-xs text-muted-foreground mt-0.5">
                      Produção em peças
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="premium-card flex-1 /30 p-4 sm:p-6 -/30 min-h-0">
                  {" "}
                  {chartCategorias.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {" "}
                      <BarChart
                        data={chartCategorias}
                        margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
                      >
                        {" "}
                        <CartesianGrid
                          strokeDasharray="4 4"
                          vertical={false}
                          stroke="#E5E7EB"
                          opacity={0.5}
                        />{" "}
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: "#6B7280",
                            fontWeight: 700,
                          }}
                          dy={10}
                        />{" "}
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "#9CA3AF",
                            fontWeight: 700,
                          }}
                          dx={-5}
                        />{" "}
                        <RechartsTooltip
                          cursor={{ fill: "rgba(0,0,0,0.02)" }}
                          contentStyle={{
                            borderRadius: "20px",
                            border: "none",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)",
                            fontWeight: "bold",
                          }}
                        />{" "}
                        <Bar
                          dataKey="value"
                          name="Qtd (peças)"
                          radius={[6, 6, 0, 0]}
                          barSize={30}
                        >
                          {" "}
                          {chartCategorias.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}{" "}
                        </Bar>{" "}
                      </BarChart>{" "}
                    </ResponsiveContainer>
                  ) : (
                    <div className="premium-card h-full flex flex-col items-center justify-center text-muted-foreground font-semibold /40 -dashed -/50">
                      {" "}
                      <PackageIcon
                        size={40}
                        className="mb-4 opacity-50"
                        strokeWidth={1.5}
                      />{" "}
                      Nenhuma categoria.{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </motion.div>{" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {" "}
              <div
                id="chart-rentabilidade"
                className="premium-card /40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] -/40 hover: transition- duration-300 relative overflow-hidden h-[480px] flex flex-col group"
              >
                {" "}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"></div>{" "}
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  {" "}
                  <div className="bg-orange-500/10 p-2.5 rounded-2xl text-orange-600">
                    {" "}
                    <Percent size={24} strokeWidth={2.5} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      Rentabilidade
                    </h3>{" "}
                    <p className="font-semibold text-xs text-muted-foreground mt-0.5">
                      Margem bruta Mkt.
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="premium-card flex-1 /30 p-4 sm:p-6 -/30 min-h-0">
                  {" "}
                  {chartRentabilidadeCategoria.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {" "}
                      <BarChart
                        data={chartRentabilidadeCategoria}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                      >
                        {" "}
                        <CartesianGrid
                          strokeDasharray="4 4"
                          horizontal={false}
                          stroke="#E5E7EB"
                          opacity={0.5}
                        />{" "}
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: "#6B7280",
                            fontWeight: 700,
                          }}
                          tickFormatter={(val) => `${val}%`}
                          dx={5}
                        />{" "}
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: "#4B5563",
                            fontWeight: 700,
                          }}
                          width={100}
                        />{" "}
                        <RechartsTooltip
                          cursor={{ fill: "rgba(0,0,0,0.02)" }}
                          formatter={(val: number) => [
                            `${val.toFixed(1)}%`,
                            "Margem de Lucro",
                          ]}
                          contentStyle={{
                            borderRadius: "20px",
                            border: "none",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)",
                            fontWeight: "bold",
                          }}
                        />{" "}
                        <Bar
                          dataKey="margemMedia"
                          name="Margem (%)"
                          fill="#9B8CFF"
                          radius={[0, 6, 6, 0]}
                          barSize={24}
                        />{" "}
                      </BarChart>{" "}
                    </ResponsiveContainer>
                  ) : (
                    <div className="premium-card h-full flex flex-col items-center justify-center text-muted-foreground font-semibold /40 -dashed -/50">
                      {" "}
                      <DollarSign
                        size={40}
                        className="mb-4 opacity-50"
                        strokeWidth={1.5}
                      />{" "}
                      Sem rentabilidade.{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>{" "}
          <div className="grid grid-cols-1 gap-8 print-break-inside-avoid mt-8">
            {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95 }}
            >
              {" "}
              <div
                id="chart-lista"
                className="premium-card /40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] -/40 hover: transition- duration-300 relative overflow-hidden flex flex-col group"
              >
                {" "}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-emerald-500 to-green-500"></div>{" "}
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  {" "}
                  <div className="bg-teal-500/10 p-2.5 rounded-2xl text-teal-600">
                    {" "}
                    <Target size={24} strokeWidth={2.5} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      Lista de Produção
                    </h3>{" "}
                    <p className="font-semibold text-xs text-muted-foreground mt-0.5">
                      Análise de produção e lucratividade por modelo
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="premium-card /30 p-4 sm:p-6 -/30 overflow-hidden">
                  {" "}
                  {produtoTabela.length > 0 ? (
                    <div className="w-full overflow-x-auto custom-scrollbar">
                      {" "}
                      <table className="w-full text-sm text-left">
<thead className="bg-white/50 text-[11px] uppercase font-bold tracking-widest text-muted-foreground border-b border-border/50">
<tr>
<th className="px-6 py-4 rounded-tl-xl text-foreground">
                              Produto
                            </th>
<th className="px-6 py-4 text-right text-foreground">
                              Qtd
                            </th>
<th className="px-6 py-4 text-right text-foreground">
                              Custo Total
                            </th>
<th className="px-6 py-4 text-right text-foreground">
                              Lucro Estimado
                            </th>
<th className="px-6 py-4 text-right rounded-tr-xl text-foreground">
                              Margem
                            </th>
</tr>
</thead>
<tbody className="divide-y divide-border/30">
                          
                          {produtoTabela.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-white/50 transition-colors"
                            >
<td className="px-6 py-4 font-black text-foreground truncate max-w-[150px]">
                                {item.name}
                              </td>
<td className="px-6 py-4 font-bold text-right text-indigo-600">
                                {item.qtd}
                              </td>
<td className="px-6 py-4 font-semibold text-right text-rose-600">
                                R$
                                {item.custo.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
<td className="px-6 py-4 font-bold text-right text-emerald-600">
                                R$
                                {item.lucro.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
<td className="px-6 py-4 font-bold text-right">
                                
                                <span
                                  className={`px-2 py-1 rounded-md text-[11px] ${item.margem > 0 ? "bg-emerald-100/70 text-emerald-700 font-bold border border-emerald-200" : "bg-red-100/70 text-red-700 font-bold border border-red-200"}`}
                                >
                                  
                                  {item.margem.toFixed(1)}%
                                </span>
                              </td>
</tr>
                          ))}
                        </tbody>
</table>{" "}
                    </div>
                  ) : (
                    <div className="premium-card py-12 flex flex-col items-center justify-center text-muted-foreground font-semibold /40 -dashed -/50">
                      {" "}
                      <PackageIcon
                        size={40}
                        className="mb-4 opacity-50"
                        strokeWidth={1.5}
                      />{" "}
                      Sem registro de produtos.{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>{" "}
          {/* Custom Styles for PDF Export */}{" "}
          <style>{` @media print { body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .glass, .glass-card { background: white !important; backdrop-filter: none !important; border: 1px solid #e5e7eb !important; shadow: none !important; } .print-header { display: block !important; } .print-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; } .bg-gradient-to-br, .bg-gradient-to-r { background: #f3f4f6 !important; } } `}</style>{" "}
        </div>
      )}{" "}
    </div>
  );
}
