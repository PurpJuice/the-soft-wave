/**
 * CURATOR AI SYSTEM — QUICK START & CODE EXAMPLES
 * ════════════════════════════════════════════════════════════
 * Copy-paste ready examples for common use cases
 */

// ════════════════════════════════════════════════════════════
// 1. STREAMING LINKS — Add to Any Track Display
// ════════════════════════════════════════════════════════════

/**
 * Example: Render a track card with streaming icons
 */
function renderTrackWithStreamingLinks(artist, track) {
  const links = CuratorAI.createStreamingLinksHTML(artist, track);
  
  const html = `
    <div class="track-card">
      <h3>${artist}</h3>
      <p>${track}</p>
      ${links}
    </div>
  `;
  
  return html;
}

// Usage:
const trackHtml = renderTrackWithStreamingLinks("Frank Ocean", "Nights");
document.getElementById('container').innerHTML = trackHtml;


// ════════════════════════════════════════════════════════════
// 2. SELECTION TRACKING — Checkbox Integration
// ════════════════════════════════════════════════════════════

/**
 * Example: Create a track list with checkboxes
 */
function renderSelectableTracks(tracks) {
  return tracks.map((t, i) => `
    <div class="track-item">
      <input 
        type="checkbox" 
        class="track-checkbox"
        id="track-${i}"
        onchange="CuratorAI.trackSelection.toggleTrack(
          'track-${i}',
          '${t.artist.replace(/'/g, "\\'")}',
          '${t.track.replace(/'/g, "\\'")}'
        )"
      >
      <label for="track-${i}">
        <strong>${t.artist}</strong> — ${t.track}
      </label>
    </div>
  `).join('');
}

// Usage:
const tracks = [
  { artist: "Frank Ocean", track: "Nights" },
  { artist: "Daniel Caesar", track: "Get You" },
  { artist: "SZA", track: "The Weekend" }
];

document.getElementById('playlist').innerHTML = renderSelectableTracks(tracks);

// Listen for selection changes
CuratorAI.trackSelection.onUpdate((count, selected) => {
  console.log(`${count} tracks selected:`);
  selected.forEach(t => console.log(`  • ${t.artist} – ${t.track}`));
});


// ════════════════════════════════════════════════════════════
// 3. COPY TO CLIPBOARD WITH TOAST
// ════════════════════════════════════════════════════════════

/**
 * Example: Copy selected tracks on button click
 */
async function handleCopySelection() {
  const tracks = CuratorAI.trackSelection.getSelectedTracks();
  
  if (tracks.length === 0) {
    CuratorAI.showToast('Select tracks first', 2000);
    return;
  }

  const success = await CuratorAI.copyTracklistToClipboard(tracks);
  
  if (success) {
    CuratorAI.showToast(`✓ Copied ${tracks.length} tracks`, 2500);
  } else {
    CuratorAI.showToast('Failed to copy', 2000);
  }
}

// Usage:
// <button onclick="handleCopySelection()">Copy Selected</button>


// ════════════════════════════════════════════════════════════
// 4. SKELETON LOADERS — Loading States
// ════════════════════════════════════════════════════════════

/**
 * Example: Show loaders while fetching, then render tracks
 */
async function loadAndRenderTracks(playlistId) {
  const container = document.getElementById('ai-results');
  
  // 1. Show skeleton loaders
  CuratorAI.showSkeletonLoaders(container, 10);
  
  try {
    // 2. Fetch data
    const response = await fetch(`/api/playlist/${playlistId}`);
    const { tracks } = await response.json();
    
    // 3. Hide skeletons and render real content
    CuratorAI.hideSkeletonLoaders(container);
    renderAiTracks(tracks, 'ai-results');
    
  } catch (error) {
    CuratorAI.hideSkeletonLoaders(container);
    container.innerHTML = `<p style="color: var(--red);">Failed to load: ${error.message}</p>`;
  }
}

// Usage:
// <button onclick="loadAndRenderTracks('playlist-123')">Load</button>


// ════════════════════════════════════════════════════════════
// 5. LLM INTEGRATION — Build Curator Prompts
// ════════════════════════════════════════════════════════════

/**
 * Example: Generate playlist with LLM using curator system prompt
 */
async function generatePlaylistWithCurator(mood) {
  // Build prompt with curator tone
  const messages = CuratorAI.buildCuratorPrompt(
    mood,
    ["Frank Ocean", "Daniel Caesar"],    // Reference vibe artists
    ["Drake", "Post Malone"],            // Avoid these
    "2am in my room, can't sleep",       // Context/place
    15                                   // Track count
  );

  try {
    // Call your LLM (OpenRouter, Gemini, etc.)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: messages,
        temperature: 0.85,
        max_tokens: 2000
      })
    });

    const { choices } = await response.json();
    const reply = choices[0].message.content;
    
    // Parse JSON response
    const tracks = JSON.parse(reply);
    
    // Render with selection tracking
    renderAiTracks(tracks, 'ai-results');
    
  } catch (error) {
    console.error('LLM call failed:', error);
  }
}

