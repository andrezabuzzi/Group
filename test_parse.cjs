const fs = require('fs');
const code = fs.readFileSync('src/views/Financeiro/DespesasVariaveis.tsx', 'utf8');

let stack = [];
for (let i = 0; i < code.length; i++) {
  const c = code[i];
  if (c === '{' || c === '(' || c === '[') {
    stack.push({ char: c, pos: i });
  } else if (c === '}' || c === ')' || c === ']') {
    const last = stack.pop();
    if (!last) {
      console.log(`Unmatched closing ${c} at pos ${i}`);
    } else {
      let expected = '';
      if (last.char === '{') expected = '}';
      if (last.char === '(') expected = ')';
      if (last.char === '[') expected = ']';
      if (expected !== c) {
        console.log(`Mismatched closing ${c} at pos ${i}, expected ${expected} to match ${last.char} at pos ${last.pos}`);
        const snippet = code.substring(Math.max(0, i-50), Math.min(code.length, i+50));
        console.log(`Snippet: ${snippet}`);
        break;
      }
    }
  }
}
if (stack.length > 0) {
    console.log("Unclosed brackets:");
    for (const item of stack) {
        console.log(`Bracket ${item.char} at pos ${item.pos}`);
        const snippet = code.substring(Math.max(0, item.pos-30), Math.min(code.length, item.pos+30));
        console.log(`Snippet: ${snippet}`);
    }
}
