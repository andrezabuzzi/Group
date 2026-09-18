const fs = require('fs');
let code = fs.readFileSync('src/views/Producao.tsx', 'utf8');
code = code.replace(
    '/*  1. INFORMAÇÕES DO PRODUTO',
    '/* 1. INFORMAÇÕES DO PRODUTO */'
);
fs.writeFileSync('src/views/Producao.tsx', code);
