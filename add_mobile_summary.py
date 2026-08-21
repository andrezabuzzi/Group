import re

with open('src/views/CalculadoraConfeccao.tsx', 'r') as f:
    content = f.read()

# I will add a small floating bar at the bottom for mobile with the summary, or inside the main layout
# Let's just insert it before FOOTER CONTROLS
mobile_summary = """
              {/* MOBILE SUMMARY */}
              <div className="block lg:hidden mt-8 bg-card border border-border/50 rounded-[20px] p-5 shadow-sm">
                 <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-muted-foreground">Resumo da Produção</h4>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Custo Un.</p>
                      <p className="text-lg font-black text-foreground">{formatMoney(results.totalUnitCost)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Peças</p>
                      <p className="text-lg font-black text-foreground">{formatNum(results.estimatedMaxProduction)}</p>
                    </div>
                 </div>
                 {results.totalUnitCost > 0 && (
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                       <div className="bg-primary h-full" style={{ width: `${(results.fabricCostPerPiece / results.totalUnitCost) * 100}%` }} />
                       <div className="bg-purple-400 h-full" style={{ width: `${(results.directCostPerPiece / results.totalUnitCost) * 100}%` }} />
                       <div className="bg-purple-200 h-full" style={{ width: `${(results.indirectCostPerPiece / results.totalUnitCost) * 100}%` }} />
                    </div>
                 )}
              </div>
"""

content = content.replace("{/* FOOTER CONTROLS */}", mobile_summary + "\n              {/* FOOTER CONTROLS */}")

with open('src/views/CalculadoraConfeccao.tsx', 'w') as f:
    f.write(content)
print("Mobile summary added")
