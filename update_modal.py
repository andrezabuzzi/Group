import re

with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

# The modal form starts around: <DialogTitle className="text-[24px] font-bold text-[#111827] dark:text-white">
# Let's find the Dialog section for the edit/new modal.
old_modal_start = """<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>"""
old_modal_end = """      {/* Pay Modal */}"""

# We'll extract everything between old_modal_start and old_modal_end

match = re.search(r'(<Dialog open={isModalOpen}.*?)(?=\s*{\/\* Pay Modal \*\/})', content, re.DOTALL)
if match:
    old_modal = match.group(1)
    
    new_modal = """<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-[24px] font-bold text-[#111827] dark:text-white">
              {editingExpense ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveExpense} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Descrição</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Aluguel do Escritório" className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Valor (R$)</Label>
                <Input required type="number" step="0.01" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="0,00" className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Data do Vencimento</Label>
                <Input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Categoria</Label>
                <div className="relative">
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none">
                    <option value="">Selecione</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Conta / Carteira</Label>
                <div className="relative">
                  <select value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})} className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none">
                    <option value="">Selecione</option>
                    {accounts.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2 pt-2 border-t border-[#ECEFF5] dark:border-white/5 mt-2">
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider block mb-3">Configurações de Pagamento</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-[#6B7280]">Forma de Pagamento</Label>
                    <div className="relative">
                      <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none">
                        <option value="">Selecione</option>
                        <option value="À vista">À vista</option>
                        <option value="Cartão">Cartão</option>
                        <option value="Boleto">Boleto</option>
                        <option value="PIX">PIX</option>
                        <option value="Transferência">Transferência</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-[#6B7280]">Repetição da Despesa</Label>
                    <div className="relative">
                      <select value={formData.recurrenceType} onChange={e => setFormData({...formData, recurrenceType: e.target.value, recurring: e.target.value !== 'unica'})} className="w-full appearance-none h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 text-[14px] font-bold focus:border-[#6D4AFF] px-4 pr-10 outline-none">
                        <option value="unica">Única (Não repete)</option>
                        <option value="semanal">Semanal</option>
                        <option value="mensal">Mensal</option>
                        <option value="semestral">Semestral</option>
                        <option value="anual">Anual</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="flex justify-end gap-3 pt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="h-[48px] px-6 rounded-[16px] font-bold text-[14px] text-[#6B7280] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] transition-colors">Cancelar</button>
              <button type="submit" className="h-[48px] px-8 rounded-[16px] bg-[#6D4AFF] text-white font-bold text-[14px] shadow-[0_4px_14px_0_rgba(109,74,255,0.39)] hover:opacity-90 transition-opacity">Salvar Despesa</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
"""
    content = content.replace(old_modal, new_modal)
    
    with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
        f.write(content)
    print("Modal updated successfully.")
else:
    print("Failed to find modal pattern.")

