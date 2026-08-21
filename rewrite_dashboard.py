import re

with open('src/views/Dashboard.tsx', 'r') as f:
    content = f.read()

# Find the start of the return statement
match = re.search(r'  if \(loading\) \{.*?  return \(', content, flags=re.DOTALL)
if not match:
    print("Could not find return statement")
    exit(1)

start_idx = match.end() - 9 # to keep '  return ('

logic_part = content[:start_idx]

jsx_part = """  return (
    <div className="w-full min-h-screen pb-24 transition-colors duration-300 bg-background text-foreground font-sans">
      <PageHeader 
        title="Dashboard Executivo" 
        subtitle="Visão geral da operação financeira, produção, devoluções, tarefas e alertas."
        hideValues={hideValues}
        onToggleHideValues={() => setHideValues(!hideValues)}
        filters={
          <>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[140px] h-12 rounded-2xl premium-input text-[14px] font-semibold shadow-sm border bg-white dark:bg-[#181B24] dark:border-[#2A2F3D]">
                <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-0 shadow-xl dark:bg-[#181B24]">
                  <SelectItem value="Este Mês">Este Mês</SelectItem>
                  <SelectItem value="Semana">Esta Semana</SelectItem>
              </SelectContent>
            </Select>
            <Select value={empresa} onValueChange={setEmpresa}>
              <SelectTrigger className="w-[220px] h-12 rounded-2xl premium-input text-[14px] font-semibold shadow-sm border bg-white dark:bg-[#181B24] dark:border-[#2A2F3D]">
                <Building2 className="w-4 h-4 mr-2 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-0 shadow-xl dark:bg-[#181B24]">
                  <SelectItem value="ConfecçãoPro Matriz">ConfecçãoPro Matriz</SelectItem>
                  <SelectItem value="Todas">Todas Empresas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={canal} onValueChange={setCanal}>
              <SelectTrigger className="w-[180px] h-12 rounded-2xl premium-input text-[14px] font-semibold shadow-sm border bg-white dark:bg-[#181B24] dark:border-[#2A2F3D]">
                <MonitorSmartphone className="w-4 h-4 mr-2 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-0 shadow-xl dark:bg-[#181B24]">
                  <SelectItem value="Todos os Canais">Todos os Canais</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[1440px] mx-auto px-6 lg:px-10 mt-10 grid grid-cols-1 md:grid-cols-12 gap-10"
      >
         {/* FINANCEIRO */}
         <section className="col-span-1 md:col-span-12 flex flex-col">
            <SectionHeader title="Financeiro" subtitle="Resumo de despesas, faturamento, metas e compromissos do período." linkText="Ver relatório" linkUrl="/financeiro/relatorios" />
            
            <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-8 mb-8">
               <CardKPI icon={CalendarDays} title="Despesas Fixas" value={totalFixed} hide={hideValues} isCurrency trend={-6} className="xl:col-span-2 md:col-span-2" />
               <CardKPI icon={TrendingDown} title="Despesas Variáveis" value={totalVariable} hide={hideValues} isCurrency trend={10} trendUpIsGood={false} className="xl:col-span-2 md:col-span-2" />
               <CardKPI icon={Receipt} title="Contas a Pagar" value={totalAccountsPayable} hide={hideValues} isCurrency subtitle={`${qtyAccountsPayable} títulos pendentes`} className="xl:col-span-2 md:col-span-2" />
               <CardKPI icon={Coins} title="Faturamento Realizado" value={faturamento} hide={hideValues} isCurrency trend={16} className="xl:col-span-3 md:col-span-3" />
               <CardKPI icon={Target} title="Meta do Período" value={totalMeta} hide={hideValues} isCurrency className="xl:col-span-3 md:col-span-3" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
               <div className="xl:col-span-8 premium-card p-8 flex flex-col h-[420px]">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-[16px] font-semibold text-foreground">Faturamento vs Meta</h3>
                     <div className="flex items-center gap-6 text-[14px] font-medium text-muted-foreground">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary"></span> Realizado</div>
                        <div className="flex items-center gap-2"><span className="w-5 h-[2px] border-b-2 border-dashed border-muted-foreground"></span> Meta</div>
                     </div>
                  </div>
                  <div className="flex-1 w-full h-full min-h-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                           { name: 'Semana 1', real: 40000, meta: 50000 },
                           { name: 'Semana 2', real: 85000, meta: 100000 },
                           { name: 'Semana 3', real: 120000, meta: 150000 },
                           { name: 'Semana 4', real: 160000, meta: 200000 },
                           { name: 'Semana 5', real: faturamento, meta: totalMeta }
                        ]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cBorder} opacity={0.4} />
                           <XAxis dataKey="name" fontSize={13} fontWeight={500} axisLine={false} tickLine={false} tick={{fill: cTextSec}} dy={15} />
                           <YAxis fontSize={13} fontWeight={500} axisLine={false} tickLine={false} tick={{fill: cTextSec}} tickFormatter={(val) => `R$ ${val/1000}k`} />
                           <Tooltip cursor={{stroke: cBorder, strokeWidth: 1, strokeDasharray: '4 4'}} contentStyle={{borderRadius:'24px', border:`1px solid ${cBorder}`, background: cardBg, color: cText, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '16px'}} />
                           <Line type="monotone" dataKey="real" stroke={cPrimary} strokeWidth={4} dot={{r: 6, fill: cPrimary, strokeWidth: 3, stroke: cardBg}} activeDot={{r: 10}} animationDuration={1500} />
                           <Line type="monotone" dataKey="meta" stroke={cTextSec} strokeWidth={2} strokeDasharray="5 5" dot={false} opacity={0.6} animationDuration={1500} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="xl:col-span-4 premium-card p-8 flex flex-col h-[420px]">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-[16px] font-semibold text-foreground">Progresso da Meta</h3>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center relative">
                     <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                           <Pie data={[{value: percAtingido}, {value: 100-percAtingido}]} innerRadius={90} outerRadius={120} dataKey="value" stroke="none" startAngle={90} endAngle={-270} animationDuration={1500}>
                              <Cell fill={cPrimary} />
                              <Cell fill={cBorder} opacity={0.5} />
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                        <span className="text-[46px] font-bold text-foreground leading-none mb-1">{percAtingido.toFixed(0)}%</span>
                        <span className="text-[14px] font-medium text-muted-foreground">Concluído</span>
                     </div>
                  </div>
                  <div className="mt-6 text-center">
                     <p className="text-[24px] font-bold text-foreground">{hideValues ? '••••' : formatCurrency(faltante, false)}</p>
                     <p className="text-[14px] font-medium text-muted-foreground mt-1">Faltando para bater a meta</p>
                  </div>
               </div>
            </div>
         </section>

         {/* PRODUÇÃO */}
         <section className="col-span-1 md:col-span-12 flex flex-col mt-4">
            <SectionHeader title="Produção" subtitle="Acompanhamento de peças produzidas, entregas e pagamentos." linkText="Ver produção" linkUrl="/producao" />
            <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-8">
               <CardKPI icon={Package} title="Peças Cortadas (Mês)" value={totalPecasMes} hide={hideValues} className="xl:col-span-3 md:col-span-3" />
               <CardKPI icon={CheckCircle2} title="Peças Entregues" value={totalEntregue} hide={hideValues} className="xl:col-span-3 md:col-span-3" />
               <CardKPI icon={AlertCircle} title="Pendente Entrega" value={pendenteEntrega} hide={hideValues} className="xl:col-span-3 md:col-span-3" />
               <CardKPI icon={Receipt} title="Pendente Pagamento" value={pendentePgto} hide={hideValues} isCurrency className="xl:col-span-3 md:col-span-3" />
            </div>
         </section>

         {/* DEVOLUÇÕES & TAREFAS (Split row) */}
         <div className="col-span-1 md:col-span-12 grid grid-cols-1 xl:grid-cols-12 gap-10 mt-4">
            <section className="xl:col-span-6 flex flex-col">
               <SectionHeader title="Devoluções" subtitle="Resumo de itens devolvidos e impacto financeiro." linkText="Ver devoluções" linkUrl="/devolucoes/controle" />
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-[200px]">
                  <CardKPI icon={AlertTriangle} title="Devoluções (Mês)" value={totalReturnsItems} hide={hideValues} className="col-span-1 justify-center" compact />
                  <CardKPI icon={TrendingDown} title="Custo de Frete" value={returnFreightCost} hide={hideValues} isCurrency trendUpIsGood={false} className="col-span-1 justify-center" compact />
                  <CardKPI icon={Coins} title="Custo Produtos" value={returnOrderValue} hide={hideValues} isCurrency trendUpIsGood={false} className="col-span-1 justify-center" compact />
               </div>
            </section>
            
            <section className="xl:col-span-6 flex flex-col">
               <SectionHeader title="Tarefas" subtitle="Acompanhamento das atividades da operação." linkText="Ver tarefas" linkUrl="/performance/tarefas" />
               <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 h-[200px]">
                  <CardTarefa label="Pendentes" val={tarefasPendentes} />
                  <CardTarefa label="Em andamento" val={tarefasAndamento} />
                  <CardTarefa label="Urgentes" val={tarefasUrgentes} urgent />
                  <CardTarefa label="Atrasadas" val={tarefasAtrasadas} urgent />
                  <CardTarefa label="Vencem hoje" val={tarefasVencemHoje} />
                  <CardTarefa label="Concluídas" val={tarefasConcluidas} />
               </div>
            </section>
         </div>

         {/* ALERTAS */}
         <section className="col-span-1 md:col-span-12 flex flex-col mt-4">
            <SectionHeader title="Atenção Necessária" subtitle="Pontos que precisam de ação." linkText="Ver todos" linkUrl="#" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <AlertList 
                  icon={Clock} 
                  title="Produções Atrasadas" 
                  count={prodAtrasadas.length}
                  items={prodAtrasadas.slice(0,4).map((p:any) => ({
                     title: p.produtoNome,
                     desc: `Lote ${p.id.slice(0,4)}`,
                     value: `${p.quantidadeTotal} un`
                  }))}
                  action="Ver atrasos"
               />
               <AlertList 
                  icon={Receipt} 
                  title="Próximos Pagamentos" 
                  count={6}
                  items={[
                     {title: 'Fornecedor Tecidos', value: 'R$ 8.400', desc: 'Em 2 dias'},
                     {title: 'Malharia São José', value: 'R$ 6.250', desc: 'Em 4 dias'},
                     {title: 'Logística Express', value: 'R$ 2.150', desc: 'Em 6 dias'},
                  ]}
                  action="Ver pagamentos"
               />
               <AlertList 
                  icon={CalendarDays} 
                  title="Tarefas Vencendo" 
                  count={8}
                  items={nextTasks.map((t:any) => ({
                     title: t.title,
                     desc: t.assignee,
                     value: t.prazo || 'Hoje'
                  }))}
                  action="Ver tarefas"
               />
            </div>
         </section>

      </motion.div>
    </div>
  );
}

// --- DESIGN SYSTEM SUBCOMPONENTS ---

function SectionHeader({ title, subtitle, linkText, linkUrl }: any) {
   const navigate = useNavigate();
   return (
      <div className="flex items-center justify-between mb-8 mt-4">
         <div>
            <h2 className="text-[28px] font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="text-[14px] font-medium text-muted-foreground mt-1.5">{subtitle}</p>
         </div>
         <Button variant="ghost" className="h-12 px-6 rounded-2xl text-[14px] font-semibold text-primary hover:bg-primary/5 hover:text-primary transition-colors group shadow-sm bg-white dark:bg-card border border-border" onClick={() => navigate(linkUrl)}>
            {linkText} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
         </Button>
      </div>
   );
}

function CardKPI({ icon: Icon, title, value, hide, isCurrency, trend, trendUpIsGood = true, subtitle, compact, className }: any) {
  return (
    <div className={cn("premium-card flex flex-col justify-between group", compact ? "p-6" : "p-8", className)}>
      <div className={cn("flex flex-col gap-4", compact ? "mb-4" : "mb-8")}>
         <div className={cn("rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110", compact ? "w-10 h-10" : "w-12 h-12")}>
            <Icon size={compact ? 20 : 24} strokeWidth={2.5}/>
         </div>
         <h3 className="text-[16px] font-semibold text-muted-foreground leading-tight">{title}</h3>
      </div>
      <div>
         <p className={cn("font-bold tracking-tight text-foreground leading-none mb-2", compact ? "text-[28px]" : "text-[38px]")} >
            {hide ? '••••' : (isCurrency ? formatCurrency(value, false) : value.toLocaleString('pt-BR'))}
         </p>
         {trend !== undefined && (
            <div className="flex items-center gap-2 mt-4">
               <span className={cn("flex items-center gap-1 text-[13px] font-bold px-2.5 py-1 rounded-xl", 
                   (trend > 0 && trendUpIsGood) || (trend < 0 && !trendUpIsGood) ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
               )}>
                  {trend > 0 ? <TrendingUp size={14} strokeWidth={3}/> : <TrendingDown size={14} strokeWidth={3}/>}
                  {Math.abs(trend)}%
               </span>
               <span className="text-[13px] font-medium text-muted-foreground" >vs mês passado</span>
            </div>
         )}
         {subtitle && (
            <div className="flex items-center gap-2 mt-4">
               <span className="text-[14px] font-bold text-foreground" >{subtitle.split(' ')[0]}</span>
               <span className="text-[13px] font-medium text-muted-foreground" >{subtitle.split(' ').slice(1).join(' ')}</span>
            </div>
         )}
      </div>
    </div>
  );
}

function CardTarefa({ label, val, urgent }: any) {
   return (
      <div className="premium-card p-4 flex flex-col items-center justify-center transition-all duration-300 hover:bg-muted/30 group col-span-1" >
         <p className="text-[13px] font-semibold text-muted-foreground text-center mb-3 leading-tight group-hover:text-foreground transition-colors" >{label}</p>
         <p className={cn("text-[32px] font-bold leading-none", urgent ? "text-red-500" : "text-foreground")} >{val}</p>
      </div>
   )
}

function AlertList({ icon: Icon, title, count, items, action }: any) {
   return (
      <div className="premium-card flex flex-col p-8" >
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon size={24} strokeWidth={2.5}/>
               </div>
               <h3 className="text-[18px] font-semibold text-foreground tracking-tight">{title}</h3>
            </div>
            {count > 0 && (
               <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-[14px] font-bold flex items-center justify-center">
                  {count}
               </span>
            )}
         </div>
         <div className="flex flex-col gap-6 flex-1">
            {items.map((item: any, i: number) => (
               <div key={i} className="flex justify-between items-center group cursor-pointer" >
                  <div className="flex flex-col gap-1">
                     <p className="text-[15px] font-medium text-foreground group-hover:text-primary transition-colors" >{item.title}</p>
                     <p className="text-[13px] font-medium text-muted-foreground" >{item.desc}</p>
                  </div>
                  <p className="text-[15px] font-semibold text-foreground" >{item.value}</p>
               </div>
            ))}
         </div>
         <Button variant="ghost" className="w-full mt-8 text-[14px] font-semibold h-12 text-primary hover:bg-primary/5 rounded-2xl transition-colors">
            {action}
         </Button>
      </div>
   )
}
"""

with open('src/views/Dashboard.tsx', 'w') as f:
    f.write(logic_part + jsx_part)
