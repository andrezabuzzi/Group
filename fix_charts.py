import re

content = ""
with open('src/views/Financeiro/ContasAPagar.tsx', 'r') as f:
    content = f.read()

# Add new charts states
derived_calcs = """  const areaChartData = useMemo(() => {
      const data: Record<string, number> = {};
      installments.forEach(inst => {
          if (inst.status === 'pago' || inst.status === 'cancelado') return;
          const month = format(parseISO(inst.dueDate), 'MMM/yy', { locale: ptBR });
          data[month] = (data[month] || 0) + Number(inst.value || 0);
      });
      return Object.entries(data).slice(0, 6).map(([name, value]) => ({ name, value }));
  }, [installments]);

  const lineChartData = useMemo(() => {
      const data: Record<string, number> = {};
      const today = new Date();
      for(let i=0; i<14; i++) {
          data[format(addDays(today, i), 'dd/MM')] = 0;
      }
      installments.forEach(inst => {
          if (inst.status === 'pago' || inst.status === 'cancelado') return;
          const day = format(parseISO(inst.dueDate), 'dd/MM');
          if (data[day] !== undefined) {
              data[day] += Number(inst.value || 0);
          }
      });
      return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [installments]);

  const barChartData = useMemo(() => {
      const data: Record<string, number> = {};
      installments.forEach(inst => {
          if (inst.status === 'pago' || inst.status === 'cancelado') return;
          const month = format(parseISO(inst.dueDate), 'MMM/yy', { locale: ptBR });
          data[month] = (data[month] || 0) + 1;
      });
      return Object.entries(data).slice(0, 6).map(([name, count]) => ({ name, count }));
  }, [installments]);

  const donutChartData = useMemo(() => {
      return Object.entries(stats.categoryTotals)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
  }, [stats.categoryTotals]);

  const radialChartData = useMemo(() => {
      const totalMes = stats.totalMes;
      const comprometimento = Math.min(Math.round((totalMes / (totalMes + 10000)) * 100), 100);
      return [{ name: 'Comprometido', value: comprometimento, fill: '#6D4AFF' }];
  }, [stats.totalMes]);"""

content = re.sub(
    r"  const areaChartData = useMemo\(\(\) => \{.*\}, \[stats\.categoryTotals\]\);",
    derived_calcs,
    content,
    flags=re.DOTALL
)

charts_html = """           {/* GRÁFICOS */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#ECEFF5] dark:border-white/5 lg:col-span-2">
                 <h3 className="text-[14px] font-[700] text-[#111827] dark:text-white mb-4 uppercase tracking-wider text-[#6B7280]">Fluxo Financeiro Futuro</h3>
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={areaChartData}>
                          <defs>
                             <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#6D4AFF" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#6D4AFF" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#6B7280', fontWeight: 600}} dy={10}/>
                          <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} formatter={(val:number)=>formatCurrency(val,privacyMode)}/>
                          <Area type="monotone" dataKey="value" stroke="#6D4AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorArea)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              
              <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#ECEFF5] dark:border-white/5">
                 <h3 className="text-[14px] font-[700] text-[#111827] dark:text-white mb-4 uppercase tracking-wider text-[#6B7280]">Por Categoria</h3>
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={donutChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                             {donutChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} formatter={(val:number)=>formatCurrency(val,privacyMode)}/>
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              
              <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#ECEFF5] dark:border-white/5">
                 <h3 className="text-[14px] font-[700] text-[#111827] dark:text-white mb-4 uppercase tracking-wider text-[#6B7280]">Previsão (Dias)</h3>
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={lineChartData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} dy={10}/>
                          <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} formatter={(val:number)=>formatCurrency(val,privacyMode)}/>
                          <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} dot={{r:3, fill: '#8B5CF6'}} />
                       </LineChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              
              <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#ECEFF5] dark:border-white/5">
                 <h3 className="text-[14px] font-[700] text-[#111827] dark:text-white mb-4 uppercase tracking-wider text-[#6B7280]">Parcelas/Mês</h3>
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={barChartData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#6B7280', fontWeight: 600}} dy={10}/>
                          <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                          <Bar dataKey="count" fill="#A855F7" radius={[6,6,0,0]} barSize={30}/>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              
              <div className="bg-white dark:bg-[#181B24] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#ECEFF5] dark:border-white/5 flex flex-col justify-between relative overflow-hidden">
                 <h3 className="text-[14px] font-[700] text-[#111827] dark:text-white mb-4 uppercase tracking-wider text-[#6B7280]">Comprometimento</h3>
                 <div className="h-[200px] w-full absolute top-[40px] left-0">
                    <ResponsiveContainer width="100%" height="100%">
                       <RadialBarChart innerRadius="70%" outerRadius="100%" data={radialChartData} startAngle={180} endAngle={0}>
                          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'rgba(109,74,255,0.1)' }} />
                       </RadialBarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="mt-auto text-center z-10 pt-[60px]">
                    <div className="text-[32px] font-[800] text-[#111827] dark:text-white leading-none">{radialChartData[0]?.value || 0}%</div>
                    <div className="text-[13px] font-[600] text-[#6B7280]">Do orçamento mensal</div>
                 </div>
              </div>
           </div>"""

content = re.sub(
    r"           \{\/\* GRÁFICOS \*\/\}[\s\n]*<div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">.*?<\/div>[\s\n]*<\/div>",
    charts_html,
    content,
    flags=re.DOTALL
)

with open('src/views/Financeiro/ContasAPagar.tsx', 'w') as f:
    f.write(content)
