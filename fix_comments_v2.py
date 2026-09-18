import re
import os

VIEWS_DIR = "src/views"

def fix_content(content):
    # First remove any block comments that might be messed up
    # Actually, let's keep them but remove stray words like "Filters" if they are before a const.
    # We will do a generic approach:
    # Find `// ...` that is not `https://`
    
    # regex to find // not preceded by :
    # (?<!:)//(.*?)(?= (?:const|let|var|function|return|import|export|if|else|for|switch|while|try|catch|pdf\.|set[A-Z]|<[a-zA-Z]|\} else|return)\b)
    
    # A robust way is to iteratively find the first `//` (not in URL),
    # and then find the END of the comment by looking for the next recognizable code block.
    
    # Wait, all original code was formatted by prettier maybe?
    # No, it's minified now.
    
    # Let's use a regex to replace "// text " with "/* text */ "
    # text is defined as anything up to the first recognizable code token.
    code_tokens = [
        r'\bconst\b', r'\blet\b', r'\bvar\b', r'\bfunction\b', r'\breturn\b',
        r'\bimport\b', r'\bexport\b', r'\bif\b', r'\} else\b', r'\belse\b', r'\bfor\b',
        r'\bswitch\b', r'\bwhile\b', r'\btry\b', r'\bcatch\b',
        r'pdf\.', r'set[A-Z]', r'<div', r'<span', r'<p\b', r'<section', r'<h[1-6]', r'<Button', r'<Input', r'<Select',
        r'chart[A-Z]', r'console\.'
    ]
    token_pattern = '|'.join(code_tokens)
    
    # We must match from // until the FIRST token_pattern.
    # Since regex is greedy or non-greedy, we can use non-greedy .*? followed by token_pattern.
    pattern = r'(?<!:)//(.*?)\s+(?=(' + token_pattern + r'))'
    
    old_content = ""
    while old_content != content:
        old_content = content
        content = re.sub(pattern, r'/* \1 */ ', content, count=1)
        
    return content

for root, dirs, files in os.walk(VIEWS_DIR):
    for file in files:
        if file.endswith(".tsx"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Since Home.tsx already has /* */ we need to be careful or just restore it
            # Actually, I'll just run it.
            new_content = fix_content(content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {filepath}")

