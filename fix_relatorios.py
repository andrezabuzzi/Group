import re

with open('src/views/Financeiro/RelatoriosFinanceiros.tsx', 'r') as f:
    content = f.read()

replacement = """        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Relatórios Financeiros</h1>
          <Button variant="ghost" size="icon" onClick={togglePrivacy} className="rounded-full text-muted-foreground hover:bg-[#6D4AFF]/10 hover:text-[#6D4AFF]">
             {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </Button>
        </div>"""

content = content.replace(
    '        <div>\n          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Relatórios Financeiros</h1>',
    '        <div>\n' + replacement
)

with open('src/views/Financeiro/RelatoriosFinanceiros.tsx', 'w') as f:
    f.write(content)
