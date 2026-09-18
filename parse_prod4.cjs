const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('src/views/Producao.tsx', 'utf8');

const sourceFile = ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

if (sourceFile.parseDiagnostics && sourceFile.parseDiagnostics.length > 0) {
    sourceFile.parseDiagnostics.forEach(d => {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(d.start);
        console.log(`Error: ${d.messageText} at line ${line + 1}, character ${character + 1}`);
    });
}
