import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

if '.fade-in-content' not in css:
    css += """
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-content {
  animation: fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
"""
    with open('src/index.css', 'w', encoding='utf-8') as f:
        f.write(css)

with open('src/components/Room.jsx', 'r', encoding='utf-8') as f:
    room = f.read()

# The content starts immediately after the tabs container `</div>`
# And ends before `</div>` that closes `.queue-sidebar`
# We need to wrap it.
# Let's use regex to find the tabs container and wrap the rest.

# Find the end of the tabs container
tabs_end_idx = room.find('</button>\n            <button className={`tab-btn ${rightTab === \'cut\'')
if tabs_end_idx != -1:
    tabs_end_idx = room.find('</div>', tabs_end_idx) + 6

# The end of the sidebar content is before:
# {/* Center Player Area */} or just before the closing </div> of right Queue / Lyrics Sidebar
queue_sidebar_end = room.find('</div>\n\n        <div className="player-center">')

if tabs_end_idx != -1 and queue_sidebar_end != -1:
    content = room[tabs_end_idx:queue_sidebar_end]
    if '<div key={rightTab} className="fade-in-content">' not in content:
        wrapped_content = f'\n          <div key={{rightTab}} className="fade-in-content">{content}          </div>\n'
        new_room = room[:tabs_end_idx] + wrapped_content + room[queue_sidebar_end:]
        with open('src/components/Room.jsx', 'w', encoding='utf-8') as f:
            f.write(new_room)
