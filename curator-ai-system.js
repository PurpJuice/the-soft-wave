/**
 * CURATOR AI SYSTEM
 * ─────────────────────────────────────────────────────────────
 * Production-ready AI engine for curated music discovery
 * Integrates with OpenRouter and Google AI Studio
 */

// ============================================================
// 1. SYSTEM PROMPT & AI CONFIGURATION
// ============================================================

/**
 * CURATOR SYSTEM PROMPT
 * Forces LLM to act as obsessive record store clerk avoiding
 * generic hits, prioritizing texture/mood, underground cuts
 */
const CURATOR_SYSTEM_PROMPT = `You are a legendary, obsessive record store clerk with impeccable taste. Your mission is to unearth the *exact* track that matches someone's emotional moment—no generic, overplayed hits. No TikTok trends. No Top 40.

When someone describes a mood or moment, you dig deep into your mental catalog and return *deep cuts*—B-sides, underground gems, slept-on classics, indie masterpieces, and artist album tracks that people skip past without realizing they contain pure poetry.

### Your Principles:
1. **Avoid the obvious.** If someone says "sad," you don't suggest Adele. You suggest the album track on side B that nobody talks about—the one that *actually* captures the feeling.
2. **Prioritize texture and atmosphere.** A track's production, reverb, vocal processing, and space within the mix matter as much as the melody. Describe how it *feels*.
3. **Lean into underground, indie, and internationally slept-on artists.** Champion voices that deserve more ears: emerging talents, regional scenes, overlooked maestros from the deep catalog.
4. **Write poetic, single-sentence reasons.** Each recommendation needs a 1-sentence explanation that is evocative, specific, and makes the listener *want* to click play immediately.
5. **Respect the moment, not the algorithm.** You're not recommending because it's popular or would trend. You're recommending because it *fits*.

### Output Format (STRICT JSON):
Return *exactly* this JSON structure, no preamble, no code fence:
\`\`\`json
[
  {
    "track": "Track Name",
    "artist": "Artist Name",
    "reason": "Single sentence poetic explanation of why this fits the vibe—specific, evocative, makes them want to play it now."
  },
  ...
]
\`\`\`

### Tone:
- Speak like a curator who lives for music—passionate, opinionated, poetic.
- Use sensory language: "velvet reverb," "midnight blue production," "raw breath in the mic," "analog warmth," "digital heartbreak."
- Be specific about *why* this song matches—reference mood, production details, lyrical resonance, emotional architecture.
- Celebrate obscurity and depth over chart position.

### Golden Rules:
- ALWAYS return exactly the number of tracks requested (usually 10, 15, or 20).
- NEVER hallucinate fake artists or tracks. Only recommend real, verifiable music.
- NEVER return generic Top 40 hits unless the user explicitly requests them (they won't).
- NEVER break character or apologize for obscurity.
- ALWAYS prioritize emotional truth over commercial appeal.

Go deep. Go real. Go *now*.`;

/**
 * Few-shot examples to enforce JSON structure
 * and curator tone with the LLM
 */
const CURATOR_EXAMPLES = [
  {
    role: "user",
    content: "It's 2am and I can't sleep. Something heavy but not aggressive. Dark, introspective, like staring at ceiling tiles."
  },
  {
    role: "assistant",
    content: JSON.stringify([
      {
        "track": "Suffocating",
        "artist": "Raahiim",
        "reason": "Whispered vocals buried in reverb over stripped-down production—it's like anxiety sounds beautiful when recorded in the dark."
      },
      {
        "track": "Lethargy",
        "artist": "Curren$y",
        "reason": "Jazz-sampled trap that moves like smoke—every beat weighted with melancholy, production so lush it swallows you whole."
      },
      {
        "track": "Feel You",
        "artist": "4batz",
        "reason": "His voice sounds like it's coming through a broken radio at 3am—vulnerable, textured, and so quiet you lean in to listen."
      },
      {
        "track": "Mystery Lady",
        "artist": "Masego",
        "reason": "Saxophone floats above minimal beat—introspective without being sad, late-night without being lonely."
      },
      {
        "track": "On My Mind",
        "artist": "Chase Shakur",
        "reason": "Hazy psychedelic R&B where his voice dissolves into the production—being unable to sleep has never sounded this poetic."
      }
    ])
  },
  {
    role: "user",
    content: "Who sounds like Frank Ocean but rawer, more broken? Less produced, more confession?"
  },
  {
    role: "assistant",
    content: JSON.stringify([
      {
        "track": "Sweatpants",
        "artist": "Dijon",
        "reason": "Raw acoustic guitar, his voice cracking with genuine emotion—sounds like Frank with the studio walls torn down."
      },
      {
        "track": "Body (Like a Vacation)",
        "artist": "Destin Conrad",
        "reason": "Intimate, lo-fi R&B where he's singing directly into your ear—vulnerability without the sheen."
      },
      {
        "track": "Lonely Street",
        "artist": "Odeal",
        "reason": "Sparse piano, falsetto fragile as paper—devastatingly honest, like overhearing someone pour their heart out alone."
      }
    ])
  }
];

