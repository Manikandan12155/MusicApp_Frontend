import re

with open('src/components/Room.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace common inline colors with CSS variables
replacements = {
    "'#fff'": "'var(--text-primary)'",
    '"#fff"': '"var(--text-primary)"',
    "'#e4e4e7'": "'var(--text-primary)'",
    "'#a1a1aa'": "'var(--text-secondary)'",
    '"#a1a1aa"': '"var(--text-secondary)"',
    "'#a855f7'": "'var(--accent-primary)'",
    "'rgba(255,255,255,0.03)'": "'var(--card-bg)'",
    "'rgba(255,255,255,0.05)'": "'var(--item-hover-bg)'",
    "'rgba(255,255,255,0.1)'": "'var(--pill-border)'",
    "'rgba(168, 85, 247, 0.3)'": "'var(--item-active-bg)'",
    "'rgba(168, 85, 247, 0.2)'": "'var(--item-active-shadow)'",
    "'rgba(168, 85, 247, 0.15)'": "'var(--item-active-bg)'",
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Also fix the button we added that has hardcoded inline colors in the script
content = content.replace("color: '#a1a1aa'", "color: 'var(--text-secondary)'")
content = content.replace("color: '#fff'", "color: 'var(--text-primary)'")

with open('src/components/Room.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
