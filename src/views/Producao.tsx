import { useState, useEffect } from 'react';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, getDoc, doc, setDoc, deleteDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Plus, Filter, Clock, Edit2, Trash2, Tag, PlayCircle, AlertCircle, PauseCircle, Activity, CheckCircle2, FileText, Download, CheckSquare, DollarSign, Wallet, Paperclip, Loader2, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from '../components/ui/dropdown-menu';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';

export default function Producao() {
  const { user } = useAuth();
  
  const [producoes, setProducoes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [costureiras, setCostureiras] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [pagamentoFilter, setPagamentoFilter] = useState<string[]>([]);
  const [faseFilter, setFaseFilter] = useState<string[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRecebimentoOpen, setIsRecebimentoOpen] = useState(false);
  const [isPagamentoOpen, setIsPagamentoOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [recebimentoData, setRecebimentoData] = useState({
    producaoId: '', data: '', quantidade: '', quantidadeDefeito: '', observacao: '', quantidadePorTamanho: {} as Record<string, string>
  });
  const [pagamentoData, setPagamentoData] = useState({
    producaoId: '', data: '', valor: '', observacao: ''
  });
  const [editRecebimentoOld, setEditRecebimentoOld] = useState<any>(null);
  const [editPagamentoOld, setEditPagamentoOld] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    produtoId: '',
    costureiraId: '',
    quantidadeTotal: '',
    quantidadePorTamanho: {} as Record<string, string>,
    valorTecido: '',
    fornecedorTecido: '',
    fornecedoresTecido: [{ fornecedor: '', rolos: '', tipoMedida: 'metros' as 'metros' | 'kg', quantidade: '', valorUnitario: '', totalCompra: '' }],
    valorModelagem: '',
    nomeModelista: '',
    pagoModelagem: false,
    valorRisco: '',
    nomeRiscador: '',
    pagoRisco: false,
    valorCorte: '',
    nomeCortador: '',
    pagoCorte: false,
    valorCostura: '',
    pagoCostura: false,
    valorInsumos: '',
    outrosGastos: '',
    dataInicio: '',
    dataInicioCostura: '',
    dataPrevistaEntrega: '',
    etiquetaPrioridade: 'normal',
    statusEntrega: 'Pendente',
    statusProducao: 'Pré-produção',
    observacoes: '',
    anexoUrl: '',
    anexoNome: ''
  });

  const [configuracoes, setConfiguracoes] = useState<{prioridades?: string[], status?: string[], statusProducao?: string[]}>({
    prioridades: ['normal', 'urgente', 'reposicao'],
    status: ['Pendente', 'Parcial', 'Completo'],
    statusProducao: ['Pré-produção', 'Modelagem', 'Risco', 'Corte', 'Costura', 'Finalizado']
  });

  const getSelectedProductGrade = () => {
    const prod = produtos.find(p => p.id === formData.produtoId);
    return prod?.gradeTamanho || [];
  };

  const getSelectedProductColors = () => {
    const prod = produtos.find(p => p.id === formData.produtoId);
    return prod?.cores || [];
  };

  const getSelectedVariants = () => {
    const grades = getSelectedProductGrade();
    const cores = getSelectedProductColors();
    const variants: string[] = [];

    if (grades.length > 0 && cores.length > 0) {
      grades.forEach((g: string) => {
        cores.forEach((c: string) => {
          variants.push(`${g} - ${c}`);
        });
      });
    } else if (grades.length > 0) {
      variants.push(...grades);
    } else if (cores.length > 0) {
      variants.push(...cores);
    }

    return variants;
  };

  const selectedVariants = getSelectedVariants();
  const hasVariants = selectedVariants.length > 0;

  const handleQuantidadeTamanhoChange = (tamanho: string, value: string) => {
    const newGrade = { ...formData.quantidadePorTamanho, [tamanho]: value };
    const total = Object.values(newGrade).reduce((acc, curr) => acc + (parseInt(curr as string) || 0), 0);
    setFormData({
      ...formData,
      quantidadePorTamanho: newGrade,
      quantidadeTotal: total > 0 ? String(total) : ''
    });
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      const [prodRes, prodsRes, costRes, configRes] = await Promise.all([
        getDocs(query(collection(db, 'prod_producoes'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'prod_produtos'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'prod_costureiras'), where('userId', '==', user.uid))),
        getDoc(doc(db, 'configuracoes', user.uid))
      ]);
      
      setProducoes(prodRes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setProdutos(prodsRes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCostureiras(costRes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      if (configRes.exists()) {
         const data = configRes.data();
         setConfiguracoes({
            prioridades: data.prioridades?.length ? data.prioridades : ['normal', 'urgente', 'reposicao'],
            status: data.status?.length ? data.status : ['Pendente', 'Parcial', 'Completo']
         });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'prod_producoes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!formData.produtoId || !formData.statusProducao) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    if (formData.statusProducao === 'Costura') {
      if (!formData.costureiraId || !formData.quantidadeTotal) {
        toast.error('Costureira e Quantidade são obrigatórios na fase de Costura');
        return;
      }
    }

    try {
      const selectedProduto = produtos.find(p => p.id === formData.produtoId);
      const selectedCostureira = costureiras.find(c => c.id === formData.costureiraId);

      const qtd = parseInt(formData.quantidadeTotal) || 0;
      
      const calcValorTecido = formData.fornecedoresTecido.reduce((acc, curr) => acc + (parseFloat(curr.totalCompra) || 0), 0) || (parseFloat(formData.valorTecido) || 0);

      const custoTotalReal = 
        calcValorTecido +
        (parseFloat(formData.valorCorte) || 0) +
        (parseFloat(formData.valorModelagem) || 0) +
        (parseFloat(formData.valorRisco) || 0) +
        ((parseFloat(formData.valorCostura) || 0) * qtd) +
        (parseFloat(formData.valorInsumos) || 0) +
        (parseFloat(formData.outrosGastos) || 0);

      const prodData: any = {
        produtoId: formData.produtoId,
        produtoNome: selectedProduto?.nome || 'Desconhecido',
        produtoFoto: selectedProduto?.fotoUrl || null,
        costureiraId: formData.costureiraId,
        costureiraNome: selectedCostureira?.nome || 'Desconhecida',
        quantidadeTotal: qtd,
        quantidadePorTamanho: formData.quantidadePorTamanho,
        statusProducao: formData.statusProducao,
        statusEntrega: formData.statusEntrega,
        etiquetas: [formData.etiquetaPrioridade],
        dataInicio: formData.dataInicio,
        dataInicioCostura: formData.dataInicioCostura,
        dataPrevistaEntrega: formData.dataPrevistaEntrega,
        valorTecido: calcValorTecido,
        fornecedorTecido: formData.fornecedoresTecido.map(f => f.fornecedor).filter(Boolean).join(', ') || formData.fornecedorTecido,
        fornecedoresTecido: formData.fornecedoresTecido,
        valorModelagem: parseFloat(formData.valorModelagem) || 0,
        nomeModelista: formData.nomeModelista,
        pagoModelagem: formData.pagoModelagem,
        valorRisco: parseFloat(formData.valorRisco) || 0,
        nomeRiscador: formData.nomeRiscador,
        pagoRisco: formData.pagoRisco,
        valorCorte: parseFloat(formData.valorCorte) || 0,
        nomeCortador: formData.nomeCortador,
        pagoCorte: formData.pagoCorte,
        valorCostura: parseFloat(formData.valorCostura) || 0,
        pagoCostura: formData.pagoCostura,
        valorInsumos: parseFloat(formData.valorInsumos) || 0,
        outrosGastos: parseFloat(formData.outrosGastos) || 0,
        custoTotal: custoTotalReal,
        custoPorPeca: qtd > 0 ? (custoTotalReal / qtd) : 0,
        observacoes: formData.observacoes,
        anexoUrl: formData.anexoUrl,
        anexoNome: formData.anexoNome,
        userId: user.uid,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'prod_producoes', editingId), prodData);
        toast.success('Produção atualizada!');
      } else {
        const newId = doc(collection(db, 'prod_producoes')).id;
        prodData.totalPendente = qtd;
        prodData.totalEntregue = 0;
        prodData.createdAt = serverTimestamp();
        
        await setDoc(doc(db, 'prod_producoes', newId), {
          id: newId,
          ...prodData
        });
        toast.success('Produção cadastrada!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar');
      handleFirestoreError(error, OperationType.WRITE, 'prod_producoes');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDoc(doc(db, 'prod_producoes', deleteConfirmId));
      toast.success('Excluída com sucesso');
      setDeleteConfirmId(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir');
      handleFirestoreError(error, OperationType.DELETE, `prod_producoes/${deleteConfirmId}`);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const updateProdField = async (id: string, field: string, value: any) => {
    try {
      await updateDoc(doc(db, 'prod_producoes', id), { 
        [field]: value,
        updatedAt: serverTimestamp()
      });
      toast.success('Atualizado com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar');
      handleFirestoreError(error, OperationType.WRITE, `prod_producoes/${id}`);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      produtoId: '', costureiraId: '', quantidadeTotal: '', quantidadePorTamanho: {}, valorTecido: '', fornecedorTecido: '', 
      fornecedoresTecido: [{ fornecedor: '', rolos: '', tipoMedida: 'metros', quantidade: '', valorUnitario: '', totalCompra: '' }], 
      valorModelagem: '', nomeModelista: '', pagoModelagem: false,
      valorRisco: '', nomeRiscador: '', pagoRisco: false,
      valorCorte: '', nomeCortador: '', pagoCorte: false,
      valorCostura: '', pagoCostura: false,
      valorInsumos: '', outrosGastos: '', dataInicio: '', dataInicioCostura: '', dataPrevistaEntrega: '', 
      etiquetaPrioridade: 'normal', statusEntrega: 'Pendente', statusProducao: 'Pré-produção', 
      observacoes: '', anexoUrl: '', anexoNome: ''
    });
  };

  const openEdit = (prod: any) => {
    setEditingId(prod.id);
    setFormData({
      produtoId: prod.produtoId,
      costureiraId: prod.costureiraId,
      quantidadeTotal: String(prod.quantidadeTotal || ''),
      quantidadePorTamanho: prod.quantidadePorTamanho || {},
      valorTecido: String(prod.valorTecido || ''),
      fornecedorTecido: prod.fornecedorTecido || '',
      fornecedoresTecido: prod.fornecedoresTecido && prod.fornecedoresTecido.length > 0 ? prod.fornecedoresTecido : [{ fornecedor: prod.fornecedorTecido || '', rolos: '', tipoMedida: 'metros', quantidade: '', valorUnitario: '', totalCompra: String(prod.valorTecido || '') }],
      valorModelagem: String(prod.valorModelagem || ''),
      nomeModelista: prod.nomeModelista || '',
      pagoModelagem: !!prod.pagoModelagem,
      valorRisco: String(prod.valorRisco || ''),
      nomeRiscador: prod.nomeRiscador || '',
      pagoRisco: !!prod.pagoRisco,
      valorCorte: String(prod.valorCorte || ''),
      nomeCortador: prod.nomeCortador || '',
      pagoCorte: !!prod.pagoCorte,
      valorCostura: String(prod.valorCostura || ''),
      pagoCostura: !!prod.pagoCostura,
      valorInsumos: String(prod.valorInsumos || ''),
      outrosGastos: String(prod.outrosGastos || ''),
      dataInicio: prod.dataInicio || '',
      dataInicioCostura: prod.dataInicioCostura || '',
      dataPrevistaEntrega: prod.dataPrevistaEntrega || '',
      etiquetaPrioridade: prod.etiquetas?.[0] || 'normal',
      statusEntrega: prod.statusEntrega || 'Pendente',
      statusProducao: prod.statusProducao || 'Pré-produção',
      observacoes: prod.observacoes || '',
      anexoUrl: prod.anexoUrl || '',
      anexoNome: prod.anexoNome || ''
    });
    setIsDialogOpen(true);
  };

  const openRecebimento = (prodId: string, itemToEdit?: any) => {
    if (itemToEdit) {
      setEditRecebimentoOld(itemToEdit);
      setRecebimentoData({
        producaoId: prodId,
        data: itemToEdit.data || itemToEdit.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        quantidade: itemToEdit.quantidade?.toString() || '',
        quantidadePorTamanho: itemToEdit.quantidadePorTamanho || {},
        quantidadeDefeito: itemToEdit.quantidadeDefeito?.toString() || '',
        observacao: itemToEdit.observacao || ''
      });
    } else {
      setEditRecebimentoOld(null);
      setRecebimentoData({
        producaoId: prodId,
        data: new Date().toISOString().split('T')[0],
        quantidade: '',
        quantidadePorTamanho: {},
        quantidadeDefeito: '',
        observacao: ''
      });
    }
    setIsRecebimentoOpen(true);
  };

  const openPagamento = (prodId: string, itemToEdit?: any) => {
    if (itemToEdit) {
      setEditPagamentoOld(itemToEdit);
      setPagamentoData({
        producaoId: prodId,
        data: itemToEdit.data || itemToEdit.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        valor: itemToEdit.valor?.toString() || '',
        observacao: itemToEdit.observacao || ''
      });
    } else {
      setEditPagamentoOld(null);
      setPagamentoData({
        producaoId: prodId,
        data: new Date().toISOString().split('T')[0],
        valor: '',
        observacao: ''
      });
    }
    setIsPagamentoOpen(true);
  };

  const handleSaveRecebimento = async () => {
    const totalQtd = Object.keys(recebimentoData.quantidadePorTamanho).length > 0 
      ? Object.values(recebimentoData.quantidadePorTamanho).reduce((acc, curr) => acc + (parseInt(curr) || 0), 0)
      : parseInt(recebimentoData.quantidade) || 0;

    if (!totalQtd || totalQtd <= 0 || !recebimentoData.data) {
      toast.error("Preencha data e quantidade recebida.");
      return;
    }
    try {
      const prod = producoes.find(p => p.id === recebimentoData.producaoId);
      if (!prod) return;

      const oldQtd = editRecebimentoOld ? (editRecebimentoOld.quantidade || 0) : 0;
      const oldDefeitos = editRecebimentoOld ? (editRecebimentoOld.quantidadeDefeito || 0) : 0;
      const qtdNova = totalQtd;
      const qtdDefeito = parseInt(recebimentoData.quantidadeDefeito) || 0;

      const totalEntregueAgora = (prod.totalEntregue || 0) - oldQtd + qtdNova;
      const totalDefeitosAgora = (prod.totalDefeitos || 0) - oldDefeitos + qtdDefeito;

      let statusEntrega = prod.statusEntrega;
      if (totalEntregueAgora >= prod.quantidadeTotal) {
        statusEntrega = 'Completo';
      } else if (totalEntregueAgora > 0) {
        statusEntrega = 'Parcial';
      }

      const recebimento = {
        data: recebimentoData.data,
        quantidade: qtdNova,
        quantidadePorTamanho: recebimentoData.quantidadePorTamanho,
        quantidadeDefeito: qtdDefeito,
        observacao: recebimentoData.observacao,
        createdAt: editRecebimentoOld?.createdAt || new Date().toISOString()
      };

      const baseUpdate: any = {
        totalEntregue: Math.max(0, totalEntregueAgora),
        totalPendente: Math.max(0, prod.quantidadeTotal - totalEntregueAgora),
        totalDefeitos: Math.max(0, totalDefeitosAgora),
        statusEntrega,
        updatedAt: serverTimestamp()
      };

      if (editRecebimentoOld) {
         // Modify array in place
         const currentRecebimentos = prod.recebimentos || [];
         const newRecebimentos = currentRecebimentos.map((r: any) => 
            (r === editRecebimentoOld || r.createdAt === editRecebimentoOld.createdAt) ? recebimento : r
         );
         baseUpdate.recebimentos = newRecebimentos;
      } else {
         baseUpdate.recebimentos = arrayUnion(recebimento);
      }

      await updateDoc(doc(db, 'prod_producoes', recebimentoData.producaoId), baseUpdate);

      toast.success(editRecebimentoOld ? "Entrega atualizada!" : "Recebimento lançado com sucesso!");
      setIsRecebimentoOpen(false);
      setEditRecebimentoOld(null);
      fetchData();
    } catch (e) {
      toast.error("Erro ao salvar recebimento.");
    }
  };

  const handleSavePagamento = async () => {
    if (!pagamentoData.valor || !pagamentoData.data) {
      toast.error("Preencha data e valor do pagamento.");
      return;
    }
    try {
      const prod = producoes.find(p => p.id === pagamentoData.producaoId);
      if (!prod) return;

      const valorNovo = parseFloat(pagamentoData.valor) || 0;
      const oldValor = editPagamentoOld ? (parseFloat(editPagamentoOld.valor) || 0) : 0;
      const totalPagoAgora = (prod.totalPagoCostura || 0) - oldValor + valorNovo;

      const pagamento = {
        data: pagamentoData.data,
        valor: valorNovo,
        observacao: pagamentoData.observacao,
        createdAt: editPagamentoOld?.createdAt || new Date().toISOString()
      };

      const baseUpdate: any = {
        totalPagoCostura: Math.max(0, totalPagoAgora),
        updatedAt: serverTimestamp()
      };

      if (editPagamentoOld) {
         const currentPagamentos = prod.pagamentosCostura || [];
         const newPagamentos = currentPagamentos.map((p: any) => 
            (p === editPagamentoOld || p.createdAt === editPagamentoOld.createdAt) ? pagamento : p
         );
         baseUpdate.pagamentosCostura = newPagamentos;
      } else {
         baseUpdate.pagamentosCostura = arrayUnion(pagamento);
      }

      await updateDoc(doc(db, 'prod_producoes', pagamentoData.producaoId), baseUpdate);

      toast.success(editPagamentoOld ? "Pagamento atualizado!" : "Pagamento lançado com sucesso!");
      setIsPagamentoOpen(false);
      setEditPagamentoOld(null);
      fetchData();
    } catch (e) {
      toast.error("Erro ao lançar pagamento.");
    }
  };

  const [deleteRecebimentoConfirm, setDeleteRecebimentoConfirm] = useState<{prodId: string, recebimento: any} | null>(null);
  const [deletePagamentoConfirm, setDeletePagamentoConfirm] = useState<{prodId: string, pagamento: any} | null>(null);

  const handleDeleteRecebimento = async () => {
     if (!deleteRecebimentoConfirm) return;
     const { prodId, recebimento } = deleteRecebimentoConfirm;
     
     try {
       const prod = producoes.find(p => p.id === prodId);
       if (!prod) return;

       const totalEntregueAgora = Math.max(0, (prod.totalEntregue || 0) - (recebimento.quantidade || 0));
       const totalDefeitosAgora = Math.max(0, (prod.totalDefeitos || 0) - (recebimento.quantidadeDefeito || 0));
       
       let statusEntrega = prod.statusEntrega;
       if (totalEntregueAgora === 0) {
          statusEntrega = 'Pendente';
       } else if (totalEntregueAgora < prod.quantidadeTotal) {
          statusEntrega = 'Parcial';
       }

       const newRecebimentos = (prod.recebimentos || []).filter((r: any) => r.createdAt !== recebimento.createdAt);

       await updateDoc(doc(db, 'prod_producoes', prodId), {
         totalEntregue: totalEntregueAgora,
         totalPendente: Math.max(0, prod.quantidadeTotal - totalEntregueAgora),
         totalDefeitos: totalDefeitosAgora,
         statusEntrega,
         recebimentos: newRecebimentos,
         updatedAt: serverTimestamp()
       });

       toast.success("Entrega excluída com sucesso.");
       setDeleteRecebimentoConfirm(null);
       fetchData();
     } catch (e) {
       toast.error("Erro ao excluir entrega.");
     }
  };

  const handleDeletePagamento = async () => {
     if (!deletePagamentoConfirm) return;
     const { prodId, pagamento } = deletePagamentoConfirm;

     try {
       const prod = producoes.find(p => p.id === prodId);
       if (!prod) return;

       const totalPagoAgora = Math.max(0, (prod.totalPagoCostura || 0) - (parseFloat(pagamento.valor) || 0));

       const newPagamentos = (prod.pagamentosCostura || []).filter((p: any) => p.createdAt !== pagamento.createdAt);

       await updateDoc(doc(db, 'prod_producoes', prodId), {
         totalPagoCostura: totalPagoAgora,
         pagamentosCostura: newPagamentos,
         updatedAt: serverTimestamp()
       });

       toast.success("Pagamento excluído com sucesso.");
       setDeletePagamentoConfirm(null);
       fetchData();
     } catch (e) {
       toast.error("Erro ao excluir pagamento.");
     }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      toast.error("O arquivo é muito grande. O limite é 800KB.");
      // Limpar o input
      e.target.value = '';
      return;
    }

    try {
      setUploadingFile(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
         const base64 = reader.result as string;
         setFormData(prev => ({...prev, anexoUrl: base64, anexoNome: file.name}));
         toast.success("Arquivo anexado!");
         setUploadingFile(false);
      };
      reader.onerror = (error) => {
         console.error(error);
         toast.error("Erro ao ler o arquivo.");
         setUploadingFile(false);
      };
    } catch(err) {
      console.error(err);
      toast.error("Erro ao processar arquivo.");
      setUploadingFile(false);
    }
  };

  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", function () {
          resolve(reader.result as string);
        }, false);
        reader.onerror = () => reject();
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  const gerarReciboCostureira = async (prod: any) => {
    const defaultDoc = new jsPDF();
    const docAny = defaultDoc as any;
    
    // Header
    defaultDoc.setFillColor(248, 250, 252);
    defaultDoc.setDrawColor(226, 232, 240);
    defaultDoc.roundedRect(14, 15, 182, 45, 3, 3, 'FD');
    
    defaultDoc.setFontSize(20);
    defaultDoc.setTextColor(30, 41, 59);
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("RECIBO DE COSTURA", 20, 28);
    
    defaultDoc.setFontSize(10);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.setTextColor(100, 116, 139);
    defaultDoc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}  |  ID: ${prod.id.slice(0, 8).toUpperCase()}`, 20, 36);

    if (prod.produtoFoto) {
      try {
        const imgData = await getBase64ImageFromUrl(prod.produtoFoto);
        if (imgData) {
          defaultDoc.addImage(imgData, 'JPEG', 160, 20, 30, 30);
        }
      } catch (e) {
        console.error("Erro ao carregar imagem no PDF", e);
      }
    }

    // Info Blocks
    defaultDoc.setFontSize(11);
    defaultDoc.setTextColor(30, 41, 59);
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Detalhes Gerais Principais", 14, 75);
    defaultDoc.setFont("helvetica", "normal");
    
    defaultDoc.setFontSize(10);
    defaultDoc.text(`Produto: ${prod.produtoNome || 'N/A'}`, 14, 83);
    defaultDoc.text(`Costureiro(a): ${prod.costureiraNome || 'N/A'}`, 14, 89);
    defaultDoc.text(`Prazo Final (Previsto): ${prod.dataPrevistaEntrega ? new Date(prod.dataPrevistaEntrega).toLocaleDateString('pt-BR') : 'N/A'}`, 14, 95);

    let startYTable = 105;
    if (prod.quantidadePorTamanho && Object.keys(prod.quantidadePorTamanho).length > 0) {
       const breakdown = Object.entries(prod.quantidadePorTamanho)
          .map(([t, q]) => `${t}: ${q}`)
          .join('  |  ');
       defaultDoc.text(`Grade/Cores: ${breakdown}`, 14, 101);
       startYTable = 111;
    }
    
    const totalCostura = (parseFloat(prod.valorCostura || 0) * parseInt(prod.quantidadeTotal || 0)).toFixed(2);
    defaultDoc.text(`Valor de Costura por Peça: R$ ${parseFloat(prod.valorCostura || 0).toFixed(2)}`, 110, 83);
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text(`Total Previsto (Costura): R$ ${totalCostura}`, 110, 89);
    defaultDoc.setFont("helvetica", "normal");

    const tableStyles: any = {
      theme: 'grid' as const,
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.1, textColor: [51, 65, 85] },
      headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 255, 255] }
    };
    
    autoTable(docAny, {
      ...tableStyles,
      startY: startYTable,
      head: [['Resumo de Entregas', 'Qtd Total', 'Entregue', 'Falta']],
      body: [
        [
          'Totais Atuais', 
          prod.quantidadeTotal || 0,
          prod.totalEntregue || 0,
          (prod.quantidadeTotal || 0) - (prod.totalEntregue || 0)
        ]
      ]
    });

    if (prod.recebimentos && prod.recebimentos.length > 0) {
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setFontSize(11);
      defaultDoc.text("Histórico de Entregas e Ajustes", 14, (docAny).lastAutoTable.finalY + 12);
      autoTable(docAny, {
        ...tableStyles,
        startY: (docAny).lastAutoTable.finalY + 16,
        head: [['Data', 'Qtd Entregue (Boas)', 'Qtd (Defeito)', 'Observações']],
        body: prod.recebimentos.map((r: any) => {
          let detalhes = r.observacao || '';
          if (r.quantidadePorTamanho && Object.keys(r.quantidadePorTamanho).length > 0) {
             const bd = Object.entries(r.quantidadePorTamanho).map(([t, q]) => `${t}:${q}`).join(', ');
             detalhes = detalhes ? `[${bd}] ${detalhes}` : `[${bd}]`;
          }
          return [
            new Date(r.data).toLocaleDateString('pt-BR'),
            r.quantidade,
            r.quantidadeDefeito || 0,
            detalhes
          ];
        })
      });
    }

    if (prod.pagamentosCostura && prod.pagamentosCostura.length > 0) {
      defaultDoc.setFont("helvetica", "bold");
      defaultDoc.setFontSize(11);
      defaultDoc.text("Extrato / Histórico de Pagamentos", 14, (docAny).lastAutoTable.finalY + 12);
      autoTable(docAny, {
        ...tableStyles,
        startY: (docAny).lastAutoTable.finalY + 16,
        head: [['Data', 'Valor (R$)', 'Observação']],
        body: prod.pagamentosCostura.map((p: any) => [
          new Date(p.data).toLocaleDateString('pt-BR'), parseFloat(p.valor || 0).toFixed(2), p.observacao || ''
        ]),
        foot: [['Total Pago ao Costureiro', `R$ ${(parseFloat(prod.totalPagoCostura) || 0).toFixed(2)}`, '']],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
      });
    }

    defaultDoc.save(`recibo_costura_${prod.id}.pdf`);
  };

  const gerarFichaProducao = async (prod: any) => {
    const defaultDoc = new jsPDF();
    const docAny = defaultDoc as any;
    const pageWidth = defaultDoc.internal.pageSize.getWidth();
    const pageHeight = defaultDoc.internal.pageSize.getHeight();
    
    // Header styling
    defaultDoc.setFillColor(30, 41, 59); // slate-800
    defaultDoc.rect(0, 0, pageWidth, 40, 'F');
    
    defaultDoc.setFontSize(22);
    defaultDoc.setTextColor(255, 255, 255);
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text(`Ficha de Produção: ${prod.id.slice(0, 8).toUpperCase()}`, 14, 20);
    
    defaultDoc.setFontSize(10);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.setTextColor(203, 213, 225); // slate-300
    defaultDoc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
    defaultDoc.text(`Prioridade: ${prod.etiquetas?.[0]?.toUpperCase() || 'NORMAL'} | Status: ${prod.statusEntrega || 'Pendente'}`, 14, 34);

    if (prod.produtoFoto) {
      try {
        const imgData = await getBase64ImageFromUrl(prod.produtoFoto);
        if (imgData) {
          defaultDoc.addImage(imgData, 'JPEG', pageWidth - 35, 8, 24, 24);
        }
      } catch (e) {
        console.error("Erro ao carregar imagem no PDF", e);
      }
    }

    // Custom Section Title function
    const addSectionTitle = (title: string, yPos: number, bgColor: [number, number, number] = [241, 245, 249]) => {
       defaultDoc.setFillColor(...bgColor);
       defaultDoc.rect(14, yPos - 6, pageWidth - 28, 8, 'F');
       defaultDoc.setFontSize(11);
       defaultDoc.setTextColor(15, 23, 42); // slate-900
       defaultDoc.setFont("helvetica", "bold");
       defaultDoc.text(title.toUpperCase(), 16, yPos);
    };

    let startY = 50;

    // 1. INFORMAÇÕES DO PRODUTO
    addSectionTitle("1. Informações do Produto", startY);
    defaultDoc.setFontSize(10);
    defaultDoc.setTextColor(51, 65, 85);
    
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Produto:", 16, startY + 8);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(prod.produtoNome || 'N/A', 35, startY + 8);

    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Qtd. Total:", 110, startY + 8);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(`${prod.quantidadeTotal || 0} pçs`, 135, startY + 8);

    if (prod.quantidadePorTamanho && Object.keys(prod.quantidadePorTamanho).length > 0) {
       const bd = Object.entries(prod.quantidadePorTamanho).map(([t, q]) => `${t}: ${q}`).join(' | ');
       defaultDoc.setFont("helvetica", "bold");
       defaultDoc.text("Grade:", 16, startY + 14);
       defaultDoc.setFont("helvetica", "normal");
       defaultDoc.text(bd, 30, startY + 14);
       
       defaultDoc.setFont("helvetica", "bold");
       defaultDoc.text("Início:", 16, startY + 20);
       defaultDoc.setFont("helvetica", "normal");
       defaultDoc.text(prod.dataInicio ? new Date(prod.dataInicio).toLocaleDateString('pt-BR') : 'N/A', 30, startY + 20);

       defaultDoc.setFont("helvetica", "bold");
       defaultDoc.text("Entrega Prevista:", 110, startY + 20);
       defaultDoc.setFont("helvetica", "normal");
       defaultDoc.text(prod.dataPrevistaEntrega ? new Date(prod.dataPrevistaEntrega).toLocaleDateString('pt-BR') : 'N/A', 145, startY + 20);
       startY += 28;
    } else {
       defaultDoc.setFont("helvetica", "bold");
       defaultDoc.text("Início:", 16, startY + 14);
       defaultDoc.setFont("helvetica", "normal");
       defaultDoc.text(prod.dataInicio ? new Date(prod.dataInicio).toLocaleDateString('pt-BR') : 'N/A', 30, startY + 14);

       defaultDoc.setFont("helvetica", "bold");
       defaultDoc.text("Entrega Prevista:", 110, startY + 14);
       defaultDoc.setFont("helvetica", "normal");
       defaultDoc.text(prod.dataPrevistaEntrega ? new Date(prod.dataPrevistaEntrega).toLocaleDateString('pt-BR') : 'N/A', 145, startY + 14);
       startY += 22;
    }

    // 2. EQUIPE TÉCNICA E PARCEIROS
    addSectionTitle("2. Profissionais e Parceiros", startY);
    
    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Costureira:", 16, startY + 8);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(prod.costureiraNome || 'Não definida', 40, startY + 8);

    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Modelista:", 110, startY + 8);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(prod.nomeModelista || 'Não definido', 135, startY + 8);

    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Cortador:", 16, startY + 14);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(prod.nomeCortador || 'Não definido', 40, startY + 14);

    defaultDoc.setFont("helvetica", "bold");
    defaultDoc.text("Tecido (Forn.):", 110, startY + 14);
    defaultDoc.setFont("helvetica", "normal");
    defaultDoc.text(prod.fornecedorTecido || 'N/A', 140, startY + 14);

    startY += 22;

    // 3. ESTRUTURA DE CUSTOS (TABELA)
    addSectionTitle("3. Estrutura de Custos", startY, [224, 242, 254]); // sky-100
    const tableStyles = {
       theme: 'grid' as const,
       styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, lineColor: [226, 232, 240] as [number, number, number], lineWidth: 0.1, textColor: [51, 65, 85] as [number, number, number] },
       headStyles: { fillColor: [56, 189, 248] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const },
       alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] }
    };

    const qtdTotal = parseInt(prod.quantidadeTotal) || 0;
    const custoTotal = parseFloat(prod.custoTotal) || 0;
    const custoPorPeca = parseFloat(prod.custoPorPeca) || (qtdTotal > 0 ? custoTotal / qtdTotal : 0);

    let tecidoTotal = parseFloat(prod.valorTecido || 0);
    if (prod.fornecedoresTecido && prod.fornecedoresTecido.length > 0) {
      tecidoTotal = prod.fornecedoresTecido.reduce((acc: number, curr: any) => acc + (parseFloat(curr.totalCompra) || 0), 0);
    }

    autoTable(docAny, {
      ...tableStyles,
      startY: startY + 4,
      head: [['Categoria de Custo', 'Status', 'Valor (R$)']],
      body: [
        ['Costura (Total Estimado)', prod.pagoCostura ? 'PAGO' : 'PENDENTE', `R$ ${(parseFloat(prod.valorCostura || 0) * qtdTotal).toFixed(2)}`],
        ['Costura (Valor Unitário)', '-', `R$ ${parseFloat(prod.valorCostura || 0).toFixed(2)} / pç`],
        ['Serviço de Corte', prod.pagoCorte ? 'PAGO' : 'PENDENTE', `R$ ${parseFloat(prod.valorCorte || 0).toFixed(2)}`],
        ['Serviço de Modelagem', prod.pagoModelagem ? 'PAGO' : 'PENDENTE', `R$ ${parseFloat(prod.valorModelagem || 0).toFixed(2)}`],
        ['Serviço de Risco', prod.pagoRisco ? 'PAGO' : 'PENDENTE', `R$ ${parseFloat(prod.valorRisco || 0).toFixed(2)}`],
        ['Tecidos', '-', `R$ ${tecidoTotal.toFixed(2)}`],
        ['Outros Insumos', '-', `R$ ${parseFloat(prod.valorInsumos || 0).toFixed(2)}`],
        ['Gastos Extras', '-', `R$ ${parseFloat(prod.outrosGastos || 0).toFixed(2)}`],
      ],
      foot: [
        ['CUSTO TOTAL DE PRODUÇÃO', '', `R$ ${custoTotal.toFixed(2)}`],
        ['CUSTO MÉDIO POR PEÇA', '', `R$ ${custoPorPeca.toFixed(2)}`]
      ],
      footStyles: { fillColor: [241, 245, 249] as [number, number, number], textColor: [15, 23, 42] as [number, number, number], fontStyle: 'bold' as const }
    });

    startY = (docAny).lastAutoTable.finalY + 10;

    // 4. OBSERVAÇÕES
    if (prod.observacoes) {
       addSectionTitle("4. Observações Gerais", startY);
       defaultDoc.setFontSize(9);
       defaultDoc.setFont("helvetica", "italic");
       const splitObs = defaultDoc.splitTextToSize(prod.observacoes, pageWidth - 28);
       defaultDoc.text(splitObs, 16, startY + 6);
       startY += 10 + (splitObs.length * 4);
    }

    // 5. HISTORICO DE ENTREGAS
    if (prod.recebimentos && prod.recebimentos.length > 0) {
      if (startY > pageHeight - 40) { defaultDoc.addPage(); startY = 20; }
      addSectionTitle("5. Entregas (Costura)", startY, [220, 252, 231]); // green-100
      autoTable(docAny, {
        ...tableStyles,
        headStyles: { fillColor: [34, 197, 94] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const },
        startY: startY + 4,
        head: [['Data', 'Aprovadas', 'Defeito', 'Observação']],
        body: prod.recebimentos.map((r: any) => [
          new Date(r.data).toLocaleDateString('pt-BR'), 
          `${r.quantidade} pçs`, 
          `${r.quantidadeDefeito || 0} pçs`, 
          r.observacao || '-'
        ]),
        foot: [['Total Entregue', `${prod.totalPecasEntregues || 0} pçs`, `${prod.totalPecasDefeito || 0} pçs`, '']],
        footStyles: { fillColor: [240, 253, 244] as [number, number, number], textColor: [21, 128, 61] as [number, number, number], fontStyle: 'bold' as const }
      });
      startY = (docAny).lastAutoTable.finalY + 12;
    }

    // 6. HISTORICO DE PAGAMENTOS
    if (prod.pagamentosCostura && prod.pagamentosCostura.length > 0) {
      if (startY > pageHeight - 40) { defaultDoc.addPage(); startY = 20; }
      addSectionTitle("6. Pagamentos (Costura)", startY, [254, 240, 138]); // yellow-200
      autoTable(docAny, {
        ...tableStyles,
        headStyles: { fillColor: [234, 179, 8] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const },
        startY: startY + 4,
        head: [['Data', 'Valor (R$)', 'Anotação / Ref']],
        body: prod.pagamentosCostura.map((p: any) => [
          new Date(p.data).toLocaleDateString('pt-BR'), 
          `R$ ${parseFloat(p.valor || 0).toFixed(2)}`, 
          p.observacao || '-'
        ]),
        foot: [['Total Pago', `R$ ${(parseFloat(prod.totalPagoCostura) || 0).toFixed(2)}`, '']],
        footStyles: { fillColor: [254, 252, 232] as [number, number, number], textColor: [161, 98, 7] as [number, number, number], fontStyle: 'bold' as const }
      });
    }

    defaultDoc.save(`ficha_produção_${prod.id.slice(0, 8)}.pdf`);
  };

  const filteredProducoes = producoes.filter(p => {
    const sMatch = (p.produtoNome || '').toLowerCase().includes(search.toLowerCase()) || 
                   (p.costureiraNome || '').toLowerCase().includes(search.toLowerCase());
    const prioValue = p.etiquetas && p.etiquetas.length > 0 ? p.etiquetas[0].toLowerCase() : 'normal';
    const prioMatch = priorityFilter.length === 0 || priorityFilter.includes(prioValue);
    const statusMatch = statusFilter.length === 0 || statusFilter.includes((p.statusEntrega || 'Pendente').toLowerCase());
    
    let pagMatch = true;
    if (pagamentoFilter.length > 0) {
      const custoTot = parseFloat(p.valorCostura || 0) * parseInt(p.quantidadeTotal || 0);
      const pago = parseFloat(p.totalPagoCostura || 0);
      let sPag = 'pendente';
      if (custoTot > 0) {
        if (pago >= custoTot) sPag = 'pago';
        else if (pago > 0) sPag = 'parcial';
      } else {
        if (pago > 0) sPag = 'pago';
      }
      pagMatch = pagamentoFilter.includes(sPag);
    }
    
    const faseMatch = faseFilter.length === 0 || faseFilter.includes((p.statusProducao || 'Por Fazer').toLowerCase());

    return sMatch && prioMatch && statusMatch && pagMatch && faseMatch;
  });

  const parsedQtd = parseInt(formData.quantidadeTotal) || 0;
  const calcCustoTecido = formData.fornecedoresTecido.reduce((acc, curr) => acc + (parseFloat(curr.totalCompra) || 0), 0) || (parseFloat(formData.valorTecido) || 0);
  const currentCusto = calcCustoTecido +
    (parseFloat(formData.valorCorte) || 0) +
    (parseFloat(formData.valorModelagem) || 0) +
    (parseFloat(formData.valorRisco) || 0) +
    ((parseFloat(formData.valorCostura) || 0) * parsedQtd) +
    (parseFloat(formData.valorInsumos) || 0) +
    (parseFloat(formData.outrosGastos) || 0);

  return (
    <div className="space-y-8 max-w-none mx-auto p-4 md:p-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Linha de Produção</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Gestão completa de peças e lotes em andamento.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all outline-none rounded-full px-6 h-12 font-bold border-none">
          <Plus size={18} className="mr-2" strokeWidth={3} />
          Nova Produção
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white/60 p-3 rounded-[2rem] border border-border/50 backdrop-blur-xl shadow-sm w-full glass-card sticky top-24 z-20">
        <div className="flex items-center flex-1 min-w-[200px] bg-white/50 rounded-2xl px-2 border border-border/50 shadow-sm h-12 transition-colors focus-within:bg-white focus-within:border-primary/30">
          <Search size={20} className="text-muted-foreground mx-3" strokeWidth={2.5}/>
          <input 
            type="text" 
            placeholder="Buscar por produto ou costureira..."
            className="bg-transparent border-none outline-none text-base w-full placeholder:text-muted-foreground/70 text-foreground font-semibold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 px-1">
          <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden lg:block">Fase:</Label>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-between whitespace-nowrap w-[140px] rounded-[18px] h-12 text-sm font-bold bg-white hover:bg-gray-50 px-4 text-left border border-border/50 text-foreground shadow-sm transition-all focus:ring-4 focus:ring-primary/10">
              <span className="truncate">{faseFilter.length === 0 ? 'Todas' : faseFilter.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}</span>
              <ChevronDown size={14} className="text-muted-foreground ml-2 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px] rounded-2xl p-2 font-medium">
              {(configuracoes.statusProducao || ['Pré-produção', 'Modelagem', 'Risco', 'Corte', 'Costura', 'Finalizado']).map(opt => (
                <DropdownMenuCheckboxItem 
                   key={opt}
                   checked={faseFilter.includes(opt.toLowerCase())}
                   onCheckedChange={(c) => setFaseFilter(prev => c ? [...prev, opt.toLowerCase()] : prev.filter(x => x !== opt.toLowerCase()))}
                   className="text-sm py-2 rounded-xl focus:bg-accent cursor-pointer"
                >
                  {opt}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 px-1">
          <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden lg:block">Prioridade:</Label>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-between whitespace-nowrap w-[140px] rounded-[18px] h-12 text-sm font-bold bg-white hover:bg-gray-50 px-4 text-left border border-border/50 text-foreground shadow-sm transition-all focus:ring-4 focus:ring-primary/10">
              <span className="truncate">{priorityFilter.length === 0 ? 'Todas' : priorityFilter.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}</span>
              <ChevronDown size={14} className="text-muted-foreground ml-2 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px] rounded-2xl p-2 font-medium">
              {(configuracoes.prioridades || []).map(opt => (
                <DropdownMenuCheckboxItem 
                   key={opt}
                   checked={priorityFilter.includes(opt.toLowerCase())}
                   onCheckedChange={(c) => setPriorityFilter(prev => c ? [...prev, opt.toLowerCase()] : prev.filter(x => x !== opt.toLowerCase()))}
                   className="text-sm py-2 rounded-xl focus:bg-accent cursor-pointer"
                >
                  {opt}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 px-1">
          <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden lg:block">Entrega:</Label>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-between whitespace-nowrap w-[140px] rounded-[18px] h-12 text-sm font-bold bg-white hover:bg-gray-50 px-4 text-left border border-border/50 text-foreground shadow-sm transition-all focus:ring-4 focus:ring-primary/10">
              <span className="truncate">{statusFilter.length === 0 ? 'Todas' : statusFilter.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}</span>
              <ChevronDown size={14} className="text-muted-foreground ml-2 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px] rounded-2xl p-2 font-medium">
              {(configuracoes.status || []).map(opt => (
                <DropdownMenuCheckboxItem 
                   key={opt}
                   checked={statusFilter.includes(opt.toLowerCase())}
                   onCheckedChange={(c) => setStatusFilter(prev => c ? [...prev, opt.toLowerCase()] : prev.filter(x => x !== opt.toLowerCase()))}
                   className="text-sm py-2 rounded-xl focus:bg-accent cursor-pointer"
                >
                  {opt}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 px-1">
          <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden lg:block">Pagamento:</Label>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-between whitespace-nowrap w-[140px] rounded-[18px] h-12 text-sm font-bold bg-white hover:bg-gray-50 px-4 text-left border border-border/50 text-foreground shadow-sm transition-all focus:ring-4 focus:ring-primary/10">
              <span className="truncate">{pagamentoFilter.length === 0 ? 'Todos' : pagamentoFilter.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}</span>
              <ChevronDown size={14} className="text-muted-foreground ml-2 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px] rounded-2xl p-2 font-medium">
              {[{value: 'pendente', label: 'Pendente'}, {value: 'parcial', label: 'Parcial'}, {value: 'pago', label: 'Pago'}].map(opt => (
                <DropdownMenuCheckboxItem 
                   key={opt.value}
                   checked={pagamentoFilter.includes(opt.value)}
                   onCheckedChange={(c) => setPagamentoFilter(prev => c ? [...prev, opt.value] : prev.filter(x => x !== opt.value))}
                   className="text-sm py-2 rounded-xl focus:bg-accent cursor-pointer"
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
           {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-200/50 rounded-[3rem] border border-gray-100"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducoes.map((prod) => {
            const isUrgente = prod.etiquetas?.[0] === 'urgente';
            const delivered = parseInt(prod.totalEntregue) || 0;
            const total = parseInt(prod.quantidadeTotal) || 1;
            const progress = isNaN((delivered / total) * 100) ? 0 : (delivered / total) * 100;
            
            const totalCosturaCard = (parseFloat(prod.valorCostura) || 0) * (parseInt(prod.quantidadeTotal) || 0);
            const isPago = totalCosturaCard > 0 && (prod.totalPagoCostura || 0) >= totalCosturaCard;
            const isEntregue = progress >= 100;
            const isExpanded = expandedCards.has(prod.id);

            return (
              <motion.div 
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
                    
                    <div className="flex flex-col gap-2">
                      <div className="text-[14px] font-bold text-muted-foreground">
                        <span className="text-[20px] font-black text-foreground">{delivered.toLocaleString('pt-BR')}</span> / {Number(prod.quantidadeTotal).toLocaleString('pt-BR') || 0}
                      </div>
                      
                      {/* Grade */}
                      {prod.quantidadePorTamanho && Object.keys(prod.quantidadePorTamanho).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                           {Object.entries(prod.quantidadePorTamanho).map(([t, q]) => (
                             <span key={t} className="text-[10px] font-bold bg-white text-foreground px-2 py-0.5 rounded-md border border-border/50">{t}: {q as string}</span>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Linha 4: Financeiro Separado e Organizado */}
                  <div className="bg-accent/30 rounded-[20px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-border/50 backdrop-blur-sm">
                    <div className="flex flex-col min-w-[50%]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] text-muted-foreground font-bold tracking-widest uppercase">Financeiro</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isPago ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{isPago ? 'Pago' : 'Pendente'}</span>
                      </div>
                      <div className="text-[28px] lg:text-[32px] font-black text-foreground tracking-tight leading-none truncate w-full">
                        {(totalCosturaCard).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 w-full md:w-auto md:flex-1 md:border-l border-t md:border-t-0 border-border/50 pt-3 md:pt-0 md:pl-4">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-[12px] text-muted-foreground font-bold">Valor Pago</span>
                        <span className="text-[14px] font-black text-foreground">{(prod.totalPagoCostura || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                      {!isPago && (
                        <div className="flex justify-between items-center mt-1">
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
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-6">
                          <div className="text-sm bg-accent/30 p-5 rounded-3xl border border-border/50">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                               <div>
                                 <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider block mb-1">Custo Un. Costureira</span>
                                 <span className="font-black text-foreground">R$ {parseFloat(prod.valorCostura || 0).toFixed(2)}</span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider block mb-1">Início da Costura</span>
                                 <span className="font-bold text-foreground bg-white px-2 py-1 rounded-lg border border-border/50 shadow-sm">{prod.dataInicioCostura ? new Date(prod.dataInicioCostura).toLocaleDateString('pt-BR') : 'Aguardando'}</span>
                               </div>
                             </div>
                             <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                               <div>
                                 <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider block mb-1">Custo Total (Prev)</span>
                                 <span className="font-black text-foreground text-sm">{(parseFloat(prod.valorCostura || 0) * parseInt(prod.quantidadeTotal || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider block mb-1">Valor Já Pago</span>
                                 <span className="font-black text-green-600 text-sm">{(prod.totalPagoCostura || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider block mb-1">Pendente</span>
                                 <span className="font-black text-orange-500 text-sm">{Math.max(0, (parseFloat(prod.valorCostura || 0) * parseInt(prod.quantidadeTotal || 0)) - (prod.totalPagoCostura || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                               </div>
                             </div>
                             {prod.observacoes && (
                                <div className="sm:col-span-2 mt-4 pt-3 border-t border-border/50">
                                   <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider block mb-1.5">Observações</span>
                                   <p className="text-foreground font-medium italic bg-white/50 p-3 rounded-2xl border border-border/50">"{prod.observacoes}"</p>
                                </div>
                             )}
                          </div>

                          <div className="grid grid-cols-1 gap-6">
                             {/* Histórico de Entregas */}
                             <div className="bg-white/50 border border-border/60 rounded-3xl p-5">
                                <h4 className="font-black text-sm text-foreground mb-4 flex items-center gap-2"><CheckSquare size={16} className="text-primary"/> Histórico de Entregas</h4>
                                <div className="space-y-3">
                                  {!prod.recebimentos || prod.recebimentos.length === 0 ? (
                                     <p className="text-xs font-medium text-muted-foreground text-center py-4">Nenhuma entrega registrada ainda.</p>
                                  ) : (
                                     prod.recebimentos.map((rec: any, i: number) => (
                                        <div key={i} className="flex flex-col gap-1.5 p-3 bg-white rounded-2xl border border-border/40 shadow-sm relative group pr-14">
                                           <div className="flex justify-between items-start">
                                             <span className="text-xs font-bold text-foreground">{new Date(rec.createdAt || rec.data).toLocaleDateString('pt-BR')}</span>
                                             <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">+{rec.quantidade} un.</span>
                                             </div>
                                           </div>
                                           {rec.quantidadeDefeito > 0 && <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 w-max rounded-md">Defeitos: {rec.quantidadeDefeito}</span>}
                                           {rec.observacao && <span className="text-[11px] font-medium text-muted-foreground italic mt-1">"{rec.observacao}"</span>}
                                           
                                           <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="w-7 h-7 rounded-full bg-white shadow-md text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                title="Editar entrega"
                                                onClick={() => openRecebimento(prod.id, rec)}
                                              >
                                                 <Edit2 size={14} />
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="w-7 h-7 rounded-full bg-white shadow-md text-red-500 hover:text-red-700 hover:bg-red-50"
                                                title="Excluir entrega"
                                                onClick={() => setDeleteRecebimentoConfirm({prodId: prod.id, recebimento: rec})}
                                              >
                                                 <Trash2 size={14} />
                                              </Button>
                                           </div>
                                        </div>
                                     ))
                                  )}
                                </div>
                             </div>

                             {/* Histórico de Pagamentos */}
                             <div className="bg-white/50 border border-border/60 rounded-3xl p-5">
                                <h4 className="font-black text-sm text-foreground mb-4 flex items-center gap-2"><DollarSign size={16} className="text-green-600"/> Histórico de Pagamentos</h4>
                                <div className="space-y-3">
                                  {!prod.pagamentosCostura || prod.pagamentosCostura.length === 0 ? (
                                     <p className="text-xs font-medium text-muted-foreground text-center py-4">Nenhum pagamento registrado ainda.</p>
                                  ) : (
                                     prod.pagamentosCostura.map((pag: any, i: number) => (
                                        <div key={i} className="flex flex-col gap-1.5 p-3 bg-white rounded-2xl border border-border/40 shadow-sm relative group pr-14">
                                           <div className="flex justify-between items-start">
                                             <span className="text-xs font-bold text-foreground">{new Date(pag.createdAt || pag.data).toLocaleDateString('pt-BR')}</span>
                                             <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">R$ {parseFloat(pag.valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                                             </div>
                                           </div>
                                           {pag.observacao && <span className="text-[11px] font-medium text-muted-foreground italic mt-1">"{pag.observacao}"</span>}
                                           
                                           <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="w-7 h-7 rounded-full bg-white shadow-md text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                title="Editar pagamento"
                                                onClick={() => openPagamento(prod.id, pag)}
                                              >
                                                 <Edit2 size={14} />
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="w-7 h-7 rounded-full bg-white shadow-md text-red-500 hover:text-red-700 hover:bg-red-50"
                                                title="Excluir pagamento"
                                                onClick={() => setDeletePagamentoConfirm({prodId: prod.id, pagamento: pag})}
                                              >
                                                 <Trash2 size={14} />
                                              </Button>
                                           </div>
                                        </div>
                                     ))
                                  )}
                                </div>
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && filteredProducoes.length === 0 && (
        <div className="text-center py-24 px-4 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-dashed border-border/50 shadow-sm">
          <div className="w-20 h-20 bg-accent rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-white">
             <AlertCircle size={32} className="text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-black text-foreground mb-2 tracking-tight">Nenhuma produção listada</h3>
          <p className="text-muted-foreground font-medium text-sm max-w-sm mx-auto">Tente ajustar seus filtros de busca ou cadastre uma nova ficha de produção para começar.</p>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="mt-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-full px-6 h-12 font-bold focus:ring-4 focus:ring-primary/20">
             Cadastrar Nova Produção
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[750px] lg:max-w-4xl xl:max-w-5xl rounded-[3rem] p-0 glass-card border flex border-border/50 shadow-2xl overflow-hidden flex-col max-h-[90vh] bg-white/80">
          <DialogHeader className="px-8 py-6 border-b border-border/50 bg-white/60 sticky top-0 z-10 backdrop-blur-xl">
            <DialogTitle className="text-2xl font-black text-foreground tracking-tight">{editingId ? 'Editar Produção' : 'Nova Produção'}</DialogTitle>
          </DialogHeader>
          <div className="px-6 lg:px-8 py-6 overflow-y-auto hide-scrollbar">
            {produtos.length === 0 || costureiras.length === 0 ? (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-2xl text-sm mb-4">
                ⚠️ Você precisa cadastrar <strong>Produtos</strong> e <strong>Costureiras</strong> nas configurações antes de criar uma produção.
              </div>
            ) : null}

            <div className="space-y-8">
              
              <div className="bg-white p-6 rounded-[32px] border border-gray-100 space-y-5 shadow-sm">
                <h3 className="font-bold text-gray-800 flex items-center mb-1"><Tag size={20} className="mr-2 text-blue-600"/> Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className={`space-y-2 ${formData.statusProducao === 'Costura' ? 'md:col-span-5' : 'md:col-span-12'}`}>
                    <Label className="text-[#1F2937] font-semibold text-sm">Produto *</Label>
                    <Select value={formData.produtoId} onValueChange={(v) => setFormData({...formData, produtoId: v})}>
                      <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 h-12">
                        <SelectValue placeholder="Selecione o produto..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {produtos.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.statusProducao === 'Costura' && (
                    <>
                      <div className={`space-y-2 ${hasVariants ? 'md:col-span-7' : 'md:col-span-5'}`}>
                        <Label className="text-[#1F2937] font-semibold text-sm">Costureira Responsável *</Label>
                        <Select value={formData.costureiraId} onValueChange={(v) => setFormData({...formData, costureiraId: v})}>
                          <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 h-12">
                            <SelectValue placeholder="Selecione a costureira..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {costureiras.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {hasVariants ? (
                        <div className="space-y-2 md:col-span-12 mt-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                           <Label className="text-[#1F2937] font-bold text-sm">Grade de Tamanhos / Cores (Preencha a quantidade) *</Label>
                           <div className="flex flex-wrap gap-4 items-end mt-2">
                              {selectedVariants.map((tamanho: string) => (
                                 <div key={tamanho} className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md w-max mx-auto">{tamanho}</Label>
                                    <Input 
                                      type="number" 
                                      className="w-16 h-10 text-center rounded-xl bg-white border-blue-200 font-bold shadow-sm"
                                      value={formData.quantidadePorTamanho?.[tamanho] || ''}
                                      onChange={(e) => handleQuantidadeTamanhoChange(tamanho, e.target.value)}
                                    />
                                 </div>
                              ))}
                              <div className="flex flex-col gap-1.5 ml-auto border-l pl-4 border-gray-200">
                                 <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Qtde Total</Label>
                                 <Input type="text" readOnly value={formData.quantidadeTotal || 0} className="w-20 h-10 text-center rounded-xl bg-gray-200 border-none font-black text-gray-700" />
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-[#1F2937] font-bold text-sm">Qtde Total *</Label>
                          <Input type="number" placeholder="Ex: 100" value={formData.quantidadeTotal} onChange={(e) => setFormData({...formData, quantidadeTotal: e.target.value})} className="rounded-xl bg-gray-50 border-blue-200 font-bold h-12" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[32px] border border-gray-100 space-y-5 shadow-sm">
                <h3 className="font-bold text-gray-800 flex items-center mb-1"><Clock size={20} className="mr-2 text-blue-600"/> Prazos e Status</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[#1F2937] font-semibold text-sm">Fase da Produção</Label>
                    <Select value={formData.statusProducao} onValueChange={(v) => setFormData({...formData, statusProducao: v})}>
                      <SelectTrigger className="rounded-xl bg-gray-50 h-12 border-gray-200 text-sm font-medium">
                        <SelectValue placeholder="Selecione a fase" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {(configuracoes.statusProducao || ['Pré-produção', 'Modelagem', 'Risco', 'Corte', 'Costura', 'Finalizado']).map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#1F2937] font-semibold text-sm">Prioridade</Label>
                    <Select value={formData.etiquetaPrioridade} onValueChange={(v) => setFormData({...formData, etiquetaPrioridade: v})}>
                      <SelectTrigger className="rounded-xl bg-gray-50 h-12 border-gray-200 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {(configuracoes.prioridades || []).map(p => (
                          <SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#1F2937] font-semibold text-sm">Data Início</Label>
                    <Input type="date" value={formData.dataInicio} onChange={(e) => setFormData({...formData, dataInicio: e.target.value})} className="rounded-xl bg-gray-50 border-gray-200 h-12 text-sm text-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#1F2937] font-semibold text-sm">Prev. Entrega</Label>
                    <Input type="date" value={formData.dataPrevistaEntrega} onChange={(e) => setFormData({...formData, dataPrevistaEntrega: e.target.value})} className="rounded-xl bg-red-50/50 border-red-200 text-red-700 font-medium h-12" />
                  </div>
                </div>
                
                {formData.statusProducao === 'Costura' && (
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row gap-5 animate-in fade-in zoom-in-95 duration-300 mt-4">
                    <div className="space-y-2 flex-1">
                      <Label className="text-blue-900 font-semibold text-xs uppercase tracking-widest">Início Costura</Label>
                      <Input type="date" value={formData.dataInicioCostura} onChange={(e) => setFormData({...formData, dataInicioCostura: e.target.value})} className="rounded-xl bg-white border-blue-200 h-12 text-sm text-blue-900" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label className="text-blue-900 font-semibold text-xs uppercase tracking-widest">Status Entrega Fatiada</Label>
                      <Select value={formData.statusEntrega} onValueChange={(v) => setFormData({...formData, statusEntrega: v})}>
                        <SelectTrigger className="rounded-xl bg-white h-12 border-blue-200 text-sm font-medium text-blue-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {(configuracoes.status || []).map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

                <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100 shadow-sm flex flex-col">
                  <h3 className="font-bold text-gray-800 flex items-center mb-5"><DollarSign size={20} className="mr-2 text-blue-600"/> Resumo de Custos</h3>
                  
                  <div className="flex-1 flex flex-col justify-center space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-blue-100 text-center shadow-sm">
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Custo Estimado por Peça</div>
                      <div className="text-4xl font-extrabold text-blue-600">
                         {(parsedQtd > 0 ? (currentCusto / parsedQtd) : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm px-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                       <span className="text-gray-600 font-semibold uppercase tracking-wider text-xs">Custo Total da Produção:</span>
                       <span className="font-bold text-gray-900 text-base">{currentCusto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center pl-2 text-sm uppercase tracking-widest"><DollarSign size={16} className="mr-2 text-gray-400"/> Aquisição de Tecido</h3>
                  <div className="bg-white p-5 sm:p-6 rounded-[32px] border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-500 font-medium">Registre os fornecedores do tecido, valores e medidas da compra.</p>
                      {formData.fornecedoresTecido.length < 2 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({...prev, fornecedoresTecido: [...prev.fornecedoresTecido, { fornecedor: '', rolos: '', tipoMedida: 'metros', quantidade: '', valorUnitario: '', totalCompra: '' }]}))} className="h-10 px-4 text-sm text-blue-600 border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 font-bold shadow-sm rounded-xl">
                          + Fornecedor
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-5">
                    {formData.fornecedoresTecido.map((f, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/80 rounded-2xl border border-gray-100/50 relative shadow-sm">
                        {idx > 0 && <Button type="button" variant="ghost" size="icon" onClick={() => {
                           const nf = [...formData.fornecedoresTecido];
                           nf.splice(idx, 1);
                           setFormData(prev => ({...prev, fornecedoresTecido: nf}));
                        }} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-100 text-red-500 shadow-sm hover:bg-red-200"><Trash2 size={14}/></Button>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                           <div className="space-y-1.5 md:col-span-3">
                             <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Fornecedor</Label>
                             <Input placeholder="Ex: Tecidos Ltda" value={f.fornecedor} onChange={(e) => {
                               const nf = [...formData.fornecedoresTecido]; nf[idx].fornecedor = e.target.value; setFormData(prev => ({...prev, fornecedoresTecido: nf}));
                             }} className="rounded-xl bg-white border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] h-11 text-sm focus-visible:ring-1" />
                           </div>
                           <div className="space-y-1.5 md:col-span-1">
                             <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Rolos</Label>
                             <Input type="number" placeholder="0" value={f.rolos} onChange={(e) => {
                               const nf = [...formData.fornecedoresTecido]; nf[idx].rolos = e.target.value; setFormData(prev => ({...prev, fornecedoresTecido: nf}));
                             }} className="rounded-xl bg-white border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] h-11 text-sm focus-visible:ring-1" />
                           </div>
                           <div className="space-y-1.5 md:col-span-2">
                             <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Medida</Label>
                             <Select value={f.tipoMedida} onValueChange={(v: 'metros'|'kg') => {
                               const nf = [...formData.fornecedoresTecido]; nf[idx].tipoMedida = v; setFormData(prev => ({...prev, fornecedoresTecido: nf}));
                             }}>
                                <SelectTrigger className="rounded-xl bg-white border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] h-11 text-sm"><SelectValue/></SelectTrigger>
                                <SelectContent><SelectItem value="metros" className="text-sm">Metros</SelectItem><SelectItem value="kg" className="text-sm">Kg</SelectItem></SelectContent>
                             </Select>
                           </div>
                           <div className="space-y-1.5 md:col-span-2">
                             <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Qtd</Label>
                             <Input type="number" placeholder="0" value={f.quantidade} onChange={(e) => {
                               const nf = [...formData.fornecedoresTecido]; nf[idx].quantidade = e.target.value; 
                               const unit = parseFloat(nf[idx].valorUnitario) || 0;
                               const qtd = parseFloat(e.target.value) || 0;
                               if(unit > 0 && qtd > 0) nf[idx].totalCompra = (unit*qtd).toFixed(2);
                               setFormData(prev => ({...prev, fornecedoresTecido: nf}));
                             }} className="rounded-xl bg-white border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] h-11 text-sm focus-visible:ring-1" />
                           </div>
                           <div className="space-y-1.5 md:col-span-2">
                             <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">V. Unit (R$)</Label>
                             <Input type="number" placeholder="0.00" value={f.valorUnitario} onChange={(e) => {
                               const nf = [...formData.fornecedoresTecido]; nf[idx].valorUnitario = e.target.value; 
                               const qtd = parseFloat(nf[idx].quantidade) || 0;
                               const unit = parseFloat(e.target.value) || 0;
                               if(unit > 0 && qtd > 0) nf[idx].totalCompra = (unit*qtd).toFixed(2);
                               setFormData(prev => ({...prev, fornecedoresTecido: nf}));
                             }} className="rounded-xl bg-white border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] h-11 text-sm focus-visible:ring-1" />
                           </div>
                           <div className="space-y-1.5 md:col-span-2">
                             <Label className="text-[11px] font-bold text-blue-600 uppercase tracking-widest ml-1">Total (R$)</Label>
                             <Input type="number" placeholder="0.00" value={f.totalCompra} onChange={(e) => {
                               const nf = [...formData.fornecedoresTecido]; nf[idx].totalCompra = e.target.value; setFormData(prev => ({...prev, fornecedoresTecido: nf}));
                             }} className="rounded-xl bg-blue-50/50 border-blue-200 text-blue-900 shadow-sm h-11 text-sm font-bold focus-visible:ring-1" />
                           </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-gray-800 flex items-center pl-2 text-sm uppercase tracking-widest"><DollarSign size={20} className="mr-2 text-gray-400"/> Serviços e Pagamentos</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                     {/* Modelagem */}
                     <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-4 relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                        <div className="flex justify-between items-center pl-3">
                          <Label className="text-base font-bold text-gray-800">Modelagem</Label>
                          <label className={`flex items-center gap-2 text-xs font-bold cursor-pointer px-3 py-1.5 rounded-xl border transition-colors ${formData.pagoModelagem ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                             <input type="checkbox" checked={formData.pagoModelagem} onChange={e => setFormData({...formData, pagoModelagem: e.target.checked})} className="rounded text-green-600 focus:ring-green-500 w-4 h-4" />
                             PAGO
                          </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3">
                          <div className="space-y-1.5">
                             <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profissional</Label>
                             <Input placeholder="Nome" value={formData.nomeModelista} onChange={e => setFormData({...formData, nomeModelista: e.target.value})} className="h-11 text-sm rounded-xl bg-gray-50 border-gray-200 shadow-sm focus-visible:ring-1" />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Valor Total (R$)</Label>
                             <Input type="number" placeholder="0.00" value={formData.valorModelagem} onChange={e => setFormData({...formData, valorModelagem: e.target.value})} className="h-11 text-sm rounded-xl bg-white border-blue-200 shadow-sm focus-visible:ring-1 font-bold text-blue-900" />
                          </div>
                        </div>
                     </div>

                     {/* Risco */}
                     <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-4 relative overflow-hidden group hover:border-purple-200 transition-colors">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                        <div className="flex justify-between items-center pl-3">
                          <Label className="text-base font-bold text-gray-800">Risco</Label>
                          <label className={`flex items-center gap-2 text-xs font-bold cursor-pointer px-3 py-1.5 rounded-xl border transition-colors ${formData.pagoRisco ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                             <input type="checkbox" checked={formData.pagoRisco} onChange={e => setFormData({...formData, pagoRisco: e.target.checked})} className="rounded text-green-600 focus:ring-green-500 w-4 h-4" />
                             PAGO
                          </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3">
                          <div className="space-y-1.5">
                             <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profissional</Label>
                             <Input placeholder="Nome" value={formData.nomeRiscador} onChange={e => setFormData({...formData, nomeRiscador: e.target.value})} className="h-11 text-sm rounded-xl bg-gray-50 border-gray-200 shadow-sm focus-visible:ring-1" />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Valor Total (R$)</Label>
                             <Input type="number" placeholder="0.00" value={formData.valorRisco} onChange={e => setFormData({...formData, valorRisco: e.target.value})} className="h-11 text-sm rounded-xl bg-white border-purple-200 shadow-sm focus-visible:ring-1 font-bold text-purple-900" />
                          </div>
                        </div>
                     </div>

                     {/* Corte */}
                     <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-4 relative overflow-hidden group hover:border-amber-200 transition-colors">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                        <div className="flex justify-between items-center pl-3">
                          <Label className="text-base font-bold text-gray-800">Corte</Label>
                          <label className={`flex items-center gap-2 text-xs font-bold cursor-pointer px-3 py-1.5 rounded-xl border transition-colors ${formData.pagoCorte ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                             <input type="checkbox" checked={formData.pagoCorte} onChange={e => setFormData({...formData, pagoCorte: e.target.checked})} className="rounded text-green-600 focus:ring-green-500 w-4 h-4" />
                             PAGO
                          </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3">
                          <div className="space-y-1.5">
                             <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profissional</Label>
                             <Input placeholder="Nome" value={formData.nomeCortador} onChange={e => setFormData({...formData, nomeCortador: e.target.value})} className="h-11 text-sm rounded-xl bg-gray-50 border-gray-200 shadow-sm focus-visible:ring-1" />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Valor Total (R$)</Label>
                             <Input type="number" placeholder="0.00" value={formData.valorCorte} onChange={e => setFormData({...formData, valorCorte: e.target.value})} className="h-11 text-sm rounded-xl bg-white border-amber-200 shadow-sm focus-visible:ring-1 font-bold text-amber-900" />
                          </div>
                        </div>
                     </div>

                     {/* Costura */}
                     <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-4 relative overflow-hidden group hover:border-teal-200 transition-colors">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
                        <div className="flex justify-between items-center pl-3">
                          <Label className="text-base font-bold text-gray-800">Costura</Label>
                          <label className={`flex items-center gap-2 text-xs font-bold cursor-pointer px-3 py-1.5 rounded-xl border transition-colors ${formData.pagoCostura ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                             <input type="checkbox" checked={formData.pagoCostura} onChange={e => setFormData({...formData, pagoCostura: e.target.checked})} className="rounded text-green-600 focus:ring-green-500 w-4 h-4" />
                             PAGO TOTAL
                          </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3">
                          <div className="space-y-1.5 sm:col-span-2">
                             <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Valor Unitário Pago à Costureira</Label>
                             <div className="flex items-center">
                               <span className="bg-gray-50 border border-r-0 border-gray-200 h-11 px-4 rounded-l-xl flex items-center text-gray-500 font-bold">R$</span>
                               <Input type="number" placeholder="0.00" value={formData.valorCostura} onChange={e => setFormData({...formData, valorCostura: e.target.value})} className="h-11 text-sm rounded-r-xl rounded-l-none bg-white border-teal-200 shadow-sm focus-visible:ring-1 font-bold text-teal-800 flex-1" />
                             </div>
                             <p className="text-[11px] text-gray-400 mt-1">* {formData.quantidadeTotal || 0} peças = R$ {((parseFloat(formData.valorCostura) || 0) * (parseFloat(formData.quantidadeTotal) || 0)).toFixed(2)}</p>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-gray-800 flex items-center pl-2 text-sm uppercase tracking-widest"><DollarSign size={20} className="mr-2 text-gray-400"/> Insumos e Extras</h3>
                  <div className="bg-white p-5 sm:p-6 rounded-[32px] border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5 p-4 bg-gray-50/80 rounded-2xl border border-gray-100/50">
                          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Insumos (Total em R$)</Label>
                          <Input type="number" placeholder="0.00" value={formData.valorInsumos} onChange={(e) => setFormData({...formData, valorInsumos: e.target.value})} className="rounded-xl bg-white border-gray-200 h-11 text-sm focus-visible:ring-1" />
                        </div>
                        <div className="space-y-1.5 p-4 bg-gray-50/80 rounded-2xl border border-gray-100/50">
                          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Outros Gastos (R$)</Label>
                          <Input type="number" placeholder="0.00" value={formData.outrosGastos} onChange={(e) => setFormData({...formData, outrosGastos: e.target.value})} className="rounded-xl bg-white border-gray-200 h-11 text-sm focus-visible:ring-1" />
                        </div>
                     </div>
                  </div>
                </div>

              <div className="space-y-6 pt-4">
                <div className="space-y-2.5">
                  <Label className="text-[#1F2937] font-semibold text-sm pl-2">Anexos / Nota PDF / Risco</Label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-[24px] border border-gray-200 border-dashed">
                    <Button variant="outline" className="relative cursor-pointer rounded-xl bg-white h-11 shrink-0 px-5 shadow-sm font-semibold text-gray-700 hover:text-blue-600 hover:border-blue-200" disabled={uploadingFile}>
                      {uploadingFile ? <Loader2 className="animate-spin mr-2" size={16} /> : <Paperclip className="mr-2 text-gray-400" size={16} />}
                      {uploadingFile ? "Enviando..." : "Selecionar Arquivo"}
                      <input 
                        type="file" 
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,image/*"
                      />
                    </Button>
                    {formData.anexoUrl ? (
                      <div className="flex-1 w-full min-w-0 flex items-center justify-between text-sm bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                        <span className="truncate flex-1 font-medium text-blue-600 px-2">{formData.anexoNome || "Arquivo Anexado"}</span>
                        <div className="flex items-center gap-1">
                          <a href={formData.anexoUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700 font-semibold px-3 py-1 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">Abrir</a>
                          <Button variant="ghost" size="icon" onClick={() => setFormData(p => ({...p, anexoUrl: '', anexoNome: ''}))} className="w-8 h-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={16}/></Button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">Nenhum arquivo enviado</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 pb-8">
                  <Label className="text-foreground font-bold text-sm pl-2">Observações Gerais</Label>
                  <textarea 
                    placeholder="Detalhes adicionais, restrições, observações especiais de qualidade..." 
                    value={formData.observacoes} 
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})} 
                    className="w-full rounded-[2rem] border-border/50 bg-white/50 backdrop-blur-sm shadow-sm resize-none p-6 text-sm focus:ring-4 focus:ring-primary/10 hover:border-primary/30 outline-none transition-all min-h-[120px]" 
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-8 py-5 border-t border-border/50 bg-white/60 sticky bottom-0 z-10 backdrop-blur-xl">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-2xl h-12 font-bold px-6 border-border/50 text-muted-foreground hover:text-foreground">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 font-bold px-8 shadow-lg shadow-primary/20 active:scale-95 transition-all">Salvar Produção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRecebimentoOpen} onOpenChange={setIsRecebimentoOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 glass-card border border-border/50 shadow-2xl bg-white/90">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-foreground">Registrar Entrega</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Data de Recebimento *</Label>
              <Input type="date" value={recebimentoData.data} onChange={e => setRecebimentoData({...recebimentoData, data: e.target.value})} className="rounded-xl" />
            </div>
            
            {(() => {
              const currentProd = producoes.find(p => p.id === recebimentoData.producaoId);
              const p_variants = currentProd?.quantidadePorTamanho ? Object.keys(currentProd.quantidadePorTamanho) : [];
              
              if (p_variants.length > 0) {
                return (
                  <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-border">
                    <Label className="font-bold">Quantidade Recebida por Grade / Cor *</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {p_variants.map(variant => (
                        <div key={variant} className="flex flex-col gap-1.5 border border-border/50 bg-white p-2 rounded-xl">
                          <Label className="text-[10px] font-black text-primary px-1">{variant}</Label>
                          <Input 
                            type="number"
                            placeholder="0"
                            className="w-16 h-8 text-center rounded-lg font-bold shadow-sm px-1 text-sm border-primary/20"
                            value={recebimentoData.quantidadePorTamanho[variant] || ''}
                            onChange={(e) => {
                               setRecebimentoData({
                                 ...recebimentoData,
                                 quantidadePorTamanho: {
                                    ...recebimentoData.quantidadePorTamanho,
                                    [variant]: e.target.value
                                 }
                               });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  <Label>Quantidade Recebida (Peças Boas) *</Label>
                  <Input type="number" value={recebimentoData.quantidade} onChange={e => setRecebimentoData({...recebimentoData, quantidade: e.target.value})} placeholder="0" className="rounded-xl font-bold" />
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label>Quantidade com Defeito</Label>
              <Input type="number" value={recebimentoData.quantidadeDefeito} onChange={e => setRecebimentoData({...recebimentoData, quantidadeDefeito: e.target.value})} placeholder="0" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Observação do Recebimento</Label>
              <Input placeholder="Faltou acabamento, botão, etc..." value={recebimentoData.observacao} onChange={e => setRecebimentoData({...recebimentoData, observacao: e.target.value})} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsRecebimentoOpen(false)} className="rounded-2xl h-12 font-bold">Cancelar</Button>
            <Button onClick={handleSaveRecebimento} className="bg-green-600 hover:bg-green-700 text-white rounded-2xl h-12 font-bold px-6 shadow-lg shadow-green-500/20">Confirmar Entrega</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 glass-card border border-red-100 shadow-2xl text-center bg-white/95">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
             <Trash2 size={32} className="text-red-600" strokeWidth={1.5} />
          </div>
          <DialogTitle className="text-2xl font-black mb-2 text-foreground">Excluir Produção?</DialogTitle>
          <p className="text-muted-foreground text-sm mb-8 font-medium">Esta ação não poderá ser desfeita. Deseja realmente remover permanentemente este registro?</p>
          <DialogFooter className="flex gap-3 sm:justify-center w-full">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="rounded-2xl flex-1 h-12 font-bold border-border/50">Cancelar</Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-2xl flex-1 h-12 font-bold shadow-lg shadow-red-500/20">Sim, Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteRecebimentoConfirm} onOpenChange={() => setDeleteRecebimentoConfirm(null)}>
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 glass-card border border-red-100 shadow-2xl text-center bg-white/95">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
             <Trash2 size={32} className="text-red-600" strokeWidth={1.5} />
          </div>
          <DialogTitle className="text-2xl font-black mb-2 text-foreground">Excluir Entrega?</DialogTitle>
          <p className="text-muted-foreground text-sm mb-8 font-medium">Esta ação não poderá ser desfeita. Deseja remover este registro de entrega e recalcular os totais?</p>
          <DialogFooter className="flex gap-3 sm:justify-center w-full">
            <Button variant="outline" onClick={() => setDeleteRecebimentoConfirm(null)} className="rounded-2xl flex-1 h-12 font-bold border-border/50">Cancelar</Button>
            <Button onClick={handleDeleteRecebimento} className="bg-red-600 hover:bg-red-700 text-white rounded-2xl flex-1 h-12 font-bold shadow-lg shadow-red-500/20">Sim, Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletePagamentoConfirm} onOpenChange={() => setDeletePagamentoConfirm(null)}>
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 glass-card border border-red-100 shadow-2xl text-center bg-white/95">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
             <Trash2 size={32} className="text-red-600" strokeWidth={1.5} />
          </div>
          <DialogTitle className="text-2xl font-black mb-2 text-foreground">Excluir Pagamento?</DialogTitle>
          <p className="text-muted-foreground text-sm mb-8 font-medium">Esta ação não poderá ser desfeita. Deseja remover este registro de pagamento?</p>
          <DialogFooter className="flex gap-3 sm:justify-center w-full">
            <Button variant="outline" onClick={() => setDeletePagamentoConfirm(null)} className="rounded-2xl flex-1 h-12 font-bold border-border/50">Cancelar</Button>
            <Button onClick={handleDeletePagamento} className="bg-red-600 hover:bg-red-700 text-white rounded-2xl flex-1 h-12 font-bold shadow-lg shadow-red-500/20">Sim, Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPagamentoOpen} onOpenChange={setIsPagamentoOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 glass-card border border-border/50 shadow-2xl bg-white/90">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center text-foreground">
              <Wallet className="mr-3 text-green-600" size={28} strokeWidth={2.5}/> Lançar Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 mb-2">
              <p className="text-sm text-green-800 font-medium">Informe o valor que você está pagando agora para a costureira referente a esta produção.</p>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Valor do Pagamento (R$) *</Label>
              <Input type="number" placeholder="0.00" value={pagamentoData.valor} onChange={e => setPagamentoData({...pagamentoData, valor: e.target.value})} className="rounded-xl bg-white border-green-200 text-lg font-bold text-green-700 h-12" />
            </div>
            <div className="space-y-2">
              <Label>Data do Pagamento *</Label>
              <Input type="date" value={pagamentoData.data} onChange={e => setPagamentoData({...pagamentoData, data: e.target.value})} className="rounded-xl bg-white h-11" />
            </div>
            <div className="space-y-2">
              <Label>Observação (Opcional)</Label>
              <Input placeholder="Pix, dinheiro, etc..." value={pagamentoData.observacao} onChange={e => setPagamentoData({...pagamentoData, observacao: e.target.value})} className="rounded-xl bg-white h-11" />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsPagamentoOpen(false)} className="rounded-2xl h-12 font-bold border-border/50">Cancelar</Button>
            <Button onClick={handleSavePagamento} className="bg-green-600 hover:bg-green-700 text-white rounded-2xl h-12 font-bold px-8 shadow-lg shadow-green-500/20">Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
