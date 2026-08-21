with open('src/views/CalculadoraConfeccao.tsx', 'r') as f:
    content = f.read()

input_str = """
      {/* Hidden file input for AI */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
"""

content = content.replace('{/* MAIN LAYOUT */}', input_str + '\n      {/* MAIN LAYOUT */}')

with open('src/views/CalculadoraConfeccao.tsx', 'w') as f:
    f.write(content)
print("Input added")
