import re

with open('src/views/Insumos.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className="w-[90vw] sm:max-w-none md:max-w-[70vw] lg:max-w-[50vw] rounded-[2rem] p-0 overflow-hidden border-border/50 bg-card shadow-2xl flex flex-col max-h-[90vh]"',
    'className="w-[95vw] sm:max-w-none md:max-w-[800px] lg:max-w-[900px] rounded-[2rem] p-0 overflow-hidden border-border/50 bg-card shadow-2xl flex flex-col max-h-[90vh]"'
)

with open('src/views/Insumos.tsx', 'w') as f:
    f.write(content)
print("Updated to pixel max-width")
