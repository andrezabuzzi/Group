with open("src/views/Devolucoes/ControleDevolucoes.tsx", "r") as f:
    text = f.read()

# Add DollarSign to lucide-react
text = text.replace("TrendingDown } from 'lucide-react';", "TrendingDown, DollarSign } from 'lucide-react';")

# Add AreaChart and Area to recharts
text = text.replace("Line, CartesianGrid } from 'recharts';", "Line, CartesianGrid, AreaChart, Area } from 'recharts';")

# Fix ReactNode error for prod.value
text = text.replace("{prod.value}</div>", "{String(prod.value)}</div>")

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "w") as f:
    f.write(text)
