import re

with open('logic.tsx', 'r') as f:
    logic_code = f.read()

# We need to ensure we import framer-motion and the new lucide icons
extra_imports = """
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical, Edit2, Copy, CheckCircle, Archive, Trash2,
  TrendingUp, TrendingDown, AlertCircle, Calendar,
  Wallet, PieChart as PieChartIcon, Activity,
  ArrowRight, Download, FileText, Plus, ChevronRight,
  Filter, X, Search
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../components/ui/dropdown-menu';
"""

# Let's insert the extra_imports just before the component definition
logic_code = logic_code.replace("export default function DespesasFixas() {", extra_imports + "\nexport default function DespesasFixas() {")

# To keep the script safe, we will just construct the return statement
# and append it.
# We also need to add some derived stats within the component body before the return.
# It's safer to just inject them right before `return (`

derived_stats = """
  // --- UI Derived Data ---
  const accountMap: any = {};
  expenses.forEach(item => {
    const d = item.dueDate ? new Date(item.dueDate + 'T00:00:00') : new Date();
    if (isSameMonth(d, currentMonthDate)) {
      accountMap[item.account || 'Sem Conta'] = (accountMap[item.account || 'Sem Conta'] || 0) + Number(item.value);
    }
  });
  const accountData = Object.keys(accountMap).map(k => ({ name: k, value: accountMap[k] }));

  // Helper for formatting
  const formatValue = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  // Timeline events (Mocked from alerts/history for visual purpose, matching existing data)
  const recentEvents = expenses.slice(0, 4).map(e => ({
    title: e.status === 'pago' ? 'Pagamento registrado' : 'Despesa criada',
    desc: e.name,
    date: e.updatedAt || e.createdAt || new Date().toISOString()
  }));

  // Insights
  const insights = [
    `A despesa com ${stats.maiorDespesa.name} representa maior custo fixo (${formatValue(stats.maiorDespesa.value)}).`,
    `O custo fixo teve ${stats.diffPrevMonth > 0 ? 'aumento' : 'queda'} de ${Math.abs(stats.diffPrevMonth).toFixed(1)}% neste mês.`,
    `Existem ${stats.proxVencimentos} despesas vencendo nos próximos 7 dias.`,
    `O total comprometido restante é ${formatValue(stats.totalPendente + stats.totalAtrasado)}.`
  ];
"""

