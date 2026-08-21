import re

filepath = 'src/views/Configuracoes.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Update saveCustomConfig signature and body
old_save = """  const saveCustomConfig = async (newPrioridades: string[], newStatusList: string[], newStatusProducaoList: string[]) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'configuracoes', user.uid);
      await setDoc(docRef, {
        prioridades: newPrioridades,
        status: newStatusList,
        statusProducao: newStatusProducaoList,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {"""

new_save = """  const saveCustomConfig = async (newPrioridades: string[], newStatusList: string[], newStatusProducaoList: string[], newBancos?: string[], newCategorias?: string[]) => {
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
    } catch (error) {"""

content = content.replace(old_save, new_save)

# Update references to saveCustomConfig in addPrioridade, etc.
content = content.replace('saveCustomConfig(updated, statusList, statusProducaoList)', 'saveCustomConfig(updated, statusList, statusProducaoList, bancos, categoriasFinanceiro)')
content = content.replace('saveCustomConfig(prioridades, updated, statusProducaoList)', 'saveCustomConfig(prioridades, updated, statusProducaoList, bancos, categoriasFinanceiro)')
content = content.replace('saveCustomConfig(prioridades, statusList, updated)', 'saveCustomConfig(prioridades, statusList, updated, bancos, categoriasFinanceiro)')

with open(filepath, 'w') as f:
    f.write(content)

print("Done")
