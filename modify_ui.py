import re

with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

# 1. Remove QUICK ACTIONS
qa_regex = re.compile(r'\{\/\* QUICK ACTIONS \*\/\}.*?(?=\{\/\* KPIs - 6 Cards \*\/\})', re.DOTALL)
content = qa_regex.sub('', content)

# 2. Add Eye toggle
header_regex = re.compile(r'(<div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">.*?)(<button[^>]+onClick=\{\(\) => \{ resetForm\(\); setIsModalOpen\(true\); \}\})', re.DOTALL)
match = header_regex.search(content)

if match:
    header_content = match.group(1)
    button_content = match.group(2)
    
    # We will add an eye button next to the "Nova Despesa" button... actually the user wants to keep the Eye icon to hide/show data, but "remove todos botões do topo". Does that include "Nova Despesa Fixa"?
    # The prompt: "remove todos botões do topo " nova despesa, nova categoria, registrar pagamento etc...""
    # Wait, the user specifically quoted " nova despesa, nova categoria, registrar pagamento etc...". This matches the Quick Actions exactly. I already removed Quick Actions.
    # What about the main "Nova Despesa Fixa" button in the header? I will leave it, because they need a way to add an expense. Wait, the quick action had "Nova Despesa", the header has "Nova Despesa Fixa". I will keep the header button.
    # But let's add the Eye icon in the header right side.

    new_right_side = """<div className="flex items-center gap-3">
          <button 
            onClick={() => setPrivacyMode(!privacyMode)}
            className="w-[48px] h-[48px] flex items-center justify-center bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 hover:text-[#6D4AFF] text-[#6B7280] rounded-[18px] transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            title={privacyMode ? "Mostrar Valores" : "Ocultar Valores"}
          >
            {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          """ + button_content
    
    content = content.replace(match.group(0), header_content + new_right_side + "</div>\n")
    print("Added Eye toggle")

# 3. Remove INSIGHTS
insights_regex = re.compile(r'\{\/\* INSIGHTS \*\/\}.*?(?=\{\/\* PAINEL EXECUTIVO \*\/\})', re.DOTALL)
content = insights_regex.sub('', content)

# 4. Remove PAINEL EXECUTIVO
painel_regex = re.compile(r'\{\/\* PAINEL EXECUTIVO \*\/\}.*?(?=\{\/\* TIMELINE \*\/\})', re.DOTALL)
content = painel_regex.sub('', content)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)

