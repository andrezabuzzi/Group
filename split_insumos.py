import re

with open('src/views/Insumos.tsx', 'r') as f:
    content = f.read()

# Find the start of the return statement for the component
return_match = re.search(r'^\s*return \(\s*<div', content, re.MULTILINE)

if return_match:
    idx = return_match.start()
    logic = content[:idx]
    jsx = content[idx:]
    with open('/tmp/insumos_logic.txt', 'w') as f:
        f.write(logic)
    with open('/tmp/insumos_jsx.txt', 'w') as f:
        f.write(jsx)
    print(f"Split successful. Logic: {len(logic)} chars, JSX: {len(jsx)} chars")
else:
    print("Could not find return statement")