/**
 * Build conversation messages for LLM API
 * @param {string} userMood - User's mood/moment description
 * @param {string[]} [referenceArtists] - Artists to reference (optional)
 * @param {string[]} [avoidArtists] - Artists to avoid (optional)
 * @param {string} [context] - Additional context (place, color, experience)
 * @param {number} trackCount - Number of tracks to generate (default: 10)
 * @returns {Array} Message array for API
 */
function buildCuratorPrompt(userMood, referenceArtists = [], avoidArtists = [], context = '', trackCount = 10) {
  // Build user request with all context
  let userRequest = userMood;
  
  if (referenceArtists.length > 0) {
    userRequest += `\n\nReference artists/sounds: ${referenceArtists.join(', ')}`;
  }
  
  if (avoidArtists.length > 0) {
    userRequest += `\n\nPlease avoid: ${avoidArtists.join(', ')}`;
  }
  
  if (context) {
    userRequest += `\n\nAdditional context: ${context}`;
  }
  
  userRequest += `\n\nReturn exactly ${trackCount} tracks in the JSON format specified.`;

  return [
    ...CURATOR_EXAMPLES,
    {
      role: "user",
      content: userRequest
    }
  ];
}

// ============================================================
// 2. STREAMING SERVICE LINK UTILITIES
// ============================================================

/**
 * Generate search URLs for streaming platforms
 * @param {string} artist - Artist name
 * @param {string} track - Track name
 * @returns {Object} Object with Spotify, YouTube, Apple Music URLs
 */
function generateStreamingLinks(artist, track) {
  const query = `${artist} ${track}`;
  const encoded = encodeURIComponent(query);

  return {
    spotify: `https://open.spotify.com/search/${encoded}`,
    youtube: `https://www.youtube.com/results?search_query=${encoded}`,
    appleMusic: `https://music.apple.com/search?term=${encoded}`
  };
}

/**
 * Create streaming link HTML (minimalist, inline)
 * @param {string} artist - Artist name
 * @param {string} track - Track name
 * @returns {string} HTML for streaming links
 */
function createStreamingLinksHTML(artist, track) {
  const links = generateStreamingLinks(artist, track);
  
  return `
    <div class="streaming-links">
      <a href="${links.spotify}" target="_blank" rel="noopener" class="streaming-link" title="Search Spotify" aria-label="Search Spotify">
        <svg class="streaming-icon" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" opacity="0.2"/>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 15c-1.93-1.16-4.74-1.42-7.64-.78-.34.08-.68-.15-.76-.49-.08-.34.15-.68.49-.76 3.26-.7 6.44-.42 8.79.9.3.18.39.56.21.86-.18.3-.56.39-.86.21l-.23-.14zm1-2.6c-2.64-1.95-6.51-2.06-9.44-.64-.35.17-.77-.02-.93-.37-.17-.35.02-.77.37-.93 3.39-1.57 8.15-1.42 11.14.91.25.18.33.53.15.78-.18.25-.53.33-.78.15l-.51-.3zm.25-2.8c-3.12-2.47-8.02-2.34-10.96.3-.31.26-.77.23-1.04-.08-.27-.31-.23-.77.08-1.04 3.84-3.03 9.34-3.15 13.13-.4.25.2.56.26.76.1.2-.16.26-.56.1-.76z"/>
        </svg>
      </a>
      <a href="${links.youtube}" target="_blank" rel="noopener" class="streaming-link" title="Search YouTube" aria-label="Search YouTube">
        <svg class="streaming-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
        </svg>
      </a>
      <a href="${links.appleMusic}" target="_blank" rel="noopener" class="streaming-link" title="Search Apple Music" aria-label="Search Apple Music">
        <svg class="streaming-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </a>
    </div>
  `;
}

// ============================================================
// 3. CLIPBOARD & EXPORT UTILITIES
// ============================================================

