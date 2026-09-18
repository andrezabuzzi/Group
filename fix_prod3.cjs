const fs = require('fs');
let code = fs.readFileSync('src/views/Producao.tsx', 'utf8');
code = code.replace("/*  green-100 autoTable(docAny, {", "/* green-100 */ autoTable(docAny, {");
fs.writeFileSync('src/views/Producao.tsx', code);
