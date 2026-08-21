import re

with open('src/views/Financeiro/RelatoriosFinanceiros.tsx', 'r') as f:
    content = f.read()

replacement = """          {/* Main Top Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 flex-none overflow-x-auto hide-scrollbar pb-2">
            {[
              { title: "Despesas Fixas", value: totalFixas, icon: Building2 },
              { title: "Despesas Variáveis", value: totalVar, icon: ShoppingBag },
              { title: "Contas a Pagar", value: totalPagar, icon: Calendar },
              { title: "Custo Total (Período)", value: totalGeral, icon: TrendingDown },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] rounded-[24px] p-5 flex flex-col justify-between shadow-[0_8px_30px_rgba(109,74,255,0.2)] hover:scale-[1.02] transition-transform duration-300 min-w-[150px]">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[12px] font-[700] text-white/90 leading-tight uppercase tracking-wider">{kpi.title}</span>
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

content = re.sub(
    r'\{\/\*\s*Main Top Cards\s*\*\/\}.*?<\/Card>\s*<\/div>',
    replacement,
    content,
    flags=re.DOTALL
)

with open('src/views/Financeiro/RelatoriosFinanceiros.tsx', 'w') as f:
    f.write(content)
