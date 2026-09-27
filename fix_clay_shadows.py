import re

with open('src/themes.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Fix Neumorphism and Claymorphism to use rgba shadows instead of solid hex
# Neumorphism replacements:
# rgb(163,177,198,0.6) or #a3b1c6 -> rgba(0, 0, 0, 0.2)
# #ffffff in shadows -> rgba(255, 255, 255, 0.7)
def fix_shadows(match):
    block = match.group(0)
    # Replace the dark grey solid color with translucent black
    block = re.sub(r'rgb\(163,177,198,0\.6\)', 'rgba(0,0,0,0.2)', block)
    block = re.sub(r'#a3b1c6', 'rgba(0,0,0,0.2)', block)
    block = re.sub(r'#d1d5db', 'rgba(0,0,0,0.15)', block)
    # Replace solid white with translucent white
    block = re.sub(r'#ffffff', 'rgba(255,255,255,0.7)', block)
    
    # But wait, we shouldn't replace text-primary, btn-text etc!
    # Let's restore non-shadow properties that might have been hit:
    block = re.sub(r'(--btn-text:\s*)rgba\(255,255,255,0\.7\)', r'\1#ffffff', block)
    block = re.sub(r'(--bg-color:\s*)rgba\(255,255,255,0\.7\)', r'\1#ffffff', block)
    block = re.sub(r'(--surface-bg:\s*)rgba\(255,255,255,0\.7\)', r'\1rgba(255,255,255,0.85)', block)
    block = re.sub(r'(--card-bg:\s*)rgba\(255,255,255,0\.7\)', r'\1rgba(255,255,255,0.85)', block)
    block = re.sub(r'(--card-hover-bg:\s*)rgba\(255,255,255,0\.7\)', r'\1rgba(255,255,255,0.85)', block)
    
    # Also we want Neumorphism and Claymorphism surfaces to be slightly translucent to show the space bg!
    block = re.sub(r'(--surface-bg:\s*)#e0e5ec', r'\1rgba(224, 229, 236, 0.85)', block)
    block = re.sub(r'(--card-bg:\s*)#e0e5ec', r'\1rgba(224, 229, 236, 0.85)', block)
    block = re.sub(r'(--btn-bg:\s*)#e0e5ec', r'\1rgba(224, 229, 236, 0.9)', block)
    block = re.sub(r'(--input-bg:\s*)#e0e5ec', r'\1rgba(224, 229, 236, 0.5)', block)
    
    block = re.sub(r'(--surface-bg:\s*)#ffffff', r'\1rgba(255, 255, 255, 0.85)', block)
    block = re.sub(r'(--card-bg:\s*)#ffffff', r'\1rgba(255, 255, 255, 0.85)', block)
    block = re.sub(r'(--input-bg:\s*)#f3f4f6', r'\1rgba(243, 244, 246, 0.6)', block)
    
    # Add --input-shadow to clay and neumorphism so inputs look inset!
    block = re.sub(r'(--input-bg:.*?;)', r'\1\n  --input-shadow: inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.7);', block)
    
    return block

css = re.sub(r'\[data-theme="neumorphism"\] \{.*?\}', fix_shadows, css, flags=re.DOTALL)
css = re.sub(r'\[data-theme="claymorphism"\] \{.*?\}', fix_shadows, css, flags=re.DOTALL)

with open('src/themes.css', 'w', encoding='utf-8') as f:
    f.write(css)

# Also let's update index.css to use --input-shadow
with open('src/index.css', 'r', encoding='utf-8') as f:
    idx = f.read()

if '--input-shadow' not in idx:
    idx = idx.replace('border: var(--input-border);', 'border: var(--input-border);\n  box-shadow: var(--input-shadow, none);')

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(idx)
