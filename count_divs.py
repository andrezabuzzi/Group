with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()
lines = content.split('\n')
stack = []
for i, line in enumerate(lines):
    for j in range(len(line)):
        if line[j:j+4] == '<div' and line[j:j+5] != '</div>':
            stack.append(('div', i+1))
        elif line[j:j+6] == '</div>':
            if len(stack) > 0:
                stack.pop()
            else:
                print(f"Extra </div> at line {i+1}")
if len(stack) > 0:
    print(f"Unclosed divs: {stack}")
