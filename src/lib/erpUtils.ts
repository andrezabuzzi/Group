import { isBefore, parseISO, startOfDay } from "date-fns";

export interface ProductionPayment {
  id: string;
  producaoId: string;
  lote: string;
  produtoNome: string;
  favorecido: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  formaPagamento: string;
  status: "pago" | "pendente";
  observacao?: string;
  accountId?: string; // Reference to prod_accounts_payable doc
  createdAt: string;
}

export interface ProductionDelivery {
  id: string;
  producaoId: string;
  data: string;
  quantidade: number;
  quantidadeDefeito?: number;
  quantidadePorTamanho?: Record<string, string | number>;
  observacao?: string;
  responsavel?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  insumoId?: string;
  descricao: string;
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE" | "PERDA" | "DEVOLUCAO";
  quantidade: number;
  unidade: string;
  data: string;
  motivo?: string;
  origem?: string;
  referenciaId?: string;
  userId: string;
  createdAt: any;
}

/**
 * Calculates progress percentage automatically: (totalEntregue / quantidadeTotal) * 100
 */
export function calcProductionProgress(totalEntregue: number, quantidadeTotal: number): number {
  if (!quantidadeTotal || quantidadeTotal <= 0) return 0;
  const progress = (totalEntregue / quantidadeTotal) * 100;
  return Math.min(100, Math.max(0, Math.round(progress * 100) / 100));
}

/**
 * Calculates production status automatically according to ERP business rules:
 * - 0 produced -> "Não Iniciada"
 * - >0 e < total -> "Em Produção"
 * - 100% -> "Concluído"
 */
export function calcProductionStatus(totalEntregue: number, quantidadeTotal: number): "Não Iniciada" | "Em Produção" | "Concluído" {
  if (totalEntregue >= quantidadeTotal && quantidadeTotal > 0) {
    return "Concluído";
  }
  if (totalEntregue > 0) {
    return "Em Produção";
  }
  return "Não Iniciada";
}

/**
 * Checks if a production is overdue
 */
export function isProductionOverdue(dataPrevista?: string, totalPendente: number = 0): boolean {
  if (!dataPrevista || totalPendente <= 0) return false;
  try {
    const today = startOfDay(new Date());
    const dueDate = startOfDay(parseISO(dataPrevista));
    return isBefore(dueDate, today);
  } catch {
    return false;
  }
}

/**
 * Formats a short lot code:
 * Format: Letter + 4 digits (e.g. L4589)
 */
export function formatLote(raw?: string): string {
  if (!raw) return "";
  const cleaned = raw.trim();
  if (!cleaned) return "";

  if (/^\d+$/.test(cleaned)) {
    return `L${cleaned.padStart(4, "0")}`;
  }

  const match = cleaned.match(/^([A-Za-z]+)[-_\s]*(\d+)$/);
  if (match) {
    const prefix = ["LT", "LOTE"].includes(match[1].toUpperCase())
      ? "L"
      : match[1].toUpperCase();
    return `${prefix}${match[2].padStart(4, "0")}`;
  }

  return cleaned;
}

/**
 * Generates a random 4-digit lot (e.g. L4589)
 */
