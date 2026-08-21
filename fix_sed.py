import re
with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

fixed = re.sub(
    r'\{kpi\.subValue !== undefined \{!kpi\.isNum && kpi\.subValue && \(\{!kpi\.isNum && kpi\.subValue && \( \(',
    r'{kpi.subValue !== undefined && (',
    content
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(fixed)
