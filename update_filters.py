import re

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "r") as f:
    text = f.read()

# Add state
text = text.replace("const [showFiltersMobile, setShowFiltersMobile] = useState(false);", "const [showFiltersMobile, setShowFiltersMobile] = useState(false);\n  const [showFinished, setShowFinished] = useState(false);")

# Update filteredReturns
old_filter = """  const filteredReturns = returns.filter(r => {
    if (filterMarketplace !== 'Todos' && r.marketplace !== filterMarketplace) return false;"""

new_filter = """  const filteredReturns = returns.filter(r => {
    if (!showFinished && r.overallStatus === 'Finalizado' && filterStatus !== 'Finalizado') return false;
    if (filterMarketplace !== 'Todos' && r.marketplace !== filterMarketplace) return false;"""

text = text.replace(old_filter, new_filter)

# Add Toggle button
old_button_area = """                        </Select>
                     </div>
                     <Button variant="ghost" className="md:hidden w-full h-11 rounded-[12px] font-bold" onClick={() => setShowFiltersMobile(!showFiltersMobile)}>
                        {showFiltersMobile ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                     </Button>"""

new_button_area = """                        </Select>
                        <Button 
                           variant="outline" 
                           onClick={() => setShowFinished(!showFinished)}
                           className={`h-11 rounded-[12px] font-bold shadow-none transition-colors ${showFinished ? 'bg-primary/10 text-primary border-primary/20' : 'bg-background border-transparent hover:border-border'}`}
                        >
                           {showFinished ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                           {showFinished ? 'Ocultar Finalizadas' : 'Ver Finalizadas'}
                        </Button>
                     </div>
                     <Button variant="ghost" className="md:hidden w-full h-11 rounded-[12px] font-bold" onClick={() => setShowFiltersMobile(!showFiltersMobile)}>
                        {showFiltersMobile ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                     </Button>"""

text = text.replace(old_button_area, new_button_area)

# Green row styling
old_row = """                                 <TableRow 
                                    key={ret.id} 
                                    className="group hover:bg-muted/30 transition-colors border-border/50"
                                 >"""

new_row = """                                 <TableRow 
                                    key={ret.id} 
                                    className={`group transition-colors border-border/50 ${ret.overallStatus === 'Finalizado' ? 'bg-green-500/5 hover:bg-green-500/10' : 'hover:bg-muted/30'}`}
                                 >"""

text = text.replace(old_row, new_row)

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "w") as f:
    f.write(text)