export function generateRandomLote(existingLotes: Set<string> = new Set(), letra: string = "L"): string {
  for (let i = 0; i < 200; i++) {
    const rand4 = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${letra}${rand4}`;
    if (!existingLotes.has(candidate)) {
      return candidate;
    }
  }
  return `${letra}${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Calculates total batch cost from all components
 */
export function calcBatchTotalCost(params: {
  valorTecido?: number;
  valorCorte?: number;
  valorModelagem?: number;
  valorRisco?: number;
  valorCosturaUnitario?: number;
  quantidadeTotal?: number;
  valorInsumos?: number;
  outrosGastos?: number;
}): { custoTotal: number; custoPorPeca: number } {
  const qtd = params.quantidadeTotal || 0;
  const costuraTotal = (params.valorCosturaUnitario || 0) * qtd;
  const custoTotal =
    (params.valorTecido || 0) +
    (params.valorCorte || 0) +
    (params.valorModelagem || 0) +
    (params.valorRisco || 0) +
    costuraTotal +
    (params.valorInsumos || 0) +
    (params.outrosGastos || 0);

  const custoPorPeca = qtd > 0 ? custoTotal / qtd : 0;
  return { custoTotal, custoPorPeca };
}

/**
 * Calculates complete production financial status by stage,
 * guaranteeing that stages marked as PAGO are 100% recognized as paid
 * across the entire system.
 */
export function calcProducaoFinanceiro(prod: any) {
  const qtdTotal = Number(prod?.quantidadeTotal) || 0;
  const custoCosturaUnitario = Number(prod?.valorCostura) || 0;
  const totalCostura = custoCosturaUnitario * qtdTotal;

  const custoTecido = (Array.isArray(prod?.fornecedoresTecido) && prod.fornecedoresTecido.length > 0)
    ? prod.fornecedoresTecido.reduce((acc: number, curr: any) => acc + (Number(curr?.totalCompra) || 0), 0)
    : (Number(prod?.valorTecido) || 0);
  const custoCorte = Number(prod?.valorCorte) || 0;
  const custoModelagem = Number(prod?.valorModelagem) || 0;
  const custoRisco = Number(prod?.valorRisco) || 0;
  const custoInsumos = Number(prod?.valorInsumos) || 0;
  const custoOutros = Number(prod?.outrosGastos) || 0;

  const somaCustosEtapas = custoTecido + custoCorte + custoModelagem + custoRisco + totalCostura + custoInsumos + custoOutros;
  const custoTotalLote = Number(prod?.custoTotal) || (somaCustosEtapas > 0 ? somaCustosEtapas : totalCostura);

  const pagsList: any[] = prod?.pagamentos || prod?.pagamentosCostura || [];
  const sumPags = (cat: string) => pagsList
    .filter((p: any) => p?.categoria && typeof p.categoria === "string" && p.categoria.toLowerCase().includes(cat.toLowerCase()))
    .reduce((acc: number, p: any) => acc + (Number(p?.valor) || 0), 0);

  // Se marcado como PAGO diretamente no lote ou lote quitado, a etapa está 100% paga!
  const isLotePreviamenteQuitado = prod?.statusPagamento === "Pago";

  const pagoTecido = (prod?.pagoTecido || isLotePreviamenteQuitado) ? custoTecido : Math.min(custoTecido, sumPags("tecido"));
  const pagoCorte = (prod?.pagoCorte || isLotePreviamenteQuitado) ? custoCorte : Math.min(custoCorte, sumPags("corte"));
  const pagoModelagem = (prod?.pagoModelagem || isLotePreviamenteQuitado) ? custoModelagem : Math.min(custoModelagem, sumPags("modelagem"));
  const pagoRisco = (prod?.pagoRisco || isLotePreviamenteQuitado) ? custoRisco : Math.min(custoRisco, sumPags("risco"));
  const pagoInsumos = (prod?.pagoInsumos || isLotePreviamenteQuitado) ? custoInsumos : Math.min(custoInsumos, sumPags("insumo") + sumPags("aviamento"));
  const pagoOutros = (prod?.pagoOutros || isLotePreviamenteQuitado) ? custoOutros : Math.min(custoOutros, sumPags("outro"));

  // Costura:
  const sumPagsCostura = pagsList
    .filter((p: any) => !p?.categoria || (typeof p.categoria === "string" && p.categoria.toLowerCase().includes("costura")))
    .reduce((acc: number, p: any) => acc + (Number(p?.valor) || 0), 0);

  const isCosturaPaga = Boolean(
    prod?.pagoCostura === true ||
    isLotePreviamenteQuitado ||
    (totalCostura > 0 && (Number(prod?.totalPagoCostura) || sumPagsCostura) >= totalCostura)
  );

  const totalPagoCostura = isCosturaPaga
    ? Math.max(totalCostura, Number(prod?.totalPagoCostura) || 0, sumPagsCostura)
    : Math.max(Number(prod?.totalPagoCostura) || 0, sumPagsCostura);

  const saldoCostura = isCosturaPaga ? 0 : Math.max(0, totalCostura - totalPagoCostura);

  // Pagamentos avulsos
  const sumPagsAvulsos = pagsList
    .filter((p: any) => p?.categoria && !["costura", "corte", "tecido", "modelagem", "risco", "insumo", "aviamento", "outro"].some(c => p.categoria.toLowerCase().includes(c)))
    .reduce((acc: number, p: any) => acc + (Number(p?.valor) || 0), 0);

  // Soma de todos os pagamentos realizados / marcados como pagos
  const totalPagoCalculado = pagoTecido + pagoCorte + pagoModelagem + pagoRisco + totalPagoCostura + pagoInsumos + pagoOutros + sumPagsAvulsos;
  const totalPagoLote = Math.max(totalPagoCalculado, Number(prod?.totalPago) || 0);

  const allStagesPaid = Boolean(
    (custoTecido === 0 || prod?.pagoTecido) &&
    (custoCorte === 0 || prod?.pagoCorte) &&
    (custoModelagem === 0 || prod?.pagoModelagem) &&
    (custoRisco === 0 || prod?.pagoRisco) &&
    (totalCostura === 0 || prod?.pagoCostura || isCosturaPaga) &&
    (custoInsumos === 0 || prod?.pagoInsumos) &&
    (custoOutros === 0 || prod?.pagoOutros)
  );

  const isLoteQuitado = Boolean(
    isLotePreviamenteQuitado ||
    allStagesPaid ||
    (custoTotalLote > 0 && totalPagoLote >= custoTotalLote)
  );

  const saldoPendenteLote = isLoteQuitado ? 0 : Math.max(0, custoTotalLote - totalPagoLote);

  return {
    custoTecido,
    custoCorte,
    custoModelagem,
    custoRisco,
    custoInsumos,
    custoOutros,
    custoCosturaUnitario,
    totalCostura,
    pagoTecido,
    pagoCorte,
    pagoModelagem,
    pagoRisco,
    pagoInsumos,
    pagoOutros,
    totalPagoCostura,
    saldoCostura,
    isCosturaPaga,
    custoTotalLote,
    totalPagoLote: isLoteQuitado ? Math.max(totalPagoLote, custoTotalLote) : totalPagoLote,
    saldoPendenteLote,
    isLoteQuitado,
  };
}
