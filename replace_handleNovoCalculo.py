import re

with open('src/views/CalculadoraConfeccao.tsx', 'r') as f:
    content = f.read()

old_func_pattern = r'const handleNovoCalculo = \(\) => \{.*?\};'
new_func = """const handleNovoCalculo = () => {
    setStep(1);
    setViewMode("wizard");
    setFillMode("initial");
    setPieceName("");
    setMarkerLength("");
    setMarkerWidth("");
    setPiecesPerMarker("");
    setGradeType("tamanho_unico");
    setTotalMetersPurchased("");
    setTotalKgPurchased("");
    setYieldMetersPerKg("");
    setPricePerMeter("");
    setPricePerKg("");
    setSewingCostPerPiece("");
    setCuttingCostPerPiece("");
    setCuttingCostTotal("");
    setTrimsTotalCost("");
    setTransportTotalCost("");
    setPatternMakingCost("");
    setMarkerCost("");
    setPackagingCostPerPiece("");
    setPackagingCostTotal("");
    setOtherCosts("");
    setCostNotes("");
    setLotId(`LOTE-${Math.floor(1000 + Math.random() * 9000)}`);
    setFabricType("");
    setFabricColor("");
    setSupplierName("");
    setSeamstressName("");
    setCutterName("");
  };"""

content = re.sub(old_func_pattern, new_func, content, flags=re.DOTALL)

with open('src/views/CalculadoraConfeccao.tsx', 'w') as f:
    f.write(content)

print("handleNovoCalculo updated")
