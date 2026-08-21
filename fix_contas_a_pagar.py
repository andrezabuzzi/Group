import re

with open('src/views/Financeiro/ContasAPagar.tsx', 'r') as f:
    content = f.read()

# 1. Update KPI CARDS to be always purple
kpi_replacement = """      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {[
          { label: 'Total a Pagar', value: stats.totalAPagar, icon: DollarSign },
          { label: 'Atrasado', value: stats.atrasado, icon: AlertTriangle },
          { label: 'Vence Hoje', value: stats.venceHoje, icon: Clock },
          { label: 'Próximos 7 Dias', value: stats.vence7Dias, icon: CalendarIcon },
          { label: 'Cartões', value: stats.cartaoCredito, icon: CreditCard },
          { label: 'Boletos', value: stats.boletos, icon: FileText },
          { label: 'Investimentos', value: stats.investimentosLP, icon: TrendingUp },
        ].map((kpi, i) => (
           <div key={i} className="bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] rounded-[24px] p-5 flex flex-col justify-between shadow-[0_8px_30px_rgba(109,74,255,0.2)] hover:scale-[1.02] transition-transform duration-300">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-[12px] font-[700] text-white/90 leading-tight uppercase tracking-wider">{kpi.label}</span>
                 <div className="w-10 h-10 rounded-[14px] bg-white/20 text-white flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <kpi.icon size={18} strokeWidth={2.5} />
                 </div>
              </div>
              <span className="text-[20px] font-[900] text-white tracking-tight">
                 {formatCurrency(kpi.value, privacyMode)}
              </span>
           </div>
        ))}
      </div>"""

# Replace KPI CARDS section
# Match from {/* KPI CARDS */} up to {/* MAIN GRID... */}
content = re.sub(
    r'\{\/\*\s*KPI CARDS\s*\*\/\}.*?\{\/\*\s*MAIN GRID: INSIGHTS \+ CHARTS \+ RESUMO\s*\*\/\}',
    kpi_replacement + '\n\n      {/* MAIN GRID: INSIGHTS + CHARTS + RESUMO */}',
    content,
    flags=re.DOTALL
)

# 2. Change lg:col-span-3 to lg:col-span-12
content = content.replace(
    """<div className="lg:col-span-3 flex flex-col gap-6">""",
    """<div className="lg:col-span-12 flex flex-col gap-6">"""
)

with open('src/views/Financeiro/ContasAPagar.tsx', 'w') as f:
    f.write(content)
