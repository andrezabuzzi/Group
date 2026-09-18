const fs = require('fs');
let code = fs.readFileSync('src/views/Producao.tsx', 'utf8');
const searchString = '/*  slate-300 defaultDoc.text(`Emissão: ${new Date().toLocaleDateString(\'pt-BR\')}`, 14, 28); defaultDoc.text(`Prioridade: ${prod.etiquetas?.[0]?.toUpperCase() || \'NORMAL\'} | Status: ${prod.statusEntrega || \'Pendente\'}`, 14, 34); */ */ */';
const replaceString = '/* slate-300 */ defaultDoc.text(`Emissão: ${new Date().toLocaleDateString(\'pt-BR\')}`, 14, 28); defaultDoc.text(`Prioridade: ${prod.etiquetas?.[0]?.toUpperCase() || \'NORMAL\'} | Status: ${prod.statusEntrega || \'Pendente\'}`, 14, 34);';
code = code.replace(searchString, replaceString);
fs.writeFileSync('src/views/Producao.tsx', code);
