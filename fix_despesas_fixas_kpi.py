import re

with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

kpi_replacement = """      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { title: "Total de Despesas", value: stats.totalFixas, icon: Wallet },
          { title: "Pago no Mês", value: stats.totalPago, icon: CheckCircle },
          { title: "Pendente", value: stats.totalPendente, icon: Calendar },
          { title: "Atrasado", value: stats.totalAtrasado, icon: AlertCircle },
          { title: "Maior Despesa", value: stats.maiorDespesa.value, icon: TrendingUp },
          { title: "Vence em 7 dias", value: stats.proxVencimentos, icon: Clock, isCount: true }
        ].map((kpi, idx) => (
           <div key={idx} className="bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] rounded-[24px] p-5 flex flex-col justify-between shadow-[0_8px_30px_rgba(109,74,255,0.2)] hover:scale-[1.02] transition-transform duration-300">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-[12px] font-[700] text-white/90 leading-tight uppercase tracking-wider">{kpi.title}</span>
                 <div className="w-10 h-10 rounded-[14px] bg-white/20 text-white flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <kpi.icon size={18} strokeWidth={2.5} />
                 </div>
              </div>
              <span className="text-[20px] font-[900] text-white tracking-tight">
                 {kpi.isCount ? kpi.value : (privacyMode ? '••••' : formatValue(kpi.value))}
              </span>
           </div>
        ))}
      </div>"""

content = re.sub(
    r'\{\/\*\s*KPIs\s*\*\/\}.*?\{\/\*\s*MAIN COLUMN\s*\*\/\}',
    kpi_replacement + '\n\n      {/* MAIN COLUMN */}',
    content,
    flags=re.DOTALL
)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)
