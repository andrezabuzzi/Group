import os
import re

directory = 'src/views'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            # Replace arbitrary max-w-[...] with w-full for full-width responsive layout
            content = re.sub(r'max-w-\[1[0-9]{3}px\]', 'max-w-none', content)
            content = re.sub(r'lg:max-w-7xl', 'max-w-none', content)
            
            with open(filepath, 'w') as f:
                f.write(content)

print("Done")
