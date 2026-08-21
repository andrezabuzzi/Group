with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""        </DialogContent>
      
      {/* Pin Modal */}""",
"""        </DialogContent>
      </Dialog>
      
      {/* Pin Modal */}"""
)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)
