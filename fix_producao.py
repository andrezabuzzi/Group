import re

with open('src/views/Producao.tsx', 'r') as f:
    content = f.read()

# 1. Update Filters outer container
pattern_filters_container = r'<div className="flex flex-wrap gap-4 items-center bg-white/60 p-3 rounded-\[2rem\] border border-border/50 backdrop-blur-xl shadow-sm w-full glass-card sticky top-24 z-20">'
content = content.replace(pattern_filters_container, '<div className="flex flex-wrap gap-4 items-center bg-white/60 p-6 rounded-[24px] border border-border/50 backdrop-blur-xl shadow-sm w-full sticky top-24 z-20">')

# 2. Update Search Input Container
pattern_search = r'<div className="flex items-center flex-1 min-w-\[200px\] bg-white/50 rounded-2xl px-2 border border-border/50 shadow-sm h-12 transition-colors focus-within:bg-white focus-within:border-primary/30">'
content = content.replace(pattern_search, '<div className="flex items-center flex-1 min-w-[200px] bg-white/50 rounded-[18px] px-4 border border-border/50 shadow-sm h-12 transition-colors focus-within:bg-white focus-within:border-primary/30">')

# 3. Update DropdownMenuTrigger classes for filters
# Old: className="inline-flex items-center justify-between whitespace-nowrap w-[140px] rounded-2xl h-12 text-sm font-bold bg-white hover:bg-gray-50 px-4 text-left border border-border/50 text-foreground shadow-sm transition-all focus:ring-4 focus:ring-primary/10"
# New: className="inline-flex items-center justify-between whitespace-nowrap w-[140px] rounded-[18px] h-12 text-sm font-bold bg-white hover:bg-gray-50 px-4 text-left border border-border/50 text-foreground shadow-sm transition-all focus:ring-4 focus:ring-primary/10"
content = content.replace('rounded-2xl h-12 text-sm font-bold bg-white hover:bg-gray-50', 'rounded-[18px] h-12 text-sm font-bold bg-white hover:bg-gray-50')

# 4. Change the main grid
# Old: <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
# New: <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
content = content.replace('<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">', '<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">')

with open('src/views/Producao.tsx', 'w') as f:
    f.write(content)