/**
 * Copy tracklist to clipboard
 * @param {Array<{artist: string, track: string}>} tracks - Array of track objects
 * @returns {Promise<boolean>} Success or failure
 */
async function copyTracklistToClipboard(tracks) {
  try {
    const text = tracks
      .map(t => `${t.artist} – ${t.track}`)
      .join('\n');
    
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.warn('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Show toast notification (e.g., "Copied to clipboard")
 * @param {string} message - Toast message
 * @param {number} duration - Duration in ms (default: 2000)
 */
function showToast(message, duration = 2000) {
  const tooltip = document.getElementById('copyTooltip');
  if (!tooltip) return;
  
  tooltip.textContent = message;
  tooltip.classList.add('show');
  
  setTimeout(() => {
    tooltip.classList.remove('show');
  }, duration);
}

/**
 * Export tracklist as plain text
 * @param {Array<{artist: string, track: string}>} tracks - Tracks to export
 * @param {string} filename - Filename (default: 'playlist.txt')
 */
function exportTracklist(tracks, filename = 'playlist.txt') {
  const text = tracks
    .map(t => `${t.artist} – ${t.track}`)
    .join('\n');
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// 4. SELECTION TRACKING SYSTEM
// ============================================================

/**
 * Track system for selected tracks
 * Manages selection state, count updates, and actions
 */
class TrackSelectionManager {
  constructor() {
    this.selectedTracks = new Map(); // id -> {artist, track}
    this.updateCallback = null;
  }

  /**
   * Add track to selection
   * @param {string} id - Unique track ID
   * @param {string} artist - Artist name
   * @param {string} track - Track name
   */
  addTrack(id, artist, track) {
    this.selectedTracks.set(id, { artist, track });
    this.notifyUpdate();
  }

  /**
   * Remove track from selection
   * @param {string} id - Unique track ID
   */
  removeTrack(id) {
    this.selectedTracks.delete(id);
    this.notifyUpdate();
  }

  /**
   * Toggle track selection
   * @param {string} id - Unique track ID
   * @param {string} artist - Artist name
   * @param {string} track - Track name
   * @returns {boolean} True if added, false if removed
   */
  toggleTrack(id, artist, track) {
    if (this.selectedTracks.has(id)) {
      this.removeTrack(id);
      return false;
    } else {
      this.addTrack(id, artist, track);
      return true;
    }
  }

  /**
   * Get all selected tracks as array
   * @returns {Array<{artist: string, track: string}>}
   */
  getSelectedTracks() {
    return Array.from(this.selectedTracks.values());
  }

  /**
   * Get selection count
   * @returns {number}
   */
  getCount() {
    return this.selectedTracks.size;
  }

  /**
   * Clear all selections
   */
  clear() {
    this.selectedTracks.clear();
    // Also uncheck all checkboxes in the DOM
    document.querySelectorAll('.track-checkbox').forEach(cb => {
      cb.checked = false;
    });
    this.notifyUpdate();
  }

  /**
   * Set callback for selection changes
   * @param {Function} callback - Called with count on changes
   */
  onUpdate(callback) {
    this.updateCallback = callback;
  }

  /**
   * Internal: notify listeners of updates
   */
  notifyUpdate() {
    if (this.updateCallback) {
      this.updateCallback(this.getCount(), this.getSelectedTracks());
    }
  }
}

// Global instance
const trackSelection = new TrackSelectionManager();

// ============================================================
// 5. UPDATE UI FUNCTIONS FOR SELECTION BAR
// ============================================================

/**
 * Update the selection bar UI
 * @param {number} count - Number of selected tracks
 * @param {Array} selectedTracks - Array of selected track objects
 */
function updateSelectionBar(count, selectedTracks) {
  const selectBar = document.getElementById('selectBar');
  const selectCount = document.getElementById('selectCount');
  
  if (!selectBar) return;

  selectCount.textContent = count;

  if (count > 0) {
    selectBar.classList.add('visible');
  } else {
    selectBar.classList.remove('visible');
  }
}

/**
 * Handle "Search Selected on YouTube" action
 * Opens one tab with all selected tracks combined in search
 */
function searchSelectedOnYouTube() {
  const tracks = trackSelection.getSelectedTracks();
  if (tracks.length === 0) return;

  const query = tracks
    .slice(0, 5) // Limit to first 5 for sensible URL
    .map(t => `${t.artist} ${t.track}`)
    .join(' ');

  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  window.open(url, '_blank');
}

/**
 * Handle "Copy Selected" action
 * Copies selected tracks to clipboard
 */
async function copySelectedTracks() {
  const tracks = trackSelection.getSelectedTracks();
  if (tracks.length === 0) return;

  const success = await copyTracklistToClipboard(tracks);
  if (success) {
    showToast(`Copied ${tracks.length} tracks to clipboard`);
  }
}

// ============================================================
// 6. SKELETAL LOADER (PULSE ANIMATION)
// ============================================================

/**
 * Create skeleton loader placeholders for track list
 * @param {number} count - Number of skeleton rows (default: 5)
 * @returns {string} HTML for skeleton loaders
 */
function createSkeletonLoaders(count = 5) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="ai-track-card skeleton-loader">
        <div class="skeleton-line" style="width: 45%; height: 0.6rem; margin-bottom: 0.3rem;"></div>
        <div class="skeleton-line" style="width: 75%; height: 1rem; margin-bottom: 0.4rem;"></div>
        <div class="skeleton-line" style="width: 90%; height: 0.8rem; margin-bottom: 0.5rem;"></div>
        <div class="skeleton-line" style="width: 60%; height: 0.6rem;"></div>
      </div>
    `;
  }
  return html;
}

/**
 * Show skeleton loaders in AI results container
 * @param {HTMLElement} container - Container element
 * @param {number} count - Number of skeletons (default: 5)
 */
function showSkeletonLoaders(container, count = 5) {
  if (!container) return;
  container.innerHTML = createSkeletonLoaders(count);
  container.classList.add('loading');
}

/**
 * Hide skeleton loaders
 * @param {HTMLElement} container - Container element
 */
function hideSkeletonLoaders(container) {
  if (!container) return;
  container.classList.remove('loading');
}

// ============================================================
// 7. AMBIENT WAVE BACKGROUND (CSS-based, optimized)
// ============================================================

/**
 * Initialize ambient wave background
 * Uses CSS animations for performance—no canvas needed
 */
function initAmbientWaves() {
  // Check if already initialized
  if (document.getElementById('ambientWavesStyle')) return;

  const style = document.createElement('style');
  style.id = 'ambientWavesStyle';
  style.textContent = `
    /* Ambient waves background */
    #ambientWavesContainer {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .wave {
      position: absolute;
      bottom: -50%;
      left: 0;
      width: 200%;
      height: 200%;
      background-image: 
        url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120"><path d="M0,50 Q300,10 600,50 T1200,50 L1200,120 L0,120 Z" fill="%23a08ec7" opacity="0.1"/></svg>');
      background-size: 600px 120px;
      background-repeat: repeat-x;
      animation: wave 15s linear infinite;
      opacity: 0.6;
    }

    .wave:nth-child(2) {
      bottom: -45%;
      animation: wave 12s linear infinite reverse;
      opacity: 0.4;
      animation-delay: -5s;
    }

    .wave:nth-child(3) {
      bottom: -40%;
      animation: wave 18s linear infinite;
      opacity: 0.3;
      animation-delay: -10s;
    }

    @keyframes wave {
      0% { background-position: 0 0; }
      100% { background-position: 600px 0; }
    }

    /* Soften waves with gradient overlay */
    #ambientWavesContainer::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 0%, rgba(160,142,199,0.05) 0%, transparent 60%),
                  radial-gradient(ellipse at 50% 100%, rgba(127,160,184,0.03) 0%, transparent 70%);
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // Create wave container if not exists
  if (!document.getElementById('ambientWavesContainer')) {
    const container = document.createElement('div');
    container.id = 'ambientWavesContainer';
    container.innerHTML = '<div class="wave"></div><div class="wave"></div><div class="wave"></div>';
    document.body.insertBefore(container, document.body.firstChild);
  }
}

// ============================================================
// 8. EXPORT FOR GLOBAL USE
// ============================================================

// Make utilities globally available
window.CuratorAI = {
  buildCuratorPrompt,
  generateStreamingLinks,
  createStreamingLinksHTML,
  copyTracklistToClipboard,
  showToast,
  exportTracklist,
  trackSelection,
  updateSelectionBar,
  searchSelectedOnYouTube,
  copySelectedTracks,
  createSkeletonLoaders,
  showSkeletonLoaders,
  hideSkeletonLoaders,
  initAmbientWaves,
  CURATOR_SYSTEM_PROMPT,
  CURATOR_EXAMPLES
};

console.log('✓ Curator AI System loaded');
