import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Find the Build Status block
status_pattern = r'(\s*<!-- Platform Pills \(Build Status Dashboard\) -->\s*<p class=\"section-micro-label\">Build Status</p>\s*<div class=\"platforms\" id=\"gravitysend-platforms\">.*?</span>\s*</div>)'
match = re.search(status_pattern, html, flags=re.DOTALL)
if match:
    build_status_block = match.group(1)
    # Remove from original location
    html = html.replace(build_status_block, '')
    
    # Modify block for gravitorrent
    build_status_block = build_status_block.replace('gravitysend-platforms', 'gravitorrent-platforms')
    build_status_block = re.sub(r' data-workflow=\"[^\"]+\"', '', build_status_block)

    # Move to gravitorrent section before download buttons
    insert_pattern = r'(\s*<!-- Dynamic Download Buttons -->)'
    html = re.sub(insert_pattern, build_status_block + r'\n\1', html, count=1)
    print('Successfully moved and modified build status block.')
else:
    print('Could not find build status block.')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
