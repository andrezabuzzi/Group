const fs = require('fs');
let code = fs.readFileSync('src/views/Producao.tsx', 'utf8');

// There's a problem around 48750. 
// "/* Menu Moderno */" and other comments are breaking the JSX if they are embedded incorrectly.
// Let's replace ALL '/* ... */' inside JSX with '{/* ... */}' where it isn't already inside {}.
// Actually, it's easier to just remove all these aesthetic comments from the JSX part.

const commentsToRemove = [
    "/* Linha Superior: Imagem, Nome, SKU, Lote, Menu */",
    "/* Imagem */",
    "/* Menu Moderno */",
    "/* Linha 2: Badges (Responsável, Data, etc) */",
    "/* Linha 3: Barra de Progresso Sozinha */",
    "/* Barra de Progresso Animada */",
    "/* Grade */",
    "/* Linha 4: Financeiro Separado e Organizado */",
    "/* Linha 5: Botões */",
    "/* Histórico de Entregas */",
    "/* Histórico de Pagamentos */",
    "/* Modelagem */",
    "/* Risco */",
    "/* Corte */",
    "/* Costura */"
];

commentsToRemove.forEach(c => {
    code = code.split(c).join('');
});

fs.writeFileSync('src/views/Producao.tsx', code);
