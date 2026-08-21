import os
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

directory = 'src/views'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            for col in collections:
                # Replace exact string matches like 'producoes'
                content = re.sub(r"'{}'".format(col), "'prod_{}'".format(col), content)
                content = re.sub(r'"([^"]*){}"'.format(col), r'"\1prod_{}"'.format(col), content)
                content = re.sub(r"`([^`]*){}/".format(col), r"`\1prod_{}/".format(col), content)
                # some are in templates `tasks/${taskId}/subtasks` -> `prod_tasks/${taskId}/subtasks`

            with open(filepath, 'w') as f:
                f.write(content)

print("Done")
