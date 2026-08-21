with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

import re
match = re.search(r'const stats = useMemo\(\(\) => \{.*?\}, \[expenses, currentMonthDate\]\);', content, re.DOTALL)
if match:
    print(match.group(0))
else:
    match2 = re.search(r'const stats = useMemo\(\(\) => \{.*?\}, \[expenses\]\);', content, re.DOTALL)
    if match2:
        print("Stats only depends on expenses!")
