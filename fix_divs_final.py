import re

with open('src/views/Produtos.tsx', 'r') as f:
    content = f.read()

# Let's count all <div> and </div> in the file, and see what the mismatch is.
def check_divs(text):
    opens = len(re.findall(r'<div\b[^>]*>', text))
    closes = len(re.findall(r'</div>', text))
    return opens, closes

print("Before:", check_divs(content))

# Look around line 640.
end_comp = r'        </DialogContent>\n      </Dialog>\n    </div>\n  \);\n}'
if re.search(end_comp, content):
    print("Found end_comp")
else:
    print("Not found end_comp")

