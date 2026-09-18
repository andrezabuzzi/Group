const fs = require('fs');
const code = fs.readFileSync('src/views/Relatorios.tsx', 'utf8');
console.log(code.substring(7600, 7700));
