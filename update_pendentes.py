import re

with open('src/views/Insumos.tsx', 'r') as f:
    content = f.read()

# 1. Update pendentesVal calculation
old_pendentes = r"const pendentesVal = compras\.filter\(c => c\.statusPagamento === 'pendente'\)\.reduce\(\(sum, c\) => sum \+ \(c\.valorTotal \|\| 0\), 0\);"
new_pendentes = """const pendentesVal = compras.reduce((sum, c) => {
    if (c.tipoPagamento === 'a_prazo' && c.parcelas && c.parcelas.length > 0) {
      return sum + c.parcelas.filter((p: any) => p.status !== 'pago').reduce((pSum: number, p: any) => pSum + (parseFloat(p.valor) || 0), 0);
    } else {
      return sum + (c.statusPagamento === 'pendente' ? (c.valorTotal || 0) : 0);
    }
  }, 0);"""
content = re.sub(old_pendentes, new_pendentes, content)

# 2. Update parcelas rendering styling
old_row = r'className="flex justify-between items-center p-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"'
new_row = r'className={`flex justify-between items-center p-4 border-b border-border/50 last:border-0 transition-colors ${p.status === \'pago\' ? \'bg-success/5 hover:bg-success/10\' : \'hover:bg-secondary/30\'}`}'
content = content.replace(old_row, new_row)

# 3. Rename 'Pagar' to 'Pagar Total' on card button
old_btn = r'>Pagar</Button>'
new_btn = r'>Pagar Total</Button>'
content = content.replace(old_btn, new_btn)

with open('src/views/Insumos.tsx', 'w') as f:
    f.write(content)
print("Updates applied")
