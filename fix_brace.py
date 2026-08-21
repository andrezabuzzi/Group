with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

lines = content.split('\n')
brace_count = 0
for i, line in enumerate(lines):
    brace_count += line.count('{') - line.count('}')
    # ignore string braces if possible, but let's just see where it ends
print(f"Final brace count: {brace_count}")
