import re

with open('src/views/Producao.tsx', 'r') as f:
    content = f.read()

start_idx = content.find('<Card key={prod.id}')
if start_idx == -1:
    print("Could not find start of Card")
    exit(1)

end_idx = content.find('</Card>', start_idx) + len('</Card>')
old_block = content[start_idx:end_idx]

animate_start = old_block.find('<AnimatePresence>')
animate_end = old_block.find('</AnimatePresence>', animate_start) + len('</AnimatePresence>')
expanded_details_code = old_block[animate_start:animate_end]

# Create the new block
new_block = """<motion.div 
                layout 
                key={prod.id} 
                whileHover={{ y: -4 }}
                className={`bg-white rounded-[24px] border border-border/50 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 relative ${isEntregue ? 'bg-green-50/20' : ''}`}
              >
                <div className="p-6 flex flex-col gap-6">
                  {/* Linha Superior: Imagem, Nome, SKU, Lote, Menu */}
                  <div className="flex items-start gap-4">
                    {/* Imagem */}
                    {prod.produtoFoto ? (
                      <div className="w-16 h-16 rounded-[18px] overflow-hidden border border-border/50 shadow-sm flex-shrink-0 bg-white relative">
                        <img src={prod.produtoFoto} alt={prod.produtoNome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className={`w-16 h-16 rounded-[18px] flex items-center justify-center border border-border/50 shadow-sm flex-shrink-0 ${isEntregue ? 'bg-green-100 text-green-600 border-green-200' : 'bg-primary/5 text-primary'}`}>
                        {isEntregue ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Tag size={24} strokeWidth={2} />}
                      </div>
                    )}
                    
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-[20px] text-foreground leading-tight truncate">{prod.produtoNome}</h4>
                        
                        {/* Menu Moderno */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                           <Button variant="ghost" size="icon" onClick={(e) => toggleExpand(prod.id, e)} className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors">
                             {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                           </Button>
                           <DropdownMenu>
                             <DropdownMenuTrigger className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 flex items-center justify-center transition-colors outline-none focus:ring-4 focus:ring-primary/10">
                               <MoreVertical size={16} />
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border-border/50 p-2 font-medium bg-white/95 backdrop-blur-md">
                               <DropdownMenuItem onClick={() => openEdit(prod)} className="cursor-pointer gap-2 py-2.5 rounded-xl focus:bg-accent"><Edit2 size={16}/> Editar Produção</DropdownMenuItem>
                               <DropdownMenuSub>
                                 <DropdownMenuSubTrigger className="cursor-pointer gap-2 py-2.5 rounded-xl focus:bg-accent"><Tag size={16}/> Mudar Prioridade</DropdownMenuSubTrigger>
                                 <DropdownMenuPortal>
                                   <DropdownMenuSubContent className="w-48 rounded-2xl p-2 font-medium shadow-xl border-border/50 bg-white/95 backdrop-blur-md">
                                     {(configuracoes.prioridades || []).map((p: string) => (
                                       <DropdownMenuItem key={p} onClick={() => updateProdField(prod.id, 'etiquetas', [p.toLowerCase()])} className="cursor-pointer rounded-xl py-2 focus:bg-accent">
                                         {p}
                                       </DropdownMenuItem>
                                     ))}
                                   </DropdownMenuSubContent>
                                 </DropdownMenuPortal>
                               </DropdownMenuSub>
                               <DropdownMenuSub>
                                 <DropdownMenuSubTrigger className="cursor-pointer gap-2 py-2.5 rounded-xl focus:bg-accent"><CheckCircle2 size={16}/> Mudar Fase</DropdownMenuSubTrigger>
                                 <DropdownMenuPortal>
                                   <DropdownMenuSubContent className="w-48 rounded-2xl p-2 font-medium shadow-xl border-border/50 bg-white/95 backdrop-blur-md">
                                     {(configuracoes.statusProducao || ['Pré-produção', 'Modelagem', 'Risco', 'Corte', 'Costura', 'Finalizado']).map((s: string) => (
                                       <DropdownMenuItem key={s} onClick={() => updateProdField(prod.id, 'statusProducao', s)} className="cursor-pointer rounded-xl py-2 focus:bg-accent">
                                         {s}
                                       </DropdownMenuItem>
                                     ))}
                                   </DropdownMenuSubContent>
                                 </DropdownMenuPortal>
                               </DropdownMenuSub>
                               <div className="h-px bg-border/50 my-1"></div>
                               <DropdownMenuItem onClick={() => gerarFichaProducao(prod)} className="cursor-pointer gap-2 py-2.5 rounded-xl focus:bg-accent"><Download size={16}/> Baixar Ficha Geral</DropdownMenuItem>
                               <DropdownMenuItem onClick={() => gerarReciboCostureira(prod)} className="cursor-pointer gap-2 py-2.5 rounded-xl focus:bg-accent"><FileText size={16}/> Gerar Recibo PDF</DropdownMenuItem>
                               <div className="h-px bg-border/50 my-1"></div>
                               <DropdownMenuItem onClick={() => handleDeleteClick(prod.id)} className="cursor-pointer gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 py-2.5 rounded-xl"><Trash2 size={16}/> Excluir Produção</DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {prod.sku && <span className="text-[12px] text-muted-foreground font-semibold">SKU: {prod.sku}</span>}
                        {prod.sku && prod.lote && <span className="text-muted-foreground/50">•</span>}
                        {prod.lote && <span className="text-[12px] text-muted-foreground font-semibold">Lote: {prod.lote}</span>}
                        {prod.statusProducao && (
                           <>
                              {(prod.sku || prod.lote) && <span className="text-muted-foreground/50">•</span>}
                              <span className="text-[12px] font-bold text-foreground bg-accent/50 px-2 py-0.5 rounded-md">{prod.statusProducao}</span>
                           </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Linha 2: Badges (Responsável, Data, etc) */}
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-primary/10 text-primary text-[12px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                      {prod.costureiraNome || 'Sem Responsável'}
                    </span>
                    <span className="bg-primary/10 text-primary text-[12px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1">
                      <Clock size={12}/> {prod.dataInicio ? new Date(prod.dataInicio).toLocaleDateString('pt-BR') : (prod.createdAt ? (typeof prod.createdAt.toDate === 'function' ? prod.createdAt.toDate().toLocaleDateString('pt-BR') : new Date(prod.createdAt).toLocaleDateString('pt-BR')) : 'Sem data')}
                    </span>
                    {prod.dataEntrega && (
                      <span className="bg-primary/10 text-primary text-[12px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                        Entrega: {new Date(prod.dataEntrega).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {prod.etiquetas?.[0] && prod.etiquetas[0].toLowerCase() !== 'normal' && (
                      <span className="bg-primary/10 text-primary text-[12px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap uppercase tracking-wider">
                        {prod.etiquetas[0]}
                      </span>
                    )}
                    {isEntregue && (
                      <span className="bg-green-100 text-green-700 text-[12px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap uppercase tracking-wider">
                        Entregue
                      </span>
                    )}
                  </div>

                  {/* Linha 3: Barra de Progresso Sozinha */}
                  <div className="flex flex-col justify-center bg-accent/20 p-4 rounded-[18px] border border-border/30">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[12px] text-muted-foreground font-bold tracking-widest uppercase">Progresso da Produção</span>
                      <span className={`text-[14px] font-black ${isEntregue ? "text-green-600" : "text-primary"}`}>{Number.isNaN(progress) ? 0 : Math.round(progress)}%</span>
                    </div>
                    
                    {/* Barra de Progresso Animada */}
                    <div className="w-full bg-accent/80 rounded-full h-[12px] overflow-hidden mb-3">
                      <motion.div 
                        className={`h-full rounded-full ${isEntregue ? 'bg-green-500' : 'bg-gradient-to-r from-primary/80 to-primary'}`} 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-[14px] font-bold text-muted-foreground">
                        <span className="text-[20px] font-black text-foreground">{delivered.toLocaleString('pt-BR')}</span> / {Number(prod.quantidadeTotal).toLocaleString('pt-BR') || 0}
                      </div>
                      
                      {/* Grade */}
                      {prod.quantidadePorTamanho && Object.keys(prod.quantidadePorTamanho).length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                           {Object.entries(prod.quantidadePorTamanho).map(([t, q]) => (
                             <span key={t} className="text-[10px] font-bold bg-white text-foreground px-2 py-0.5 rounded-md border border-border/50">{t}: {q as string}</span>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Linha 4: Financeiro Separado e Organizado */}
                  <div className="bg-accent/30 rounded-[20px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-border/50 backdrop-blur-sm">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] text-muted-foreground font-bold tracking-widest uppercase">Financeiro</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isPago ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{isPago ? 'Pago' : 'Pendente'}</span>
                      </div>
                      <div className="text-[28px] lg:text-[32px] font-black text-foreground tracking-tight leading-none truncate max-w-full">
                        {(totalCosturaCard).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 w-full md:w-auto md:min-w-[140px] md:border-l border-t md:border-t-0 border-border/50 pt-3 md:pt-0 md:pl-4">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-[12px] text-muted-foreground font-bold">Valor Pago</span>
                        <span className="text-[14px] font-black text-foreground">{(prod.totalPagoCostura || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                      {!isPago && (
                        <div className="flex justify-between items-center">
                          <span className="text-[12px] text-muted-foreground font-bold">Saldo</span>
                          <span className="text-[14px] font-black text-amber-600">{((totalCosturaCard) - (prod.totalPagoCostura || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Linha 5: Botões */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <Button onClick={() => openRecebimento(prod.id)} className="flex-1 rounded-[18px] bg-primary hover:bg-primary/90 text-white h-[48px] text-[14px] font-bold shadow-sm shadow-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all outline-none border-none">
                      <CheckSquare size={18} className="mr-2" strokeWidth={2.5}/> Registrar Entrega
                    </Button>
                    <Button variant="outline" onClick={() => openPagamento(prod.id)} className="flex-1 rounded-[18px] border-border/50 bg-white hover:bg-gray-50 h-[48px] text-[14px] font-bold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 text-foreground">
                      <DollarSign size={18} className="mr-2 text-foreground" strokeWidth={2.5}/> Lançar Pagamento
                    </Button>
                  </div>
                  
                  <!-- EXPANDED_DETAILS -->
                </div>
              </motion.div>"""

new_block = new_block.replace('<!-- EXPANDED_DETAILS -->', expanded_details_code)

content = content[:start_idx] + new_block + content[end_idx:]

with open('src/views/Producao.tsx', 'w') as f:
    f.write(content)
