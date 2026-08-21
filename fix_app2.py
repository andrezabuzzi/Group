import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("errorElement: <RootError />,\n    children", "children")

# Remove RootError definition
content = re.sub(r"import { useRouteError } from 'react-router';\n\nfunction RootError\(\) {.*?}\n\nconst router", "const router", content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
