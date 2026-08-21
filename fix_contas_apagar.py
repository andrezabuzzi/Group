import re

filepath = 'src/views/Financeiro/ContasAPagar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Get config
if "const { isPessoal, privacyMode, togglePrivacy } = useAppContext();" in content:
    content = content.replace("const { isPessoal, privacyMode, togglePrivacy } = useAppContext();", "const { isPessoal, privacyMode, togglePrivacy, config } = useAppContext();")

# Replace first Category filter
old_filter = """<SelectContent className="rounded-[18px]"><SelectItem value="all">Todas</SelectItem><SelectItem value="Tecido">Tecido</SelectItem><SelectItem value="Fornecedor">Fornecedor</SelectItem></SelectContent>"""
new_filter = """<SelectContent className="rounded-[18px]">
                    <SelectItem value="all">Todas</SelectItem>
                    {config?.categoriasFinanceiro?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                 </SelectContent>"""
content = content.replace(old_filter, new_filter)

# Replace Category form select
old_form = """<SelectContent className="rounded-[18px]">
                      <SelectItem value="Tecido">Tecido</SelectItem>
                      <SelectItem value="Insumos">Insumos</SelectItem>
                      <SelectItem value="Impostos">Impostos</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>"""
new_form = """<SelectContent className="rounded-[18px]">
                      {config?.categoriasFinanceiro?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>"""
content = content.replace(old_form, new_form)

with open(filepath, 'w') as f:
    f.write(content)

print("Done")
