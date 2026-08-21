import os
import re

directory = 'src/views'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            # Fix padding on main wrapper
            content = re.sub(r'px-4 md:px-8', 'px-6 lg:px-10', content)
            
            # Make sure h1 is 4xl font-bold tracking-tight text-foreground
            content = re.sub(r'text-2xl font-bold', 'text-4xl font-bold tracking-tight text-foreground', content)
            content = re.sub(r'text-3xl font-bold', 'text-4xl font-bold tracking-tight text-foreground', content)

            # Make buttons premium
            content = re.sub(r'className="bg-primary hover:bg-primary/90 text-primary-foreground.*?px-6 h-12.*?"', 'className="premium-btn-primary"', content)
            
            with open(filepath, 'w') as f:
                f.write(content)

print("Done")
