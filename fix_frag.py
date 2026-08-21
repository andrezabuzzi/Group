with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

content = content.replace('  return (\n    <div className="min-h-screen', '  return (\n    <>\n    <div className="min-h-screen')

# And add </> at the end
content = content.replace('      </Dialog>\n    </div>\n  );\n}', '      </Dialog>\n    </>\n  );\n}')

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)
