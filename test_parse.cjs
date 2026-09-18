const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('src/views/Devolucoes/ControleDevolucoes.tsx', 'utf8');
const sourceFile = ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function walk(node) {
    if (node.pos <= 6427 && node.end >= 6427) {
        console.log("Node at 6427:", ts.SyntaxKind[node.kind], "pos:", node.pos, "end:", node.end);
        console.log("Text:", code.substring(node.pos, node.end));
    }
    ts.forEachChild(node, walk);
}
walk(sourceFile);
