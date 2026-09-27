import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Make sure we import themes
if '@import "./themes.css";' not in css:
    css = '@import "./themes.css";\n' + css

css = re.sub(r':root\s*\{[\s\S]*?\}', """\
:root {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  color-scheme: dark;
  margin: 0;
  padding: 0;
  
  /* Core Theme Tokens */
  --bg-color: #020617;
  --bg-image: linear-gradient(rgba(2, 6, 23, 0.7), rgba(2, 6, 23, 0.8)), url('/space_music_bg.jpg');
  
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  
  --accent-primary: #a855f7;
  --accent-secondary: #3b82f6;
  --accent-tertiary: #06b6d4;
  
  --surface-bg: rgba(15, 23, 42, 0.45);
  --surface-border: rgba(255, 255, 255, 0.08);
  --surface-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  --surface-radius: 20px;
  --surface-blur: 16px;
  
  --btn-bg: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  --btn-text: #ffffff;
  --btn-radius: 50px;
  --btn-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
  --btn-hover-shadow: 0 0 30px rgba(168, 85, 247, 0.6);
  --btn-hover-transform: translateY(-2px);
  
  --input-bg: rgba(255, 255, 255, 0.05);
  --input-border: 1px solid rgba(255, 255, 255, 0.08);
  --input-focus-border: var(--accent-primary);
  --input-focus-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
  
  --card-bg: rgba(255, 255, 255, 0.03);
  --card-border: 1px solid rgba(168, 85, 247, 0.3);
  --card-hover-bg: rgba(255, 255, 255, 0.05);
  --card-hover-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
  --card-radius: 16px;
  
  --item-hover-bg: rgba(255, 255, 255, 0.05);
  --item-active-bg: rgba(168, 85, 247, 0.15);
  --item-active-border: 1px solid rgba(168, 85, 247, 0.3);
  --item-active-shadow: 0 0 20px rgba(168, 85, 247, 0.1);
  
  --artwork-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(168, 85, 247, 0.3);
  --artwork-border: 1px solid rgba(255, 255, 255, 0.1);
  --artwork-radius: 16px;
  
  --pill-bg: rgba(255, 255, 255, 0.05);
  --pill-border: 1px solid rgba(255, 255, 255, 0.1);
  
  --transition-speed: 0.4s;
  --transition-easing: cubic-bezier(0.22, 1, 0.36, 1);
}""", css, count=1)

css = re.sub(r'body\s*\{[\s\S]*?overflow:\s*hidden;\n\}', """\
body {
  margin: 0;
  min-height: 100vh;
  background-color: var(--bg-color);
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  overflow: hidden;
  color: var(--text-primary);
  transition: background-color var(--transition-speed) var(--transition-easing), background-image var(--transition-speed) var(--transition-easing), color var(--transition-speed) var(--transition-easing);
}""", css)

css = re.sub(r'\.glass-panel\s*\{[\s\S]*?border-radius:\s*20px;\n\}', """\
.glass-panel {
  background: var(--surface-bg);
  backdrop-filter: blur(var(--surface-blur));
  -webkit-backdrop-filter: blur(var(--surface-blur));
  border: var(--surface-border);
  box-shadow: var(--surface-shadow);
  border-radius: var(--surface-radius);
  transition: all var(--transition-speed) var(--transition-easing);
}""", css)

css = re.sub(r'\.btn-primary\s*\{[\s\S]*?box-shadow:\s*0\s*0\s*20px\s*rgba\(168,\s*85,\s*247,\s*0\.4\);\n\}', """\
.btn-primary {
  background: var(--btn-bg);
  border: none;
  border-radius: var(--btn-radius);
  color: var(--btn-text);
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-speed) var(--transition-easing);
  white-space: nowrap;
  box-shadow: var(--btn-shadow);
}""", css)

css = re.sub(r'\.btn-primary:hover\s*\{[\s\S]*?\}', """\
.btn-primary:hover {
  transform: var(--btn-hover-transform);
  box-shadow: var(--btn-hover-shadow);
}""", css)

