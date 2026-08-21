import re

with open('src/views/Dashboard.tsx', 'r') as f:
    content = f.read()

# Add PageHeader import
if "import { PageHeader } from '../components/PageHeader';" not in content:
    content = content.replace("import { Button } from '../components/ui/button';", "import { Button } from '../components/ui/button';\nimport { PageHeader } from '../components/PageHeader';")

# Remove inline colors and dark mode manual definitions
content = re.sub(r'const isDark = theme === \'dark\';\n\s*const cBg = [^\n]+\n\s*const cCard = [^\n]+\n\s*const cCardDark = [^\n]+\n\s*const cCardSec = [^\n]+\n\s*const cText = [^\n]+\n\s*const cTextSec = [^\n]+\n\s*const cPrimary = [^\n]+\n\s*const cBorder = [^\n]+\n\s*const cardBg = [^\n]+', '', content)
content = re.sub(r'const cBg = [^\n]+\n', '', content)
content = re.sub(r'const cCard = [^\n]+\n', '', content)
content = re.sub(r'const cCardDark = [^\n]+\n', '', content)
content = re.sub(r'const cCardSec = [^\n]+\n', '', content)
content = re.sub(r'const cText = [^\n]+\n', '', content)
content = re.sub(r'const cTextSec = [^\n]+\n', '', content)
content = re.sub(r'const cPrimary = [^\n]+\n', '', content)
content = re.sub(r'const cBorder = [^\n]+\n', '', content)
content = re.sub(r'const cardBg = [^\n]+\n', '', content)

# Remove old header
header_regex = r'<header className="sticky top-0 z-50.*?</header>'
# We will replace the entire header block with PageHeader
# Need to capture the selects to pass them to PageHeader
selects_match = re.search(r'(<Select value={periodo}.*?</Select>\s*<Select value={empresa}.*?</Select>\s*<Select value={canal}.*?</Select>)', content, re.DOTALL)
selects = selects_match.group(1) if selects_match else ""

page_header_jsx = f"""
      <PageHeader 
        title="Dashboard Executivo" 
        subtitle="Visão geral da operação financeira, produção, devoluções, tarefas e alertas."
        hideValues={{hideValues}}
        onToggleHideValues={{() => setHideValues(!hideValues)}}
        filters={{
          <>
            {selects}
          </>
        }}
      />
"""

content = re.sub(header_regex, page_header_jsx, content, flags=re.DOTALL)

# Replace <div className="w-full min-h-screen pb-24 transition-colors duration-300" style={{ backgroundColor: cBg, color: cText, fontFamily: 'Inter, sans-serif' }}>
content = re.sub(
    r'<div className="w-full min-h-screen pb-24 transition-colors duration-300" style={{ backgroundColor: cBg, color: cText, fontFamily: \'Inter, sans-serif\' }}>',
    '<div className="w-full min-h-screen pb-24 transition-colors duration-300 bg-background text-foreground font-sans">',
    content
)

# Remove all inline styles for colors
content = re.sub(r'style={{ backgroundColor: cCard, borderColor: cBorder }}', '', content)
content = re.sub(r'style={{ color: cText }}', '', content)
content = re.sub(r'style={{ color: subtitleColor \|\| cTextSec }}', '', content)
content = re.sub(r'style={{ color: cTextSec }}', '', content)
content = re.sub(r'style={{ color: valColor \|\| cText }}', '', content)
content = re.sub(r'style={{ backgroundColor: cCardSec }}', '', content)
content = re.sub(r'style={{ backgroundColor: cardBg, borderColor: cBorder }}', '', content)
content = re.sub(r'style={{ backgroundColor: cPrimary, color: \'#FFF\' }}', '', content)
content = re.sub(r'style={{ backgroundColor: cPrimary }}', '', content)

# Clean up component props calls
content = re.sub(r'cCard={cardBg} cText={cText} cTextSec={cTextSec} cBorder={cBorder}', '', content)

# Update subcomponents CSS classes
content = content.replace('rounded-2xl p-5 border flex flex-col gap-4', 'premium-card flex flex-col gap-4')
content = content.replace('className="rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 border"', 'className="premium-card flex flex-col justify-between"')
content = content.replace('className="rounded-2xl p-5 flex flex-col justify-center border"', 'className="premium-card flex flex-col justify-center"')
content = content.replace('className="rounded-xl py-3 px-1 border flex flex-col items-center justify-center"', 'className="premium-card py-3 px-1 flex flex-col items-center justify-center"')

# Update section header badges
content = content.replace('w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm shadow-md shadow-primary/20', 'w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm')

# Write back
with open('src/views/Dashboard.tsx', 'w') as f:
    f.write(content)
