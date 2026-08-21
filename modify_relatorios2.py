import re

with open('src/views/Financeiro/RelatoriosFinanceiros.tsx', 'r') as f:
    content = f.read()

header_replacement = """      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Relatórios Financeiros</h1>
             <Button variant="ghost" size="icon" onClick={togglePrivacy} className="rounded-full text-muted-foreground hover:bg-[#6D4AFF]/10 hover:text-[#6D4AFF]">
                {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
             </Button>
          </div>
          <p className="text-muted-foreground mt-1">Análises detalhadas do seu negócio.</p>
        </div>"""

content = re.sub(
    r"      <div className=\"flex flex-col md:flex-row justify-between items-start md:items-center gap-4\">[\s\n]*<div>[\s\n]*<h1 className=\"text-2xl md:text-3xl font-black text-foreground tracking-tight\">Relatórios Financeiros<\/h1>[\s\n]*<p className=\"text-muted-foreground mt-1\">Análises detalhadas do seu negócio\.<\/p>[\s\n]*<\/div>",
    header_replacement,
    content
)

with open('src/views/Financeiro/RelatoriosFinanceiros.tsx', 'w') as f:
    f.write(content)
