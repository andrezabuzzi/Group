const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('src/views/Devolucoes/ControleDevolucoes.tsx', 'utf8');

const sourceFile = ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

console.log("Parse tree end:", sourceFile.end);
