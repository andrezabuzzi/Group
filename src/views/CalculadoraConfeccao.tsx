import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";

import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { cn } from "../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Save,
  History,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Scissors,
  Ruler,
  Package,
  DollarSign,
  PieChart as PieChartIcon,
  Printer,
  FileText,
  Download,
  Shirt,
  Activity,
  Image as ImageIcon,
} from "lucide-react";

export default function CalculadoraConfeccao() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAIConfirm, setShowAIConfirm] = useState(false);
  const [aiData, setAiData] = useState({ length: "", width: "", pieces: "" });
  const [step, setStep] = useState(1);
  const [fillMode, setFillMode] = useState<"initial" | "manual">("initial");
  const [markerLength, setMarkerLength] = useState(""); // cm
  const [markerWidth, setMarkerWidth] = useState(""); // cm
  const [piecesPerMarker, setPiecesPerMarker] = useState("");

  const [gradeType, setGradeType] = useState("tamanho_unico");
  const [customGrades, setCustomGrades] = useState([
    { size: "P", percentage: "25" },
    { size: "M", percentage: "50" },
    { size: "G", percentage: "25" },
  ]);

  const [purchaseMode, setPurchaseMode] = useState<"metro" | "quilo">("metro");
  const [totalMetersPurchased, setTotalMetersPurchased] = useState("");
  const [pricePerMeter, setPricePerMeter] = useState("");

  const [totalKgPurchased, setTotalKgPurchased] = useState("");
  const [yieldMetersPerKg, setYieldMetersPerKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");

  const [sewingCostPerPiece, setSewingCostPerPiece] = useState("");
  const [cuttingMode, setCuttingMode] = useState<"por_peca" | "por_lote">(
    "por_lote",
  );
  const [cuttingCostPerPiece, setCuttingCostPerPiece] = useState("");
  const [cuttingCostTotal, setCuttingCostTotal] = useState("");
  const [trimsTotalCost, setTrimsTotalCost] = useState("");
  const [transportTotalCost, setTransportTotalCost] = useState("");
  const [patternMakingCost, setPatternMakingCost] = useState("");
  const [markerCost, setMarkerCost] = useState("");
  const [packagingMode, setPackagingMode] = useState<"por_peca" | "por_lote">(
    "por_peca",
  );
  const [packagingCostPerPiece, setPackagingCostPerPiece] = useState("");
  const [packagingCostTotal, setPackagingCostTotal] = useState("");
  const [otherCosts, setOtherCosts] = useState("");

  const [costNotes, setCostNotes] = useState("");
  const [pieceName, setPieceName] = useState("");
  const [lotId, setLotId] = useState(
    `LOTE-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(4, "0")}`,
  );
  const [productionDate, setProductionDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [cutterName, setCutterName] = useState("");
  const [seamstressName, setSeamstressName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [fabricType, setFabricType] = useState("");
  const [fabricColor, setFabricColor] = useState("");

  const [history, setHistory] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"wizard" | "historico">("wizard");

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setHistory([]);
        return;
      }
      const q = query(
        collection(db, "prod_garment_calculations"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );
      const unsubSnap = onSnapshot(
        q,
        (snap) => {
          setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => {
          console.error("Historical fetch error: ", error);
          if (error.code === "failed-precondition") {
            toast.error(
              "Configurando banco de dados... Tente novamente em 2 minutos.",
            );
          }
        },
      );
      return () => unsubSnap();
    });
    return () => unsubAuth();
  }, []);

  const parseNum = (val: string) =>
    Number(val.toString().replace(",", ".")) || 0;
  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  const formatNum = (val: number, dims = 0) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: dims,
      maximumFractionDigits: dims,
    }).format(val);

  const results = useMemo(() => {
    // 1. Risco
    const mLength = parseNum(markerLength) / 100; // in meters
    const mWidth = parseNum(markerWidth) / 100; // in meters
    const mPieces = parseNum(piecesPerMarker);

    const markerArea = mLength * mWidth;
    const areaPerPiece = mPieces > 0 ? markerArea / mPieces : 0;
    const consumptionPerPieceMeters = mWidth > 0 ? areaPerPiece / mWidth : 0; // Area / Largura = Comprimento linear

    // 2. Compra
    let totalMeters = 0;
    let totalFabricValue = 0;
    if (purchaseMode === "metro") {
      totalMeters = parseNum(totalMetersPurchased);
      totalFabricValue = totalMeters * parseNum(pricePerMeter);
    } else {
      const kgs = parseNum(totalKgPurchased);
      totalMeters = kgs * parseNum(yieldMetersPerKg);
      totalFabricValue = kgs * parseNum(pricePerKg);
    }

    const estimatedMaxProduction =
      consumptionPerPieceMeters > 0
        ? Math.floor(totalMeters / consumptionPerPieceMeters)
        : 0;
    const fabricCostPerPiece =
      estimatedMaxProduction > 0
        ? totalFabricValue / estimatedMaxProduction
        : 0;

    // 3. Custos Diretos e Indiretos
    const cutCostPiece =
      cuttingMode === "por_peca" ? parseNum(cuttingCostPerPiece) : 0;
    const cutCostTotal =
      cuttingMode === "por_lote" ? parseNum(cuttingCostTotal) : 0;

    const packCostPiece =
      packagingMode === "por_peca" ? parseNum(packagingCostPerPiece) : 0;
    const packCostTotal =
      packagingMode === "por_lote" ? parseNum(packagingCostTotal) : 0;

    const sewCostPiece = parseNum(sewingCostPerPiece);

    const indirectCostsTotal =
      parseNum(trimsTotalCost) +
      parseNum(transportTotalCost) +
      parseNum(patternMakingCost) +
      parseNum(markerCost) +
      cutCostTotal +
      packCostTotal +
      parseNum(otherCosts);

    const indirectCostPerPiece =
      estimatedMaxProduction > 0
        ? indirectCostsTotal / estimatedMaxProduction
        : 0;
    const directCostPerPiece = sewCostPiece + cutCostPiece + packCostPiece;

    const totalUnitCost =
      fabricCostPerPiece + directCostPerPiece + indirectCostPerPiece;
    const totalLotCost =
      totalFabricValue +
      indirectCostsTotal +
      directCostPerPiece * estimatedMaxProduction;

    const usedMeters = estimatedMaxProduction * consumptionPerPieceMeters;
    const estimatedFabricLeftover = totalMeters - usedMeters;

    // Grades
    let grades: any[] = [];
    if (gradeType !== "tamanho_unico" && estimatedMaxProduction > 0) {
      let schema: any[] = [];
      if (gradeType === "infantil")
        schema = [
          { s: "2 anos", p: 15 },
          { s: "4 anos", p: 20 },
          { s: "6 anos", p: 25 },
          { s: "8 anos", p: 20 },
          { s: "10 anos", p: 10 },
          { s: "12 anos", p: 10 },
        ];
      if (gradeType === "adulto")
        schema = [
          { s: "P", p: 20 },
          { s: "M", p: 35 },
          { s: "G", p: 30 },
          { s: "GG", p: 15 },
        ];
      if (gradeType === "plus_size")
        schema = [
          { s: "G1", p: 30 },
          { s: "G2", p: 30 },
          { s: "G3", p: 25 },
          { s: "G4", p: 15 },
        ];
      if (gradeType === "personalizada")
        schema = customGrades.map((g) => ({
          s: g.size,
          p: parseNum(g.percentage),
        }));

      grades = schema.map((g) => ({
        size: g.s,
        percentage: g.p,
        quantity: Math.floor(estimatedMaxProduction * (g.p / 100)),
      }));
    }

    return {
      consumptionPerPieceMeters,
      estimatedMaxProduction,
      fabricCostPerPiece,
      indirectCostPerPiece,
      totalUnitCost,
      totalLotCost,
      estimatedFabricLeftover,
      totalMeters,
      totalFabricValue,
      grades,
      indirectCostsTotal,
      directCostPerPiece,
      sewCostPiece,
    };
  }, [
    markerLength,
    markerWidth,
    piecesPerMarker,
    gradeType,
    customGrades,
    purchaseMode,
    totalMetersPurchased,
    pricePerMeter,
    totalKgPurchased,
    yieldMetersPerKg,
    pricePerKg,
    sewingCostPerPiece,
    cuttingMode,
    cuttingCostPerPiece,
    cuttingCostTotal,
    trimsTotalCost,
    transportTotalCost,
    patternMakingCost,
    markerCost,
    packagingMode,
    packagingCostPerPiece,
    packagingCostTotal,
    otherCosts,
  ]);

  const handleNovoCalculo = () => {
    setStep(1);
    setViewMode("wizard");
    setFillMode("initial");
    setPieceName("");
    setMarkerLength("");
    setMarkerWidth("");
    setPiecesPerMarker("");
    setGradeType("tamanho_unico");
    setTotalMetersPurchased("");
    setTotalKgPurchased("");
    setYieldMetersPerKg("");
    setPricePerMeter("");
    setPricePerKg("");
    setSewingCostPerPiece("");
    setCuttingCostPerPiece("");
    setCuttingCostTotal("");
    setTrimsTotalCost("");
    setTransportTotalCost("");
    setPatternMakingCost("");
    setMarkerCost("");
    setPackagingCostPerPiece("");
    setPackagingCostTotal("");
    setOtherCosts("");
    setCostNotes("");
    setLotId(`LOTE-${Math.floor(1000 + Math.random() * 9000)}`);
    setFabricType("");
    setFabricColor("");
    setSupplierName("");
    setSeamstressName("");
    setCutterName("");
  };

  const validateGrade = () => {
    if (gradeType === "personalizada") {
      const sum = customGrades.reduce((a, b) => a + parseNum(b.percentage), 0);
      return sum === 100;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateGrade()) {
      return toast.error("A soma da grade deve ser 100%");
    }
    if (step === 2) {
      if (
        purchaseMode === "quilo" &&
        (!totalKgPurchased || !yieldMetersPerKg)
      ) {
        return toast.error("Preencha o rendimento por kg para calcular.");
      }
      if (purchaseMode === "metro" && !totalMetersPurchased) {
        return toast.error("Preencha a quantidade de metros.");
      }
    }
    setStep((s) => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return toast.error("Usuário não autenticado");

    try {
      await addDoc(collection(db, "prod_garment_calculations"), {
        userId: user.uid,
        pieceName,
        lotId,
        productionDate: new Date(productionDate).toISOString(),
        cutterName,
        seamstressName,
        supplierName,
        fabricType,
        fabricColor,

        markerLengthCm: parseNum(markerLength),
        markerWidthCm: parseNum(markerWidth),
        piecesPerMarker: parseNum(piecesPerMarker),
        sizeGradeType: gradeType,
        sizeDistribution: results.grades,

        purchaseMode,
        totalMetersPurchased:
          purchaseMode === "metro" ? parseNum(totalMetersPurchased) : null,
        pricePerMeter:
          purchaseMode === "metro" ? parseNum(pricePerMeter) : null,
        totalKgPurchased:
          purchaseMode === "quilo" ? parseNum(totalKgPurchased) : null,
        yieldMetersPerKg:
          purchaseMode === "quilo" ? parseNum(yieldMetersPerKg) : null,
        pricePerKg: purchaseMode === "quilo" ? parseNum(pricePerKg) : null,

        convertedTotalMeters: results.totalMeters,
        totalFabricValue: results.totalFabricValue,

        sewingCostPerPiece: parseNum(sewingCostPerPiece),
        cuttingMode,
        cuttingCostPerPiece:
          cuttingMode === "por_peca" ? parseNum(cuttingCostPerPiece) : null,
        cuttingCostTotal:
          cuttingMode === "por_lote" ? parseNum(cuttingCostTotal) : null,
        trimsTotalCost: parseNum(trimsTotalCost),
        transportTotalCost: parseNum(transportTotalCost),
        patternMakingCost: parseNum(patternMakingCost),
        markerCost: parseNum(markerCost),
        packagingMode,
        packagingCostPerPiece:
          packagingMode === "por_peca" ? parseNum(packagingCostPerPiece) : null,
        packagingCostTotal:
          packagingMode === "por_lote" ? parseNum(packagingCostTotal) : null,
        otherCosts: parseNum(otherCosts),
        costNotes,

        consumptionPerPieceMeters: results.consumptionPerPieceMeters,
        estimatedMaxProduction: results.estimatedMaxProduction,
        fabricCostPerPiece: results.fabricCostPerPiece,
        indirectCostPerPiece: results.indirectCostPerPiece,
        totalUnitCost: results.totalUnitCost,
        totalLotCost: results.totalLotCost,
        estimatedFabricLeftover: results.estimatedFabricLeftover,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Cálculo salvo com sucesso!");
      setViewMode("historico");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Data = reader.result as string;

      toast.promise(
        fetch("/api/analyze-marker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Data }),
        }).then(async (res) => {
          if (!res.ok) throw new Error("Failed to analyze image");
          const data = await res.json();
          setAiData({
            length: data.length || "",
            width: data.width || "",
            pieces: data.pieces || "",
          });
          setShowAIConfirm(true);
          return "Análise concluída. Por favor, verifique os dados.";
        }),
        {
          loading: "A IA está analisando a imagem do risco...",
          success: (msg) => msg,
          error: (err) => `Erro: ${err.message}`,
        },
      );
    };

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const confirmAIData = () => {
    setMarkerLength(aiData.length);
    setMarkerWidth(aiData.width);
    setPiecesPerMarker(aiData.pieces);
    setShowAIConfirm(false);
    setFillMode("manual");
    toast.success("Dados confirmados com sucesso!");
  };

  const handleSimulateAI = () => {
    fileInputRef.current?.click();
  };

  const generatePDF = async () => {
    if (!printRef.current) return;
    try {
      toast.info("Gerando PDF, aguarde...");
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ficha-producao-${pieceName || "sem-nome"}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar PDF.");
    }
  };

  const steps = [
    { id: 1, name: "Risco e Encaixe", icon: Ruler },
    { id: 2, name: "Material", icon: Shirt },
    { id: 3, name: "Custos", icon: DollarSign },
    { id: 4, name: "Resultado", icon: PieChartIcon },
    { id: 5, name: "Impressão", icon: Printer },
  ];

  const chartData = [
    { name: "Tecido", value: results.fabricCostPerPiece },
    { name: "Serviços", value: results.directCostPerPiece },
    { name: "Indiretos", value: results.indirectCostPerPiece },
  ].filter((d) => d.value > 0);
  const COLORS = ['#6D4AFF', '#9B8CFF', '#D8B4E2', '#A5ADBD', '#6B7280'];

  if (viewMode === "historico") {
    return (
      <div className="w-full max-w-none mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Histórico de Produção
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize as fichas técnicas salvas anteriormente.
            </p>
          </div>
          <Button
            onClick={() => setViewMode("wizard")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 rounded-xl font-bold"
          >
            Nova Simulação
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground premium-card/50">
              Nenhum histórico encontrado.
            </div>
          )}
          {history.map((h, i) => (
            <Card
              key={i}
              className="rounded-[24px] border border-border/50 shadow-sm bg-card/60 backdrop-blur-xl hover:shadow-md transition-all"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">
                      {h.pieceName || "Produto Sem Nome"}
                    </h3>
                    <p className="text-xs text-muted-foreground">{h.lotId}</p>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                    {formatNum(h.estimatedMaxProduction)} pçs
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Custo Un.</span>
                    <span className="font-bold">
                      {formatMoney(h.totalUnitCost)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Tecido</span>
                    <span className="font-bold">{h.fabricType}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-bold">
                      {new Date(h.productionDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB] dark:bg-[#0F1117] flex flex-col items-center">
      <div className="w-full max-w-none p-4 md:p-8 flex-1 flex flex-col animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight">
              Calculadora de Confecção
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
              Calcule automaticamente o rendimento, consumo e custo real da
              produção como um assistente inteligente.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleNovoCalculo}
              variant="outline"
              className="h-11 px-5 rounded-xl font-bold bg-white dark:bg-[#181B24] border-border/50 shadow-sm hover:bg-muted/50"
            >
              Novo Cálculo
            </Button>
            <Button
              onClick={() => setViewMode("historico")}
              variant="ghost"
              className="h-11 px-5 rounded-xl font-bold hover:bg-muted/50"
            >
              <History className="w-4 h-4 mr-2" /> Histórico
            </Button>
            {step === 5 && (
              <Button
                onClick={handleSave}
                className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              >
                <Save className="w-4 h-4 mr-2" /> Salvar
              </Button>
            )}
          </div>
        </div>

        {/* STEPPER HORIZONTAL */}
        <div className="w-full bg-card dark:bg-[#181B24] p-4 rounded-[24px] shadow-sm border border-border/50 mb-8 flex items-center justify-between overflow-x-auto hide-scrollbar">
          {steps.map((s, index) => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex items-center gap-3 shrink-0 px-2 md:px-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110"
                        : isCompleted
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold hidden md:block",
                      isActive
                        ? "text-foreground"
                        : isCompleted
                          ? "text-primary"
                          : "text-muted-foreground",
                    )}
                  >
                    {s.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 md:w-16 h-px mx-2 transition-colors duration-300",
                      isCompleted ? "bg-primary" : "bg-border/50",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Hidden file input for AI */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />

        {/* AI Confirmation Dialog */}
        <Dialog open={showAIConfirm} onOpenChange={setShowAIConfirm}>
          <DialogContent className="sm:max-w-md bg-card border-border/50 rounded-[24px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Confirmação da IA
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <p className="text-sm text-muted-foreground">
                A inteligência artificial extraiu as seguintes informações do
                seu risco. Por favor, verifique se estão corretas antes de
                prosseguir.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Comprimento do Risco (cm)
                  </Label>
                  <Input
                    value={aiData.length}
                    onChange={(e) =>
                      setAiData({ ...aiData, length: e.target.value })
                    }
                    className="h-12 rounded-[14px] bg-muted/50 border-border/50 font-black text-lg px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Largura do Risco (cm)
                  </Label>
                  <Input
                    value={aiData.width}
                    onChange={(e) =>
                      setAiData({ ...aiData, width: e.target.value })
                    }
                    className="h-12 rounded-[14px] bg-muted/50 border-border/50 font-black text-lg px-4"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Peças no Risco (Quantidade Inteira)
                  </Label>
                  <Input
                    value={aiData.pieces}
                    onChange={(e) =>
                      setAiData({ ...aiData, pieces: e.target.value })
                    }
                    className="h-12 rounded-[14px] bg-muted/50 border-border/50 font-black text-lg px-4"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowAIConfirm(false)}
                className="rounded-xl font-bold h-11"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmAIData}
                className="rounded-xl font-black h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Confirmar Dados
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col gap-8 items-center flex-1 w-full max-w-4xl mx-auto">
          {/* LEFT CONTENT */}
          <div className="flex-1 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-card dark:bg-[#181B24] rounded-[24px] shadow-sm border border-border/50 p-6 md:p-10"
              >
                {step === 1 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-foreground tracking-tight">
                        Risco e Encaixe
                      </h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Informe os dados do risco utilizado para o corte.
                      </p>
                    </div>

                    {fillMode === "initial" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div
                          onClick={handleSimulateAI}
                          className="cursor-pointer border-2 border-dashed border-primary/50 bg-primary/5 rounded-[24px] p-10 flex flex-col items-center justify-center text-center hover:bg-primary/10 transition-colors group"
                        >
                          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ImageIcon className="w-8 h-8 text-primary" />
                          </div>
                          <h3 className="text-lg font-black text-foreground">
                            Ler Risco IA
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            Faça upload da imagem do risco (ex: Audaces) para
                            preencher os dados automaticamente.
                          </p>
                        </div>

                        <div
                          onClick={() => setFillMode("manual")}
                          className="cursor-pointer border-2 border-border/50 bg-card rounded-[24px] p-10 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors group"
                        >
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Ruler className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-black text-foreground">
                            Preenchimento Manual
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            Insira manualmente as medidas, largura e quantidade
                            de peças do risco.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Comprimento (cm)
                            </Label>
                            <Input
                              type="number"
                              value={markerLength}
                              onChange={(e) => setMarkerLength(e.target.value)}
                              className="h-14 rounded-[18px] bg-muted/50 border-0 font-medium text-lg px-5 focus-visible:ring-primary/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Largura (cm)
                            </Label>
                            <Input
                              type="number"
                              value={markerWidth}
                              onChange={(e) => setMarkerWidth(e.target.value)}
                              className="h-14 rounded-[18px] bg-muted/50 border-0 font-medium text-lg px-5 focus-visible:ring-primary/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Peças no Risco
                            </Label>
                            <Input
                              type="number"
                              value={piecesPerMarker}
                              onChange={(e) =>
                                setPiecesPerMarker(e.target.value)
                              }
                              className="h-14 rounded-[18px] bg-muted/50 border-0 font-medium text-lg px-5 focus-visible:ring-primary/50"
                            />
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/50">
                          <Label className="text-sm font-bold text-foreground">
                            Tipo de Grade
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              "tamanho_unico",
                              "infantil",
                              "adulto",
                              "plus_size",
                              "personalizada",
                            ].map((gt) => (
                              <div
                                key={gt}
                                onClick={() => setGradeType(gt)}
                                className={cn(
                                  "cursor-pointer rounded-[18px] p-4 text-center transition-all duration-200 border-2 font-bold text-sm",
                                  gradeType === gt
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border/50 bg-card hover:bg-muted/50 text-muted-foreground",
                                )}
                              >
                                {gt.replace("_", " ").toUpperCase()}
                              </div>
                            ))}
                          </div>
                        </div>

                        {gradeType === "personalizada" && (
                          <div className="p-6 bg-muted/30 rounded-[20px] space-y-4 border border-border/50">
                            <div className="flex justify-between items-center">
                              <Label className="font-bold">
                                Distribuição da Grade (%)
                              </Label>
                              <span
                                className={cn(
                                  "text-xs font-black px-2 py-1 rounded-lg",
                                  validateGrade()
                                    ? "bg-success/10 text-success"
                                    : "bg-destructive/10 text-destructive",
                                )}
                              >
                                Total:{" "}
                                {customGrades.reduce(
                                  (a, b) => a + parseNum(b.percentage),
                                  0,
                                )}
                                %
                              </span>
                            </div>
                            {customGrades.map((g, i) => (
                              <div key={i} className="flex items-center gap-4">
                                <Input
                                  value={g.size}
                                  onChange={(e) => {
                                    const arr = [...customGrades];
                                    arr[i].size = e.target.value;
                                    setCustomGrades(arr);
                                  }}
                                  className="h-12 rounded-[14px] bg-card"
                                  placeholder="Tam"
                                />
                                <Input
                                  type="number"
                                  value={g.percentage}
                                  onChange={(e) => {
                                    const arr = [...customGrades];
                                    arr[i].percentage = e.target.value;
                                    setCustomGrades(arr);
                                  }}
                                  className="h-12 rounded-[14px] bg-card"
                                  placeholder="%"
                                />
                                <Button
                                  onClick={() =>
                                    setCustomGrades(
                                      customGrades.filter(
                                        (_, idx) => idx !== i,
                                      ),
                                    )
                                  }
                                  variant="ghost"
                                  className="text-destructive hover:bg-destructive/10 shrink-0"
                                >
                                  Remover
                                </Button>
                              </div>
                            ))}
                            <Button
                              onClick={() =>
                                setCustomGrades([
                                  ...customGrades,
                                  { size: "", percentage: "0" },
                                ])
                              }
                              variant="outline"
                              className="w-full border-dashed rounded-[14px] h-12"
                            >
                              Adicionar Tamanho
                            </Button>
                          </div>
                        )}

                        {/* Insight Card */}
                        {parseNum(markerLength) > 0 &&
                          parseNum(piecesPerMarker) > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-primary/5 border border-primary/20 rounded-[20px] p-6 flex items-center justify-between mt-8"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                  <Scissors className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-primary uppercase tracking-wider">
                                    Consumo por Peça (Média)
                                  </p>
                                  <p className="text-2xl font-black text-foreground mt-1">
                                    {formatNum(
                                      results.consumptionPerPieceMeters * 100,
                                      1,
                                    )}{" "}
                                    cm
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                      </>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-foreground tracking-tight">
                        Material
                      </h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Qual o tipo de tecido e modo de compra?
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Tecido / Malha
                        </Label>
                        <Input
                          value={fabricType}
                          onChange={(e) => setFabricType(e.target.value)}
                          placeholder="Ex: Algodão, Viscolycra..."
                          className="h-14 rounded-[18px] bg-muted/50 border-0 font-medium px-5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Cor
                        </Label>
                        <Input
                          value={fabricColor}
                          onChange={(e) => setFabricColor(e.target.value)}
                          placeholder="Ex: Preto"
                          className="h-14 rounded-[18px] bg-muted/50 border-0 font-medium px-5"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <Label className="text-sm font-bold text-foreground">
                        Modo de Compra
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        {["metro", "quilo"].map((pm) => (
                          <div
                            key={pm}
                            onClick={() => setPurchaseMode(pm as any)}
                            className={cn(
                              "cursor-pointer rounded-[18px] p-5 text-center transition-all duration-200 border-2 font-bold text-base flex flex-col items-center gap-2",
                              purchaseMode === pm
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border/50 bg-card hover:bg-muted/50 text-muted-foreground",
                            )}
                          >
                            {pm === "metro" ? (
                              <Ruler className="w-6 h-6 mb-1" />
                            ) : (
                              <Package className="w-6 h-6 mb-1" />
                            )}
                            COMPRADO POR {pm.toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-muted/30 rounded-[20px] border border-border/50 space-y-6">
                      {purchaseMode === "metro" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Metros Comprados
                            </Label>
                            <Input
                              type="number"
                              value={totalMetersPurchased}
                              onChange={(e) =>
                                setTotalMetersPurchased(e.target.value)
                              }
                              className="h-14 rounded-[18px] bg-card font-medium text-lg px-5"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Preço por Metro (R$)
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={pricePerMeter}
                              onChange={(e) => setPricePerMeter(e.target.value)}
                              className="h-14 rounded-[18px] bg-card font-medium text-lg px-5"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Rendimento (M/KG)
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={yieldMetersPerKg}
                              onChange={(e) =>
                                setYieldMetersPerKg(e.target.value)
                              }
                              className="h-14 rounded-[18px] bg-card font-medium text-lg px-5"
                              placeholder="Ex: 3.2"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              KG Comprados
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={totalKgPurchased}
                              onChange={(e) =>
                                setTotalKgPurchased(e.target.value)
                              }
                              className="h-14 rounded-[18px] bg-card font-medium text-lg px-5"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Preço por KG (R$)
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={pricePerKg}
                              onChange={(e) => setPricePerKg(e.target.value)}
                              className="h-14 rounded-[18px] bg-card font-medium text-lg px-5"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-foreground tracking-tight">
                        Custos da Produção
                      </h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Identifique o produto e informe os custos de mão de obra
                        e insumos.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-[24px] border border-border/50">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Nome do Produto
                        </Label>
                        <Input
                          value={pieceName}
                          onChange={(e) => setPieceName(e.target.value)}
                          placeholder="Ex: Camiseta Basic"
                          className="h-14 rounded-[18px] bg-card font-medium px-5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          SKU / Lote
                        </Label>
                        <Input
                          value={lotId}
                          onChange={(e) => setLotId(e.target.value)}
                          className="h-14 rounded-[18px] bg-card font-medium px-5 text-muted-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-foreground">
                        Custos Operacionais
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Card Costura */}
                        <div className="bg-card border border-border/50 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <Scissors className="w-4 h-4 text-primary" />
                              <span className="font-bold text-sm">Costura</span>
                            </div>
                            <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md text-muted-foreground">
                              Por Peça
                            </span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                              R$
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              value={sewingCostPerPiece}
                              onChange={(e) =>
                                setSewingCostPerPiece(e.target.value)
                              }
                              className="h-12 pl-10 rounded-[14px] bg-muted/50 border-0 font-medium"
                            />
                          </div>
                        </div>

                        {/* Card Corte */}
                        <div className="bg-card border border-border/50 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <Scissors className="w-4 h-4 text-primary" />
                              <span className="font-bold text-sm">Corte</span>
                            </div>
                            <Select
                              value={cuttingMode}
                              onValueChange={(v: any) => setCuttingMode(v)}
                            >
                              <SelectTrigger className="h-6 w-auto text-xs bg-muted border-0 rounded-md font-bold px-2 py-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="por_peca">
                                  Por Peça
                                </SelectItem>
                                <SelectItem value="por_lote">
                                  Por Lote
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                              R$
                            </span>
                            {cuttingMode === "por_peca" ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={cuttingCostPerPiece}
                                onChange={(e) =>
                                  setCuttingCostPerPiece(e.target.value)
                                }
                                className="h-12 pl-10 rounded-[14px] bg-muted/50 border-0 font-medium"
                              />
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                value={cuttingCostTotal}
                                onChange={(e) =>
                                  setCuttingCostTotal(e.target.value)
                                }
                                className="h-12 pl-10 rounded-[14px] bg-muted/50 border-0 font-medium"
                              />
                            )}
                          </div>
                        </div>

                        {/* Card Modelagem */}
                        <div className="bg-card border border-border/50 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="font-bold text-sm">
                                Modelagem & Risco
                              </span>
                            </div>
                            <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md text-muted-foreground">
                              Fixo Lote
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                                M. R$
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                value={patternMakingCost}
                                onChange={(e) =>
                                  setPatternMakingCost(e.target.value)
                                }
                                className="h-12 pl-10 rounded-[14px] bg-muted/50 border-0 font-medium text-sm"
                              />
                            </div>
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                                R. R$
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                value={markerCost}
                                onChange={(e) => setMarkerCost(e.target.value)}
                                className="h-12 pl-10 rounded-[14px] bg-muted/50 border-0 font-medium text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card Aviamentos/Outros */}
                        <div className="bg-card border border-border/50 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-primary" />
                              <span className="font-bold text-sm">
                                Aviamentos/Outros
                              </span>
                            </div>
                            <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md text-muted-foreground">
                              Fixo Lote
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                                Av. R$
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                value={trimsTotalCost}
                                onChange={(e) =>
                                  setTrimsTotalCost(e.target.value)
                                }
                                className="h-12 pl-11 rounded-[14px] bg-muted/50 border-0 font-medium text-sm"
                              />
                            </div>
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                                Ou. R$
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                value={otherCosts}
                                onChange={(e) => setOtherCosts(e.target.value)}
                                className="h-12 pl-11 rounded-[14px] bg-muted/50 border-0 font-medium text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-foreground tracking-tight">
                        Resultado da Produção
                      </h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Análise executiva dos custos e rendimento.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                          <Shirt size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Produção Prevista
                          </span>
                        </div>
                        <div className="text-[32px] font-black text-foreground">
                          {results.estimatedMaxProduction}{" "}
                          <span className="text-base font-bold text-muted-foreground">
                            pçs
                          </span>
                        </div>
                      </div>

                      <div className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-2 text-success">
                          <DollarSign size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Custo Unitário
                          </span>
                        </div>
                        <div className="text-[32px] font-black text-foreground">
                          {formatMoney(results.totalUnitCost)}
                        </div>
                      </div>

                      <div className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between sm:col-span-2">
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                          <Activity size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Desmembramento do Custo (R$)
                          </span>
                        </div>
                        <div className="flex items-end gap-6 h-full pb-1">
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {formatMoney(results.fabricCostPerPiece)}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              Tecido
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {formatMoney(results.directCostPerPiece)}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              Serviços
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {formatMoney(results.indirectCostPerPiece)}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              Indiretos
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1 bg-card border border-border/50 rounded-[24px] p-6 shadow-sm">
                        <h4 className="text-sm font-bold uppercase tracking-wider mb-6 text-muted-foreground">
                          Composição do Custo
                        </h4>
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                formatter={(val: number) => formatMoney(val)}
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "none",
                                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                                }}
                              />
                              <Legend
                                iconType="circle"
                                wrapperStyle={{
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="lg:col-span-2 bg-card border border-border/50 rounded-[24px] p-6 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                          Insights Automáticos
                        </h4>
                        <div className="space-y-3">
                          <div className="flex gap-3 items-start bg-primary/5 p-4 rounded-[16px] border border-primary/10">
                            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-foreground">
                              O rendimento deste risco com{" "}
                              {formatNum(results.totalMeters, 1)}m de tecido
                              produzirá aproximadamente{" "}
                              <strong>
                                {results.estimatedMaxProduction} peças
                              </strong>
                              .
                            </p>
                          </div>
                          <div className="flex gap-3 items-start bg-muted/50 p-4 rounded-[16px] border border-border/50">
                            <PieChartIcon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-foreground">
                              O custo do material representa{" "}
                              <strong>
                                {(
                                  (results.fabricCostPerPiece /
                                    results.totalUnitCost) *
                                  100
                                ).toFixed(1)}
                                %
                              </strong>{" "}
                              do custo total da peça (R${" "}
                              {results.totalUnitCost.toFixed(2)}).
                            </p>
                          </div>
                          <div className="flex gap-3 items-start bg-muted/50 p-4 rounded-[16px] border border-border/50">
                            <Ruler className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-foreground">
                              A sobra estimada de tecido após o corte será de{" "}
                              <strong>
                                {formatNum(results.estimatedFabricLeftover, 2)}{" "}
                                metros
                              </strong>
                              .
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-8" ref={printRef}>
                    {/* Elegante Resumo A4-like */}
                    <div className="bg-white dark:bg-card border border-border/50 rounded-[24px] p-8 md:p-12 shadow-lg">
                      <div className="flex justify-between items-start border-b border-border/50 pb-6 mb-6">
                        <div>
                          <h2 className="text-3xl font-black text-foreground tracking-tight">
                            {pieceName || "Produto Sem Nome"}
                          </h2>
                          <p className="text-sm text-muted-foreground font-bold mt-1">
                            LOTE: {lotId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-muted-foreground">
                            Ficha de Fabricação
                          </p>
                          <p className="text-sm font-black text-primary mt-1">
                            {new Date(productionDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                            Custo Unitário
                          </p>
                          <p className="text-xl font-black text-foreground">
                            {formatMoney(results.totalUnitCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                            Custo Total (Lote)
                          </p>
                          <p className="text-xl font-black text-foreground">
                            {formatMoney(results.totalLotCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                            Produção
                          </p>
                          <p className="text-xl font-black text-foreground">
                            {results.estimatedMaxProduction} pçs
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                            Consumo/Peça
                          </p>
                          <p className="text-xl font-black text-foreground">
                            {formatNum(
                              results.consumptionPerPieceMeters * 100,
                              1,
                            )}{" "}
                            cm
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-wider border-b border-border/50 pb-2 mb-3">
                            Detalhes do Risco & Tecido
                          </h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex justify-between">
                              <span className="text-muted-foreground">
                                Tecido:
                              </span>{" "}
                              <span className="font-bold">
                                {fabricType} {fabricColor}
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-muted-foreground">
                                Metragem Total:
                              </span>{" "}
                              <span className="font-bold">
                                {formatNum(results.totalMeters, 2)} m
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-muted-foreground">
                                Custo Tecido/Peça:
                              </span>{" "}
                              <span className="font-bold">
                                {formatMoney(results.fabricCostPerPiece)}
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-muted-foreground">
                                Eficiência (Peças/Risco):
                              </span>{" "}
                              <span className="font-bold">
                                {piecesPerMarker} pçs
                              </span>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-wider border-b border-border/50 pb-2 mb-3">
                            Custos de Serviços
                          </h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex justify-between">
                              <span className="text-muted-foreground">
                                Costura (Unit):
                              </span>{" "}
                              <span className="font-bold">
                                {formatMoney(results.sewCostPiece)}
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-muted-foreground">
                                Corte (Unit):
                              </span>{" "}
                              <span className="font-bold">
                                {formatMoney(
                                  results.directCostPerPiece -
                                    results.sewCostPiece,
                                )}
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-muted-foreground">
                                Custo Indireto (Unit):
                              </span>{" "}
                              <span className="font-bold">
                                {formatMoney(results.indirectCostPerPiece)}
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-muted-foreground">
                                Total Serviços (Lote):
                              </span>{" "}
                              <span className="font-bold">
                                {formatMoney(
                                  results.indirectCostsTotal +
                                    results.directCostPerPiece *
                                      results.estimatedMaxProduction,
                                )}
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {results.grades.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-wider border-b border-border/50 pb-2 mb-3">
                            Distribuição de Grade ({gradeType.replace("_", " ")}
                            )
                          </h4>
                          <div className="flex flex-wrap gap-4">
                            {results.grades.map((g, i) => (
                              <div
                                key={i}
                                className="bg-muted/50 rounded-xl px-4 py-3 flex-1 min-w-[100px] text-center border border-border/50"
                              >
                                <div className="text-xs font-bold text-muted-foreground uppercase mb-1">
                                  Tam. {g.size}
                                </div>
                                <div className="text-lg font-black">
                                  {g.quantity}{" "}
                                  <span className="text-xs font-normal">
                                    pçs
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 justify-end mt-8">
                      <Button
                        onClick={generatePDF}
                        variant="outline"
                        className="h-12 rounded-xl font-bold bg-white dark:bg-card"
                      >
                        <Download className="w-4 h-4 mr-2" /> Baixar PDF
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* FOOTER CONTROLS */}
            {step < 5 && (
              <div className="flex justify-between items-center mt-8">
                <Button
                  onClick={handlePrev}
                  disabled={step === 1}
                  variant="ghost"
                  className="h-12 px-6 rounded-xl font-bold hover:bg-muted/50"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <Button
                  onClick={handleNext}
                  className="h-12 px-8 rounded-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                >
                  Avançar <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
