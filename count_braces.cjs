const fs = require('fs');
const code = fs.readFileSync('src/views/Devolucoes/ControleDevolucoes.tsx', 'utf8');

let braceCount = 0;
let parenCount = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < code.length; i++) {
  const c = code[i];
  if (inString) {
    if (c === stringChar && code[i-1] !== '\\') {
      inString = false;
    }
  } else {
    if (c === '"' || c === "'" || c === '`') {
      inString = true;
      stringChar = c;
    } else if (c === '{') {
      braceCount++;
    } else if (c === '}') {
      braceCount--;
    } else if (c === '(') {
      parenCount++;
    } else if (c === ')') {
      parenCount--;
    }
  }
}
console.log("Braces:", braceCount, "Parens:", parenCount);
