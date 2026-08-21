const fs = require('fs');

let content = fs.readFileSync('src/views/Performance/Tarefas.tsx', 'utf8');

// Replace first DialogContent
content = content.replace(
  'className="rounded-3xl border-border max-w-4xl max-h-[90vh] overflow-y-auto p-0 flex flex-col hide-scrollbar"',
  'className="rounded-3xl border-border w-[90vw] sm:max-w-[70vw] sm:w-full max-h-[90vh] overflow-y-auto p-0 flex flex-col hide-scrollbar"'
);

// Replace second DialogContent
content = content.replace(
  'className="rounded-3xl border-border max-w-3xl max-h-[90vh] overflow-y-auto p-0 flex flex-col hide-scrollbar"',
  'className="rounded-3xl border-border w-[90vw] sm:max-w-[70vw] sm:w-full max-h-[90vh] overflow-y-auto p-0 flex flex-col hide-scrollbar"'
);

fs.writeFileSync('src/views/Performance/Tarefas.tsx', content, 'utf8');
