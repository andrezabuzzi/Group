import re

with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

# I will find `        </div>\n      {/* KEEP EXISTING MODALS BELOW */}` and replace with `{/* KEEP EXISTING MODALS BELOW */}`
content = content.replace(
"""        </div>
      {/* KEEP EXISTING MODALS BELOW */}""", 
"""      {/* KEEP EXISTING MODALS BELOW */}"""
)

# And remove the <> and </> I added
content = content.replace('  return (\n    <>\n    <div className="min-h-screen', '  return (\n    <div className="min-h-screen')
content = content.replace('      </Dialog>\n    </div>\n    </>\n  );\n}', '      </Dialog>\n    </div>\n  );\n}')

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)
