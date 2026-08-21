import re

collections = [
    'producoes',
    'produtos',
    'compras',
    'costureiras',
    'fixed_expenses',
    'variable_expenses',
    'accounts_payable',
    'credit_cards',
    'tasks',
    'companies',
    'sales_channels',
    'sales_goals',
    'market_analysis',
    'marketplace_calculations',
    'garment_calculations',
    'returns'
]

with open('firestore.rules', 'r') as f:
    content = f.read()

for col in collections:
    content = content.replace(f'match /{col}/', f'match /prod_{col}/')
    content = content.replace(f'/documents/{col}/', f'/documents/prod_{col}/')
    content = content.replace(f'match /{col}', f'match /prod_{col}') # just in case

with open('firestore.rules', 'w') as f:
    f.write(content)

print("Done")
