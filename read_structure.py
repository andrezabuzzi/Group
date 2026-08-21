import re

with open('src/views/Insumos.tsx', 'r') as f:
    content = f.read()

# Just extract the imports and state definition to understand the structure
lines = content.split('\n')
for i, line in enumerate(lines[:50]):
    print(line)

print("...")
for i, line in enumerate(lines):
    if 'export default function Insumos' in line:
        for j in range(i, min(i+100, len(lines))):
            print(lines[j])
        break
