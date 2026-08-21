import re

with open('src/views/CalculadoraConfeccao.tsx', 'r') as f:
    content = f.read()

# Replace initial state values
content = re.sub(r'useState\("145"\)', 'useState("")', content)
content = re.sub(r'useState\("160"\)', 'useState("")', content)
content = re.sub(r'useState\("6"\)', 'useState("")', content)
content = re.sub(r'useState\("25"\)', 'useState("")', content)
content = re.sub(r'useState\("18\.90"\)', 'useState("")', content)
content = re.sub(r'useState\("7\.00"\)', 'useState("")', content)
content = re.sub(r'useState\("150\.00"\)', 'useState("")', content)
content = re.sub(r'useState\("85\.00"\)', 'useState("")', content)
content = re.sub(r'useState\("50\.00"\)', 'useState("")', content)
content = re.sub(r'useState\("120\.00"\)', 'useState("")', content)
content = re.sub(r'useState\("35\.00"\)', 'useState("")', content)
content = re.sub(r'useState\("0\.50"\)', 'useState("")', content)
content = re.sub(r'useState\("0"\)', 'useState("")', content)
content = re.sub(r'useState\("Algodão"\)', 'useState("")', content)

with open('src/views/CalculadoraConfeccao.tsx', 'w') as f:
    f.write(content)

print("States updated")
