# DESIGN SYSTEM GLOBAL — CONFECÇÃO PRO
## APLICAR EM TODO O SISTEMA

IMPORTANTE
A partir deste momento, toda tela existente e toda nova tela criada deve seguir obrigatoriamente este Design System.
Não criar componentes com estilos diferentes.
Não criar páginas com layouts diferentes.
Todo o sistema deve parecer um único produto premium.

Inspirado em:
• Linear.app
• Stripe Dashboard
• Raycast
• Arc Browser
• Notion
• Apple Human Interface
• Vercel Dashboard

O objetivo é transmitir:
• Tecnologia
• Sofisticação
• Organização
• Alta performance
• Sistema Premium SaaS

Jamais utilizar aparência de sistema administrativo antigo.
Não utilizar excesso de informações.
Sempre priorizar espaço em branco.
Minimalismo.

======================================================
IDENTIDADE DA MARCA
======================================================
Cor principal: #6D4AFF
Cor hover: #5B3DF5
Cor secundária: #9B8CFF
Cor clara: #EEEAFE

A única cor de destaque do sistema será o Roxo.
Não utilizar: Azul, Verde, Vermelho, Laranja, Amarelo.
Quando necessário indicar sucesso, erro ou aviso, utilizar apenas: intensidade do roxo, opacidade, badge, borda, ícones. Nunca utilizar cards coloridos.

======================================================
ESTILO VISUAL
======================================================
Visual Premium. Minimalista. Muito espaço em branco. Interface limpa. Poucos elementos. Layouts respirando. Nada poluído. Nada carregado.

======================================================
GRID
======================================================
Desktop: 12 colunas, Espaçamento 32px
Tablet: 6 colunas
Mobile: 1 coluna

======================================================
HEADER
======================================================
Todas as telas terão: Título, Subtítulo, Filtros quando necessário, Botão principal, Avatar, Notificações, Alternador de tema, Ocultar valores, Pesquisar. (Utilize o componente PageHeader).

======================================================
SIDEBAR
======================================================
Sidebar fixa.
Largura: 84px fechada, 280px aberta.
Quando fechada: Mostrar apenas ícones. Ao passar mouse: Expandir suavemente.
Ao clicar: Abrir submenu somente daquele departamento (Accordion). Nunca expandir todos os departamentos.

======================================================
CARDS
======================================================
Todos os cards devem possuir a classe Tailwind `premium-card`.
Radius: 28px (2xl).
Padding: 24~32px.
Border: 1px.
Hover: Levantar 3px, Aumentar sombra, Transição 250ms.

======================================================
KPIs
======================================================
Todos os indicadores devem seguir o mesmo padrão: Ícone -> Título pequeno -> Valor grande -> Descrição pequena.
Valores devem ter muito destaque visual.

======================================================
TIPOGRAFIA
======================================================
Utilizar Inter.
Título principal: 36 Bold
Título seção: 28 Semibold
Card título: 16 Semibold
Valor KPI: 38 Bold
Texto: 14 Medium
Descrição: 13 Regular
Jamais utilizar fontes diferentes.

======================================================
BOTÕES
======================================================
Botão Primário: Roxo sólido, Texto branco, Radius 16, Hover: Escurecer roxo, Leve brilho. (Use class `premium-btn-primary`)

======================================================
INPUTS
======================================================
Radius: 16px.
Border discreta, Placeholder cinza.
Focus: Border Roxa, Glow Roxo. (Use class `premium-input`)

======================================================
TABELAS
======================================================
Não utilizar aparência tradicional.
Cada linha deve parecer um card fino.
Hover: Background Roxo Claro (Tema escuro: Hover cinza escuro).
Cabeçalho discreto.

======================================================
GRÁFICOS
======================================================
Recharts. Cores: Roxo, Roxo claro, Cinza. Nunca utilizar gráficos coloridos. Tooltip personalizado. Animação.

======================================================
ÍCONES
======================================================
Lucide React. Mesmo tamanho. Mesmo peso. Mesmo estilo. Cor: Roxo. Hover: Pequena animação.

======================================================
REGRAS GERAIS
======================================================
Nunca repetir informações.
Sempre utilizar: Muito espaço em branco, Poucos elementos, Hierarquia visual, Cards grandes, Tipografia elegante, Ícones consistentes.
