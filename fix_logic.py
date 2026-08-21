import re

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

logic = """
  const resetForm = () => {
    setFormData(defaultExpense);
    setEditingExpense(null);
  };

  const stats = useMemo(() => {
    let totalVar = 0;
    let listCount = 0;
    const catMap: Record<string, number> = {};
    let pendentesCount = 0;

    expenses.forEach(ev => {
      if (ev.status === 'pendente' || ev.status === 'analise') {
        pendentesCount++;
      } else {
        const val = Number(ev.value) || 0;
        totalVar += val;
        listCount++;
        catMap[ev.category || 'Outros'] = (catMap[ev.category || 'Outros'] || 0) + val;
      }
    });

    const maiorCat = Object.entries(catMap).sort((a,b) => b[1] - a[1])[0] || ['Nenhuma', 0];
    const ticketMedio = listCount > 0 ? totalVar / listCount : 0;

    return { totalVar, listCount, maiorCat: { name: maiorCat[0], value: maiorCat[1] }, ticketMedio, pendentesCount };
  }, [expenses]);

  const filteredList = useMemo(() => {
    return expenses.filter(ev => {
      if (ev.status === 'pendente' || ev.status === 'analise') return false;
      if (filterCategory !== 'Todas' && ev.category !== filterCategory) return false;
      if (filterOrigin !== 'Todas' && ev.origin !== filterOrigin) return false;
      if (filterAccount !== 'Todas' && ev.account !== filterAccount) return false;
      if (filterPaymentMode !== 'Todos' && ev.paymentMethod !== filterPaymentMode) return false;
      if (filterStatus !== 'Todos' && ev.status !== filterStatus) return false;
      if (search && !ev.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      if (filterOrder === 'Mais recentes') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (filterOrder === 'Mais antigas') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (filterOrder === 'Maior valor') return Number(b.value) - Number(a.value);
      if (filterOrder === 'Menor valor') return Number(a.value) - Number(b.value);
      return 0;
    });
  }, [expenses, filterCategory, filterOrigin, filterAccount, filterPaymentMode, filterStatus, search, filterOrder]);

  const pendentes = useMemo(() => expenses.filter(ev => ev.status === 'pendente' || ev.status === 'analise'), [expenses]);

  const getOriginIcon = (origin: string) => origin === 'audio' ? <Mic size={14}/> : origin === 'camera' ? <Camera size={14}/> : <Keyboard size={14}/>;
  const getOriginLabel = (origin: string) => origin === 'audio' ? 'Áudio' : origin === 'camera' ? 'Foto' : 'Manual';
  const statusColors: any = { categorizado: 'bg-green-500/10 text-green-500', pendente: 'bg-orange-500/10 text-orange-500', analise: 'bg-blue-500/10 text-blue-500' };
  const statusLabels: any = { categorizado: 'Categorizado', pendente: 'Pendente', analise: 'Em Análise' };

  const handleSaveExpense = async (e: any) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingExpense) {
        await updateDoc(doc(db, 'variable_expenses', editingExpense.id), { ...formData });
        toast.success('Despesa atualizada!');
      } else {
        await addDoc(collection(db, 'variable_expenses'), { ...formData, userId: user.uid, createdAt: new Date().toISOString() });
        toast.success('Despesa adicionada!');
      }
      setIsManualModalOpen(false);
      resetForm();
    } catch (e) {
      toast.error('Erro ao salvar despesa.');
    }
  };

  const handleDupe = async (ev: any) => {
    if (!user) return;
    try {
      const { id, ...data } = ev;
      await addDoc(collection(db, 'variable_expenses'), { ...data, createdAt: new Date().toISOString() });
      toast.success('Despesa duplicada!');
    } catch (e) {
      toast.error('Erro ao duplicar.');
    }
  };

  const handleDelete = async (ev: any) => {
    if(!confirm('Tem certeza?')) return;
    try {
      await deleteDoc(doc(db, 'variable_expenses', ev.id));
      toast.success('Despesa excluída!');
    } catch (e) {
      toast.error('Erro ao excluir.');
    }
  };

  const openReview = (ev: any) => {
    setEditingExpense(ev);
    setFormData(ev);
    setIsReviewModalOpen(true);
  };

  const handleSimulateAudioSave = () => {};
  const handleSimulatePhotoSave = () => {};
  const handleDescriptionChange = (e: any) => setFormData({...formData, description: e.target.value});
  const formatValue = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
"""

content = content.replace(
    '  return (\n    <div className="space-y-8 animate-in fade-in duration-500',
    logic + '\n  return (\n    <div className="space-y-8 animate-in fade-in duration-500'
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
