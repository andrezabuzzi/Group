import re
with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

# Just find the LAST `        </DialogContent>` and strip everything after it, then append the correct ending!
idx = content.rfind('        </DialogContent>')
if idx != -1:
    content = content[:idx] + """        </DialogContent>
      </Dialog>
    </>
  );
}
"""
    with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
        f.write(content)
