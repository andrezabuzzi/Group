import re

with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'\{\/\*\s*CHARTS\s*\*\/\}.*?(?=\{\/\*\s*MODAL:\s*NOVA DESPESA FIXA\s*\*\/|\{\/\*\s*Pin Modal\s*\*\/|<\/div>\s*<\/div>\s*\{\/\*)',
    '',
    content,
    flags=re.DOTALL
)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)
