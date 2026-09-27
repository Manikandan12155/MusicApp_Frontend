import re

with open('src/components/Room.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add imports
code = re.sub(
    r'(import \{ .*?)(\} from \'lucide-react\';)',
    r'\1, MessageCircle, Instagram, Send, Link \2',
    code
)

# Add state
code = re.sub(
    r'(const \[showPlaylistModal, setShowPlaylistModal\] = useState\(null\);)',
    r'\1\n  const [showShareModal, setShowShareModal] = useState(false);',
    code
)

# Update invite friends button
invite_button_old = r'<button className="btn-primary" style=\{\{ width: \'100%\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\', gap: \'8px\' \}\}>'
invite_button_new = '<button className="btn-primary" onClick={() => setShowShareModal(true)} style={{ width: \'100%\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\', gap: \'8px\' }}>'
code = re.sub(invite_button_old, invite_button_new, code)

# Add Modal UI
share_modal_ui = """
      {/* Share Modal */}
      {showShareModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowShareModal(false)}>
          <div style={{ background: '#18181b', padding: '2rem', borderRadius: '16px', border: '1px solid #a855f7', width: '90%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1.5rem 0', textAlign: 'center' }}>Invite Friends</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => window.open(`https://api.whatsapp.com/send?text=Join%20my%20SpaceMusic%20room!%0Ahttps://${window.location.host}/room/${roomId}`)}
                style={{ background: '#25D366', border: 'none', color: '#fff', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <MessageCircle size={24} /> WhatsApp
              </button>
              
              <button 
                onClick={() => window.open(`https://t.me/share/url?url=https://${window.location.host}/room/${roomId}&text=Join%20my%20SpaceMusic%20room!`)}
                style={{ background: '#0088cc', border: 'none', color: '#fff', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <Send size={24} /> Telegram
              </button>
              
              <button 
                onClick={() => alert("Instagram doesn't support direct URL sharing, please use 'Copy Link'")}
                style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', border: 'none', color: '#fff', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <Instagram size={24} /> Instagram
              </button>

              <button 
                onClick={() => { navigator.clipboard.writeText(`https://${window.location.host}/room/${roomId}`); alert("Link copied to clipboard!"); setShowShareModal(false); }}
                style={{ background: 'var(--item-hover-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <Link size={24} /> Copy Link
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Save to Playlist Modal */}
"""

code = code.replace('{/* Save to Playlist Modal */}', share_modal_ui.strip() + '\n\n      {/* Save to Playlist Modal */}')

with open('src/components/Room.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
