import re

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "r") as f:
    text = f.read()

text = text.replace("import { PackageOpen", "import { PackageOpen, ChevronRight, ChevronLeft, Calendar, FileText, Settings, BarChart2, CheckCircle")
text = text.replace("const [returns, setReturns] = useState<any[]>([]);", "const [returns, setReturns] = useState<any[]>([]);\n  const [produtos, setProdutos] = useState<any[]>([]);")

# Let's write the whole file to make sure it's correct.
