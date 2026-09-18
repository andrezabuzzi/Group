import React, { useState, useMemo, useEffect } from "react";
import {
  Calculator,
  Search,
  Plus,
  Save,
  TrendingUp,
  DollarSign,
  ExternalLink,
  RefreshCw,
  BarChart2,
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingDown,
  Eye,
  ChevronDown,
  Download,
  History,
} from "lucide-react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  doc,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { cn } from "../../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
type GoalMode = "margin" | "profit";
type MLAdType = "classic" | "premium";
interface AppConfig {
  productCost: string;
  extraCosts: string;
  taxPercent: string;
  goalMode: GoalMode;
  goalValue: string;
  discountPercent: string;
  adsPercent: string;
  mlAdType: MLAdType;
  shopeeAffiliatePercent: string;
  tiktokAffiliatePercent: string;
}
const parseNum = (val: string) => Number(val.replace(",", ".")) || 0;
const formatMoney = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    val,
  );
const ML_RANGES = [
  { min: 0, max: 28.99, fixed: 6.25 },
  { min: 29.0, max: 49.99, fixed: 6.5 },
  { min: 50.0, max: 78.99, fixed: 6.75 },
  { min: 79.0, max: 99.99, fixed: 13.25 },
  { min: 100.0, max: 119.99, fixed: 15.45 },
  { min: 120.0, max: 149.99, fixed: 17.65 },
  { min: 150.0, max: 199.99, fixed: 19.85 },
  { min: 200.0, max: Infinity, fixed: 22.55 },
];
const SHOPEE_RANGES = [
  { min: 0, max: 99.99, fixed: 16 },
  { min: 100, max: 199.99, fixed: 20 },
  { min: 200, max: Infinity, fixed: 26 },
];
const TIKTOK_RANGES = [{ min: 0, max: Infinity, fixed: 4 }];
const SHEIN_RANGES = [{ min: 0, max: Infinity, fixed: 5 }];
function solveIdealPrice(
  targetValue: number,
  isMargin: boolean,
  ranges: { min: number; max: number; fixed: number }[],
  C: number,
  V: number,
): number | null {
  let bestSP: number | null = null;
  for (const r of ranges) {
    let SP = 0;
    if (isMargin) {
      const denom = 1 - V - targetValue / 100;
      if (denom <= 0) continue;
      SP = (r.fixed + C) / denom;
    } else {
      const denom = 1 - V;
      if (denom <= 0) continue;
      SP = (targetValue + r.fixed + C) / denom;
    }
    /*  Epsilon to avoid floating point issues */ if (
      SP >= r.min - 0.01 &&
      SP <= r.max + 0.01
    ) {
      if (bestSP === null || SP < bestSP) bestSP = SP;
    }
  }
  return bestSP;
}
function calcMetrics(
  SP: number,
  F: number,
  C: number,
  V: number,
  productCost: number,
  extraCosts: number,
  taxPercent: number,
  adsPercent: number,
  channelFeePerc: number,
  discountPerc: number,
) {
  const taxVal = SP * taxPercent;
  const adsVal = SP * adsPercent;
  const feeVal = SP * channelFeePerc;
  const totalCost = productCost + extraCosts + taxVal + adsVal + feeVal + F;
  const profit = SP - totalCost;
  const margin = SP > 0 ? (profit / SP) * 100 : 0;
  const payout = SP - feeVal - F;
  const fullPrice = SP / (1 - discountPerc);
  return {
    salePrice: SP,
    fullPrice,
    profit,
    margin,
    payout,
    taxVal,
    adsVal,
    feeVal,
    fixedFee: F,
    productCost,
    extraCosts,
    totalCost,
  };
}
const getFixedFees = (SP: number, ranges: any[]) => {
  const range =
    ranges.find((r) => SP >= r.min - 0.01 && SP <= r.max + 0.01) ||
    ranges[ranges.length - 1];
  return range.fixed;
};
export default function CalculadoraMarketplace() {
  const [config, setConfig] = useState<AppConfig>({
    productCost: "30",
    extraCosts: "2",
    taxPercent: "0",
    goalMode: "margin",
    goalValue: "20",
    discountPercent: "0",
    adsPercent: "0",
    mlAdType: "classic",
    shopeeAffiliatePercent: "0",
    tiktokAffiliatePercent: "0",
  });
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setHistory([]);
        return;
      }
      const q = query(
        collection(db, "prod_marketplace_calculations"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );
      const unsubSnap = onSnapshot(
        q,
        (snap) => {
          setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => {
          console.error("History fetch error:", err);
        },
      );
      return () => unsubSnap();
    });
    return () => unsubAuth();
  }, []);
  const results = useMemo(() => {
    const C = parseNum(config.productCost) + parseNum(config.extraCosts);
    const taxPerc = parseNum(config.taxPercent) / 100;
    const adsPerc = parseNum(config.adsPercent) / 100;
    const isMargin = config.goalMode === "margin";
    const target = parseNum(config.goalValue);
    const discountPerc = parseNum(config.discountPercent) / 100;
    const mlFeePerc = config.mlAdType === "premium" ? 0.19 : 0.14;
    const shopeeFeePerc = 0.14 + parseNum(config.shopeeAffiliatePercent) / 100;
    const tiktokFeePerc = 0.12 + parseNum(config.tiktokAffiliatePercent) / 100;
    const sheinFeePerc = 0.2;
    const resolveChannel = (name: string, ranges: any[], feePerc: number) => {
      const V = taxPerc + adsPerc + feePerc;
      const customInput = customPrices[name];
      let finalSP: number | null = null;
      let impossible = false;
      if (customInput && customInput.trim() !== "") {
        finalSP = parseNum(customInput);
      } else {
        finalSP = solveIdealPrice(target, isMargin, ranges, C, V);
        if (finalSP === null) impossible = true;
      }
      if (impossible || finalSP === null) {
        return { impossible: true, metrics: null };
      }
      const F = getFixedFees(finalSP, ranges);
      const metrics = calcMetrics(
        finalSP,
        F,
        C,
        V,
        parseNum(config.productCost),
        parseNum(config.extraCosts),
        taxPerc,
        adsPerc,
        feePerc,
        discountPerc,
      );
      let status: "green" | "yellow" | "red" = "green";
      if (metrics.profit <= 0) status = "red";
      else if (isMargin && metrics.margin < target - 0.5) status = "yellow";
      else if (!isMargin && metrics.profit < target - 0.5) status = "yellow";
      return { impossible: false, metrics, status };
    };
    return {
      ml: resolveChannel("ml", ML_RANGES, mlFeePerc),
      shopee: resolveChannel("shopee", SHOPEE_RANGES, shopeeFeePerc),
      tiktok: resolveChannel("tiktok", TIKTOK_RANGES, tiktokFeePerc),
      shein: resolveChannel("shein", SHEIN_RANGES, sheinFeePerc),
    };
  }, [config, customPrices]);
  const chartData = useMemo(() => {
    return [
      {
        name: "M. Livre",
        profit: results.ml.metrics?.profit || 0,
        margin: results.ml.metrics?.margin || 0,
        payout: results.ml.metrics?.payout || 0,
        price: results.ml.metrics?.salePrice || 0,
      },
      {
        name: "Shopee",
        profit: results.shopee.metrics?.profit || 0,
        margin: results.shopee.metrics?.margin || 0,
        payout: results.shopee.metrics?.payout || 0,
        price: results.shopee.metrics?.salePrice || 0,
      },
      {
        name: "TikTok",
        profit: results.tiktok.metrics?.profit || 0,
        margin: results.tiktok.metrics?.margin || 0,
        payout: results.tiktok.metrics?.payout || 0,
        price: results.tiktok.metrics?.salePrice || 0,
      },
      {
        name: "Shein",
        profit: results.shein.metrics?.profit || 0,
        margin: results.shein.metrics?.margin || 0,
        payout: results.shein.metrics?.payout || 0,
        price: results.shein.metrics?.salePrice || 0,
      },
    ];
  }, [results]);
  const bestChannelForProfit = [...chartData].sort(
    (a, b) => b.profit - a.profit,
  )[0];
  const bestChannelForMargin = [...chartData].sort(
    (a, b) => b.margin - a.margin,
  )[0];
  const lowestPriceChannel = [...chartData]
    .filter((x) => x.price > 0)
    .sort((a, b) => a.price - b.price)[0];
  const handleSaveSim = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Logado?");
    const d = new Date();
    await addDoc(collection(db, "prod_marketplace_calculations"), {
      ...config,
      resultsSummary: chartData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    alert("Simulação salva com sucesso!");
  };
  const renderChannelCard = (
    name: string,
    label: string,
    data: any,
    colorClass: string,
    bgClass: string,
  ) => {
    return (
      <Card className="rounded-[1.5rem] overflow-hidden border-border shadow-sm transition-all flex flex-col">
        {" "}
        <div
          className={cn(
            "px-5 py-3 border-b flex items-center justify-between font-black text-sm",
            bgClass,
            colorClass,
          )}
        >
          {" "}
          {label}
          {data.impossible && (
            <span className="flex items-center gap-1 text-red-500 bg-red-100 px-2 py-0.5 rounded text-[10px]">
              <AlertCircle className="w-3 h-3" /> Impossível
            </span>
          )}
          {!data.impossible && data.status === "green" && (
            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
              <CheckCircle2 className="w-3 h-3" /> Ideal
            </span>
          )}
          {!data.impossible && data.status === "yellow" && (
            <span className="flex items-center gap-1 text-amber-600 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
              <AlertCircle className="w-3 h-3" /> Margem Baixa
            </span>
          )}
          {!data.impossible && data.status === "red" && (
            <span className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-0.5 rounded text-[10px]">
              <TrendingDown className="w-3 h-3" /> Prejuízo
            </span>
          )}
        </div>{" "}
        <div className="p-5 flex-1 flex flex-col gap-5">
          {" "}
          {data.impossible ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-muted-foreground opacity-80">
              {" "}
              <AlertCircle className="w-10 h-10 mb-2 text-red-400" />{" "}
              <p className="font-bold text-sm text-foreground">
                Meta inatingível com as taxas atuais
              </p>{" "}
              <p className="text-xs mt-1">
                Sua margem ou lucro alvo supera o que sobra após os custos da
                plataforma.
              </p>{" "}
            </div>
          ) : (
            <>
              {" "}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div>
                  {" "}
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Preço de Venda
                  </div>{" "}
                  <div className="font-black text-2xl text-foreground">
                    {formatMoney(data.metrics.salePrice)}
                  </div>{" "}
                  {Number(config.discountPercent) > 0 && (
                    <div className="text-xs font-semibold text-muted-foreground line-through mt-0.5">
                      De {formatMoney(data.metrics.fullPrice)}
                    </div>
                  )}
                </div>{" "}
                <div>
                  {" "}
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Lucro Líquido
                  </div>{" "}
                  <div
                    className={cn(
                      "font-black text-2xl",
                      data.metrics.profit > 0
                        ? "text-emerald-500"
                        : "text-red-500",
                    )}
                  >
                    {" "}
                    {formatMoney(data.metrics.profit)}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-xl border border-border/50">
                {" "}
                <div>
                  {" "}
                  <div className="text-[10px] font-bold text-muted-foreground">
                    Margem %
                  </div>{" "}
                  <div className="font-bold text-foreground">
                    {data.metrics.margin.toFixed(1)}%
                  </div>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <div className="text-[10px] font-bold text-muted-foreground">
                    Repasse
                  </div>{" "}
                  <div className="font-bold text-indigo-600">
                    {formatMoney(data.metrics.payout)}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </>
          )}
          <div className="mt-auto pt-4 border-t border-border">
            {" "}
            <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
              Simular Preço Customizado
            </div>{" "}
            <Input
              type="number"
              placeholder="R$ 0,00"
              value={customPrices[name] || ""}
              onChange={(e) =>
                setCustomPrices({ ...customPrices, [name]: e.target.value })
              }
              className="h-10 rounded-lg bg-background shadow-sm font-bold placeholder:font-medium"
            />{" "}
            {customPrices[name] && (
              <div className="mt-2 text-right">
                {" "}
                <span
                  className="text-[10px] font-bold text-indigo-500 cursor-pointer hover:underline"
                  onClick={() =>
                    setCustomPrices({ ...customPrices, [name]: "" })
                  }
                >
                  Remover override, voltar ao Ideal
                </span>{" "}
              </div>
            )}
          </div>{" "}
          {!data.impossible && (
            <div className="mt-2 border border-border rounded-xl overflow-hidden transition-all">
              {" "}
              <button
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs bg-muted/20 hover:bg-muted/40 transition-colors"
                onClick={() =>
                  setOpenAccordion(openAccordion === name ? null : name)
                }
              >
                {" "}
                <span className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" /> DRE Detalhado
                </span>{" "}
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    openAccordion === name && "rotate-180",
                  )}
                />{" "}
              </button>{" "}
              {openAccordion === name && (
                <div className="p-4 space-y-2 text-xs font-medium border-t border-border">
                  {" "}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receita Bruta</span>
                    <span className="font-bold text-foreground">
                      {formatMoney(data.metrics.salePrice)}
                    </span>
                  </div>{" "}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Comissão (Tarifa)
                    </span>
                    <span className="text-red-500">
                      -{formatMoney(data.metrics.feeVal)}
                    </span>
                  </div>{" "}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Custo Fixo/Frete Platform
                    </span>
                    <span className="text-red-500">
                      -{formatMoney(data.metrics.fixedFee)}
                    </span>
                  </div>{" "}
                  <div className="flex justify-between pt-1 border-t border-border/50">
                    <span className="font-bold text-foreground">
                      Repasse Líquido
                    </span>
                    <span className="font-bold text-indigo-600">
                      {formatMoney(data.metrics.payout)}
                    </span>
                  </div>{" "}
                  <div className="flex justify-between mt-2 text-muted-foreground">
                    <span>Custo Produto</span>
                    <span className="text-red-500">
                      -{formatMoney(data.metrics.productCost)}
                    </span>
                  </div>{" "}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Custos Extras</span>
                    <span className="text-red-500">
                      -{formatMoney(data.metrics.extraCosts)}
                    </span>
                  </div>{" "}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Impostos Federais</span>
                    <span className="text-red-500">
                      -{formatMoney(data.metrics.taxVal)}
                    </span>
                  </div>{" "}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Custo Custo ADS</span>
                    <span className="text-red-500">
                      -{formatMoney(data.metrics.adsVal)}
                    </span>
                  </div>{" "}
                  <div className="flex justify-between pt-2 border-t border-border/50 font-black">
                    <span className="text-foreground">Lucro Final Líquido</span>
                    <span
                      className={cn(
                        data.metrics.profit > 0
                          ? "text-emerald-500"
                          : "text-red-500",
                      )}
                    >
                      {formatMoney(data.metrics.profit)}
                    </span>
                  </div>{" "}
                </div>
              )}
            </div>
          )}
        </div>{" "}
      </Card>
    );
  };
  return (
    <div className="flex-1 p-4 md:p-8 pt-6 max-w-none mx-auto w-full transition-all flex flex-col gap-6">
      {" "}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {" "}
        <div>
          {" "}
          <h1 className="text-[36px] font-bold tracking-tight text-foreground leading-tight">
            Calculadora Marketplace
          </h1>{" "}
          <p className="text-muted-foreground font-medium mt-1">
            Descubra o preço ideal mantendo sua margem na hora de compor os
            custos.
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <Tabs defaultValue="calculadora" className="w-full">
        {" "}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          {" "}
          <TabsList className="bg-muted/50 p-1 w-full md:w-auto h-12 rounded-xl">
            {" "}
            <TabsTrigger
              value="calculadora"
              className="rounded-lg font-bold text-sm h-10 px-6 data-[state=active]:data-[state=active]:shadow-sm"
            >
              <Calculator className="w-4 h-4 mr-2" /> Calculadora
            </TabsTrigger>{" "}
            <TabsTrigger
              value="historico"
              className="rounded-lg font-bold text-sm h-10 px-6 data-[state=active]:data-[state=active]:shadow-sm"
            >
              <History className="w-4 h-4 mr-2" /> Histórico
            </TabsTrigger>{" "}
          </TabsList>{" "}
          <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
            {" "}
            <Button
              variant="outline"
              className="rounded-xl h-11 px-5 font-bold md:w-auto w-full"
            >
              <Download className="w-4 h-4 mr-2" /> Exportar
            </Button>{" "}
            <Button
              onClick={handleSaveSim}
              className="premium-btn-primary rounded-xl h-11 px-6 font-black tracking-wider uppercase text-sm shadow-md bg-indigo-600 hover:bg-indigo-700 md:w-auto w-full shrink-0"
            >
              {" "}
              <Save className="w-4 h-4 mr-2" /> Salvar Cenário{" "}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
        <TabsContent
          value="calculadora"
          className="mt-0 focus-visible:outline-none"
        >
          {" "}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {" "}
            <Card className="rounded-[1.5rem] border-border shadow-sm p-5 pb-4">
              {" "}
              <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">
                Maior Lucro Fixo
              </div>{" "}
              <div className="text-xl font-black">
                {bestChannelForProfit?.name || "-"}
              </div>{" "}
              <div className="text-sm font-bold text-emerald-500 mt-0.5">
                {formatMoney(bestChannelForProfit?.profit || 0)}
              </div>{" "}
            </Card>{" "}
            <Card className="rounded-[1.5rem] border-border shadow-sm p-5 pb-4">
              {" "}
              <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">
                Maior Margem %
              </div>{" "}
              <div className="text-xl font-black">
                {bestChannelForMargin?.name || "-"}
              </div>{" "}
              <div className="text-sm font-bold text-emerald-500 mt-0.5">
                {bestChannelForMargin?.margin.toFixed(1)}%
              </div>{" "}
            </Card>{" "}
            <Card className="rounded-[1.5rem] border-border shadow-sm p-5 pb-4">
              {" "}
              <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">
                Menor Preço Competitivo
              </div>{" "}
              <div className="text-xl font-black">
                {lowestPriceChannel?.name || "-"}
              </div>{" "}
              <div className="text-sm font-bold text-indigo-500 mt-0.5">
                Venda por {formatMoney(lowestPriceChannel?.price || 0)}
              </div>{" "}
            </Card>{" "}
            <Card className="rounded-[1.5rem] bg-indigo-600 text-white shadow-md p-5 pb-4">
              {" "}
              <div className="text-[10px] font-black uppercase text-indigo-200 tracking-wider mb-2">
                Meta Escolhida
              </div>{" "}
              <div className="text-[38px] font-bold tracking-tight text-foreground">
                {config.goalValue}
                {config.goalMode === "margin" ? "%" : " R$"}
              </div>{" "}
            </Card>{" "}
          </div>{" "}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {" "}
            {/* COLUNA 1 - CONFIG */}
            <div className="lg:col-span-3 space-y-6">
              {" "}
              <Card className="rounded-[1.5rem] border-border shadow-sm overflow-hidden sticky top-8">
                {" "}
                <div className="p-5 border-b border-border/50 bg-muted/20">
                  {" "}
                  <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Custos Base e Metas
                  </h3>{" "}
                </div>{" "}
                <div className="p-5 space-y-6">
                  {" "}
                  <div className="space-y-4 pt-1">
                    {" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Custo do Produto (R$)
                      </label>{" "}
                      <Input
                        value={config.productCost}
                        onChange={(e) =>
                          setConfig({ ...config, productCost: e.target.value })
                        }
                        type="number"
                        className="h-11 rounded-xl bg-muted/30 font-bold"
                      />{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex justify-between">
                        Custos Extras (R$){" "}
                        <span className="font-normal opacity-70">
                          Ex: caixa, brinde
                        </span>
                      </label>{" "}
                      <Input
                        value={config.extraCosts}
                        onChange={(e) =>
                          setConfig({ ...config, extraCosts: e.target.value })
                        }
                        type="number"
                        className="h-11 rounded-xl bg-muted/30 font-bold"
                      />{" "}
                    </div>{" "}
                    <div className="grid grid-cols-2 gap-3">
                      {" "}
                      <div className="space-y-2">
                        {" "}
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          Impostos (%)
                        </label>{" "}
                        <Input
                          value={config.taxPercent}
                          onChange={(e) =>
                            setConfig({ ...config, taxPercent: e.target.value })
                          }
                          type="number"
                          className="h-11 rounded-xl bg-muted/30 font-bold"
                        />{" "}
                      </div>{" "}
                      <div className="space-y-2">
                        {" "}
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          Verba ADS (%)
                        </label>{" "}
                        <Input
                          value={config.adsPercent}
                          onChange={(e) =>
                            setConfig({ ...config, adsPercent: e.target.value })
                          }
                          type="number"
                          className="h-11 rounded-xl bg-muted/30 font-bold text-indigo-600"
                        />{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="pt-5 border-t border-border">
                    {" "}
                    <div className="flex gap-1 bg-muted p-1 rounded-xl mb-4">
                      {" "}
                      <button
                        onClick={() =>
                          setConfig({ ...config, goalMode: "margin" })
                        }
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                          config.goalMode === "margin"
                            ? "shadow-sm text-indigo-600"
                            : "text-muted-foreground",
                        )}
                      >
                        Margem %
                      </button>{" "}
                      <button
                        onClick={() =>
                          setConfig({ ...config, goalMode: "profit" })
                        }
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                          config.goalMode === "profit"
                            ? "shadow-sm text-emerald-600"
                            : "text-muted-foreground",
                        )}
                      >
                        Lucro R$
                      </button>{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {config.goalMode === "margin"
                          ? "Margem Alvo Desejada (%)"
                          : "Lucro Fixo Desejado (R$)"}
                      </label>{" "}
                      <Input
                        value={config.goalValue}
                        onChange={(e) =>
                          setConfig({ ...config, goalValue: e.target.value })
                        }
                        type="number"
                        className={cn(
                          "h-14 text-2xl font-black rounded-xl",
                          config.goalMode === "margin"
                            ? "bg-indigo-50/50 text-indigo-600 border-indigo-200"
                            : "bg-emerald-50/50 text-emerald-600 border-emerald-200",
                        )}
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="pt-5 border-t border-border space-y-4">
                    {" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex justify-between">
                        Promoção Visual (%){" "}
                        <span className="font-normal opacity-70">
                          Ex: Oferta 20% OF
                        </span>
                      </label>{" "}
                      <Input
                        value={config.discountPercent}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            discountPercent: e.target.value,
                          })
                        }
                        type="number"
                        className="h-11 rounded-xl bg-muted/30 font-bold"
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="pt-5 border-t border-border space-y-4">
                    {" "}
                    <h3 className="font-black text-xs uppercase text-indigo-600">
                      Ajustes dos Canais
                    </h3>{" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Mercado Livre: Tipo Anúncio
                      </label>{" "}
                      <Select
                        value={config.mlAdType}
                        onValueChange={(v: any) =>
                          setConfig({ ...config, mlAdType: v })
                        }
                      >
                        {" "}
                        <SelectTrigger className="h-10 rounded-lg text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>{" "}
                        <SelectContent>
                          <SelectItem value="classic">
                            Clássico (~14%)
                          </SelectItem>
                          <SelectItem value="premium">
                            Premium (~19%)
                          </SelectItem>
                        </SelectContent>{" "}
                      </Select>{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Shopee: Prog. Afiliados (%)
                      </label>{" "}
                      <Input
                        value={config.shopeeAffiliatePercent}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            shopeeAffiliatePercent: e.target.value,
                          })
                        }
                        type="number"
                        className="h-10 rounded-lg bg-muted/30 text-xs font-bold"
                      />{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        TikTok: Prog. Afiliados (%)
                      </label>{" "}
                      <Input
                        value={config.tiktokAffiliatePercent}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            tiktokAffiliatePercent: e.target.value,
                          })
                        }
                        type="number"
                        className="h-10 rounded-lg bg-muted/30 text-xs font-bold"
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </Card>{" "}
            </div>{" "}
            {/* COLUNA 2 e 3 - RESULTADOS */}
            <div className="lg:col-span-9 space-y-6">
              {" "}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {" "}
                {renderChannelCard(
                  "ml",
                  "Mercado Livre",
                  results.ml,
                  "text-yellow-600",
                  "bg-yellow-50 border-yellow-200",
                )}
                {renderChannelCard(
                  "shopee",
                  "Shopee",
                  results.shopee,
                  "text-orange-600",
                  "bg-orange-50 border-orange-200",
                )}
                {renderChannelCard(
                  "tiktok",
                  "TikTok Shop",
                  results.tiktok,
                  "text-slate-900",
                  "bg-slate-100 border-slate-300",
                )}
                {renderChannelCard(
                  "shein",
                  "Shein",
                  results.shein,
                  "text-zinc-900",
                  "bg-zinc-100 border-zinc-300",
                )}
              </div>{" "}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {" "}
                <Card className="rounded-[1.5rem] border-border shadow-sm p-6 flex flex-col">
                  {" "}
                  <h3 className="font-black text-sm uppercase tracking-wider mb-6">
                    Comparativo de Marge Líquida %
                  </h3>{" "}
                  <div className="flex-1 min-h-[250px]">
                    {" "}
                    <ResponsiveContainer width="100%" height="100%">
                      {" "}
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
                      >
                        {" "}
                        <XAxis type="number" hide />{" "}
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fontWeight: "bold" }}
                          width={80}
                        />{" "}
                        <RechartsTooltip
                          cursor={{ fill: "transparent" }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />{" "}
                        <Bar
                          dataKey="margin"
                          radius={[0, 8, 8, 0]}
                          barSize={24}
                        >
                          {" "}
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.margin > 20
                                  ? "#6D4AFF"
                                  : entry.margin > 0
                                    ? "#f59e0b"
                                    : "#A5ADBD"
                              }
                            />
                          ))}
                        </Bar>{" "}
                      </BarChart>{" "}
                    </ResponsiveContainer>{" "}
                  </div>{" "}
                </Card>{" "}
                <Card className="rounded-[1.5rem] border-border shadow-sm p-6 flex flex-col">
                  {" "}
                  <h3 className="font-black text-sm uppercase tracking-wider mb-6">
                    Volume Financeiro (Venda x Payout x Lucro)
                  </h3>{" "}
                  <div className="flex-1 min-h-[250px]">
                    {" "}
                    <ResponsiveContainer width="100%" height="100%">
                      {" "}
                      <BarChart
                        data={chartData}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      >
                        {" "}
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E2E8F0"
                        />{" "}
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fontWeight: "bold" }}
                          dy={10}
                        />{" "}
                        <YAxis hide />{" "}
                        <RechartsTooltip
                          cursor={{ fill: "#f1f5f9" }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />{" "}
                        <Bar
                          dataKey="price"
                          name="Preço de Venda"
                          fill="#cbd5e1"
                          radius={[4, 4, 0, 0]}
                          barSize={15}
                        />{" "}
                        <Bar
                          dataKey="payout"
                          name="Repasse Líquido"
                          fill="#6D4AFF"
                          radius={[4, 4, 0, 0]}
                          barSize={15}
                        />{" "}
                        <Bar
                          dataKey="profit"
                          name="Lucro Real"
                          fill="#6D4AFF"
                          radius={[4, 4, 0, 0]}
                          barSize={15}
                        />{" "}
                      </BarChart>{" "}
                    </ResponsiveContainer>{" "}
                  </div>{" "}
                </Card>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </TabsContent>{" "}
        <TabsContent
          value="historico"
          className="mt-0 focus-visible:outline-none"
        >
          {" "}
          <Card className="rounded-[1.5rem] border-border shadow-sm min-h-[400px]">
            {" "}
            <div className="p-6 border-b border-border/50">
              {" "}
              <h3 className="font-black text-foreground">
                Histórico de Simulações
              </h3>{" "}
            </div>{" "}
            <div className="overflow-x-auto">
              {" "}
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-xs uppercase font-black text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-[1.5rem]">
                      Data e Hora
                    </th>
                    <th className="px-6 py-4">Custo Base</th>
                    <th className="px-6 py-4">Meta Alvo</th>
                    <th className="px-6 py-4">Melhor Lucro</th>
                    <th className="px-6 py-4">Melhor Margem</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {history.map((h, i) => {
                    const bestProfit = h.resultsSummary
                      ? [...h.resultsSummary].sort(
                          (a: any, b: any) => b.profit - a.profit,
                        )[0]
                      : null;
                    const bestMargin = h.resultsSummary
                      ? [...h.resultsSummary].sort(
                          (a: any, b: any) => b.margin - a.margin,
                        )[0]
                      : null;
                    return (
                      <tr
                        key={h.id || i}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-foreground">
                          {" "}
                          {h.createdAt
                            ? format(h.createdAt.toDate(), "dd/MM/yyyy HH:mm")
                            : "-"}
                        </td>
                        <td className="px-6 py-4 font-semibold text-muted-foreground text-red-500">
                          {" "}
                          {formatMoney(
                            Number(h.productCost) + Number(h.extraCosts),
                          )}
                        </td>
                        <td className="px-6 py-4 font-black text-indigo-600">
                          {" "}
                          {h.goalValue}
                          {h.goalMode === "margin" ? "%" : " R$"}
                        </td>
                        <td className="px-6 py-4">
                          {" "}
                          {bestProfit ? (
                            <div>
                              {" "}
                              <span className="font-black text-emerald-500">
                                {formatMoney(bestProfit.profit)}
                              </span>{" "}
                              <span className="text-[10px] font-bold text-muted-foreground uppercase ml-2 bg-muted px-2 py-0.5 rounded-full">
                                {bestProfit.name}
                              </span>{" "}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {" "}
                          {bestMargin ? (
                            <div>
                              {" "}
                              <span className="font-black text-emerald-500">
                                {bestMargin.margin.toFixed(1)}%
                              </span>{" "}
                              <span className="text-[10px] font-bold text-muted-foreground uppercase ml-2 bg-muted px-2 py-0.5 rounded-full">
                                {bestMargin.name}
                              </span>{" "}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td></tr>
                    );
                  })}
                  {history.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-muted-foreground font-medium"
                      >
                        {" "}
                        Nenhuma simulação salva.{" "}
                      </td></tr>
                  )}</tbody></table>{" "}
            </div>{" "}
          </Card>{" "}
        </TabsContent>{" "}
      </Tabs>{" "}
    </div>
  );
}
