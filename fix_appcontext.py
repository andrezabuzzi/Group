import re

filepath = 'src/contexts/AppContext.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add imports
content = content.replace("import { useAuth } from './AuthContext';", "import { useAuth } from './AuthContext';\nimport { doc, onSnapshot } from 'firebase/firestore';\nimport { db } from '../lib/firebase';")

# Add types
type_add = """  togglePrivacy: () => void;
  config: {
    bancos: string[];
    categoriasFinanceiro: string[];
    prioridades: string[];
    status: string[];
    statusProducao: string[];
  };"""
content = content.replace("  togglePrivacy: () => void;", type_add)

# Add state and effect
state_add = """  const [config, setConfig] = useState({
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
  }, [user]);"""

content = content.replace("  const togglePrivacy = () => {", state_add + "\n  const togglePrivacy = () => {")

# Update provider
content = content.replace("value={{ isPessoal, setIsPessoal, privacyMode, setPrivacyMode, togglePrivacy }}>", "value={{ isPessoal, setIsPessoal, privacyMode, setPrivacyMode, togglePrivacy, config }}>")

with open(filepath, 'w') as f:
    f.write(content)

print("Done")
