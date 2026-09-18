const fs = require('fs');
let code = fs.readFileSync('src/views/Producao.tsx', 'utf8');
code = code.replace(
    '/*  2. EQUIPE TÉCNICA E PARCEIROS',
    '/* 2. EQUIPE TÉCNICA E PARCEIROS */'
);
code = code.replace(
    '/*  3. ESTRUTURA DE CUSTOS (TABELA)',
    '/* 3. ESTRUTURA DE CUSTOS (TABELA) */'
);
fs.writeFileSync('src/views/Producao.tsx', code);
