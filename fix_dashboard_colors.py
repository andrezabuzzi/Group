import re

with open('src/views/Dashboard.tsx', 'r') as f:
    content = f.read()

# Recharts color variables replacement
content = content.replace('cPrimary', "'#6D4AFF'")
content = content.replace('cBg', "'var(--background)'")
content = content.replace('cCard', "'var(--card)'")
content = content.replace('cCardDark', "'var(--card)'")
content = content.replace('cCardSec', "'var(--card-secondary)'")
content = content.replace('cardBg', "'var(--card)'")
content = content.replace('cText', "'var(--foreground)'")
content = content.replace('cTextSec', "'var(--muted-foreground)'")
content = content.replace('cBorder', "'var(--border)'")

# Also fix the subtitleColor
content = content.replace('subtitleColor={\'#6D4AFF\'}', '')

with open('src/views/Dashboard.tsx', 'w') as f:
    f.write(content)
