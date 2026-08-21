import re

with open('src/views/Insumos.tsx', 'r') as f:
    content = f.read()

# Let's completely rewrite the JSX part to apply the new changes.
# Find the start of the return statement
return_match = re.search(r'^\s*return \(\s*<div', content, re.MULTILINE)

if return_match:
    idx = return_match.start()
    logic = content[:idx]
    
    # We remove the Categoria filter from logic if it exists (though it doesn't strictly hurt, we can just remove it from the UI).
    
    # Let's redefine the JSX block. We'll make the dialog max-w-[50vw] or max-w-[900px] and increase the spacing of its fields.
    
    jsx = """  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full max-w-[1500px] mx-auto p-4 md:p-8 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] font-bold text-foreground tracking-tight flex items-center gap-3">
             Compras e Insumos
          </h2>
          <p className="text-[15px] text-muted-foreground font-medium mt-1">Gerencie todas as compras da confecção.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all outline-none rounded-[18px] px-6 h-12 font-bold border-none shrink-0">
          <Plus size={18} className="mr-2" strokeWidth={3} />
          Nova Compra
        </Button>
      </div>

      {/* CARDS EXECUTIVOS (Reduced to 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div whileHover={{ y: -4 }} className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
             <DollarSign size={16}/>
             <span className="text-xs font-bold uppercase tracking-wider">Total Investido</span>
          </div>
          <div className="text-[24px] font-bold text-foreground">
             {(totalInvestido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="h-10 mt-2 opacity-50">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={monthlyData}><Area type="monotone" dataKey="value" stroke="#6D4AFF" fill="#6D4AFF" fillOpacity={0.2} strokeWidth={2}/></AreaChart>
             </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
             <ShoppingBag size={16}/>
             <span className="text-xs font-bold uppercase tracking-wider">Compras Mês</span>
          </div>
          <div className="text-[30px] font-bold text-foreground">
             {comprasDoMes}
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-auto">Unidades registradas</p>
        </motion.div>
      </div>

      {/* MAIN CONTENT AREA - NO SIDEBAR, FULL WIDTH TABLE */}
      <div className="space-y-6">
        
        {/* FILTROS MODERNOS PILLS */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
             <div className="flex flex-wrap gap-2 items-center">
                <Button variant={filterStatus === 'Todos' ? 'default' : 'outline'} onClick={() => setFilterStatus('Todos')} className={`rounded-[18px] h-9 px-4 font-bold text-[13px] ${filterStatus === 'Todos' ? 'bg-primary text-white border-none' : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground'}`}>
                   Todos
                </Button>
                <Button variant={filterStatus === 'Pendentes' ? 'default' : 'outline'} onClick={() => setFilterStatus('Pendentes')} className={`rounded-[18px] h-9 px-4 font-bold text-[13px] ${filterStatus === 'Pendentes' ? 'bg-primary text-white border-none' : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground'}`}>
                   Pendentes
                </Button>
                <Button variant={filterStatus === 'Pagos' ? 'default' : 'outline'} onClick={() => setFilterStatus('Pagos')} className={`rounded-[18px] h-9 px-4 font-bold text-[13px] ${filterStatus === 'Pagos' ? 'bg-primary text-white border-none' : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground'}`}>
                   Pagos
                </Button>
             </div>
             
             <div className="flex gap-2 bg-card p-1 rounded-[20px] border border-border/50 shadow-sm shrink-0">
               <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} onClick={() => setViewMode('cards')} className={`h-8 w-10 p-0 rounded-[16px] ${viewMode === 'cards' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                 <LayoutGrid size={16}/>
               </Button>
               <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} onClick={() => setViewMode('table')} className={`h-8 w-10 p-0 rounded-[16px] ${viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                 <List size={16}/>
               </Button>
             </div>
          </div>
        </div>

        {/* GRID / TABLE */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {[1,2,3,4].map(i => <div key={i} className="h-64 rounded-[24px] bg-muted animate-pulse"></div>)}
          </div>
        ) : filteredAndSortedCompras.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-16 bg-card border border-border/50 rounded-[32px]">
             <PackageOpen size={48} className="text-muted-foreground mb-4 opacity-50"/>
             <h3 className="text-xl font-bold mb-1">Nenhuma compra encontrada</h3>
             <p className="text-muted-foreground">Você ainda não registrou nenhuma compra ou insumo.</p>
           </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
               {filteredAndSortedCompras.map((compra) => {
                 const isPago = compra.statusPagamento === 'pago';
                 return (
                   <motion.div 
                     layout 
                     key={compra.id}
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     whileHover={{ y: -6, boxShadow: "0 20px 40px -10px rgba(109, 74, 255, 0.15)" }}
                     className="bg-card border border-border/50 rounded-[24px] p-6 shadow-sm flex flex-col group transition-all duration-300 relative overflow-hidden"
                   >
                      <div className="flex items-start justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[16px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <PackageOpen size={20}/>
                            </div>
                            <div className="min-w-0">
                               <h4 className="font-bold text-foreground text-base leading-tight line-clamp-1">{compra.descricao}</h4>
                               <p className="text-xs font-medium text-muted-foreground truncate">{compra.fornecedor || 'Fornecedor N/A'}</p>
                            </div>
                         </div>
                         
                         <DropdownMenu>
                           <DropdownMenuTrigger className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors outline-none shrink-0">
                             <MoreVertical size={16} />
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 font-medium shadow-xl border-border/50 bg-white/95 backdrop-blur-md">
                             <DropdownMenuItem onClick={() => setSelectedCompra(compra)} className="cursor-pointer gap-2 py-2.5 rounded-xl"><Eye size={16}/> Visualizar Detalhes</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => openEdit(compra)} className="cursor-pointer gap-2 py-2.5 rounded-xl"><Edit2 size={16}/> Editar Compra</DropdownMenuItem>
                             <DropdownMenuItem className="cursor-pointer gap-2 py-2.5 rounded-xl"><Copy size={16}/> Duplicar</DropdownMenuItem>
                             {!isPago && <DropdownMenuItem onClick={() => toggleStatus(compra)} className="cursor-pointer gap-2 py-2.5 rounded-xl text-primary"><CreditCard size={16}/> Registrar Pagamento</DropdownMenuItem>}
                             <div className="h-px bg-border/50 my-1"></div>
                             <DropdownMenuItem onClick={() => setDeleteConfirmId(compra.id)} className="cursor-pointer gap-2 py-2.5 rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 size={16}/> Excluir</DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                      </div>

                      <div className="mb-4">
                         <div className="text-[30px] font-black text-foreground tracking-tight">
                           {(compra.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                         </div>
                         <div className="flex flex-wrap gap-2 mt-2">
                           <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary text-foreground px-2 py-1 rounded-full truncate max-w-full">{compra.categoria}</span>
                           <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary text-foreground px-2 py-1 rounded-full">{compra.formaPagamento}</span>
                           <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${isPago ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-700'}`}>
                             {isPago ? 'Pago' : 'Pendente'}
                           </span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-border/50">
                         <div className="bg-secondary/30 p-2 rounded-xl">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase">Data</p>
                           <p className="text-[13px] font-semibold text-foreground truncate">{new Date(compra.dataCompra).toLocaleDateString('pt-BR')}</p>
                         </div>
                         <div className="bg-secondary/30 p-2 rounded-xl">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase">Qtd / Und</p>
                           <p className="text-[13px] font-semibold text-foreground truncate">{compra.quantidade} {compra.unidade}</p>
                         </div>
                      </div>
                      
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-card via-card to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 translate-y-2 group-hover:translate-y-0 duration-300">
                         <Button onClick={() => setSelectedCompra(compra)} className="flex-1 rounded-[16px] h-10 font-bold bg-primary text-white border-none shadow-md">Detalhes</Button>
                         {!isPago && <Button onClick={() => toggleStatus(compra)} variant="outline" className="flex-1 rounded-[16px] h-10 font-bold bg-white text-foreground shadow-sm">Pagar</Button>}
                      </div>
                   </motion.div>
                 );
               })}
            </AnimatePresence>
          </div>
        ) : (
           <div className="bg-card border border-border/50 rounded-[24px] overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-border/50 bg-secondary/30">
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Fornecedor</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Valor</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Status</th>
                     <th className="px-6 py-4"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border/50">
                    {filteredAndSortedCompras.map(compra => (
                      <tr key={compra.id} className="hover:bg-muted/50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-[14px] text-foreground max-w-[200px] truncate">{compra.descricao}</td>
                        <td className="px-6 py-4 font-medium text-[14px] text-muted-foreground max-w-[150px] truncate">{compra.fornecedor || '-'}</td>
                        <td className="px-6 py-4 font-medium text-[14px] text-muted-foreground">{new Date(compra.dataCompra).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 font-black text-[15px] text-foreground text-right">{(compra.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td className="px-6 py-4 text-center">
                           <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex ${compra.statusPagamento === 'pago' ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-700'}`}>
                             {compra.statusPagamento === 'pago' ? 'Pago' : 'Pendente'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <Button variant="ghost" size="icon" onClick={() => setSelectedCompra(compra)} className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100"><Eye size={16}/></Button>
                           <Button variant="ghost" size="icon" onClick={() => openEdit(compra)} className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100"><Edit2 size={16}/></Button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}
      </div>

      {/* NOVA COMPRA MODAL - REDESENHADO LARGO */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[1000px] w-[90vw] rounded-[2rem] p-0 overflow-hidden border-border/50 bg-card shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header Fixo */}
          <div className="p-8 border-b border-border/50 flex justify-between items-center bg-white/50 backdrop-blur-md shrink-0">
            <div>
               <DialogTitle className="text-3xl font-black text-foreground">
                 {editingId ? 'Editar Compra' : 'Nova Compra'}
               </DialogTitle>
               <p className="text-sm text-muted-foreground mt-2 font-medium">Preencha as informações detalhadas sobre a compra.</p>
            </div>
            <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center shrink-0">
              <ShoppingBag size={28} className="text-primary"/>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="overflow-y-auto p-8 md:p-12 space-y-12 hide-scrollbar bg-background/30">
            
            {/* Seção 1: Dados Principais */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold shrink-0">1</span>
                <h4 className="font-bold text-foreground text-lg">Dados Principais</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descrição *</Label>
                  <Input placeholder="Ex: Rolo de Tecido Preto" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="h-14 rounded-2xl bg-card border-border/50 font-semibold text-base" />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fornecedor</Label>
                  <Input placeholder="Nome da empresa" value={formData.fornecedor} onChange={e => setFormData({...formData, fornecedor: e.target.value})} className="h-14 rounded-2xl bg-card border-border/50 font-semibold text-base" />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categoria</Label>
                  <Input placeholder="Ex: Tecidos" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="h-14 rounded-2xl bg-card border-border/50 font-semibold text-base" />
                </div>
              </div>
            </section>

            {/* Seção 2: Quantidade e Valor */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold shrink-0">2</span>
                <h4 className="font-bold text-foreground text-lg">Quantidade e Valor</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-3 col-span-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantidade</Label>
                  <Input type="number" placeholder="1" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: e.target.value})} className="h-14 rounded-2xl bg-card border-border/50 font-semibold text-base" />
                </div>
                <div className="space-y-3 col-span-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unidade</Label>
                  <Input placeholder="Kg, Mts..." value={formData.unidade} onChange={e => setFormData({...formData, unidade: e.target.value})} className="h-14 rounded-2xl bg-card border-border/50 font-semibold text-base" />
                </div>
                <div className="space-y-3 col-span-2">
                  <Label className="text-xs font-bold text-primary uppercase tracking-wider">Valor Total (R$) *</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground font-bold text-lg">R$</div>
                    <Input placeholder="0,00" value={formData.valorTotal} onChange={e => setFormData(updateParcelasOnChange({ valorTotal: e.target.value }, formData))} className="h-14 rounded-2xl bg-primary/5 border-primary/20 focus:border-primary pl-14 font-black text-primary text-xl" />
                  </div>
                </div>
                <div className="space-y-3 col-span-2 md:col-span-4">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data da Compra *</Label>
                  <Input type="date" value={formData.dataCompra} onChange={e => setFormData({...formData, dataCompra: e.target.value})} className="h-14 rounded-2xl bg-card border-border/50 font-semibold text-base w-full md:w-1/2" />
                </div>
              </div>
            </section>

            {/* Seção 3: Condições de Pagamento */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold shrink-0">3</span>
                <h4 className="font-bold text-foreground text-lg">Pagamento</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Condição</Label>
                  <Select value={formData.tipoPagamento} onValueChange={handleTipoPagamentoChange}>
                     <SelectTrigger className="h-14 rounded-2xl bg-card border-border/50 font-bold px-5 text-base">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                        <SelectItem value="a_vista" className="font-bold cursor-pointer py-3 rounded-xl text-base">À Vista</SelectItem>
                        <SelectItem value="a_prazo" className="font-bold cursor-pointer py-3 rounded-xl text-base">Parcelado</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                
                {formData.tipoPagamento === 'a_vista' && (
                  <>
                     <div className="space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Forma de Pagamento</Label>
                        <Select value={formData.formaPagamento} onValueChange={(v) => setFormData({...formData, formaPagamento: v})}>
                          <SelectTrigger className="h-14 rounded-2xl bg-card border-border/50 font-bold px-5 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                            <SelectItem value="Pix" className="font-bold cursor-pointer py-3 rounded-xl text-base">Pix</SelectItem>
                            <SelectItem value="Dinheiro" className="font-bold cursor-pointer py-3 rounded-xl text-base">Dinheiro</SelectItem>
                            <SelectItem value="Cartao" className="font-bold cursor-pointer py-3 rounded-xl text-base">Cartão</SelectItem>
                            <SelectItem value="Boleto" className="font-bold cursor-pointer py-3 rounded-xl text-base">Boleto</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-3 md:col-span-2 md:w-1/2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status do Pagamento</Label>
                        <Select value={formData.statusPagamento} onValueChange={(v) => setFormData({...formData, statusPagamento: v})}>
                          <SelectTrigger className="h-14 rounded-2xl bg-card border-border/50 font-bold px-5 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                            <SelectItem value="pago" className="font-bold text-success cursor-pointer py-3 rounded-xl text-base">Pago</SelectItem>
                            <SelectItem value="pendente" className="font-bold text-amber-600 cursor-pointer py-3 rounded-xl text-base">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                  </>
                )}
              </div>

              {formData.tipoPagamento === 'a_prazo' && (
                <div className="mt-8 p-8 bg-accent/30 rounded-3xl border border-border/50 space-y-6">
                   <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nº de Parcelas</Label>
                        <Input type="number" min="1" max="60" value={formData.quantidadeParcelas} onChange={e => setFormData(updateParcelasOnChange({ quantidadeParcelas: e.target.value }, formData))} className="h-14 rounded-xl bg-card border-border/50 font-bold text-base" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Intervalo (Dias)</Label>
                        <Input type="number" min="1" value={formData.intervaloDias} onChange={e => setFormData(updateParcelasOnChange({ intervaloDias: e.target.value }, formData))} className="h-14 rounded-xl bg-card border-border/50 font-bold text-base" />
                     </div>
                   </div>
                   <div className="max-h-60 overflow-y-auto space-y-3 hide-scrollbar pr-2">
                      {formData.parcelas.map((p: any, i) => (
                         <div key={i} className="flex gap-4 items-center bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
                           <div className="text-sm font-bold text-muted-foreground w-8 text-center">{i+1}x</div>
                           <Input type="date" value={p.dataVencimento} onChange={(e) => {
                             const arr = [...formData.parcelas];
                             arr[i].dataVencimento = e.target.value;
                             setFormData({...formData, parcelas: arr});
                           }} className="h-12 text-sm rounded-xl flex-1 border-border/50 font-semibold" />
                           <Input type="number" step="0.01" value={p.valor} onChange={(e) => {
                             const arr = [...formData.parcelas];
                             arr[i].valor = e.target.value;
                             setFormData({...formData, parcelas: arr});
                           }} className="h-12 text-sm rounded-xl w-32 border-border/50 font-bold text-right" />
                         </div>
                      ))}
                   </div>
                </div>
              )}
            </section>

            {/* Seção 4: Outros */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold shrink-0">4</span>
                <h4 className="font-bold text-foreground text-lg">Observações</h4>
              </div>
              <div className="space-y-3">
                <Input placeholder="Informações adicionais ou notas..." value={formData.detalhePagamento} onChange={e => setFormData({...formData, detalhePagamento: e.target.value})} className="h-14 rounded-2xl bg-card border-border/50 font-semibold text-base" />
              </div>
            </section>

          </div>
          
          {/* Footer Fixo */}
          <div className="flex justify-end gap-4 px-8 py-6 border-t border-border/50 bg-white/50 backdrop-blur-md shrink-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl font-bold text-muted-foreground hover:text-foreground h-14 px-8 text-base">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-bold px-10 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all border-none">
              {editingId ? 'Salvar Alterações' : 'Confirmar Compra'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DETALHES MODAL (Manteve-se similar, mas ajustei responsividade) */}
      <Dialog open={!!selectedCompra} onOpenChange={(open) => !open && setSelectedCompra(null)}>
        <DialogContent className="max-w-[700px] rounded-[2.5rem] p-0 overflow-hidden border-border/50 bg-card">
          {selectedCompra && (
             <>
               <div className="p-6 md:p-8 pb-6 border-b border-border/50 flex flex-col md:flex-row md:justify-between items-start md:items-center bg-white/50 backdrop-blur-md gap-4">
                 <div className="flex-1">
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md">{selectedCompra.categoria}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${selectedCompra.statusPagamento === 'pago' ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-700'}`}>
                        {selectedCompra.statusPagamento === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                    <DialogTitle className="text-2xl md:text-3xl font-black text-foreground line-clamp-2">
                      {selectedCompra.descricao}
                    </DialogTitle>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-2">
                      <Building size={14}/> {selectedCompra.fornecedor || 'Fornecedor N/A'}
                    </p>
                 </div>
                 <div className="text-left md:text-right shrink-0">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Valor Total</p>
                    <p className="text-2xl md:text-3xl font-black text-foreground">{(selectedCompra.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                 </div>
               </div>
               
               <div className="p-6 md:p-8 space-y-8 bg-background/50 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-card p-4 rounded-[20px] border border-border/50 shadow-sm">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Data</p>
                        <p className="text-sm font-black">{new Date(selectedCompra.dataCompra).toLocaleDateString('pt-BR')}</p>
                     </div>
                     <div className="bg-card p-4 rounded-[20px] border border-border/50 shadow-sm">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Qtd / Und</p>
                        <p className="text-sm font-black">{selectedCompra.quantidade} {selectedCompra.unidade}</p>
                     </div>
                     <div className="bg-card p-4 rounded-[20px] border border-border/50 shadow-sm">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Condição</p>
                        <p className="text-sm font-black">{selectedCompra.tipoPagamento === 'a_vista' ? 'À Vista' : 'Parcelado'}</p>
                     </div>
                     <div className="bg-card p-4 rounded-[20px] border border-border/50 shadow-sm">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Forma</p>
                        <p className="text-sm font-black">{selectedCompra.formaPagamento}</p>
                     </div>
                  </div>

                  {selectedCompra.tipoPagamento === 'a_prazo' && selectedCompra.parcelas && selectedCompra.parcelas.length > 0 && (
                     <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider mb-3">Cronograma de Pagamento</h4>
                        <div className="bg-card rounded-[24px] border border-border/50 overflow-hidden shadow-sm">
                           {selectedCompra.parcelas.map((p:any, idx:number) => (
                              <div key={idx} className="flex justify-between items-center p-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                                 <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">{p.numero}</div>
                                    <span className="text-sm font-bold">{new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</span>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className="text-sm font-black">{(parseFloat(p.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-100 text-amber-700">Pendente</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {selectedCompra.detalhePagamento && (
                     <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider mb-2">Observações</h4>
                        <p className="text-sm text-foreground bg-card p-4 rounded-[20px] border border-border/50 shadow-sm">{selectedCompra.detalhePagamento}</p>
                     </div>
                  )}
                  
                  <div>
                     <h4 className="text-sm font-bold uppercase tracking-wider mb-3">Linha do Tempo</h4>
                     <div className="space-y-4 pl-2">
                        <div className="flex items-start gap-4">
                           <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 ring-4 ring-primary/20"></div>
                           <div>
                              <p className="text-sm font-bold">Compra Registrada</p>
                              <p className="text-xs text-muted-foreground">Em {new Date(selectedCompra.createdAt?.toDate ? selectedCompra.createdAt.toDate() : selectedCompra.createdAt || selectedCompra.dataCompra).toLocaleDateString('pt-BR')}</p>
                           </div>
                        </div>
                        {selectedCompra.statusPagamento === 'pago' && (
                           <div className="flex items-start gap-4">
                              <div className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0 ring-4 ring-success/20"></div>
                              <div>
                                 <p className="text-sm font-bold text-success">Pagamento Confirmado</p>
                                 <p className="text-xs text-muted-foreground">Status atualizado para pago.</p>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
             </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 text-center border border-border/50 bg-card">
          <div className="w-20 h-20 bg-destructive/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-destructive/20 shadow-inner">
             <Trash2 size={32} className="text-destructive" strokeWidth={1.5} />
          </div>
          <DialogTitle className="text-2xl font-black mb-2 text-foreground">Excluir Registro?</DialogTitle>
          <p className="text-muted-foreground font-medium text-sm mb-8">Esta ação não pode ser desfeita. Todos os dados desta compra serão apagados permanentemente.</p>
          <DialogFooter className="flex gap-3 sm:justify-center w-full">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)} className="rounded-[18px] flex-1 h-12 font-bold hover:bg-black/5 text-foreground">Cancelar</Button>
            <Button onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-[18px] flex-1 h-12 font-bold shadow-lg shadow-destructive/20 hover:-translate-y-0.5 transition-all">Sim, Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"""
    with open('/tmp/insumos_logic.txt', 'w') as f:
        f.write(logic)
    with open('/tmp/insumos_jsx.txt', 'w') as f:
        f.write(jsx)

