const fs = require('fs');
let code = fs.readFileSync('src/views/Producao.tsx', 'utf8');
code = code.replace(
    '/*  slate-900 defaultDoc.setFont("helvetica", "bold"); defaultDoc.text(title.toUpperCase(), 16, yPos); }; */',
    '/* slate-900 */ defaultDoc.setFont("helvetica", "bold"); defaultDoc.text(title.toUpperCase(), 16, yPos); };'
);
fs.writeFileSync('src/views/Producao.tsx', code);
