import re

with open('src/views/Produtos.tsx', 'r') as f:
    content = f.read()

pattern = r'<ExecCard title="Total Produtos".*?</div>'
good_block = """<ExecCard title="Total Produtos" value={totalProdutos} icon={<Package/>} trend={<MiniSparkline color="var(--primary)"/>} />
           <ExecCard title="Ativos" value={produtosAtivos} icon={<CheckCircle2/>} trend={<MiniSparkline color="var(--success)"/>} />
           <ExecCard title="Inativos" value={produtosInativos} icon={<Archive/>} trend={<MiniSparkline color="var(--muted-foreground)"/>} />
           <ExecCard title="Em Produção" value={produtosProducao} icon={<Factory/>} trend={<MiniSparkline color="var(--primary)"/>} />
        </div>"""
content = re.sub(pattern, good_block, content, flags=re.DOTALL)

with open('src/views/Produtos.tsx', 'w') as f:
    f.write(content)
