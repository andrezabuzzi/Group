import re

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "r") as f:
    text = f.read()

replacement = """  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }
    if (!user) return;
    setIsSubmitting(true);"""

text = text.replace("""  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);""", replacement)

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "w") as f:
    f.write(text)
