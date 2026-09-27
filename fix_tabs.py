import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    idx = f.read()

if '.tab-btn' not in idx:
    tab_css = """
.tab-btn {
  flex: 1;
  padding: 8px 2px;
  border-radius: 50px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-speed) var(--transition-easing);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.8rem;
}

.tab-btn.active {
  background: var(--item-active-bg);
  color: var(--text-primary);
  box-shadow: var(--item-active-shadow, none);
  border: var(--item-active-border, none);
}
"""
    idx += tab_css
    with open('src/index.css', 'w', encoding='utf-8') as f:
        f.write(idx)

# Update Room.jsx
with open('src/components/Room.jsx', 'r', encoding='utf-8') as f:
    room = f.read()

# Replace inline styles with classNames for tabs
room = re.sub(
    r'style={{ flex: 1, padding: \'8px 2px\', borderRadius: \'50px\', border: \'none\', background: rightTab === \'(.*?)\' \? \'var\(--item-active-bg\)\' : \'transparent\', color: rightTab === \'\1\' \? \'var\(--text-primary\)\' : \'var\(--text-secondary\)\', fontWeight: \'bold\', cursor: \'pointer\', transition: \'all 0\.3s\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\', gap: \'4px\', fontSize: \'0\.8rem\' }}',
    r'className={`tab-btn ${rightTab === "\1" ? "active" : ""}`}',
    room
)

with open('src/components/Room.jsx', 'w', encoding='utf-8') as f:
    f.write(room)
