import re

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

kpi_replacement = """      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
        {[
          { title: "Total Variável", value: stats.totalVar, icon: Wallet },
          { title: "Maior Despesa", value: stats.maiorCat.value, icon: TrendingUp },
          { title: "Qtd. Despesas", value: stats.listCount, icon: FileText, isCount: true },
          { title: "Média por Despesa", value: stats.ticketMedio, icon: BarChartIcon }
        ].map((kpi, idx) => (
           <div key={idx} className="bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] rounded-[24px] p-5 flex flex-col justify-between shadow-[0_8px_30px_rgba(109,74,255,0.2)] hover:scale-[1.02] transition-transform duration-300">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-[12px] font-[700] text-white/90 leading-tight uppercase tracking-wider">{kpi.title}</span>
                 <div className="w-10 h-10 rounded-[14px] bg-white/20 text-white flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <kpi.icon size={18} strokeWidth={2.5} />
                 </div>
              </div>
              <span className="text-[20px] font-[900] text-white tracking-tight">
                 {kpi.isCount ? kpi.value : formatCurrency(kpi.value, privacyMode)}
              </span>
           </div>
        ))}
      </div>"""

content = re.sub(
    r'\{\/\*\s*KPIs\s*\*\/\}.*?\{\/\*\s*TABS\s*\*\/\}',
    kpi_replacement + '\n\n      {/* TABS */}',
    content,
    flags=re.DOTALL
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
