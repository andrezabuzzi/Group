import re

with open('src/views/Produtos.tsx', 'r') as f:
    content = f.read()

end_comp = r'        </DialogContent>\n      </Dialog>\n    </div>\n  \);\n}'
content = re.sub(end_comp, '        </DialogContent>\n      </Dialog>\n    </div>\n    </div>\n  );\n}', content)

with open('src/views/Produtos.tsx', 'w') as f:
    f.write(content)
