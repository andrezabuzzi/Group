import re

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

kpis_html = """      {/* KPIs */}
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

content = re.sub(
    r"      \{\/\* KPIs \*\/\}[\s\S]*?      <\/div>",
    kpis_html,
    content
)

# Header replacement
content = re.sub(
    r"      <div className=\"flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4\">[\s\S]*?<\/div>[\s\n]*<\/div>[\s\n]*\{\/\* KPIs",
    """      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-[34px] font-[800] text-[#111827] dark:text-white tracking-tight">Despesas Variáveis</h1>
             <Button variant="ghost" size="icon" onClick={togglePrivacy} className="rounded-full text-muted-foreground hover:bg-[#6D4AFF]/10 hover:text-[#6D4AFF]">
                {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
             </Button>
          </div>
          <p className="text-[15px] font-[500] text-[#6B7280] dark:text-[#A8B0C0] mt-1">
            Registro de custos não recorrentes e compras pontuais.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-[#6D4AFF] dark:bg-[#7B61FF] hover:bg-[#6D4AFF]/90 text-white shadow-lg shadow-[#6D4AFF]/20 active:scale-95 transition-all rounded-[18px] px-6 h-12 border-none font-bold flex-1 md:flex-none">
            <Plus size={18} className="mr-2" strokeWidth={3} /> Nova Despesa Variável
          </Button>
        </div>
      </div>\n      {/* KPIs""",
    content
)

# Remove charts
content = re.sub(
    r"      \{\/\* GRÁFICOS \*\/\}[\s\S]*?<\/div>[\s\n]*<\/div>[\s\n]*\{\/\* LISTAGEM",
    "      {/* LISTAGEM",
    content
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
