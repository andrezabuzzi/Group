import re

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "r") as f:
    text = f.read()

validation_func = """  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.orderNumber || !formData.returnDate) {
        toast.error('Preencha os campos obrigatórios (Pedido e Data)');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.productId && !formData.sku) {
        toast.error('Selecione um produto ou digite o SKU');
        return false;
      }
      if (!formData.quantity || !formData.orderValue) {
        toast.error('Preencha a quantidade e o valor');
        return false;
      }
      if (formData.hasImpact === 'true' && !formData.freightCost) {
        toast.error('Informe o valor do prejuízo de frete');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };
"""

text = text.replace("  const openNewModal = () => {", validation_func + "\n  const openNewModal = () => {")

text = text.replace("""onClick={(e) => { e.preventDefault(); setCurrentStep(currentStep + 1); }}""", """onClick={(e) => { e.preventDefault(); handleNextStep(); }}""")

text = text.replace("""    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }""", """    if (currentStep < 3) {
      handleNextStep();
      return;
    }""")

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "w") as f:
    f.write(text)
