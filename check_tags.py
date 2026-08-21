import sys, re
def check_tags(filename):
    with open(filename, 'r') as f:
        content = f.read()

    tags = re.findall(r'<([a-zA-Z0-9]+)[^>]*>', content)
    end_tags = re.findall(r'</([a-zA-Z0-9]+)>', content)

    tag_counts = {}
    for tag in tags:
        if not tag in ['input', 'Input', 'img', 'br', 'hr']:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
            
    for tag in end_tags:
        tag_counts[tag] = tag_counts.get(tag, 0) - 1
        
    for tag, count in tag_counts.items():
        if count != 0:
            print(f"{filename}: Tag <{tag}> is unbalanced by {count}")

check_tags(sys.argv[1])
