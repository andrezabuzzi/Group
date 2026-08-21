import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

content = content.replace("{ name: 'Produção', href: '/producao' },", "{ name: 'Produção', href: '/producao' },\n        { name: 'Costureiras', href: '/costureiras' },")

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
