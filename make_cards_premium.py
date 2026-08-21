import os
import re

directory = 'src/views'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            # Find all classNames that have bg-card and rounded- something and border
            # We can just replace 'bg-card border border-border' or similar with 'premium-card'
            content = re.sub(r'bg-card border border-border rounded-\[[^\]]+\]', 'premium-card', content)
            content = re.sub(r'bg-card rounded-\[[^\]]+\] border border-border', 'premium-card', content)
            content = re.sub(r'bg-card border rounded-\[[^\]]+\]', 'premium-card', content)
            content = re.sub(r'rounded-\[[^\]]+\] p-[0-9]+ border flex flex-col', 'premium-card flex flex-col', content)
            
            with open(filepath, 'w') as f:
                f.write(content)

print("Done")
