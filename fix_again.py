with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

# I will fix the Dialog: replace `        </DialogContent>\n      </Dialog>\n      \n      {/* Pin Modal */}` with `        </DialogContent>\n      \n      {/* Pin Modal */}`
content = content.replace(
"""        </DialogContent>
      </Dialog>
      
      {/* Pin Modal */}""",
"""        </DialogContent>
      
      {/* Pin Modal */}"""
)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)
