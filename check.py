with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

import re
tags = re.finditer(r'<(\/?[A-Za-z0-9]+)([^>]*?)(\/?)>', content)

stack = []
self_closing = ['input', 'Input', 'img', 'br', 'hr', 'path', 'circle', 'line', 'rect', 'CheckCircle', 'Edit2', 'Trash2', 'Eye', 'EyeOff', 'Plus', 'Filter', 'ChevronDown', 'MoreVertical', 'Copy', 'DropdownMenuSeparator', 'Cell', 'RechartsTooltip', 'Legend', 'XAxis', 'YAxis', 'CartesianGrid', 'Line']

for match in tags:
    full = match.group(0)
    tag = match.group(1)
    is_self_closing = match.group(3) == '/' or tag in self_closing
    is_closing = tag.startswith('/')
    name = tag.lstrip('/')
    
    line_no = content[:match.start()].count('\n') + 1
    
    if is_self_closing:
        continue
        
    if is_closing:
        if not stack:
            print(f"Line {line_no}: Extra closing </{name}>")
        else:
            last = stack.pop()
            if last['name'] != name:
                print(f"Line {line_no}: Mismatched closing </{name}>! Expected </{last['name']}> opened at line {last['line']}")
                stack.append(last) # Push it back to avoid cascading
    else:
        stack.append({'name': name, 'line': line_no})
        
for item in stack:
    print(f"Unclosed tag <{item['name']}> at line {item['line']}")
