const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('src/views/Devolucoes/ControleDevolucoes.tsx', 'utf8');

const sourceFile = ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

if (sourceFile.parseDiagnostics && sourceFile.parseDiagnostics.length > 0) {
    sourceFile.parseDiagnostics.forEach(d => {
        console.log("Error:", d.messageText, "at", d.start);
    });
} else {
    console.log("No syntax errors found by createSourceFile!");
}