// Usage:
// <button onclick="generatePlaylistWithCurator('late night heartbreak')">
//   Generate Playlist
// </button>


// ════════════════════════════════════════════════════════════
// 6. SEARCH ACTIONS — YouTube / Link Opening
// ════════════════════════════════════════════════════════════

/**
 * Example: Search selected tracks on YouTube
 */
function searchSelectedOnYouTube() {
  const tracks = CuratorAI.trackSelection.getSelectedTracks();
  
  if (tracks.length === 0) {
    alert('Select tracks first');
    return;
  }

  // Build search query from first 5 tracks
  const query = tracks
    .slice(0, 5)
    .map(t => `${t.artist} ${t.track}`)
    .join(' ');

  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  window.open(url, '_blank');
  
  CuratorAI.showToast(`Searching YouTube for ${Math.min(tracks.length, 5)} tracks`);
}

// Usage:
// <button onclick="searchSelectedOnYouTube()">
//   🎬 Search on YouTube
// </button>


// ════════════════════════════════════════════════════════════
// 7. EXPORT — Download Tracklist as File
// ════════════════════════════════════════════════════════════

/**
 * Example: Export selected tracks as .txt or .csv
 */
function exportSelectedTracks(format = 'txt') {
  const tracks = CuratorAI.trackSelection.getSelectedTracks();
  
  if (tracks.length === 0) {
    alert('Select tracks first');
    return;
  }

  let content = '';
  const timestamp = new Date().toLocaleDateString();
  
  if (format === 'txt') {
    // Plain text format
    content = `Playlist • ${timestamp}\n${'═'.repeat(40)}\n\n`;
    content += tracks
      .map((t, i) => `${i + 1}. ${t.artist} – ${t.track}`)
      .join('\n');
  } 
  else if (format === 'csv') {
    // CSV format (importable to spreadsheet apps)
    content = 'Artist,Track\n';
    content += tracks
      .map(t => `"${t.artist}","${t.track}"`)
      .join('\n');
  }
  else if (format === 'm3u') {
    // M3U format (playlist file)
    content = '#EXTM3U\n';
    content += tracks
      .map(t => `#EXTINF:-1,${t.artist} - ${t.track}\n`)
      .join('\n');
  }

  // Download
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `playlist_${Date.now()}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
  
  CuratorAI.showToast(`✓ Exported ${tracks.length} tracks`);
}

// Usage:
// <button onclick="exportSelectedTracks('txt')">Download (TXT)</button>
// <button onclick="exportSelectedTracks('csv')">Download (CSV)</button>
// <button onclick="exportSelectedTracks('m3u')">Download (M3U)</button>


// ════════════════════════════════════════════════════════════
// 8. AMBIENT WAVES — Initialization & Control
// ════════════════════════════════════════════════════════════

/**
 * Example: Manual ambient waves initialization & control
 */
function setupAmbientWaves() {
  // Initialize waves (happens automatically on page load, but can be manual)
  CuratorAI.initAmbientWaves();
  
  // Optional: Add controls to toggle waves
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = '🌊 Toggle Waves';
  toggleBtn.onclick = () => {
    const container = document.getElementById('ambientWavesContainer');
    container.style.opacity = container.style.opacity === '0' ? '1' : '0';
  };
  
  document.body.appendChild(toggleBtn);
}

// Usage: Call on app initialization


// ════════════════════════════════════════════════════════════
// 9. COMPLETE FLOW — Full Playlist Generation Pipeline
// ════════════════════════════════════════════════════════════

/**
 * Example: Complete flow from mood selection to export
 */
async function completePlaylistFlow(mood, referenceArtists, trackCount = 10) {
  const resultContainer = document.getElementById('ai-results');
  const statusEl = document.getElementById('status');

  try {
    // Step 1: Show loaders
    statusEl.textContent = 'Generating...';
    CuratorAI.showSkeletonLoaders(resultContainer, trackCount);

    // Step 2: Build curator prompt
    const messages = CuratorAI.buildCuratorPrompt(
      mood,
      referenceArtists,
      [],
      '',
      trackCount
    );

    // Step 3: Call LLM
    const reply = await callLLM(messages);
    const tracks = JSON.parse(reply);

    // Step 4: Render with selection
    CuratorAI.hideSkeletonLoaders(resultContainer);
    renderAiTracks(tracks, 'ai-results');
    statusEl.textContent = `✓ Generated ${tracks.length} tracks`;

    // Step 5: Auto-select top 3 as recommendation
    tracks.slice(0, 3).forEach((t, i) => {
      CuratorAI.trackSelection.addTrack(`track-${i}`, t.artist, t.track);
    });

    // Step 6: Show selection bar
    document.getElementById('selectBar').classList.add('visible');

  } catch (error) {
    CuratorAI.hideSkeletonLoaders(resultContainer);
    statusEl.textContent = `✗ Error: ${error.message}`;
  }
}

// Usage:
// completePlaylistFlow(
//   "it's 3am and I can't sleep",
//   ["Frank Ocean", "Daniel Caesar"],
//   15
// );


// ════════════════════════════════════════════════════════════
// 10. SELECTION MANAGER — Advanced Usage
// ════════════════════════════════════════════════════════════

/**
 * Example: Advanced selection state management
 */
class PlaylistManager {
  constructor() {
    this.currentPlaylist = null;
    this.setupSelectionTracking();
  }

  setupSelectionTracking() {
    CuratorAI.trackSelection.onUpdate((count, tracks) => {
      this.onSelectionChange(count, tracks);
    });
  }

  onSelectionChange(count, tracks) {
    // Update UI
    document.getElementById('selectCount').textContent = count;
    
    // Enable/disable actions
    const copyBtn = document.querySelector('[onclick*="copySelected"]');
    if (copyBtn) {
      copyBtn.disabled = count === 0;
      copyBtn.style.opacity = count === 0 ? '0.5' : '1';
    }

    // Store in local state
    this.currentSelection = tracks;

    // Log for analytics
    console.log(`Selection changed: ${count} tracks`);
  }

  async saveSelection(playlistName) {
    const tracks = CuratorAI.trackSelection.getSelectedTracks();
    
    if (tracks.length === 0) {
      alert('Select tracks first');
      return;
    }

    // Save to database/localStorage
    const playlist = {
      name: playlistName,
      tracks: tracks,
      created: new Date().toISOString()
    };

    // Example: save to localStorage
    const existing = JSON.parse(localStorage.getItem('my_playlists') || '[]');
    existing.push(playlist);
    localStorage.setItem('my_playlists', JSON.stringify(existing));

    CuratorAI.showToast(`✓ Saved "${playlistName}"`);
    CuratorAI.trackSelection.clear();
  }

  loadPlaylist(playlistName) {
    const playlists = JSON.parse(localStorage.getItem('my_playlists') || '[]');
    const playlist = playlists.find(p => p.name === playlistName);

    if (!playlist) {
      alert('Playlist not found');
      return;
    }

    CuratorAI.trackSelection.clear();
    playlist.tracks.forEach((t, i) => {
      CuratorAI.trackSelection.addTrack(`loaded-${i}`, t.artist, t.track);
    });

    CuratorAI.showToast(`✓ Loaded "${playlistName}"`);
  }
}

// Usage:
// const manager = new PlaylistManager();
// manager.saveSelection('Late Night Heartbreak');
// manager.loadPlaylist('Late Night Heartbreak');


// ════════════════════════════════════════════════════════════
// IMPLEMENTATION CHECKLIST
// ════════════════════════════════════════════════════════════

/*
 ✅ Load scripts in HTML:
   <link rel="stylesheet" href="curator-ui-styles.css">
   <script defer src="curator-ai-system.js"></script>

 ✅ Add ambient waves container:
   <div id="ambientWavesContainer">
     <div class="wave"></div>
     <div class="wave"></div>
     <div class="wave"></div>
   </div>

 ✅ Include selection bar in layout:
   <div class="select-bar" id="selectBar">
     <span><span id="selectCount">0</span> selected</span>
     <button onclick="CuratorAI.searchSelectedOnYouTube()">YouTube</button>
     <button onclick="CuratorAI.copySelectedTracks()">Copy</button>
   </div>

 ✅ Add checkboxes to track cards:
   <input type="checkbox" class="track-checkbox"
          onchange="CuratorAI.trackSelection.toggleTrack(...)">

 ✅ Include streaming link buttons:
   ${CuratorAI.createStreamingLinksHTML(artist, track)}

 ✅ Call initCuratorSystem() on page load:
   <script>
     if (typeof CuratorAI !== 'undefined') {
       CuratorAI.initAmbientWaves();
       CuratorAI.trackSelection.onUpdate(updateSelectionBar);
     }
   </script>
*/

// ════════════════════════════════════════════════════════════
// END QUICK START GUIDE
// ════════════════════════════════════════════════════════════

console.log('✓ Load this file for code examples and patterns');
