import re

filepath = 'src/views/Configuracoes.tsx'
with open(filepath, 'r') as f:
    content = f.read()

ui_addition = """                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
                      {/* Bancos */}
                      <div className="space-y-5 bg-accent/30 p-6 md:p-8 rounded-[2rem] border border-border/50 flex flex-col min-h-[380px]">
                        <div>
                          <h4 className="font-bold text-foreground text-base">Bancos e Carteiras</h4>
                          <p className="text-xs text-muted-foreground font-medium mt-1">Opções de contas para recebimentos e pagamentos.</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2.5 mb-2">
                          {bancos.map(b => (
                            <div key={b} className="flex items-center gap-1.5 bg-white border border-border/50 px-4 py-2 rounded-xl text-sm font-bold shadow-sm group hover:border-primary/30 transition-colors">
                              <span className="text-foreground">{b}</span>
                              <button onClick={() => removeBanco(b)} className="text-muted-foreground hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100 flex items-center justify-center outline-none"><X size={16} strokeWidth={2.5}/></button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3 mt-auto">
                          <Input 
                            value={newBanco}
                            onChange={e => setNewBanco(e.target.value)}
                            placeholder="Adicionar novo banco..." 
                            className="bg-white rounded-2xl h-12 border-border/50 shadow-sm focus-visible:ring-primary/20 font-medium"
                            onKeyDown={e => e.key === 'Enter' && addBanco()}
                          />
                          <Button onClick={addBanco} size="icon" className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-md shadow-primary/20">
                            <Plus size={20} strokeWidth={3} />
                          </Button>
                        </div>
                      </div>

                      {/* Categorias Financeiras */}
                      <div className="space-y-5 bg-accent/30 p-6 md:p-8 rounded-[2rem] border border-border/50 flex flex-col min-h-[380px]">
                        <div>
                          <h4 className="font-bold text-foreground text-base">Categorias de Despesas</h4>
                          <p className="text-xs text-muted-foreground font-medium mt-1">Usadas para classificar gastos e receitas no financeiro.</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2.5 mb-2 overflow-y-auto max-h-[200px] hide-scrollbar">
                          {categoriasFinanceiro.map(c => (
                            <div key={c} className="flex items-center gap-1.5 bg-white border border-border/50 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm group hover:border-primary/30 transition-colors">
                              <span className="text-foreground">{c}</span>
                              <button onClick={() => removeCategoria(c)} className="text-muted-foreground hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100 flex items-center justify-center outline-none"><X size={14} strokeWidth={2.5}/></button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3 mt-auto pt-4">
                          <Input 
                            value={newCategoria}
                            onChange={e => setNewCategoria(e.target.value)}
                            placeholder="Adicionar nova categoria..." 
                            className="bg-white rounded-2xl h-12 border-border/50 shadow-sm focus-visible:ring-primary/20 font-medium"
                            onKeyDown={e => e.key === 'Enter' && addCategoria()}
                          />
                          <Button onClick={addCategoria} size="icon" className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-md shadow-primary/20">
                            <Plus size={20} strokeWidth={3} />
                          </Button>
                        </div>
                      </div>
                    </div>"""

# Find where the </div> is that closes the <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
# Let's just append it before the final closing tag of activeTab === 'sistema'
content = content.replace('                    </div>\n                  </div>\n                )}', '                    </div>\n' + ui_addition + '\n                  </div>\n                )}')

with open(filepath, 'w') as f:
    f.write(content)

print("Done")
