import re

with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

content = content.replace('  return (\n    <div className="min-h-screen', '  return (\n    <>\n    <div className="min-h-screen')
content = content.replace('      </Dialog>\n    </div>\n  );\n}', '      </Dialog>\n    </div>\n    </>\n  );\n}')

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)


with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content_var = f.read()

content_var = content_var.replace('  return (\n    <div className="space-y-8', '  return (\n    <>\n    <div className="space-y-8')
content_var = content_var.replace('      </Dialog>\n    </div>\n  );\n}', '      </Dialog>\n    </div>\n    </>\n  );\n}')

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content_var)
