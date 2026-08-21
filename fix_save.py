import re

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

content = content.replace("const handleSaveExpense = async (e: any) => {", "const handleSaveExpense = async (e: any, isDraft = false) => {")
content = content.replace("BarChartIcon", "BarChart2")

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
