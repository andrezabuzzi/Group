import re

with open('src/views/Produtos.tsx', 'r') as f:
    content = f.read()

# 1. Remove the filters (Selects for Categoria, Tecido, Status, Sort and the Limpar Filtros button)
# We can search for <Select value={filterCategoria} to Limpar filtros button
pattern_filters = r'<Select value=\{filterCategoria\}.*?</Button>'
content = re.sub(pattern_filters, '', content, flags=re.DOTALL)

# 2. Remove specific ExecCards
content = re.sub(r'<ExecCard title="Peças Produzidas".*?/>', '', content)
content = re.sub(r'<ExecCard title="Estoque Total".*?/>', '', content)
content = re.sub(r'<ExecCard title="Custo Médio".*?/>', '', content)

# 3. Remove Insights, Por Categoria, Ações Rápidas (the whole sidebar)
pattern_sidebar = r'\{/\* INSIGHTS & QUICK ACTIONS \(SIDEBAR\) \*/\}.*?(?=\{/\* DETALHES DRAWER \(Mock\) \*/\})'
content = re.sub(pattern_sidebar, '</div>\n\n      ', content, flags=re.DOTALL)

# Adjust the MAIN CONTENT layout wrapper
# Change <div className="flex flex-col xl:flex-row gap-6 mt-2">
# to <div className="flex flex-col gap-6 mt-2">
content = content.replace('<div className="flex flex-col xl:flex-row gap-6 mt-2">', '<div className="flex flex-col gap-6 mt-2">')
# Adjust grid columns for ProductCard grid
content = content.replace('grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5')

# 4. Remove Estoque from ProductCard
# Find:
#               <div className="bg-secondary/40 rounded-xl p-2.5">
#                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Estoque</p>
#                  <p className="font-bold text-sm">45 un</p>
#               </div>
pattern_estoque_card = r'<div className="bg-secondary/40 rounded-xl p-2\.5">\s*<p className="text-\[9px\] font-bold text-muted-foreground uppercase tracking-widest mb-0\.5">Estoque</p>\s*<p className="font-bold text-sm">.*?un</p>\s*</div>'
content = re.sub(pattern_estoque_card, '', content)

# To balance the grid in ProductCard since it has 2 columns: grid-cols-2, removing one makes it 3 items. Let's make it 3 columns:
content = content.replace('<div className="grid grid-cols-2 gap-3 mb-6 flex-1">', '<div className="grid grid-cols-3 gap-3 mb-6 flex-1">')

with open('src/views/Produtos.tsx', 'w') as f:
    f.write(content)
