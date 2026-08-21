with open('src/views/CalculadoraConfeccao.tsx', 'r') as f:
    content = f.read()

old_click1 = """onClick={() => {
                setStep(1);
                setViewMode("wizard");
                setFillMode("initial");
              }}"""
content = content.replace(old_click1, "onClick={handleNovoCalculo}")

old_click2 = """onClick={() => {
                            handleSimulateAI();
                            setFillMode("manual");
                          }}"""
content = content.replace(old_click2, "onClick={handleSimulateAI}")

with open('src/views/CalculadoraConfeccao.tsx', 'w') as f:
    f.write(content)
print("onClick handlers fixed")
