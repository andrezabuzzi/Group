import re

with open('src/views/Insumos.tsx', 'r') as f:
    content = f.read()

# Find the start of the Dialog for Nova Compra
start_marker = "{/* NOVA COMPRA MODAL"
end_marker = "{/* DETALHES MODAL"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    with open('/tmp/nova_compra.txt', 'w') as f:
        f.write(content[start_idx:end_idx])
    print("Extracted Nova Compra modal")
else:
    print("Could not find markers")
