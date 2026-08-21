import re

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

content = content.replace("const { isPessoal, privacyMode } = useAppContext();", "const { isPessoal, privacyMode, togglePrivacy } = useAppContext();")

# We need to add the eye button to the header
header_replacement = """      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-[34px] font-[800] text-[#111827] dark:text-white tracking-tight">Despesas Variáveis</h1>
             <Button variant="ghost" size="icon" onClick={togglePrivacy} className="rounded-full text-muted-foreground hover:bg-[#6D4AFF]/10 hover:text-[#6D4AFF]">
                {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
             </Button>
          </div>
          <p className="text-[15px] font-[500] text-[#6B7280] dark:text-[#A8B0C0] mt-1">
            Registro de custos não recorrentes e compras pontuais.
          </p>
        </div>"""

content = re.sub(
    r"      <div className=\"flex flex-col md:flex-row justify-between items-start md:items-center gap-4\">[\s\n]*<div>[\s\n]*<h1 className=\"text-\[34px\] font-\[800\] text-\[#111827\] dark:text-white tracking-tight\">Despesas Variáveis<\/h1>[\s\n]*<p className=\"text-\[15px\] font-\[500\] text-\[#6B7280\] dark:text-\[#A8B0C0\] mt-1\">[\s\n]*Registro de custos não recorrentes e compras pontuais.[\s\n]*<\/p>[\s\n]*<\/div>",
    header_replacement,
    content
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
