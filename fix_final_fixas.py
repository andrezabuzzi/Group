with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

# Replace the weird end sequence
bad_end = """        </DialogContent>
      </Dialog></Dialog>
    </div>
  );
}"""

good_end = """        </DialogContent>
      </Dialog>
    </>
  );
}"""

if bad_end in content:
    content = content.replace(bad_end, good_end)
else:
    # try more robust replace
    import re
    content = re.sub(r'        <\/DialogContent>\s*<\/Dialog><\/Dialog>\s*<\/div>\s*<\/?>\s*\);\s*\}', good_end, content)
    content = re.sub(r'        <\/DialogContent>\s*<\/Dialog><\/Dialog>\s*<\/div>\s*\);\s*\}', good_end, content)
    content = re.sub(r'        <\/DialogContent>\s*<\/Dialog>\s*<\/div>\s*<\/>\s*\);\s*\}', good_end, content)

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)
