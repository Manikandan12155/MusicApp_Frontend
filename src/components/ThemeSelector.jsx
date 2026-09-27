import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import '../themes.css'; // ensure themes are loaded

export const themes = [
  { id: 'neumorphism', name: 'Neumorphism', description: 'Soft embossed surfaces' },
  { id: 'glassmorphism', name: 'Glassmorphism', description: 'Frosted glass & blur' },
  { id: 'claymorphism', name: 'Claymorphism', description: 'Soft 3D • Puffy • Playful' },
  { id: 'skeuomorphism', name: 'Skeuomorphism', description: 'Real-world textures' },
  { id: 'aurora', name: 'Aurora UI', description: 'Vibrant atmospheric lighting' },
  { id: 'liquid-glass', name: 'Liquid Glass', description: 'Fluid translucent surfaces' },
  { id: 'metallic', name: 'Metallic UI', description: 'Chrome / brushed-metal' },
  { id: 'cyberpunk', name: 'Cyberpunk UI', description: 'Dark • Neon • HUD' },
  { id: 'brutalist', name: 'Brutalist UI', description: 'Bold • High contrast' },
  { id: 'y2k', name: 'Y2K / Retro UI', description: 'Early-2000s glossy aesthetic' },
];

export default function ThemeSelector({ onClose, currentTheme, onThemeSelect }) {
  const [previewTheme, setPreviewTheme] = useState(currentTheme);

  // Apply preview theme to a wrapper so we can see it inside the modal 
  // without changing the actual app theme immediately (optional, or we can just change it)
  
  // The instructions say:
  // "When the user selects a theme: The ACTUAL SpaceMusic application behind the modal should also transform."
  // So hovering or clicking a theme should update the global theme.
  
  const handleThemeChange = (themeId) => {
    setPreviewTheme(themeId);
  };

  const handleApply = () => {
    onThemeSelect(previewTheme);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="glass-panel" style={{
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        animation: 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        background: 'var(--surface-bg)',
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 32px',
          borderBottom: 'var(--surface-border)'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Choose Your Experience</h2>
          <button className="control-btn" onClick={onClose} style={{ background: 'var(--card-bg)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="theme-modal-content">
          
          {/* Left: Theme List */}
          <div style={{
            flex: '0 0 350px',
            borderRight: 'var(--surface-border)',
            overflowY: 'auto',
            padding: '24px'
          }} className="theme-list">
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>Themes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {themes.map(t => (
                <div 
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--card-radius)',
                    background: previewTheme === t.id ? 'var(--item-active-bg)' : 'var(--card-bg)',
                    border: previewTheme === t.id ? 'var(--item-active-border)' : 'var(--card-border)',
                    boxShadow: previewTheme === t.id ? 'var(--item-active-shadow)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all var(--transition-speed) var(--transition-easing)'
                  }}
                  className="theme-list-item"
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {t.description}
                    </div>
                  </div>
                  {previewTheme === t.id && (
                    <div style={{ 
                      width: '28px', height: '28px', 
                      borderRadius: '50%', 
                      background: 'var(--btn-bg)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--btn-text)',
                      boxShadow: 'var(--btn-shadow)'
                    }}>
                      <Check size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', background: 'rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1rem', color: 'var(--text-secondary)', alignSelf: 'flex-start' }}>Live Preview</h3>
            
            {/* Miniature App Preview using the CURRENT global theme variables */}
            <div className="glass-panel" data-theme={previewTheme} style={{
              width: '100%',
              maxWidth: '400px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              pointerEvents: 'none',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--surface-radius)',
              boxShadow: 'var(--surface-shadow)'
            }}>
              
              {/* Fake Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }} />
                <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-primary)' }}>SpaceMusic</div>
              </div>

              {/* Fake Search */}
              <div className="input-field" style={{ padding: '12px 20px', fontSize: '0.9rem' }}>
                Search a song...
              </div>

              {/* Fake Artwork */}
              <div className="artwork-container" style={{ margin: 0, aspectRatio: '16/9' }}>
                <img src="https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=600&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
              </div>

              {/* Fake Details */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>Starlight Journey</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cosmic Vibes</div>
              </div>

              {/* Fake Controls */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
                <div className="control-btn" style={{ padding: '6px' }}>⏮</div>
                <div className="play-circle-btn" style={{ width: '40px', height: '40px' }}>▶</div>
                <div className="control-btn" style={{ padding: '6px' }}>⏭</div>
              </div>

              {/* Fake Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>1:23</span>
                <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                  <div style={{ width: '40%', height: '100%', background: 'var(--accent-primary)', borderRadius: '2px' }} />
                </div>
                <span>3:45</span>
              </div>
              
              {/* Fake Queue Item */}
              <div className="queue-item" style={{ margin: 0, padding: '8px' }}>
                <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Next Track</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 32px',
          borderTop: 'var(--surface-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'var(--surface-bg)'
        }}>
          <button className="btn-primary" onClick={handleApply} style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
            Apply Theme
          </button>
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 768px) {
          .theme-modal-content {
            flex-direction: column !important;
          }
          .theme-list {
            flex: none !important;
            height: 40vh;
            border-right: none !important;
            border-bottom: 1px solid var(--surface-border);
          }
        }
        .theme-list-item:hover {
          transform: translateX(4px);
        }
      `}} />
    </div>
  );
}
