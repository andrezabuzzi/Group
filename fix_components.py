import re
with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

# Missing imports
imports = """import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';"""

content = re.sub(
    r"import \{ DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator \} from '\.\./\.\./components/ui/dropdown-menu';\nimport \{ Label \} from '\.\./\.\./components/ui/label';\nimport \{ Input \} from '\.\./\.\./components/ui/input';",
    imports,
    content
)

# Fix DropdownMenuTrigger asChild
# Original:
# <DropdownMenuTrigger asChild>
#   <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#6B7280] transition-colors">
#     <MoreVertical size={18} />
#   </button>
# </DropdownMenuTrigger>

fixed_trigger = """<DropdownMenuTrigger render={
  <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#6B7280] transition-colors">
    <MoreVertical size={18} />
  </button>
} />"""

content = re.sub(
    r'<DropdownMenuTrigger asChild>[\s\n]*<button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-\[#6B7280\] transition-colors">[\s\n]*<MoreVertical size=\{18\} />[\s\n]*</button>[\s\n]*</DropdownMenuTrigger>',
    fixed_trigger,
    content
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
