import re

filepath = 'src/views/Configuracoes.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add states
state_addition = """  const [bancos, setBancos] = useState<string[]>(['Nubank PJ', 'Inter PJ', 'Mercado Pago', 'Caixa', 'Dinheiro', 'Cartão', 'Outra']);
  const [categoriasFinanceiro, setCategoriasFinanceiro] = useState<string[]>(['Aluguel', 'Internet', 'Energia', 'Água', 'Funcionários', 'Pró-labore', 'Software', 'Marketing', 'Contador', 'Impostos', 'Veículo', 'Empréstimos', 'Consórcio', 'Cartão', 'Assinaturas', 'Compras de Produto', 'Insumos', 'Embalagens', 'Aviamentos', 'Tecido', 'Frete', 'Motoboy', 'Correios', 'Combustível', 'Alimentação', 'Marketplace', 'Taxas', 'Anúncios', 'Manutenção', 'Material de Escritório', 'Transporte', 'Viagem', 'Fornecedor', 'Outros']);
  const [newBanco, setNewBanco] = useState('');
  const [newCategoria, setNewCategoria] = useState('');"""
  
if "const [bancos," not in content:
    content = content.replace("const [newStatusProducao, setNewStatusProducao] = useState('');", "const [newStatusProducao, setNewStatusProducao] = useState('');\n" + state_addition)

# Add load configs
load_add = """        if (data.bancos && data.bancos.length > 0) setBancos(data.bancos);
        if (data.categoriasFinanceiro && data.categoriasFinanceiro.length > 0) setCategoriasFinanceiro(data.categoriasFinanceiro);"""
if "setBancos(data.bancos)" not in content:
    content = content.replace("if (data.statusProducao && data.statusProducao.length > 0) setStatusProducaoList(data.statusProducao);", "if (data.statusProducao && data.statusProducao.length > 0) setStatusProducaoList(data.statusProducao);\n" + load_add)

with open(filepath, 'w') as f:
    f.write(content)
print("Done")
