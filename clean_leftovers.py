import re

with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r"            <div className=\"text-\[28px\] font-bold text-\[#111827\].*?      <\/div>",
    "",
    content,
    flags=re.DOTALL
)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content_var = f.read()

content_var = re.sub(
    r"            <div className=\"text-\[28px\] font-bold text-\[#111827\].*?      <\/div>",
    "",
    content_var,
    flags=re.DOTALL
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content_var)
