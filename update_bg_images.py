import re

with open('src/themes.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace backgrounds with high quality unsplash images for a truly immersive feel
updates = {
    'neumorphism': {
        '--bg-image': "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564')"
    },
    'claymorphism': {
        '--bg-image': "url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2500')"
    },
    'skeuomorphism': {
        '--bg-image': "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1551269901-5c5e14c25df7?q=80&w=2500')"
    },
    'aurora': {
        '--bg-image': "url('https://images.unsplash.com/photo-1579033461387-adb471fb6315?q=80&w=2500')"
    },
    'liquid-glass': {
        '--bg-image': "linear-gradient(rgba(224,195,252,0.3), rgba(142,197,252,0.3)), url('https://images.unsplash.com/photo-1550859491-d5da9d8e45f3?q=80&w=2500')"
    },
    'metallic': {
        '--bg-image': "linear-gradient(rgba(26,26,26,0.6), rgba(26,26,26,0.9)), url('https://images.unsplash.com/photo-1614050013919-0c6dff5a2283?q=80&w=2500')"
    },
    'cyberpunk': {
        '--bg-image': "linear-gradient(rgba(5,5,5,0.7), rgba(5,5,5,0.9)), url('https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=2500')"
    },
    'brutalist': {
        '--bg-image': "url('https://images.unsplash.com/photo-1502003148287-a82ef80a6abc?q=80&w=2500')"
    },
    'y2k': {
        '--bg-image': "url('https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2500')"
    }
}

for theme, values in updates.items():
    css = re.sub(
        rf'(\[data-theme="{theme}"\]\s*{{[^}}]*?--bg-image:\s*)(.*?)(;)',
        rf'\g<1>{values["--bg-image"]}\g<3>',
        css,
        flags=re.DOTALL
    )

# Make sure background size is cover for these image backgrounds
css = re.sub(r'--bg-size:.*?;\n', '--bg-size: cover;\n', css)

with open('src/themes.css', 'w', encoding='utf-8') as f:
    f.write(css)
