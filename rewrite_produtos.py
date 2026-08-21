import re

with open('src/views/Produtos.tsx', 'r') as f:
    content = f.read()

# Extract from imports up to start of return statement
match = re.search(r'^(.*?)\s+return\s+\(\s*<div className="space-y-6', content, re.DOTALL)
if not match:
    print("Could not find start of return statement.")
    exit(1)

logic_part = match.group(1)

# Extract from dialogs to end
match2 = re.search(r'(<Dialog open=\{isDialogOpen\}.*)$', content, re.DOTALL)
if not match2:
    print("Could not find end dialogs.")
    exit(1)

dialogs_part = match2.group(1)

# Modify imports to include motion, AnimatePresence, Recharts, and extra Lucide icons
logic_part = logic_part.replace(
    "import { Plus, Edit2, Trash2, Search, Filter, ArrowUpDown, LayoutGrid, Image as ImageIcon, Upload, X, MoreVertical, DollarSign, Archive, BarChart3, Tag } from 'lucide-react';",
    "import { Plus, Edit2, Trash2, Search, Filter, ArrowUpDown, LayoutGrid, Image as ImageIcon, Upload, X, MoreVertical, DollarSign, Archive, BarChart3, Tag, Package, Box, Activity, ChevronRight, List, Grid, MoreHorizontal, Info, Play, ClipboardList, History, ChevronLeft, LayoutList } from 'lucide-react';\nimport { motion, AnimatePresence } from 'motion/react';\nimport { AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';\nimport { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../components/ui/dropdown-menu';"
)

# Insert the new state at the end of the state declarations, right before fetchProdutos
new_state = """
  // New State for UI
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detailsOpenId, setDetailsOpenId] = useState<string | null>(null);
  
  // New Filters State (UI Only)
  const [filterCategoria, setFilterCategoria] = useState('Todas');
  const [filterTecido, setFilterTecido] = useState('Todos');
  const [filterColecao, setFilterColecao] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [itemsPerPageState, setItemsPerPageState] = useState(16);

  // KPIs
  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter(p => p.status === 'ativo' || !p.status).length;
  const produtosInativos = produtos.filter(p => p.status === 'inativo').length;
  const produtosProducao = Object.keys(producoesInfo).length;
  const pecasProduzidas = Object.values(producoesInfo).reduce((acc, val) => acc + val.totalPecas, 0);
  const totalEstoque = 12500; // Mock data as requested
  const custoMedioGeral = totalProdutos > 0 ? Object.values(producoesInfo).reduce((acc, val) => acc + val.custoTotal, 0) / (pecasProduzidas || 1) : 0;
"""
logic_part = logic_part.replace("const fetchProdutos = async () => {", new_state + "\n  const fetchProdutos = async () => {")


# Replace filteredAndSortedProdutos logic to use the new filters
filter_logic = """
  const filteredAndSortedProdutos = useMemo(() => {
    let result = produtos.filter(p => 
      p.nome.toLowerCase().includes(search.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    );
    
    if (filterCategoria !== 'Todas') {
      result = result.filter(p => p.categoria === filterCategoria);
    }
    if (filterStatus !== 'Todos') {
      result = result.filter(p => (p.status || 'ativo') === filterStatus.toLowerCase());
    }
    // other filters are visual placeholders since data doesn't contain them
    
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [produtos, search, sortField, sortOrder, filterCategoria, filterStatus]);
"""
logic_part = re.sub(r'const filteredAndSortedProdutos = useMemo\(\(\) => \{.*?\}, \[.*?\]\);', filter_logic, logic_part, flags=re.DOTALL)

# Adjust pagination
logic_part = logic_part.replace('const itemsPerPage = 8;', '')
logic_part = logic_part.replace('const totalPages = Math.ceil(filteredAndSortedProdutos.length / itemsPerPage);', 'const totalPages = Math.ceil(filteredAndSortedProdutos.length / itemsPerPageState);')
logic_part = logic_part.replace('const currentData = filteredAndSortedProdutos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);', 'const currentData = filteredAndSortedProdutos.slice((currentPage - 1) * itemsPerPageState, currentPage * itemsPerPageState);')

