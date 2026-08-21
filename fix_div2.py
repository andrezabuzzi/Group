with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

lines = content.split('\n')
div_count = 0
for i, line in enumerate(lines):
    div_count += line.count('<div') - line.count('</div')
    if div_count == 0 and i > 400:
        print(f"Reached 0 at line {i+1}: {line}")
