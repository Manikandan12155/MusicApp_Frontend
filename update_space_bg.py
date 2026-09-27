import re

with open('src/themes.css', 'r', encoding='utf-8') as f:
    css = f.read()

updates = {
    'neumorphism': {
        '--bg-image': "linear-gradient(rgba(224,229,236,0.7), rgba(224,229,236,0.9)), url('https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=2500')"
    },
    'claymorphism': {
        '--bg-image': "linear-gradient(rgba(248,249,250,0.6), rgba(248,249,250,0.8)), url('https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2500')"
    },
    'skeuomorphism': {
        '--bg-image': "linear-gradient(rgba(43,43,43,0.7), rgba(43,43,43,0.9)), url('https://images.unsplash.com/photo-1614729939124-03290b56c9ce?q=80&w=2500')"
    },
    'aurora': {
        '--bg-image': "linear-gradient(rgba(11,15,25,0.4), rgba(11,15,25,0.7)), url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2500')"
    },
    'liquid-glass': {
        '--bg-image': "linear-gradient(rgba(142,197,252,0.4), rgba(224,195,252,0.4)), url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2500')"
    },
    'metallic': {
        '--bg-image': "linear-gradient(rgba(26,26,26,0.6), rgba(26,26,26,0.9)), url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2500')"
    },
    'cyberpunk': {
        '--bg-image': "linear-gradient(rgba(15,15,19,0.7), rgba(15,15,19,0.9)), url('https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=2500')"
    },
    'brutalist': {
        '--bg-image': "linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.8)), url('https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=2500')"
    },
    'y2k': {
        '--bg-image': "linear-gradient(rgba(255,0,255,0.4), rgba(0,255,255,0.4)), url('https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=2500')"
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
