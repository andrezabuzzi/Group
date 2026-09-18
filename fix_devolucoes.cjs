const fs = require('fs');
let code = fs.readFileSync('src/views/Devolucoes/ControleDevolucoes.tsx', 'utf8');

code = code.replace(
  /\/\*  mm\/yy value: monthsMap\[k\] \}\)\)\.slice\(-6\); \/\*  Custom Purple Palette \*\/ \*\//g,
  "/* mm/yy */ value: monthsMap[k] })).slice(-6); /* Custom Purple Palette */"
);

fs.writeFileSync('src/views/Devolucoes/ControleDevolucoes.tsx', code);
