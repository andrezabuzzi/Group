import re

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

# We need to remove the `{[ ... ].map((kpi, i) => (` block completely since we deleted the closing.
# Let's just find `            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">`
# and remove everything up to `            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">`

content = re.sub(
    r"            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4\">\n              \{\[[\s\S]*?            <div className=\"grid grid-cols-1 xl:grid-cols-4 gap-8\">",
    """            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">""",
    content
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
