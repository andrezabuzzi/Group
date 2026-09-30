import { useState, useEffect } from "react";
import {
  db,
  storage,
  handleFirestoreError,
  OperationType,
} from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import {
  calcProductionProgress,
  calcProductionStatus,
  isProductionOverdue,
  calcBatchTotalCost,
  formatLote,
  calcProducaoFinanceiro,
} from "../lib/erpUtils";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Search,
  Plus,
  Filter,
  Clock,
  Edit2,
  Trash2,
  Tag,
  PlayCircle,
  AlertCircle,
  PauseCircle,
  Activity,
  CheckCircle2,
  FileText,
  Download,
  CheckSquare,
  DollarSign,
  Wallet,
  Paperclip,
  Loader2,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Shuffle,
  Layers,
  User,
  Calendar,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "../components/ui/dropdown-menu";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "motion/react";
export default function Producao() {
  const { user } = useAuth();
  const [producoes, setProducoes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [costureiras, setCostureiras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  /*  Filters */ const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [pagamentoFilter, setPagamentoFilter] = useState<string[]>([]);
  const [faseFilter, setFaseFilter] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRecebimentoOpen, setIsRecebimentoOpen] = useState(false);
  const [isPagamentoOpen, setIsPagamentoOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [recebimentoData, setRecebimentoData] = useState({
    producaoId: "",
    data: "",
    quantidade: "",
    quantidadeDefeito: "",
    observacao: "",
    quantidadePorTamanho: {} as Record<string, string>,
  });
  const [pagamentoData, setPagamentoData] = useState({
    producaoId: "",
    data: "",
    valor: "",
    favorecido: "",
    descricao: "",
    categoria: "Costura",
    formaPagamento: "PIX",
    observacao: "",
  });
  const [editRecebimentoOld, setEditRecebimentoOld] = useState<any>(null);
  const [editPagamentoOld, setEditPagamentoOld] = useState<any>(null);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<{
    url: string;
    nome: string;
    lote?: string;
    sku?: string;
    costureira?: string;
  } | null>(null);
  const [photoZoom, setPhotoZoom] = useState<number>(1);
  const [formData, setFormData] = useState({
    lote: "",
    produtoId: "",
    costureiraId: "",
    quantidadeTotal: "",
    quantidadePorTamanho: {} as Record<string, string>,
    valorTecido: "",
    fornecedorTecido: "",
    pagoTecido: false,
    fornecedoresTecido: [
      {
        fornecedor: "",
        rolos: "",
        tipoMedida: "metros" as "metros" | "kg",
        quantidade: "",
        valorUnitario: "",
        totalCompra: "",
      },
    ],
    valorModelagem: "",
    nomeModelista: "",
    pagoModelagem: false,
    valorRisco: "",
    nomeRiscador: "",
    pagoRisco: false,
    valorCorte: "",
    nomeCortador: "",
    pagoCorte: false,
    valorCostura: "",
    pagoCostura: false,
    valorInsumos: "",
    pagoInsumos: false,
    outrosGastos: "",
    pagoOutros: false,
    dataInicio: "",
    dataInicioCostura: "",
    dataPrevistaEntrega: "",
    etiquetaPrioridade: "normal",
    statusEntrega: "Pendente",
    statusProducao: "Pré-produção",
    observacoes: "",
    anexoUrl: "",
    anexoNome: "",
  });
  const [configuracoes, setConfiguracoes] = useState<{
    prioridades?: string[];
    status?: string[];
    statusProducao?: string[];
  }>({
    prioridades: ["normal", "urgente", "reposicao"],
    status: ["Pendente", "Parcial", "Completo"],
    statusProducao: [
      "Pré-produção",
      "Modelagem",
      "Risco",
      "Corte",
      "Costura",
      "Finalizado",
    ],
  });

  // Função para obter número de lote com Letra e no mínimo 4 números (ex: "L4589", "L0001")
  const getLoteCurto = (prod: any): string => {
    if (!prod) return "L0001";
    const rawLote = (prod.lote || "").trim();

    // 1. Se já está no formato de Letra(s) + 4 ou mais números (ex: L4589, L0001, L10290)
    const standardMatch = rawLote.match(/^([A-Za-z]+)[-_\s]*(\d{4,})$/);
    if (standardMatch) {
      return `${standardMatch[1].toUpperCase()}${standardMatch[2]}`;
    }

    // 2. Se o usuário digitou apenas números (ex: "4589" -> "L4589", "1" -> "L0001")
    if (/^\d+$/.test(rawLote)) {
      return `L${rawLote.padStart(4, "0")}`;
    }

    // 3. Se tiver letra + menos de 4 números (ex: "L1", "LT-01", "L-45", "LOTE 2")
    const letterFew = rawLote.match(/^([A-Za-z]+)[-_\s]*(\d{1,3})$/);
    if (letterFew) {
      const pref = ["LT", "LOTE"].includes(letterFew[1].toUpperCase())
        ? "L"
        : letterFew[1].toUpperCase();
      return `${pref}${letterFew[2].padStart(4, "0")}`;
    }

    // 4. Se for lote customizado do usuário sem ser hash longo antigo
    const isOldLongHash =
      /^LT-[A-Za-z0-9_-]{7,}$/i.test(rawLote) ||
      (rawLote.length > 15 && !rawLote.includes(" "));
    if (rawLote && !isOldLongHash) {
      const anyNum = rawLote.match(/(\d+)/);
      if (anyNum) {
        return `L${anyNum[1].padStart(4, "0")}`;
      }
      return rawLote;
    }

    // 5. Fallback para itens antigos sem lote ou com hash antigo:
    // Gera 4 dígitos determinísticos a partir do ID para manter consistência sem ser sequencial
    if (prod.id) {
      let hash = 0;
      for (let i = 0; i < prod.id.length; i++) {
        hash = (hash * 31 + prod.id.charCodeAt(i)) % 9000;
      }
      const num4 = Math.abs(hash) + 1000;
      return `L${num4}`;
    }
    return `L${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // Gera lote com Letra 'L' e 4 números aleatórios (ex: L4589, L8204), NÃO sequencial
  const gerarLoteAleatorio = (letra = "L"): string => {
    const existingLotes = new Set(
      (producoes || []).map((p) => (p.lote || "").toUpperCase().trim())
    );
    for (let attempts = 0; attempts < 100; attempts++) {
      const rand4 = Math.floor(1000 + Math.random() * 9000);
      const candidato = `${letra}${rand4}`;
      if (!existingLotes.has(candidato)) {
        return candidato;
      }
    }
    return `${letra}${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const getSelectedProductGrade = () => {
    const prod = produtos.find((p) => p.id === formData.produtoId);
    return prod?.gradeTamanho || [];
  };
  const getSelectedProductColors = () => {
    const prod = produtos.find((p) => p.id === formData.produtoId);
    return prod?.cores || [];
  };
  const getSelectedVariants = () => {
    const grades = getSelectedProductGrade();
    const cores = getSelectedProductColors();
    const variants: string[] = [];
    if (grades.length > 0 && cores.length > 0) {
      grades.forEach((g: string) => {
        cores.forEach((c: string) => {
          variants.push(`${g} - ${c}`);
        });
      });
    } else if (grades.length > 0) {
      variants.push(...grades);
    } else if (cores.length > 0) {
      variants.push(...cores);
    }
    return variants;
  };
  const selectedVariants = getSelectedVariants();
  const hasVariants = selectedVariants.length > 0;
  const handleQuantidadeTamanhoChange = (tamanho: string, value: string) => {
    const newGrade = { ...formData.quantidadePorTamanho, [tamanho]: value };
    const total = Object.values(newGrade).reduce(
      (acc, curr) => acc + (parseInt(curr as string) || 0),
      0,
    );
    setFormData({
      ...formData,
      quantidadePorTamanho: newGrade,
      quantidadeTotal: total > 0 ? String(total) : "",
    });
  };
  const fetchData = async () => {
    // Kept for backward compatibility
  };

  useEffect(() => {
    if (!user) return;
    const unsubProducoes = onSnapshot(
      query(collection(db, "prod_producoes"), where("userId", "==", user.uid)),
      (snapshot) => {
        setProducoes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "prod_producoes")
    );

    const unsubProdutos = onSnapshot(
      query(collection(db, "prod_produtos"), where("userId", "==", user.uid)),
      (snapshot) => {
        setProdutos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "prod_produtos")
    );

    const unsubCostureiras = onSnapshot(
      query(collection(db, "prod_costureiras"), where("userId", "==", user.uid)),
      (snapshot) => {
        setCostureiras(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "prod_costureiras")
    );

    const unsubConfig = onSnapshot(
      doc(db, "configuracoes", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfiguracoes({
            prioridades: data.prioridades?.length
              ? data.prioridades
              : ["normal", "urgente", "reposicao"],
            status: data.status?.length
              ? data.status
              : ["Pendente", "Parcial", "Completo"],
          });
        }
      }
    );

    return () => {
      unsubProducoes();
      unsubProdutos();
      unsubCostureiras();
      unsubConfig();
    };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!formData.produtoId || !formData.statusProducao) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    if (formData.statusProducao === "Costura") {
      if (!formData.costureiraId || !formData.quantidadeTotal) {
        toast.error(
          "Costureira e Quantidade são obrigatórios na fase de Costura",
        );
        return;
      }
    }
    try {
      const selectedProduto = produtos.find((p) => p.id === formData.produtoId);
      const selectedCostureira = costureiras.find(
        (c) => c.id === formData.costureiraId,
      );
      const qtd = parseInt(formData.quantidadeTotal) || 0;
      const calcValorTecido =
        formData.fornecedoresTecido.reduce(
          (acc, curr) => acc + (parseFloat(curr.totalCompra) || 0),
          0,
        ) ||
        parseFloat(formData.valorTecido) ||
        0;
      const custoTotalReal =
        calcValorTecido +
        (parseFloat(formData.valorCorte) || 0) +
        (parseFloat(formData.valorModelagem) || 0) +
        (parseFloat(formData.valorRisco) || 0) +
        (parseFloat(formData.valorCostura) || 0) * qtd +
        (parseFloat(formData.valorInsumos) || 0) +
        (parseFloat(formData.outrosGastos) || 0);
      let safeLote = (formData.lote || "").trim();
      if (!safeLote) {
        safeLote = editingId
          ? producoes.find((p) => p.id === editingId)?.lote ||
            getLoteCurto({ id: editingId })
          : gerarLoteAleatorio();
      } else {
        safeLote = formatLote(safeLote);
      }
      const existingProd = editingId ? producoes.find((p) => p.id === editingId) : null;
      const existingEntregue = existingProd ? (parseInt(existingProd.totalEntregue) || 0) : 0;
      const calculatedPendente = Math.max(0, qtd - existingEntregue);
      const calculatedProgress = calcProductionProgress(existingEntregue, qtd);

      // Account for items marked as already paid in the form (tecido, modelagem, risco, corte, costura, insumos, outros)
      const existingPaymentsList = existingProd?.pagamentos || existingProd?.pagamentosCostura || [];
      const getHistoryByCat = (catName: string) => {
        return existingPaymentsList
          .filter((p: any) => p.categoria && typeof p.categoria === "string" && p.categoria.toLowerCase().includes(catName.toLowerCase()))
          .reduce((acc: number, p: any) => acc + (parseFloat(p.valor) || 0), 0);
      };

      const valTecido = calcValorTecido;
      const valModelagem = parseFloat(formData.valorModelagem) || 0;
      const valRisco = parseFloat(formData.valorRisco) || 0;
      const valCorte = parseFloat(formData.valorCorte) || 0;
      const valCosturaTotal = (parseFloat(formData.valorCostura) || 0) * qtd;
      const valInsumos = parseFloat(formData.valorInsumos) || 0;
      const valOutros = parseFloat(formData.outrosGastos) || 0;

      const pagoTecido = formData.pagoTecido ? valTecido : Math.min(valTecido, getHistoryByCat("tecido"));
      const pagoModelagem = formData.pagoModelagem ? valModelagem : Math.min(valModelagem, getHistoryByCat("modelagem"));
      const pagoRisco = formData.pagoRisco ? valRisco : Math.min(valRisco, getHistoryByCat("risco"));
      const pagoCorte = formData.pagoCorte ? valCorte : Math.min(valCorte, getHistoryByCat("corte"));

      const sumHistoryCostura = existingPaymentsList
        .filter((p: any) => !p.categoria || (typeof p.categoria === "string" && p.categoria.toLowerCase().includes("costura")))
        .reduce((acc: number, p: any) => acc + (parseFloat(p.valor) || 0), 0);
      const pagoCostura = formData.pagoCostura ? valCosturaTotal : Math.max(0, sumHistoryCostura);

      const pagoInsumos = formData.pagoInsumos ? valInsumos : Math.min(valInsumos, getHistoryByCat("insumo") + getHistoryByCat("aviamento"));
      const pagoOutros = formData.pagoOutros ? valOutros : Math.min(valOutros, getHistoryByCat("outro"));

      // Pagamentos em histórico avulsos
      const sumHistoryAvulsos = existingPaymentsList
        .filter((p: any) => p.categoria && !["costura", "corte", "tecido", "modelagem", "risco", "insumo", "aviamento", "outro"].some(c => p.categoria.toLowerCase().includes(c)))
        .reduce((acc: number, p: any) => acc + (parseFloat(p.valor) || 0), 0);

      const calculatedTotalPago = pagoTecido + pagoModelagem + pagoRisco + pagoCorte + pagoCostura + pagoInsumos + pagoOutros + sumHistoryAvulsos;
      const calculatedTotalPagoCostura = pagoCostura;
      const calculatedSaldoPendente = Math.max(0, custoTotalReal - calculatedTotalPago);
      const calculatedStatusPagamento = calculatedSaldoPendente <= 0 ? "Pago" : calculatedTotalPago > 0 ? "Parcial" : "Pendente";

      const prodData: any = {
        lote: safeLote,
        sku:
          selectedProduto?.sku ||
          (editingId
            ? producoes.find((p) => p.id === editingId)?.sku || ""
            : "") ||
          "",
        produtoId: formData.produtoId,
        produtoNome: selectedProduto?.nome || "Desconhecido",
        produtoFoto:
          selectedProduto?.fotoUrl ||
          (editingId
            ? producoes.find((p) => p.id === editingId)?.produtoFoto
            : null) ||
          null,
        costureiraId: formData.costureiraId,
        costureiraNome: selectedCostureira?.nome || "Desconhecida",
        quantidadeTotal: qtd,
        quantidadePorTamanho: formData.quantidadePorTamanho,
        statusProducao: formData.statusProducao,
        statusEntrega: formData.statusEntrega,
        statusPagamento: calculatedStatusPagamento,
        etiquetas: [formData.etiquetaPrioridade],
        dataInicio: formData.dataInicio,
        dataInicioCostura: formData.dataInicioCostura,
        dataPrevistaEntrega: formData.dataPrevistaEntrega,
        valorTecido: calcValorTecido,
        pagoTecido: !!formData.pagoTecido,
        fornecedorTecido:
          formData.fornecedoresTecido
            .map((f) => f.fornecedor)
            .filter(Boolean)
            .join(", ") || formData.fornecedorTecido,
        fornecedoresTecido: formData.fornecedoresTecido,
        valorModelagem: parseFloat(formData.valorModelagem) || 0,
        nomeModelista: formData.nomeModelista,
        pagoModelagem: !!formData.pagoModelagem,
        valorRisco: parseFloat(formData.valorRisco) || 0,
        nomeRiscador: formData.nomeRiscador,
        pagoRisco: !!formData.pagoRisco,
        valorCorte: parseFloat(formData.valorCorte) || 0,
        nomeCortador: formData.nomeCortador,
        pagoCorte: !!formData.pagoCorte,
        valorCostura: parseFloat(formData.valorCostura) || 0,
        pagoCostura: !!formData.pagoCostura,
        valorInsumos: parseFloat(formData.valorInsumos) || 0,
        pagoInsumos: !!formData.pagoInsumos,
        outrosGastos: parseFloat(formData.outrosGastos) || 0,
        pagoOutros: !!formData.pagoOutros,
        custoTotal: custoTotalReal,
        custoPorPeca: qtd > 0 ? custoTotalReal / qtd : 0,
        totalEntregue: existingEntregue,
        totalPendente: calculatedPendente,
        percentualConcluido: calculatedProgress,
        totalPago: calculatedTotalPago,
        totalPagoCostura: calculatedTotalPagoCostura,
        saldoPendente: calculatedSaldoPendente,
        observacoes: formData.observacoes,
        anexoUrl: formData.anexoUrl,
        anexoNome: formData.anexoNome,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        await updateDoc(doc(db, "prod_producoes", editingId), prodData);
        toast.success("Produção atualizada!");
      } else {
        const newId = doc(collection(db, "prod_producoes")).id;
        prodData.totalPendente = qtd;
        prodData.totalEntregue = 0;
        prodData.percentualConcluido = 0;
        prodData.totalPago = calculatedTotalPago;
        prodData.totalPagoCostura = calculatedTotalPagoCostura;
        prodData.saldoPendente = calculatedSaldoPendente;
        prodData.pagamentos = [];
        prodData.recebimentos = [];
        prodData.createdAt = serverTimestamp();
        await setDoc(doc(db, "prod_producoes", newId), {
          id: newId,
          ...prodData,
        });
        toast.success("Produção cadastrada com sucesso!");
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar");
      handleFirestoreError(error, OperationType.WRITE, "prod_producoes");
    }
  };
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDoc(doc(db, "prod_producoes", deleteConfirmId));
      toast.success("Excluída com sucesso");
      setDeleteConfirmId(null);
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir");
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `prod_producoes/${deleteConfirmId}`,
      );
    }
  };
  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };
  const updateProdField = async (id: string, field: string, value: any) => {
    try {
      await updateDoc(doc(db, "prod_producoes", id), {
        [field]: value,
        updatedAt: serverTimestamp(),
      });
      toast.success("Atualizado com sucesso!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao atualizar");
      handleFirestoreError(error, OperationType.WRITE, `prod_producoes/${id}`);
    }
  };
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      lote: gerarLoteAleatorio(),
      produtoId: "",
      costureiraId: "",
      quantidadeTotal: "",
      quantidadePorTamanho: {},
      valorTecido: "",
      fornecedorTecido: "",
      pagoTecido: false,
      fornecedoresTecido: [
        {
          fornecedor: "",
          rolos: "",
          tipoMedida: "metros",
          quantidade: "",
          valorUnitario: "",
          totalCompra: "",
        },
      ],
      valorModelagem: "",
      nomeModelista: "",
      pagoModelagem: false,
      valorRisco: "",
      nomeRiscador: "",
      pagoRisco: false,
      valorCorte: "",
      nomeCortador: "",
      pagoCorte: false,
      valorCostura: "",
      pagoCostura: false,
      valorInsumos: "",
      pagoInsumos: false,
      outrosGastos: "",
      pagoOutros: false,
      dataInicio: "",
      dataInicioCostura: "",
      dataPrevistaEntrega: "",
      etiquetaPrioridade: "normal",
      statusEntrega: "Pendente",
      statusProducao: "Pré-produção",
      observacoes: "",
      anexoUrl: "",
      anexoNome: "",
    });
  };
  const openEdit = (prod: any) => {
    setEditingId(prod.id);
    const shortLote = getLoteCurto(prod);
    setFormData({
      lote: shortLote,
      produtoId: prod.produtoId,
      costureiraId: prod.costureiraId,
      quantidadeTotal: String(prod.quantidadeTotal || ""),
      quantidadePorTamanho: prod.quantidadePorTamanho || {},
      valorTecido: String(prod.valorTecido || ""),
      fornecedorTecido: prod.fornecedorTecido || "",
      pagoTecido: !!prod.pagoTecido,
      fornecedoresTecido:
        prod.fornecedoresTecido && prod.fornecedoresTecido.length > 0
          ? prod.fornecedoresTecido
          : [
              {
                fornecedor: prod.fornecedorTecido || "",
                rolos: "",
                tipoMedida: "metros",
                quantidade: "",
                valorUnitario: "",
                totalCompra: String(prod.valorTecido || ""),
              },
            ],
      valorModelagem: String(prod.valorModelagem || ""),
      nomeModelista: prod.nomeModelista || "",
      pagoModelagem: !!prod.pagoModelagem,
      valorRisco: String(prod.valorRisco || ""),
      nomeRiscador: prod.nomeRiscador || "",
      pagoRisco: !!prod.pagoRisco,
      valorCorte: String(prod.valorCorte || ""),
      nomeCortador: prod.nomeCortador || "",
      pagoCorte: !!prod.pagoCorte,
      valorCostura: String(prod.valorCostura || ""),
      pagoCostura: !!prod.pagoCostura,
      valorInsumos: String(prod.valorInsumos || ""),
      pagoInsumos: !!prod.pagoInsumos,
      outrosGastos: String(prod.outrosGastos || ""),
      pagoOutros: !!prod.pagoOutros,
      dataInicio: prod.dataInicio || "",
      dataInicioCostura: prod.dataInicioCostura || "",
      dataPrevistaEntrega: prod.dataPrevistaEntrega || "",
      etiquetaPrioridade: prod.etiquetas?.[0] || "normal",
      statusEntrega: prod.statusEntrega || "Pendente",
      statusProducao: prod.statusProducao || "Pré-produção",
      observacoes: prod.observacoes || "",
      anexoUrl: prod.anexoUrl || "",
      anexoNome: prod.anexoNome || "",
    });
    setIsDialogOpen(true);
  };
  const openRecebimento = (prodId: string, itemToEdit?: any) => {
    if (itemToEdit) {
      setEditRecebimentoOld(itemToEdit);
      setRecebimentoData({
        producaoId: prodId,
        data:
          itemToEdit.data ||
          itemToEdit.createdAt?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        quantidade: itemToEdit.quantidade?.toString() || "",
        quantidadePorTamanho: itemToEdit.quantidadePorTamanho || {},
        quantidadeDefeito: itemToEdit.quantidadeDefeito?.toString() || "",
        observacao: itemToEdit.observacao || "",
      });
    } else {
      setEditRecebimentoOld(null);
      setRecebimentoData({
        producaoId: prodId,
        data: new Date().toISOString().split("T")[0],
        quantidade: "",
        quantidadePorTamanho: {},
        quantidadeDefeito: "",
        observacao: "",
      });
    }
    setIsRecebimentoOpen(true);
  };
  const openPagamento = (prodId: string, itemToEdit?: any) => {
    const prod = producoes.find((p) => p.id === prodId);
    const shortLote = prod ? getLoteCurto(prod) : "";
    if (itemToEdit) {
      setEditPagamentoOld(itemToEdit);
      setPagamentoData({
        producaoId: prodId,
        data:
          itemToEdit.data ||
          itemToEdit.createdAt?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        valor: itemToEdit.valor?.toString() || "",
        favorecido: itemToEdit.favorecido || prod?.costureiraNome || "",
        descricao: itemToEdit.descricao || `Pagamento Costura Lote ${shortLote} - ${prod?.produtoNome || "Produção"}`,
        categoria: itemToEdit.categoria || "Costura",
        formaPagamento: itemToEdit.formaPagamento || "PIX",
        observacao: itemToEdit.observacao || "",
      });
    } else {
      setEditPagamentoOld(null);
      setPagamentoData({
        producaoId: prodId,
        data: new Date().toISOString().split("T")[0],
        valor: "",
        favorecido: prod?.costureiraNome || "",
        descricao: `Pagamento Costura Lote ${shortLote} - ${prod?.produtoNome || "Produção"}`,
        categoria: "Costura",
        formaPagamento: "PIX",
        observacao: "",
      });
    }
    setIsPagamentoOpen(true);
  };
  const handleSaveRecebimento = async () => {
    const totalQtd = parseInt(recebimentoData.quantidade) || 0;
    if (!totalQtd || totalQtd <= 0 || !recebimentoData.data) {
      toast.error("Preencha data e quantidade recebida.");
      return;
    }
    try {
      const prod = producoes.find((p) => p.id === recebimentoData.producaoId);
      if (!prod) return;
      const currentRecebimentos: any[] = prod.recebimentos || [];
      const entregaId = editRecebimentoOld?.id || `ent_${Date.now()}`;
      const qtdDefeito = parseInt(recebimentoData.quantidadeDefeito) || 0;

      const newRecebimento = {
        id: entregaId,
        producaoId: prod.id,
        data: recebimentoData.data,
        quantidade: totalQtd,
        quantidadePorTamanho: recebimentoData.quantidadePorTamanho || {},
        quantidadeDefeito: qtdDefeito,
        observacao: recebimentoData.observacao || "",
        responsavel: prod.costureiraNome || "Costureira / Facção",
        createdAt: editRecebimentoOld?.createdAt || new Date().toISOString(),
      };

      let newRecebimentosList: any[] = [];
      if (editRecebimentoOld) {
        newRecebimentosList = currentRecebimentos.map((r: any) =>
          (r.id && r.id === editRecebimentoOld.id) || r.createdAt === editRecebimentoOld.createdAt
            ? newRecebimento
            : r
        );
      } else {
        newRecebimentosList = [...currentRecebimentos, newRecebimento];
      }

      // Calculate total entregue strictly from the list of deliveries (never lose history!)
      const totalEntregueCalculado = newRecebimentosList.reduce(
        (acc, r) => acc + (parseInt(r.quantidade) || 0),
        0
      );
      const totalDefeitosCalculado = newRecebimentosList.reduce(
        (acc, r) => acc + (parseInt(r.quantidadeDefeito) || 0),
        0
      );
      const totalPendenteCalculado = Math.max(0, prod.quantidadeTotal - totalEntregueCalculado);
      const progressoCalculado = calcProductionProgress(totalEntregueCalculado, prod.quantidadeTotal);
      const statusEntrega = totalEntregueCalculado >= prod.quantidadeTotal
        ? "Completo"
        : totalEntregueCalculado > 0
        ? "Parcial"
        : "Pendente";

      const updateData: any = {
        recebimentos: newRecebimentosList,
        totalEntregue: totalEntregueCalculado,
        totalPendente: totalPendenteCalculado,
        totalDefeitos: totalDefeitosCalculado,
        percentualConcluido: progressoCalculado,
        statusEntrega,
        updatedAt: serverTimestamp(),
      };

      // Automatic phase update: if completed, set dataRealEntrega
      if (totalEntregueCalculado >= prod.quantidadeTotal) {
        updateData.dataRealEntrega = recebimentoData.data;
        updateData.statusProducao = "Finalizado";
      } else if (prod.statusProducao === "Pré-produção" || prod.statusProducao === "Corte") {
        updateData.statusProducao = "Costura";
      }

      await updateDoc(doc(db, "prod_producoes", recebimentoData.producaoId), updateData);

      toast.success(editRecebimentoOld ? "Entrega atualizada!" : `Entrega registrada! Progresso: ${progressoCalculado.toFixed(1)}%`);
      setIsRecebimentoOpen(false);
      setEditRecebimentoOld(null);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar recebimento.");
    }
  };
  const handleSavePagamento = async () => {
    if (!pagamentoData.valor || !pagamentoData.data) {
      toast.error("Preencha data e valor do pagamento.");
      return;
    }
    try {
      const prod = producoes.find((p) => p.id === pagamentoData.producaoId);
      if (!prod) return;
      const valorNovo = parseFloat(pagamentoData.valor) || 0;
      const shortLote = getLoteCurto(prod);

      const currentPagamentos: any[] = prod.pagamentos || prod.pagamentosCostura || [];
      let updatedPagamentos: any[] = [];
      let payableAccountId = editPagamentoOld?.accountId;

      const pagamentoId = editPagamentoOld?.id || `pag_${Date.now()}`;
      const newPagamento: any = {
        id: pagamentoId,
        producaoId: prod.id,
        lote: shortLote,
        produtoNome: prod.produtoNome || "",
        favorecido: pagamentoData.favorecido || prod.costureiraNome || "Costureira / Fornecedor",
        descricao: pagamentoData.descricao || `Pagamento Lote ${shortLote} - ${prod.produtoNome}`,
        categoria: pagamentoData.categoria || "Costura",
        formaPagamento: pagamentoData.formaPagamento || "PIX",
        valor: valorNovo,
        data: pagamentoData.data,
        status: "pago",
        observacao: pagamentoData.observacao || "",
        createdAt: editPagamentoOld?.createdAt || new Date().toISOString(),
      };

      // Sync with prod_accounts_payable (Financial module)
      if (payableAccountId) {
        try {
          await updateDoc(doc(db, "prod_accounts_payable", payableAccountId), {
            description: newPagamento.descricao,
            supplier: newPagamento.favorecido,
            category: newPagamento.categoria,
            totalValue: valorNovo,
            paidValue: valorNovo,
            paymentMethod: newPagamento.formaPagamento,
            purchaseDate: newPagamento.data,
            notes: newPagamento.observacao,
            updatedAt: serverTimestamp(),
          });
          const instSnap = await getDocs(query(collection(db, `prod_accounts_payable/${payableAccountId}/installments`)));
          if (!instSnap.empty) {
            await updateDoc(instSnap.docs[0].ref, {
              description: newPagamento.descricao,
              supplier: newPagamento.favorecido,
              category: newPagamento.categoria,
              value: valorNovo,
              paidValue: valorNovo,
              paymentDate: newPagamento.data,
              dueDate: newPagamento.data,
              paymentMethod: newPagamento.formaPagamento,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (errPay) {
          console.warn("Aviso ao sincronizar conta a pagar vinculada:", errPay);
        }
      } else if (user) {
        try {
          const accDocRef = await addDoc(collection(db, "prod_accounts_payable"), {
            userId: user.uid,
            description: newPagamento.descricao,
            launchType: "producao",
            producaoId: prod.id,
            lote: shortLote,
            category: newPagamento.categoria,
            supplier: newPagamento.favorecido,
            type: "empresa",
            totalValue: valorNovo,
            purchaseDate: newPagamento.data,
            paymentMethod: newPagamento.formaPagamento,
            isInstallment: false,
            installmentCount: 1,
            firstDueDate: newPagamento.data,
            notes: newPagamento.observacao || `Pagamento de produção lote ${shortLote}`,
            status: "pago",
            paidValue: valorNovo,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          payableAccountId = accDocRef.id;
          await addDoc(collection(db, `prod_accounts_payable/${accDocRef.id}/installments`), {
            userId: user.uid,
            accountId: accDocRef.id,
            type: "empresa",
            installmentNumber: 1,
            totalInstallments: 1,
            description: newPagamento.descricao,
            supplier: newPagamento.favorecido,
            category: newPagamento.categoria,
            value: valorNovo,
            dueDate: newPagamento.data,
            paymentDate: newPagamento.data,
            paidValue: valorNovo,
            remainingValue: 0,
            status: "pago",
            paymentMethod: newPagamento.formaPagamento,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (errPay) {
          console.warn("Aviso ao vincular conta a pagar:", errPay);
        }
      }

      newPagamento.accountId = payableAccountId;

      if (editPagamentoOld) {
        updatedPagamentos = currentPagamentos.map((p: any) =>
          (p.id && p.id === editPagamentoOld.id) || p.createdAt === editPagamentoOld.createdAt
            ? newPagamento
            : p
        );
      } else {
        updatedPagamentos = [...currentPagamentos, newPagamento];
      }

      const updatedProdObj = {
        ...prod,
        pagamentos: updatedPagamentos,
        pagamentosCostura: updatedPagamentos,
      };
      const fin = calcProducaoFinanceiro(updatedProdObj);

      await updateDoc(doc(db, "prod_producoes", pagamentoData.producaoId), {
        pagamentos: updatedPagamentos,
        pagamentosCostura: updatedPagamentos,
        totalPago: fin.totalPagoLote,
        totalPagoCostura: fin.totalPagoCostura,
        saldoPendente: fin.saldoPendenteLote,
        statusPagamento: fin.saldoPendenteLote <= 0 ? "Pago" : fin.totalPagoLote > 0 ? "Parcial" : "Pendente",
        updatedAt: serverTimestamp(),
      });

      toast.success(
        editPagamentoOld
          ? "Pagamento atualizado com sucesso!"
          : "Pagamento registrado e integrado ao Financeiro!",
      );
      setIsPagamentoOpen(false);
      setEditPagamentoOld(null);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao lançar pagamento.");
    }
  };
  const [deleteRecebimentoConfirm, setDeleteRecebimentoConfirm] = useState<{
    prodId: string;
    recebimento: any;
  } | null>(null);
  const [deletePagamentoConfirm, setDeletePagamentoConfirm] = useState<{
    prodId: string;
    pagamento: any;
  } | null>(null);
  const handleDeleteRecebimento = async () => {
    if (!deleteRecebimentoConfirm) return;
    const { prodId, recebimento } = deleteRecebimentoConfirm;
    try {
      const prod = producoes.find((p) => p.id === prodId);
      if (!prod) return;
      const currentRecebimentos: any[] = prod.recebimentos || [];
      const newRecebimentosList = currentRecebimentos.filter(
        (r: any) => (r.id ? r.id !== recebimento.id : r.createdAt !== recebimento.createdAt)
      );

      const totalEntregueCalculado = newRecebimentosList.reduce(
        (acc, r) => acc + (parseInt(r.quantidade) || 0),
        0
      );
      const totalDefeitosCalculado = newRecebimentosList.reduce(
        (acc, r) => acc + (parseInt(r.quantidadeDefeito) || 0),
        0
      );
      const totalPendenteCalculado = Math.max(0, prod.quantidadeTotal - totalEntregueCalculado);
      const progressoCalculado = calcProductionProgress(totalEntregueCalculado, prod.quantidadeTotal);
      const statusEntrega = totalEntregueCalculado >= prod.quantidadeTotal
        ? "Completo"
        : totalEntregueCalculado > 0
        ? "Parcial"
        : "Pendente";

      const updateData: any = {
        recebimentos: newRecebimentosList,
        totalEntregue: totalEntregueCalculado,
        totalPendente: totalPendenteCalculado,
        totalDefeitos: totalDefeitosCalculado,
        percentualConcluido: progressoCalculado,
        statusEntrega,
        updatedAt: serverTimestamp(),
      };

      if (totalEntregueCalculado < prod.quantidadeTotal && prod.statusProducao === "Finalizado") {
        updateData.statusProducao = "Costura";
        updateData.dataRealEntrega = null;
      }

      await updateDoc(doc(db, "prod_producoes", prodId), updateData);
      toast.success("Entrega excluída e totais recalculados.");
      setDeleteRecebimentoConfirm(null);
    } catch (e) {
      toast.error("Erro ao excluir entrega.");
    }
  };
  const handleDeletePagamento = async () => {
    if (!deletePagamentoConfirm) return;
    const { prodId, pagamento } = deletePagamentoConfirm;
    try {
      const prod = producoes.find((p) => p.id === prodId);
      if (!prod) return;
      const currentPagamentos: any[] = prod.pagamentos || prod.pagamentosCostura || [];
      const newPagamentos = currentPagamentos.filter(
        (p: any) => (p.id ? p.id !== pagamento.id : p.createdAt !== pagamento.createdAt)
      );

      const updatedProdObj = {
        ...prod,
        pagamentos: newPagamentos,
        pagamentosCostura: newPagamentos,
      };
      const fin = calcProducaoFinanceiro(updatedProdObj);

      // Clean up linked account in prod_accounts_payable if exists
      if (pagamento.accountId) {
        try {
          await deleteDoc(doc(db, "prod_accounts_payable", pagamento.accountId));
        } catch (errAcc) {
          console.warn("Aviso ao remover conta a pagar vinculada:", errAcc);
        }
      }

      await updateDoc(doc(db, "prod_producoes", prodId), {
        pagamentos: newPagamentos,
        pagamentosCostura: newPagamentos,
        totalPago: fin.totalPagoLote,
        totalPagoCostura: fin.totalPagoCostura,
        saldoPendente: fin.saldoPendenteLote,
        statusPagamento: fin.saldoPendenteLote <= 0 ? "Pago" : fin.totalPagoLote > 0 ? "Parcial" : "Pendente",
        updatedAt: serverTimestamp(),
      });
      toast.success("Pagamento excluído com sucesso.");
      setDeletePagamentoConfirm(null);
    } catch (e) {
      toast.error("Erro ao excluir pagamento.");
    }
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      toast.error("O arquivo é muito grande. O limite é 800KB.");
      /*  Limpar o input e.target.value = ''; */ return;
    }
    try {
      setUploadingFile(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          anexoUrl: base64,
          anexoNome: file.name,
        }));
        toast.success("Arquivo anexado!");
        setUploadingFile(false);
      };
      reader.onerror = (error) => {
        console.error(error);
        toast.error("Erro ao ler o arquivo.");
        setUploadingFile(false);
      };
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar arquivo.");
      setUploadingFile(false);
    }
  };
  const getBase64ImageFromUrl = async (
    imageUrl: string,
  ): Promise<{ dataUrl: string; width: number; height: number } | null> => {
    try {
      let dataUrl = imageUrl;
      if (!imageUrl.startsWith("data:image")) {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject();
          reader.readAsDataURL(blob);
        });
      }
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            dataUrl,
            width: img.naturalWidth || 100,
            height: img.naturalHeight || 100,
          });
        };
        img.onerror = () => {
          resolve({ dataUrl, width: 100, height: 100 });
        };
        img.src = dataUrl;
      });
    } catch (e) {
      console.error("Erro ao carregar imagem para PDF", e);
      return null;
    }
  };

  const gerarReciboCostureira = async (prod: any) => {
    try {
      toast.info("Gerando Recibo em PDF...");
      const defaultDoc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const docAny = defaultDoc as any;
      const pageWidth = defaultDoc.internal.pageSize.getWidth();
      const pageHeight = defaultDoc.internal.pageSize.getHeight();

      // Apenas um único código de identificação de lote curto e intuitivo
      const loteFormatado = getLoteCurto(prod);
      const dataEmissao = new Date().toLocaleDateString("pt-BR");
      
      const totalQtd = parseInt(prod.quantidadeTotal || 0, 10);
      const totalEntregue = parseInt(prod.totalEntregue || 0, 10);
      const saldoFaltaPecas = Math.max(0, totalQtd - totalEntregue);
      const valorCosturaUnit = parseFloat(prod.valorCostura || 0);
      const totalCosturaNum = valorCosturaUnit * totalQtd;
      const totalPagoNum = parseFloat(prod.totalPagoCostura || 0);
      const saldoAPagarNum = Math.max(0, totalCosturaNum - totalPagoNum);

      // 1. Linha de destaque roxa no topo da folha
      defaultDoc.setFillColor(109, 74, 255); // #6D4AFF
      defaultDoc.rect(0, 0, pageWidth, 4, "F");

      // Cabeçalho Minimalista e Arejado
      let currentY = 16;
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setFontSize(18);
      defaultDoc.setTextColor(109, 74, 255); // #6D4AFF
      defaultDoc.text("CONFECÇÃO PRO", 14, currentY);

      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.setFontSize(9);
      defaultDoc.setTextColor(100, 116, 139); // Slate-500
      defaultDoc.text("Recibo de Produção & Controle de Costura", 14, currentY + 6);

      // Canto Direito: APENAS O CÓDIGO DE IDENTIFICAÇÃO DE LOTE (CURTO E FÁCIL DE LER)
      const loteText = `LOTE: ${loteFormatado}`;
      const loteBoxWidth = Math.max(46, defaultDoc.getTextWidth(loteText) + 14);
      const loteBoxHeight = 12;
      const loteBoxX = pageWidth - 14 - loteBoxWidth;
      const loteBoxY = currentY - 5;

      defaultDoc.setFillColor(245, 243, 255); // #F5F3FF roxo claro
      defaultDoc.setDrawColor(221, 214, 254); // #DDD6FE borda suave
      defaultDoc.setLineWidth(0.4);
      defaultDoc.roundedRect(loteBoxX, loteBoxY, loteBoxWidth, loteBoxHeight, 2.5, 2.5, "FD");

      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setFontSize(11);
      defaultDoc.setTextColor(109, 74, 255);
      defaultDoc.text(loteText, loteBoxX + loteBoxWidth / 2, loteBoxY + 7.5, { align: "center" });

      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.setFontSize(8);
      defaultDoc.setTextColor(148, 163, 184);
      defaultDoc.text(`Emissão: ${dataEmissao}`, pageWidth - 14, loteBoxY + 16, { align: "right" });

      // Linha divisória sutil
      currentY = 32;
      defaultDoc.setDrawColor(226, 232, 240); // #E2E8F0
      defaultDoc.setLineWidth(0.3);
      defaultDoc.line(14, currentY, pageWidth - 14, currentY);

      currentY += 6;

      // 2. Card do Produto & Dados de Costura
      let imgLoaded = false;
      let imgW = 34;
      let imgH = 34;
      let imgBase64Data: string | null = null;

      if (prod.produtoFoto) {
        const imgInfo = await getBase64ImageFromUrl(prod.produtoFoto);
        if (imgInfo) {
          imgBase64Data = imgInfo.dataUrl;
          if (imgInfo.width > 0 && imgInfo.height > 0) {
            const aspect = imgInfo.width / imgInfo.height;
            if (aspect >= 1) {
              imgW = 34;
              imgH = Math.max(16, 34 / aspect);
            } else {
              imgH = 34;
              imgW = Math.max(16, 34 * aspect);
            }
          }
          imgLoaded = true;
        }
      }

      const cardHeight = 40;
      defaultDoc.setFillColor(248, 250, 252); // #F8FAFC
      defaultDoc.setDrawColor(226, 232, 240);
      defaultDoc.setLineWidth(0.3);
      defaultDoc.roundedRect(14, currentY, pageWidth - 28, cardHeight, 3, 3, "FD");

      let textStartX = 20;

      if (imgLoaded && imgBase64Data) {
        try {
          defaultDoc.setFillColor(255, 255, 255);
          defaultDoc.roundedRect(18, currentY + 3, 34, 34, 2, 2, "F");
          defaultDoc.addImage(
            imgBase64Data,
            "JPEG",
            18 + (34 - imgW) / 2,
            currentY + 3 + (34 - imgH) / 2,
            imgW,
            imgH
          );
          defaultDoc.setDrawColor(203, 213, 225);
          defaultDoc.roundedRect(18, currentY + 3, 34, 34, 2, 2, "S");
          textStartX = 58;
        } catch (err) {
          console.error("Erro ao desenhar imagem no PDF", err);
          textStartX = 20;
        }
      }

      // Nome do Produto (Grande, destaque)
      defaultDoc.setTextColor(15, 23, 42); // #0F172A
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setFontSize(13);
      defaultDoc.text(prod.produtoNome || "Produto Sem Nome", textStartX, currentY + 8);

      if (prod.sku) {
        defaultDoc.setFont("helvetica", "normal");
        defaultDoc.setFontSize(8);
        defaultDoc.setTextColor(100, 116, 139);
        defaultDoc.text(`Ref: ${prod.sku}`, textStartX, currentY + 13);
      }

      // 2 Colunas organizadas com espaçamento e leitura fácil
      const col1X = textStartX;
      const col2X = textStartX + 68;
      const dataY1 = currentY + (prod.sku ? 20 : 18);
      const dataY2 = dataY1 + 7;

      // Coluna 1
      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.setFontSize(8.5);
      defaultDoc.setTextColor(100, 116, 139);
      defaultDoc.text("Costureiro(a):", col1X, dataY1);
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setTextColor(15, 23, 42);
      defaultDoc.text(prod.costureiraNome || "Não atribuído", col1X + 22, dataY1);

      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.setTextColor(100, 116, 139);
      defaultDoc.text("Quantidade:", col1X, dataY2);
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setTextColor(109, 74, 255); // roxo
      defaultDoc.text(`${totalQtd} peças`, col1X + 22, dataY2);

      // Coluna 2
      const dataCosturaStr = prod.dataInicioCostura
        ? new Date(prod.dataInicioCostura).toLocaleDateString("pt-BR")
        : "Aguardando início";
      const dataPrevistaStr = prod.dataPrevistaEntrega || prod.dataEntrega
        ? new Date(prod.dataPrevistaEntrega || prod.dataEntrega).toLocaleDateString("pt-BR")
        : "A combinar";

      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.setTextColor(100, 116, 139);
      defaultDoc.text("Início Costura:", col2X, dataY1);
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setTextColor(15, 23, 42);
      defaultDoc.text(dataCosturaStr, col2X + 22, dataY1);

      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.setTextColor(100, 116, 139);
      defaultDoc.text("Previsão Entrega:", col2X, dataY2);
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setTextColor(15, 23, 42);
      defaultDoc.text(dataPrevistaStr, col2X + 26, dataY2);

      // Grade se houver
      if (prod.quantidadePorTamanho && Object.keys(prod.quantidadePorTamanho).length > 0) {
        const gradeText = Object.entries(prod.quantidadePorTamanho)
          .map(([t, q]) => `${t}: ${q}`)
          .join("   •   ");
        defaultDoc.setFont("helvetica", "bold");
        defaultDoc.setFontSize(7.5);
        defaultDoc.setTextColor(100, 116, 139);
        defaultDoc.text("Grade de Tamanhos:", textStartX, currentY + 34);
        defaultDoc.setFont("helvetica", "normal");
        defaultDoc.setTextColor(71, 85, 105);
        defaultDoc.text(gradeText, textStartX + 30, currentY + 34);
      }

      currentY += cardHeight + 6;

      // 3. Resumo Financeiro em Mini-Cards Executivos (MUITO mais fácil e rápido de ler!)
      const kpiCardWidth = (pageWidth - 28 - 9) / 4; // 4 colunas com 3mm de gap
      const kpiCardHeight = 18;

      const kpis = [
        { label: "VALOR POR PEÇA", val: `R$ ${valorCosturaUnit.toFixed(2)}`, color: [15, 23, 42] },
        { label: "TOTAL COSTURA", val: `R$ ${totalCosturaNum.toFixed(2)}`, color: [15, 23, 42] },
        { label: "TOTAL PAGO", val: `R$ ${totalPagoNum.toFixed(2)}`, color: totalPagoNum > 0 ? [22, 101, 52] : [100, 116, 139] },
        { label: "SALDO A PAGAR", val: `R$ ${saldoAPagarNum.toFixed(2)}`, color: saldoAPagarNum > 0 ? [109, 74, 255] : [22, 101, 52] },
      ];

      kpis.forEach((kpi, idx) => {
        const cardX = 14 + idx * (kpiCardWidth + 3);
        defaultDoc.setFillColor(248, 250, 252);
        defaultDoc.setDrawColor(226, 232, 240);
        defaultDoc.setLineWidth(0.3);
        defaultDoc.roundedRect(cardX, currentY, kpiCardWidth, kpiCardHeight, 2, 2, "FD");

        defaultDoc.setFont("helvetica", "bold");
        defaultDoc.setFontSize(7);
        defaultDoc.setTextColor(100, 116, 139);
        defaultDoc.text(kpi.label, cardX + 4, currentY + 6);

        defaultDoc.setFont("helvetica", "bold");
        defaultDoc.setFontSize(11);
        defaultDoc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        defaultDoc.text(kpi.val, cardX + 4, currentY + 14);
      });

      currentY += kpiCardHeight + 8;

      // 4. Seção: Entregas Realizadas
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setFontSize(10);
      defaultDoc.setTextColor(15, 23, 42);
      defaultDoc.text("REGISTROS DE ENTREGA", 14, currentY);

      if (prod.recebimentos && prod.recebimentos.length > 0) {
        let totalRecebidoBoas = 0;
        let totalRecebidoDefeito = 0;

        const entregasRows = prod.recebimentos.map((r: any, idx: number) => {
          const boas = parseInt(r.quantidade || 0, 10);
          const def = parseInt(r.quantidadeDefeito || 0, 10);
          totalRecebidoBoas += boas;
          totalRecebidoDefeito += def;
          return [
            `${idx + 1}`,
            r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "-",
            `${boas} pçs`,
            def > 0 ? `${def} pçs` : "-",
            r.observacao || "-",
          ];
        });

        autoTable(docAny, {
          startY: currentY + 3,
          theme: "plain",
          styles: {
            font: "helvetica",
            fontSize: 8.5,
            cellPadding: 2.5,
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
            textColor: [51, 65, 85],
          },
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
            fontStyle: "bold",
          },
          head: [["#", "Data", "Qtd. Entregue", "Defeito", "Observações"]],
          body: entregasRows,
          foot: [[
            "Total Entregue:",
            "",
            `${totalRecebidoBoas} pçs`,
            totalRecebidoDefeito > 0 ? `${totalRecebidoDefeito} pçs` : "-",
            "",
          ]],
          footStyles: {
            fillColor: [248, 250, 252],
            textColor: [15, 23, 42],
            fontStyle: "bold",
          },
        });
        currentY = docAny.lastAutoTable.finalY + 6;
      } else {
        defaultDoc.setFillColor(248, 250, 252);
        defaultDoc.setDrawColor(226, 232, 240);
        defaultDoc.setLineWidth(0.3);
        defaultDoc.roundedRect(14, currentY + 3, pageWidth - 28, 9, 2, 2, "FD");
        defaultDoc.setFont("helvetica", "normal");
        defaultDoc.setFontSize(8);
        defaultDoc.setTextColor(100, 116, 139);
        defaultDoc.text("Nenhum registro de entrega lançado até o momento.", 18, currentY + 8.5);
        currentY += 17;
      }

      // 5. Seção: Pagamentos Efetuados
      if (currentY > pageHeight - 60) {
        defaultDoc.addPage();
        currentY = 20;
      }

      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setFontSize(10);
      defaultDoc.setTextColor(15, 23, 42);
      defaultDoc.text("REGISTROS DE PAGAMENTO", 14, currentY);

      if (prod.pagamentosCostura && prod.pagamentosCostura.length > 0) {
        const pagamentosRows = prod.pagamentosCostura.map((p: any, idx: number) => [
          `${idx + 1}`,
          p.data ? new Date(p.data).toLocaleDateString("pt-BR") : "-",
          `R$ ${parseFloat(p.valor || 0).toFixed(2)}`,
          p.tipo || "Costura",
          p.observacao || "-",
        ]);

        autoTable(docAny, {
          startY: currentY + 3,
          theme: "plain",
          styles: {
            font: "helvetica",
            fontSize: 8.5,
            cellPadding: 2.5,
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
            textColor: [51, 65, 85],
          },
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
            fontStyle: "bold",
          },
          head: [["#", "Data", "Valor Pago", "Tipo / Forma", "Observações"]],
          body: pagamentosRows,
          foot: [[
            "Total Pago:",
            "",
            `R$ ${totalPagoNum.toFixed(2)}`,
            "",
            "",
          ]],
          footStyles: {
            fillColor: [248, 250, 252],
            textColor: [15, 23, 42],
            fontStyle: "bold",
          },
        });
        currentY = docAny.lastAutoTable.finalY + 6;
      } else {
        defaultDoc.setFillColor(248, 250, 252);
        defaultDoc.setDrawColor(226, 232, 240);
        defaultDoc.setLineWidth(0.3);
        defaultDoc.roundedRect(14, currentY + 3, pageWidth - 28, 9, 2, 2, "FD");
        defaultDoc.setFont("helvetica", "normal");
        defaultDoc.setFontSize(8);
        defaultDoc.setTextColor(100, 116, 139);
        defaultDoc.text("Nenhum registro de pagamento lançado até o momento.", 18, currentY + 8.5);
        currentY += 17;
      }

      // 6. Observações se houver
      if (prod.observacoes) {
        if (currentY > pageHeight - 45) {
          defaultDoc.addPage();
          currentY = 20;
        }
        defaultDoc.setFont("helvetica", "bold");
        defaultDoc.setFontSize(8.5);
        defaultDoc.setTextColor(71, 85, 105);
        defaultDoc.text("OBSERVAÇÕES:", 14, currentY);

        defaultDoc.setFont("helvetica", "normal");
        defaultDoc.setFontSize(8);
        defaultDoc.setTextColor(100, 116, 139);
        const splitObs = defaultDoc.splitTextToSize(prod.observacoes, pageWidth - 28);
        defaultDoc.text(splitObs, 14, currentY + 4.5);
        currentY += 4.5 + splitObs.length * 3.5 + 4;
      }

      // 7. Termo e Assinaturas
      if (currentY > pageHeight - 38) {
        defaultDoc.addPage();
        currentY = 25;
      } else {
        currentY = Math.max(currentY + 6, pageHeight - 36);
      }

      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.setFontSize(7.5);
      defaultDoc.setTextColor(148, 163, 184);
      defaultDoc.text(
        "Declaro ter conferido e recebido as peças, valores e especificações discriminadas neste documento.",
        pageWidth / 2,
        currentY,
        { align: "center" }
      );

      const lineY = currentY + 14;
      defaultDoc.setDrawColor(203, 213, 225);
      defaultDoc.setLineWidth(0.3);

      // Assinatura Costureira
      defaultDoc.line(24, lineY, 88, lineY);
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setFontSize(8);
      defaultDoc.setTextColor(15, 23, 42);
      defaultDoc.text(prod.costureiraNome || "Costureiro(a) / Facção", 56, lineY + 4, { align: "center" });
      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.setFontSize(7);
      defaultDoc.setTextColor(148, 163, 184);
      defaultDoc.text("Assinatura do Prestador", 56, lineY + 7.5, { align: "center" });

      // Assinatura Confecção Pro
      defaultDoc.line(pageWidth - 88, lineY, pageWidth - 24, lineY);
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setFontSize(8);
      defaultDoc.setTextColor(15, 23, 42);
      defaultDoc.text("Confecção Pro", pageWidth - 56, lineY + 4, { align: "center" });
      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.setFontSize(7);
      defaultDoc.setTextColor(148, 163, 184);
      defaultDoc.text("Responsável de Produção", pageWidth - 56, lineY + 7.5, { align: "center" });

      const safeName = (prod.produtoNome || "produto").replace(/[^a-zA-Z0-9]/g, "_");
      defaultDoc.save(`recibo_${loteFormatado}_${safeName}.pdf`);
      toast.success("Recibo PDF baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar recibo PDF:", error);
      toast.error("Erro ao gerar o recibo em PDF.");
    }
  };
  const gerarFichaProducao = async (prod: any) => {
    const defaultDoc = new jsPDF();
    const docAny = defaultDoc as any;
    const pageWidth = defaultDoc.internal.pageSize.getWidth();
    const pageHeight = defaultDoc.internal.pageSize.getHeight();
    const loteFormatado = getLoteCurto(prod);

    /* Header styling */
    defaultDoc.setFillColor(30, 41, 59); /* slate-800 */
    defaultDoc.rect(0, 0, pageWidth, 40, "F");
    defaultDoc.setFontSize(20);
    defaultDoc.setTextColor(255, 255, 255);
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text(
      `Ficha de Produção • LOTE: ${loteFormatado}`,
      14,
      20,
    );
    defaultDoc.setFontSize(10);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.setTextColor(203, 213, 225);
    /* slate-300 */ defaultDoc.text(
      `Emissão: ${new Date().toLocaleDateString("pt-BR")}`,
      14,
      28,
    );
    defaultDoc.text(
      `Prioridade: ${prod.etiquetas?.[0]?.toUpperCase() || "NORMAL"} | Status: ${prod.statusEntrega || "Pendente"}`,
      14,
      34,
    );
    if (prod.produtoFoto) {
      try {
        const imgData = await getBase64ImageFromUrl(prod.produtoFoto);
        if (imgData && imgData.dataUrl) {
          defaultDoc.addImage(imgData.dataUrl, "JPEG", pageWidth - 35, 8, 24, 24);
        }
      } catch (e) {
        console.error("Erro ao carregar imagem no PDF", e);
      }
    }
    /* Custom Section Title */ const addSectionTitle = (
      title: string,
      yPos: number,
      bgColor: [number, number, number] = [241, 245, 249],
    ) => {
      defaultDoc.setFillColor(...bgColor);
      defaultDoc.rect(14, yPos - 6, pageWidth - 28, 8, "F");
      defaultDoc.setFontSize(11);
      defaultDoc.setTextColor(15, 23, 42);
      /* slate-900 */ defaultDoc.setFont("helvetica", "bold");
      defaultDoc.text(title.toUpperCase(), 16, yPos);
    };
    let startY = 50;
    /* 1. INFORMAÇÕES DO PRODUTO */ addSectionTitle(
      "1. Informações do Produto",
      startY,
    );
    defaultDoc.setFontSize(10);
    defaultDoc.setTextColor(51, 65, 85);
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Produto:", 16, startY + 8);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(prod.produtoNome || "N/A", 35, startY + 8);
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Qtd. Total:", 110, startY + 8);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(`${prod.quantidadeTotal || 0} pçs`, 135, startY + 8);
    if (
      prod.quantidadePorTamanho &&
      Object.keys(prod.quantidadePorTamanho).length > 0
    ) {
      const bd = Object.entries(prod.quantidadePorTamanho)
        .map(([t, q]) => `${t}: ${q}`)
        .join(" | ");
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.text("Grade:", 16, startY + 14);
      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.text(bd, 30, startY + 14);
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.text("Início:", 16, startY + 20);
      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.text(
        prod.dataInicio
          ? new Date(prod.dataInicio).toLocaleDateString("pt-BR")
          : "N/A",
        30,
        startY + 20,
      );
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.text("Entrega Prevista:", 110, startY + 20);
      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.text(
        prod.dataPrevistaEntrega
          ? new Date(prod.dataPrevistaEntrega).toLocaleDateString("pt-BR")
          : "N/A",
        145,
        startY + 20,
      );
      startY += 28;
    } else {
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.text("Início:", 16, startY + 14);
      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.text(
        prod.dataInicio
          ? new Date(prod.dataInicio).toLocaleDateString("pt-BR")
          : "N/A",
        30,
        startY + 14,
      );
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.text("Entrega Prevista:", 110, startY + 14);
      defaultDoc.setFont("helvetica", "normal");
      defaultDoc.text(
        prod.dataPrevistaEntrega
          ? new Date(prod.dataPrevistaEntrega).toLocaleDateString("pt-BR")
          : "N/A",
        145,
        startY + 14,
      );
      startY += 22;
    }
    /* 2. EQUIPE TÉCNICA E PARCEIROS */ addSectionTitle(
      "2. Profissionais e Parceiros",
      startY,
    );
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Costureira:", 16, startY + 8);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(prod.costureiraNome || "Não definida", 40, startY + 8);
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Modelista:", 110, startY + 8);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(prod.nomeModelista || "Não definido", 135, startY + 8);
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Cortador:", 16, startY + 14);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(prod.nomeCortador || "Não definido", 40, startY + 14);
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Tecido (Forn.):", 110, startY + 14);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(prod.fornecedorTecido || "N/A", 140, startY + 14);
    startY += 22;
    /* 3. ESTRUTURA DE CUSTOS (TABELA) */ addSectionTitle(
      "3. Estrutura de Custos",
      startY,
      [224, 242, 254],
    );
    /* sky-100 */ const tableStyles = {
      theme: "grid" as const,
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 4,
        lineColor: [226, 232, 240] as [number, number, number],
        lineWidth: 0.1,
        textColor: [51, 65, 85] as [number, number, number],
      },
      headStyles: {
        fillColor: [56, 189, 248] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: "bold" as const,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] as [number, number, number],
      },
    };
    const qtdTotal = parseInt(prod.quantidadeTotal) || 0;
    const custoTotal = parseFloat(prod.custoTotal) || 0;
    const custoPorPeca =
      parseFloat(prod.custoPorPeca) ||
      (qtdTotal > 0 ? custoTotal / qtdTotal : 0);
    let tecidoTotal = parseFloat(prod.valorTecido || 0);
    if (prod.fornecedoresTecido && prod.fornecedoresTecido.length > 0) {
      tecidoTotal = prod.fornecedoresTecido.reduce(
        (acc: number, curr: any) => acc + (parseFloat(curr.totalCompra) || 0),
        0,
      );
    }
    autoTable(docAny, {
      ...tableStyles,
      startY: startY + 4,
      head: [["Categoria de Custo", "Status", "Valor (R$)"]],
      body: [
        [
          "Costura (Total Estimado)",
          prod.pagoCostura ? "PAGO" : "PENDENTE",
          `R$ ${(parseFloat(prod.valorCostura || 0) * qtdTotal).toFixed(2)}`,
        ],
        [
          "Costura (Valor Unitário)",
          "-",
          `R$ ${parseFloat(prod.valorCostura || 0).toFixed(2)} / pç`,
        ],
        [
          "Serviço de Corte",
          prod.pagoCorte ? "PAGO" : "PENDENTE",
          `R$ ${parseFloat(prod.valorCorte || 0).toFixed(2)}`,
        ],
        [
          "Serviço de Modelagem",
          prod.pagoModelagem ? "PAGO" : "PENDENTE",
          `R$ ${parseFloat(prod.valorModelagem || 0).toFixed(2)}`,
        ],
        [
          "Serviço de Risco",
          prod.pagoRisco ? "PAGO" : "PENDENTE",
          `R$ ${parseFloat(prod.valorRisco || 0).toFixed(2)}`,
        ],
        ["Tecidos", "-", `R$ ${tecidoTotal.toFixed(2)}`],
        [
          "Outros Insumos",
          "-",
          `R$ ${parseFloat(prod.valorInsumos || 0).toFixed(2)}`,
        ],
        [
          "Gastos Extras",
          "-",
          `R$ ${parseFloat(prod.outrosGastos || 0).toFixed(2)}`,
        ],
      ],
      foot: [
        ["CUSTO TOTAL DE PRODUÇÃO", "", `R$ ${custoTotal.toFixed(2)}`],
        ["CUSTO MÉDIO POR PEÇA", "", `R$ ${custoPorPeca.toFixed(2)}`],
      ],
      footStyles: {
        fillColor: [241, 245, 249] as [number, number, number],
        textColor: [15, 23, 42] as [number, number, number],
        fontStyle: "bold" as const,
      },
    });
    startY = docAny.lastAutoTable.finalY + 10;
    /*  4. OBSERVAÇÕES */ if (prod.observacoes) {
      addSectionTitle("4. Observações Gerais", startY);
      defaultDoc.setFontSize(9);
      defaultDoc.setFont("helvetica", "italic");
      const splitObs = defaultDoc.splitTextToSize(
        prod.observacoes,
        pageWidth - 28,
      );
      defaultDoc.text(splitObs, 16, startY + 6);
      startY += 10 + splitObs.length * 4;
    }
    /*  5. HISTORICO DE ENTREGAS */ if (
      prod.recebimentos &&
      prod.recebimentos.length > 0
    ) {
      if (startY > pageHeight - 40) {
        defaultDoc.addPage();
        startY = 20;
      }
      addSectionTitle("5. Entregas (Costura)", startY, [220, 252, 231]);
      /* green-100 */ autoTable(docAny, {
        ...tableStyles,
        headStyles: {
          fillColor: [34, 197, 94] as [number, number, number],
          textColor: [255, 255, 255] as [number, number, number],
          fontStyle: "bold" as const,
        },
        startY: startY + 4,
        head: [["Data", "Aprovadas", "Defeito", "Observação"]],
        body: prod.recebimentos.map((r: any) => [
          new Date(r.data).toLocaleDateString("pt-BR"),
          `${r.quantidade} pçs`,
          `${r.quantidadeDefeito || 0} pçs`,
          r.observacao || "-",
        ]),
        foot: [
          [
            "Total Entregue",
            `${prod.totalPecasEntregues || 0} pçs`,
            `${prod.totalPecasDefeito || 0} pçs`,
            "",
          ],
        ],
        footStyles: {
          fillColor: [240, 253, 244] as [number, number, number],
          textColor: [21, 128, 61] as [number, number, number],
          fontStyle: "bold" as const,
        },
      });
      startY = docAny.lastAutoTable.finalY + 12;
    }
    /*  6. HISTORICO DE PAGAMENTOS */ if (
      prod.pagamentosCostura &&
      prod.pagamentosCostura.length > 0
    ) {
      if (startY > pageHeight - 40) {
        defaultDoc.addPage();
        startY = 20;
      }
      addSectionTitle("6. Pagamentos (Costura)", startY, [254, 240, 138]);
      /* yellow-200 */ autoTable(docAny, {
        ...tableStyles,
        headStyles: {
          fillColor: [234, 179, 8] as [number, number, number],
          textColor: [255, 255, 255] as [number, number, number],
          fontStyle: "bold" as const,
        },
        startY: startY + 4,
        head: [["Data", "Valor (R$)", "Anotação / Ref"]],
        body: prod.pagamentosCostura.map((p: any) => [
          new Date(p.data).toLocaleDateString("pt-BR"),
          `R$ ${parseFloat(p.valor || 0).toFixed(2)}`,
          p.observacao || "-",
        ]),
        foot: [
          [
            "Total Pago",
            `R$ ${(parseFloat(prod.totalPagoCostura) || 0).toFixed(2)}`,
            "",
          ],
        ],
        footStyles: {
          fillColor: [254, 252, 232] as [number, number, number],
          textColor: [161, 98, 7] as [number, number, number],
          fontStyle: "bold" as const,
        },
      });
    }
    defaultDoc.save(`ficha_produção_${loteFormatado}.pdf`);
  };
  const filteredProducoes = producoes.filter((p) => {
    const shortLote = getLoteCurto(p);
    const sMatch =
      (p.produtoNome || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.costureiraNome || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.lote || "").toLowerCase().includes(search.toLowerCase()) ||
      shortLote.toLowerCase().includes(search.toLowerCase());
    const prioValue =
      p.etiquetas && p.etiquetas.length > 0
        ? p.etiquetas[0].toLowerCase()
        : "normal";
    const prioMatch =
      priorityFilter.length === 0 || priorityFilter.includes(prioValue);
    const statusMatch =
      statusFilter.length === 0 ||
      statusFilter.includes((p.statusEntrega || "Pendente").toLowerCase());
    let pagMatch = true;
    if (pagamentoFilter.length > 0) {
      const fin = calcProducaoFinanceiro(p);
      let sPag = "pendente";
      if (fin.isCosturaPaga || fin.isLoteQuitado) {
        sPag = "pago";
      } else if (fin.totalPagoCostura > 0 || fin.totalPagoLote > 0) {
        sPag = "parcial";
      }
      pagMatch = pagamentoFilter.includes(sPag);
    }
    const faseMatch =
      faseFilter.length === 0 ||
      faseFilter.includes((p.statusProducao || "Por Fazer").toLowerCase());
    return sMatch && prioMatch && statusMatch && pagMatch && faseMatch;
  });

  const parsedQtd = parseInt(formData.quantidadeTotal) || 0;
  const calcCustoTecido =
    formData.fornecedoresTecido.reduce(
      (acc, curr) => acc + (parseFloat(curr.totalCompra) || 0),
      0,
    ) ||
    parseFloat(formData.valorTecido) ||
    0;

  const currentValCorte = parseFloat(formData.valorCorte) || 0;
  const currentValModelagem = parseFloat(formData.valorModelagem) || 0;
  const currentValRisco = parseFloat(formData.valorRisco) || 0;
  const currentCosturaTotal = (parseFloat(formData.valorCostura) || 0) * parsedQtd;
  const currentValInsumos = parseFloat(formData.valorInsumos) || 0;
  const currentValOutros = parseFloat(formData.outrosGastos) || 0;

  const currentCusto =
    calcCustoTecido +
    currentValCorte +
    currentValModelagem +
    currentValRisco +
    currentCosturaTotal +
    currentValInsumos +
    currentValOutros;

  // Pagamentos em tempo real dentro do modal de edição
  const existingEditingProd = editingId ? producoes.find((p) => p.id === editingId) : null;
  const existingEditingPayments = existingEditingProd?.pagamentos || existingEditingProd?.pagamentosCostura || [];
  const getEditingHistoryByCat = (catName: string) => {
    return existingEditingPayments
      .filter((p: any) => p.categoria && typeof p.categoria === "string" && p.categoria.toLowerCase().includes(catName.toLowerCase()))
      .reduce((acc: number, p: any) => acc + (parseFloat(p.valor) || 0), 0);
  };

  const currentPagoTecido = formData.pagoTecido ? calcCustoTecido : Math.min(calcCustoTecido, getEditingHistoryByCat("tecido"));
  const currentPagoCorte = formData.pagoCorte ? currentValCorte : Math.min(currentValCorte, getEditingHistoryByCat("corte"));
  const currentPagoModelagem = formData.pagoModelagem ? currentValModelagem : Math.min(currentValModelagem, getEditingHistoryByCat("modelagem"));
  const currentPagoRisco = formData.pagoRisco ? currentValRisco : Math.min(currentValRisco, getEditingHistoryByCat("risco"));
  const sumEditingHistoryCostura = existingEditingPayments
    .filter((p: any) => !p.categoria || (typeof p.categoria === "string" && p.categoria.toLowerCase().includes("costura")))
    .reduce((acc: number, p: any) => acc + (parseFloat(p.valor) || 0), 0);
  const currentPagoCostura = formData.pagoCostura ? currentCosturaTotal : Math.max(0, sumEditingHistoryCostura);
  const currentPagoInsumos = formData.pagoInsumos ? currentValInsumos : Math.min(currentValInsumos, getEditingHistoryByCat("insumo") + getEditingHistoryByCat("aviamento"));
  const currentPagoOutros = formData.pagoOutros ? currentValOutros : Math.min(currentValOutros, getEditingHistoryByCat("outro"));

  const sumEditingHistoryAvulsos = existingEditingPayments
    .filter((p: any) => p.categoria && !["costura", "corte", "tecido", "modelagem", "risco", "insumo", "aviamento", "outro"].some(c => p.categoria.toLowerCase().includes(c)))
    .reduce((acc: number, p: any) => acc + (parseFloat(p.valor) || 0), 0);

  const currentTotalPago =
    currentPagoTecido +
    currentPagoCorte +
    currentPagoModelagem +
    currentPagoRisco +
    currentPagoCostura +
    currentPagoInsumos +
    currentPagoOutros +
    sumEditingHistoryAvulsos;

  const currentSaldoPendente = Math.max(0, currentCusto - currentTotalPago);
  const isCurrentQuitado = currentCusto > 0 && currentSaldoPendente <= 0;
  return (
    <div className="space-y-8 max-w-none mx-auto p-4 md:p-8 pb-10 animate-in fade-in duration-500">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {" "}
        <div>
          {" "}
          <h1 className="text-[36px] font-bold tracking-tight text-foreground leading-tight">
            Linha de Produção
          </h1>{" "}
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Gestão completa de peças e lotes em andamento.
          </p>{" "}
        </div>{" "}
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all outline-none rounded-full px-6 h-12 font-bold border-none"
        >
          {" "}
          <Plus size={18} className="mr-2" strokeWidth={3} /> Nova Produção{" "}
        </Button>{" "}
      </div>{" "}
      <div className="premium-card flex flex-wrap gap-4 items-center /60 p-3 rounded-[2rem] -/50 backdrop-blur-xl w-full glass-card sticky top-24 z-20">
        {" "}
        <div className="premium-card flex items-center flex-1 min-w-[200px] /50 px-2 -/50 h-12 transition-colors focus-within: focus-within:-primary/30">
          {" "}
          <Search
            size={20}
            className="text-muted-foreground mx-3"
            strokeWidth={2.5}
          />{" "}
          <input
            type="text"
            placeholder="Buscar por produto ou costureira..."
            className="bg-transparent border-none outline-none text-base w-full placeholder:text-muted-foreground/70 text-foreground font-semibold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />{" "}
        </div>{" "}
        <div className="flex items-center gap-2 px-1">
          {" "}
          <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden lg:block">
            Fase:
          </Label>{" "}
          <DropdownMenu>
            {" "}
            <DropdownMenuTrigger className="inline-flex items-center justify-between whitespace-nowrap w-[140px] rounded-[18px] h-12 text-sm font-bold bg-white hover:bg-gray-50 px-4 text-left border border-border/50 text-foreground shadow-sm transition-all focus:ring-4 focus:ring-primary/10">
              {" "}
              <span className="truncate">
                {faseFilter.length === 0
                  ? "Todas"
                  : faseFilter
                      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                      .join(", ")}
              </span>{" "}
              <ChevronDown
                size={14}
                className="text-muted-foreground ml-2 opacity-50"
              />{" "}
            </DropdownMenuTrigger>{" "}
            <DropdownMenuContent className="w-[160px] rounded-2xl p-2 font-medium">
              {" "}
              {(
                configuracoes.statusProducao || [
                  "Pré-produção",
                  "Modelagem",
                  "Risco",
                  "Corte",
                  "Costura",
                  "Finalizado",
                ]
              ).map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt}
                  checked={faseFilter.includes(opt.toLowerCase())}
                  onCheckedChange={(c) =>
                    setFaseFilter((prev) =>
                      c
                        ? [...prev, opt.toLowerCase()]
                        : prev.filter((x) => x !== opt.toLowerCase()),
                    )
                  }
                  className="text-sm py-2 rounded-xl focus:bg-accent cursor-pointer"
                >
                  {" "}
                  {opt}{" "}
                </DropdownMenuCheckboxItem>
              ))}{" "}
            </DropdownMenuContent>{" "}
          </DropdownMenu>{" "}
        </div>{" "}
        <div className="flex items-center gap-2 px-1">
          {" "}
          <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden lg:block">
            Prioridade:
          </Label>{" "}
          <DropdownMenu>
            {" "}
            <DropdownMenuTrigger className="inline-flex items-center justify-between whitespace-nowrap w-[140px] rounded-[18px] h-12 text-sm font-bold bg-white hover:bg-gray-50 px-4 text-left border border-border/50 text-foreground shadow-sm transition-all focus:ring-4 focus:ring-primary/10">
              {" "}
              <span className="truncate">
                {priorityFilter.length === 0
                  ? "Todas"
                  : priorityFilter
                      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                      .join(", ")}
              </span>{" "}
              <ChevronDown
                size={14}
                className="text-muted-foreground ml-2 opacity-50"
              />{" "}
            </DropdownMenuTrigger>{" "}
            <DropdownMenuContent className="w-[160px] rounded-2xl p-2 font-medium">
              {" "}
              {(configuracoes.prioridades || []).map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt}
                  checked={priorityFilter.includes(opt.toLowerCase())}
                  onCheckedChange={(c) =>
                    setPriorityFilter((prev) =>
                      c
                        ? [...prev, opt.toLowerCase()]
                        : prev.filter((x) => x !== opt.toLowerCase()),
                    )
                  }
                  className="text-sm py-2 rounded-xl focus:bg-accent cursor-pointer"
                >
                  {" "}
                  {opt}{" "}
                </DropdownMenuCheckboxItem>
              ))}{" "}
            </DropdownMenuContent>{" "}
          </DropdownMenu>{" "}
        </div>{" "}
        <div className="flex items-center gap-2 px-1">
          {" "}
          <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden lg:block">
            Entrega:
          </Label>{" "}
          <DropdownMenu>
            {" "}
            <DropdownMenuTrigger className="inline-flex items-center justify-between whitespace-nowrap w-[140px] rounded-[18px] h-12 text-sm font-bold bg-white hover:bg-gray-50 px-4 text-left border border-border/50 text-foreground shadow-sm transition-all focus:ring-4 focus:ring-primary/10">
              {" "}
              <span className="truncate">
                {statusFilter.length === 0
                  ? "Todas"
                  : statusFilter
                      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                      .join(", ")}
              </span>{" "}
              <ChevronDown
                size={14}
                className="text-muted-foreground ml-2 opacity-50"
              />{" "}
            </DropdownMenuTrigger>{" "}
            <DropdownMenuContent className="w-[160px] rounded-2xl p-2 font-medium">
              {" "}
              {(configuracoes.status || []).map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt}
                  checked={statusFilter.includes(opt.toLowerCase())}
                  onCheckedChange={(c) =>
                    setStatusFilter((prev) =>
                      c
                        ? [...prev, opt.toLowerCase()]
                        : prev.filter((x) => x !== opt.toLowerCase()),
                    )
                  }
                  className="text-sm py-2 rounded-xl focus:bg-accent cursor-pointer"
                >
                  {" "}
                  {opt}{" "}
                </DropdownMenuCheckboxItem>
              ))}{" "}
            </DropdownMenuContent>{" "}
          </DropdownMenu>{" "}
        </div>{" "}
        <div className="flex items-center gap-2 px-1">
          {" "}
          <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden lg:block">
            Pagamento:
          </Label>{" "}
          <DropdownMenu>
            {" "}
            <DropdownMenuTrigger className="inline-flex items-center justify-between whitespace-nowrap w-[140px] rounded-[18px] h-12 text-sm font-bold bg-white hover:bg-gray-50 px-4 text-left border border-border/50 text-foreground shadow-sm transition-all focus:ring-4 focus:ring-primary/10">
              {" "}
              <span className="truncate">
                {pagamentoFilter.length === 0
                  ? "Todos"
                  : pagamentoFilter
                      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                      .join(", ")}
              </span>{" "}
              <ChevronDown
                size={14}
                className="text-muted-foreground ml-2 opacity-50"
              />{" "}
            </DropdownMenuTrigger>{" "}
            <DropdownMenuContent className="w-[160px] rounded-2xl p-2 font-medium">
              {" "}
              {[
                { value: "pendente", label: "Pendente" },
                { value: "parcial", label: "Parcial" },
                { value: "pago", label: "Pago" },
              ].map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={pagamentoFilter.includes(opt.value)}
                  onCheckedChange={(c) =>
                    setPagamentoFilter((prev) =>
                      c
                        ? [...prev, opt.value]
                        : prev.filter((x) => x !== opt.value),
                    )
                  }
                  className="text-sm py-2 rounded-xl focus:bg-accent cursor-pointer"
                >
                  {" "}
                  {opt.label}{" "}
                </DropdownMenuCheckboxItem>
              ))}{" "}
            </DropdownMenuContent>{" "}
          </DropdownMenu>{" "}
        </div>{" "}
      </div>{" "}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {" "}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-200/50 rounded-[3rem] border border-gray-100"
            ></div>
          ))}{" "}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {" "}
          {filteredProducoes.map((prod) => {
            const isUrgente = prod.etiquetas?.[0] === "urgente";
            const delivered = parseInt(prod.totalEntregue) || 0;
            const total = parseInt(prod.quantidadeTotal) || 1;
            const qtdTotal = parseInt(prod.quantidadeTotal) || 0;
            const progress = isNaN((delivered / total) * 100)
              ? 0
              : (delivered / total) * 100;

            const fin = calcProducaoFinanceiro(prod);
            const custoCosturaUnitario = fin.custoCosturaUnitario;
            const totalCosturaCard = fin.totalCostura;
            const custoTecido = fin.custoTecido;
            const custoCorte = fin.custoCorte;
            const custoModelagem = fin.custoModelagem;
            const custoRisco = fin.custoRisco;
            const custoInsumos = fin.custoInsumos;
            const custoOutros = fin.custoOutros;
            const custoTotalLote = fin.custoTotalLote;
            const totalPagoCosturaCard = fin.totalPagoCostura;
            const saldoCosturaCard = fin.saldoCostura;
            const isCosturaPaga = fin.isCosturaPaga;
            const totalPagoLote = fin.totalPagoLote;
            const saldoPendenteLote = fin.saldoPendenteLote;
            const isLoteQuitado = fin.isLoteQuitado;
            const isPago = isLoteQuitado;
            const isEntregue = progress >= 100;
            const isExpanded = expandedCards.has(prod.id);
            const dataInicioFormatada = prod.dataInicio
              ? new Date(prod.dataInicio).toLocaleDateString("pt-BR")
              : prod.createdAt
                ? typeof prod.createdAt.toDate === "function"
                  ? prod.createdAt.toDate().toLocaleDateString("pt-BR")
                  : new Date(prod.createdAt).toLocaleDateString("pt-BR")
                : "Sem data";
            const dataEntregaFormatada = prod.dataEntrega
              ? new Date(prod.dataEntrega).toLocaleDateString("pt-BR")
              : null;
            const listaPags =
              prod.pagamentos && prod.pagamentos.length > 0
                ? prod.pagamentos
                : prod.pagamentosCostura || [];
            const recCount = Array.isArray(prod.recebimentos) ? prod.recebimentos.length : 0;
            const pagCount = listaPags.length;

            return (
              <motion.div
                layout
                key={prod.id}
                className={`premium-card bg-white dark:bg-card rounded-[24px] border border-border/50 overflow-hidden flex flex-col transition-colors duration-200 relative ${
                  isEntregue ? "border-primary/30" : "hover:border-border"
                }`}
              >
                <div className="p-5 sm:p-6 flex flex-col gap-4">
                  {/* Topo do Card: Foto, Identificação, Lote, Costureiro, Datas e Ações do Topo */}
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {prod.produtoFoto ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhotoModal({
                            url: prod.produtoFoto,
                            nome: prod.produtoNome,
                            lote: getLoteCurto(prod),
                            sku: prod.sku,
                            costureira: prod.costureiraNome,
                          });
                          setPhotoZoom(1);
                        }}
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-border/50 flex-shrink-0 relative group/thumb cursor-pointer bg-slate-50 dark:bg-muted/30"
                        title="Ver foto em tamanho real"
                      >
                        <img
                          src={prod.produtoFoto}
                          alt={prod.produtoNome}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <ZoomIn size={16} />
                        </div>
                      </button>
                    ) : (
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center border border-border/50 flex-shrink-0 bg-accent/40 text-primary">
                        {isEntregue ? (
                          <CheckCircle2 size={24} strokeWidth={2} />
                        ) : (
                          <Tag size={24} strokeWidth={1.8} />
                        )}
                        <span className="text-[9px] font-semibold mt-1 text-muted-foreground uppercase">
                          Sem foto
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                              LOTE {getLoteCurto(prod)}
                            </span>
                            <span className="text-xs font-medium bg-accent text-foreground px-2 py-0.5 rounded-md">
                              {prod.statusProducao || "Em Produção"}
                            </span>
                            {isEntregue && (
                              <span className="text-[11px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-md uppercase">
                                100% Entregue
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-base sm:text-lg text-foreground leading-tight truncate">
                            {prod.produtoNome}
                          </h4>
                        </div>
                        {/* Ações do Topo: Editar, Expandir e Menu */}
                        <div className="flex items-center gap-0.5 shrink-0 ml-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(prod)}
                            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Editar Produção Completa"
                          >
                            <Edit2 size={14} />
                          </Button>
                          {/* Botão de Expandir Registros no Topo */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => toggleExpand(prod.id, e)}
                            className={`w-8 h-8 rounded-lg transition-colors ${
                              isExpanded
                                ? "bg-primary/15 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`}
                            title={isExpanded ? "Recolher registros de pagamento e entrega" : "Expandir registros de pagamento e entrega"}
                          >
                            {isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors outline-none">
                              <MoreVertical size={15} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-56 rounded-2xl shadow-xl border-border/50 p-2 font-medium bg-white/95 backdrop-blur-md"
                            >
                              <DropdownMenuItem
                                onClick={() => openEdit(prod)}
                                className="cursor-pointer gap-2 py-2.5 rounded-xl focus:bg-accent"
                              >
                                <Edit2 size={16} /> Editar Produção
                              </DropdownMenuItem>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="cursor-pointer gap-2 py-2.5 rounded-xl focus:bg-accent">
                                  <Tag size={16} /> Mudar Prioridade
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent className="w-48 rounded-2xl p-2 font-medium shadow-xl border-border/50 bg-white/95 backdrop-blur-md">
                                    {(configuracoes.prioridades || []).map(
                                      (p: string) => (
                                        <DropdownMenuItem
                                          key={p}
                                          onClick={() =>
                                            updateProdField(
                                              prod.id,
                                              "etiquetas",
                                              [p.toLowerCase()],
                                            )
                                          }
                                          className="cursor-pointer rounded-xl py-2 focus:bg-accent"
                                        >
                                          {p}
                                        </DropdownMenuItem>
                                      ),
                                    )}
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="cursor-pointer gap-2 py-2.5 rounded-xl focus:bg-accent">
                                  <CheckCircle2 size={16} /> Mudar Fase
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent className="w-48 rounded-2xl p-2 font-medium shadow-xl border-border/50 bg-white/95 backdrop-blur-md">
                                    {(
                                      configuracoes.statusProducao || [
                                        "Pré-produção",
                                        "Modelagem",
                                        "Risco",
                                        "Corte",
                                        "Costura",
                                        "Finalizado",
                                      ]
                                    ).map((s: string) => (
                                      <DropdownMenuItem
                                        key={s}
                                        onClick={() =>
                                          updateProdField(
                                            prod.id,
                                            "statusProducao",
                                            s,
                                          )
                                        }
                                        className="cursor-pointer rounded-xl py-2 focus:bg-accent"
                                      >
                                        {s}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                              <div className="h-px bg-border/50 my-1"></div>
                              <DropdownMenuItem
                                onClick={() => gerarFichaProducao(prod)}
                                className="cursor-pointer gap-2 py-2.5 rounded-xl focus:bg-accent"
                              >
                                <Download size={16} /> Baixar Ficha Geral
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => gerarReciboCostureira(prod)}
                                className="cursor-pointer gap-2 py-2.5 rounded-xl focus:bg-accent"
                              >
                                <FileText size={16} /> Gerar Recibo PDF
                              </DropdownMenuItem>
                              <div className="h-px bg-border/50 my-1"></div>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(prod.id)}
                                className="cursor-pointer gap-2 text-primary focus:bg-primary/10 py-2.5 rounded-xl"
                              >
                                <Trash2 size={16} /> Excluir Produção
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {/* Nome do Costureiro(a) e Datas */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground bg-accent/60 px-2.5 py-0.5 rounded-lg"
                          title="Costureiro(a) / Faccionista Responsável"
                        >
                          <User size={12} className="text-primary" />
                          <span>{prod.costureiraNome || "Sem Costureiro(a)"}</span>
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/30 px-2.5 py-0.5 rounded-lg">
                          <Calendar size={12} className="text-primary" />
                          <span>Início: {dataInicioFormatada}</span>
                          {dataEntregaFormatada && (
                            <span className="text-foreground font-medium">
                              • Entrega: {dataEntregaFormatada}
                            </span>
                          )}
                        </span>

                        {prod.sku && (
                          <span className="text-xs text-muted-foreground ml-0.5">
                            SKU: {prod.sku}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PROCESSO DE PRODUÇÃO: Barra minimalista e contagem */}
                  <div className="flex flex-col justify-center bg-accent/20 p-3.5 sm:p-4 rounded-2xl border border-border/30">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[11px] text-muted-foreground font-semibold tracking-wider uppercase">
                        Progresso da Produção
                      </span>
                      <span className="text-[13px] font-bold text-foreground">
                        {Number.isNaN(progress) ? 0 : Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-accent/60 rounded-full h-2 overflow-hidden mb-2.5">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[13px] font-medium text-muted-foreground">
                        <span className="text-[17px] font-black text-foreground">
                          {delivered.toLocaleString("pt-BR")}
                        </span>
                        {" / "}
                        {Number(prod.quantidadeTotal).toLocaleString("pt-BR") || 0} un.
                      </div>
                      {prod.quantidadePorTamanho &&
                        Object.keys(prod.quantidadePorTamanho).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(prod.quantidadePorTamanho).map(
                              ([t, q]) => (
                                <span
                                  key={t}
                                  className="text-[10px] font-medium bg-white dark:bg-card text-foreground px-2 py-0.5 rounded-md border border-border/40"
                                >
                                  {t}: {q as string}
                                </span>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* BLOCO CENTRALIZADO: FINANCEIRO DA COSTURA (PENDENTE COSTURA / PAGO / TOTAL) */}
                  <div className="bg-accent/20 rounded-2xl p-4 sm:p-4.5 flex flex-col gap-3 border border-border/40">
                    {/* Cabeçalho da Costura */}
                    <div className="flex items-center justify-between border-b border-border/30 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-bold tracking-wider uppercase">
                          Costura / Facção
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            isCosturaPaga
                              ? "bg-primary/10 text-primary"
                              : saldoCosturaCard > 0 && totalPagoCosturaCard > 0
                              ? "bg-primary/15 text-primary"
                              : saldoCosturaCard > 0
                              ? "bg-accent text-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {isCosturaPaga
                            ? "Costura Paga"
                            : saldoCosturaCard > 0 && totalPagoCosturaCard > 0
                            ? "Parcial"
                            : saldoCosturaCard > 0
                            ? "Pendente"
                            : "Quitada"}
                        </span>
                      </div>
                      {custoCosturaUnitario > 0 && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          R$ {custoCosturaUnitario.toFixed(2)}/un.
                        </span>
                      )}
                    </div>

                    {/* Destaque das 3 Métricas da Costura */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-center">
                      {/* 1. Pendente Costura */}
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase mb-0.5">
                          Pendente Costura
                        </span>
                        <div className="text-[20px] sm:text-[22px] font-black tracking-tight text-foreground leading-none">
                          {saldoCosturaCard.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </div>
                      </div>

                      {/* 2. Já Pago Costura */}
                      <div className="flex flex-col sm:border-l sm:border-border/30 sm:pl-3.5">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase mb-0.5">
                          Já Pago
                        </span>
                        <span className="text-[15px] font-bold text-primary">
                          {totalPagoCosturaCard.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </div>

                      {/* 3. Total Costura */}
                      <div className="flex flex-col sm:border-l sm:border-border/30 sm:pl-3.5">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase mb-0.5">
                          Total Costura
                        </span>
                        <span className="text-[15px] font-bold text-foreground">
                          {totalCosturaCard.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AÇÕES MINIMALISTAS: REGISTRAR ENTREGA, LANÇAR PAGAMENTO, EDITAR E RECIBO */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
                    <Button
                      onClick={() => openRecebimento(prod.id)}
                      className="flex-1 rounded-xl bg-primary hover:bg-[#5B3DF5] text-white h-10 text-xs font-semibold shadow-none border-none transition-colors"
                    >
                      <CheckSquare size={15} className="mr-1.5" />
                      Registrar Entrega
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openPagamento(prod.id)}
                      className="flex-1 rounded-xl border-border/50 bg-white dark:bg-card hover:bg-accent text-foreground h-10 text-xs font-semibold shadow-none transition-colors"
                    >
                      <DollarSign size={15} className="mr-1.5 text-primary" />
                      Lançar Pagamento
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openEdit(prod)}
                      className="rounded-xl border-border/50 bg-white dark:bg-card hover:bg-accent text-foreground h-10 px-3.5 text-xs font-semibold shadow-none shrink-0 transition-colors"
                      title="Editar Produção Completa e Custos por Etapa"
                    >
                      <Edit2 size={14} className="mr-1.5 text-primary" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => gerarReciboCostureira(prod)}
                      className="rounded-xl border-border/50 bg-white dark:bg-card hover:bg-accent text-foreground h-10 px-3 text-xs font-semibold shadow-none shrink-0 transition-colors"
                      title="Gerar e Baixar Recibo PDF"
                    >
                      <FileText size={15} className="text-primary" />
                    </Button>
                  </div>

                  {/* ÁREA EXPANSÍVEL (ACIONADA EXCLUSIVAMENTE PELO BOTÃO NO TOPO):
                      Registro de Pagamento e Entrega um abaixo do outro (1 coluna por registro) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-border/40 flex flex-col gap-3.5">
                          {/* 1. Registro de Pagamentos (1 Coluna) */}
                          <div className="premium-card p-4 rounded-2xl bg-accent/20 border border-border/40">
                            <div className="flex items-center justify-between mb-2.5">
                              <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                <DollarSign size={14} className="text-primary" />
                                Registro de Pagamentos
                              </h4>
                              <span className="text-[11px] text-muted-foreground font-semibold">
                                Total Pago: R$ {Number(totalPagoCosturaCard || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex flex-col gap-2">
                              {listaPags.length === 0 ? (
                                <p className="text-xs font-medium text-muted-foreground text-center py-3">
                                  Nenhum pagamento registrado ainda.
                                </p>
                              ) : (
                                listaPags.map((pag: any, i: number) => (
                                  <div
                                    key={i}
                                    className="p-3 rounded-xl bg-white dark:bg-card border border-border/40 hover:border-primary/30 flex flex-col gap-1 relative group pr-14 transition-colors"
                                  >
                                    <div className="flex justify-between items-start gap-1 flex-wrap">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-foreground">
                                          {new Date(pag.createdAt || pag.data).toLocaleDateString("pt-BR")}
                                        </span>
                                        {pag.favorecido && (
                                          <span className="text-[11px] font-medium text-muted-foreground">
                                            {pag.favorecido}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                                        R$ {parseFloat(pag.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    {pag.categoria && (
                                      <span className="text-[10px] font-medium text-muted-foreground">
                                        Categoria: {pag.categoria}
                                      </span>
                                    )}
                                    {pag.observacao && (
                                      <span className="text-[11px] font-normal text-muted-foreground italic">
                                        "{pag.observacao}"
                                      </span>
                                    )}
                                    <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        title="Editar pagamento"
                                        onClick={() => openPagamento(prod.id, pag)}
                                      >
                                        <Edit2 size={13} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5"
                                        title="Excluir pagamento"
                                        onClick={() =>
                                          setDeletePagamentoConfirm({
                                            prodId: prod.id,
                                            pagamento: pag,
                                          })
                                        }
                                      >
                                        <Trash2 size={13} />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* 2. Registro de Entregas (Abaixo do Pagamento, 1 Coluna) */}
                          <div className="premium-card p-4 rounded-2xl bg-accent/20 border border-border/40">
                            <div className="flex items-center justify-between mb-2.5">
                              <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                <CheckSquare size={14} className="text-primary" />
                                Registro de Entregas
                              </h4>
                              <span className="text-[11px] text-muted-foreground font-semibold">
                                {delivered} peças entregues
                              </span>
                            </div>
                            <div className="flex flex-col gap-2">
                              {!prod.recebimentos || prod.recebimentos.length === 0 ? (
                                <p className="text-xs font-medium text-muted-foreground text-center py-3">
                                  Nenhuma entrega registrada ainda.
                                </p>
                              ) : (
                                prod.recebimentos.map((rec: any, i: number) => (
                                  <div
                                    key={i}
                                    className="p-3 rounded-xl bg-white dark:bg-card border border-border/40 hover:border-primary/30 flex flex-col gap-1 relative group pr-14 transition-colors"
                                  >
                                    <div className="flex justify-between items-start">
                                      <span className="text-xs font-bold text-foreground">
                                        {new Date(rec.createdAt || rec.data).toLocaleDateString("pt-BR")}
                                      </span>
                                      <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                        +{rec.quantidade} un.
                                      </span>
                                    </div>
                                    {rec.quantidadeDefeito > 0 && (
                                      <span className="text-[10px] font-medium text-muted-foreground">
                                        Defeitos: {rec.quantidadeDefeito}
                                      </span>
                                    )}
                                    {rec.observacao && (
                                      <span className="text-[11px] font-normal text-muted-foreground italic">
                                        "{rec.observacao}"
                                      </span>
                                    )}
                                    <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        title="Editar entrega"
                                        onClick={() => openRecebimento(prod.id, rec)}
                                      >
                                        <Edit2 size={13} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5"
                                        title="Excluir entrega"
                                        onClick={() =>
                                          setDeleteRecebimentoConfirm({
                                            prodId: prod.id,
                                            recebimento: rec,
                                          })
                                        }
                                      >
                                        <Trash2 size={13} />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}{" "}
        </div>
      )}{" "}
      {!loading && filteredProducoes.length === 0 && (
        <div className="premium-card text-center py-24 px-4 /40 backdrop-blur-xl rounded-[3rem] -dashed -/50">
          {" "}
          <div className="w-20 h-20 bg-accent rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-white">
            {" "}
            <AlertCircle
              size={32}
              className="text-muted-foreground"
              strokeWidth={1.5}
            />{" "}
          </div>{" "}
          <h3 className="text-xl font-black text-foreground mb-2 tracking-tight">
            Nenhuma produção listada
          </h3>{" "}
          <p className="text-muted-foreground font-medium text-sm max-w-sm mx-auto">
            Tente ajustar seus filtros de busca ou cadastre uma nova ficha de
            produção para começar.
          </p>{" "}
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="mt-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-full px-6 h-12 font-bold focus:ring-4 focus:ring-primary/20"
          >
            {" "}
            Cadastrar Nova Produção{" "}
          </Button>{" "}
        </div>
      )}{" "}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {" "}
        <DialogContent className="sm:max-w-[750px] lg:max-w-4xl xl:max-w-5xl rounded-[3rem] p-0 glass-card border flex border-border/50 shadow-2xl overflow-hidden flex-col max-h-[90vh] bg-white/80">
          {" "}
          <DialogHeader className="px-8 py-6 border-b border-border/50 bg-white/60 sticky top-0 z-10 backdrop-blur-xl">
            {" "}
            <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
              {editingId ? "Editar Produção" : "Nova Produção"}
            </DialogTitle>{" "}
          </DialogHeader>{" "}
          <div className="px-6 lg:px-8 py-6 overflow-y-auto hide-scrollbar">
            {" "}
            {produtos.length === 0 || costureiras.length === 0 ? (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-2xl text-sm mb-4">
                {" "}
                ⚠️ Você precisa cadastrar <strong>Produtos</strong> e{" "}
                <strong>Costureiras</strong> nas configurações antes de criar
                uma produção.{" "}
              </div>
            ) : null}{" "}
            <div className="space-y-8">
              {" "}
              <div className="premium-card p-6 rounded-[32px] border-gray-100 space-y-5">
                {" "}
                <h3 className="font-bold text-gray-800 flex items-center mb-1">
                  <Tag size={20} className="mr-2 text-blue-600" /> Informações
                  Básicas
                </h3>{" "}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {" "}
                  <div
                    className={`space-y-2 ${formData.statusProducao === "Costura" ? "md:col-span-4" : "md:col-span-8"}`}
                  >
                    <Label className="text-[#1F2937] font-semibold text-sm">
                      Produto *
                    </Label>
                    <Select
                      value={formData.produtoId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, produtoId: v })
                      }
                    >
                      <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 h-12">
                        <SelectValue placeholder="Selecione o produto..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {produtos.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div
                    className={`space-y-2 ${formData.statusProducao === "Costura" ? "md:col-span-3" : "md:col-span-4"}`}
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-[#1F2937] font-semibold text-sm">
                        Lote / Corte
                      </Label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, lote: gerarLoteAleatorio() })}
                        className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        title="Gerar 4 números aleatórios"
                      >
                        <Shuffle className="w-3 h-3" /> Gerar aleatório
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Ex: L4589"
                        value={formData.lote}
                        onChange={(e) =>
                          setFormData({ ...formData, lote: e.target.value.toUpperCase() })
                        }
                        className="rounded-xl border-gray-200 bg-gray-50 h-12 font-semibold text-sm flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Gerar 4 números aleatórios"
                        onClick={() => setFormData({ ...formData, lote: gerarLoteAleatorio() })}
                        className="h-12 w-12 rounded-xl border-gray-200 bg-gray-50 hover:bg-primary/10 hover:text-primary text-muted-foreground shrink-0 transition-colors"
                      >
                        <Shuffle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {formData.statusProducao === "Costura" && (
                    <>
                      <div
                        className={`space-y-2 ${hasVariants ? "md:col-span-5" : "md:col-span-3"}`}
                      >
                        <Label className="text-[#1F2937] font-semibold text-sm">
                          Costureira Responsável *
                        </Label>
                        <Select
                          value={formData.costureiraId}
                          onValueChange={(v) =>
                            setFormData({ ...formData, costureiraId: v })
                          }
                        >
                          <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 h-12">
                            <SelectValue placeholder="Selecione a costureira..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {costureiras.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        {" "}
                        <Label className="text-[#1F2937] font-bold text-sm">
                          Qtde Total *
                        </Label>{" "}
                        <Input
                          type="number"
                          placeholder="Ex: 100"
                          value={formData.quantidadeTotal}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quantidadeTotal: e.target.value,
                            })
                          }
                          className="rounded-xl bg-gray-50 border-blue-200 font-bold h-12"
                        />{" "}
                      </div>{" "}
                      {hasVariants && (
                        <div className="space-y-2 md:col-span-12 mt-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                          {" "}
                          <div className="flex items-center justify-between mb-2">
                            {" "}
                            <Label className="text-[#1F2937] font-bold text-sm">
                              Preenchimento Opcional por Grade/Cor
                            </Label>{" "}
                            <span className="text-[11px] text-gray-500 font-medium">
                              Ao preencher, a Qtde Total soma automaticamente
                            </span>{" "}
                          </div>{" "}
                          <div className="flex flex-wrap gap-4 items-end mt-2">
                            {" "}
                            {selectedVariants.map((tamanho: string) => (
                              <div
                                key={tamanho}
                                className="flex flex-col gap-1.5"
                              >
                                {" "}
                                <Label className="text-xs font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md w-max mx-auto">
                                  {tamanho}
                                </Label>{" "}
                                <Input
                                  type="number"
                                  className="premium-input w-16 h-10 text-center rounded-xl bg-white border-blue-200 font-bold shadow-sm"
                                  value={
                                    formData.quantidadePorTamanho?.[tamanho] ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleQuantidadeTamanhoChange(
                                      tamanho,
                                      e.target.value,
                                    )
                                  }
                                />{" "}
                              </div>
                            ))}{" "}
                          </div>{" "}
                        </div>
                      )}{" "}
                    </>
                  )}{" "}
                </div>{" "}
              </div>{" "}
              <div className="premium-card p-6 rounded-[32px] border-gray-100 space-y-5">
                {" "}
                <h3 className="font-bold text-gray-800 flex items-center mb-1">
                  <Clock size={20} className="mr-2 text-blue-600" /> Prazos e
                  Status
                </h3>{" "}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {" "}
                  <div className="space-y-2">
                    {" "}
                    <Label className="text-[#1F2937] font-semibold text-sm">
                      Fase da Produção
                    </Label>{" "}
                    <Select
                      value={formData.statusProducao}
                      onValueChange={(v) =>
                        setFormData({ ...formData, statusProducao: v })
                      }
                    >
                      {" "}
                      <SelectTrigger className="rounded-xl bg-gray-50 h-12 border-gray-200 text-sm font-medium">
                        {" "}
                        <SelectValue placeholder="Selecione a fase" />{" "}
                      </SelectTrigger>{" "}
                      <SelectContent className="rounded-xl">
                        {" "}
                        {(
                          configuracoes.statusProducao || [
                            "Pré-produção",
                            "Modelagem",
                            "Risco",
                            "Corte",
                            "Costura",
                            "Finalizado",
                          ]
                        ).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}{" "}
                      </SelectContent>{" "}
                    </Select>{" "}
                  </div>{" "}
                  <div className="space-y-2">
                    {" "}
                    <Label className="text-[#1F2937] font-semibold text-sm">
                      Prioridade
                    </Label>{" "}
                    <Select
                      value={formData.etiquetaPrioridade}
                      onValueChange={(v) =>
                        setFormData({ ...formData, etiquetaPrioridade: v })
                      }
                    >
                      {" "}
                      <SelectTrigger className="rounded-xl bg-gray-50 h-12 border-gray-200 text-sm">
                        {" "}
                        <SelectValue />{" "}
                      </SelectTrigger>{" "}
                      <SelectContent className="rounded-xl">
                        {" "}
                        {(configuracoes.prioridades || []).map((p) => (
                          <SelectItem key={p} value={p.toLowerCase()}>
                            {p}
                          </SelectItem>
                        ))}{" "}
                      </SelectContent>{" "}
                    </Select>{" "}
                  </div>{" "}
                  <div className="space-y-2">
                    {" "}
                    <Label className="text-[#1F2937] font-semibold text-sm">
                      Data Início
                    </Label>{" "}
                    <Input
                      type="date"
                      value={formData.dataInicio}
                      onChange={(e) =>
                        setFormData({ ...formData, dataInicio: e.target.value })
                      }
                      className="rounded-xl bg-gray-50 border-gray-200 h-12 text-sm text-gray-700"
                    />{" "}
                  </div>{" "}
                  <div className="space-y-2">
                    {" "}
                    <Label className="text-[#1F2937] font-semibold text-sm">
                      Prev. Entrega
                    </Label>{" "}
                    <Input
                      type="date"
                      value={formData.dataPrevistaEntrega}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dataPrevistaEntrega: e.target.value,
                        })
                      }
                      className="rounded-xl bg-red-50/50 border-red-200 text-red-700 font-medium h-12"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                {formData.statusProducao === "Costura" && (
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row gap-5 animate-in fade-in zoom-in-95 duration-300 mt-4">
                    {" "}
                    <div className="space-y-2 flex-1">
                      {" "}
                      <Label className="text-blue-900 font-semibold text-xs uppercase tracking-widest">
                        Início Costura
                      </Label>{" "}
                      <Input
                        type="date"
                        value={formData.dataInicioCostura}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dataInicioCostura: e.target.value,
                          })
                        }
                        className="rounded-xl bg-white border-blue-200 h-12 text-sm text-blue-900"
                      />{" "}
                    </div>{" "}
                    <div className="space-y-2 flex-1">
                      {" "}
                      <Label className="text-blue-900 font-semibold text-xs uppercase tracking-widest">
                        Status Entrega Fatiada
                      </Label>{" "}
                      <Select
                        value={formData.statusEntrega}
                        onValueChange={(v) =>
                          setFormData({ ...formData, statusEntrega: v })
                        }
                      >
                        {" "}
                        <SelectTrigger className="rounded-xl bg-white h-12 border-blue-200 text-sm font-medium text-blue-900">
                          {" "}
                          <SelectValue />{" "}
                        </SelectTrigger>{" "}
                        <SelectContent className="rounded-xl">
                          {" "}
                          {(configuracoes.status || []).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}{" "}
                        </SelectContent>{" "}
                      </Select>{" "}
                    </div>{" "}
                  </div>
                )}{" "}
              </div>{" "}
              {/* DETALHAMENTO FINANCEIRO & PAGAMENTOS POR ETAPA ORGANIZADO NO MODAL DE EDIÇÃO */}
              <div className="premium-card p-6 rounded-[28px] border-border/60 bg-accent/25 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                  <div>
                    <h3 className="font-bold text-foreground flex items-center text-base tracking-tight gap-2">
                      <Layers size={18} className="text-primary" />
                      Detalhamento Financeiro & Pagamentos por Etapa
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      Controle individual de custos e status de pagamento de cada processo do lote
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        isCurrentQuitado
                          ? "bg-primary/10 text-primary border-primary/30"
                          : currentTotalPago > 0
                          ? "bg-primary/15 text-primary border-primary/20"
                          : "bg-accent text-muted-foreground border-border/50"
                      }`}
                    >
                      {isCurrentQuitado ? "Lote 100% Quitado" : currentTotalPago > 0 ? "Pagamento Parcial" : "Pendente Total"}
                    </span>
                  </div>
                </div>

                {/* 4 Indicadores Principais do Lote */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-card border border-border/50 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Custo Total
                    </span>
                    <span className="text-[20px] font-black text-foreground mt-1">
                      {currentCusto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      Soma de todas as etapas
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-card border border-border/50 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Já Pago
                    </span>
                    <span className="text-[20px] font-black text-primary mt-1">
                      {currentTotalPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      Etapas marcadas como pagas
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-card border border-border/50 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Saldo a Pagar
                    </span>
                    <span className="text-[20px] font-black text-foreground mt-1">
                      {currentSaldoPendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {isCurrentQuitado ? "Nenhuma pendência" : "Aguardando quitação"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-card border border-border/50 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Custo / Peça
                    </span>
                    <span className="text-[20px] font-black text-foreground mt-1">
                      {(parsedQtd > 0 ? currentCusto / parsedQtd : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {parsedQtd} peças totais
                    </span>
                  </div>
                </div>

                {/* Grade Resumida de Todas as Etapas com Status e Checkbox Rápido */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {/* Tecido */}
                  <div className="p-3.5 rounded-[18px] bg-white dark:bg-card border border-border/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          1. Tecido
                        </span>
                        <span className="text-[17px] font-bold text-foreground">
                          {calcCustoTecido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold cursor-pointer px-2.5 py-1 rounded-xl border transition-colors ${formData.pagoTecido ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"}`}>
                        <input
                          type="checkbox"
                          checked={formData.pagoTecido}
                          onChange={(e) => setFormData({ ...formData, pagoTecido: e.target.checked })}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                        />
                        PAGO
                      </label>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      {formData.fornecedoresTecido?.[0]?.fornecedor || formData.fornecedorTecido || "Fornecedor não inf."}
                    </span>
                  </div>

                  {/* Corte */}
                  <div className="p-3.5 rounded-[18px] bg-white dark:bg-card border border-border/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          2. Corte
                        </span>
                        <span className="text-[17px] font-bold text-foreground">
                          {currentValCorte.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold cursor-pointer px-2.5 py-1 rounded-xl border transition-colors ${formData.pagoCorte ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"}`}>
                        <input
                          type="checkbox"
                          checked={formData.pagoCorte}
                          onChange={(e) => setFormData({ ...formData, pagoCorte: e.target.checked })}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                        />
                        PAGO
                      </label>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      Cortador: {formData.nomeCortador || "Não inf."}
                    </span>
                  </div>

                  {/* Modelagem */}
                  <div className="p-3.5 rounded-[18px] bg-white dark:bg-card border border-border/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          3. Modelagem
                        </span>
                        <span className="text-[17px] font-bold text-foreground">
                          {currentValModelagem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold cursor-pointer px-2.5 py-1 rounded-xl border transition-colors ${formData.pagoModelagem ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"}`}>
                        <input
                          type="checkbox"
                          checked={formData.pagoModelagem}
                          onChange={(e) => setFormData({ ...formData, pagoModelagem: e.target.checked })}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                        />
                        PAGO
                      </label>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      Modelista: {formData.nomeModelista || "Não inf."}
                    </span>
                  </div>

                  {/* Risco */}
                  <div className="p-3.5 rounded-[18px] bg-white dark:bg-card border border-border/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          4. Risco
                        </span>
                        <span className="text-[17px] font-bold text-foreground">
                          {currentValRisco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold cursor-pointer px-2.5 py-1 rounded-xl border transition-colors ${formData.pagoRisco ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"}`}>
                        <input
                          type="checkbox"
                          checked={formData.pagoRisco}
                          onChange={(e) => setFormData({ ...formData, pagoRisco: e.target.checked })}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                        />
                        PAGO
                      </label>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      Riscador: {formData.nomeRiscador || "Não inf."}
                    </span>
                  </div>

                  {/* Costura / Facção */}
                  <div className="p-3.5 rounded-[18px] bg-white dark:bg-card border border-border/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          5. Costura / Facção
                        </span>
                        <span className="text-[17px] font-bold text-foreground">
                          {currentCosturaTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold cursor-pointer px-2.5 py-1 rounded-xl border transition-colors ${formData.pagoCostura ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"}`}>
                        <input
                          type="checkbox"
                          checked={formData.pagoCostura}
                          onChange={(e) => setFormData({ ...formData, pagoCostura: e.target.checked })}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                        />
                        PAGO TOTAL
                      </label>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      {formData.valorCostura ? `R$ ${parseFloat(formData.valorCostura).toFixed(2)}/peça` : "Valor não inf."}
                    </span>
                  </div>

                  {/* Insumos */}
                  <div className="p-3.5 rounded-[18px] bg-white dark:bg-card border border-border/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          6. Insumos / Extras
                        </span>
                        <span className="text-[17px] font-bold text-foreground">
                          {(currentValInsumos + currentValOutros).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold cursor-pointer px-2.5 py-1 rounded-xl border transition-colors ${formData.pagoInsumos ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"}`}>
                        <input
                          type="checkbox"
                          checked={formData.pagoInsumos}
                          onChange={(e) => setFormData({ ...formData, pagoInsumos: e.target.checked })}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                        />
                        PAGO
                      </label>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      Linhas, zíperes, extras
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pl-2">
                  <h3 className="font-bold text-foreground flex items-center text-sm uppercase tracking-widest gap-2">
                    <DollarSign size={16} className="text-primary" />
                    Aquisição de Tecido
                  </h3>
                  <label
                    className={`flex items-center gap-2 text-xs font-bold cursor-pointer px-3 py-1.5 rounded-xl border transition-colors ${
                      formData.pagoTecido
                        ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.pagoTecido}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pagoTecido: e.target.checked,
                        })
                      }
                      className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    PAGO
                  </label>
                </div>{" "}
                <div className="premium-card p-5 sm:p-6 rounded-[32px] border-gray-100 -[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                  {" "}
                  <div className="flex justify-between items-center mb-4">
                    {" "}
                    <p className="text-sm text-gray-500 font-medium">
                      Registre os fornecedores do tecido, valores e medidas da
                      compra.
                    </p>{" "}
                    {formData.fornecedoresTecido.length < 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            fornecedoresTecido: [
                              ...prev.fornecedoresTecido,
                              {
                                fornecedor: "",
                                rolos: "",
                                tipoMedida: "metros",
                                quantidade: "",
                                valorUnitario: "",
                                totalCompra: "",
                              },
                            ],
                          }))
                        }
                        className="h-10 px-4 text-sm text-blue-600 border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 font-bold shadow-sm rounded-xl"
                      >
                        {" "}
                        + Fornecedor{" "}
                      </Button>
                    )}{" "}
                  </div>{" "}
                  <div className="grid grid-cols-1 gap-5">
                    {" "}
                    {formData.fornecedoresTecido.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-5 bg-gray-50/80 rounded-2xl border border-gray-100/50 relative shadow-sm"
                      >
                        {" "}
                        {idx > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const nf = [...formData.fornecedoresTecido];
                              nf.splice(idx, 1);
                              setFormData((prev) => ({
                                ...prev,
                                fornecedoresTecido: nf,
                              }));
                            }}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-100 text-red-500 shadow-sm hover:bg-red-200"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}{" "}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                          {" "}
                          <div className="space-y-1.5 md:col-span-3">
                            {" "}
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                              Fornecedor
                            </Label>{" "}
                            <Input
                              placeholder="Ex: Tecidos Ltda"
                              value={f.fornecedor}
                              onChange={(e) => {
                                const nf = [...formData.fornecedoresTecido];
                                nf[idx].fornecedor = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  fornecedoresTecido: nf,
                                }));
                              }}
                              className="rounded-xl bg-white border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] h-11 text-sm focus-visible:ring-1"
                            />{" "}
                          </div>{" "}
                          <div className="space-y-1.5 md:col-span-1">
                            {" "}
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                              Rolos
                            </Label>{" "}
                            <Input
                              type="number"
                              placeholder="0"
                              value={f.rolos}
                              onChange={(e) => {
                                const nf = [...formData.fornecedoresTecido];
                                nf[idx].rolos = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  fornecedoresTecido: nf,
                                }));
                              }}
                              className="rounded-xl bg-white border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] h-11 text-sm focus-visible:ring-1"
                            />{" "}
                          </div>{" "}
                          <div className="space-y-1.5 md:col-span-2">
                            {" "}
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                              Medida
                            </Label>{" "}
                            <Select
                              value={f.tipoMedida}
                              onValueChange={(v: "metros" | "kg") => {
                                const nf = [...formData.fornecedoresTecido];
                                nf[idx].tipoMedida = v;
                                setFormData((prev) => ({
                                  ...prev,
                                  fornecedoresTecido: nf,
                                }));
                              }}
                            >
                              {" "}
                              <SelectTrigger className="rounded-xl bg-white border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] h-11 text-sm">
                                <SelectValue />
                              </SelectTrigger>{" "}
                              <SelectContent>
                                <SelectItem value="metros" className="text-sm">
                                  Metros
                                </SelectItem>
                                <SelectItem value="kg" className="text-sm">
                                  Kg
                                </SelectItem>
                              </SelectContent>{" "}
                            </Select>{" "}
                          </div>{" "}
                          <div className="space-y-1.5 md:col-span-2">
                            {" "}
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                              Qtd
                            </Label>{" "}
                            <Input
                              type="number"
                              placeholder="0"
                              value={f.quantidade}
                              onChange={(e) => {
                                const nf = [...formData.fornecedoresTecido];
                                nf[idx].quantidade = e.target.value;
                                const unit =
                                  parseFloat(nf[idx].valorUnitario) || 0;
                                const qtd = parseFloat(e.target.value) || 0;
                                if (unit > 0 && qtd > 0)
                                  nf[idx].totalCompra = (unit * qtd).toFixed(2);
                                setFormData((prev) => ({
                                  ...prev,
                                  fornecedoresTecido: nf,
                                }));
                              }}
                              className="rounded-xl bg-white border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] h-11 text-sm focus-visible:ring-1"
                            />{" "}
                          </div>{" "}
                          <div className="space-y-1.5 md:col-span-2">
                            {" "}
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                              V. Unit (R$)
                            </Label>{" "}
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={f.valorUnitario}
                              onChange={(e) => {
                                const nf = [...formData.fornecedoresTecido];
                                nf[idx].valorUnitario = e.target.value;
                                const qtd = parseFloat(nf[idx].quantidade) || 0;
                                const unit = parseFloat(e.target.value) || 0;
                                if (unit > 0 && qtd > 0)
                                  nf[idx].totalCompra = (unit * qtd).toFixed(2);
                                setFormData((prev) => ({
                                  ...prev,
                                  fornecedoresTecido: nf,
                                }));
                              }}
                              className="rounded-xl bg-white border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] h-11 text-sm focus-visible:ring-1"
                            />{" "}
                          </div>{" "}
                          <div className="space-y-1.5 md:col-span-2">
                            {" "}
                            <Label className="text-[11px] font-bold text-blue-600 uppercase tracking-widest ml-1">
                              Total (R$)
                            </Label>{" "}
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={f.totalCompra}
                              onChange={(e) => {
                                const nf = [...formData.fornecedoresTecido];
                                nf[idx].totalCompra = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  fornecedoresTecido: nf,
                                }));
                              }}
                              className="rounded-xl bg-blue-50/50 border-blue-200 text-blue-900 shadow-sm h-11 text-sm font-bold focus-visible:ring-1"
                            />{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>
                    ))}{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-6 pt-4 border-t border-gray-100">
                {" "}
                <h3 className="font-bold text-gray-800 flex items-center pl-2 text-sm uppercase tracking-widest">
                  <DollarSign size={20} className="mr-2 text-gray-400" />{" "}
                  Serviços e Pagamentos
                </h3>{" "}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {" "}
                  {}{" "}
                  <div className="premium-card p-5 rounded-[24px] border-gray-100 space-y-4 relative overflow-hidden group hover:-blue-200 transition-colors">
                    {" "}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>{" "}
                    <div className="flex justify-between items-center pl-3">
                      {" "}
                      <Label className="text-base font-bold text-gray-800">
                        Modelagem
                      </Label>{" "}
                      <label
                        className={`flex items-center gap-2 text-xs font-bold cursor-pointer px-3 py-1.5 rounded-xl border transition-colors ${formData.pagoModelagem ? "bg-primary/10 text-primary border-primary/30 shadow-sm" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"}`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.pagoModelagem}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pagoModelagem: e.target.checked,
                            })
                          }
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                        PAGO
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Profissional
                        </Label>
                        <Input
                          placeholder="Nome"
                          value={formData.nomeModelista}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nomeModelista: e.target.value,
                            })
                          }
                          className="h-11 text-sm rounded-xl bg-gray-50 border-gray-200 shadow-sm focus-visible:ring-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Valor Total (R$)
                        </Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={formData.valorModelagem}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              valorModelagem: e.target.value,
                            })
                          }
                          className="h-11 text-sm rounded-xl bg-white border-border shadow-sm focus-visible:ring-1 font-bold text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="premium-card p-5 rounded-[24px] border-border/60 space-y-4 relative overflow-hidden group hover:border-primary/30 transition-colors">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/70"></div>
                    <div className="flex justify-between items-center pl-3">
                      <Label className="text-base font-bold text-foreground">
                        Risco
                      </Label>
                      <label
                        className={`flex items-center gap-2 text-xs font-bold cursor-pointer px-3 py-1.5 rounded-xl border transition-colors ${formData.pagoRisco ? "bg-primary/10 text-primary border-primary/30 shadow-sm" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"}`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.pagoRisco}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pagoRisco: e.target.checked,
                            })
                          }
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                        PAGO
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Profissional
                        </Label>
                        <Input
                          placeholder="Nome"
                          value={formData.nomeRiscador}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nomeRiscador: e.target.value,
                            })
                          }
                          className="h-11 text-sm rounded-xl bg-gray-50 border-gray-200 shadow-sm focus-visible:ring-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Valor Total (R$)
                        </Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={formData.valorRisco}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              valorRisco: e.target.value,
                            })
                          }
                          className="h-11 text-sm rounded-xl bg-white border-border shadow-sm focus-visible:ring-1 font-bold text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="premium-card p-5 rounded-[24px] border-border/60 space-y-4 relative overflow-hidden group hover:border-primary/30 transition-colors">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/70"></div>
                    <div className="flex justify-between items-center pl-3">
                      <Label className="text-base font-bold text-foreground">
                        Corte
                      </Label>
                      <label
                        className={`flex items-center gap-2 text-xs font-bold cursor-pointer px-3 py-1.5 rounded-xl border transition-colors ${formData.pagoCorte ? "bg-primary/10 text-primary border-primary/30 shadow-sm" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"}`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.pagoCorte}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pagoCorte: e.target.checked,
                            })
                          }
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                        PAGO
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Profissional
                        </Label>
                        <Input
                          placeholder="Nome"
                          value={formData.nomeCortador}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nomeCortador: e.target.value,
                            })
                          }
                          className="h-11 text-sm rounded-xl bg-gray-50 border-gray-200 shadow-sm focus-visible:ring-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Valor Total (R$)
                        </Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={formData.valorCorte}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              valorCorte: e.target.value,
                            })
                          }
                          className="h-11 text-sm rounded-xl bg-white border-border shadow-sm focus-visible:ring-1 font-bold text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="premium-card p-5 rounded-[24px] border-border/60 space-y-4 relative overflow-hidden group hover:border-primary/30 transition-colors">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                    <div className="flex justify-between items-center pl-3">
                      <Label className="text-base font-bold text-foreground">
                        Costura
                      </Label>
                      <label
                        className={`flex items-center gap-2 text-xs font-bold cursor-pointer px-3 py-1.5 rounded-xl border transition-colors ${formData.pagoCostura ? "bg-primary/10 text-primary border-primary/30 shadow-sm" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"}`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.pagoCostura}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pagoCostura: e.target.checked,
                            })
                          }
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                        PAGO TOTAL
                      </label>
                    </div>{" "}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3">
                      {" "}
                      <div className="space-y-1.5 sm:col-span-2">
                        {" "}
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Valor Unitário Pago à Costureira
                        </Label>{" "}
                        <div className="flex items-center">
                          {" "}
                          <span className="bg-gray-50 border border-r-0 border-gray-200 h-11 px-4 rounded-l-xl flex items-center text-gray-500 font-bold">
                            R$
                          </span>{" "}
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={formData.valorCostura}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                valorCostura: e.target.value,
                              })
                            }
                            className="h-11 text-sm rounded-r-xl rounded-l-none bg-white border-teal-200 shadow-sm focus-visible:ring-1 font-bold text-teal-800 flex-1"
                          />{" "}
                        </div>{" "}
                        <p className="text-[11px] text-gray-400 mt-1">
                          * {formData.quantidadeTotal || 0} peças = R${" "}
                          {(
                            (parseFloat(formData.valorCostura) || 0) *
                            (parseFloat(formData.quantidadeTotal) || 0)
                          ).toFixed(2)}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-6 pt-4 border-t border-gray-100">
                {" "}
                <h3 className="font-bold text-gray-800 flex items-center pl-2 text-sm uppercase tracking-widest">
                  <DollarSign size={20} className="mr-2 text-gray-400" />{" "}
                  Insumos e Extras
                </h3>{" "}
                <div className="premium-card p-5 sm:p-6 rounded-[32px] border-gray-100 -[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                  {" "}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {" "}
                    <div className="space-y-1.5 p-4 bg-gray-50/80 rounded-2xl border border-gray-100/50">
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                          Insumos (Total em R$)
                        </Label>
                        <label
                          className={`flex items-center gap-1.5 text-[11px] font-bold cursor-pointer px-2.5 py-1 rounded-xl border transition-colors ${
                            formData.pagoInsumos
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-white text-muted-foreground border-border/60 hover:bg-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.pagoInsumos}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pagoInsumos: e.target.checked,
                              })
                            }
                            className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          />
                          PAGO
                        </label>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formData.valorInsumos}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            valorInsumos: e.target.value,
                          })
                        }
                        className="rounded-xl bg-white border-gray-200 h-11 text-sm focus-visible:ring-1"
                      />
                    </div>
                    <div className="space-y-1.5 p-4 bg-gray-50/80 rounded-2xl border border-gray-100/50">
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                          Outros Gastos (R$)
                        </Label>
                        <label
                          className={`flex items-center gap-1.5 text-[11px] font-bold cursor-pointer px-2.5 py-1 rounded-xl border transition-colors ${
                            formData.pagoOutros
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-white text-muted-foreground border-border/60 hover:bg-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.pagoOutros}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pagoOutros: e.target.checked,
                              })
                            }
                            className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          />
                          PAGO
                        </label>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formData.outrosGastos}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            outrosGastos: e.target.value,
                          })
                        }
                        className="rounded-xl bg-white border-gray-200 h-11 text-sm focus-visible:ring-1"
                      />
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-6 pt-4">
                {" "}
                <div className="space-y-2.5">
                  {" "}
                  <Label className="text-[#1F2937] font-semibold text-sm pl-2">
                    Anexos / Nota PDF / Risco
                  </Label>{" "}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-[24px] border border-gray-200 border-dashed">
                    {" "}
                    <Button
                      variant="outline"
                      className="relative cursor-pointer rounded-xl bg-white h-11 shrink-0 px-5 shadow-sm font-semibold text-gray-700 hover:text-blue-600 hover:border-blue-200"
                      disabled={uploadingFile}
                    >
                      {" "}
                      {uploadingFile ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <Paperclip className="mr-2 text-gray-400" size={16} />
                      )}{" "}
                      {uploadingFile ? "Enviando..." : "Selecionar Arquivo"}{" "}
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,image/*"
                      />{" "}
                    </Button>{" "}
                    {formData.anexoUrl ? (
                      <div className="premium-card flex-1 w-full min-w-0 flex items-center justify-between text-sm p-2.5 border-gray-100">
                        {" "}
                        <span className="truncate flex-1 font-medium text-blue-600 px-2">
                          {formData.anexoNome || "Arquivo Anexado"}
                        </span>{" "}
                        <div className="flex items-center gap-1">
                          {" "}
                          <a
                            href={formData.anexoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-blue-700 font-semibold px-3 py-1 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Abrir
                          </a>{" "}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                anexoUrl: "",
                                anexoNome: "",
                              }))
                            }
                            className="w-8 h-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>{" "}
                        </div>{" "}
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        Nenhum arquivo enviado
                      </span>
                    )}{" "}
                  </div>{" "}
                </div>{" "}
                <div className="space-y-2.5 pb-8">
                  {" "}
                  <Label className="text-foreground font-bold text-sm pl-2">
                    Observações Gerais
                  </Label>{" "}
                  <textarea
                    placeholder="Detalhes adicionais, restrições, observações especiais de qualidade..."
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    className="w-full rounded-[2rem] border-border/50 bg-white/50 backdrop-blur-sm shadow-sm resize-none p-6 text-sm focus:ring-4 focus:ring-primary/10 hover:border-primary/30 outline-none transition-all min-h-[120px]"
                  />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <DialogFooter className="px-8 py-5 border-t border-border/50 bg-white/60 sticky bottom-0 z-10 backdrop-blur-xl">
            {" "}
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-2xl h-12 font-bold px-6 border-border/50 text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>{" "}
            <Button
              onClick={handleSave}
              className="premium-btn-primary bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 font-bold px-8 shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Salvar Produção
            </Button>{" "}
          </DialogFooter>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      <Dialog open={isRecebimentoOpen} onOpenChange={setIsRecebimentoOpen}>
        {" "}
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 glass-card border border-border/50 shadow-2xl bg-white/90">
          {" "}
          <DialogHeader>
            {" "}
            <DialogTitle className="text-2xl font-black text-foreground">
              Registrar Entrega
            </DialogTitle>{" "}
          </DialogHeader>{" "}
          <div className="grid gap-4 py-4">
            {" "}
            <div className="space-y-2">
              {" "}
              <Label>Data de Recebimento *</Label>{" "}
              <Input
                type="date"
                value={recebimentoData.data}
                onChange={(e) =>
                  setRecebimentoData({
                    ...recebimentoData,
                    data: e.target.value,
                  })
                }
                className="rounded-xl"
              />{" "}
            </div>{" "}
            {(() => {
              const currentProd = producoes.find(
                (p) => p.id === recebimentoData.producaoId,
              );
              let p_variants = currentProd?.quantidadePorTamanho
                ? Object.keys(currentProd.quantidadePorTamanho)
                : [];
              if (p_variants.length === 0) {
                const baseProduct = produtos.find(
                  (p) => p.id === currentProd?.produtoId,
                );
                if (baseProduct) {
                  const grades = baseProduct.gradeTamanho || [];
                  const cores = baseProduct.cores || [];
                  const variants: string[] = [];
                  if (grades.length > 0 && cores.length > 0) {
                    grades.forEach((g: string) => {
                      cores.forEach((c: string) => {
                        variants.push(`${g} - ${c}`);
                      });
                    });
                  } else if (grades.length > 0) {
                    variants.push(...grades);
                  } else if (cores.length > 0) {
                    variants.push(...cores);
                  }
                  p_variants = variants;
                }
              }
              return (
                <>
                  {" "}
                  <div className="space-y-2">
                    {" "}
                    <Label>Quantidade Recebida (Total Peças Boas) *</Label>{" "}
                    <Input
                      type="number"
                      value={recebimentoData.quantidade}
                      onChange={(e) =>
                        setRecebimentoData({
                          ...recebimentoData,
                          quantidade: e.target.value,
                        })
                      }
                      placeholder="0"
                      className="rounded-xl font-bold"
                    />{" "}
                  </div>{" "}
                  {p_variants.length > 0 && (
                    <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-border">
                      {" "}
                      <div className="flex items-center justify-between mb-2">
                        {" "}
                        <Label className="font-bold text-sm">
                          Entrada por Grade / Cor (Opcional)
                        </Label>{" "}
                        <span className="text-[11px] text-gray-500 font-medium">
                          Soma automaticamente
                        </span>{" "}
                      </div>{" "}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {" "}
                        {p_variants.map((variant) => (
                          <div
                            key={variant}
                            className="premium-card flex flex-col gap-1.5 -/50 p-2"
                          >
                            {" "}
                            <Label className="text-[10px] font-black text-primary px-1">
                              {variant}
                            </Label>{" "}
                            <Input
                              type="number"
                              placeholder="0"
                              className="premium-input w-16 h-8 text-center rounded-lg font-bold shadow-sm px-1 text-sm border-primary/20"
                              value={
                                recebimentoData.quantidadePorTamanho?.[
                                  variant
                                ] || ""
                              }
                              onChange={(e) => {
                                const newGrade = {
                                  ...recebimentoData.quantidadePorTamanho,
                                  [variant]: e.target.value,
                                };
                                const totalGrade = Object.values(
                                  newGrade,
                                ).reduce(
                                  (acc, curr) =>
                                    acc + (parseInt(curr as string) || 0),
                                  0,
                                );
                                setRecebimentoData({
                                  ...recebimentoData,
                                  quantidadePorTamanho: newGrade,
                                  quantidade:
                                    totalGrade > 0 ? String(totalGrade) : "",
                                });
                              }}
                            />{" "}
                          </div>
                        ))}{" "}
                      </div>{" "}
                    </div>
                  )}{" "}
                </>
              );
            })()}{" "}
            <div className="space-y-2">
              {" "}
              <Label>Quantidade com Defeito</Label>{" "}
              <Input
                type="number"
                value={recebimentoData.quantidadeDefeito}
                onChange={(e) =>
                  setRecebimentoData({
                    ...recebimentoData,
                    quantidadeDefeito: e.target.value,
                  })
                }
                placeholder="0"
                className="rounded-xl"
              />{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>Observação do Recebimento</Label>{" "}
              <Input
                placeholder="Faltou acabamento, botão, etc..."
                value={recebimentoData.observacao}
                onChange={(e) =>
                  setRecebimentoData({
                    ...recebimentoData,
                    observacao: e.target.value,
                  })
                }
                className="rounded-xl"
              />{" "}
            </div>{" "}
          </div>{" "}
          <DialogFooter className="pt-4">
            {" "}
            <Button
              variant="outline"
              onClick={() => setIsRecebimentoOpen(false)}
              className="rounded-2xl h-12 font-bold"
            >
              Cancelar
            </Button>{" "}
            <Button
              onClick={handleSaveRecebimento}
              className="premium-btn-primary bg-green-600 hover:bg-green-700 text-white rounded-2xl h-12 font-bold px-6 shadow-lg shadow-green-500/20"
            >
              Confirmar Entrega
            </Button>{" "}
          </DialogFooter>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        {" "}
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 glass-card border border-red-100 shadow-2xl text-center bg-white/95">
          {" "}
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
            {" "}
            <Trash2 size={32} className="text-red-600" strokeWidth={1.5} />{" "}
          </div>{" "}
          <DialogTitle className="text-2xl font-black mb-2 text-foreground">
            Excluir Produção?
          </DialogTitle>{" "}
          <p className="text-muted-foreground text-sm mb-8 font-medium">
            Esta ação não poderá ser desfeita. Deseja realmente remover
            permanentemente este registro?
          </p>{" "}
          <DialogFooter className="flex gap-3 sm:justify-center w-full">
            {" "}
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-2xl flex-1 h-12 font-bold border-border/50"
            >
              Cancelar
            </Button>{" "}
            <Button
              onClick={confirmDelete}
              className="premium-btn-primary bg-red-600 hover:bg-red-700 text-white rounded-2xl flex-1 h-12 font-bold shadow-lg shadow-red-500/20"
            >
              Sim, Excluir
            </Button>{" "}
          </DialogFooter>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      <Dialog
        open={!!deleteRecebimentoConfirm}
        onOpenChange={() => setDeleteRecebimentoConfirm(null)}
      >
        {" "}
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 glass-card border border-red-100 shadow-2xl text-center bg-white/95">
          {" "}
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
            {" "}
            <Trash2 size={32} className="text-red-600" strokeWidth={1.5} />{" "}
          </div>{" "}
          <DialogTitle className="text-2xl font-black mb-2 text-foreground">
            Excluir Entrega?
          </DialogTitle>{" "}
          <p className="text-muted-foreground text-sm mb-8 font-medium">
            Esta ação não poderá ser desfeita. Deseja remover este registro de
            entrega e recalcular os totais?
          </p>{" "}
          <DialogFooter className="flex gap-3 sm:justify-center w-full">
            {" "}
            <Button
              variant="outline"
              onClick={() => setDeleteRecebimentoConfirm(null)}
              className="rounded-2xl flex-1 h-12 font-bold border-border/50"
            >
              Cancelar
            </Button>{" "}
            <Button
              onClick={handleDeleteRecebimento}
              className="premium-btn-primary bg-red-600 hover:bg-red-700 text-white rounded-2xl flex-1 h-12 font-bold shadow-lg shadow-red-500/20"
            >
              Sim, Excluir
            </Button>{" "}
          </DialogFooter>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      <Dialog
        open={!!deletePagamentoConfirm}
        onOpenChange={() => setDeletePagamentoConfirm(null)}
      >
        {" "}
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 glass-card border border-red-100 shadow-2xl text-center bg-white/95">
          {" "}
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
            {" "}
            <Trash2 size={32} className="text-red-600" strokeWidth={1.5} />{" "}
          </div>{" "}
          <DialogTitle className="text-2xl font-black mb-2 text-foreground">
            Excluir Pagamento?
          </DialogTitle>{" "}
          <p className="text-muted-foreground text-sm mb-8 font-medium">
            Esta ação não poderá ser desfeita. Deseja remover este registro de
            pagamento?
          </p>{" "}
          <DialogFooter className="flex gap-3 sm:justify-center w-full">
            {" "}
            <Button
              variant="outline"
              onClick={() => setDeletePagamentoConfirm(null)}
              className="rounded-2xl flex-1 h-12 font-bold border-border/50"
            >
              Cancelar
            </Button>{" "}
            <Button
              onClick={handleDeletePagamento}
              className="premium-btn-primary bg-red-600 hover:bg-red-700 text-white rounded-2xl flex-1 h-12 font-bold shadow-lg shadow-red-500/20"
            >
              Sim, Excluir
            </Button>{" "}
          </DialogFooter>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      <Dialog open={isPagamentoOpen} onOpenChange={setIsPagamentoOpen}>
        {" "}
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 glass-card border border-border/50 shadow-2xl bg-white/90">
          {" "}
          <DialogHeader>
            {" "}
            <DialogTitle className="text-2xl font-black flex items-center text-foreground">
              {" "}
              <Wallet
                className="mr-3 text-green-600"
                size={28}
                strokeWidth={2.5}
              />{" "}
              Lançar Pagamento{" "}
            </DialogTitle>{" "}
          </DialogHeader>{" "}
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="bg-green-50/70 p-4 rounded-2xl border border-green-100">
              <p className="text-sm text-green-900 font-medium">
                Registre o pagamento de custo desta produção. Os valores serão automaticamente sincronizados com o Financeiro e com o saldo do lote.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Favorecido *
                </Label>
                <Input
                  placeholder="Nome da costureira ou fornecedor"
                  value={pagamentoData.favorecido}
                  onChange={(e) =>
                    setPagamentoData({ ...pagamentoData, favorecido: e.target.value })
                  }
                  className="rounded-xl bg-white h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Categoria Financeira
                </Label>
                <Select
                  value={pagamentoData.categoria}
                  onValueChange={(v) =>
                    setPagamentoData({ ...pagamentoData, categoria: v })
                  }
                >
                  <SelectTrigger className="rounded-xl bg-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Costura">Costura / Facção</SelectItem>
                    <SelectItem value="Corte">Corte</SelectItem>
                    <SelectItem value="Tecido">Tecido</SelectItem>
                    <SelectItem value="Aviamentos">Aviamentos / Insumos</SelectItem>
                    <SelectItem value="Modelagem">Modelagem / Risco</SelectItem>
                    <SelectItem value="Outros">Outros Custos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Descrição do Pagamento
              </Label>
              <Input
                placeholder="Ex: Pagamento lote L4589 - Vestido"
                value={pagamentoData.descricao}
                onChange={(e) =>
                  setPagamentoData({ ...pagamentoData, descricao: e.target.value })
                }
                className="rounded-xl bg-white h-11"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Valor do Pagamento (R$) *
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={pagamentoData.valor}
                  onChange={(e) =>
                    setPagamentoData({ ...pagamentoData, valor: e.target.value })
                  }
                  className="rounded-xl bg-white border-green-200 text-lg font-bold text-green-700 h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Forma de Pagamento
                </Label>
                <Select
                  value={pagamentoData.formaPagamento}
                  onValueChange={(v) =>
                    setPagamentoData({ ...pagamentoData, formaPagamento: v })
                  }
                >
                  <SelectTrigger className="rounded-xl bg-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Data do Pagamento *
              </Label>
              <Input
                type="date"
                value={pagamentoData.data}
                onChange={(e) =>
                  setPagamentoData({ ...pagamentoData, data: e.target.value })
                }
                className="rounded-xl bg-white h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Observação (Opcional)
              </Label>
              <Input
                placeholder="Observações complementares..."
                value={pagamentoData.observacao}
                onChange={(e) =>
                  setPagamentoData({
                    ...pagamentoData,
                    observacao: e.target.value,
                  })
                }
                className="rounded-xl bg-white h-11"
              />
            </div>
          </div>{" "}
          <DialogFooter className="pt-4">
            {" "}
            <Button
              variant="outline"
              onClick={() => setIsPagamentoOpen(false)}
              className="rounded-2xl h-12 font-bold border-border/50"
            >
              Cancelar
            </Button>{" "}
            <Button
              onClick={handleSavePagamento}
              className="premium-btn-primary bg-green-600 hover:bg-green-700 text-white rounded-2xl h-12 font-bold px-8 shadow-lg shadow-green-500/20"
            >
              Confirmar Pagamento
            </Button>{" "}
          </DialogFooter>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      {/* Modal Lightbox Foto do Produto em Tamanho Real */}
      <Dialog
        open={!!selectedPhotoModal}
        onOpenChange={(open) => !open && setSelectedPhotoModal(null)}
      >
        <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] p-0 rounded-[28px] overflow-hidden flex flex-col bg-card/95 backdrop-blur-xl border border-border/60 shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card sticky top-0 z-10">
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-primary" />
                Foto do Produto — Tamanho Real
              </DialogTitle>
              {selectedPhotoModal && (
                <p className="text-xs text-muted-foreground font-medium">
                  <strong className="text-foreground">
                    {selectedPhotoModal.nome}
                  </strong>
                  <span className="mx-1.5">•</span>
                  Lote:{" "}
                  <span className="font-bold text-primary">
                    {selectedPhotoModal.lote}
                  </span>
                  {selectedPhotoModal.sku && (
                    <>
                      <span className="mx-1.5">•</span>
                      SKU:{" "}
                      <span className="font-semibold">
                        {selectedPhotoModal.sku}
                      </span>
                    </>
                  )}
                  {selectedPhotoModal.costureira && (
                    <>
                      <span className="mx-1.5">•</span>
                      Costureira: <span>{selectedPhotoModal.costureira}</span>
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-accent/40 rounded-xl p-1 border border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPhotoZoom((z) =>
                      Math.max(0.4, Number((z - 0.25).toFixed(2))),
                    )
                  }
                  className="h-8 w-8 p-0 rounded-lg text-foreground hover:text-primary"
                  title="Reduzir Zoom"
                >
                  <ZoomOut size={16} />
                </Button>
                <span className="text-xs font-bold px-2 min-w-[50px] text-center text-foreground">
                  {Math.round(photoZoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPhotoZoom((z) =>
                      Math.min(4, Number((z + 0.25).toFixed(2))),
                    )
                  }
                  className="h-8 w-8 p-0 rounded-lg text-foreground hover:text-primary"
                  title="Aumentar Zoom"
                >
                  <ZoomIn size={16} />
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPhotoZoom(1)}
                className="h-9 rounded-xl text-xs font-bold border-border/50 hover:bg-accent"
              >
                100% (Real)
              </Button>

              {selectedPhotoModal && (
                <a
                  href={selectedPhotoModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`foto_${selectedPhotoModal.lote || "produto"}.jpg`}
                  className="inline-flex items-center justify-center h-9 px-3 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors gap-1.5"
                >
                  <Download size={14} /> Imagem Original
                </a>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center min-h-[350px] max-h-[calc(90vh-130px)] bg-slate-950/5 dark:bg-black/30">
            {selectedPhotoModal && (
              <div
                className="transition-transform duration-200 ease-out origin-center flex items-center justify-center p-2"
                style={{
                  transform: `scale(${photoZoom})`,
                  transformOrigin: "center center",
                }}
              >
                <img
                  src={selectedPhotoModal.url}
                  alt={selectedPhotoModal.nome}
                  className="rounded-2xl shadow-xl border border-border/40 select-none pointer-events-auto"
                  style={{
                    maxWidth: photoZoom > 1 ? "none" : "100%",
                    maxHeight: photoZoom > 1 ? "none" : "68vh",
                    objectFit: "contain",
                  }}
                />
              </div>
            )}
          </div>

          <div className="px-6 py-2.5 border-t border-border/50 bg-card/90 flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>
              Exibindo fotografia em alta resolução para conferência da costura e acabamentos.
            </span>
            <span className="font-semibold text-primary">Confecção Pro</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
