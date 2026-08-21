import re

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "r") as f:
    text = f.read()

replacement = """                     {currentStep < 3 && (
                        <Button key="next-btn" type="button" className="h-14 font-bold px-10 rounded-[16px] bg-primary text-primary-foreground shadow-[0_4px_24px_rgba(109,74,255,0.4)]" onClick={(e) => { e.preventDefault(); setCurrentStep(currentStep + 1); }}>
                           Próximo <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                     )}
                     {currentStep === 3 && (
                        <Button key="submit-btn" type="submit" disabled={isSubmitting} className="h-14 font-bold px-10 rounded-[16px] bg-primary text-primary-foreground shadow-[0_4px_24px_rgba(109,74,255,0.4)] hover:shadow-[0_4px_32px_rgba(109,74,255,0.6)]">
                           {isSubmitting ? 'Salvando...' : editingId ? 'Atualizar Devolução' : 'Registrar Devolução'}
                        </Button>
                     )}"""

text = re.sub(
    r'\{currentStep < 3 \? \(\s*<Button type="button".*?Próximo.*?<\/Button>\s*\) : \(\s*<Button type="submit".*?<\/Button>\s*\)\}',
    replacement,
    text,
    flags=re.DOTALL
)

with open("src/views/Devolucoes/ControleDevolucoes.tsx", "w") as f:
    f.write(text)
