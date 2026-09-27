import re

with open('src/themes.css', 'r', encoding='utf-8') as f:
    css = f.read()

updates = {
    'neumorphism': {
        '--bg-image': "linear-gradient(rgba(224,229,236,0.7), rgba(224,229,236,0.9)), url('/bg_neumorphism.jpg')"
    },
    'claymorphism': {
        '--bg-image': "linear-gradient(rgba(248,249,250,0.6), rgba(248,249,250,0.8)), url('/bg_claymorphism.jpg')"
    },
    'skeuomorphism': {
        '--bg-image': "linear-gradient(rgba(43,43,43,0.7), rgba(43,43,43,0.9)), url('/bg_skeuomorphism.jpg')"
    },
    'aurora': {
        '--bg-image': "linear-gradient(rgba(11,15,25,0.4), rgba(11,15,25,0.7)), url('/bg_aurora.jpg')"
    },
    'liquid-glass': {
        '--bg-image': "linear-gradient(rgba(142,197,252,0.4), rgba(224,195,252,0.4)), url('/bg_liquid_glass.jpg')"
    },
    'metallic': {
        '--bg-image': "linear-gradient(rgba(26,26,26,0.6), rgba(26,26,26,0.9)), url('/bg_metallic.jpg')"
    },
    'cyberpunk': {
        '--bg-image': "linear-gradient(rgba(15,15,19,0.7), rgba(15,15,19,0.9)), url('/bg_cyberpunk.jpg')"
    },
    'brutalist': {
        '--bg-image': "linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.8)), url('/bg_brutalist.jpg')"
    },
    'y2k': {
        '--bg-image': "linear-gradient(rgba(255,0,255,0.4), rgba(0,255,255,0.4)), url('/bg_y2k.jpg')"
    }
}

for theme, values in updates.items():
    css = re.sub(
        rf'(\[data-theme="{theme}"\]\s*{{[^}}]*?--bg-image:\s*)(.*?)(;)',
        rf'\g<1>{values["--bg-image"]}\g<3>',
        css,
        flags=re.DOTALL
    )

with open('src/themes.css', 'w', encoding='utf-8') as f:
    f.write(css)
