const fs = require('fs');
let code = fs.readFileSync('src/views/Relatorios.tsx', 'utf8');

code = code.replace(
  /\/\*  Lucro exato como preenchido no produto R\$ \* qtd produzida lucroProduto = lucroReaisRef \* qtd; \} agrupado\[prodName\]\.qtd \+= qtd; agrupado\[prodName\]\.custo \+= custoReal; agrupado\[prodName\]\.lucro \+= lucroProduto; agrupado\[prodName\]\.vendas \+= vendasProduto; \}\); \*\//g,
  "/* Lucro exato como preenchido no produto R$ * qtd produzida */ lucroProduto = lucroReaisRef * qtd; } agrupado[prodName].qtd += qtd; agrupado[prodName].custo += custoReal; agrupado[prodName].lucro += lucroProduto; agrupado[prodName].vendas += vendasProduto; });"
);

fs.writeFileSync('src/views/Relatorios.tsx', code);
