const fs = require('fs');
let code = fs.readFileSync('src/views/Producao.tsx', 'utf8');

code = code.replace(
    '/*  Header styling defaultDoc.setFillColor(30, 41, 59); /*  slate-800 defaultDoc.rect(0, 0, pageWidth, 40, \'F\'); defaultDoc.setFontSize(22); defaultDoc.setTextColor(255, 255, 255); defaultDoc.setFont("helvetica", "bold"); defaultDoc.text(`Ficha de Produção: ${prod.id.slice(0, 8).toUpperCase()}`, 14, 20); defaultDoc.setFontSize(10); defaultDoc.setFont("helvetica", "normal"); defaultDoc.setTextColor(203, 213, 225); /* slate-300 */',
    '/* Header styling slate-800 slate-300 */'
);

fs.writeFileSync('src/views/Producao.tsx', code);
