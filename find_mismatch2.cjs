const fs = require('fs');

const html = fs.readFileSync('src/views/Financeiro/DespesasFixas.tsx', 'utf8');

const tags = [];
const selfClosing = ['input', 'Input', 'img', 'br', 'hr', 'path', 'circle', 'line', 'rect', 'CheckCircle', 'Edit2', 'Trash2', 'Eye', 'EyeOff', 'Plus', 'Filter', 'ChevronDown', 'MoreVertical', 'Copy', 'DropdownMenuSeparator', 'Cell', 'RechartsTooltip', 'Legend', 'XAxis', 'YAxis', 'CartesianGrid', 'Line'];

const regex = /<\/?([a-zA-Z0-9]+)([\s\S]*?)?\/?>/g;

let match;
while ((match = regex.exec(html)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1];
    
    // ignore self closing like <input /> or <Icon />
    if (fullMatch.endsWith('/>')) continue;
    if (selfClosing.includes(tagName)) continue;

    if (fullMatch.startsWith('</')) {
        const last = tags.pop();
        if (!last) {
            console.log(`Unmatched closing </${tagName}> at index ${match.index}`);
        } else if (last.name !== tagName) {
            console.log(`Mismatched closing </${tagName}> at index ${match.index}! Expected </${last.name}>.`);
            tags.push(last); // put it back
        }
    } else {
        tags.push({ name: tagName, index: match.index });
    }
}
