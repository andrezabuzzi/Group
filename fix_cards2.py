import re

with open('src/views/Produtos.tsx', 'r') as f:
    content = f.read()

# Fix the broken tags
pattern = r'\} trend=\{<MiniSparkline color="var\(--.*?\)"/>\} />'
content = re.sub(pattern, '', content)

# Remove any empty lines left over
content = re.sub(r'\n\s*\n', '\n\n', content)

with open('src/views/Produtos.tsx', 'w') as f:
    f.write(content)
