with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

content = content.replace("</Dialog></Dialog>", "</Dialog>")

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content2 = f.read()

content2 = content2.replace("</Dialog></Dialog>", "</Dialog>")

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content2)
