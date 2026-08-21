import re

with open('src/views/Insumos.tsx', 'r') as f:
    content = f.read()

# Replace the payment conditions section in Nova Compra Modal
old_condicoes = r"""\{/\* Seção 3: Condições de Pagamento \*/\}[\s\S]*?\{/\* Seção 4: Outros \*/\}"""

new_condicoes = """{/* Seção 3: Condições de Pagamento */}
            <div className="space-y-6">
              <h4 className="font-bold text-foreground text-base border-b border-border/50 pb-2">Condições de Pagamento</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Condição</Label>
                  <Select value={formData.tipoPagamento} onValueChange={handleTipoPagamentoChange}>
                     <SelectTrigger className="h-12 rounded-xl bg-card border-border/50 font-medium px-4">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-border/50 shadow-xl">
                        <SelectItem value="a_vista" className="font-medium cursor-pointer py-2 rounded-lg text-sm">À Vista</SelectItem>
                        <SelectItem value="a_prazo" className="font-medium cursor-pointer py-2 rounded-lg text-sm">Parcelado</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                
                {/* Forma is available for both */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Forma</Label>
                    <Select value={formData.formaPagamento} onValueChange={(v) => setFormData({...formData, formaPagamento: v})}>
                        <SelectTrigger className="h-12 rounded-xl bg-card border-border/50 font-medium px-4">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 shadow-xl">
                        <SelectItem value="Pix" className="font-medium cursor-pointer py-2 rounded-lg text-sm">Pix</SelectItem>
                        <SelectItem value="Dinheiro" className="font-medium cursor-pointer py-2 rounded-lg text-sm">Dinheiro</SelectItem>
                        <SelectItem value="Cartao" className="font-medium cursor-pointer py-2 rounded-lg text-sm">Cartão</SelectItem>
                        <SelectItem value="Boleto" className="font-medium cursor-pointer py-2 rounded-lg text-sm">Boleto</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {formData.tipoPagamento === 'a_vista' && (
                  <>
                     <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status do Pagamento</Label>
                        <Select value={formData.statusPagamento} onValueChange={(v) => setFormData({...formData, statusPagamento: v})}>
                          <SelectTrigger className="h-12 rounded-xl bg-card border-border/50 font-medium px-4">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/50 shadow-xl">
                            <SelectItem value="pago" className="font-medium text-success cursor-pointer py-2 rounded-lg text-sm">Pago</SelectItem>
                            <SelectItem value="pendente" className="font-medium text-amber-600 cursor-pointer py-2 rounded-lg text-sm">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                  </>
                )}
              </div>

              {formData.tipoPagamento === 'a_prazo' && (
                <div className="mt-6 p-6 bg-accent/30 rounded-2xl border border-border/50 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nº de Parcelas</Label>
                        <Input type="number" min="1" max="60" value={formData.quantidadeParcelas} onChange={e => setFormData(updateParcelasOnChange({ quantidadeParcelas: e.target.value }, formData))} className="h-12 rounded-xl bg-card border-border/50 font-medium" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Intervalo (Dias)</Label>
                        <Input type="number" min="1" value={formData.intervaloDias} onChange={e => setFormData(updateParcelasOnChange({ intervaloDias: e.target.value }, formData))} className="h-12 rounded-xl bg-card border-border/50 font-medium" />
                     </div>
                   </div>
                   <div className="max-h-60 overflow-y-auto space-y-2 hide-scrollbar pr-1">
                      {formData.parcelas.map((p: any, i: number) => (
                         <div key={i} className="flex gap-3 items-center bg-card p-3 rounded-xl border border-border/50 shadow-sm">
                           <div className="text-xs font-bold text-muted-foreground w-6 text-center">{i+1}x</div>
                           <Input type="date" value={p.dataVencimento} onChange={(e) => {
                             const arr = [...formData.parcelas];
                             arr[i].dataVencimento = e.target.value;
                             setFormData({...formData, parcelas: arr});
                           }} className="h-10 text-sm rounded-lg flex-1 border-border/50 font-medium" />
                           <Input type="number" step="0.01" value={p.valor} onChange={(e) => {
                             const arr = [...formData.parcelas];
                             arr[i].valor = e.target.value;
                             setFormData({...formData, parcelas: arr});
                           }} className="h-10 text-sm rounded-lg w-28 border-border/50 font-medium text-right" />
                         </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            {/* Seção 4: Outros */}"""

content = re.sub(old_condicoes, new_condicoes, content)


# Replace Cronograma in Visualizar Detalhes
old_cronograma = r"""\{selectedCompra\.tipoPagamento === 'a_prazo' && selectedCompra\.parcelas && selectedCompra\.parcelas\.length > 0 && \([\s\S]*?\}\)"""

new_cronograma = """{selectedCompra.tipoPagamento === 'a_prazo' && selectedCompra.parcelas && selectedCompra.parcelas.length > 0 && (
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
                                    {p.status === 'pago' ? (
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-success/10 text-success">Pago</span>
                                    ) : (
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-100 text-amber-700">Pendente</span>
                                    )}
                                    <Button onClick={() => pagarParcela(selectedCompra, idx)} variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-secondary hover:bg-primary/20 transition-colors">
                                      <CheckCircle size={14} className={p.status === 'pago' ? "text-success" : "text-muted-foreground"} />
                                    </Button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}"""

content = re.sub(old_cronograma, new_cronograma, content)

with open('src/views/Insumos.tsx', 'w') as f:
    f.write(content)
print("Updated modal conditions and cronograma")
