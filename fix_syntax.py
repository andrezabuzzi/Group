import re

with open('src/views/Dashboard.tsx', 'r') as f:
    content = f.read()

# Fix the tick={{fill: 'var(--foreground)'Sec}}
content = content.replace("'var(--foreground)'Sec", "'var(--muted-foreground)'")

# Fix function CardFinanceiro props
content = content.replace("subtitleColor, 'var(--card)', 'var(--foreground)', 'var(--muted-foreground)', 'var(--border)'", "subtitleColor, cCard, cText, cTextSec, cBorder")
# Also CardProducao and CardTarefa
content = content.replace("'var(--card)', 'var(--foreground)', 'var(--muted-foreground)', 'var(--border)'", "cCard, cText, cTextSec, cBorder")
content = content.replace("'var(--card)', 'var(--border)', 'var(--foreground)', 'var(--muted-foreground)'", "cCard, cBorder, cText, cTextSec")

# Also, there are variables 'isDark' missing now since I deleted it. I will add `const { theme } = useTheme(); const isDark = theme === 'dark';` back to the top of Dashboard component.
# Actually it's still there. But maybe in some places it's missing?
# Let's check TS errors: "Cannot find name 'cPrimary'", "Cannot find name 'isDark'" - Wait, I deleted the isDark variable?
# Let's restore the variable block
var_block = """  const isDark = theme === 'dark';
  const cBg = isDark ? '#0F1117' : '#F6F7FB';
  const cCard = isDark ? '#FFFFFF' : '#FFFFFF';
  const cCardDark = '#181B24';
  const cCardSec = isDark ? '#202430' : '#F8F9FB';
  const cText = isDark ? '#FFFFFF' : '#111827';
  const cTextSec = isDark ? '#A5ADBD' : '#6B7280';
  const cPrimary = '#6D4AFF';
  const cBorder = isDark ? '#2A2F3D' : '#E5E7EB';
  const cardBg = isDark ? cCardDark : cCard;
"""
# We'll just define them again right after "const [hideValues, setHideValues] = useState(false);"
content = re.sub(r'const \[hideValues, setHideValues\] = useState\(false\);', f'const [hideValues, setHideValues] = useState(false);\n{var_block}', content)

with open('src/views/Dashboard.tsx', 'w') as f:
    f.write(content)
