const fs = require('fs');

const html = fs.readFileSync('src/views/Financeiro/DespesasFixas.tsx', 'utf8');
const lines = html.split('\n');

const tags = [];
const selfClosing = ['input', 'Input', 'img', 'br', 'hr', 'path', 'circle', 'line', 'rect', 'CheckCircle', 'Edit2', 'Trash2', 'Eye', 'EyeOff', 'Plus', 'Filter', 'ChevronDown', 'MoreVertical', 'Copy', 'DropdownMenuSeparator', 'Cell', 'RechartsTooltip', 'Legend', 'XAxis', 'YAxis', 'CartesianGrid', 'Line'];

const regex = /<\/?([a-zA-Z0-9]+)(\s+[^>]*)?\/?>/g;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    while ((match = regex.exec(line)) !== null) {
        const fullMatch = match[0];
        const tagName = match[1];
        
        // ignore self closing like <input /> or <Icon />
        if (fullMatch.endsWith('/>')) continue;
        if (selfClosing.includes(tagName)) continue;

        if (fullMatch.startsWith('</')) {
            const last = tags.pop();
            if (!last) {
                console.log(`Unmatched closing </${tagName}> at line ${i+1}`);
            } else if (last.name !== tagName) {
                console.log(`Mismatched closing </${tagName}> at line ${i+1}! Expected </${last.name}>. Last opened at line ${last.line}`);
                tags.push(last); // put it back to not cascade too much
            }
        } else {
            tags.push({ name: tagName, line: i+1 });
        }
    }
}
