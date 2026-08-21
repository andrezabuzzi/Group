import re
with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    c = f.read()
# Replace <RechartsTooltip ...> in pie chart to add item name/value logic if needed
# Actually, wait, recharts tooltip handles it automatically.
