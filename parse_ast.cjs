const fs = require('fs');
const ts = require('typescript');

const code = fs.readFileSync('src/views/Financeiro/DespesasVariaveis.tsx', 'utf8');

const sourceFile = ts.createSourceFile(
    'DespesasVariaveis.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
);

function traverse(node) {
    ts.forEachChild(node, traverse);
}

traverse(sourceFile);
// if syntax error, typescript has parseDiagnostics
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
