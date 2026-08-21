with open('server.ts', 'r') as f:
    content = f.read()

old_text = "Analyze this garment marker (risco) image from Audaces or similar software. Extract the total marker length (comprimento do risco) in cm, marker width (largura) in cm, and the total number of complete pieces (peças completas). Look carefully at the info panel at the bottom, which lists 'Comprimento: <number> cm' and 'Largura: <number> cm'. For the number of pieces, check the filename or title bar at the top (e.g., if it says '- 3 - LARG', the pieces count is 3) or infer the total complete pieces from the image context. Return JSON with 'length', 'width' and 'pieces'. Return only the numeric parts as strings (e.g., '561.56', '144', '3')."

new_text = "Analyze this Audaces marker (risco) image. Extract these 3 exact values: 1) 'length' (Comprimento do risco): look for the text 'Comprimento: X cm' at the very bottom left status bar. Extract just the number X. 2) 'width' (Largura do risco): look for the text 'Largura: Y cm' right below Comprimento at the very bottom left. Extract just the number Y. 3) 'pieces' (Peças completas/Quantidade): Look at the title bar at the top right (e.g. '... - 3 - LARG 144...'). The number between dashes before LARG is the quantity of pieces (in this case 3). Return JSON with 'length', 'width' and 'pieces'. Return only the numeric strings (e.g., '561.56', '144', '3')."

content = content.replace(old_text, new_text)

with open('server.ts', 'w') as f:
    f.write(content)
print("Prompt fixed")
