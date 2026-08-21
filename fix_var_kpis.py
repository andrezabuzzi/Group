import re

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

# The user wants "melhore os cards do topo para ficar mais organizado seguindo a identidade da marca sempre roxo"
# So I should remove the old KPI block and we already added our new KPI block at the top.
# Let's remove the second set of KPIs inside the tab list.

content = re.sub(
    r"            \{\/\* KPIs - 6 Cards \*\/\}[\s\S]*?            <\/div>",
    "",
    content
)

# And remove any left over motion.div tags if they were missed.
content = re.sub(
    r"                <motion\.div[\s\S]*?                  key=\{i\}[\s\S]*?                >[\s\S]*?                <\/motion\.div>\n              \)\)}\n            <\/div>",
    "",
    content
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)

