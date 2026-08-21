with open('firestore.rules', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "function request.resource.data {" in line or "function resource.data {" in line:
        skip = True
        continue
    if skip and "return " in line:
        continue
    if skip and "}" in line:
        skip = False
        continue
    new_lines.append(line)

with open('firestore.rules', 'w') as f:
    f.writelines(new_lines)
