with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

content = content.replace('  return (\n    <>\n    <div className="space-y-8', '  return (\n    <div className="space-y-8')
content = content.replace('      </Dialog>\n    </div>\n    </>\n  );\n}', '      </Dialog>\n    </div>\n  );\n}')

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
