import os
import re

VIEWS_DIR = "src/views"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Fix broken shadow
    content = content.replace(' -sm ', ' shadow-sm ')
    content = content.replace(' -md ', ' shadow-md ')
    content = content.replace(' -lg ', ' shadow-lg ')
    content = content.replace(' -xl ', ' shadow-xl ')
    content = content.replace('"-sm', '"shadow-sm')
    content = content.replace('"-md', '"shadow-md')
    content = content.replace('"-lg', '"shadow-lg')
    content = content.replace('"-xl', '"shadow-xl')
    content = content.replace(' -sm"', ' shadow-sm"')
    content = content.replace(' -md"', ' shadow-md"')
    content = content.replace(' -lg"', ' shadow-lg"')
    content = content.replace(' -xl"', ' shadow-xl"')
    
    # Fix broken border
    content = re.sub(r'(?<=\s|\"|\')-([a-zA-Z0-9]+-[a-zA-Z0-9]+)', lambda m: 'border-' + m.group(1) if m.group(1).startswith('gray') or m.group(1).startswith('border') or m.group(1).startswith('white') or m.group(1).startswith('black') or m.group(1).startswith('primary') or m.group(1).startswith('red') or m.group(1).startswith('green') or m.group(1).startswith('blue') or m.group(1).startswith('transparent') else m.group(0), content)

    # dark:-white/5 -> dark:border-white/5
    content = content.replace('dark:-white', 'dark:border-white')
    content = content.replace('dark:-gray', 'dark:border-gray')
    content = content.replace('hover:-primary', 'hover:border-primary')
    content = content.replace('focus:-primary', 'focus:border-primary')

    # Fix broken rounded
    content = content.replace(' -md ', ' rounded-md ') # wait, -md was shadow-md above
    content = content.replace(' -lg ', ' rounded-lg ')
    content = content.replace(' -xl ', ' rounded-xl ')
    content = content.replace(' -2xl ', ' rounded-2xl ')
    content = content.replace(' -3xl ', ' rounded-3xl ')
    
    # Fix broken bg-white
    content = content.replace('dark:/', 'dark:bg-white/')
    content = content.replace('bg-gray-50 dark:/5', 'bg-gray-50 dark:bg-white/5')
    content = content.replace('bg-gray-100 dark:/5', 'bg-gray-100 dark:bg-white/5')

    # Fix -inner (shadow-inner)
    content = content.replace(' -inner ', ' shadow-inner ')
    content = content.replace('"-inner', '"shadow-inner')

    # Fix -b, -t, -l, -r (border-b)
    content = content.replace(' -b ', ' border-b ')
    content = content.replace(' -t ', ' border-t ')
    content = content.replace(' -l ', ' border-l ')
    content = content.replace(' -r ', ' border-r ')
    
    # clean multiple spaces
    content = re.sub(r'\s+', ' ', content)
    content = content.replace('=" ', '="')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, dirs, files in os.walk(VIEWS_DIR):
    for file in files:
        if file.endswith(".tsx"):
            fix_file(os.path.join(root, file))

fix_file("src/App.tsx")
if os.path.exists("src/components/Layout.tsx"):
    fix_file("src/components/Layout.tsx")
if os.path.exists("src/components/PageHeader.tsx"):
    fix_file("src/components/PageHeader.tsx")

