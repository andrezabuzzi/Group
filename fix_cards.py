import re

with open('src/views/Produtos.tsx', 'r') as f:
    content = f.read()

# Replace that broken ExecCard block
bad_block = """           <ExecCard title="Em Produção" value={produtosProducao} icon={<Factory/>} trend={<MiniSparkline color="var(--primary)"/>} />           } trend={<MiniSparkline color="var(--primary)"/>} />           } trend={<MiniSparkline color="var(--primary)"/>} />           } trend={<MiniSparkline color="var(--destructive)"/>} />        </div>"""
good_block = """           <ExecCard title="Em Produção" value={produtosProducao} icon={<Factory/>} trend={<MiniSparkline color="var(--primary)"/>} />
        </div>"""
content = content.replace(bad_block, good_block)

# Also fix the grid-cols for ExecCards to be 4 columns
content = content.replace('grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4', 'grid-cols-2 md:grid-cols-4 gap-4')

with open('src/views/Produtos.tsx', 'w') as f:
    f.write(content)