new_return = """
  return (
    <div className="min-h-screen bg-[#F6F7FB] dark:bg-[#0F1117] text-[#111827] dark:text-white p-4 md:p-8 font-sans transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[34px] font-bold tracking-tight text-[#111827] dark:text-white leading-tight">Despesas Fixas</h1>
          <p className="text-[15px] text-[#6B7280] dark:text-[#A8B0C0] font-medium mt-1">Gerencie todas as despesas recorrentes da empresa.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="h-[48px] px-6 bg-[#6D4AFF] dark:bg-[#7B61FF] hover:opacity-90 text-white rounded-[18px] font-bold text-[15px] shadow-[0_4px_14px_0_rgba(109,74,255,0.39)] transition-all flex items-center gap-2"
        >
          <Plus size={20} strokeWidth={2.5} /> Nova Despesa Fixa
        </button>
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-3 mb-8">
        {['Nova Despesa', 'Nova Categoria', 'Registrar Pagamento', 'Exportar Excel', 'Exportar PDF', 'Relatório Financeiro'].map(act => (
          <button key={act} className="px-4 py-2.5 bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[18px] text-[13px] font-bold text-[#6B7280] dark:text-[#A8B0C0] hover:text-[#6D4AFF] dark:hover:text-[#7B61FF] hover:border-[#6D4AFF]/30 transition-colors flex items-center gap-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            {act}
          </button>
        ))}
      </div>

      {/* KPIs - 6 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { title: "Total de Despesas", value: stats.totalFixas, icon: Wallet, color: "#6D4AFF", trend: stats.diffPrevMonth },
          { title: "Pago no Mês", value: stats.totalPago, icon: CheckCircle, color: "#10b981", trend: 0 },
          { title: "Pendente", value: stats.totalPendente, icon: Calendar, color: "#f59e0b", trend: 0 },
          { title: "Atrasado", value: stats.totalAtrasado, icon: AlertCircle, color: "#ef4444", trend: 0 },
          { title: "Próximos 7 dias", value: stats.proxVencimentos, isNum: true, icon: Activity, color: "#8b5cf6", trend: 0 },
          { title: "Maior Despesa", value: stats.maiorDespesa.value, icon: TrendingUp, color: "#ec4899", trend: 0 }
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={kpi.title} 
            className="bg-white dark:bg-[#181B24] rounded-[24px] p-5 border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-opacity-10 dark:bg-opacity-20`} style={{ backgroundColor: `${kpi.color}20`, color: kpi.color }}>
                <kpi.icon size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-[13px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider">{kpi.title}</h3>
            </div>
            <div className="text-[28px] font-bold text-[#111827] dark:text-white tracking-tight mb-2">
              {kpi.isNum ? kpi.value : (privacyMode ? 'R$ •••••' : formatValue(kpi.value as number))}
            </div>
            {kpi.trend !== 0 && (
              <div className="flex items-center gap-1">
                {kpi.trend > 0 ? <TrendingUp size={14} className="text-rose-500" /> : <TrendingDown size={14} className="text-emerald-500" />}
                <span className={`text-[12px] font-bold ${kpi.trend > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {Math.abs(kpi.trend).toFixed(1)}%
                </span>
                <span className="text-[12px] text-[#6B7280] dark:text-[#A8B0C0] ml-1">vs mês anterior</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* MAIN COLUMN */}
        <div className="xl:col-span-3 space-y-8">
          
          {/* FILTERS */}
          <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#111827] dark:text-white flex items-center gap-2"><Filter size={18}/> Filtros Ativos</h3>
              <button 
                onClick={() => { setFilterCategory('Todas'); setFilterStatus('Todos'); setFilterPaymentMode('Todos'); setFilterAccount('Todas'); }}
                className="text-[13px] font-bold text-[#6B7280] hover:text-[#6D4AFF] transition-colors"
              >
                Limpar filtros
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Mês', val: filterMonth, set: setFilterMonth, options: Array.from({length:12}).map((_,i)=>({label: format(new Date(2024, i, 1), 'MMM'), value: i.toString()})) },
                { label: 'Ano', val: filterYear, set: setFilterYear, options: ['2023','2024','2025','2026'] },
                { label: 'Categoria', val: filterCategory, set: setFilterCategory, options: ['Todas', ...categories] },
                { label: 'Status', val: filterStatus, set: setFilterStatus, options: ['Todos', 'pago', 'pendente', 'atrasado', 'vence_hoje'] },
                { label: 'Conta', val: filterAccount, set: setFilterAccount, options: ['Todas', ...accounts] },
                { label: 'Pagamento', val: filterPaymentMode, set: setFilterPaymentMode, options: ['Todos', ...paymentMethods] },
              ].map(f => (
                <div key={f.label} className="relative group">
                  <select 
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    className="appearance-none h-[48px] pl-4 pr-10 bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 rounded-[18px] text-[14px] font-bold text-[#111827] dark:text-white outline-none focus:border-[#6D4AFF] transition-colors cursor-pointer"
                  >
                    {f.options.map((opt: any) => (
                      <option key={opt.value || opt} value={opt.value !== undefined ? opt.value : opt}>
                        {f.label}: {opt.label || opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                </div>
              ))}
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white dark:bg-[#181B24] rounded-[24px] border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F7FB]/50 dark:bg-[#12141C]/50 border-b border-[#ECEFF5] dark:border-white/5">
                    <th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider">Despesa</th>
                    <th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider">Categoria / Conta</th>
                    <th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider">Vencimento</th>
                    <th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider">Status</th>
                    <th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider text-right">Valor</th>
                    <th className="p-5 text-[12px] font-bold text-[#6B7280] dark:text-[#A8B0C0] uppercase tracking-wider text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {loading ? (
                       <tr><td colSpan={6} className="p-8 text-center text-[#6B7280] font-bold">Carregando...</td></tr>
                    ) : filteredList.length === 0 ? (
                       <tr><td colSpan={6} className="p-8 text-center text-[#6B7280] font-bold">Nenhuma despesa encontrada.</td></tr>
                    ) : (
                      filteredList.map((item, i) => (
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.02 }}
                          key={item.id} 
                          className="border-b border-[#ECEFF5] dark:border-white/5 hover:bg-[#F6F7FB]/50 dark:hover:bg-[#12141C]/50 transition-colors group"
                        >
                          <td className="p-5">
                            <div className="font-bold text-[15px] text-[#111827] dark:text-white">{item.name}</div>
                            {item.notes && <div className="text-[13px] text-[#6B7280] mt-1 truncate max-w-[200px]">{item.notes}</div>}
                          </td>
                          <td className="p-5">
                            <div className="font-bold text-[14px] text-[#111827] dark:text-[#A8B0C0]">{item.category}</div>
                            <div className="text-[12px] text-[#6B7280] mt-1">{item.account || '-'}</div>
                          </td>
                          <td className="p-5">
                            <div className="font-bold text-[14px] text-[#111827] dark:text-white">
                              {item.dueDate ? format(new Date(item.dueDate + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                            </div>
                            <div className="text-[12px] text-[#6B7280] mt-1">{item.paymentMethod || '-'}</div>
                          </td>
                          <td className="p-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold ${statusColors[item._computedStatus]}`}>
                              {statusLabels[item._computedStatus]}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            <div className="font-black text-[16px] text-[#111827] dark:text-white">
                              {privacyMode ? 'R$ •••••' : formatValue(item.value)}
                            </div>
                            {item.status === 'pago' && item.paidValue && (
                              <div className="text-[12px] text-emerald-500 font-bold mt-1">
                                Pago: {privacyMode ? '••••' : formatValue(item.paidValue)}
                              </div>
                            )}
                          </td>
                          <td className="p-5 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="p-2 rounded-[12px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors outline-none">
                                <MoreVertical size={18} className="text-[#6B7280]" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-2">
                                {item.status !== 'pago' && (
                                  <DropdownMenuItem onClick={() => openPayModal(item)} className="rounded-[12px] focus:bg-[#10b981]/10 focus:text-[#10b981] cursor-pointer font-bold text-[14px] py-2.5">
                                    <CheckCircle size={16} className="mr-2" /> Registrar Pagamento
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => { setEditingExpense(item); setFormData({ ...item }); setIsModalOpen(true); }} className="rounded-[12px] focus:bg-[#F6F7FB] dark:focus:bg-[#12141C] cursor-pointer font-bold text-[14px] py-2.5">
                                  <Edit2 size={16} className="mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDupe(item)} className="rounded-[12px] focus:bg-[#F6F7FB] dark:focus:bg-[#12141C] cursor-pointer font-bold text-[14px] py-2.5">
                                  <Copy size={16} className="mr-2" /> Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#ECEFF5] dark:bg-white/5 my-1" />
                                <DropdownMenuItem onClick={() => handleDelete(item)} className="rounded-[12px] focus:bg-rose-500/10 focus:text-rose-500 text-rose-600 cursor-pointer font-bold text-[14px] py-2.5">
                                  <Trash2 size={16} className="mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <h3 className="text-[15px] font-bold text-[#111827] dark:text-white mb-6">Despesas por Categoria</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} stroke="none">
                      {stats.categoryData.map((e, i) => <Cell key={i} fill={['#6D4AFF', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][i % 5]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} formatter={(v: number) => privacyMode ? '••••' : formatValue(v)} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <h3 className="text-[15px] font-bold text-[#111827] dark:text-white mb-6">Evolução Mensal</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyData}>
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => `R$${v}`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF5" opacity={0.5} />
                    <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} formatter={(v: number) => privacyMode ? '••••' : formatValue(v)} />
                    <Line type="monotone" dataKey="value" stroke="#6D4AFF" strokeWidth={3} dot={{ r: 4, fill: '#6D4AFF', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

        {/* SIDE COLUMN */}
        <div className="space-y-8">
          
          {/* INSIGHTS */}
          <div className="bg-[#6D4AFF] rounded-[24px] p-6 text-white shadow-[0_10px_30px_rgba(109,74,255,0.2)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2"><AlertCircle size={20}/> Insights Inteligentes</h3>
            <div className="space-y-3 relative z-10">
              {insights.map((ins, i) => (
                <div key={i} className="bg-white/10 rounded-[16px] p-4 border border-white/10 backdrop-blur-md">
                  <p className="text-[14px] font-medium leading-relaxed">{ins}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PAINEL EXECUTIVO */}
          <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <h3 className="text-[15px] font-bold text-[#111827] dark:text-white mb-4">Resumo Financeiro</h3>
            <div className="space-y-4">
               {[
                 { label: 'Total Previsto', val: stats.totalFixas, color: 'text-[#111827] dark:text-white' },
                 { label: 'Total Pago', val: stats.totalPago, color: 'text-emerald-500' },
                 { label: 'Total Pendente', val: stats.totalPendente, color: 'text-amber-500' },
                 { label: 'Total Atrasado', val: stats.totalAtrasado, color: 'text-rose-500' },
               ].map(r => (
                 <div key={r.label} className="flex items-center justify-between p-3 bg-[#F6F7FB] dark:bg-[#12141C] rounded-[16px]">
                   <span className="text-[13px] font-bold text-[#6B7280]">{r.label}</span>
                   <span className={`text-[15px] font-black ${r.color}`}>
                     {privacyMode ? 'R$ •••••' : formatValue(r.val)}
                   </span>
                 </div>
               ))}
            </div>
          </div>

          {/* TIMELINE */}
          <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 border border-[#ECEFF5] dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <h3 className="text-[15px] font-bold text-[#111827] dark:text-white mb-6">Últimas Atividades</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#ECEFF5] dark:before:via-white/10 before:to-transparent">
              {recentEvents.length > 0 ? recentEvents.map((ev, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white dark:border-[#181B24] bg-[#6D4AFF] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-[16px] border border-[#ECEFF5] dark:border-white/5 bg-[#F6F7FB] dark:bg-[#12141C] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="text-[11px] font-bold text-[#6D4AFF] mb-1">{format(new Date(ev.date), "dd MMM, HH:mm", {locale: ptBR})}</div>
                    <div className="text-[13px] font-bold text-[#111827] dark:text-white">{ev.title}</div>
                    <div className="text-[12px] text-[#6B7280] mt-0.5 truncate">{ev.desc}</div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-[13px] text-[#6B7280] font-bold py-4">Sem atividades recentes</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* KEEP EXISTING MODALS BELOW */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-[24px] font-bold text-[#111827] dark:text-white">
              {editingExpense ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveExpense} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Descrição</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Valor (R$)</Label>
                <Input required type="number" step="0.01" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Vencimento</Label>
                <Input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Categoria</Label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 outline-none">
                  <option value="">Selecione</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Conta / Carteira</Label>
                <select value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})} className="w-full h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-[#6D4AFF] px-4 outline-none">
                  <option value="">Selecione</option>
                  {accounts.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="h-[48px] px-6 rounded-[16px] font-bold text-[14px] text-[#6B7280] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] transition-colors">Cancelar</button>
              <button type="submit" className="h-[48px] px-8 rounded-[16px] bg-[#6D4AFF] text-white font-bold text-[14px] shadow-[0_4px_14px_0_rgba(109,74,255,0.39)] hover:opacity-90 transition-opacity">Salvar Despesa</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pay Modal */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-[24px] font-bold text-[#111827] dark:text-white flex items-center gap-2">
               <CheckCircle className="text-emerald-500" size={24}/> Registrar Pagamento
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Valor Pago (R$)</Label>
              <Input required type="number" step="0.01" value={formData.paidValue} onChange={e => setFormData({...formData, paidValue: e.target.value})} className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-emerald-500 px-4" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Data do Pagamento</Label>
              <Input required type="date" value={formData.paymentDate} onChange={e => setFormData({...formData, paymentDate: e.target.value})} className="h-[48px] rounded-[16px] bg-[#F6F7FB] dark:bg-[#12141C] border-[#ECEFF5] dark:border-white/5 text-[15px] font-bold focus:border-emerald-500 px-4" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsPayModalOpen(false)} className="h-[48px] px-6 rounded-[16px] font-bold text-[14px] text-[#6B7280] hover:bg-[#F6F7FB] dark:hover:bg-[#12141C] transition-colors">Cancelar</button>
              <button type="submit" className="h-[48px] px-8 rounded-[16px] bg-emerald-500 text-white font-bold text-[14px] shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:opacity-90 transition-opacity">Confirmar</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"""

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(logic_code + derived_stats + new_return)

print("Redesign complete.")
