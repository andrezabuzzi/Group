import re

with open('src/views/Produtos.tsx', 'r') as f:
    content = f.read()

# At DETALHES DRAWER, let's make sure we have exactly enough </div>s.
# We had:
#             )}
#          </div>
#          </div>
#      {/* DETALHES DRAWER (Mock) */}
# We need to change that to:
#             )}
#          </div>
#        </div>
#      </div>
#      {/* DETALHES DRAWER (Mock) */}

content = content.replace("          </div>\n          </div>\n\n      {/* DETALHES DRAWER (Mock) */}", "          </div>\n        </div>\n      </div>\n\n      {/* DETALHES DRAWER (Mock) */}")

with open('src/views/Produtos.tsx', 'w') as f:
    f.write(content)
