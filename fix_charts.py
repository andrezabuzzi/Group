import re
import os

filepath = "src/views/Relatorios.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Bar fills in Relatorios.tsx
content = re.sub(r'fill="#EF4444"', r'fill="#9B8CFF"', content)  # Red -> Roxo Claro
content = re.sub(r'fill="#10B981"', r'fill="#6D4AFF"', content)  # Green -> Roxo
content = re.sub(r'fill="#3B82F6"', r'fill="#6D4AFF"', content)  # Blue -> Roxo
content = re.sub(r'fill="#F59E0B"', r'fill="#9B8CFF"', content)  # Yellow -> Roxo Claro

# Pie chart colors in Relatorios.tsx
content = re.sub(
    r"const productMixData = \[\n(.*?)color: '#[A-Z0-9]+'(.*?)\n(.*?)color: '#[A-Z0-9]+'(.*?)\n(.*?)color: '#[A-Z0-9]+'(.*?)\n(.*?)color: '#[A-Z0-9]+'(.*?)\n(.*?)\];",
    r"const productMixData = [\n\1color: '#6D4AFF'\2\n\3color: '#8A71FF'\4\n\5color: '#A899FF'\6\n\7color: '#C7C2FF'\8\n\9];",
    content, flags=re.DOTALL
)

content = re.sub(
    r"const defectData = \[\n(.*?)color: '#[A-Z0-9]+'(.*?)\n(.*?)color: '#[A-Z0-9]+'(.*?)\n(.*?)color: '#[A-Z0-9]+'(.*?)\n(.*?)\];",
    r"const defectData = [\n\1color: '#6D4AFF'\2\n\3color: '#9B8CFF'\4\n\5color: '#C7C2FF'\6\n\7];",
    content, flags=re.DOTALL
)

content = re.sub(
    r"const goalProgressData = \[\n(.*?)fill: '#[A-Z0-9]+'(.*?)\n(.*?)fill: '#[A-Z0-9]+'(.*?)\n(.*?)\];",
    r"const goalProgressData = [\n\1fill: '#6D4AFF'\2\n\3fill: '#E8E8F1'\4\n\5];",
    content, flags=re.DOTALL
)

# And the specific Cell array: fill={['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'][index % 5]}
content = content.replace(
    r"fill={['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'][index % 5]}",
    r"fill={['#6D4AFF', '#8A71FF', '#9B8CFF', '#B3A8FF', '#C7C2FF'][index % 5]}"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Charts in Relatorios.tsx updated.")

