import re
import os

def fix_comments(content):
    # Find all occurrences of // and try to end them before the next keyword or JSX tag
    # We'll use a regex that looks for // followed by non-greedy anything, until a space and a keyword
    # It's a bit dangerous if the comment itself contains " const "
    
    # Let's replace one by one.
    # A comment usually doesn't have {} or () or <> unless it's code.
    # Actually, we can just remove all // comments if they are not URLs!
    # Wait, if we remove `// Filters const [periodo...` we will remove `Filters `. That's fine.
    
    # Regex: // followed by text until it hits a known code keyword
    pattern = r'//(.*?)\s+(const\b|let\b|var\b|function\b|return\b|import\b|export\b|<[A-Z]|[A-Z][a-z])'
    
    # We have to run it multiple times because replacing one might expose the next
    old_content = ""
    while old_content != content:
        old_content = content
        content = re.sub(pattern, r'/* \1 */ \2', content, count=1)
        
    # Also catch `//` inside JSX which might be followed by `{` or `<`
    # E.g. `{/* FINANCEIRO */}` was `{/* FINANCEIRO */}` so it's already block comment!
    # But wait, what if someone wrote `// FINANCEIRO` inside JSX? It should be `{/*`
    
    # Clean up any remaining // that are stuck at the end of the line (which is the end of the file now)
    content = re.sub(r'//.*$', '', content)
    
    return content

with open("src/views/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

fixed = fix_comments(content)
with open("src/views/Home.tsx", "w", encoding="utf-8") as f:
    f.write(fixed)
print("Done")
