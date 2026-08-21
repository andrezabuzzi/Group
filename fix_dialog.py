with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""          </form>
        </DialogContent>
      
      {/* Pin Modal */}""",
"""          </form>
        </DialogContent>
      </Dialog>
      
      {/* Pin Modal */}"""
)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)
