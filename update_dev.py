import re

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "r") as f:
    text = f.read()

# 1. Add 'Produto errado' to productStatus
text = text.replace("['Defeito', 'Retorno estoque', 'Reparo']", "['Defeito', 'Retorno estoque', 'Reparo', 'Produto errado']")

# 2. Remove Status Geral / Conferência field from step 3
status_geral_regex = r'<div className="space-y-3">\s*<label className="text-\[13px\] font-bold text-foreground ml-1">Status Geral / Conferência \*</label>.*?<div className="pt-2">'
text = re.sub(status_geral_regex, '<div className="pt-2">', text, flags=re.DOTALL)

# 3. Change "Valor Recuperado" to "Total Devolvido" (Total sum of all returns)
# Old: const recoveredValue = returns.filter(r => r.productStatus === 'Retorno estoque').reduce((acc, v) => acc + (v.orderValue || 0), 0);
# New: const totalDevolvido = returns.reduce((acc, v) => acc + (v.orderValue || 0), 0);

text = re.sub(
    r"const recoveredValue = returns.filter\(r => r.productStatus === 'Retorno estoque'\).reduce\(\(acc, v\) => acc \+ \(v.orderValue \|\| 0\), 0\);",
    r"const totalDevolvido = returns.reduce((acc, v) => acc + (v.orderValue || 0), 0);",
    text
)

text = text.replace("{ title: 'Valor Recuperado', value: formatCurrency(recoveredValue, false), icon: RefreshCw, trend: '+5%', trendUp: true }", "{ title: 'Total Devolvido', value: formatCurrency(totalDevolvido, false), icon: RefreshCw, trend: '', trendUp: false }")

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "w") as f:
    f.write(text)
