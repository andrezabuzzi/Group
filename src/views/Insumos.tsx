import { useEffect, useState, useMemo } from "react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { StockMovement } from "../lib/erpUtils";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ShoppingBag,
  Filter,
  ArrowUpDown,
  MoreVertical,
  CreditCard,
  CalendarClock,
  DollarSign,
  PackageOpen,
  LayoutGrid,
  List,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  Building,
  ArrowRight,
  Download,
  Receipt,
  Paperclip,
  Eye,
  CheckCircle,
  CheckCircle2,
  Copy,
  FileText,
  Upload,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import React from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
export default function Insumos() {
  const { user } = useAuth();
  const [compras, setCompras] = useState<any[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<StockMovement[]>([]);
  const [activeInsumoTab, setActiveInsumoTab] = useState<"compras" | "estoque">("compras");
  const [isMovModalOpen, setIsMovModalOpen] = useState(false);
  const [movFormData, setMovFormData] = useState({
    tipo: "ENTRADA" as "ENTRADA" | "SAIDA" | "AJUSTE" | "PERDA" | "DEVOLUCAO",
    descricao: "",
    quantidade: "1",
    unidade: "un",
    motivo: "",
    origem: "",
    data: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(true);
  /*  Table Filters */ const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("dataCompra");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  /*  Dialog state */ const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  /*  Form State */ const defaultForm = {
    descricao: "",
    fornecedor: "",
    detalhePagamento: "",
    quantidade: "1",
    unidade: "un",
    categoria: "Insumos",
    valorTotal: "",
    dataCompra: new Date().toISOString().split("T")[0],
    tipoPagamento: "a_vista",
    formaPagamento: "Pix",
    statusPagamento: "pago",
    quantidadeParcelas: "1",
    intervaloDias: "30",
    parcelas: [] as any[],
  };
  const [formData, setFormData] = useState(defaultForm);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [filterCategoria, setFilterCategoria] = useState("Todas");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [selectedCompra, setSelectedCompra] = useState<any>(null);
  /*  For Details view */ const categoriasDisponiveis = useMemo(() => {
    const cats = new Set(compras.map((c) => c.categoria || "Sem Categoria"));
    return ["Todas", ...Array.from(cats)];
  }, [compras]);
  const fornecedoresDisponiveis = useMemo(() => {
    const forns = new Set(compras.map((c) => c.fornecedor || "Sem Fornecedor"));
    return ["Todos", ...Array.from(forns)];
  }, [compras]);

  useEffect(() => {
    if (!user) return;
    const unsubCompras = onSnapshot(
      query(collection(db, "prod_compras"), where("userId", "==", user.uid)),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCompras(data);
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "prod_compras")
    );

    const unsubMovs = onSnapshot(
      query(collection(db, "prod_insumos_movimentacoes"), where("userId", "==", user.uid)),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as StockMovement[];
        data.sort((a, b) => new Date(b.data || b.createdAt).getTime() - new Date(a.data || a.createdAt).getTime());
        setMovimentacoes(data);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "prod_insumos_movimentacoes")
    );

    return () => {
      unsubCompras();
      unsubMovs();
    };
  }, [user]);

  const stockByItem = useMemo(() => {
    const map: Record<string, { descricao: string; unidade: string; saldo: number; entradas: number; saidas: number }> = {};
    movimentacoes.forEach((m) => {
      const key = (m.descricao || "Item").trim().toLowerCase();
      if (!map[key]) {
        map[key] = { descricao: m.descricao, unidade: m.unidade || "un", saldo: 0, entradas: 0, saidas: 0 };
      }
      const qtd = Number(m.quantidade) || 0;
      if (m.tipo === "ENTRADA" || m.tipo === "DEVOLUCAO") {
        map[key].saldo += qtd;
        map[key].entradas += qtd;
      } else if (m.tipo === "SAIDA" || m.tipo === "PERDA") {
        map[key].saldo -= qtd;
        map[key].saidas += qtd;
      } else if (m.tipo === "AJUSTE") {
        map[key].saldo += qtd;
      }
    });
    return Object.values(map);
  }, [movimentacoes]);
  const generateParcelas = (
    valor: number,
    qtde: number,
    intervalo: number,
    dataInicio: string,
  ) => {
    const parcelas = [];
    let curDate = new Date(dataInicio);
    const valorParcela = (valor / qtde).toFixed(2);
    for (let i = 1; i <= qtde; i++) {
      curDate.setDate(curDate.getDate() + intervalo);
      parcelas.push({
        numero: i,
        valor: parseFloat(valorParcela),
        dataVencimento: curDate.toISOString().split("T")[0],
        status: "pendente",
      });
    }
    return parcelas;
  };
  const handleTipoPagamentoChange = (v: string) => {
    if (v === "a_vista") {
      setFormData((prev) => ({
        ...prev,
        tipoPagamento: v,
        formaPagamento: "Pix",
        statusPagamento: "pago",
        parcelas: [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        tipoPagamento: v,
        formaPagamento: "Boleto",
        statusPagamento: "pendente",
        quantidadeParcelas: "1",
        intervaloDias: "30",
        parcelas: generateParcelas(
          parseFloat(prev.valorTotal.replace(",", ".")) || 0,
          1,
          30,
          prev.dataCompra,
        ),
      }));
    }
  };
  const currentSettingsObj = formData;
  const updateParcelasOnChange = (updates: any, currentSettings: any) => {
    const merge = { ...currentSettings, ...updates };
    if (merge.tipoPagamento === "a_vista") return { ...merge, parcelas: [] };
    const valor = parseFloat(merge.valorTotal.replace(",", ".")) || 0;
    const qtde = parseInt(merge.quantidadeParcelas) || 1;
    const intervalo = parseInt(merge.intervaloDias) || 30;
    const p = generateParcelas(valor, qtde, intervalo, merge.dataCompra);
    return { ...merge, parcelas: p };
  };
  const handleSave = async () => {
    if (!user) return;
    if (!formData.descricao || !formData.valorTotal || !formData.dataCompra) {
      toast.error("Preencha os campos obrigatórios (Descrição, Valor e Data)");
      return;
    }
    try {
      const valor = parseFloat(formData.valorTotal.replace(",", ".")) || 0;
      const compraData: any = {
        descricao: formData.descricao,
        fornecedor: formData.fornecedor,
        detalhePagamento: formData.detalhePagamento,
        quantidade: formData.quantidade,
        unidade: formData.unidade,
        categoria: formData.categoria,
        valorTotal: valor,
        dataCompra: formData.dataCompra,
        tipoPagamento: formData.tipoPagamento,
        formaPagamento: formData.formaPagamento,
        statusPagamento:
          formData.tipoPagamento === "a_vista"
            ? formData.statusPagamento
            : "pendente",
        quantidadeParcelas: formData.quantidadeParcelas,
        intervaloDias: formData.intervaloDias,
        parcelas: formData.tipoPagamento === "a_prazo" ? formData.parcelas : [],
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        await updateDoc(doc(db, "prod_compras", editingId), compraData);
        toast.success("Compra atualizada!");
      } else {
        const newId = doc(collection(db, "prod_compras")).id;
        compraData.createdAt = serverTimestamp();
        await setDoc(doc(db, "prod_compras", newId), {
          id: newId,
          ...compraData,
        });

        // 1. Automatic Stock Movement: ENTRADA from purchase
        try {
          await addDoc(collection(db, "prod_insumos_movimentacoes"), {
            userId: user.uid,
            tipo: "ENTRADA",
            descricao: formData.descricao,
            quantidade: parseFloat(formData.quantidade) || 1,
            unidade: formData.unidade || "un",
            motivo: `Compra de insumo: ${formData.descricao}`,
            origem: formData.fornecedor || "Fornecedor",
            referenciaId: newId,
            data: formData.dataCompra,
            createdAt: serverTimestamp(),
          });
        } catch (errMov) {
          console.warn("Aviso ao registrar movimentação de estoque:", errMov);
        }

        // 2. Integration with Financeiro (Contas a Pagar)
        try {
          const isPrazo = formData.tipoPagamento === "a_prazo";
          const numParcelas = isPrazo ? parseInt(formData.quantidadeParcelas) || 1 : 1;
          const payDocRef = await addDoc(collection(db, "prod_accounts_payable"), {
            userId: user.uid,
            description: `Insumo: ${formData.descricao}`,
            launchType: "insumo",
            compraId: newId,
            category: formData.categoria || "Insumos",
            supplier: formData.fornecedor || "Fornecedor",
            type: "empresa",
            totalValue: valor,
            purchaseDate: formData.dataCompra,
            paymentMethod: formData.formaPagamento,
            isInstallment: isPrazo,
            installmentCount: numParcelas,
            firstDueDate: isPrazo && formData.parcelas?.[0]?.dataVencimento ? formData.parcelas[0].dataVencimento : formData.dataCompra,
            status: formData.statusPagamento || (isPrazo ? "pendente" : "pago"),
            paidValue: formData.statusPagamento === "pago" ? valor : 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          if (isPrazo && formData.parcelas && formData.parcelas.length > 0) {
            for (const parc of formData.parcelas) {
              await addDoc(collection(db, `prod_accounts_payable/${payDocRef.id}/installments`), {
                userId: user.uid,
                accountId: payDocRef.id,
                type: "empresa",
                installmentNumber: parc.numero,
                totalInstallments: numParcelas,
                description: `${formData.descricao} (Parc. ${parc.numero}/${numParcelas})`,
                supplier: formData.fornecedor || "Fornecedor",
                category: formData.categoria || "Insumos",
                value: Number(parc.valor),
                dueDate: parc.dataVencimento,
                paidValue: parc.status === "pago" ? Number(parc.valor) : null,
                remainingValue: parc.status === "pago" ? 0 : Number(parc.valor),
                status: parc.status === "pago" ? "pago" : "pendente",
                paymentMethod: formData.formaPagamento,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } else {
            await addDoc(collection(db, `prod_accounts_payable/${payDocRef.id}/installments`), {
              userId: user.uid,
              accountId: payDocRef.id,
              type: "empresa",
              installmentNumber: 1,
              totalInstallments: 1,
              description: `Insumo: ${formData.descricao}`,
              supplier: formData.fornecedor || "Fornecedor",
              category: formData.categoria || "Insumos",
              value: valor,
              dueDate: formData.dataCompra,
              paymentDate: formData.statusPagamento === "pago" ? formData.dataCompra : null,
              paidValue: formData.statusPagamento === "pago" ? valor : null,
              remainingValue: formData.statusPagamento === "pago" ? 0 : valor,
              status: formData.statusPagamento === "pago" ? "pago" : "pendente",
              paymentMethod: formData.formaPagamento,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (errSync) {
          console.warn("Aviso ao sincronizar compra com financeiro:", errSync);
        }

        toast.success("Compra de insumo registrada, estoque abastecido e financeiro sincronizado!");
      }
      setIsDialogOpen(false);
    } catch (error) {
      handleFirestoreError(
        error,
        editingId ? OperationType.UPDATE : OperationType.CREATE,
        "prod_compras",
      );
    }
  };

  const handleSaveMovimentacao = async () => {
    if (!user) return;
    if (!movFormData.descricao || !movFormData.quantidade) {
      toast.error("Preencha item e quantidade.");
      return;
    }
    try {
      await addDoc(collection(db, "prod_insumos_movimentacoes"), {
        userId: user.uid,
        tipo: movFormData.tipo,
        descricao: movFormData.descricao,
        quantidade: parseFloat(movFormData.quantidade) || 0,
        unidade: movFormData.unidade || "un",
        motivo: movFormData.motivo || "",
        origem: movFormData.origem || "",
        data: movFormData.data,
        createdAt: serverTimestamp(),
      });
      toast.success("Movimentação de estoque registrada com sucesso!");
      setIsMovModalOpen(false);
      setMovFormData({
        tipo: "ENTRADA",
        descricao: "",
        quantidade: "1",
        unidade: "un",
        motivo: "",
        origem: "",
        data: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar movimentação.");
    }
  };

  const fetchCompras = () => {
    // Handled automatically via onSnapshot
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDoc(doc(db, "prod_compras", deleteConfirmId));
      toast.success("Compra removida!");
      setDeleteConfirmId(null);
      fetchCompras();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "prod_compras");
    }
  };
  const toggleStatus = async (compra: any) => {
    try {
      const novoStatus =
        compra.statusPagamento === "pago" ? "pendente" : "pago";
      let novasParcelas = compra.parcelas || [];
      if (novoStatus === "pago") {
        novasParcelas = novasParcelas.map((p: any) => ({
          ...p,
          status: "pago",
        }));
      } else {
        novasParcelas = novasParcelas.map((p: any) => ({
          ...p,
          status: "pendente",
        }));
      }
      await updateDoc(doc(db, "prod_compras", compra.id), {
        statusPagamento: novoStatus,
        parcelas: novasParcelas,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Status alterado para ${novoStatus}!`);
      fetchCompras();
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao atualizar");
    }
  };
  const pagarParcela = async (compra: any, idx: number) => {
    try {
      const novasParcelas = [...(compra.parcelas || [])];
      if (!novasParcelas[idx]) return;
      novasParcelas[idx].status =
        novasParcelas[idx].status === "pago" ? "pendente" : "pago";
      const allPaid = novasParcelas.every((p) => p.status === "pago");
      const novoStatus = allPaid ? "pago" : "pendente";
      await updateDoc(doc(db, "prod_compras", compra.id), {
        statusPagamento: novoStatus,
        parcelas: novasParcelas,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Parcela ${idx + 1} atualizada!`);
      if (selectedCompra && selectedCompra.id === compra.id) {
        setSelectedCompra({
          ...compra,
          statusPagamento: novoStatus,
          parcelas: novasParcelas,
        });
      }
      fetchCompras();
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao atualizar parcela");
    }
  };
  const openEdit = (compra: any) => {
    setFormData({
      descricao: compra.descricao || "",
      fornecedor: compra.fornecedor || "",
      detalhePagamento: compra.detalhePagamento || "",
      quantidade: compra.quantidade || "1",
      unidade: compra.unidade || "un",
      categoria: compra.categoria || "Insumos",
      valorTotal:
        typeof compra.valorTotal === "number"
          ? compra.valorTotal.toString()
          : "",
      dataCompra: compra.dataCompra || "",
      tipoPagamento: compra.tipoPagamento || "a_vista",
      formaPagamento: compra.formaPagamento || "Pix",
      quantidadeParcelas: compra.quantidadeParcelas || "1",
      intervaloDias: compra.intervaloDias || "30",
      parcelas: compra.parcelas || [],
      statusPagamento: compra.statusPagamento || "pago",
    });
    setEditingId(compra.id);
    setIsDialogOpen(true);
  };
  const resetForm = () => {
    setFormData(defaultForm);
    setEditingId(null);
  };
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };
  const filteredAndSortedCompras = useMemo(() => {
    let result = compras.filter(
      (c) =>
        (c.descricao || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.fornecedor || "").toLowerCase().includes(search.toLowerCase()),
    );
    if (filterCategoria !== "Todas") {
      result = result.filter((c) => c.categoria === filterCategoria);
    }
    if (filterStatus !== "Todos") {
      if (filterStatus === "Pagos")
        result = result.filter((c) => c.statusPagamento === "pago");
      if (filterStatus === "Pendentes")
        result = result.filter((c) => c.statusPagamento === "pendente");
    }
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [compras, search, sortField, sortOrder, filterCategoria, filterStatus]);
  const totalComprasValue = useMemo(() => {
    return filteredAndSortedCompras.reduce(
      (sum, item) => sum + (parseFloat(item.valorTotal) || 0),
      0,
    );
  }, [filteredAndSortedCompras]);
  const totalInvestido = compras.reduce(
    (sum, c) => sum + (c.valorTotal || 0),
    0,
  );
  const comprasDoMes = compras.filter(
    (c) => new Date(c.dataCompra).getMonth() === new Date().getMonth(),
  ).length;
  const fornecedoresCount = new Set(
    compras.map((c) => c.fornecedor).filter(Boolean),
  ).size;
  const pendentesVal = compras.reduce((sum, c) => {
    if (c.tipoPagamento === "a_prazo" && c.parcelas && c.parcelas.length > 0) {
      return (
        sum +
        c.parcelas
          .filter((p: any) => p.status !== "pago")
          .reduce(
            (pSum: number, p: any) => pSum + (parseFloat(p.valor) || 0),
            0,
          )
      );
    } else {
      return sum + (c.statusPagamento === "pendente" ? c.valorTotal || 0 : 0);
    }
  }, 0);
  const maiorCompraObj = compras.reduce(
    (max, c) => ((c.valorTotal || 0) > (max.valorTotal || 0) ? c : max),
    compras[0] || null,
  );
  const maiorCompra = maiorCompraObj?.valorTotal || 0;
  const maiorCompraFornecedor = maiorCompraObj?.fornecedor || "-";
  const ticketMedio = compras.length ? totalInvestido / compras.length : 0;
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth();
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curYear, curMonth - i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const totalMonth = compras
        .filter((c) => {
          if (!c.dataCompra) return false;
          const cDate = new Date(c.dataCompra + "T00:00:00");
          return cDate.getMonth() === mIdx && cDate.getFullYear() === y;
        })
        .reduce((sum, c) => sum + (Number(c.valorTotal) || 0), 0);
      last6.push({ name: months[mIdx], value: totalMonth });
    }
    return last6;
  }, [compras]);
  const categoryData = categoriasDisponiveis
    .filter((c) => c !== "Todas")
    .map((cat, i) => ({
      name: cat,
      value: compras
        .filter((c) => c.categoria === cat)
        .reduce((sum, c) => sum + (c.valorTotal || 0), 0),
      color: ["#6D4AFF", "#8B73FF", "#A996FF", "#C7BCFF", "#E5E3FF"][i % 5],
    }))
    .filter((c) => c.value > 0);
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full max-w-none mx-auto p-4 md:p-8 pb-10">
      {" "}
      {/* HEADER */}{" "}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {" "}
        <div>
          {" "}
          <h2 className="text-[28px] font-semibold tracking-tight text-foreground">
            {" "}
            Compras e Insumos{" "}
          </h2>{" "}
          <p className="text-[15px] text-muted-foreground font-medium mt-1">
            Gerencie todas as compras da confecção.
          </p>{" "}
        </div>{" "}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setIsMovModalOpen(true)}
            variant="outline"
            className="rounded-[18px] px-5 h-12 font-bold border-border hover:bg-muted"
          >
            <ArrowUpDown size={18} className="mr-2 text-primary" strokeWidth={2.5} /> Movimentar Estoque
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all outline-none rounded-[18px] px-6 h-12 font-bold border-none shrink-0"
          >
            <Plus size={18} className="mr-2" strokeWidth={3} /> Nova Compra
          </Button>
        </div>
      </div>

      {/* TABS NAVEGAÇÃO DEPARTAMENTAL */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveInsumoTab("compras")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeInsumoTab === "compras"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Compras de Insumos ({compras.length})
        </button>
        <button
          onClick={() => setActiveInsumoTab("estoque")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeInsumoTab === "estoque"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Gestão de Estoque & Movimentações ({movimentacoes.length})
        </button>
      </div>{" "}
      {/* CARDS EXECUTIVOS */}{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {" "}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between"
        >
          {" "}
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            {" "}
            <DollarSign size={16} />{" "}
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Investido
            </span>{" "}
          </div>{" "}
          <div className="text-[24px] font-bold text-foreground">
            {" "}
            {totalInvestido.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}{" "}
          </div>{" "}
        </motion.div>{" "}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between"
        >
          {" "}
          <div className="flex items-center gap-2 mb-2 text-success">
            {" "}
            <CheckCircle size={16} />{" "}
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Pago
            </span>{" "}
          </div>{" "}
          <div className="text-[24px] font-bold text-foreground">
            {" "}
            {(totalInvestido - pendentesVal).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}{" "}
          </div>{" "}
        </motion.div>{" "}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between"
        >
          {" "}
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            {" "}
            <Clock size={16} />{" "}
            <span className="text-xs font-bold uppercase tracking-wider">
              Pendente
            </span>{" "}
          </div>{" "}
          <div className="text-[24px] font-bold text-foreground">
            {" "}
            {pendentesVal.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}{" "}
          </div>{" "}
        </motion.div>{" "}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between"
        >
          {" "}
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            {" "}
            <ShoppingBag size={16} />{" "}
            <span className="text-xs font-bold uppercase tracking-wider">
              Compras Mês
            </span>{" "}
          </div>{" "}
          <div className="text-[24px] font-bold text-foreground">
            {" "}
            {comprasDoMes}{" "}
          </div>{" "}
        </motion.div>{" "}
      </div>{" "}
      {/* MAIN CONTENT AREA - NO SIDEBAR, FULL WIDTH TABLE */}
      {activeInsumoTab === "compras" ? (
      <div className="space-y-6">
        {" "}
        {/* FILTROS MODERNOS PILLS */}{" "}
        <div className="flex flex-col gap-4">
          {" "}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
            {" "}
            <div className="flex flex-wrap gap-2 items-center">
              {" "}
              <Button
                variant={filterStatus === "Todos" ? "default" : "outline"}
                onClick={() => setFilterStatus("Todos")}
                className={`rounded-[18px] h-9 px-4 font-bold text-[13px] ${filterStatus === "Todos" ? "bg-primary text-white border-none" : "bg-transparent border-border/50 text-muted-foreground hover:text-foreground"}`}
              >
                {" "}
                Todos{" "}
              </Button>{" "}
              <Button
                variant={filterStatus === "Pendentes" ? "default" : "outline"}
                onClick={() => setFilterStatus("Pendentes")}
                className={`rounded-[18px] h-9 px-4 font-bold text-[13px] ${filterStatus === "Pendentes" ? "bg-primary text-white border-none" : "bg-transparent border-border/50 text-muted-foreground hover:text-foreground"}`}
              >
                {" "}
                Pendentes{" "}
              </Button>{" "}
              <Button
                variant={filterStatus === "Pagos" ? "default" : "outline"}
                onClick={() => setFilterStatus("Pagos")}
                className={`rounded-[18px] h-9 px-4 font-bold text-[13px] ${filterStatus === "Pagos" ? "bg-primary text-white border-none" : "bg-transparent border-border/50 text-muted-foreground hover:text-foreground"}`}
              >
                {" "}
                Pagos{" "}
              </Button>{" "}
            </div>{" "}
            <div className="premium-card flex gap-2 p-1 rounded-[20px] -/50 shrink-0">
              {" "}
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                onClick={() => setViewMode("cards")}
                className={`h-8 w-10 p-0 rounded-[16px] ${viewMode === "cards" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              >
                {" "}
                <LayoutGrid size={16} />{" "}
              </Button>{" "}
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                onClick={() => setViewMode("table")}
                className={`h-8 w-10 p-0 rounded-[16px] ${viewMode === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              >
                {" "}
                <List size={16} />{" "}
              </Button>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* GRID / TABLE */}{" "}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {" "}
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 rounded-[24px] bg-muted animate-pulse"
              ></div>
            ))}{" "}
          </div>
        ) : filteredAndSortedCompras.length === 0 ? (
          <div className="premium-card flex flex-col items-center justify-center p-16 -/50 rounded-[32px]">
            {" "}
            <PackageOpen
              size={48}
              className="text-muted-foreground mb-4 opacity-50"
            />{" "}
            <h3 className="text-xl font-bold mb-1">
              Nenhuma compra encontrada
            </h3>{" "}
            <p className="text-muted-foreground">
              Você ainda não registrou nenhuma compra ou insumo.
            </p>{" "}
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {" "}
            <AnimatePresence>
              {" "}
              {filteredAndSortedCompras.map((compra) => {
                const isPago = compra.statusPagamento === "pago";
                return (
                  <motion.div
                    layout
                    key={compra.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{
                      y: -6,
                      boxShadow: "0 20px 40px -10px rgba(109, 74, 255, 0.15)",
                    }}
                    className="bg-card border border-border/50 rounded-[24px] p-6 shadow-sm flex flex-col group transition-all duration-300 relative overflow-hidden"
                  >
                    {" "}
                    <div className="flex items-start justify-between mb-4">
                      {" "}
                      <div className="flex items-center gap-3">
                        {" "}
                        <div className="w-10 h-10 rounded-[16px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          {" "}
                          <PackageOpen size={20} />{" "}
                        </div>{" "}
                        <div className="min-w-0">
                          {" "}
                          <h4 className="font-bold text-foreground text-base leading-tight line-clamp-1">
                            {compra.descricao}
                          </h4>{" "}
                          <p className="text-xs font-medium text-muted-foreground truncate">
                            {compra.fornecedor || "Fornecedor N/A"}
                          </p>{" "}
                        </div>{" "}
                      </div>{" "}
                      <DropdownMenu>
                        {" "}
                        <DropdownMenuTrigger className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors outline-none shrink-0">
                          {" "}
                          <MoreVertical size={16} />{" "}
                        </DropdownMenuTrigger>{" "}
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-2xl p-2 font-medium shadow-xl border-border/50 bg-white/95 backdrop-blur-md"
                        >
                          {" "}
                          <DropdownMenuItem
                            onClick={() => setSelectedCompra(compra)}
                            className="cursor-pointer gap-2 py-2.5 rounded-xl"
                          >
                            <Eye size={16} /> Visualizar Detalhes
                          </DropdownMenuItem>{" "}
                          <DropdownMenuItem
                            onClick={() => openEdit(compra)}
                            className="cursor-pointer gap-2 py-2.5 rounded-xl"
                          >
                            <Edit2 size={16} /> Editar Compra
                          </DropdownMenuItem>{" "}
                          <DropdownMenuItem className="cursor-pointer gap-2 py-2.5 rounded-xl">
                            <Copy size={16} /> Duplicar
                          </DropdownMenuItem>{" "}
                          {!isPago && (
                            <DropdownMenuItem
                              onClick={() => toggleStatus(compra)}
                              className="cursor-pointer gap-2 py-2.5 rounded-xl text-primary"
                            >
                              <CreditCard size={16} /> Pagar Total
                            </DropdownMenuItem>
                          )}{" "}
                          <div className="h-px bg-border/50 my-1"></div>{" "}
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirmId(compra.id)}
                            className="cursor-pointer gap-2 py-2.5 rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 size={16} /> Excluir
                          </DropdownMenuItem>{" "}
                        </DropdownMenuContent>{" "}
                      </DropdownMenu>{" "}
                    </div>{" "}
                    <div className="mb-4">
                      {" "}
                      <div className="text-[30px] font-black text-foreground tracking-tight">
                        {" "}
                        {(compra.valorTotal || 0).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}{" "}
                      </div>{" "}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {" "}
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary text-foreground px-2 py-1 rounded-full truncate max-w-full">
                          {compra.categoria}
                        </span>{" "}
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary text-foreground px-2 py-1 rounded-full">
                          {compra.formaPagamento}
                        </span>{" "}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${isPago ? "bg-success/10 text-success" : "bg-amber-100 text-amber-700"}`}
                        >
                          {" "}
                          {isPago ? "Pago" : "Pendente"}{" "}
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-border/50">
                      {" "}
                      <div className="bg-secondary/30 p-2 rounded-xl">
                        {" "}
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          Data
                        </p>{" "}
                        <p className="text-[13px] font-semibold text-foreground truncate">
                          {new Date(compra.dataCompra).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>{" "}
                      </div>{" "}
                      <div className="bg-secondary/30 p-2 rounded-xl">
                        {" "}
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          Qtd / Und
                        </p>{" "}
                        <p className="text-[13px] font-semibold text-foreground truncate">
                          {compra.quantidade} {compra.unidade}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-card via-card to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 translate-y-2 group-hover:translate-y-0 duration-300">
                      {" "}
                      <Button
                        onClick={() => setSelectedCompra(compra)}
                        className="flex-1 rounded-[16px] h-10 font-bold bg-primary text-white border-none shadow-md"
                      >
                        Detalhes
                      </Button>{" "}
                      {!isPago && (
                        <Button
                          onClick={() => toggleStatus(compra)}
                          variant="outline"
                          className="flex-1 rounded-[16px] h-10 font-bold bg-white text-foreground shadow-sm"
                        >
                          Pagar Total
                        </Button>
                      )}{" "}
                    </div>{" "}
                  </motion.div>
                );
              })}{" "}
            </AnimatePresence>{" "}
          </div>
        ) : (
          <div className="premium-card -/50 rounded-[24px] overflow-hidden">
            {" "}
            <div className="overflow-x-auto">
              {" "}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Descrição
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Fornecedor
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Data
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                      Status
                    </th>
                    <th className="px-6 py-4"></th></tr></thead>
                <tbody className="divide-y divide-border/50">
                  {filteredAndSortedCompras.map((compra) => (
                    <tr
                      key={compra.id}
                      className="hover:bg-muted/50 transition-colors group"
                    >
                      <td className="px-6 py-4 font-bold text-[14px] text-foreground max-w-[200px] truncate">
                        {compra.descricao}
                      </td>
                      <td className="px-6 py-4 font-medium text-[14px] text-muted-foreground max-w-[150px] truncate">
                        {compra.fornecedor || "-"}
                      </td>
                      <td className="px-6 py-4 font-medium text-[14px] text-muted-foreground">
                        {new Date(compra.dataCompra).toLocaleDateString(
                          "pt-BR",
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-[15px] text-foreground text-right">
                        {(compra.valorTotal || 0).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {" "}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex ${compra.statusPagamento === "pago" ? "bg-success/10 text-success" : "bg-amber-100 text-amber-700"}`}
                        >
                          {" "}
                          {compra.statusPagamento === "pago"
                            ? "Pago"
                            : "Pendente"}{" "}
                        </span>{" "}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {" "}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedCompra(compra)}
                          className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100"
                        >
                          <Eye size={16} />
                        </Button>{" "}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(compra)}
                          className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={16} />
                        </Button>{" "}
                      </td></tr>
                  ))}</tbody></table>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>
      ) : (
        <div className="space-y-6">
          {/* CARDS RESUMO DO ESTOQUE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="premium-card p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <ShoppingBag size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">Itens Controlados</span>
              </div>
              <div className="text-[28px] font-bold text-foreground">{stockByItem.length}</div>
            </div>
            <div className="premium-card p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <ArrowUpDown size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Movimentações</span>
              </div>
              <div className="text-[28px] font-bold text-foreground">{movimentacoes.length}</div>
            </div>
            <div className="premium-card p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 text-success">
                <CheckCircle size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">Entradas Registradas</span>
              </div>
              <div className="text-[28px] font-bold text-foreground">
                {movimentacoes.filter((m) => m.tipo === "ENTRADA" || m.tipo === "DEVOLUCAO").length}
              </div>
            </div>
            <div className="premium-card p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Clock size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">Saídas / Consumo</span>
              </div>
              <div className="text-[28px] font-bold text-foreground">
                {movimentacoes.filter((m) => m.tipo === "SAIDA" || m.tipo === "PERDA").length}
              </div>
            </div>
          </div>

          {/* TABELA DE SALDO ATUAL POR INSUMO */}
          <div className="premium-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Saldo Atual por Insumo</h3>
                <p className="text-xs text-muted-foreground">Calculado estritamente pelas movimentações de estoque (Kardex).</p>
              </div>
              <Button
                onClick={() => setIsMovModalOpen(true)}
                className="rounded-xl h-10 px-4 font-bold bg-primary text-white"
              >
                <Plus size={16} className="mr-1.5" /> Registrar Ajuste / Consumo
              </Button>
            </div>

            {stockByItem.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm font-medium">
                Nenhum saldo ou movimentação de insumo registrada ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Insumo / Material</th>
                      <th className="px-6 py-4">Unidade</th>
                      <th className="px-6 py-4 text-right">Total Entradas</th>
                      <th className="px-6 py-4 text-right">Total Saídas</th>
                      <th className="px-6 py-4 text-right">Saldo em Estoque</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-medium">
                    {stockByItem.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground capitalize">{item.descricao}</td>
                        <td className="px-6 py-4 text-muted-foreground uppercase">{item.unidade}</td>
                        <td className="px-6 py-4 text-right text-foreground font-semibold">{item.entradas.toLocaleString("pt-BR")}</td>
                        <td className="px-6 py-4 text-right text-muted-foreground font-semibold">{item.saidas.toLocaleString("pt-BR")}</td>
                        <td className="px-6 py-4 text-right font-black text-primary text-base">
                          {item.saldo.toLocaleString("pt-BR")} {item.unidade}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                              item.saldo > 0
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                            }`}
                          >
                            {item.saldo > 0 ? "Em Estoque" : "Esgotado"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TABELA DE HISTÓRICO DE MOVIMENTAÇÕES */}
          <div className="premium-card p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Histórico de Movimentações (Kardex)</h3>
              <p className="text-xs text-muted-foreground">Registro imutável de todas as entradas, saídas, perdas e ajustes.</p>
            </div>

            {movimentacoes.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm font-medium">
                Nenhuma movimentação registrada no histórico.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Tipo</th>
                      <th className="px-6 py-4">Insumo</th>
                      <th className="px-6 py-4 text-right">Quantidade</th>
                      <th className="px-6 py-4">Origem / Destino</th>
                      <th className="px-6 py-4">Motivo / Justificativa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-medium text-xs">
                    {movimentacoes.map((mov) => (
                      <tr key={mov.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">
                          {mov.data ? new Date(mov.data + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                              mov.tipo === "ENTRADA" || mov.tipo === "DEVOLUCAO"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : mov.tipo === "AJUSTE"
                                ? "bg-muted text-foreground border-border"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            }`}
                          >
                            {mov.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-foreground">{mov.descricao}</td>
                        <td className="px-6 py-4 text-right font-black text-foreground">
                          {mov.tipo === "SAIDA" || mov.tipo === "PERDA" ? "-" : "+"}
                          {mov.quantidade} {mov.unidade}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{mov.origem || "-"}</td>
                        <td className="px-6 py-4 text-muted-foreground">{mov.motivo || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* NOVA COMPRA MODAL - REDESENHADO 50% */}{" "}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {" "}
        <DialogContent className="w-[95vw] sm:max-w-none md:max-w-[800px] lg:max-w-[900px] rounded-[2rem] p-0 overflow-hidden border-border/50 bg-card shadow-2xl flex flex-col max-h-[90vh]">
          {" "}
          {/* Header Fixo */}{" "}
          <div className="premium-card px-8 py-6 border-b -/50 flex justify-between items-center /50 backdrop-blur-md shrink-0">
            {" "}
            <div>
              {" "}
              <DialogTitle className="text-2xl font-black text-foreground">
                {" "}
                {editingId ? "Editar Compra" : "Nova Compra"}{" "}
              </DialogTitle>{" "}
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Preencha as informações da compra.
              </p>{" "}
            </div>{" "}
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
              {" "}
              <ShoppingBag size={24} className="text-primary" />{" "}
            </div>{" "}
          </div>{" "}
          {/* Scrollable Content */}{" "}
          <div className="overflow-y-auto p-8 space-y-10 hide-scrollbar bg-background/50">
            {" "}
            {/* Seção 1: Dados Principais */}{" "}
            <div className="space-y-6">
              {" "}
              <h4 className="font-bold text-foreground text-base border-b border-border/50 pb-2">
                Dados Principais
              </h4>{" "}
              <div className="grid grid-cols-1 gap-6">
                {" "}
                <div className="space-y-2">
                  {" "}
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Descrição *
                  </Label>{" "}
                  <Input
                    placeholder="Ex: Rolo de Tecido Preto"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    className="h-12 rounded-xl bg-card border-border/50 font-medium"
                  />{" "}
                </div>{" "}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {" "}
                  <div className="space-y-2">
                    {" "}
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Fornecedor
                    </Label>{" "}
                    <Input
                      placeholder="Nome da empresa"
                      value={formData.fornecedor}
                      onChange={(e) =>
                        setFormData({ ...formData, fornecedor: e.target.value })
                      }
                      className="h-12 rounded-xl bg-card border-border/50 font-medium"
                    />{" "}
                  </div>{" "}
                  <div className="space-y-2">
                    {" "}
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Categoria
                    </Label>{" "}
                    <Input
                      placeholder="Ex: Tecidos"
                      value={formData.categoria}
                      onChange={(e) =>
                        setFormData({ ...formData, categoria: e.target.value })
                      }
                      className="h-12 rounded-xl bg-card border-border/50 font-medium"
                    />{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Seção 2: Quantidade e Valor */}{" "}
            <div className="space-y-6">
              {" "}
              <h4 className="font-bold text-foreground text-base border-b border-border/50 pb-2">
                Quantidade e Valor
              </h4>{" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {" "}
                <div className="grid grid-cols-2 gap-4">
                  {" "}
                  <div className="space-y-2">
                    {" "}
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Qtd.
                    </Label>{" "}
                    <Input
                      type="number"
                      placeholder="1"
                      value={formData.quantidade}
                      onChange={(e) =>
                        setFormData({ ...formData, quantidade: e.target.value })
                      }
                      className="h-12 rounded-xl bg-card border-border/50 font-medium"
                    />{" "}
                  </div>{" "}
                  <div className="space-y-2">
                    {" "}
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Und.
                    </Label>{" "}
                    <Input
                      placeholder="Kg, Mts"
                      value={formData.unidade}
                      onChange={(e) =>
                        setFormData({ ...formData, unidade: e.target.value })
                      }
                      className="h-12 rounded-xl bg-card border-border/50 font-medium"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <Label className="text-xs font-bold text-primary uppercase tracking-wider">
                    Valor Total (R$) *
                  </Label>{" "}
                  <div className="relative">
                    {" "}
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground font-bold text-sm">
                      R$
                    </div>{" "}
                    <Input
                      placeholder="0,00"
                      value={formData.valorTotal}
                      onChange={(e) =>
                        setFormData(
                          updateParcelasOnChange(
                            { valorTotal: e.target.value },
                            formData,
                          ),
                        )
                      }
                      className="h-12 rounded-xl bg-primary/5 border-primary/20 focus:border-primary pl-10 font-bold text-primary"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="space-y-2 md:col-span-2">
                  {" "}
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Data da Compra *
                  </Label>{" "}
                  <Input
                    type="date"
                    value={formData.dataCompra}
                    onChange={(e) =>
                      setFormData({ ...formData, dataCompra: e.target.value })
                    }
                    className="h-12 rounded-xl bg-card border-border/50 font-medium"
                  />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Seção 3: Condições de Pagamento */}{" "}
            <div className="space-y-6">
              {" "}
              <h4 className="font-bold text-foreground text-base border-b border-border/50 pb-2">
                Condições de Pagamento
              </h4>{" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {" "}
                <div className="space-y-2">
                  {" "}
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Condição
                  </Label>{" "}
                  <Select
                    value={formData.tipoPagamento}
                    onValueChange={handleTipoPagamentoChange}
                  >
                    {" "}
                    <SelectTrigger className="h-12 rounded-xl bg-card border-border/50 font-medium px-4">
                      {" "}
                      <SelectValue />{" "}
                    </SelectTrigger>{" "}
                    <SelectContent className="rounded-xl border-border/50 shadow-xl">
                      {" "}
                      <SelectItem
                        value="a_vista"
                        className="font-medium cursor-pointer py-2 rounded-lg text-sm"
                      >
                        À Vista
                      </SelectItem>{" "}
                      <SelectItem
                        value="a_prazo"
                        className="font-medium cursor-pointer py-2 rounded-lg text-sm"
                      >
                        Parcelado
                      </SelectItem>{" "}
                    </SelectContent>{" "}
                  </Select>{" "}
                </div>{" "}
                {/* Forma is available for both */}{" "}
                <div className="space-y-2">
                  {" "}
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Forma
                  </Label>{" "}
                  <Select
                    value={formData.formaPagamento}
                    onValueChange={(v) =>
                      setFormData({ ...formData, formaPagamento: v })
                    }
                  >
                    {" "}
                    <SelectTrigger className="h-12 rounded-xl bg-card border-border/50 font-medium px-4">
                      {" "}
                      <SelectValue />{" "}
                    </SelectTrigger>{" "}
                    <SelectContent className="rounded-xl border-border/50 shadow-xl">
                      {" "}
                      <SelectItem
                        value="Pix"
                        className="font-medium cursor-pointer py-2 rounded-lg text-sm"
                      >
                        Pix
                      </SelectItem>{" "}
                      <SelectItem
                        value="Dinheiro"
                        className="font-medium cursor-pointer py-2 rounded-lg text-sm"
                      >
                        Dinheiro
                      </SelectItem>{" "}
                      <SelectItem
                        value="Cartao"
                        className="font-medium cursor-pointer py-2 rounded-lg text-sm"
                      >
                        Cartão
                      </SelectItem>{" "}
                      <SelectItem
                        value="Boleto"
                        className="font-medium cursor-pointer py-2 rounded-lg text-sm"
                      >
                        Boleto
                      </SelectItem>{" "}
                    </SelectContent>{" "}
                  </Select>{" "}
                </div>{" "}
                {formData.tipoPagamento === "a_vista" && (
                  <>
                    {" "}
                    <div className="space-y-2 md:col-span-2">
                      {" "}
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Status do Pagamento
                      </Label>{" "}
                      <Select
                        value={formData.statusPagamento}
                        onValueChange={(v) =>
                          setFormData({ ...formData, statusPagamento: v })
                        }
                      >
                        {" "}
                        <SelectTrigger className="h-12 rounded-xl bg-card border-border/50 font-medium px-4">
                          {" "}
                          <SelectValue />{" "}
                        </SelectTrigger>{" "}
                        <SelectContent className="rounded-xl border-border/50 shadow-xl">
                          {" "}
                          <SelectItem
                            value="pago"
                            className="font-medium text-success cursor-pointer py-2 rounded-lg text-sm"
                          >
                            Pago
                          </SelectItem>{" "}
                          <SelectItem
                            value="pendente"
                            className="font-medium text-amber-600 cursor-pointer py-2 rounded-lg text-sm"
                          >
                            Pendente
                          </SelectItem>{" "}
                        </SelectContent>{" "}
                      </Select>{" "}
                    </div>{" "}
                  </>
                )}{" "}
              </div>{" "}
              {formData.tipoPagamento === "a_prazo" && (
                <div className="mt-6 p-6 bg-accent/30 rounded-2xl border border-border/50 space-y-6">
                  {" "}
                  <div className="grid grid-cols-2 gap-6">
                    {" "}
                    <div className="space-y-2">
                      {" "}
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Nº de Parcelas
                      </Label>{" "}
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.quantidadeParcelas}
                        onChange={(e) =>
                          setFormData(
                            updateParcelasOnChange(
                              { quantidadeParcelas: e.target.value },
                              formData,
                            ),
                          )
                        }
                        className="h-12 rounded-xl bg-card border-border/50 font-medium"
                      />{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Intervalo (Dias)
                      </Label>{" "}
                      <Input
                        type="number"
                        min="1"
                        value={formData.intervaloDias}
                        onChange={(e) =>
                          setFormData(
                            updateParcelasOnChange(
                              { intervaloDias: e.target.value },
                              formData,
                            ),
                          )
                        }
                        className="h-12 rounded-xl bg-card border-border/50 font-medium"
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="max-h-60 overflow-y-auto space-y-2 hide-scrollbar pr-1">
                    {" "}
                    {formData.parcelas.map((p: any, i: number) => (
                      <div
                        key={i}
                        className="premium-card flex gap-3 items-center p-3 -/50"
                      >
                        {" "}
                        <div className="text-xs font-bold text-muted-foreground w-6 text-center">
                          {i + 1}x
                        </div>{" "}
                        <Input
                          type="date"
                          value={p.dataVencimento}
                          onChange={(e) => {
                            const arr = [...formData.parcelas];
                            arr[i].dataVencimento = e.target.value;
                            setFormData({ ...formData, parcelas: arr });
                          }}
                          className="h-10 text-sm rounded-lg flex-1 border-border/50 font-medium"
                        />{" "}
                        <Input
                          type="number"
                          step="0.01"
                          value={p.valor}
                          onChange={(e) => {
                            const arr = [...formData.parcelas];
                            arr[i].valor = e.target.value;
                            setFormData({ ...formData, parcelas: arr });
                          }}
                          className="h-10 text-sm rounded-lg w-28 border-border/50 font-medium text-right"
                        />{" "}
                      </div>
                    ))}{" "}
                  </div>{" "}
                </div>
              )}{" "}
            </div>{" "}
            {/* Seção 4: Outros */}{" "}
            <div className="space-y-6">
              {" "}
              <h4 className="font-bold text-foreground text-base border-b border-border/50 pb-2">
                Observações
              </h4>{" "}
              <div className="space-y-2">
                {" "}
                <Input
                  placeholder="Informações adicionais ou notas..."
                  value={formData.detalhePagamento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      detalhePagamento: e.target.value,
                    })
                  }
                  className="h-12 rounded-xl bg-card border-border/50 font-medium"
                />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Footer Fixo */}{" "}
          <div className="premium-card flex justify-end gap-3 px-8 py-5 border-t -/50 /50 backdrop-blur-md shrink-0">
            {" "}
            <Button
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl font-bold text-muted-foreground hover:text-foreground h-12 px-6"
            >
              Cancelar
            </Button>{" "}
            <Button
              onClick={handleSave}
              className="premium-btn-primary bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold px-8 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all border-none"
            >
              {" "}
              {editingId ? "Salvar Alterações" : "Confirmar Compra"}{" "}
            </Button>{" "}
          </div>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      {/* DETALHES MODAL (Manteve-se similar, mas ajustei responsividade) */}{" "}
      <Dialog
        open={!!selectedCompra}
        onOpenChange={(open) => !open && setSelectedCompra(null)}
      >
        {" "}
        <DialogContent className="w-[90vw] sm:max-w-none md:max-w-[700px] rounded-[2.5rem] p-0 overflow-hidden border-border/50 bg-card">
          {" "}
          {selectedCompra && (
            <>
              {" "}
              <div className="premium-card p-6 md:p-8 pb-6 border-b -/50 flex flex-col md:flex-row md:justify-between items-start md:items-center /50 backdrop-blur-md gap-4">
                {" "}
                <div className="flex-1">
                  {" "}
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    {" "}
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                      {selectedCompra.categoria}
                    </span>{" "}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${selectedCompra.statusPagamento === "pago" ? "bg-success/10 text-success" : "bg-amber-100 text-amber-700"}`}
                    >
                      {" "}
                      {selectedCompra.statusPagamento === "pago"
                        ? "Pago"
                        : "Pendente"}{" "}
                    </span>{" "}
                  </div>{" "}
                  <DialogTitle className="text-2xl md:text-3xl font-black text-foreground line-clamp-2">
                    {" "}
                    {selectedCompra.descricao}{" "}
                  </DialogTitle>{" "}
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-2">
                    {" "}
                    <Building size={14} />{" "}
                    {selectedCompra.fornecedor || "Fornecedor N/A"}{" "}
                  </p>{" "}
                </div>{" "}
                <div className="text-left md:text-right shrink-0">
                  {" "}
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    Valor Total
                  </p>{" "}
                  <p className="text-2xl md:text-[38px] font-bold tracking-tight text-foreground text-foreground">
                    {(selectedCompra.valorTotal || 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <div className="p-6 md:p-8 space-y-8 bg-background/50 max-h-[70vh] overflow-y-auto">
                {" "}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {" "}
                  <div className="premium-card p-4 rounded-[20px] -/50">
                    {" "}
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Data
                    </p>{" "}
                    <p className="text-sm font-black">
                      {new Date(selectedCompra.dataCompra).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>{" "}
                  </div>{" "}
                  <div className="premium-card p-4 rounded-[20px] -/50">
                    {" "}
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Qtd / Und
                    </p>{" "}
                    <p className="text-sm font-black">
                      {selectedCompra.quantidade} {selectedCompra.unidade}
                    </p>{" "}
                  </div>{" "}
                  <div className="premium-card p-4 rounded-[20px] -/50">
                    {" "}
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Condição
                    </p>{" "}
                    <p className="text-sm font-black">
                      {selectedCompra.tipoPagamento === "a_vista"
                        ? "À Vista"
                        : "Parcelado"}
                    </p>{" "}
                  </div>{" "}
                  <div className="premium-card p-4 rounded-[20px] -/50">
                    {" "}
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Forma
                    </p>{" "}
                    <p className="text-sm font-black">
                      {selectedCompra.formaPagamento}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                {selectedCompra.tipoPagamento === "a_prazo" &&
                  selectedCompra.parcelas &&
                  selectedCompra.parcelas.length > 0 && (
                    <div>
                      {" "}
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-3">
                        Cronograma de Pagamento
                      </h4>{" "}
                      <div className="premium-card/50 overflow-hidden shadow-sm">
                        {" "}
                        {selectedCompra.parcelas.map((p: any, idx: number) => (
                          <div
                            key={idx}
                            className={`flex justify-between items-center p-4 border-b border-border/50 last:border-0 transition-colors ${p.status === "pago" ? "bg-success/5 hover:bg-success/10" : "hover:bg-secondary/30"}`}
                          >
                            {" "}
                            <div className="flex items-center gap-4">
                              {" "}
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                                {p.numero}
                              </div>{" "}
                              <span className="text-sm font-bold">
                                {new Date(p.dataVencimento).toLocaleDateString(
                                  "pt-BR",
                                )}
                              </span>{" "}
                            </div>{" "}
                            <div className="flex items-center gap-4">
                              {" "}
                              <span className="text-sm font-black">
                                {(parseFloat(p.valor) || 0).toLocaleString(
                                  "pt-BR",
                                  { style: "currency", currency: "BRL" },
                                )}
                              </span>{" "}
                              {p.status === "pago" ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-success/10 text-success">
                                  Pago
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-100 text-amber-700">
                                  Pendente
                                </span>
                              )}{" "}
                              <Button
                                onClick={() =>
                                  pagarParcela(selectedCompra, idx)
                                }
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 rounded-full bg-secondary hover:bg-primary/20 transition-colors"
                              >
                                {" "}
                                <CheckCircle
                                  size={14}
                                  className={
                                    p.status === "pago"
                                      ? "text-success"
                                      : "text-muted-foreground"
                                  }
                                />{" "}
                              </Button>{" "}
                            </div>{" "}
                          </div>
                        ))}{" "}
                      </div>{" "}
                    </div>
                  )}{" "}
                {selectedCompra.detalhePagamento && (
                  <div>
                    {" "}
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-2">
                      Observações
                    </h4>{" "}
                    <p className="text-sm text-foreground bg-card p-4 rounded-[20px] border border-border/50 shadow-sm">
                      {selectedCompra.detalhePagamento}
                    </p>{" "}
                  </div>
                )}{" "}
                <div>
                  {" "}
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-3">
                    Linha do Tempo
                  </h4>{" "}
                  <div className="space-y-4 pl-2">
                    {" "}
                    <div className="flex items-start gap-4">
                      {" "}
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 ring-4 ring-primary/20"></div>{" "}
                      <div>
                        {" "}
                        <p className="text-sm font-bold">
                          Compra Registrada
                        </p>{" "}
                        <p className="text-xs text-muted-foreground">
                          Em{" "}
                          {new Date(
                            selectedCompra.createdAt?.toDate
                              ? selectedCompra.createdAt.toDate()
                              : selectedCompra.createdAt ||
                                  selectedCompra.dataCompra,
                          ).toLocaleDateString("pt-BR")}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                    {selectedCompra.statusPagamento === "pago" && (
                      <div className="flex items-start gap-4">
                        {" "}
                        <div className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0 ring-4 ring-success/20"></div>{" "}
                        <div>
                          {" "}
                          <p className="text-sm font-bold text-success">
                            Pagamento Confirmado
                          </p>{" "}
                          <p className="text-xs text-muted-foreground">
                            Status atualizado para pago.
                          </p>{" "}
                        </div>{" "}
                      </div>
                    )}{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </>
          )}{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        {" "}
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 text-center border border-border/50 bg-card">
          {" "}
          <div className="w-20 h-20 bg-destructive/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-destructive/20 shadow-inner">
            {" "}
            <Trash2
              size={32}
              className="text-destructive"
              strokeWidth={1.5}
            />{" "}
          </div>{" "}
          <DialogTitle className="text-2xl font-black mb-2 text-foreground">
            Excluir Registro?
          </DialogTitle>{" "}
          <p className="text-muted-foreground font-medium text-sm mb-8">
            Esta ação não pode ser desfeita. Todos os dados desta compra serão
            apagados permanentemente.
          </p>{" "}
          <DialogFooter className="flex gap-3 sm:justify-center w-full">
            {" "}
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-[18px] flex-1 h-12 font-bold hover:bg-black/5 text-foreground"
            >
              Cancelar
            </Button>{" "}
            <Button
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-[18px] flex-1 h-12 font-bold shadow-lg shadow-destructive/20 hover:-translate-y-0.5 transition-all"
            >
              Sim, Excluir
            </Button>{" "}
          </DialogFooter>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}

      {/* MODAL REGISTRAR MOVIMENTAÇÃO DE ESTOQUE */}
      <Dialog open={isMovModalOpen} onOpenChange={setIsMovModalOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2rem] p-8 border-border bg-card shadow-2xl">
          <DialogHeader className="pb-4 border-b border-border/50">
            <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">
              <ArrowUpDown className="w-6 h-6 text-primary" />
              Movimentação de Estoque
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Registre entradas, saídas, perdas ou ajustes com rastreabilidade total.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tipo de Movimentação *
              </Label>
              <Select
                value={movFormData.tipo}
                onValueChange={(v: any) => setMovFormData({ ...movFormData, tipo: v })}
              >
                <SelectTrigger className="h-12 rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl font-bold">
                  <SelectItem value="ENTRADA">ENTRADA (Abastecimento / Compra)</SelectItem>
                  <SelectItem value="SAIDA">SAÍDA (Consumo de Produção)</SelectItem>
                  <SelectItem value="AJUSTE">AJUSTE (Inventário / Balanço)</SelectItem>
                  <SelectItem value="PERDA">PERDA (Avaria / Descarte)</SelectItem>
                  <SelectItem value="DEVOLUCAO">DEVOLUÇÃO (Retorno ao Estoque)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Descrição do Insumo / Material *
              </Label>
              <Input
                placeholder="Ex: Tecido Malha Canelada, Zíper 15cm"
                value={movFormData.descricao}
                onChange={(e) => setMovFormData({ ...movFormData, descricao: e.target.value })}
                className="h-12 rounded-xl font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Quantidade *
                </Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={movFormData.quantidade}
                  onChange={(e) => setMovFormData({ ...movFormData, quantidade: e.target.value })}
                  className="h-12 rounded-xl font-bold text-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Unidade
                </Label>
                <Select
                  value={movFormData.unidade}
                  onValueChange={(v) => setMovFormData({ ...movFormData, unidade: v })}
                >
                  <SelectTrigger className="h-12 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl font-bold">
                    <SelectItem value="m">Metros (m)</SelectItem>
                    <SelectItem value="kg">Quilos (kg)</SelectItem>
                    <SelectItem value="un">Unidades (un)</SelectItem>
                    <SelectItem value="rl">Rolos (rl)</SelectItem>
                    <SelectItem value="pct">Pacotes (pct)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Data da Movimentação
                </Label>
                <Input
                  type="date"
                  value={movFormData.data}
                  onChange={(e) => setMovFormData({ ...movFormData, data: e.target.value })}
                  className="h-12 rounded-xl font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Origem / Destino / Facção
                </Label>
                <Input
                  placeholder="Ex: Corte, Facção Silva"
                  value={movFormData.origem}
                  onChange={(e) => setMovFormData({ ...movFormData, origem: e.target.value })}
                  className="h-12 rounded-xl font-medium"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Motivo / Justificativa
              </Label>
              <Input
                placeholder="Ex: Consumo para Lote L4589"
                value={movFormData.motivo}
                onChange={(e) => setMovFormData({ ...movFormData, motivo: e.target.value })}
                className="h-12 rounded-xl font-medium"
              />
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border/50 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMovModalOpen(false)}
              className="h-12 rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveMovimentacao}
              className="bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-bold px-6 shadow-md shadow-primary/20"
            >
              Salvar Movimentação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