css = re.sub(r'\.input-field\s*\{[\s\S]*?backdrop-filter:\s*blur\(10px\);\n\}', """\
.input-field {
  width: 100%;
  padding: 16px 24px 16px 54px;
  background: var(--input-bg);
  border: var(--input-border);
  border-radius: var(--btn-radius);
  color: var(--text-primary);
  font-size: 1rem;
  font-family: inherit;
  transition: all var(--transition-speed) var(--transition-easing);
  backdrop-filter: blur(10px);
}""", css)

css = re.sub(r'\.input-field:focus\s*\{[\s\S]*?\}', """\
.input-field:focus {
  outline: none;
  background: var(--input-bg);
  border: var(--input-focus-border);
  box-shadow: var(--input-focus-shadow);
}""", css)

css = re.sub(r'\.search-icon\s*\{[\s\S]*?color:\s*#a1a1aa;\n\}', """\
.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  transition: color var(--transition-speed) var(--transition-easing);
}""", css)

css = re.sub(r'\.room-card\s*\{[\s\S]*?transition:\s*all\s*0\.3s\s*ease;\n\}', """\
.room-card {
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all var(--transition-speed) var(--transition-easing);
}""", css)

css = re.sub(r'\.room-card:hover\s*\{[\s\S]*?\}', """\
.room-card:hover {
  background: var(--card-hover-bg);
  box-shadow: var(--card-hover-shadow);
}""", css)

css = re.sub(r'\.listener-item:hover\s*\{[\s\S]*?\}', """\
.listener-item:hover {
  background: var(--item-hover-bg);
}""", css)

css = re.sub(r'\.artwork-container\s*\{[\s\S]*?background:\s*#000;\n\}', """\
.artwork-container {
  width: 100%;
  max-width: 560px;
  aspect-ratio: 16 / 9;
  height: auto;
  border-radius: var(--artwork-radius);
  overflow: hidden;
  position: relative;
  box-shadow: var(--artwork-shadow);
  margin-bottom: 24px;
  border: var(--artwork-border);
  background: #000;
  transition: all var(--transition-speed) var(--transition-easing);
}""", css)

css = re.sub(r'\.pill\s*\{[\s\S]*?color:\s*#a1a1aa;\n\}', """\
.pill {
  padding: 6px 16px;
  background: var(--pill-bg);
  border: var(--pill-border);
  border-radius: 50px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  transition: all var(--transition-speed) var(--transition-easing);
}""", css)

css = re.sub(r'\.queue-item:hover\s*\{[\s\S]*?\}', """\
.queue-item:hover {
  background: var(--item-hover-bg);
  border: var(--item-active-border);
}""", css)

css = re.sub(r'\.queue-item\.active\s*\{[\s\S]*?\}', """\
.queue-item.active {
  background: var(--item-active-bg);
  border: var(--item-active-border);
  box-shadow: var(--item-active-shadow);
}""", css)

css = re.sub(r'\.play-circle-btn\s*\{[\s\S]*?box-shadow:\s*0\s*0\s*20px\s*rgba\(168,\s*85,\s*247,\s*0\.4\);\n\}', """\
.play-circle-btn {
  background: var(--btn-bg);
  color: var(--btn-text);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed) var(--transition-easing);
  box-shadow: var(--btn-shadow);
}""", css)

css = re.sub(r'\.play-circle-btn:hover\s*\{[\s\S]*?\}', """\
.play-circle-btn:hover {
  transform: scale(1.05);
  box-shadow: var(--btn-hover-shadow);
  color: var(--btn-text);
}""", css)

css = re.sub(r'\.control-btn\s*\{[\s\S]*?border-radius:\s*50%;\n\}', """\
.control-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed) var(--transition-easing);
  padding: 8px;
  border-radius: 50%;
}""", css)

css = re.sub(r'\.control-btn:hover\s*\{[\s\S]*?\}', """\
.control-btn:hover {
  color: var(--text-primary);
  background: var(--item-hover-bg);
}""", css)

css = css.replace('color: #a1a1aa;', 'color: var(--text-secondary);')
css = css.replace('color: #fff;', 'color: var(--text-primary);')
css = css.replace('color: white;', 'color: var(--text-primary);')

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(css)
