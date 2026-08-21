import re

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

replacement = """  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-8 w-full max-w-[1600px] mx-auto mb-20 md:mb-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
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
          <Button onClick={() => { resetForm(); setIsManualModalOpen(true); }} className="bg-[#6D4AFF] dark:bg-[#7B61FF] hover:bg-[#6D4AFF]/90 text-white shadow-lg shadow-[#6D4AFF]/20 active:scale-95 transition-all rounded-[18px] px-6 h-12 border-none font-bold flex-1 md:flex-none">
            <Plus size={18} className="mr-2" strokeWidth={3} /> Nova Despesa Variável
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3 mb-8">
        {[
          { title: "Total Variável", value: stats.totalVar, icon: Wallet },
          { title: "Maior Despesa", value: stats.maiorCat.value, icon: TrendingUp },
          { title: "Qtd. Despesas", value: stats.listCount, icon: FileText, isCount: true },
          { title: "Média por Despesa", value: stats.ticketMedio, icon: BarChartIcon }
        ].map((kpi, idx) => (
           <div key={idx} className="bg-white dark:bg-[#181B24] rounded-[20px] p-4 flex flex-col justify-between border border-[#ECEFF5] dark:border-white/5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                 <span className="text-[12px] font-[600] text-[#6B7280] leading-tight uppercase tracking-wider">{kpi.title}</span>
                 <div className="w-8 h-8 rounded-full bg-[#6D4AFF]/10 text-[#6D4AFF] flex items-center justify-center flex-shrink-0">
                    <kpi.icon size={14} strokeWidth={2.5} />
                 </div>
              </div>
              <span className="text-[18px] font-[800] text-[#111827] dark:text-white tracking-tight">
                 {kpi.isCount ? kpi.value : formatCurrency(kpi.value, privacyMode)}
              </span>
           </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex items-center gap-8 border-b border-[#ECEFF5] dark:border-white/5 mb-8">
        <button 
          onClick={() => setActiveTab('lista')}
          className={`pb-4 text-[15px] font-bold transition-all relative ${activeTab === 'lista' ? 'text-[#6D4AFF] dark:text-[#7B61FF]' : 'text-[#6B7280] hover:text-[#111827] dark:hover:text-white'}`}
        >
          Lançamentos Concluídos
          {activeTab === 'lista' && (
            <motion.div layoutId="dv-tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#6D4AFF] dark:bg-[#7B61FF] rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('pendentes')}
          className={`pb-4 text-[15px] font-bold transition-all relative flex items-center gap-2 ${activeTab === 'pendentes' ? 'text-[#6D4AFF] dark:text-[#7B61FF]' : 'text-[#6B7280] hover:text-[#111827] dark:hover:text-white'}`}
        >
          Pendentes de Categorização
          {stats.pendentesCount > 0 && (
            <span className="bg-[#ef4444] text-white text-[11px] px-2 py-0.5 rounded-full">{stats.pendentesCount}</span>
          )}
          {activeTab === 'pendentes' && (
            <motion.div layoutId="dv-tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#6D4AFF] dark:bg-[#7B61FF] rounded-t-full" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'lista' && (
          <motion.div key="lista" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* MAIN COLUMN */}"""

content = re.sub(
    r"  return \([\s\S]*?\{/\* MAIN COLUMN \*/\}",
    replacement,
    content
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
