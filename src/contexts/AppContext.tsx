import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AppContextType {
  isPessoal: boolean;
  setIsPessoal: (val: boolean) => void;
  privacyMode: boolean;
  setPrivacyMode: (val: boolean) => void;
  togglePrivacy: () => void;
  config: {
    bancos: string[];
    categoriasFinanceiro: string[];
    prioridades: string[];
    status: string[];
    statusProducao: string[];
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isPessoal, setIsPessoal] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(true);

  const [config, setConfig] = useState({
    bancos: ['Nubank PJ', 'Inter PJ', 'Mercado Pago', 'Caixa', 'Dinheiro', 'Cartão', 'Outra'],
    categoriasFinanceiro: ['Aluguel', 'Internet', 'Energia', 'Água', 'Funcionários', 'Pró-labore', 'Software', 'Marketing', 'Contador', 'Impostos', 'Veículo', 'Empréstimos', 'Consórcio', 'Cartão', 'Assinaturas', 'Compras de Produto', 'Insumos', 'Embalagens', 'Aviamentos', 'Tecido', 'Frete', 'Motoboy', 'Correios', 'Combustível', 'Alimentação', 'Marketplace', 'Taxas', 'Anúncios', 'Manutenção', 'Material de Escritório', 'Transporte', 'Viagem', 'Fornecedor', 'Outros'],
    prioridades: ['Normal', 'Urgente', 'Reposição'],
    status: ['Pendente', 'Parcial', 'Completo'],
    statusProducao: ['Pré-produção', 'Modelagem', 'Risco', 'Corte', 'Costura', 'Finalizado']
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'configuracoes', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig(prev => ({
          bancos: data.bancos && data.bancos.length > 0 ? data.bancos : prev.bancos,
          categoriasFinanceiro: data.categoriasFinanceiro && data.categoriasFinanceiro.length > 0 ? data.categoriasFinanceiro : prev.categoriasFinanceiro,
          prioridades: data.prioridades && data.prioridades.length > 0 ? data.prioridades : prev.prioridades,
          status: data.status && data.status.length > 0 ? data.status : prev.status,
          statusProducao: data.statusProducao && data.statusProducao.length > 0 ? data.statusProducao : prev.statusProducao
        }));
      }
    });
    return () => unsub();
  }, [user]);
  const togglePrivacy = () => {
    if (privacyMode) {
      window.dispatchEvent(new Event('open-pin-dialog'));
    } else {
      setPrivacyMode(true);
    }
  };

  return (
    <AppContext.Provider value={{ isPessoal, setIsPessoal, privacyMode, setPrivacyMode, togglePrivacy, config }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
