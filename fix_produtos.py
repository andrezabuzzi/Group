with open('src/views/Produtos.tsx', 'r') as f:
    content = f.read()

# Fix duplicates: remove the import line that has duplicates. 
# We already imported CheckCircle2, Factory, Layers at the top. Let's find the bottom one and remove it.
import re
content = re.sub(r"import \{ CheckCircle2, Factory, Layers \} from 'lucide-react';", "", content)

# Add X to the top imports
content = content.replace("import { LayoutList", "import { X, LayoutList")

# Fix asChild in DropdownMenuTrigger
content = content.replace("<DropdownMenuTrigger asChild>", "<DropdownMenuTrigger>")

with open('src/views/Produtos.tsx', 'w') as f:
    f.write(content)
