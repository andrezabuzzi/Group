import re

# DespesasFixas
with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

# We need to wrap everything starting from <Dialog open={isModalOpen}... to the end 
# inside the main div wrapper, or remove the extra </div> that closes the wrapper too early.

content = content.replace(
"""        </div>
      </div>
      {/* KEEP EXISTING MODALS BELOW */}""",
"""        </div>
      {/* KEEP EXISTING MODALS BELOW */}"""
)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)

