import re

with open('src/components/Room.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(', Instagram, ', ', Camera, ')
code = code.replace('<Instagram ', '<Camera ')

with open('src/components/Room.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
