import re

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "r") as f:
    text = f.read()

# 1. Filter logic
old_filter = """  const filteredReturns = returns.filter(r => {
    if (!showFinished && r.overallStatus === 'Finalizado' && filterStatus !== 'Finalizado') return false;"""
new_filter = """  const filteredReturns = returns.filter(r => {
    const isRepPending = ['Pendente', 'Verificar', 'Em Tratativa'].includes(r.reputationStatus);
    if (!showFinished && r.overallStatus === 'Finalizado' && filterStatus !== 'Finalizado' && !isRepPending) return false;"""
text = text.replace(old_filter, new_filter)

# 2. Delete button fix (the button is working, but confirm() might fail, let's remove confirm)
old_delete = """  const handleDelete = async (id: string) => {
    try {
      if (!confirm("Tem certeza que deseja excluir esta devolução?")) return;
      await deleteDoc(doc(db, 'returns', id));"""
new_delete = """  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'returns', id));"""
text = text.replace(old_delete, new_delete)

# 3. Taxa Conf. Card -> Total
old_cards = """           { title: 'Taxa de Conf.', value: `${confRate}%`, icon: CheckCircle2, trend: '+2%', trendUp: true },"""
new_cards = """           { title: 'Custo Total', value: formatCurrency(totalDevolvido + freightLoss, false), icon: DollarSign, trend: '', trendUp: false },"""
text = text.replace(old_cards, new_cards)

# 4. Table header
old_thead = """                                 <thead className="bg-muted/20">
                                    <tr>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap">Produto</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap">Pedido / Cliente</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap">Motivo</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap">Status</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap text-right">Valores</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap text-right">Ações</th>
                                    </tr>
                                 </thead>"""
new_thead = """                                 <thead className="bg-muted/20">
                                    <tr>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap">Produto</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap">Pedido / Cliente</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap">Motivo</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap text-center">Conferência</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap text-center">Reputação</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap text-center">Destino</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap text-right">Valores</th>
                                       <th className="px-6 py-4 text-[11px] font-black text-muted-foreground tracking-wider uppercase border-b border-border/40 whitespace-nowrap text-right">Ações</th>
                                    </tr>
                                 </thead>"""
text = text.replace(old_thead, new_thead)

# Replace colSpan
text = text.replace('colSpan={6}', 'colSpan={8}')

# 5. Table body (Columns)
old_status_cell = """                                             <td className="px-6 py-4 space-y-2">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                   <span className={cn("px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap", getBadgeStyle(r.overallStatus))}>
                                                      Conf: {r.overallStatus}
                                                   </span>
                                                   <span className={cn("px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap", getBadgeStyle(r.reputationStatus))}>
                                                      Rep: {r.reputationStatus}
                                                   </span>
                                                </div>
                                             </td>"""
new_status_cell = """                                             <td className="px-6 py-4 text-center">
                                                <span className={cn("px-3.5 py-1.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border", 
                                                   r.overallStatus === 'Finalizado' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                                                   r.overallStatus === 'Conferido' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                                                   'bg-yellow-500/10 text-yellow-600 border-yellow-500/20')}>
                                                   {r.overallStatus}
                                                </span>
                                             </td>
                                             <td className="px-6 py-4 text-center">
                                                <span className={cn("px-3.5 py-1.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border", 
                                                   r.reputationStatus === 'Impactou Reputação' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 
                                                   r.reputationStatus === 'Não Impactou Reputação' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                                                   r.reputationStatus === 'Em Tratativa' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 
                                                   'bg-yellow-500/10 text-yellow-600 border-yellow-500/20')}>
                                                   {r.reputationStatus}
                                                </span>
                                             </td>
                                             <td className="px-6 py-4 text-center">
                                                <span className={cn("px-3.5 py-1.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border", 
                                                   r.productStatus === 'Retorno estoque' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                                                   r.productStatus === 'Produto errado' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 
                                                   r.productStatus === 'Reparo' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                                                   'bg-orange-500/10 text-orange-600 border-orange-500/20')}>
                                                   {r.productStatus}
                                                </span>
                                             </td>"""
text = text.replace(old_status_cell, new_status_cell)


with open("src/views/Devolucoes/ControleDevolucoes.tsx", "w") as f:
    f.write(text)
