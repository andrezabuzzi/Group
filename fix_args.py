import re

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

content = content.replace("const handleDelete = async (ev: any) => {", "const handleDelete = async (id: string, description?: string) => {")
content = content.replace("await deleteDoc(doc(db, 'variable_expenses', ev.id));", "await deleteDoc(doc(db, 'variable_expenses', id));")

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
