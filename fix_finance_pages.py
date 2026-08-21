import re

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Get config from useAppContext
    if "const { isPessoal, privacyMode, togglePrivacy } = useAppContext();" in content:
        content = content.replace("const { isPessoal, privacyMode, togglePrivacy } = useAppContext();", "const { isPessoal, privacyMode, togglePrivacy, config } = useAppContext();")

    # For DespesasFixas and DespesasVariaveis
    content = re.sub(r"const categories = \['[^\]]*'\];", "const categories = config.categoriasFinanceiro;", content)
    content = re.sub(r"const accounts = \['[^\]]*'\];", "const accounts = config.bancos;", content)
    
    with open(filepath, 'w') as f:
        f.write(content)

update_file('src/views/Financeiro/DespesasFixas.tsx')
update_file('src/views/Financeiro/DespesasVariaveis.tsx')

print("Done")
