import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Replace the table css block
new_table_css = """  table {
    @apply w-full text-sm text-left;
    border-collapse: separate;
    border-spacing: 0 8px;
  }
  thead {
    @apply bg-transparent text-muted-foreground font-medium text-[13px] tracking-wide;
  }
  th {
    @apply px-4 py-3 sticky top-0 font-semibold uppercase text-[11px] tracking-wider;
    border: none;
  }
  td {
    @apply px-4 py-4;
  }
  tbody tr {
    @apply transition-colors duration-250 bg-card hover:bg-secondary/20 shadow-sm hover:shadow-md;
    border-radius: 12px;
  }
  tbody tr td:first-child {
    border-top-left-radius: 12px;
    border-bottom-left-radius: 12px;
  }
  tbody tr td:last-child {
    border-top-right-radius: 12px;
    border-bottom-right-radius: 12px;
  }
  tbody tr td {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  tbody tr td:first-child {
    border-left: 1px solid var(--border);
  }
  tbody tr td:last-child {
    border-right: 1px solid var(--border);
  }
  .dark tbody tr {
    @apply hover:bg-card-secondary;
  }"""

content = re.sub(r'  table \{.*?\.dark tbody tr \{.*?\}', new_table_css, content, flags=re.DOTALL)

with open('src/index.css', 'w') as f:
    f.write(content)

print("Done")
