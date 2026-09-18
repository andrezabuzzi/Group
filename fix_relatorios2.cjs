const fs = require('fs');
let code = fs.readFileSync('src/views/Relatorios.tsx', 'utf8');

// I'll just find the exact index!
const index = code.indexOf(' based on vendas */ if any');
if (index !== -1) {
    code = code.replace(' based on vendas */ if any', ' based on vendas if any */');
    fs.writeFileSync('src/views/Relatorios.tsx', code);
    console.log("Fixed!");
} else {
    console.log("Not found!");
}
