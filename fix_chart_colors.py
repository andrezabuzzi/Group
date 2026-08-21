import os
import re

directory = 'src/views'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            # Overwrite COLORS arrays to use purple/gray gradient
            content = re.sub(r'const COLORS = \[.*?\];', "const COLORS = ['#6D4AFF', '#9B8CFF', '#D8B4E2', '#A5ADBD', '#6B7280'];", content)
            
            # Direct replacements
            content = content.replace('#14b8a6', '#9B8CFF')
            content = content.replace('#f97316', '#A5ADBD')
            content = content.replace('#6366f1', '#6D4AFF')
            content = content.replace('#10b981', '#6D4AFF')
            content = content.replace('#ef4444', '#A5ADBD')
            
            with open(filepath, 'w') as f:
                f.write(content)

print("Done")
