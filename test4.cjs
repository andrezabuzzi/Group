const fs = require('fs');
const code = fs.readFileSync('src/views/Relatorios.tsx', 'utf8');
const endPos = 12675;
const startPos = Math.max(0, endPos - 500);
console.log(code.substring(startPos, endPos + 50));
