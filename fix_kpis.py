import re

with open('src/views/Financeiro/ContasAPagar.tsx', 'r') as f:
    content = f.read()

# I will replace the whole KPI CARDS block down to MAIN GRID
kpi_replacement = """      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label: 'Total a Pagar', value: stats.totalAPagar, icon: DollarSign },
          { label: 'Atrasado', value: stats.atrasado, icon: AlertTriangle },
          { label: 'Vence Hoje', value: stats.venceHoje, icon: Clock },
          { label: 'Próximos 7 Dias', value: stats.vence7Dias, icon: CalendarIcon },
          { label: 'Cartões', value: stats.cartaoCredito, icon: CreditCard },
          { label: 'Boletos', value: stats.boletos, icon: FileText },
          { label: 'Investimentos', value: stats.investimentosLP, icon: TrendingUp },
        ].map((kpi, i) => (
           <div key={i} className="bg-white dark:bg-[#181B24] rounded-[20px] p-4 flex flex-col justify-between border border-[#ECEFF5] dark:border-white/5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                 <span className="text-[12px] font-[600] text-[#6B7280] leading-tight uppercase tracking-wider">{kpi.label}</span>
                 <div className="w-8 h-8 rounded-full bg-[#6D4AFF]/10 text-[#6D4AFF] flex items-center justify-center flex-shrink-0">
                    <kpi.icon size={14} strokeWidth={2.5} />
                 </div>
              </div>
              <span className="text-[18px] font-[800] text-[#111827] dark:text-white tracking-tight">
                 {formatCurrency(kpi.value, privacyMode)}
              </span>
           </div>
        ))}
      </div>"""

content = re.sub(
    r"      \{\/\* KPI CARDS \*\/\}[\s\S]*?      \{\/\* MAIN GRID: INSIGHTS \+ CHARTS \+ RESUMO \*\/\}",
    kpi_replacement + "\n      {/* MAIN GRID: INSIGHTS + CHARTS + RESUMO */}",
    content
)

with open('src/views/Financeiro/ContasAPagar.tsx', 'w') as f:
    f.write(content)


# Also DespesasFixas.tsx has a similar problem
with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content_fixas = f.read()

kpi_replacement_fixas = """      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        {[
          { title: "Total de Despesas", value: stats.totalFixas, icon: Wallet },
          { title: "Pago no Mês", value: stats.totalPago, icon: CheckCircle },
          { title: "Pendente", value: stats.totalPendente, icon: Calendar },
          { title: "Atrasado", value: stats.totalAtrasado, icon: AlertCircle },
          { title: "Maior Despesa", value: stats.maiorDespesa.value, icon: TrendingUp },
          { title: "Vence em 7 dias", value: stats.proxVencimentos, icon: Clock, isCount: true }
        ].map((kpi, idx) => (
           <div key={idx} className="bg-white dark:bg-[#181B24] rounded-[20px] p-4 flex flex-col justify-between border border-[#ECEFF5] dark:border-white/5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                 <span className="text-[12px] font-[600] text-[#6B7280] leading-tight uppercase tracking-wider">{kpi.title}</span>
                 <div className="w-8 h-8 rounded-full bg-[#6D4AFF]/10 text-[#6D4AFF] flex items-center justify-center flex-shrink-0">
                    <kpi.icon size={14} strokeWidth={2.5} />
                 </div>
              </div>
              <span className="text-[18px] font-[800] text-[#111827] dark:text-white tracking-tight">
                 {kpi.isCount ? kpi.value : formatValue(kpi.value)}
              </span>
           </div>
        ))}
      </div>"""

content_fixas = re.sub(
    r"      \{\/\* KPIs \*\/\}[\s\S]*?      \{\/\* LISTAGEM \*\/\}",
    kpi_replacement_fixas + "\n      {/* LISTAGEM */}",
    content_fixas
)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content_fixas)


# Also DespesasVariaveis.tsx has a similar problem
with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content_var = f.read()

kpi_replacement_var = """      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3 mb-8">
        {[
          { title: "Total Variável", value: stats.totalVariavel, icon: Wallet },
          { title: "Maior Despesa", value: stats.maiorDespesa.value, icon: TrendingUp },
          { title: "Qtd. Despesas", value: stats.qtdDespesas, icon: FileText, isCount: true },
          { title: "Média por Despesa", value: stats.qtdDespesas ? (stats.totalVariavel / stats.qtdDespesas) : 0, icon: BarChartIcon }
        ].map((kpi, idx) => (
           <div key={idx} className="bg-white dark:bg-[#181B24] rounded-[20px] p-4 flex flex-col justify-between border border-[#ECEFF5] dark:border-white/5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                 <span className="text-[12px] font-[600] text-[#6B7280] leading-tight uppercase tracking-wider">{kpi.title}</span>
                 <div className="w-8 h-8 rounded-full bg-[#6D4AFF]/10 text-[#6D4AFF] flex items-center justify-center flex-shrink-0">
                    <kpi.icon size={14} strokeWidth={2.5} />
                 </div>
              </div>
              <span className="text-[18px] font-[800] text-[#111827] dark:text-white tracking-tight">
                 {kpi.isCount ? kpi.value : formatValue(kpi.value)}
              </span>
           </div>
        ))}
      </div>"""

content_var = re.sub(
    r"      \{\/\* KPIs \*\/\}[\s\S]*?      \{\/\* LISTAGEM \*\/\}",
    kpi_replacement_var + "\n      {/* LISTAGEM */}",
    content_var
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content_var)

