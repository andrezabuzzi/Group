import re

with open('src/views/Insumos.tsx', 'r') as f:
    content = f.read()

# Add CheckCircle and Clock to lucide-react imports if missing
if 'CheckCircle' not in content:
    content = content.replace('import { Plus, Search', 'import { Plus, Search, CheckCircle, Clock')

# Update toggleStatus and add pagarParcela
toggle_logic = """
  const toggleStatus = async (compra: any) => {
    try {
      const novoStatus = compra.statusPagamento === 'pago' ? 'pendente' : 'pago';
      let novasParcelas = compra.parcelas || [];
      if (novoStatus === 'pago') {
         novasParcelas = novasParcelas.map((p:any) => ({...p, status: 'pago'}));
      } else {
         novasParcelas = novasParcelas.map((p:any) => ({...p, status: 'pendente'}));
      }
      await updateDoc(doc(db, 'compras', compra.id), { statusPagamento: novoStatus, parcelas: novasParcelas, updatedAt: serverTimestamp() });
      toast.success(`Status alterado para ${novoStatus}!`);
      fetchCompras();
    } catch(err) {
      console.error(err);
      toast.error('Ocorreu um erro ao atualizar');
    }
  };

  const pagarParcela = async (compra: any, idx: number) => {
    try {
      const novasParcelas = [...(compra.parcelas || [])];
      if (!novasParcelas[idx]) return;
      novasParcelas[idx].status = novasParcelas[idx].status === 'pago' ? 'pendente' : 'pago';
      
      const allPaid = novasParcelas.every(p => p.status === 'pago');
      const novoStatus = allPaid ? 'pago' : 'pendente';

      await updateDoc(doc(db, 'compras', compra.id), { statusPagamento: novoStatus, parcelas: novasParcelas, updatedAt: serverTimestamp() });
      toast.success(`Parcela ${idx + 1} atualizada!`);
      
      if (selectedCompra && selectedCompra.id === compra.id) {
         setSelectedCompra({...compra, statusPagamento: novoStatus, parcelas: novasParcelas});
      }
      
      fetchCompras();
    } catch(err) {
      console.error(err);
      toast.error('Ocorreu um erro ao atualizar parcela');
    }
  };
"""

content = re.sub(
    r'const toggleStatus = async \(compra: any\) => \{[\s\S]*?fetchCompras\(\);\s*\}\s*catch\(err\)\s*\{\s*console\.error\(err\);\s*toast\.error\(\'Ocorreu um erro ao atualizar\'\);\s*\}\s*\};',
    toggle_logic,
    content
)

# Update Cards
cards_old = r'\{/\* CARDS EXECUTIVOS \(Reduced to 2\) \*/\}.*?(?=\{/\* MAIN CONTENT AREA - NO SIDEBAR, FULL WIDTH TABLE \*/\})'
cards_new = """{/* CARDS EXECUTIVOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div whileHover={{ y: -4 }} className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
             <DollarSign size={16}/>
             <span className="text-xs font-bold uppercase tracking-wider">Total Investido</span>
          </div>
          <div className="text-[24px] font-bold text-foreground">
             {(totalInvestido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-success">
             <CheckCircle size={16}/>
             <span className="text-xs font-bold uppercase tracking-wider">Total Pago</span>
          </div>
          <div className="text-[24px] font-bold text-foreground">
             {(totalInvestido - pendentesVal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </motion.div>
        
        <motion.div whileHover={{ y: -4 }} className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
             <Clock size={16}/>
             <span className="text-xs font-bold uppercase tracking-wider">Pendente</span>
          </div>
          <div className="text-[24px] font-bold text-foreground">
             {(pendentesVal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-card border border-border/50 rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
             <ShoppingBag size={16}/>
             <span className="text-xs font-bold uppercase tracking-wider">Compras Mês</span>
          </div>
          <div className="text-[24px] font-bold text-foreground">
             {comprasDoMes}
          </div>
        </motion.div>
      </div>

      """
content = re.sub(cards_old, cards_new, content, flags=re.DOTALL)


with open('src/views/Insumos.tsx', 'w') as f:
    f.write(content)
print("Updated Cards and toggleStatus")

