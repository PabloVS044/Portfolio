import { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import './css/MusicWidget.css';

const playlist = [
  {
    id: 'wmMmfNNk11I',
    title: 'Self aware',
    artist: 'Tamper City',
    album: 'Self aware',
    duration: 181,
    cover: '/player/self-aware.jpg',
  },
  {
    id: 'f8X8v8F4qPI',
    title: 'Mutt',
    artist: 'Leon Thomas',
    album: 'Mutt',
    duration: 194,
    cover: '/player/mutt.jpg',
  },
  {
    id: 'CikjiSG8eRM',
    title: 'From Time',
    artist: 'Drake',
    album: 'Nothing Was the Same',
    duration: 323,
    cover: '/player/from-time.png',
  },
  {
    id: 'VT6NZBVguDM',
    title: 'Chicago',
    artist: 'Michael Jackson',
    album: 'XSCAPE',
    duration: 246,
    cover: '/player/chicago.jpg',
  },

  {
    id: 'NSCZ5awmH1U',
    title: 'Hvn on earth',
    artist: 'Lil Tecca',
    album: 'TEC',
    duration: 189,
    cover: '/player/hvn-on-earth.jpg',
  },
  {
    id: '1hA9vyUeKRs',
    title: 'Instant crush',
    artist: 'Daft Punk',
    album: 'Random Access Memories',
    duration: 340,
    cover: '/player/instant-crush.jpg',
  },
  {
    id: '07fhkAoCnig',
    title: 'The color violet',
    artist: 'Tory Lanez',
    album: 'Alone At Prom',
    duration: 253,
    cover: '/player/the-color-violet.jpg',
  },
  {
    id: 'x7g1ppGE1Xs',
    title: 'Disenchanted',
    artist: 'My Chemical Romance',
    album: 'The Black Parade',
    duration: 295,
    cover: '/player/disenchanted.png',
  },
  {
    id: 'ucN-iv4QVWw',
    title: 'Circles',
    artist: 'Pierce the Veil',
    album: 'Misadventures',
    duration: 315,
    cover: '/player/circles.jpg',
  },
  {
    id: 'x_xX3NvrHl0',
    title: 'Me Quieres Mal',
    artist: 'Jesse Baez',
    album: 'Me Quieres Mal',
    duration: 219,
    cover: '/player/me-quieres-mal.jpg',
  },
  {
    id: 'kbOghDaL_h0',
    title: 'En el Suelo',
    artist: 'Kidd Voodoo',
    album: 'En el Suelo',
    duration: 266,
    cover: '/player/en-el-suelo.jpg',
  }
];

function formatTime(seconds) {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function IconButton({ active = false, large = false, onClick, label, children }) {
  const className = [
    'music-widget__icon-button',
    active ? 'music-widget__icon-button--active' : '',
    large ? 'music-widget__icon-button--large' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={className} onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />
    </svg>
  );
}

function SkipBackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h2v14H6zM18 6.5v11L9 12l9-5.5Z" fill="currentColor" />
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 5h2v14h-2zM6 6.5 15 12l-9 5.5v-11Z" fill="currentColor" />
    </svg>
  );
}

function MusicNoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>
  );
}

function VolumeOnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 9h4l5-4v14l-5-4H5zM18 9.2a4 4 0 0 1 0 5.6M19.9 6.5a7.5 7.5 0 0 1 0 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 9h4l5-4v14l-5-4H5zM18 9l4 6M22 9l-4 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MusicWidget() {
  const [shuffledPlaylist] = useState(() => {
    const shuffled = [...playlist];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const currentTrack = shuffledPlaylist[currentTrackIndex] || playlist[0];

  const cycleTrack = direction => {
    setCurrentTrackIndex(index => {
      if (direction === 'previous') {
        return index === 0 ? shuffledPlaylist.length - 1 : index - 1;
      }
      return index === shuffledPlaylist.length - 1 ? 0 : index + 1;
    });
    setProgress(0);
    setCurrentTime(0);
  };

  const onReady = (event) => {
    const ytPlayer = event.target;
    setPlayer(ytPlayer);
    
    const vol = isMuted ? 0 : volume;
    ytPlayer.setVolume(vol);
    
    // We don't autoplay initially unless user clicked play
    if (isPlaying) {
      ytPlayer.playVideo();
    }
  };

  const onStateChange = (event) => {
    // 1: playing, 2: paused, 0: ended, 5: cued
    if (event.data === 1) {
      setIsPlaying(true);
      const dur = event.target.getDuration();
      if (dur > 0) setDuration(dur);
    } else if (event.data === 2) {
      setIsPlaying(false);
    } else if (event.data === 0) {
      cycleTrack('next');
    } else if (event.data === 5 || event.data === -1) {
      if (isPlaying) {
        setTimeout(() => event.target.playVideo(), 100);
      }
    }
  };

  // Sync play state
  useEffect(() => {
    if (player && typeof player.playVideo === 'function') {
      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  }, [isPlaying, player]);

  // Autoplay workaround: Start on first user interaction anywhere on the page
  useEffect(() => {
    if (!player) return;

    const handleFirstInteraction = () => {
      // Force play state on first click anywhere
      setIsPlaying(true);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [player]);

  // Sync volume state
  useEffect(() => {
    if (player && typeof player.setVolume === 'function') {
      if (isMuted) {
        player.mute();
      } else {
        player.unMute();
        player.setVolume(volume);
      }
    }
  }, [volume, isMuted, player]);

  // Progress timer
  useEffect(() => {
    let interval;
    if (isPlaying && player && typeof player.getCurrentTime === 'function') {
      interval = setInterval(async () => {
        try {
          const time = await player.getCurrentTime();
          setCurrentTime(time);
          const dur = await player.getDuration();
          if (dur > 0) {
            setProgress((time / dur) * 100);
            setDuration(dur);
          }
        } catch (e) {
          // Ignore errors
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, player]);

  const handleSeek = event => {
    const nextProgress = Number(event.target.value);
    setProgress(nextProgress);
    if (player && duration > 0 && typeof player.seekTo === 'function') {
      const time = (nextProgress / 100) * duration;
      player.seekTo(time, true);
      setCurrentTime(time);
    }
  };

  const progressStyle = {
    '--range-progress': `${progress}%`,
  };

  const volumeValue = isMuted ? 0 : volume;
  const volumeStyle = {
    '--range-progress': `${volumeValue}%`,
  };

  return (
    <aside className="music-widget" aria-label="Music player widget">
      <div className="music-widget__glow" aria-hidden="true"></div>

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0.01, pointerEvents: 'none' }}>
        <YouTube
          videoId={currentTrack.id}
          opts={{
            height: '200',
            width: '200',
            playerVars: { autoplay: 1, controls: 0 }
          }}
          onReady={onReady}
          onStateChange={onStateChange}
          onError={(e) => {
            console.log('YouTube Error:', e.data);
          }}
        />
      </div>

      <section className="music-widget__window">
        <div className="music-widget__body">
          <div className="music-widget__header">
            <div className="music-widget__cover-wrap">
              <img
                src={currentTrack.cover}
                alt={currentTrack.album}
                className={`music-widget__cover ${isPlaying ? 'music-widget__cover--playing' : ''}`}
              />
              <span className="music-widget__cover-ring" aria-hidden="true"></span>
            </div>

            <div className="music-widget__copy">
              <div className="music-widget__track">
                <h2>{currentTrack.title}</h2>
                <p>{currentTrack.artist}</p>
                <span>{currentTrack.album}</span>
              </div>
            </div>
          </div>

          <div className="music-widget__controls">
            <IconButton onClick={() => cycleTrack('previous')} label="Previous track">
              <SkipBackIcon />
            </IconButton>

            <IconButton
              large={true}
              onClick={() => setIsPlaying(previous => !previous)}
              label={isPlaying ? 'Pause playback' : 'Start playback'}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>

            <IconButton onClick={() => cycleTrack('next')} label="Next track">
              <SkipForwardIcon />
            </IconButton>
          </div>

          <div className="music-widget__progress-block">
            <div className="music-widget__time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || currentTrack.duration)}</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleSeek}
              className="music-widget__range"
              style={progressStyle}
              aria-label="Track progress"
            />
          </div>

          <div className="music-widget__footer">
            <button
              type="button"
              className="music-widget__volume-button"
              onClick={() => setIsMuted(previous => !previous)}
              aria-label={isMuted || volumeValue === 0 ? 'Unmute' : 'Mute'}
            >
              {isMuted || volumeValue === 0 ? <VolumeOffIcon /> : <VolumeOnIcon />}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={volumeValue}
              onChange={event => {
                const nextVolume = Number(event.target.value);
                setVolume(nextVolume);
                setIsMuted(nextVolume === 0);
              }}
              className="music-widget__range music-widget__range--volume"
              style={volumeStyle}
              aria-label="Volume"
            />
          </div>
        </div>
      </section>
    </aside>
  );
}
