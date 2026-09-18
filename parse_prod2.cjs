const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('src/views/Producao.tsx', 'utf8');

let braceCount = 0;
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
    } else if (c === '<' && code.substring(i, i+3) === '/* ') {
       // just checking
    }
  }
}
console.log("Braces mismatch:", braceCount);
