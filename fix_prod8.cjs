const fs = require('fs');
let code = fs.readFileSync('src/views/Producao.tsx', 'utf8');

code = code.replace(
    '/*  Info Blocks defaultDoc.setFontSize(11); defaultDoc.setTextColor(30, 41, 59); defaultDoc.setFont("helvetica", "bold"); defaultDoc.text("Detalhes Gerais Principais", 14, 75); defaultDoc.setFont("helvetica", "normal"); defaultDoc.setFontSize(10); defaultDoc.text(`Produto: ${prod.produtoNome || \'N/A\'}`, 14, 83); defaultDoc.text(`Costureiro(a): ${prod.costureiraNome || \'N/A\'}`, 14, 89); defaultDoc.text(`Prazo Final (Previsto): ${prod.dataPrevistaEntrega ? new Date(prod.dataPrevistaEntrega).toLocaleDateString(\'pt-BR\') : \'N/A\'}`, 14, 95); */',
    '/* Info Blocks */'
);

fs.writeFileSync('src/views/Producao.tsx', code);
