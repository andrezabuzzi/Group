import os
import re

VIEWS_DIR = "src/views"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Standardize page headers: <h1 className="...">Title</h1>
    # We want text-[36px] font-bold tracking-tight text-foreground
    content = re.sub(
        r'<h1\s+className="[^"]*text-[^"]*"\s*>',
        r'<h1 className="text-[36px] font-bold tracking-tight text-foreground leading-tight">',
        content
    )

    # 2. Standardize section headers: <h2 className="...">Title</h2>
    # We want text-[28px] font-semibold tracking-tight text-foreground
    content = re.sub(
        r'<h2\s+className="[^"]*text-[^"]*"\s*>',
        r'<h2 className="text-[28px] font-semibold tracking-tight text-foreground">',
        content
    )

    # 3. Standardize KPI values in standard cards: replace big texts inside cards with text-[38px]
    # This is tricky without parsing HTML, but we can target common KPI value patterns:
    # e.g., <div className="text-3xl font-black...">{value}</div> -> text-[38px] font-bold tracking-tight
    content = re.sub(
        r'(<div[^>]*className="[^"]*)(?:text-3xl|text-4xl|text-\[32px\]|text-\[28px\]|text-\[40px\])\s+(?:font-black|font-extrabold|font-bold)([^"]*"\s*>)',
        r'\1text-[38px] font-bold tracking-tight text-foreground\2',
        content
    )
    content = re.sub(
        r'(<span[^>]*className="[^"]*)(?:text-3xl|text-4xl|text-\[32px\]|text-\[28px\]|text-\[40px\])\s+(?:font-black|font-extrabold|font-bold)([^"]*"\s*>)',
        r'\1text-[38px] font-bold tracking-tight text-foreground\2',
        content
    )
    content = re.sub(
        r'(<p[^>]*className="[^"]*)(?:text-3xl|text-4xl|text-\[32px\]|text-\[28px\]|text-\[40px\])\s+(?:font-black|font-extrabold|font-bold)([^"]*"\s*>)',
        r'\1text-[38px] font-bold tracking-tight text-foreground\2',
        content
    )

    # 4. Standardize Buttons: any Button with variant="default" or no variant + primary color should get premium-btn-primary
    # Or just add premium-btn-primary to primary buttons.
    content = re.sub(
        r'(<Button[^>]*?className=")([^"]*)"',
        lambda m: m.group(0) if 'premium-btn-primary' in m.group(2) or 'variant=' in m.group(0) and 'ghost' in m.group(0) or 'destructive' in m.group(0) or 'outline' in m.group(0) else m.group(1) + ' premium-btn-primary ' + m.group(2) + '"',
        content
    )

    # 5. Standardize Inputs: add premium-input
    content = re.sub(
        r'(<Input[^>]*?className=")([^"]*)"',
        lambda m: m.group(0) if 'premium-input' in m.group(2) else m.group(1) + 'premium-input ' + m.group(2) + '"',
        content
    )

    # 6. Standardize Cards: replace 'bg-card' 'bg-white' 'rounded-xl' 'rounded-2xl' 'shadow-sm' with premium-card
    # We will look for <div className="..."> and if it has bg-card or bg-white and a border/shadow, we insert premium-card.
    # A safe approach is to just inject premium-card in any class string that contains 'bg-card' + 'rounded' or 'border'
    def replace_card_classes(m):
        cls = m.group(2)
        if 'premium-card' in cls:
            return m.group(0)
        
        # Check if it looks like a card
        if ('bg-card' in cls or 'bg-white' in cls) and ('rounded' in cls or 'border' in cls or 'shadow' in cls):
            # remove old card styles to avoid conflict
            cls = re.sub(r'\bbg-white\b', '', cls)
            cls = re.sub(r'\bbg-card\b', '', cls)
            cls = re.sub(r'\brounded-(md|lg|xl|2xl|3xl|\[.*?\])\b', '', cls)
            cls = re.sub(r'\bshadow-(sm|md|lg|xl)\b', '', cls)
            cls = re.sub(r'\bshadow\b', '', cls)
            cls = re.sub(r'\bborder\b', '', cls)
            # clean up extra spaces
            cls = re.sub(r'\s+', ' ', cls).strip()
            return f'{m.group(1)}premium-card {cls}"'
        return m.group(0)

    content = re.sub(r'(<div[^>]*?className=")([^"]*)"', replace_card_classes, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(VIEWS_DIR):
    for file in files:
        if file.endswith(".tsx"):
            process_file(os.path.join(root, file))

# Also run on App.tsx and Layout.tsx to be sure
process_file("src/App.tsx")
if os.path.exists("src/components/Layout.tsx"):
    process_file("src/components/Layout.tsx")
if os.path.exists("src/components/PageHeader.tsx"):
    process_file("src/components/PageHeader.tsx")

