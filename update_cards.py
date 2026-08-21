import re

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "r") as f:
    text = f.read()

# Replace PURPLE_COLORS with Dashboard pie colors
text = text.replace("['#6D4AFF', '#8B6FFF', '#4F31CC', '#A38FFF', '#351F99', '#C3B5FF', '#221466']", "['#ECE8FF', '#94A3B8', '#6D4AFF', '#4F46E5']")

old_cards = """  const RenderExecutiveCards = () => (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
           { title: 'Aguardando Conf.', value: aguardandoConf, icon: Box, trend: '+2', trendUp: false, alert: aguardandoConf > 0 },
           { title: 'Reputação Pendente', value: pendentesTratativa, icon: AlertCircle, trend: '-1', trendUp: true, alert: pendentesTratativa > 0 },
           { title: 'Devoluções Mês', value: thisMonthTotal, icon: Package, trend: '+12%', trendUp: false },
           { title: 'Prejuízo Fretes', value: formatCurrency(freightLoss, false), icon: TrendingDown, trend: '-2%', trendUp: true },
           { title: 'Total Devolvido', value: formatCurrency(totalDevolvido, false), icon: RefreshCw, trend: '', trendUp: false },
           { title: 'Taxa de Conf.', value: `${confRate}%`, icon: CheckCircle2, trend: '+2%', trendUp: true },
        ].map((card, i) => (
           <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all overflow-hidden relative group">
                 <CardContent className="p-5 flex flex-col gap-3 relative z-10">
                    <div className="flex justify-between items-start">
                       <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", card.alert ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                          <card.icon className="w-5 h-5" />
                       </div>
                       <div className={cn("flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full", card.trendUp ? "text-foreground bg-foreground/5" : "text-muted-foreground bg-muted/50")}>
                          {card.trendUp ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                          {card.trend}
                       </div>
                    </div>
                    <div>
                       <div className="text-[12px] font-bold text-muted-foreground tracking-wide mt-2">{card.title}</div>
                       <div className="text-[24px] font-black text-foreground mt-1 tracking-tight">{card.value}</div>
                    </div>
                 </CardContent>
                 <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity", card.alert ? "from-destructive/5 to-transparent" : "from-primary/5 to-transparent")} />
              </Card>
           </motion.div>
        ))}
     </div>
  );"""

new_cards = """  const RenderExecutiveCards = () => (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
           { title: 'Aguardando Conf.', value: aguardandoConf, icon: Box, trend: '+2', trendUp: false, alert: aguardandoConf > 0 },
           { title: 'Reputação Pendente', value: pendentesTratativa, icon: AlertCircle, trend: '-1', trendUp: true, alert: pendentesTratativa > 0 },
           { title: 'Devoluções Mês', value: thisMonthTotal, icon: Package, trend: '+12%', trendUp: false },
           { title: 'Prejuízo Fretes', value: formatCurrency(freightLoss, false), icon: TrendingDown, trend: '-2%', trendUp: true },
           { title: 'Total Devolvido', value: formatCurrency(totalDevolvido, false), icon: RefreshCw, trend: '', trendUp: false },
           { title: 'Taxa de Conf.', value: `${confRate}%`, icon: CheckCircle2, trend: '+2%', trendUp: true },
        ].map((card, i) => (
           <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cn("rounded-[24px] p-6 shadow-soft flex flex-col justify-between group hover:-translate-y-1.5 transition-transform duration-300 relative overflow-hidden border", card.alert ? "bg-destructive/5 border-destructive/20 text-foreground" : "bg-card text-foreground border-border")}>
              <div className="flex justify-between items-start mb-4">
                 <div className={cn("w-12 h-12 rounded-[16px] flex items-center justify-center group-hover:scale-110 transition-transform", card.alert ? "bg-destructive text-destructive-foreground" : "bg-secondary text-primary")}>
                    <card.icon className="w-6 h-6" />
                 </div>
                 {card.trend && (
                    <div className={cn("flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full", card.alert ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted/50")}>
                       {card.trendUp ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                       {card.trend}
                    </div>
                 )}
              </div>
              <div>
                 <p className={cn("text-[11px] font-bold uppercase tracking-widest mb-1", card.alert ? "text-destructive/80" : "text-muted-foreground")}>{card.title}</p>
                 <div className="flex items-end gap-3">
                    <p className="text-2xl font-black tracking-tight">{card.value}</p>
                 </div>
              </div>
           </motion.div>
        ))}
     </div>
  );"""

text = text.replace(old_cards, new_cards)

# Also style the charts cards
old_chart_card = """                     <Card className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] xl:col-span-2">"""
new_chart_card = """                     <Card className="rounded-[24px] border border-border bg-card shadow-soft xl:col-span-2">"""
text = text.replace(old_chart_card, new_chart_card)

old_chart_card2 = """                     <Card className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">"""
new_chart_card2 = """                     <Card className="rounded-[24px] border border-border bg-card shadow-soft">"""
text = text.replace(old_chart_card2, new_chart_card2)

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "w") as f:
    f.write(text)
