import re

with open('src/views/Dashboard.tsx', 'r') as f:
    content = f.read()

# Fix CardFinanceiro
content = content.replace('<p className="text-[11px] font-bold text-foreground">{title}</p>', '<h3 className="text-base font-semibold text-foreground">{title}</h3>')
content = content.replace('<p className="text-xl font-black tracking-tight" >', '<p className="text-[38px] font-bold tracking-tight text-foreground mt-2 mb-2" >')
content = content.replace('<span className="text-[9px] font-medium" >vs mês anterior</span>', '<span className="text-[13px] font-normal text-muted-foreground ml-2" >vs mês anterior</span>')

# Fix Section Header Title
content = content.replace('<h2 className="text-xl font-black tracking-tight">{title}</h2>', '<h2 className="text-[28px] font-semibold tracking-tight">{title}</h2>')

# Fix CardProducao
content = content.replace('<p className="text-[11px] font-bold mb-3" >{title}</p>', '<h3 className="text-base font-semibold text-muted-foreground mb-3">{title}</h3>')
content = content.replace('<p className="text-2xl font-black tracking-tight" >', '<p className="text-[38px] font-bold tracking-tight text-foreground" >')

# Fix other cards
content = content.replace('<h3 className="text-[13px] font-bold" >', '<h3 className="text-base font-semibold text-foreground">')
content = content.replace('<h3 className="text-[14px] font-bold" >', '<h3 className="text-base font-semibold text-foreground">')
content = content.replace('text-[12px] font-medium', 'text-[14px] font-medium')
content = content.replace('text-[11px] font-bold', 'text-[14px] font-medium')
content = content.replace('text-[11px] font-medium', 'text-[13px] font-normal')

# Write back
with open('src/views/Dashboard.tsx', 'w') as f:
    f.write(content)
