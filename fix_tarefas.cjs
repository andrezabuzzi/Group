const fs = require('fs');
let content = fs.readFileSync('src/views/Performance/Tarefas.tsx', 'utf8');

const newRenderKanbanCol = `  const renderKanbanCol = (statusKey: TaskStatus, config: any) => {
    const colTasks = filteredTasks.filter(t => t.status === statusKey).sort((a,b) => {
      const priorities = { urgente: 4, alta: 3, media: 2, baixa: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });

    const isDraggingOver = draggedTask && colTasks.every(t => t.id !== draggedTask);

    return (
      <div 
        key={statusKey}
        onDragOver={(e) => handleDragOver(e, statusKey)}
        onDrop={(e) => handleDrop(e, statusKey)}
        className={cn(
          "flex flex-col min-w-0 flex-1 bg-card rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/40 transition-all duration-300",
          isDraggingOver ? "ring-2 ring-primary/50 shadow-primary/10 scale-[1.01]" : ""
        )}
      >
        <div className="flex flex-col border-b-2 border-primary/20 pb-4 mb-4">
          <div className="flex items-center justify-between mb-1">
             <div className="flex items-center gap-2">
                <config.icon className="w-5 h-5 text-foreground" />
                <h3 className="font-black text-foreground text-sm uppercase tracking-wider">{config.label}</h3>
             </div>
             <div className="flex items-center gap-1">
               <button onClick={handleOpenNewTask} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
                 <Plus className="w-4 h-4" />
               </button>
               <button className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
                 <MoreVertical className="w-4 h-4" />
               </button>
             </div>
          </div>
          <span className="text-xs font-bold text-muted-foreground">{colTasks.length} {colTasks.length === 1 ? 'tarefa' : 'tarefas'}</span>
        </div>

        <div className="flex flex-col gap-4 flex-1 overflow-y-auto hide-scrollbar pb-10">
          {colTasks.map(task => {
            const dueDateObj = task.dueDate ? parseISO(task.dueDate) : null;
            const isLate = dueDateObj ? isPast(dueDateObj) && !isToday(dueDateObj) && task.status !== 'concluido' : false;
            let daysRemainingText = '';
            if (dueDateObj) {
               if (isToday(dueDateObj)) daysRemainingText = 'Vence hoje';
               else if (isLate) daysRemainingText = 'Atrasada';
               else {
                 const diff = Math.ceil((dueDateObj.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                 daysRemainingText = \`\${diff} dias restantes\`;
               }
            }

            return (
              <div 
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onClick={() => { setSelectedTask(task); loadSubtasks(task.id); setIsDetailModalOpen(true); }}
                className="cursor-grab active:cursor-grabbing bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(109,74,255,0.12)] border border-border/40 hover:border-primary/30 transition-all duration-300 p-5 rounded-[20px] flex flex-col gap-4 group relative hover:-translate-y-1 active:scale-95"
              >
                {/* Header: Priority and Labels */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-muted/50 text-foreground border border-border/50 flex items-center gap-1">
                    {task.priority === 'urgente' ? '🔥 ' : ''}{PRIORITY_CONFIG[task.priority].label}
                  </span>
                  {task.labels?.slice(0,2).map(l => (
                    <span key={l} className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground border border-border/50 truncate max-w-[100px]">
                      {l}
                    </span>
                  ))}
                  {(task.labels?.length || 0) > 2 && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground border border-border/50">
                      +{task.labels.length - 2}
                    </span>
                  )}
                </div>
                
                {/* Title */}
                <h4 className="font-black text-base leading-tight text-foreground">{task.title}</h4>
                
                {/* Company and Channel */}
                {(task.companyName || task.salesChannel) && (
                  <div className="flex flex-col gap-1.5 py-3 border-y border-border/40">
                    {task.companyName && (
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                        <span className="text-[10px] uppercase tracking-wider">Empresa</span>
                        <span className="text-foreground">{task.companyName}</span>
                      </div>
                    )}
                    {task.salesChannel && (
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                        <span className="text-[10px] uppercase tracking-wider">Canal</span>
                        <span className="text-foreground">{task.salesChannel}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Responsible */}
                <div className="flex items-center justify-between group/resp cursor-help">
                   <div className="flex items-center gap-2">
                     <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs shrink-0">
                       {(task.responsible?.[0] || 'U').toUpperCase()}
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Responsável</span>
                        <span className="text-xs font-bold text-foreground truncate max-w-[100px]">{task.responsible || 'Sem resp.'}</span>
                     </div>
                   </div>
                </div>

                {/* Dates */}
                {dueDateObj && (
                  <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded-xl border border-border/50">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(dueDateObj, 'dd MMM')}</span>
                    </div>
                    <div className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md", isLate ? "bg-red-50 text-red-600" : isToday(dueDateObj) ? "bg-orange-50 text-orange-600" : "bg-muted text-muted-foreground")}>
                      {daysRemainingText}
                    </div>
                  </div>
                )}

                {/* Checklist / Progress */}
                {(task.progress > 0) && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <span>Checklist</span>
                      <span>{Math.round(task.progress)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: \`\${task.progress}%\` }}></div>
                    </div>
                  </div>
                )}
                
                {/* Footer Metrics */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <div className="flex gap-3 text-muted-foreground items-center">
                    {(task.commentsCount > 0) && (
                      <div className="flex items-center gap-1 text-[11px] font-bold" title="Comentários">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{task.commentsCount}</span>
                      </div>
                    )}
                    {(task.attachments && task.attachments.length > 0) && (
                      <div className="flex items-center gap-1 text-[11px] font-bold" title="Anexos">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{task.attachments.length}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-muted/50 text-muted-foreground border border-border/50">
                      {STATUS_CONFIG[task.status].label}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<button className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all" />} onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl bg-background border-border shadow-lg p-2 font-medium z-50">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedTask(task); loadSubtasks(task.id); setIsDetailModalOpen(true); }} className="rounded-lg cursor-pointer hover:bg-muted py-2 px-3 text-xs font-bold">
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEditTask(task); }} className="rounded-lg cursor-pointer hover:bg-muted py-2 px-3 text-xs font-bold">
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }} className="rounded-lg cursor-pointer hover:bg-muted py-2 px-3 text-xs font-bold">
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border my-1" />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }} className="rounded-lg cursor-pointer hover:bg-red-500/10 py-2 px-3 text-xs font-bold text-red-500 hover:text-red-600">
                            Excluir
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
          {colTasks.length === 0 && (
            <div className="h-32 border-2 border-dashed border-border/40 rounded-[20px] flex items-center justify-center bg-muted/10">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Solte tarefas aqui</span>
            </div>
          )}
        </div>
      </div>
    );
  };`;

const renderKanbanColRegex = /const renderKanbanCol = \(\w+: TaskStatus, \w+: any\) => \{[\s\S]*?^\s*\};\n\s*const renderListView/m;
content = content.replace(renderKanbanColRegex, newRenderKanbanCol + '\n\n  const renderListView');

fs.writeFileSync('src/views/Performance/Tarefas.tsx', content, 'utf8');
