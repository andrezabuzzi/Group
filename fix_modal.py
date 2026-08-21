import re

with open('src/views/Insumos.tsx', 'r') as f:
    content = f.read()

start_marker = "{/* NOVA COMPRA MODAL"
end_marker = "{/* DETALHES MODAL"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    before = content[:start_idx]
    after = content[end_idx:]
    
    new_modal = """{/* NOVA COMPRA MODAL - REDESENHADO 50% */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[90vw] md:w-[50vw] max-w-none rounded-[2rem] p-0 overflow-hidden border-border/50 bg-card shadow-2xl flex flex-col max-h-[85vh]">
          {/* Header Fixo */}
          <div className="px-8 py-6 border-b border-border/50 flex justify-between items-center bg-white/50 backdrop-blur-md shrink-0">
            <div>
               <DialogTitle className="text-2xl font-black text-foreground">
                 {editingId ? 'Editar Compra' : 'Nova Compra'}
               </DialogTitle>
               <p className="text-sm text-muted-foreground mt-1 font-medium">Preencha as informações da compra.</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
              <ShoppingBag size={24} className="text-primary"/>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="overflow-y-auto p-8 space-y-10 hide-scrollbar bg-background/50">
            
            {/* Seção 1: Dados Principais */}
            <div className="space-y-6">
              <h4 className="font-bold text-foreground text-base border-b border-border/50 pb-2">Dados Principais</h4>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descrição *</Label>
                  <Input placeholder="Ex: Rolo de Tecido Preto" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="h-12 rounded-xl bg-card border-border/50 font-medium" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fornecedor</Label>
                    <Input placeholder="Nome da empresa" value={formData.fornecedor} onChange={e => setFormData({...formData, fornecedor: e.target.value})} className="h-12 rounded-xl bg-card border-border/50 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categoria</Label>
                    <Input placeholder="Ex: Tecidos" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="h-12 rounded-xl bg-card border-border/50 font-medium" />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Quantidade e Valor */}
            <div className="space-y-6">
              <h4 className="font-bold text-foreground text-base border-b border-border/50 pb-2">Quantidade e Valor</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Qtd.</Label>
                    <Input type="number" placeholder="1" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: e.target.value})} className="h-12 rounded-xl bg-card border-border/50 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Und.</Label>
                    <Input placeholder="Kg, Mts" value={formData.unidade} onChange={e => setFormData({...formData, unidade: e.target.value})} className="h-12 rounded-xl bg-card border-border/50 font-medium" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary uppercase tracking-wider">Valor Total (R$) *</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground font-bold text-sm">R$</div>
                    <Input placeholder="0,00" value={formData.valorTotal} onChange={e => setFormData(updateParcelasOnChange({ valorTotal: e.target.value }, formData))} className="h-12 rounded-xl bg-primary/5 border-primary/20 focus:border-primary pl-10 font-bold text-primary" />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data da Compra *</Label>
                  <Input type="date" value={formData.dataCompra} onChange={e => setFormData({...formData, dataCompra: e.target.value})} className="h-12 rounded-xl bg-card border-border/50 font-medium" />
                </div>
              </div>
            </div>

            {/* Seção 3: Condições de Pagamento */}
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
                
                {formData.tipoPagamento === 'a_vista' && (
                  <>
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
                      {formData.parcelas.map((p: any, i) => (
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

            {/* Seção 4: Outros */}
            <div className="space-y-6">
              <h4 className="font-bold text-foreground text-base border-b border-border/50 pb-2">Observações</h4>
              <div className="space-y-2">
                <Input placeholder="Informações adicionais ou notas..." value={formData.detalhePagamento} onChange={e => setFormData({...formData, detalhePagamento: e.target.value})} className="h-12 rounded-xl bg-card border-border/50 font-medium" />
              </div>
            </div>

          </div>
          
          {/* Footer Fixo */}
          <div className="flex justify-end gap-3 px-8 py-5 border-t border-border/50 bg-white/50 backdrop-blur-md shrink-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold text-muted-foreground hover:text-foreground h-12 px-6">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold px-8 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all border-none">
              {editingId ? 'Salvar Alterações' : 'Confirmar Compra'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      """
    
    with open('/tmp/insumos_new.tsx', 'w') as f:
        f.write(before + new_modal + after)
    print("Done")
