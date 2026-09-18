const fs = require('fs');
let code = fs.readFileSync('src/views/Producao.tsx', 'utf8');

code = code.replace(
    '/*  Header defaultDoc.setFillColor(248, 250, 252); defaultDoc.setDrawColor(226, 232, 240); defaultDoc.roundedRect(14, 15, 182, 45, 3, 3, \'FD\'); defaultDoc.setFontSize(20); defaultDoc.setTextColor(30, 41, 59); defaultDoc.setFont("helvetica", "bold"); defaultDoc.text("RECIBO DE COSTURA", 20, 28); defaultDoc.setFontSize(10); defaultDoc.setFont("helvetica", "normal"); defaultDoc.setTextColor(100, 116, 139); defaultDoc.text(`Emissão: ${new Date().toLocaleDateString(\'pt-BR\')} | ID: ${prod.id.slice(0, 8).toUpperCase()}`, 20, 36); */',
    '/* Header */'
);

fs.writeFileSync('src/views/Producao.tsx', code);
