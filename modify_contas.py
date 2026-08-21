import re

with open('src/views/Financeiro/ContasAPagar.tsx', 'r') as f:
    content = f.read()

# 1. Update Context
content = content.replace("const { isPessoal, privacyMode } = useAppContext();", "const { isPessoal, privacyMode, togglePrivacy } = useAppContext();")

# 2. Add Eye button to header
header_replacement = """      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-[34px] font-[800] text-[#111827] dark:text-white tracking-tight">Contas a Pagar</h1>
             <Button variant="ghost" size="icon" onClick={togglePrivacy} className="rounded-full text-muted-foreground hover:bg-[#6D4AFF]/10 hover:text-[#6D4AFF]">
                {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
             </Button>
          </div>
          <p className="text-[15px] font-[500] text-[#6B7280] dark:text-[#A8B0C0] mt-1">
            Controle todas as obrigações financeiras futuras da empresa.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button onClick={() => setIsNewAccountModalOpen(true)} className="bg-[#6D4AFF] dark:bg-[#7B61FF] hover:bg-[#6D4AFF]/90 text-white shadow-lg shadow-[#6D4AFF]/20 active:scale-95 transition-all rounded-[18px] px-6 h-12 border-none font-bold flex-1 md:flex-none">
            <Plus size={18} className="mr-2" strokeWidth={3} />
            Nova Conta a Pagar
          </Button>
        </div>
      </div>"""

content = re.sub(
    r"      <div className=\"flex flex-col md:flex-row justify-between items-start md:items-center gap-4\">.*?<\/div>[\s\n]*<\/div>",
    header_replacement,
    content,
    flags=re.DOTALL
)

# 3. Simplify KPI Cards (keep all purple/roxo)
kpis_html = """      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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
    r"      \{\/\* KPI CARDS - 8 Cards \*\/\}[\s\S]*?      </div>",
    kpis_html,
    content
)

# 4. Remove unwanted charts. The charts block starts with: {/* GRÁFICOS */}
# It contains: Fluxo Financeiro Futuro, Por Categoria, Previsão (Dias), Parcelas/Mês, Comprometimento
# The user asked to: remove "Por Categoria", "Comprometimento", "Parcelas/Mês".
# So we only keep "Fluxo Financeiro Futuro" and "Previsão (Dias)".

charts_html = """           {/* GRÁFICOS */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 shadow-sm border border-[#ECEFF5] dark:border-white/5">
                 <h3 className="text-[14px] font-[700] text-[#111827] dark:text-white mb-4 uppercase tracking-wider text-[#6B7280]">Fluxo Financeiro Futuro</h3>
                 <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={areaChartData}>
                          <defs>
                             <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#6D4AFF" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#6D4AFF" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#6B7280', fontWeight: 600}} dy={10}/>
                          <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} formatter={(val:number)=>formatCurrency(val,privacyMode)}/>
                          <Area type="monotone" dataKey="value" stroke="#6D4AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorArea)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 shadow-sm border border-[#ECEFF5] dark:border-white/5">
                 <h3 className="text-[14px] font-[700] text-[#111827] dark:text-white mb-4 uppercase tracking-wider text-[#6B7280]">Previsão (Dias)</h3>
                 <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={lineChartData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} dy={10}/>
                          <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} formatter={(val:number)=>formatCurrency(val,privacyMode)}/>
                          <Line type="monotone" dataKey="value" stroke="#6D4AFF" strokeWidth={3} dot={{r:3, fill: '#6D4AFF'}} />
                       </LineChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>"""

content = re.sub(
    r"           \{\/\* GRÁFICOS \*\/\}[\s\S]*?<\/div>[\s\n]*<\/div>",
    charts_html,
    content
)

# 5. Remove "Ações Rápidas" block
content = re.sub(
    r"           \{\/\* QUICK ACTIONS \*\/\}[\s\S]*?<\/div>[\s\n]*\{\/\* FILTERS \*\/\}",
    "           {/* FILTERS */}",
    content
)

with open('src/views/Financeiro/ContasAPagar.tsx', 'w') as f:
    f.write(content)
