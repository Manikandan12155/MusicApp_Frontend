import re

with open('src/components/Room.jsx', 'r', encoding='utf-8') as f:
    room = f.read()

# Replace tab button content to remove text and increase icon size
room = room.replace('<ListVideo size={14} /> Queue', '<ListVideo size={18} />')
room = room.replace('<Heart size={14} /> Favs', '<Heart size={18} />')
room = room.replace('<ListPlus size={14} /> Saved', '<ListPlus size={18} />')
room = room.replace('<Mic2 size={14} /> Lyrics', '<Mic2 size={18} />')
room = room.replace('<Scissors size={14} /> Cut', '<Scissors size={18} />')

with open('src/components/Room.jsx', 'w', encoding='utf-8') as f:
    f.write(room)
