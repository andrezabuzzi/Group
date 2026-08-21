import re

# For DespesasFixas
with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

# Replace the leftover old KPI card parts
# The leftovers are exactly:
#               <h3 className="text-[13px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider">{kpi.title}</h3>
# ...
#       </div>

content = re.sub(
    r"              <h3 className=\"text-\[13px\] font-bold text-\[#6B7280\].*?      <\/div>",
    "",
    content,
    flags=re.DOTALL
)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)

# For DespesasVariaveis
with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content_var = f.read()

content_var = re.sub(
    r"              <h3 className=\"text-\[13px\] font-bold text-\[#6B7280\].*?      <\/div>",
    "",
    content_var,
    flags=re.DOTALL
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content_var)
