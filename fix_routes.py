import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("{ path: 'produtos', element: <Produtos /> },", "{ path: 'confeccao/dashboard', element: <Dashboard /> },\n      { path: 'produtos', element: <Produtos /> },")

with open('src/App.tsx', 'w') as f:
    f.write(content)
