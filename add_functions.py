import re

filepath = 'src/views/Configuracoes.tsx'
with open(filepath, 'r') as f:
    content = f.read()

funcs = """  const addBanco = () => {
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
"""

content = content.replace("const addPrioridade = () => {", funcs + "\n  const addPrioridade = () => {")

with open(filepath, 'w') as f:
    f.write(content)

print("Done")
