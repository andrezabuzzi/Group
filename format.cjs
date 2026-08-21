const fs = require('fs');
let code = fs.readFileSync('src/views/Financeiro/DespesasFixas.tsx', 'utf-8');
const babel = require('@babel/core');
try {
  babel.transformSync(code, {
    presets: ['@babel/preset-typescript', '@babel/preset-react'],
    filename: 'test.tsx'
  });
  console.log('Babel OK');
} catch (e) {
  console.error(e.message);
}
