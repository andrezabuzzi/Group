const fs = require('fs');
const ts = require('typescript');

const code = fs.readFileSync('src/views/Financeiro/DespesasFixas.tsx', 'utf8');

const sourceFile = ts.createSourceFile(
    'DespesasFixas.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
);

const diagnostics = sourceFile.parseDiagnostics;
if (diagnostics.length > 0) {
    for (const diag of diagnostics) {
        const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
        const pos = sourceFile.getLineAndCharacterOfPosition(diag.start);
        console.log(`Error at line ${pos.line + 1}, char ${pos.character + 1}: ${message}`);
    }
} else {
    console.log("No syntax errors found by AST parser.");
}
