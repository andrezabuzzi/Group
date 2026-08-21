import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Fix wrapper width
content = content.replace('isPinned ? "w-[280px]" : "w-[80px]"', 'isPinned ? "w-[280px]" : "w-[84px]"')
# Fix SidebarContent width
content = content.replace('forceExpand ? "w-full rounded-none border-none" : isExpanded ? "w-[300px]" : "w-[80px]"', 'forceExpand ? "w-full rounded-none border-none" : isExpanded ? "w-[280px]" : "w-[84px]"')

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
