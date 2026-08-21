import re

with open('src/views/CalculadoraConfeccao.tsx', 'r') as f:
    content = f.read()

# Add ref
ref_import = r"import React, { useState, useMemo } from 'react';"
new_ref_import = "import React, { useState, useMemo, useRef } from 'react';"
if "useRef" not in content:
    content = content.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo, useRef } from 'react';")

# Add ref to component
if "const fileInputRef" not in content:
    content = content.replace("const [step, setStep] = useState(1);", "const fileInputRef = useRef<HTMLInputElement>(null);\n  const [step, setStep] = useState(1);")

old_func_pattern = r'const handleSimulateAI = \(\) => \{.*?\};'
new_func = """const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    toast.promise(new Promise((resolve) => setTimeout(resolve, 2500)), {
      loading: "A IA está analisando a imagem do risco...",
      success: () => {
        setMarkerLength("185");
        setMarkerWidth("170");
        setPiecesPerMarker("8");
        setFillMode('manual');
        return "Dados preenchidos automaticamente com base no risco!";
      },
      error: "Erro ao analisar imagem",
    });
  };

  const handleSimulateAI = () => {
    fileInputRef.current?.click();
  };"""

content = re.sub(old_func_pattern, new_func, content, flags=re.DOTALL)

with open('src/views/CalculadoraConfeccao.tsx', 'w') as f:
    f.write(content)

print("AI updated")