new_jsx = """
  return (
    <div className="w-full min-h-full flex flex-col bg-background text-foreground overflow-x-hidden pb-20">
      
      {/* HEADER */}
      <header className="w-full max-w-[1600px] mx-auto px-6 lg:px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
             Catálogo de Produtos
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Gerencie todos os produtos cadastrados na confecção.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all rounded-[18px] px-6 h-12 border-none font-bold">
            <Plus size={18} className="mr-2" strokeWidth={3} />
            Novo Produto
          </Button>
        </div>
      </header>

      <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-8 flex flex-col gap-6">
        
        {/* FILTROS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar produto..."
              className="w-full pl-9 pr-4 h-10 bg-card border border-border focus:border-primary rounded-[18px] text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 font-medium"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[140px] h-10 rounded-[18px] bg-card border-border shadow-sm font-medium hover:border-primary transition-colors focus:ring-0 text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="Todas">Categoria</SelectItem>
              <SelectItem value="Camiseta">Camiseta</SelectItem>
              <SelectItem value="Calça">Calça</SelectItem>
              <SelectItem value="Vestido">Vestido</SelectItem>
              <SelectItem value="Conjunto">Conjunto</SelectItem>
              <SelectItem value="Fitness">Fitness</SelectItem>
              <SelectItem value="Infantil">Infantil</SelectItem>
              <SelectItem value="Cropped">Cropped</SelectItem>
              <SelectItem value="Plus Size">Plus Size</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTecido} onValueChange={setFilterTecido}>
            <SelectTrigger className="w-[130px] h-10 rounded-[18px] bg-card border-border shadow-sm font-medium hover:border-primary transition-colors focus:ring-0 text-sm">
              <SelectValue placeholder="Tecido" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="Todos">Tecido</SelectItem>
              <SelectItem value="Algodão">Algodão</SelectItem>
              <SelectItem value="Poliéster">Poliéster</SelectItem>
              <SelectItem value="Viscose">Viscose</SelectItem>
              <SelectItem value="Duna">Duna</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px] h-10 rounded-[18px] bg-card border-border shadow-sm font-medium hover:border-primary transition-colors focus:ring-0 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="Todos">Status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortField} onValueChange={setSortField}>
             <SelectTrigger className="w-[160px] h-10 rounded-[18px] bg-card border-border shadow-sm font-medium hover:border-primary transition-colors focus:ring-0 text-sm">
                <div className="flex items-center gap-2"><ArrowUpDown size={14}/> <SelectValue placeholder="Ordenar" /></div>
             </SelectTrigger>
             <SelectContent className="rounded-xl">
                <SelectItem value="nome">Nome</SelectItem>
                <SelectItem value="precoVendaMedio">Maior Preço</SelectItem>
                <SelectItem value="lucroMedioReais">Maior Lucro</SelectItem>
             </SelectContent>
          </Select>

          <Button variant="ghost" className="h-10 rounded-[18px] text-muted-foreground font-medium hover:text-foreground text-sm px-4" onClick={() => {
            setSearch(''); setFilterCategoria('Todas'); setFilterTecido('Todos'); setFilterStatus('Todos'); setSortField('nome');
          }}>
             Limpar filtros
          </Button>

          <div className="flex-1"></div>
          
          <div className="flex bg-card p-1 rounded-[18px] border border-border">
             <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className={cn("h-8 w-8 rounded-2xl", viewMode === 'grid' && "bg-secondary text-primary")} onClick={() => setViewMode('grid')}><LayoutGrid size={16}/></Button>
             <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className={cn("h-8 w-8 rounded-2xl", viewMode === 'list' && "bg-secondary text-primary")} onClick={() => setViewMode('list')}><LayoutList size={16}/></Button>
          </div>
        </div>

        {/* CARDS EXECUTIVOS */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
           <ExecCard title="Total Produtos" value={totalProdutos} icon={<Package/>} trend={<MiniSparkline color="var(--primary)"/>} />
           <ExecCard title="Ativos" value={produtosAtivos} icon={<CheckCircle2/>} trend={<MiniSparkline color="var(--success)"/>} />
           <ExecCard title="Inativos" value={produtosInativos} icon={<Archive/>} trend={<MiniSparkline color="var(--muted-foreground)"/>} />
           <ExecCard title="Em Produção" value={produtosProducao} icon={<Factory/>} trend={<MiniSparkline color="var(--primary)"/>} />
           <ExecCard title="Peças Produzidas" value={pecasProduzidas} icon={<Box/>} trend={<MiniSparkline color="var(--primary)"/>} />
           <ExecCard title="Estoque Total" value={totalEstoque} icon={<Layers/>} trend={<MiniSparkline color="var(--primary)"/>} />
           <ExecCard title="Custo Médio" value={`R$ ${custoMedioGeral.toFixed(2)}`} icon={<DollarSign/>} trend={<MiniSparkline color="var(--destructive)"/>} />
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-col xl:flex-row gap-6 mt-2">
          
          {/* GRID PRINCIPAL */}
          <div className="flex-1 flex flex-col gap-6">
             {loading ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground font-medium animate-pulse">Carregando catálogo...</div>
             ) : currentData.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground bg-card rounded-[24px] border border-border border-dashed">
                   <Package size={48} className="mb-4 opacity-50" />
                   <p className="font-bold text-lg text-foreground">Nenhum produto encontrado</p>
                   <p className="text-sm">Tente ajustar os filtros ou cadastrar um novo produto.</p>
                </div>
             ) : (
                <motion.div 
                   className={cn("grid gap-6", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1")}
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                >
                   {currentData.map(prod => (
                      <ProductCard 
                         key={prod.id} 
                         prod={prod} 
                         producaoInfo={producoesInfo[prod.id]} 
                         onEdit={() => openEdit(prod)}
                         onDelete={() => handleDelete(prod.id, prod.nome)}
                         onDetails={() => setDetailsOpenId(prod.id)}
                         viewMode={viewMode}
                      />
                   ))}
                </motion.div>
             )}

             {/* PAGINAÇÃO */}
             {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-card rounded-[24px] border border-border mt-4">
                   <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                      <span>Mostrando {currentData.length} de {filteredAndSortedProdutos.length}</span>
                      <Select value={String(itemsPerPageState)} onValueChange={(v) => {setItemsPerPageState(Number(v)); setCurrentPage(1)}}>
                         <SelectTrigger className="h-8 w-[70px] rounded-xl border-border bg-background"><SelectValue/></SelectTrigger>
                         <SelectContent className="rounded-xl">
                            <SelectItem value="8">8</SelectItem><SelectItem value="16">16</SelectItem>
                            <SelectItem value="32">32</SelectItem><SelectItem value="64">64</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16}/></Button>
                      <span className="text-sm font-bold w-12 text-center">{currentPage} / {totalPages}</span>
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p - 1)}><ChevronRight size={16}/></Button>
                   </div>
                </div>
             )}
          </div>

          {/* INSIGHTS & QUICK ACTIONS (SIDEBAR) */}
          <div className="w-full xl:w-[320px] flex flex-col gap-6 shrink-0">
             
             {/* INSIGHTS */}
             <div className="bg-card rounded-[24px] p-6 border border-border shadow-soft">
                <div className="flex items-center gap-2 mb-6">
                   <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Activity size={16} /></div>
                   <h3 className="font-bold text-lg">Insights</h3>
                </div>
                <div className="space-y-4">
                   <InsightItem text="A categoria Fitness teve aumento de 15% na produção." type="positive" />
                   <InsightItem text="O Vestido Duna representa 22% do faturamento." type="info" />
                   <InsightItem text="O Conjunto Bia possui o menor custo médio." type="info" />
                   <InsightItem text="O Cropped Suplex está com estoque baixo." type="warning" />
                </div>
             </div>

             {/* GRÁFICOS PEQUENOS */}
             <div className="bg-card rounded-[24px] p-6 border border-border shadow-soft">
                <h3 className="font-bold text-lg mb-4">Por Categoria</h3>
                <div className="h-[120px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{name: 'Vestido', val: 40}, {name: 'Fitness', val: 30}, {name: 'Camiseta', val: 20}, {name: 'Calça', val: 10}]} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                         <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)'}} />
                         <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)'}} />
                         <Tooltip cursor={{fill:'transparent'}} contentStyle={{borderRadius:'12px', border:'1px solid var(--border)', background:'var(--card)'}} />
                         <Bar dataKey="val" fill="var(--primary)" radius={[4,4,0,0]} barSize={16} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* QUICK ACTIONS */}
             <div className="bg-card rounded-[24px] p-6 border border-border shadow-soft">
                <h3 className="font-bold text-lg mb-4">Ações Rápidas</h3>
                <div className="flex flex-col gap-2">
                   <QuickActionButton icon={<Package size={16}/>} label="Cadastrar Produto" onClick={() => { resetForm(); setIsDialogOpen(true); }} />
                   <QuickActionButton icon={<Factory size={16}/>} label="Nova Produção" />
                   <QuickActionButton icon={<ClipboardList size={16}/>} label="Gerar Relatório" />
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* DETALHES DRAWER (Mock) */}
      <AnimatePresence>
         {detailsOpenId && (
            <>
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={() => setDetailsOpenId(null)} />
               <motion.div initial={{x:'100%', opacity: 0}} animate={{x:0, opacity: 1}} exit={{x:'100%', opacity: 0}} transition={{type: 'spring', damping: 25, stiffness: 200}} className="fixed top-0 right-0 h-full w-full max-w-2xl bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-border">
                     <h2 className="text-2xl font-black">Ficha do Produto</h2>
                     <Button variant="ghost" size="icon" onClick={() => setDetailsOpenId(null)} className="rounded-2xl bg-secondary hover:bg-secondary/80"><X size={20}/></Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar">
                     {(() => {
                        const prod = produtos.find(p => p.id === detailsOpenId);
                        if(!prod) return null;
                        const info = producoesInfo[prod.id];
                        return (
                           <>
                              <div className="flex gap-6">
                                 <div className="w-40 h-40 rounded-3xl bg-white border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                    {prod.fotoUrl ? <img src={prod.fotoUrl} alt={prod.nome} className="w-full h-full object-cover"/> : <ImageIcon size={40} className="text-muted-foreground opacity-20"/>}
                                 </div>
                                 <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-2">
                                       <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">{prod.categoria || 'Sem Categoria'}</span>
                                       <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", prod.status === 'inativo' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>{(prod.status || 'ativo')}</span>
                                    </div>
                                    <h3 className="text-2xl font-black mb-1">{prod.nome}</h3>
                                    <p className="text-sm font-medium text-muted-foreground mb-4">SKU: {prod.sku || 'N/A'}</p>
                                    <div className="flex gap-4">
                                       <div>
                                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Preço Médio</p>
                                          <p className="text-lg font-bold">R$ {parseFloat(prod.precoVendaMedio || 0).toFixed(2)}</p>
                                       </div>
                                       <div>
                                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Lucro Est.</p>
                                          <p className="text-lg font-bold text-primary">R$ {parseFloat(prod.lucroMedioReais || 0).toFixed(2)}</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4">
                                 <div className="p-4 bg-secondary/30 rounded-[20px] border border-border">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Peças Produzidas</p>
                                    <p className="text-xl font-bold">{info?.totalPecas || 0}</p>
                                 </div>
                                 <div className="p-4 bg-secondary/30 rounded-[20px] border border-border">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Custo Médio/Pç</p>
                                    <p className="text-xl font-bold">R$ {(info && info.totalPecas > 0 ? (info.custoTotal / info.totalPecas).toFixed(2) : '0.00')}</p>
                                 </div>
                                 <div className="p-4 bg-secondary/30 rounded-[20px] border border-border">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Estoque Atual</p>
                                    <p className="text-xl font-bold">120 <span className="text-sm font-medium text-muted-foreground">un</span></p>
                                 </div>
                              </div>

                              <div>
                                 <h4 className="font-bold mb-4 flex items-center gap-2"><Info size={16} className="text-primary"/> Detalhes Técnicos</h4>
                                 <div className="bg-card border border-border rounded-[20px] p-5 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                       <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tecido</p><p className="font-medium text-sm">Duna com Elastano</p></div>
                                       <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Grade</p><p className="font-medium text-sm">{prod.gradeTamanho?.join(', ') || 'Único'}</p></div>
                                       <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Cores</p><p className="font-medium text-sm">{prod.cores?.join(', ') || 'N/A'}</p></div>
                                       <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Coleção</p><p className="font-medium text-sm">Verão 2024</p></div>
                                    </div>
                                    <div className="pt-4 border-t border-border">
                                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Descrição</p>
                                       <p className="font-medium text-sm text-muted-foreground">{prod.descricao || 'Sem descrição cadastrada.'}</p>
                                    </div>
                                 </div>
                              </div>
                           </>
                        )
                     })()}
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>

"""

