import re

with open('src/themes.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Remove the linear-gradient part from --bg-image strings
css = re.sub(r'linear-gradient\(rgba\([^)]+\),\s*rgba\([^)]+\)\),\s*(url\([^\)]+\))', r'\1', css)

with open('src/themes.css', 'w', encoding='utf-8') as f:
    f.write(css)
