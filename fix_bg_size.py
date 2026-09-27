import re

# Fix index.css
with open('src/index.css', 'r', encoding='utf-8') as f:
    idx = f.read()

if '--bg-size' not in idx:
    idx = idx.replace('--bg-image:', '--bg-size: cover;\n  --bg-image:')
    idx = idx.replace('background-size: cover;', 'background-size: var(--bg-size, cover);')
    with open('src/index.css', 'w', encoding='utf-8') as f:
        f.write(idx)

# Fix themes.css
with open('src/themes.css', 'r', encoding='utf-8') as f:
    thm = f.read()

thm = re.sub(
    r'(\[data-theme="brutalist"\] {\s*--bg-color: #ffffff;\s*--bg-image: radial-gradient\(#000000 2px, transparent 2px\);)\s*background-size: 20px 20px;',
    r'[data-theme="brutalist"] {\n  --bg-size: 20px 20px;\n  --bg-color: #ffffff;\n  --bg-image: radial-gradient(#000000 2px, transparent 2px);',
    thm
)

thm = re.sub(
    r'(\[data-theme="cyberpunk"\] {\s*--bg-color: #050505;\s*--bg-image: linear-gradient\(rgba\(0, 255, 255, 0\.1\) 1px, transparent 1px\), linear-gradient\(90deg, rgba\(255, 0, 85, 0\.1\) 1px, transparent 1px\);)\s*background-size: 30px 30px;',
    r'[data-theme="cyberpunk"] {\n  --bg-size: 30px 30px;\n  --bg-color: #050505;\n  --bg-image: linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 85, 0.1) 1px, transparent 1px);',
    thm
)

with open('src/themes.css', 'w', encoding='utf-8') as f:
    f.write(thm)
