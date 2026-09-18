const fs = require('fs');
let code = fs.readFileSync('src/views/Producao.tsx', 'utf8');

const str1 = "/*  yellow-200 autoTable(docAny, { ...tableStyles, headStyles: { fillColor: [234, 179, 8] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as */ const }";
const str2 = "/* yellow-200 */ autoTable(docAny, { ...tableStyles, headStyles: { fillColor: [234, 179, 8] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const }";

code = code.replace(str1, str2);
fs.writeFileSync('src/views/Producao.tsx', code);
console.log("Fixed!");
