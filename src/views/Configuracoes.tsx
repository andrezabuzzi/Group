import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { User, Users, Settings as SettingsIcon, Plus, X } from 'lucide-react';
import Costureiras from './Costureiras';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';

const tabs = [
  { id: 'perfil', name: 'Perfil', icon: User },
  { id: 'prod_costureiras', name: 'Costureiras', icon: Users },
  { id: 'sistema', name: 'Sistema', icon: SettingsIcon }
];

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('perfil');
  const { user } = useAuth();
  
  // Custom Settings State
  const [prioridades, setPrioridades] = useState<string[]>(['Normal', 'Urgente', 'Reposição']);
  const [statusList, setStatusList] = useState<string[]>(['Pendente', 'Parcial', 'Completo']);
  const [statusProducaoList, setStatusProducaoList] = useState<string[]>(['Pré-produção', 'Modelagem', 'Risco', 'Corte', 'Costura', 'Finalizado']);
  const [newPrioridade, setNewPrioridade] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newStatusProducao, setNewStatusProducao] = useState('');
  const [bancos, setBancos] = useState<string[]>(['Nubank PJ', 'Inter PJ', 'Mercado Pago', 'Caixa', 'Dinheiro', 'Cartão', 'Outra']);
  const [categoriasFinanceiro, setCategoriasFinanceiro] = useState<string[]>(['Aluguel', 'Internet', 'Energia', 'Água', 'Funcionários', 'Pró-labore', 'Software', 'Marketing', 'Contador', 'Impostos', 'Veículo', 'Empréstimos', 'Consórcio', 'Cartão', 'Assinaturas', 'Compras de Produto', 'Insumos', 'Embalagens', 'Aviamentos', 'Tecido', 'Frete', 'Motoboy', 'Correios', 'Combustível', 'Alimentação', 'Marketplace', 'Taxas', 'Anúncios', 'Manutenção', 'Material de Escritório', 'Transporte', 'Viagem', 'Fornecedor', 'Outros']);
  const [newBanco, setNewBanco] = useState('');
  const [newCategoria, setNewCategoria] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(false);

  const [profileName, setProfileName] = useState('João Silva');
  const [profileEmail, setProfileEmail] = useState('joao@confeccaopro.com');
  const [profileCompany, setProfileCompany] = useState('Confecção Pro');
  const [profilePhone, setProfilePhone] = useState('(11) 99999-9999');

  useEffect(() => {
    if (user && (activeTab === 'sistema' || activeTab === 'perfil')) {
      loadConfig();
    }
  }, [user, activeTab]);

  const loadConfig = async () => {
    if (!user) return;
    setLoadingConfig(true);
    try {
      const docRef = doc(db, 'configuracoes', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.profile) {
          if (data.profile.name) setProfileName(data.profile.name);
          if (data.profile.email) setProfileEmail(data.profile.email);
          if (data.profile.company) setProfileCompany(data.profile.company);
          if (data.profile.phone) setProfilePhone(data.profile.phone);
        }
        if (data.prioridades && data.prioridades.length > 0) setPrioridades(data.prioridades);
        if (data.status && data.status.length > 0) setStatusList(data.status);
        if (data.statusProducao && data.statusProducao.length > 0) setStatusProducaoList(data.statusProducao);
        if (data.bancos && data.bancos.length > 0) setBancos(data.bancos);
        if (data.categoriasFinanceiro && data.categoriasFinanceiro.length > 0) setCategoriasFinanceiro(data.categoriasFinanceiro);
      }
    } catch (error) {
       console.error("Erro ao carregar configurações", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const saveCustomConfig = async (newPrioridades: string[], newStatusList: string[], newStatusProducaoList: string[], newBancos?: string[], newCategorias?: string[]) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'configuracoes', user.uid);
      await setDoc(docRef, {
        prioridades: newPrioridades,
        status: newStatusList,
        statusProducao: newStatusProducaoList,
        ...(newBancos && { bancos: newBancos }),
        ...(newCategorias && { categoriasFinanceiro: newCategorias }),
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'configuracoes');
       toast.error('Erro ao salvar ou atualizar configurações.');
    }
  };

  const saveProfile = async () => {

    if (!user) return;

    try {

      const docRef = doc(db, 'configuracoes', user.uid);

      await setDoc(docRef, {

        profile: {

          name: profileName,

          email: profileEmail,

          company: profileCompany,

          phone: profilePhone

        },

        updatedAt: new Date()

      }, { merge: true });

      toast.success('Perfil atualizado com sucesso!');

    } catch (error) {

       handleFirestoreError(error, OperationType.WRITE, 'configuracoes');

       toast.error('Erro ao atualizar perfil.');

    }

  };


    const addBanco = () => {
    if (newBanco.trim() && !bancos.includes(newBanco.trim())) {
      const updated = [...bancos, newBanco.trim()];
      setBancos(updated);
      setNewBanco('');
      saveCustomConfig(prioridades, statusList, statusProducaoList, updated, categoriasFinanceiro);
    }
  };
  const removeBanco = (banco: string) => {
    const updated = bancos.filter(b => b !== banco);
    setBancos(updated);
    saveCustomConfig(prioridades, statusList, statusProducaoList, updated, categoriasFinanceiro);
  };
  
  const addCategoria = () => {
    if (newCategoria.trim() && !categoriasFinanceiro.includes(newCategoria.trim())) {
      const updated = [...categoriasFinanceiro, newCategoria.trim()];
      setCategoriasFinanceiro(updated);
      setNewCategoria('');
      saveCustomConfig(prioridades, statusList, statusProducaoList, bancos, updated);
    }
  };
  const removeCategoria = (cat: string) => {
    const updated = categoriasFinanceiro.filter(c => c !== cat);
    setCategoriasFinanceiro(updated);
    saveCustomConfig(prioridades, statusList, statusProducaoList, bancos, updated);
  };

  const addPrioridade = () => {
    if (newPrioridade.trim() && !prioridades.includes(newPrioridade.trim())) {
      const updated = [...prioridades, newPrioridade.trim()];
      setPrioridades(updated);
      setNewPrioridade('');
      saveCustomConfig(updated, statusList, statusProducaoList, bancos, categoriasFinanceiro);
    }
  };

  const removePrioridade = (val: string) => {
    const updated = prioridades.filter(p => p !== val);
    setPrioridades(updated);
    saveCustomConfig(updated, statusList, statusProducaoList, bancos, categoriasFinanceiro);
  };

  const addStatus = () => {
    if (newStatus.trim() && !statusList.includes(newStatus.trim())) {
      const updated = [...statusList, newStatus.trim()];
      setStatusList(updated);
      setNewStatus('');
      saveCustomConfig(prioridades, updated, statusProducaoList, bancos, categoriasFinanceiro);
    }
  };

  const removeStatus = (val: string) => {
    const updated = statusList.filter(s => s !== val);
    setStatusList(updated);
    saveCustomConfig(prioridades, updated, statusProducaoList, bancos, categoriasFinanceiro);
  };

  const addStatusProducao = () => {
    if (newStatusProducao.trim() && !statusProducaoList.includes(newStatusProducao.trim())) {
      const updated = [...statusProducaoList, newStatusProducao.trim()];
      setStatusProducaoList(updated);
      setNewStatusProducao('');
      saveCustomConfig(prioridades, statusList, updated, bancos, categoriasFinanceiro);
    }
  };

  const removeStatusProducao = (val: string) => {
    const updated = statusProducaoList.filter(s => s !== val);
    setStatusProducaoList(updated);
    saveCustomConfig(prioridades, statusList, updated, bancos, categoriasFinanceiro);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-none mx-auto p-4 md:p-8 pb-10">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">Ajustes da conta e preferências do sistema.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 xl:w-72 shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'text-muted-foreground hover:bg-white/60 hover:text-foreground hover:scale-[1.01]'
                }`}
              >
                <tab.icon size={20} className={activeTab === tab.id ? "text-white" : "opacity-70"} />
                {tab.name}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 w-full min-w-0">
          {activeTab === 'prod_costureiras' ? (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
               <Costureiras />
            </div>
          ) : (
            <Card className="glass-card shadow-premium rounded-[3rem] border border-border/50 overflow-hidden bg-white/60">
              <CardContent className="p-8 md:p-10">
                {activeTab === 'perfil' && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2.5">
                        <label className="text-sm font-bold text-foreground pl-1">Nome Completo</label>
                        <Input value={profileName} onChange={e => setProfileName(e.target.value)} className="rounded-2xl bg-white/50 border-border/50 h-12 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-sm" />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-sm font-bold text-foreground pl-1">E-mail</label>
                        <Input value={profileEmail} onChange={e => setProfileEmail(e.target.value)} type="email" className="rounded-2xl bg-white/50 border-border/50 h-12 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-sm" />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-sm font-bold text-foreground pl-1">Empresa</label>
                        <Input value={profileCompany} onChange={e => setProfileCompany(e.target.value)} className="rounded-2xl bg-white/50 border-border/50 h-12 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-sm" />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-sm font-bold text-foreground pl-1">Telefone / WhatsApp</label>
                        <Input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className="rounded-2xl bg-white/50 border-border/50 h-12 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-sm" />
                      </div>
                    </div>

                    <div className="pt-8 mt-6 border-t border-border/30 flex justify-end">
                      <Button onClick={saveProfile} className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95">
                        Salvar Alterações
                      </Button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'sistema' && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <h3 className="text-2xl font-black text-foreground mb-1 tracking-tight">Configurações do Sistema</h3>
                      <p className="text-sm text-muted-foreground font-medium mb-8">Personalize as etiquetas e opções disponíveis nos formulários da aplicação.</p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                       {/* PIN Financeiro */}
                       <div className="space-y-5 bg-accent/30 p-6 md:p-8 rounded-[2rem] border border-border/50 flex flex-col">
                        <div>
                          <h4 className="font-bold text-foreground text-base">PIN Financeiro</h4>
                          <p className="text-xs text-muted-foreground font-medium mt-1">Defina o PIN de 4 dígitos usado para visualizar valores financeiros.</p>
                        </div>
                        <div className="flex gap-3 mt-auto">
                          <Input 
                            type="password"
                            placeholder="Novo PIN (4 dígitos)" 
                            maxLength={4}
                            onChange={e => {
                              if (e.target.value.length === 4) {
                                localStorage.setItem('app_pin', e.target.value);
                                toast.success('PIN atualizado com sucesso!');
                                e.target.value = '';
                              }
                            }}
                            className="bg-white rounded-2xl h-12 border-border/50 shadow-sm focus-visible:ring-primary/20 text-center font-mono tracking-widest"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                      {/* Prioridades */}
                      <div className="space-y-5 bg-accent/30 p-6 md:p-8 rounded-[2rem] border border-border/50 flex flex-col h-[380px]">
                        <div>
                          <h4 className="font-bold text-foreground text-base">Etiquetas de Prioridade</h4>
                          <p className="text-xs text-muted-foreground font-medium mt-1">Usadas para classificar a urgência da produção e pedidos.</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2.5 mb-2">
                          {prioridades.map(p => (
                            <div key={p} className="flex items-center gap-1.5 bg-white border border-border/50 px-4 py-2 rounded-xl text-sm font-bold shadow-sm group hover:border-primary/30 transition-colors">
                              <span className="text-foreground">{p}</span>
                              <button onClick={() => removePrioridade(p)} className="text-muted-foreground hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100 flex items-center justify-center outline-none"><X size={16} strokeWidth={2.5}/></button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3 mt-auto">
                          <Input 
                            placeholder="Nova prioridade..." 
                            value={newPrioridade} 
                            onChange={e => setNewPrioridade(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addPrioridade()}
                            className="bg-white rounded-2xl h-12 border-border/50 shadow-sm focus-visible:ring-primary/20"
                          />
                          <Button onClick={addPrioridade} variant="outline" className="rounded-2xl shrink-0 bg-white border-border/50 h-12 w-12 p-0 hover:bg-primary/5 hover:text-primary transition-colors hover:border-primary/30"><Plus size={20} strokeWidth={2.5} /></Button>
                        </div>
                      </div>

                      {/* Status Categoria Produção */}
                      <div className="space-y-5 bg-accent/30 p-6 md:p-8 rounded-[2rem] border border-border/50 flex flex-col h-[380px]">
                        <div>
                          <h4 className="font-bold text-foreground text-base">Fases de Produção</h4>
                          <p className="text-xs text-muted-foreground font-medium mt-1">Defina as opções de "Fase" da produção da peça.</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2.5 mb-2 overflow-y-auto pr-2 pb-2">
                          {statusProducaoList.map(s => (
                            <div key={s} className="flex items-center gap-1.5 bg-white border border-border/50 px-4 py-2 rounded-xl text-sm font-bold shadow-sm group hover:border-primary/30 transition-colors">
                              <span className="text-foreground">{s}</span>
                              <button onClick={() => removeStatusProducao(s)} className="text-muted-foreground hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100 flex items-center justify-center outline-none"><X size={16} strokeWidth={2.5}/></button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3 mt-auto">
                          <Input 
                            placeholder="Nova fase..." 
                            value={newStatusProducao} 
                            onChange={e => setNewStatusProducao(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addStatusProducao()}
                            className="bg-white rounded-2xl h-12 border-border/50 shadow-sm focus-visible:ring-primary/20"
                          />
                          <Button onClick={addStatusProducao} variant="outline" className="rounded-2xl shrink-0 bg-white border-border/50 h-12 w-12 p-0 hover:bg-primary/5 hover:text-primary transition-colors hover:border-primary/30"><Plus size={20} strokeWidth={2.5} /></Button>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="space-y-5 bg-accent/30 p-6 md:p-8 rounded-[2rem] border border-border/50 flex flex-col h-[380px]">
                        <div>
                          <h4 className="font-bold text-foreground text-base">Status de Entrega</h4>
                          <p className="text-xs text-muted-foreground font-medium mt-1">Status de recebimento fatiado do produto (Ex: Parcial).</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2.5 mb-2 overflow-y-auto pr-2 pb-2">
                          {statusList.map(s => (
                            <div key={s} className="flex items-center gap-1.5 bg-white border border-border/50 px-4 py-2 rounded-xl text-sm font-bold shadow-sm group hover:border-primary/30 transition-colors">
                              <span className="text-foreground">{s}</span>
                              <button onClick={() => removeStatus(s)} className="text-muted-foreground hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100 flex items-center justify-center outline-none"><X size={16} strokeWidth={2.5}/></button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3 mt-auto">
                          <Input 
                            placeholder="Novo status..." 
                            value={newStatus} 
                            onChange={e => setNewStatus(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addStatus()}
                            className="bg-white rounded-2xl h-12 border-border/50 shadow-sm focus-visible:ring-primary/20"
                          />
                          <Button onClick={addStatus} variant="outline" className="rounded-2xl shrink-0 bg-white border-border/50 h-12 w-12 p-0 hover:bg-primary/5 hover:text-primary transition-colors hover:border-primary/30"><Plus size={20} strokeWidth={2.5} /></Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
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
                    </div>
                  </div>
                )}
                
                {activeTab !== 'perfil' && activeTab !== 'prod_costureiras' && activeTab !== 'sistema' && (
                  <div className="py-24 text-center">
                    <p className="text-muted-foreground font-bold mb-2">Esta aba está em desenvolvimento.</p>
                    <p className="text-sm text-muted-foreground/70 font-medium">Em breve mais configurações estarão disponíveis.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
