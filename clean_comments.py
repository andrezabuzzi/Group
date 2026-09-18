import re
import os

VIEWS_DIR = "src/views"

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # 1. Remove /* */ followed by text up to next token
    # Wait, if we just remove /* */ we still have the text.
    # We should find `/\*\s*\*/\s*(.*?)(?=const|let|var|function|return|import|export|<[A-Z]|<div)`
    # And replace it with `/* \1 */ `
    
    # Let's fix Home.tsx where it has `/* */ Firebase Data State const`
    content = re.sub(r'/\*\s*\*/(.*?)(?=\b(const|let|var|function|return|import|export|if|else|for|switch|while|try|catch|pdf\.|set[A-Z]|<[a-zA-Z]|\} else)\b)', r'/* \1 */ ', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Cleaned {filepath}")

for root, dirs, files in os.walk(VIEWS_DIR):
    for file in files:
        if file.endswith(".tsx"):
            clean_file(os.path.join(root, file))

