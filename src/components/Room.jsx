import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import YouTube from 'react-youtube';
import { Users, Search, Play, Pause, SkipForward, SkipBack, Rewind, FastForward, ListVideo, Video, Headphones, Copy, UserPlus, Heart, MoreHorizontal, Volume2, Maximize2, Repeat, Shuffle, GripVertical, Mic2, ListPlus, Plus, ChevronLeft, Download, Film, Scissors, Palette , MessageCircle, Camera, Send, Link } from 'lucide-react';
import ThemeSelector, { themes } from './ThemeSelector';

const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:3001` : '');

const getCleanTitle = (title) => {
  if (!title) return '...';
  // Remove everything after |, -, [, or (
  return title.split(/\||-|\[|\(/)[0].trim();
};

const parseSyncedLyrics = (lrcString) => {
  if (!lrcString) return null;
  const lines = lrcString.split('\n');
  const parsed = [];

  for (const line of lines) {
    // Make decimals optional: [01:23] or [01:23.45]
    const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) {
        parsed.push({
          time: min * 60 + sec,
          text: text
        });
      }
    }
  }

  return parsed.length > 0 ? parsed : null;
};

export default function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;

  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);

  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('spacemusic-theme') || 'glassmorphism';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('spacemusic-theme', currentTheme);
  }, [currentTheme]);

  const [currentSong, setCurrentSong] = useState(null);
  const [songDetails, setSongDetails] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [loopMode, setLoopMode] = useState(0);
  const [isVideoMode, setIsVideoMode] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [duration, setDuration] = useState(0);

  const [rightTab, setRightTab] = useState('queue'); // 'queue' | 'lyrics' | 'favorites'
  const [lyrics, setLyrics] = useState({ loading: false, plain: null, synced: null });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('spaceMusic_favs')) || []; }
    catch (e) { return []; }
  });
  const [playlists, setPlaylists] = useState(() => {
    try { return JSON.parse(localStorage.getItem('spaceMusic_playlists')) || {}; }
    catch (e) { return {}; }
  });
  const [showPlaylistModal, setShowPlaylistModal] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [activePlaylist, setActivePlaylist] = useState(null); // For viewing a playlist in the tab

  const [cutStart, setCutStart] = useState(0);
  const [cutEnd, setCutEnd] = useState(0);
  const [activeCutEnd, setActiveCutEnd] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);

  const playerRef = useRef(null);
  const ignoreNextEvent = useRef(false);
  const initialSyncTime = useRef(0);

  useEffect(() => {
    localStorage.setItem('spaceMusic_favs', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('spaceMusic_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.emit('join_room', { roomId, username });

    newSocket.on('room_state', (state) => {
      setUsers(state.users);
      setQueue(state.queue);
      if (state.currentSong) {
        ignoreNextEvent.current = true;
        initialSyncTime.current = state.timestamp;
        setCurrentSong(state.currentSong);
        setSongDetails(state.songDetails);
        setIsPlaying(state.isPlaying);
        setCurrentTime(state.timestamp);
      }
    });

    newSocket.on('user_joined', ({ users }) => setUsers(users));
    newSocket.on('user_left', ({ users }) => setUsers(users));
    newSocket.on('queue_update', (newQueue) => setQueue(newQueue));
    newSocket.on('loop_update', (mode) => setLoopMode(mode));

    newSocket.on('play_new_song', ({ videoId, details, timestamp }) => {
      ignoreNextEvent.current = true;
      initialSyncTime.current = timestamp;
      setCurrentSong(videoId);
      setSongDetails(details);
      setIsPlaying(true);
      setCurrentTime(timestamp);
      setDuration(0);
    });

    newSocket.on('stop_song', ({ lastDetails }) => {
      setCurrentSong(null);
      setSongDetails(null);
      setIsPlaying(false);

      // Only the first user (Host) triggers the auto-next to avoid duplicates
      setUsers(currentUsers => {
        const isHost = currentUsers.length > 0 && currentUsers[0].username === username;
        if (isHost && lastDetails) {
          fetchAndPopulateUpNext(lastDetails);
        }
        return currentUsers;
      });
    });

    newSocket.on('sync_play', ({ timestamp }) => {
      ignoreNextEvent.current = true;
      setIsPlaying(true);
      setCurrentTime(timestamp);
      if (playerRef.current) {
        playerRef.current.seekTo(timestamp, true);
        playerRef.current.playVideo();
      }
    });

    newSocket.on('sync_pause', ({ timestamp }) => {
      ignoreNextEvent.current = true;
      setIsPlaying(false);
      setCurrentTime(timestamp);
      if (playerRef.current) {
        playerRef.current.seekTo(timestamp, true);
        playerRef.current.pauseVideo();
      }
    });

    return () => newSocket.disconnect();
  }, [roomId, username, navigate]);

  // Update current time continuously with a robust polling mechanism
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getPlayerState) {
        // getPlayerState() === 1 means the video is actively playing
        if (playerRef.current.getPlayerState() === 1) {
          const time = playerRef.current.getCurrentTime() || 0;
          setCurrentTime(time);

          if (activeCutEnd > 0 && time >= activeCutEnd) {
            playerRef.current.pauseVideo();
            setActiveCutEnd(0);
            if (socket) socket.emit('sync_pause', { roomId, timestamp: time });
            setIsPlaying(false);
          }
        }
      }
    }, 100); // 100ms for near-instant lyric syncing
    return () => clearInterval(interval);
  }, [activeCutEnd, roomId, socket]);

  // Auto-scroll to active lyric line
  useEffect(() => {
    if (rightTab === 'lyrics' && lyrics.synced) {
      const activeEl = document.getElementById('active-lyric-line');
      if (activeEl && activeEl.scrollIntoView) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, rightTab, lyrics.synced]);

  // Fetch lyrics whenever the song changes
  useEffect(() => {
    if (!songDetails) {
      setLyrics({ loading: false, plain: null, synced: null });
      return;
    }

    const fetchLyrics = async () => {
      setLyrics({ loading: true, plain: null, synced: null });
      try {
        const cleanTitle = getCleanTitle(songDetails.title);
        // Using our backend proxy to avoid CORS/User-Agent restrictions from the browser
        const res = await fetch(`${SOCKET_SERVER_URL}/api/lyrics?q=${encodeURIComponent(cleanTitle)}`);
        const data = await res.json();

        if (data && data.length > 0 && (data[0].plainLyrics || data[0].syncedLyrics)) {
          setLyrics({
            loading: false,
            plain: data[0].plainLyrics,
            synced: parseSyncedLyrics(data[0].syncedLyrics)
          });
        } else {
          setLyrics({ loading: false, plain: "Lyrics not found for this song in the database.", synced: null });
        }
      } catch (err) {
        console.error("Lyrics fetch failed", err);
        setLyrics({ loading: false, plain: "Failed to load lyrics.", synced: null });
      }
    };

    fetchLyrics();
  }, [songDetails?.title]);

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration() || 0);

    // Sync to the correct timestamp when the player loads for the first time
    if (initialSyncTime.current > 0) {
      event.target.seekTo(initialSyncTime.current, true);
      initialSyncTime.current = 0;
    }
  };

  const onStateChange = (event) => {
    if (!socket) return;

    setDuration(playerRef.current.getDuration() || 0);

    if (event.data === 1) {
      setIsPlaying(true);
    } else if (event.data === 2) {
      setIsPlaying(false);
    } else if (event.data === 0) {
      socket.emit('song_ended', { roomId, lastVideoId: currentSong });
    }
  };

  // OS Media Session (Notification Controls)
  useEffect(() => {
    if ('mediaSession' in navigator && songDetails) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: getCleanTitle(songDetails.title),
        artist: songDetails.channel,
        album: 'SpaceMusic',
        artwork: [
          { src: songDetails.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (!isPlaying) togglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (isPlaying) togglePlay();
      });
      navigator.mediaSession.setActionHandler('nexttrack', skipNext);
    }
  }, [songDetails, isPlaying, currentSong]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchError('');

    // Check if it is a direct YouTube URL
    const urlMatch = searchQuery.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
    if (urlMatch) {
      const videoId = urlMatch[1];
      handleAddToQueue(videoId);
      return;
    }

    const API_KEY = 'AIzaSyANRBDBHFV9yON6GU9walyF9dHaggulou0';
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=15&key=${API_KEY}`);
      const data = await res.json();
      if (data.items) {
        const filteredItems = data.items.filter(item => !item.snippet.title.toLowerCase().includes('shorts') && !item.snippet.title.toLowerCase().includes('#short'));
        setSearchResults(filteredItems.slice(0, 10));
      } else if (data.error && data.error.code === 429) {
        setSearchError('YouTube API limit reached! Please paste direct YouTube links instead.');
      } else if (data.error) {
        setSearchError('Failed to search: ' + data.error.message);
      }
    } catch (err) {
      setSearchError('Network error while searching.');
    }
  };

  const fetchAndPopulateUpNext = async (details) => {
    if (!details || !socket) return;
    const API_KEY = 'AIzaSyANRBDBHFV9yON6GU9walyF9dHaggulou0';
    // Use just the channel to get their other top songs instead of the same song name
    const query = encodeURIComponent(`${details.channel} top hit songs`);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=15&key=${API_KEY}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        // Filter out the current song, shorts, and any exact title matches to avoid repeats
        const nextItems = data.items
          .filter(item =>
            item.id.videoId !== details.videoId &&
            !item.snippet.title.includes(details.title.substring(0, 10)) &&
            !item.snippet.title.toLowerCase().includes('shorts') &&
            !item.snippet.title.toLowerCase().includes('#short')
          )
          .map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high.url
          }));

        if (nextItems.length > 0) {
          socket.emit('append_multiple_to_queue', { roomId, items: nextItems });
        }
      }
    } catch (err) {
      console.error('Failed to populate up next', err);
    }
  };

  const handleAddToQueue = (item) => {
    const isDirectId = typeof item === 'string';
    const videoId = isDirectId ? item : item.id.videoId;
    const details = isDirectId ? { videoId, title: 'Unknown Song (via ID)', channel: '', thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg` } : {
      videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high.url
    };

    // Play the newly searched song immediately!
    socket.emit('play_now', { roomId, item: details });

    // Auto-populate the rest of the queue based on this new song
    if (!isDirectId) {
      fetchAndPopulateUpNext(details);
    }

    setSearchResults([]);
    setSearchQuery('');
  };

  const togglePlay = () => {
    if (!playerRef.current || !currentSong) return;
    const timestamp = playerRef.current.getCurrentTime();
    if (isPlaying) {
      playerRef.current.pauseVideo();
      socket.emit('sync_pause', { roomId, timestamp });
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      socket.emit('sync_play', { roomId, timestamp });
      setIsPlaying(true);
    }
  };

  const skipNext = () => {
    if (currentSong && socket) {
      socket.emit('song_ended', { roomId, lastVideoId: currentSong });
    }
  };

  const skipForward10 = () => {
    if (playerRef.current) {
      const newTime = Math.min(currentTime + 10, duration);
      playerRef.current.seekTo(newTime, true);
      if (socket) socket.emit('sync_play', { roomId, timestamp: newTime });
    }
  };

  const skipBackward10 = () => {
    if (playerRef.current) {
      const newTime = Math.max(currentTime - 10, 0);
      playerRef.current.seekTo(newTime, true);
      if (socket) socket.emit('sync_play', { roomId, timestamp: newTime });
    }
  };

  const handleShuffle = () => {
    if (socket) socket.emit('shuffle_queue', { roomId });
  };

  const handleToggleLoop = () => {
    if (socket) socket.emit('toggle_loop', { roomId });
  };

  const toggleFavorite = (details) => {
    if (!details) return;
    setFavorites(prev => {
      const exists = prev.find(f => f.videoId === details.videoId);
      if (exists) return prev.filter(f => f.videoId !== details.videoId);
      return [...prev, details];
    });
  };

  const handleSaveToPlaylist = (playlistName) => {
    if (!showPlaylistModal || !playlistName.trim()) return;

    setPlaylists(prev => {
      const updated = { ...prev };
      if (!updated[playlistName]) {
        updated[playlistName] = [];
      }
      // Check if song already in playlist
      if (!updated[playlistName].find(f => f.videoId === showPlaylistModal.videoId)) {
        updated[playlistName].push(showPlaylistModal);
      }
      return updated;
    });
    setNewPlaylistName('');
    setShowPlaylistModal(null);
  };

  const handleDownload = (type) => {
    if (!songDetails) return;
    let url = `${SOCKET_SERVER_URL}/api/download?videoId=${songDetails.videoId}&title=${encodeURIComponent(getCleanTitle(songDetails.title))}`;
    if (type === 'video') url += '&format=video';
    window.open(url, '_blank');
  };

  const handlePlayCut = () => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(cutStart, true);
    playerRef.current.playVideo();
    setActiveCutEnd(cutEnd);
    if (socket) socket.emit('sync_play', { roomId, timestamp: cutStart });
  };

  const handlePlayQueueItem = (index) => {
    if (socket) {
      socket.emit('play_queue_item', { roomId, index });
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === toIndex) return;

    if (socket) {
      socket.emit('reorder_queue', { roomId, fromIndex: draggedIndex, toIndex });
    }

    // Optimistic update
    const newQueue = [...queue];
    const [movedItem] = newQueue.splice(draggedIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);
    setQueue(newQueue);

    setDraggedIndex(null);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, true);
      if (socket) {
        socket.emit('sync_play', { roomId, timestamp: newTime });
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVol);
    }
  };


  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleInvite = () => {
    const message = `🎧 Jump into my SpaceMusic pod!\nLet's vibe to some tracks together in perfect sync 🚀\n\nBase Coordinate (Room ID): ${roomId}\nJoin here: ${window.location.origin}`;
    navigator.clipboard.writeText(message);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  };

  // Generate dynamic progress bar gradient string
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressStyle = {
    background: `linear-gradient(to right, #a855f7 ${progressPercent}%, rgba(255, 255, 255, 0.1) ${progressPercent}%)`
  };

  return (
    <div className="app-container">
      <div className="main-content">

        {/* Left Sidebar */}
        <div className="sidebar glass-panel">
          <div className="logo-container">
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '20px', height: '2px', background: '#06b6d4', transform: 'rotate(-45deg)' }}></div>
            </div>
            <h1 className="logo-text">Space<span>Music</span></h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-16px', marginLeft: '44px' }}>Listen Together • Beyond Boundaries</p>
          <div className="room-card" style={{ cursor: 'pointer', marginTop: '-8px', marginBottom: '8px' }} onClick={() => setShowThemeSelector(true)}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>APPEARANCE</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={16} color="var(--accent-primary)" />
                {themes.find(t => t.id === currentTheme)?.name || 'Theme'}
              </div>
            </div>
          </div>

          <div className="room-card">
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>ROOM ID</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '2px' }}>{roomId}</div>
            </div>
            <button className="control-btn" onClick={() => navigator.clipboard.writeText(roomId)} title="Copy Room ID">
              <Copy size={18} />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} /> Listeners ({users.length})
            </h3>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {users.map((u, i) => (
                <div key={i} className="listener-item">
                  <div className="avatar">
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1rem' }}>{u.username.charAt(0).toUpperCase()}</span>
                    <div className="status-dot"></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="text-truncate">{u.username} {u.username === username ? '(You)' : ''}</span>
                      {i === 0 && <span style={{ color: '#fbbf24', fontSize: '0.8rem' }}>👑</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {i === 0 ? 'Listening now' : 'Online'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={handleInvite} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s' }}>
            <UserPlus size={18} /> {inviteCopied ? 'Invite Copied!' : 'Invite Friends'}
          </button>
        </div>

        {/* Center Main View */}
        <div className="center-view glass-panel">

          <div className="search-container" style={{ position: 'relative' }}>
            <form onSubmit={handleSearch}>
              <Search className="search-icon" size={20} style={{ zIndex: 10, pointerEvents: 'none' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search a song or paste a direct YouTube link..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchError(''); }}
              />
            </form>
            {searchError && (
              <div style={{ position: 'absolute', top: '100%', left: '0', width: '100%', marginTop: '8px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', zIndex: 10 }}>
                {searchError}
              </div>
            )}
          </div>

          <div className="center-scroll">
            {searchResults.length > 0 ? (
              <div style={{ width: '100%', maxWidth: '700px' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Search Results</h3>
                {searchResults.map(item => (
                  <div key={item.id.videoId} className="queue-item" onClick={() => handleAddToQueue(item)} style={{ background: 'var(--card-bg)', marginBottom: '12px', cursor: 'pointer' }}>
                    <img src={item.snippet.thumbnails.default.url} alt="thumbnail" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-truncate" style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>{getCleanTitle(item.snippet.title)}</div>
                      <div className="text-truncate" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.snippet.channelTitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%' }}>
                {currentSong ? (
                  <div className="active-song-card" style={{ position: 'relative', width: '100%' }}>
                    <div className="artwork-container">
                      {/* Audio Mode Image */}
                      <img
                        src={songDetails ? songDetails.thumbnail : `https://img.youtube.com/vi/${currentSong}/maxresdefault.jpg`}
                        alt="Album Art"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: isVideoMode ? 0 : 1,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          transition: 'opacity 0.3s ease',
                          zIndex: 1
                        }}
                      />

                      {/* Video Player */}
                      <div style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 2,
                        opacity: isVideoMode ? 1 : 0,
                        pointerEvents: isVideoMode ? 'auto' : 'none',
                        transition: 'opacity 0.3s ease'
                      }}>
                        {/* Glass Shield to block ALL clicks to YouTube */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, background: 'transparent' }} />
                        <YouTube
                          videoId={currentSong}
                          opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, controls: 0, modestbranding: 1, disablekb: 1, fs: 0, rel: 0, iv_load_policy: 3 } }}
                          onReady={onPlayerReady}
                          onStateChange={onStateChange}
                          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                        />
                        {/* Premium Illusion Badge */}
                        {isVideoMode && (
                          <div style={{
                            position: 'absolute',
                            bottom: '16px',
                            right: '16px',
                            zIndex: 11,
                            background: 'rgba(10, 10, 15, 0.7)',
                            backdropFilter: 'blur(10px)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            pointerEvents: 'none',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                          }}>
                            <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e', animation: 'pulse 2s infinite' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ color: 'var(--text-primary)', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                                SPACEMUSIC AUDIO ENGINE
                              </span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: '500', textTransform: 'uppercase' }}>
                                Visuals synced via YouTube API
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '8px', position: 'relative' }}>
                        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
                          <h2 className="text-truncate" style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600' }}>
                            {songDetails ? getCleanTitle(songDetails.title) : 'Playing Song...'}
                          </h2>
                        </div>
                        <div style={{ position: 'absolute', right: '0' }}>
                          <Heart
                            size={24}
                            color="#ec4899"
                            fill={songDetails && favorites.find(f => f.videoId === songDetails.videoId) ? "#ec4899" : "transparent"}
                            style={{ cursor: 'pointer', filter: 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.5))' }}
                            onClick={() => toggleFavorite(songDetails)}
                          />
                        </div>
                      </div>
                      <div className="genre-pills">
                        <span className="pill">Chill</span>
                        <span className="pill">Electronic</span>
                        <span className="pill">Lo-Fi</span>
                        <span className="pill">Space</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--item-hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                      <Search size={40} color="#a855f7" />
                    </div>
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Search for a song to start listening</h2>
                    <p style={{ fontSize: '0.9rem' }}>Find your next track and listen together with your room.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Queue / Lyrics Sidebar */}
        <div className="queue-sidebar glass-panel">

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
              <ListVideo size={18} />
            </button>
            <button className={`tab-btn ${rightTab === 'favorites' ? 'active' : ''}`} onClick={() => { setRightTab('favorites'); setActivePlaylist(null); }} style={{ position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none' }}>
              <Heart size={18} />
            </button>
            <button className={`tab-btn ${rightTab === 'playlists' ? 'active' : ''}`} onClick={() => { setRightTab('playlists'); setActivePlaylist(null); }} style={{ position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none' }}>
              <ListPlus size={18} />
            </button>
            <button className={`tab-btn ${rightTab === 'lyrics' ? 'active' : ''}`} onClick={() => { setRightTab('lyrics'); setActivePlaylist(null); }} style={{ position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none' }}>
              <Mic2 size={18} />
            </button>
            <button className={`tab-btn ${rightTab === 'cut' ? 'active' : ''}`} onClick={() => { setRightTab('cut'); setActivePlaylist(null); }} style={{ position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none' }}>
              <Scissors size={18} />
            </button>
          </div>
          <div key={rightTab} className="fade-in-content">

          {rightTab === 'favorites' ? (
            <div className="queue-list" style={{ display: 'flex', flexDirection: 'column' }}>
              {favorites.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '3rem' }}>
                  No favorites yet.<br /><br />Click the heart icon to save songs!
                </div>
              ) : (
                favorites.map((item, index) => (
                  <div key={index} className="queue-item" onClick={() => handleAddToQueue(item)}>
                    <img src={item.thumbnail} alt="thumb" style={{ cursor: 'pointer' }} />
                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                      <div className="text-truncate" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {getCleanTitle(item.title)}
                      </div>
                      <div className="text-truncate" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {item.channel}
                      </div>
                    </div>
                    <Heart
                      size={16}
                      color="#ec4899"
                      fill="#ec4899"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                ))
              )}
            </div>
          ) : rightTab === 'playlists' ? (
            <div className="queue-list" style={{ display: 'flex', flexDirection: 'column' }}>
              {!activePlaylist ? (
                <>
                  {Object.keys(playlists).length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '3rem' }}>
                      No saved playlists.<br /><br />Click the '+' icon on a song to create one!
                    </div>
                  ) : (
                    Object.keys(playlists).map((playlistName, idx) => (
                      <div key={idx} className="queue-item" onClick={() => setActivePlaylist(playlistName)} style={{ cursor: 'pointer' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--item-active-shadow)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ListPlus size={20} color="#a855f7" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, marginLeft: '12px' }}>
                          <div className="text-truncate" style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {playlistName}
                          </div>
                          <div className="text-truncate" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {playlists[playlistName].length} songs
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', cursor: 'pointer' }} onClick={() => setActivePlaylist(null)}>
                    <ChevronLeft size={20} color="#a855f7" />
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', marginLeft: '4px' }}>Back</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginLeft: 'auto' }}>{activePlaylist}</span>
                  </div>
                  {playlists[activePlaylist].length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>Empty Playlist</div>
                  ) : (
                    playlists[activePlaylist].map((item, index) => (
                      <div key={index} className="queue-item" onClick={() => handleAddToQueue(item)}>
                        <img src={item.thumbnail} alt="thumb" style={{ cursor: 'pointer' }} />
                        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                          <div className="text-truncate" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {getCleanTitle(item.title)}
                          </div>
                          <div className="text-truncate" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {item.channel}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          ) : rightTab === 'cut' ? (
            <div className="queue-list" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Song Cut Editor</h3>
              {currentSong ? (
                <>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Start Time (seconds)</div>
                  <input type="number" value={cutStart} onChange={e => setCutStart(Number(e.target.value))} style={{ background: 'var(--item-hover-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '10px', borderRadius: '8px', marginBottom: '16px' }} />

                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>End Time (seconds)</div>
                  <input type="number" value={cutEnd} onChange={e => setCutEnd(Number(e.target.value))} style={{ background: 'var(--item-hover-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '10px', borderRadius: '8px', marginBottom: '24px' }} />

                  <button onClick={handlePlayCut} style={{ background: 'var(--accent-primary)', border: 'none', color: 'var(--text-primary)', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Play size={16} /> Play Selection
                  </button>
                  <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    * This will play only the selected portion of the song to the whole room.<br /><br />
                    * <i>Note: Downloading a trimmed MP3 is not supported here as it requires heavy backend FFmpeg processing.</i>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>Play a song to edit it.</div>
              )}
            </div>
          ) : rightTab === 'queue' ? (
            <div className="queue-list" style={{ display: 'flex', flexDirection: 'column' }}>
              {queue.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '3rem' }}>
                  Queue is empty.<br /><br />Search and add songs!
                </div>
              ) : (
                queue.map((item, index) => (
                  <div
                    key={index}
                    className="queue-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{
                      opacity: draggedIndex === index ? 0.5 : 1,
                      cursor: 'grab'
                    }}
                  >
                    <div style={{ width: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <img src={item.thumbnail} alt="thumb" onClick={() => handlePlayQueueItem(index)} style={{ cursor: 'pointer' }} />
                    <div style={{ flex: 1, minWidth: 0 }} onClick={() => handlePlayQueueItem(index)}>
                      <div className="text-truncate" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', cursor: 'pointer' }}>
                        {getCleanTitle(item.title)}
                      </div>
                      <div className="text-truncate" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        {item.channel}
                      </div>
                    </div>
                    <GripVertical size={16} color="#555" style={{ cursor: 'grab' }} />
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="queue-list" style={{ padding: '0 12px', whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {lyrics.loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem' }}>Searching the universe for lyrics...</div>
              ) : lyrics.synced ? (
                <div style={{ paddingBottom: '2rem' }}>
                  {lyrics.synced.map((line, idx) => {
                    const nextLine = lyrics.synced[idx + 1];
                    // Line is active if the current time is past this line's time, AND before the next line's time.
                    // Or if it's the first line and we are still in the intro.
                    const isActive = (currentTime >= line.time && (!nextLine || currentTime < nextLine.time)) || (idx === 0 && currentTime < line.time);

                    return (
                      <div
                        key={idx}
                        id={isActive ? "active-lyric-line" : ""}
                        style={{
                          color: isActive ? 'var(--text-primary)' : 'rgba(255,255,255,0.3)',
                          fontSize: isActive ? '1.15rem' : '0.95rem',
                          fontWeight: isActive ? 'bold' : 'normal',
                          textShadow: isActive ? '0 0 15px rgba(168, 85, 247, 0.8)' : 'none',
                          transition: 'all 0.3s ease',
                          padding: '6px 0',
                          transform: isActive ? 'scale(1.02)' : 'scale(1)'
                        }}
                      >
                        {line.text}
                      </div>
                    );
                  })}
                </div>
              ) : lyrics.plain ? (
                <div style={{ paddingBottom: '2rem' }}>{lyrics.plain}</div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem' }}>Play a song to see lyrics.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Bottom Music Player */}
      <div className="bottom-player glass-panel">
        <div className="player-left">
          {currentSong ? (
            <>
              <img src={songDetails ? songDetails.thumbnail : `https://img.youtube.com/vi/${currentSong}/default.jpg`} alt="Now Playing" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-truncate" style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{songDetails ? getCleanTitle(songDetails.title) : '...'}</div>
                <div className="text-truncate" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{songDetails ? songDetails.channel : '...'}</div>
              </div>
              <Heart
                size={18}
                color={songDetails && favorites.find(f => f.videoId === songDetails.videoId) ? "#ec4899" : "var(--text-secondary)"}
                fill={songDetails && favorites.find(f => f.videoId === songDetails.videoId) ? "#ec4899" : "transparent"}
                style={{ cursor: 'pointer', marginLeft: '8px' }}
                onClick={() => toggleFavorite(songDetails)}
              />
              <ListPlus
                size={18}
                color="var(--text-secondary)"
                style={{ cursor: 'pointer', marginLeft: '8px' }}
                onClick={() => setShowPlaylistModal(songDetails)}
              />
              <Download
                size={18}
                color="var(--text-secondary)"
                style={{ cursor: 'pointer', marginLeft: '8px' }}
                onClick={() => handleDownload('audio')}
                title="Download Audio (MP3)"
              />
              <Film
                size={18}
                color="var(--text-secondary)"
                style={{ cursor: 'pointer', marginLeft: '8px' }}
                onClick={() => handleDownload('video')}
                title="Download Video (MP4)"
              />
              <MoreHorizontal size={18} color="var(--text-secondary)" style={{ cursor: 'pointer', marginLeft: '8px' }} />
            </>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No track playing</div>
          )}
        </div>
        <div className="player-center">
          <div className="player-controls">
            <button className="control-btn" onClick={handleShuffle} title="Shuffle Queue"><Shuffle size={18} /></button>
            <button className="control-btn" onClick={skipBackward10} title="Rewind 10s"><Rewind size={22} fill="currentColor" /></button>
            <button className="control-btn play-circle-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={20} fill="var(--text-primary)" /> : <Play size={20} fill="var(--text-primary)" style={{ marginLeft: '4px' }} />}
            </button>
            <button className="control-btn" onClick={skipForward10} title="Forward 10s"><FastForward size={22} fill="currentColor" /></button>
            <button className="control-btn" onClick={handleToggleLoop} title="Toggle Loop">
              <Repeat size={18} color={loopMode > 0 ? 'var(--accent-primary)' : 'currentColor'} />
              {loopMode === 1 && <span style={{ position: 'absolute', fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '2px' }}>1</span>}
              {loopMode === 2 && <span style={{ position: 'absolute', fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '2px' }}>A</span>}
            </button>
          </div>

          <div className="progress-container">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
              style={progressStyle}
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-right">
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
          <button
            className="video-mode-btn"
            onClick={() => setIsVideoMode(!isVideoMode)}
          >
            {isVideoMode ? <Headphones size={16} /> : <Video size={16} />}
            {isVideoMode ? 'Audio Mode' : 'Video Mode'}
          </button>
          <Maximize2 size={16} color="var(--text-secondary)" style={{ cursor: 'pointer', marginLeft: '8px' }} />
        </div>
      </div>

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
                <Camera size={24} /> Instagram
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

      {/* Save to Playlist Modal */}
      {showPlaylistModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#18181b', padding: '2rem', borderRadius: '16px', border: '1px solid #a855f7', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>Save to Playlist</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <img src={showPlaylistModal.thumbnail} alt="thumb" style={{ width: '60px', borderRadius: '8px' }} />
              <div className="text-truncate" style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>{getCleanTitle(showPlaylistModal.title)}</div>
            </div>

            {Object.keys(playlists).length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>EXISTING PLAYLISTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {Object.keys(playlists).map(pName => (
                    <button
                      key={pName}
                      onClick={() => handleSaveToPlaylist(pName)}
                      style={{ background: 'var(--item-hover-bg)', border: 'none', color: 'var(--text-primary)', padding: '10px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    >
                      {pName}
                      {playlists[pName].find(f => f.videoId === showPlaylistModal.videoId) && <Heart size={14} color="#a855f7" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>CREATE NEW PLAYLIST</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name..."
                style={{ flex: 1, background: 'var(--item-hover-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '10px', borderRadius: '8px' }}
                onKeyDown={e => e.key === 'Enter' && handleSaveToPlaylist(newPlaylistName)}
              />
              <button
                onClick={() => handleSaveToPlaylist(newPlaylistName)}
                style={{ background: 'var(--accent-primary)', border: 'none', color: 'var(--text-primary)', padding: '0 16px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <Plus size={18} />
              </button>
            </div>

            <button
              onClick={() => setShowPlaylistModal(null)}
              style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '10px', borderRadius: '8px', marginTop: '16px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showThemeSelector && (
        <ThemeSelector
          currentTheme={currentTheme}
          onThemeSelect={setCurrentTheme}
          onClose={() => setShowThemeSelector(false)}
        />
      )}

    </div>
  );
}
