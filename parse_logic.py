import re

with open('src/views/Insumos.tsx', 'r') as f:
    content = f.read()

return_match = re.search(r'^\s*return \(\s*<div', content, re.MULTILINE)
if return_match:
    idx = return_match.start()
    with open('/tmp/insumos_logic.txt', 'w') as f:
        f.write(content[:idx])
