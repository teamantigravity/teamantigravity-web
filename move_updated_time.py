import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Find the Build Updated time block
updated_pattern = r'(\s*<p class=\"build-updated\" id=\"build-updated-time\" aria-live=\"polite\"></p>)'
match = re.search(updated_pattern, html, flags=re.DOTALL)
if match:
    updated_block = match.group(1)
    # Remove from original location
    html = html.replace(updated_block, '')
    
    # Move to gravitorrent section after platforms, before download buttons
    insert_pattern = r'(</div>\s*<!-- Dynamic Download Buttons -->)'
    html = re.sub(insert_pattern, updated_block + r'\n                    \1', html, count=1)
    print('Successfully moved updated time block.')
else:
    print('Could not find updated time block.')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
