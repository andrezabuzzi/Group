import re

with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()
    
# Remove `</motion.div>\n        ))}` that shouldn't be there
content = re.sub(
    r"          </motion\.div>\n        \)\)}\n      </div>",
    "",
    content
)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)
