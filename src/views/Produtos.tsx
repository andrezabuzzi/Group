import { useEffect, useState, useMemo } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Search, Plus, Edit2, Trash2, Shirt, Image as ImageIcon, MoreVertical, LayoutGrid, DollarSign, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '../lib/utils';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { X, LayoutList, Package, Archive, Box, Activity, Info, ClipboardList, History as HistoryIcon, MoreHorizontal, CheckCircle2, Factory, Layers } from 'lucide-react';
import { DropdownMenuSeparator } from "../components/ui/dropdown-menu";

import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export default function Produtos() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [producoesInfo, setProducoesInfo] = useState<Record<string, { totalPecas: number, custoTotal: number }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmNome, setDeleteConfirmNome] = useState('');

  // Table State
  const [currentPage, setCurrentPage] = useState(1);

  const [sortField, setSortField] = useState('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    precoVendaMedio: '',
    lucroMedioReais: '',
    lucroMedioPercentual: '',
    gradeTamanho: '',
    cores: '',
    categoria: '',
    descricao: '',
    status: 'ativo',
    fotoUrl: ''
  });

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
  const totalEstoque = 12500; // eslint-disable-line
  const custoMedioGeral = totalProdutos > 0 ? Object.values(producoesInfo).reduce((acc, val) => acc + val.custoTotal, 0) / (pecasProduzidas || 1) : 0;

  const fetchProdutos = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'prod_produtos'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProdutos(data);

      const pQ = query(collection(db, 'prod_producoes'), where('userId', '==', user.uid));
      const pSnap = await getDocs(pQ);
      const info: Record<string, { totalPecas: number, custoTotal: number }> = {};
      pSnap.docs.forEach(d => {
        const p = d.data();
        if (p.produtoId) {
          if (!info[p.produtoId]) info[p.produtoId] = { totalPecas: 0, custoTotal: 0 };
          info[p.produtoId].totalPecas += (parseInt(p.quantidadeTotal) || 0);
          info[p.produtoId].custoTotal += (parseFloat(p.custoTotal) || 0);
        }
      });
      setProducoesInfo(info);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'prod_produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!formData.nome || !formData.precoVendaMedio || !formData.categoria) {
      toast.error('Preencha os campos obrigatórios (Nome, Preço, Categoria)');
      return;
    }

    try {
      const gradeArray = formData.gradeTamanho.split(',').map(s => s.trim()).filter(s => s);
      const coresArray = formData.cores.split(',').map(s => s.trim()).filter(s => s);
      const preco = parseFloat(formData.precoVendaMedio) || 0;
      const lucroReais = parseFloat(formData.lucroMedioReais) || 0;
      const lucroPercentual = parseFloat(formData.lucroMedioPercentual) || 0;

      const produtoData: any = {
        nome: formData.nome,
        sku: formData.sku,
        precoVendaMedio: preco,
        lucroMedioReais: lucroReais,
        lucroMedioPercentual: lucroPercentual,
        gradeTamanho: gradeArray,
        cores: coresArray,
        categoria: formData.categoria,
        descricao: formData.descricao,
        status: formData.status,
        userId: user.uid,
        updatedAt: serverTimestamp()
      };

      if (formData.fotoUrl) {
         produtoData.fotoUrl = formData.fotoUrl;
      }

      if (editingId) {
        await updateDoc(doc(db, 'prod_produtos', editingId), produtoData);
        toast.success('Produto atualizado!');
      } else {
        const newId = doc(collection(db, 'prod_produtos')).id;
        if (!produtoData.fotoUrl) produtoData.fotoUrl = null;
        await setDoc(doc(db, 'prod_produtos', newId), {
          id: newId,
          ...produtoData,
          createdAt: serverTimestamp()
        });
        toast.success('Produto criado!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProdutos();
    } catch (error) {
      toast.error('Erro ao salvar produto');
      handleFirestoreError(error, OperationType.WRITE, 'prod_produtos');
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmNome(nome);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteDoc(doc(db, 'prod_produtos', deleteConfirmId));
        toast.success('Produto excluído');
        fetchProdutos();
      } catch (error) {
         toast.error('Erro ao excluir');
         handleFirestoreError(error, OperationType.DELETE, `prod_produtos/${deleteConfirmId}`);
      } finally {
         setDeleteConfirmId(null);
         setDeleteConfirmNome('');
      }
    }
  };

  const openEdit = (prod: any) => {
    setEditingId(prod.id);
    setFormData({
      nome: prod.nome,
      sku: prod.sku || '',
      precoVendaMedio: String(prod.precoVendaMedio),
      lucroMedioReais: String(prod.lucroMedioReais || ''),
      lucroMedioPercentual: String(prod.lucroMedioPercentual || ''),
      gradeTamanho: prod.gradeTamanho?.join(', ') || '',
      cores: prod.cores?.join(', ') || '',
      categoria: prod.categoria,
      descricao: prod.descricao || '',
      status: prod.status || 'ativo',
      fotoUrl: prod.fotoUrl || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nome: '', sku: '', precoVendaMedio: '', lucroMedioReais: '', lucroMedioPercentual: '',
      gradeTamanho: '', cores: '', categoria: '', descricao: '', status: 'ativo', fotoUrl: ''
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, fotoUrl: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

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

  const totalPages = Math.ceil(filteredAndSortedProdutos.length / itemsPerPageState);
  const currentData = filteredAndSortedProdutos.slice((currentPage - 1) * itemsPerPageState, currentPage * itemsPerPageState);
  return (
    <div className="w-full min-h-full flex flex-col bg-background text-foreground overflow-x-hidden pb-20">

      {/* HEADER */}
      <header className="w-full max-w-none mx-auto px-6 lg:px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground tracking-tight text-foreground flex items-center gap-3">
             Catálogo de Produtos
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Gerencie todos os produtos cadastrados na confecção.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="premium-btn-primary">
            <Plus size={18} className="mr-2" strokeWidth={3} />
            Novo Produto
          </Button>
        </div>
      </header>

      <div className="w-full max-w-none mx-auto px-6 lg:px-8 flex flex-col gap-6">

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

          <div className="flex-1"></div>

          <div className="flex bg-card p-1 rounded-[18px] border border-border">
             <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className={cn("h-8 w-8 rounded-2xl", viewMode === 'grid' && "bg-secondary text-primary")} onClick={() => setViewMode('grid')}><LayoutGrid size={16}/></Button>
             <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className={cn("h-8 w-8 rounded-2xl", viewMode === 'list' && "bg-secondary text-primary")} onClick={() => setViewMode('list')}><LayoutList size={16}/></Button>
          </div>
        </div>

        {/* CARDS EXECUTIVOS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <ExecCard title="Total Produtos" value={totalProdutos} icon={<Package/>} trend={<MiniSparkline color="var(--primary)"/>} />
           <ExecCard title="Ativos" value={produtosAtivos} icon={<CheckCircle2/>} trend={<MiniSparkline color="var(--success)"/>} />
           <ExecCard title="Inativos" value={produtosInativos} icon={<Archive/>} trend={<MiniSparkline color="var(--muted-foreground)"/>} />
           <ExecCard title="Em Produção" value={produtosProducao} icon={<Factory/>} trend={<MiniSparkline color="var(--primary)"/>} />
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-col gap-6 mt-2">

          {/* GRID PRINCIPAL */}
          <div className="flex-1 flex flex-col gap-6">
             {loading ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground font-medium animate-pulse">Carregando catálogo...</div>
             ) : currentData.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground premium-card border-dashed">
                   <Package size={48} className="mb-4 opacity-50" />
                   <p className="font-bold text-lg text-foreground">Nenhum produto encontrado</p>
                   <p className="text-sm">Tente ajustar os filtros ou cadastrar um novo produto.</p>
                </div>
             ) : (
                <motion.div 
                   className={cn("grid gap-6", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid-cols-1")}
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 premium-card mt-4">
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

          </div>

      {/* DETALHES DRAWER (Mock) */}
      <AnimatePresence>
         {detailsOpenId && (
            <>
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={() => setDetailsOpenId(null)} />
               <motion.div initial={{x:'100%', opacity: 0}} animate={{x:0, opacity: 1}} exit={{x:'100%', opacity: 0}} transition={{type: 'spring' as const, damping: 25, stiffness: 200}} className="fixed top-0 right-0 h-full w-full max-w-2xl bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden">
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
                                 <div className="premium-card p-5 space-y-4">
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

<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-none w-full md:w-[95vw] rounded-[2.5rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.15)] border-border p-0 overflow-hidden">
          <div className="bg-muted px-8 pt-6 pb-4 border-b border-border/50">
             <DialogTitle className="text-2xl font-black text-foreground">{editingId ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
             <p className="text-sm font-medium text-muted-foreground mt-1">Insira os dados do produto para o seu catálogo.</p>
          </div>

          <div className="px-8 py-6 max-h-[70vh] overflow-y-auto hide-scrollbar space-y-10">
             {/* Informações Básicas */}
             <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                   <Shirt className="text-primary w-5 h-5" />
                   <h3 className="font-bold text-foreground text-lg tracking-tight">Informações Básicas</h3>
                </div>
                <div className="flex flex-col md:flex-row gap-8">
                   {/* Foto Upload Premium */}
                   <div className="w-full md:w-48 flex flex-col items-center md:items-start shrink-0">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-3">Foto Principal</Label>
                      <div className="relative group rounded-[2rem] overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-colors w-40 h-40 bg-muted flex items-center justify-center shadow-inner">
                        {formData.fotoUrl ? (
                          <img src={formData.fotoUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="flex flex-col items-center opacity-60">
                             <ImageIcon size={32} className="text-primary mb-2" strokeWidth={1.5} />
                             <span className="text-[10px] font-bold text-primary uppercase">Fazer Upload</span>
                          </div>
                        )}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" accept="image/*" onChange={handleImageChange} />
                      </div>
                      {formData.fotoUrl && (
                        <Button variant="ghost" size="sm" onClick={() => setFormData({...formData, fotoUrl: ''})} className="mt-3 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl text-xs font-bold w-full">
                           Remover Imagem
                        </Button>
                      )}
                   </div>

                   {/* Campos Básicos */}
                   <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2 col-span-1 md:col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nome da Peça *</Label>
                        <Input placeholder="Ex: Camiseta Oversized Basic" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="rounded-2xl h-12 bg-background focus:bg-background transition-colors border-border text-base font-medium placeholder:text-muted-foreground/50 shadow-sm" />
                      </div>

                      <div className="space-y-2 col-span-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">SKU</Label>
                        <Input placeholder="Ex: CAM-OVER-01" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="rounded-2xl h-12 bg-background focus:bg-background transition-colors border-border text-base font-medium placeholder:text-muted-foreground/50 shadow-sm" />
                      </div>
                      <div className="space-y-2 col-span-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Categoria *</Label>
                        <Select value={formData.categoria} onValueChange={(val) => setFormData({...formData, categoria: val})}>
                          <SelectTrigger className="rounded-2xl h-12 bg-background focus:bg-background transition-colors border-border text-base font-medium shadow-sm">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border">
                            <SelectItem value="Fitness">Fitness</SelectItem>
                            <SelectItem value="Plus Size">Plus Size</SelectItem>
                            <SelectItem value="Slim">Slim</SelectItem>
                            <SelectItem value="Moda casual">Moda casual</SelectItem>
                            <SelectItem value="Moda praia">Moda praia</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</Label>
                        <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                          <SelectTrigger className="rounded-2xl h-12 bg-background focus:bg-background transition-colors border-border text-base font-medium shadow-sm">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border">
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                   </div>
                </div>
             </div>

             {/* Precificação */}
             <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                   <DollarSign className="text-green-600 w-5 h-5" />
                   <h3 className="font-bold text-foreground text-lg tracking-tight">Precificação e Lucro Estimado</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <div className="space-y-2 col-span-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Preço de Venda Médio</Label>
                    <div className="relative">
                       <div className="absolute pointer-events-none inset-y-0 left-0 pl-4 flex items-center text-muted-foreground font-bold text-sm">R$</div>
                       <Input type="number" placeholder="0.00" value={formData.precoVendaMedio} onChange={(e) => setFormData({...formData, precoVendaMedio: e.target.value})} className="rounded-2xl h-12 bg-background focus:bg-background transition-colors border-border text-base font-medium shadow-sm pl-11" />
                    </div>
                  </div>

                   <div className="space-y-2 col-span-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Lucro Médio (R$)</Label>
                    <div className="relative">
                       <div className="absolute pointer-events-none inset-y-0 left-0 pl-4 flex items-center text-muted-foreground font-bold text-sm">R$</div>
                       <Input type="number" placeholder="0.00" value={formData.lucroMedioReais} onChange={(e) => setFormData({...formData, lucroMedioReais: e.target.value})} className="rounded-2xl h-12 bg-background focus:bg-background transition-colors border-border text-base font-medium shadow-sm pl-11" />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Lucro Médio (%)</Label>
                     <div className="relative">
                       <div className="absolute pointer-events-none inset-y-0 right-0 pr-4 flex items-center text-muted-foreground font-bold text-sm">%</div>
                       <Input type="number" placeholder="0" value={formData.lucroMedioPercentual} onChange={(e) => setFormData({...formData, lucroMedioPercentual: e.target.value})} className="rounded-2xl h-12 bg-background focus:bg-background transition-colors border-border text-base font-medium shadow-sm pr-11" />
                    </div>
                  </div>
                </div>
             </div>

             {/* Variações */}
             <div className="space-y-6 pb-4">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                   <LayoutGrid className="text-purple-500 w-5 h-5" />
                   <h3 className="font-bold text-foreground text-lg tracking-tight">Variações e Detalhes</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 col-span-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Grade de Tamanhos (separados por vírgula)</Label>
                    <Input placeholder="Ex: P, M, G, GG" value={formData.gradeTamanho} onChange={(e) => setFormData({...formData, gradeTamanho: e.target.value})} className="rounded-2xl h-12 bg-background focus:bg-background transition-colors border-border text-base font-medium shadow-sm" />
                  </div>

                  <div className="space-y-2 col-span-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Cores (separadas por vírgula)</Label>
                    <Input placeholder="Ex: Preto, Branco, Azul" value={formData.cores} onChange={(e) => setFormData({...formData, cores: e.target.value})} className="rounded-2xl h-12 bg-background focus:bg-background transition-colors border-border text-base font-medium shadow-sm" />
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Descrição Comercial</Label>
                    <Textarea placeholder="Observações e detalhes..." value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="rounded-2xl min-h-[100px] bg-background focus:bg-background transition-colors border-border text-base font-medium shadow-sm resize-none" />
                  </div>
                </div>
             </div>

          </div>

          <div className="flex justify-end gap-3 px-8 py-5 border-t border-border bg-muted/30 backdrop-blur-md">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold hover:bg-background border border-transparent hover:border-border">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 font-bold px-6 border-none hover:shadow-xl hover:shadow-primary/30 transition-all">
              {editingId ? 'Atualizar' : 'Salvar Produto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 border border-border shadow-2xl text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-destructive/20 shadow-inner">
             <Trash2 size={32} className="text-destructive" strokeWidth={1.5} />
          </div>
          <DialogTitle className="text-2xl font-black mb-2 text-foreground">Excluir Produto?</DialogTitle>
          <p className="text-muted-foreground text-sm mb-8 font-medium">Deseja realmente remover o produto {deleteConfirmNome}?</p>
          <DialogFooter className="flex gap-3 sm:justify-center w-full">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="rounded-2xl flex-1 h-12 font-bold border-border bg-background">Cancelar</Button>
            <Button onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl flex-1 h-12 font-bold shadow-lg shadow-destructive/20">Sim, Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

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
  const data = [0, 0, 0, 0, 0, 0, 0];
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
         <motion.div className="flex items-center gap-4 p-4 premium-card shadow-sm hover:shadow-md transition-all group">
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
      <motion.div whileHover={{ y: -4, transition: { duration: 0.25 } }} className="flex flex-col premium-card shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden">
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

            <div className="grid grid-cols-3 gap-3 mb-6 flex-1">
               <div className="bg-secondary/40 rounded-xl p-2.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Produção</p>
                  <p className="font-bold text-sm">{info.totalPecas} pçs</p>
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
         <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 backdrop-blur-md border border-white/20 text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
               <MoreHorizontal size={14} />
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border-border">
            <DropdownMenuItem onClick={onEdit} className="rounded-xl cursor-pointer text-sm font-medium"><Edit2 size={14} className="mr-2 text-primary" /> Editar</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-medium"><LayoutGrid size={14} className="mr-2 text-primary" /> Duplicar</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-medium"><Factory size={14} className="mr-2 text-primary" /> Produzir</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-medium"><Info size={14} className="mr-2 text-muted-foreground" /> Ficha Técnica</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-medium"><HistoryIcon size={14} className="mr-2 text-muted-foreground" /> Histórico</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-medium"><Archive size={14} className="mr-2 text-warning" /> Arquivar</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="rounded-xl cursor-pointer text-sm font-bold text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 size={14} className="mr-2" /> Excluir</DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   )
}
