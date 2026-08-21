import os

files_to_fix = [
    'src/views/Performance/Tarefas.tsx',
    'src/views/Financeiro/DespesasVariaveis.tsx',
    'src/views/Financeiro/ContasAPagar.tsx',
    'src/views/Financeiro/RelatoriosFinanceiros.tsx',
    'src/views/Devolucoes/ControleDevolucoes.tsx'
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r') as f:
        content = f.read()
    
    # We want to replace 'mx-auto pb-10"' or similar with 'mx-auto p-4 md:p-8 pb-10"' if it's the main container.
    # Let's just do a string replacement for the likely matches.
    content = content.replace('mx-auto pb-10"', 'mx-auto p-4 md:p-8 pb-10"')
    
    with open(file_path, 'w') as f:
        f.write(content)

