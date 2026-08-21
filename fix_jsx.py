import re

with open('src/views/Dashboard.tsx', 'r') as f:
    content = f.read()

# Fix CardTarefa and CardProducao and CardFinanceiro calls
content = re.sub(r"'var\(--card\)'=\{.*?\}", "cCard={cardBg}", content)
content = re.sub(r"'var\(--border\)'=\{.*?\}", "cBorder={cBorder}", content)
content = re.sub(r"'var\(--foreground\)'=\{.*?\}", "cText={cText}", content)
content = re.sub(r"'var\(--muted-foreground\)'=\{.*?\}", "cTextSec={cTextSec}", content)
# Check if any others were replaced
content = re.sub(r"'var\(--foreground\)'Sec=\{.*?\}", "cTextSec={cTextSec}", content)

with open('src/views/Dashboard.tsx', 'w') as f:
    f.write(content)
