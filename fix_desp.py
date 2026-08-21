import re

with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""      </div>
                {/* MAIN COLUMN */}\n        <div className="xl:col-span-3 space-y-8">""",
"""      </div>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* MAIN COLUMN */}
        <div className="xl:col-span-3 space-y-8">"""
)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)
