import re

with open('src/themes.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Updates to backgrounds
updates = {
    'neumorphism': {
        '--bg-color': '#e0e5ec',
        '--bg-image': 'radial-gradient(at 0% 0%, #ffffff 0%, transparent 50%), radial-gradient(at 100% 100%, #c8d0e7 0%, transparent 50%)'
    },
    'claymorphism': {
        '--bg-color': '#f8f9fa',
        '--bg-image': 'radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(340,100%,76%,1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%)'
    },
    'skeuomorphism': {
        '--bg-color': '#2b2b2b',
        '--bg-image': "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1), rgba(0,0,0,0.8)), url('https://www.transparenttextures.com/patterns/dark-leather.png')"
    },
    'aurora': {
        '--bg-color': '#000000',
        '--bg-image': 'radial-gradient(ellipse at top left, rgba(20, 255, 236, 0.3), transparent 50%), radial-gradient(ellipse at top right, rgba(255, 0, 228, 0.3), transparent 50%), radial-gradient(ellipse at bottom center, rgba(147, 51, 234, 0.3), transparent 50%)'
    },
    'liquid-glass': {
        '--bg-color': '#e0c3fc',
        '--bg-image': 'linear-gradient(45deg, #8ec5fc 0%, #e0c3fc 100%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.4), transparent 40%)'
    },
    'metallic': {
        '--bg-color': '#1a1a1a',
        '--bg-image': 'repeating-linear-gradient(45deg, #1f1f1f 0%, #1f1f1f 2%, #2a2a2a 2%, #2a2a2a 4%), radial-gradient(circle at top left, rgba(255,255,255,0.1), transparent 50%)'
    },
    'cyberpunk': {
        '--bg-color': '#050505',
        '--bg-image': 'linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 85, 0.05) 1px, transparent 1px), radial-gradient(circle at center, transparent 30%, #050505 100%)'
    },
    'brutalist': {
        '--bg-color': '#ffffff',
        '--bg-image': 'repeating-linear-gradient(45deg, #000000 0, #000000 2px, transparent 2px, transparent 10px)'
    },
    'y2k': {
        '--bg-color': '#ff00ff',
        '--bg-image': 'linear-gradient(135deg, rgba(0,255,255,0.5) 0%, rgba(255,0,255,0.5) 100%), repeating-radial-gradient(circle at center, transparent 0, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
    }
}

for theme, values in updates.items():
    # Replace bg-color
    css = re.sub(
        rf'(\[data-theme="{theme}"\]\s*{{[^}}]*?--bg-color:\s*)(.*?)(;)',
        rf'\g<1>{values["--bg-color"]}\g<3>',
        css,
        flags=re.DOTALL
    )
    # Replace bg-image
    css = re.sub(
        rf'(\[data-theme="{theme}"\]\s*{{[^}}]*?--bg-image:\s*)(.*?)(;)',
        rf'\g<1>{values["--bg-image"]}\g<3>',
        css,
        flags=re.DOTALL
    )

# For brutalist, let's tone down the repeating stripes so it's not blinding.
css = css.replace(
    'repeating-linear-gradient(45deg, #000000 0, #000000 2px, transparent 2px, transparent 10px)',
    'radial-gradient(#000000 1px, transparent 1px)'
)
# Add background size to brutalist
if 'background-size: 20px 20px;' not in css:
    css = css.replace(
        '[data-theme="brutalist"] {\n  --bg-color: #ffffff;\n  --bg-image: radial-gradient(#000000 1px, transparent 1px);',
        '[data-theme="brutalist"] {\n  --bg-color: #ffffff;\n  --bg-image: radial-gradient(#000000 2px, transparent 2px);\n  background-size: 20px 20px;'
    )

# Fix cyberpunk grid size
if 'background-size: 30px 30px' not in css:
    css = css.replace(
        '[data-theme="cyberpunk"] {\n  --bg-color: #050505;\n  --bg-image: linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 85, 0.05) 1px, transparent 1px), radial-gradient(circle at center, transparent 30%, #050505 100%);',
        '[data-theme="cyberpunk"] {\n  --bg-color: #050505;\n  --bg-image: linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 85, 0.1) 1px, transparent 1px);\n  background-size: 30px 30px;'
    )

with open('src/themes.css', 'w', encoding='utf-8') as f:
    f.write(css)
