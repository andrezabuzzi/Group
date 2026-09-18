const fs = require('fs');
let code = fs.readFileSync('src/views/Relatorios.tsx', 'utf8');
code = code.replace("/* based on vendas */ if any", "/* based on vendas if any */");
fs.writeFileSync('src/views/Relatorios.tsx', code);
