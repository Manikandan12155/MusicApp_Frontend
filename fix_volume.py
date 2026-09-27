import re

with open('src/components/Room.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add state
if 'const [volume, setVolume] = useState(70);' not in code:
    code = re.sub(
        r'(const \[currentTime, setCurrentTime\] = useState\(0\);)',
        r'\1\n  const [volume, setVolume] = useState(100);',
        code
    )

# Add handleVolumeChange
if 'const handleVolumeChange =' not in code:
    code = re.sub(
        r'(const handleSeek =.*?\}\;)',
        r'\1\n\n  const handleVolumeChange = (e) => {\n    const newVol = Number(e.target.value);\n    setVolume(newVol);\n    if (playerRef.current && playerRef.current.setVolume) {\n      playerRef.current.setVolume(newVol);\n    }\n  };\n',
        code,
        flags=re.DOTALL
    )

# Replace dummy volume slider
dummy_slider_regex = r'<Volume2 size=\{18\} color="var\(--text-secondary\)" />\s*<div style=\{\{ width: \'80px\', height: \'4px\', background: \'rgba\(255,255,255,0\.2\)\', borderRadius: \'2px\', position: \'relative\' \}\}>\s*<div style=\{\{ position: \'absolute\', top: 0, left: 0, height: \'100%\', width: \'70%\', background: \'var\(--accent-primary\)\', borderRadius: \'2px\' \}\}></div>\s*<div style=\{\{ position: \'absolute\', top: \'-4px\', left: \'70%\', width: \'12px\', height: \'12px\', background: \'var\(--text-primary\)\', borderRadius: \'50%\', boxShadow: \'0 0 5px rgba\(0,0,0,0\.5\)\' \}\}></div>\s*</div>'

volume_slider = """
          <Volume2 size={18} color="var(--text-secondary)" />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={handleVolumeChange}
            className="progress-bar"
            style={{ 
              width: '80px', 
              background: `linear-gradient(to right, var(--accent-primary) ${volume}%, rgba(255,255,255,0.2) ${volume}%)` 
            }}
          />
"""

code = re.sub(dummy_slider_regex, volume_slider.strip(), code)

with open('src/components/Room.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