logic_part = logic_part + new_jsx + dialogs_part

components = """
// --- SUBCOMPONENTS ---

import { CheckCircle2, Factory, Layers } from 'lucide-react';

function ExecCard({ title, value, icon, trend }: any) {
  return (
    <div className="rounded-[20px] p-4 bg-card border border-border shadow-sm flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
      <div className="flex justify-between items-start mb-3">
        <div className="w-10 h-10 rounded-[14px] bg-secondary text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="w-12 h-6 opacity-60">
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{title}</p>
        <p className="text-xl font-black tracking-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}

function MiniSparkline({ color }: { color: string }) {
  const data = [10, 20, 15, 30, 25, 40, 35];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data.map(v => ({v}))}>
        <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function InsightItem({ text, type }: { text: string, type: 'positive' | 'warning' | 'info' }) {
  const colors = {
     positive: 'bg-success/10 text-success border-success/20',
     warning: 'bg-warning/10 text-warning border-warning/20',
     info: 'bg-primary/10 text-primary border-primary/20'
  };
  return (
     <div className={cn("p-3 rounded-xl border flex gap-3 text-sm font-medium", colors[type])}>
        <span className="shrink-0">•</span>
        <span>{text}</span>
     </div>
  );
}

function QuickActionButton({ icon, label, onClick }: any) {
   return (
      <Button variant="ghost" onClick={onClick} className="w-full justify-start h-11 px-4 rounded-xl font-medium hover:bg-secondary hover:text-primary transition-colors">
         <span className="mr-3 text-muted-foreground group-hover:text-primary">{icon}</span>
         {label}
      </Button>
   );
}

function ProductCard({ prod, producaoInfo, onEdit, onDelete, onDetails, viewMode }: any) {
   const isList = viewMode === 'list';
   const info = producaoInfo || { totalPecas: 0, custoTotal: 0 };
   const custoMedio = info.totalPecas > 0 ? (info.custoTotal / info.totalPecas).toFixed(2) : '0.00';
   const isActive = prod.status !== 'inativo';

   if (isList) {
      return (
         <motion.div className="flex items-center gap-4 p-4 bg-card rounded-[24px] border border-border shadow-sm hover:shadow-md transition-all group">
            <div className="w-16 h-16 rounded-[18px] bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
               {prod.fotoUrl ? <img src={prod.fotoUrl} alt={prod.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/> : <ImageIcon size={24} className="text-muted-foreground opacity-20"/>}
            </div>
            <div className="flex-1 min-w-0">
               <h4 className="font-bold text-base truncate">{prod.nome}</h4>
               <p className="text-xs text-muted-foreground">SKU: {prod.sku || 'N/A'}</p>
            </div>
            <div className="hidden md:flex items-center gap-6 flex-1 justify-between px-6">
               <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">{prod.categoria || 'Geral'}</span>
               <div className="text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Produção</p>
                  <p className="font-bold text-sm">{info.totalPecas}</p>
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Custo Médio</p>
                  <p className="font-bold text-sm">R$ {custoMedio}</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="outline" className="rounded-[14px] font-bold h-9 border-primary/50 text-primary hover:bg-primary hover:text-white transition-colors" onClick={onDetails}>
                  Detalhes
               </Button>
               <ProductMenu onEdit={onEdit} onDelete={onDelete} />
            </div>
         </motion.div>
      )
   }

   return (
      <motion.div whileHover={{ y: -4, transition: { duration: 0.25 } }} className="flex flex-col bg-card rounded-[24px] border border-border shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden">
         {/* Imagem (40%) */}
         <div className="relative h-48 bg-white border-b border-border flex items-center justify-center overflow-hidden p-4">
            {prod.fotoUrl ? (
               <img src={prod.fotoUrl} alt={prod.nome} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"/>
            ) : (
               <ImageIcon size={48} className="text-muted-foreground opacity-20 group-hover:scale-105 transition-transform duration-300"/>
            )}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
               <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md">
                  {prod.categoria || 'Geral'}
               </span>
               <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md w-fit", isActive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                  {isActive ? 'Ativo' : 'Inativo'}
               </span>
            </div>
            <div className="absolute top-3 right-3">
               <ProductMenu onEdit={onEdit} onDelete={onDelete} />
            </div>
         </div>

         {/* Conteúdo */}
         <div className="p-5 flex flex-col flex-1">
            <h4 className="font-bold text-lg mb-1 truncate">{prod.nome}</h4>
            <p className="text-xs text-muted-foreground font-medium mb-4">SKU: {prod.sku || 'N/A'}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
               <div className="bg-secondary/40 rounded-xl p-2.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Produção</p>
                  <p className="font-bold text-sm">{info.totalPecas} pçs</p>
               </div>
               <div className="bg-secondary/40 rounded-xl p-2.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Estoque</p>
                  <p className="font-bold text-sm">45 un</p>
               </div>
               <div className="bg-secondary/40 rounded-xl p-2.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Custo Médio</p>
                  <p className="font-bold text-sm">R$ {custoMedio}</p>
               </div>
               <div className="bg-secondary/40 rounded-xl p-2.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Preço Médio</p>
                  <p className="font-bold text-sm">R$ {parseFloat(prod.precoVendaMedio || 0).toFixed(2)}</p>
               </div>
            </div>

            <Button variant="outline" className="w-full rounded-[16px] border-primary/50 text-primary font-bold hover:bg-primary hover:text-white transition-all h-10" onClick={onDetails}>
               Ver Detalhes
            </Button>
         </div>
      </motion.div>
   );
}

function ProductMenu({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) {
   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/5 hover:bg-black/10 backdrop-blur-md border border-white/20 text-foreground">
               <MoreHorizontal size={14} />
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border-border">
            <DropdownMenuItem onClick={onEdit} className="rounded-xl cursor-pointer text-sm font-medium"><Edit2 size={14} className="mr-2 text-primary" /> Editar</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-medium"><LayoutGrid size={14} className="mr-2 text-primary" /> Duplicar</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-medium"><Factory size={14} className="mr-2 text-primary" /> Produzir</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-medium"><Info size={14} className="mr-2 text-muted-foreground" /> Ficha Técnica</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-medium"><History size={14} className="mr-2 text-muted-foreground" /> Histórico</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-medium"><Archive size={14} className="mr-2 text-warning" /> Arquivar</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="rounded-xl cursor-pointer text-sm font-bold text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 size={14} className="mr-2" /> Excluir</DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   )
}
"""

with open('src/views/Produtos.tsx', 'w') as f:
    f.write(logic_part + "\n" + components)
print("Done")
