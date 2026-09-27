import re

with open('src/components/Room.jsx', 'r', encoding='utf-8') as f:
    room = f.read()

# Fix search-icon blur issue
room = room.replace('<Search className="search-icon" size={20} />', '<Search className="search-icon" size={20} style={{ zIndex: 10, pointerEvents: \'none\' }} />')

tabsArrayCode = """
          <div style={{ display: 'flex', marginBottom: '24px', background: 'var(--item-hover-bg)', borderRadius: '50px', padding: '4px', position: 'relative' }}>
            {/* Sliding Pill Background */}
            <div style={{ 
              position: 'absolute', 
              top: '4px', 
              bottom: '4px', 
              left: `calc(4px + (${['queue', 'favorites', 'playlists', 'lyrics', 'cut'].indexOf(rightTab)} * (100% - 8px) / 5))`, 
              width: 'calc((100% - 8px) / 5)', 
              background: 'var(--item-active-bg)', 
              borderRadius: '50px', 
              boxShadow: 'var(--item-active-shadow, none)', 
              transition: 'left 0.3s cubic-bezier(0.22, 1, 0.36, 1)' 
            }} />
            
            <button className={`tab-btn ${rightTab === 'queue' ? 'active' : ''}`} onClick={() => { setRightTab('queue'); setActivePlaylist(null); }} style={{ position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none' }}>
              <ListVideo size={14} /> Queue
            </button>
            <button className={`tab-btn ${rightTab === 'favorites' ? 'active' : ''}`} onClick={() => { setRightTab('favorites'); setActivePlaylist(null); }} style={{ position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none' }}>
              <Heart size={14} /> Favs
            </button>
            <button className={`tab-btn ${rightTab === 'playlists' ? 'active' : ''}`} onClick={() => { setRightTab('playlists'); setActivePlaylist(null); }} style={{ position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none' }}>
              <ListPlus size={14} /> Saved
            </button>
            <button className={`tab-btn ${rightTab === 'lyrics' ? 'active' : ''}`} onClick={() => { setRightTab('lyrics'); setActivePlaylist(null); }} style={{ position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none' }}>
              <Mic2 size={14} /> Lyrics
            </button>
            <button className={`tab-btn ${rightTab === 'cut' ? 'active' : ''}`} onClick={() => { setRightTab('cut'); setActivePlaylist(null); }} style={{ position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none' }}>
              <Scissors size={14} /> Cut
            </button>
          </div>
"""

oldTabsRegex = r'<div style=\{\{\s*display: \'flex\',\s*marginBottom: \'24px\',\s*background: \'var\(--item-hover-bg\)\',\s*borderRadius: \'50px\',\s*padding: \'4px\'\s*\}\}>[\s\S]*?</div>'

room = re.sub(oldTabsRegex, tabsArrayCode.strip(), room)

with open('src/components/Room.jsx', 'w', encoding='utf-8') as f:
    f.write(room)
