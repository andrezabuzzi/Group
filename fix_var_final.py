import re

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

# Instead of regex, I will just write a simpler regex.
# Let's remove the "Ações Rápidas" block directly:
#                 {/* QUICK ACTIONS */}
# ...
#                 {/* INSIGHTS */}
#
content = re.sub(
    r"                \{\/\* QUICK ACTIONS \*\/\}[\s\S]*?\{\/\* INSIGHTS \*\/\}",
    "{/* INSIGHTS */}",
    content
)

# Also need to remove the first KPI cards inside the tabs (and its AnimatePresence etc).
# Wait, let's see how the tabs and KPI are laid out:
#       <AnimatePresence mode="wait">
#        {activeTab === 'lista' && (
#          <motion.div ...>
#            {/* KPIs - 6 Cards */}

content = re.sub(
    r"            \{\/\* KPIs - 6 Cards \*\/\}[\s\S]*?            <\/div>",
    "",
    content
)
content = re.sub(
    r"                <motion\.div[\s\S]*?key=\{i\}[\s\S]*?<\/motion\.div>\n              \)\)}\n            <\/div>",
    "",
    content
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
