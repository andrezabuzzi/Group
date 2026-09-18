const fs = require('fs');
let code = fs.readFileSync('src/views/Configuracoes.tsx', 'utf8');

const regex = /const wipeSystem = async \(\) => \{[\s\S]*?setIsWiping\(false\);\s*\};\s*};\s*const/g;
const match = regex.exec(code);

if (match) {
  console.log("Found wipeSystem!");
} else {
  console.log("Could not find wipeSystem!");
}

