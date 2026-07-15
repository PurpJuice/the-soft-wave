/**
 * IMPLEMENTATION CHECKLIST
 * =======================
 * Step-by-step guide to integrate the complete curator system
 * into The Soft Wave application.
 * 
 * Estimated Time: 45-90 minutes (depending on existing code)
 * Difficulty: Intermediate
 */

// ============================================================================
// PHASE 1: FILE SETUP (5 minutes)
// ============================================================================

// ✓ STEP 1.1: Verify all files are created
// These files should now exist in your project directory:
/*
  ✓ curator-system-prompt.js          (3 KB)    - LLM system prompts
  ✓ curator-utils.js                  (8 KB)    - Core utilities
  ✓ spa-router.js                     (15 KB)   - Multi-page router
  ✓ curator-complete-styles.css       (12 KB)   - Complete styling
  ✓ curator-ai-system.js              (existing) - Track selection
  ✓ curator-ui-styles.css             (existing) - UI styles
  ✓ the-soft-wave.html                (MODIFY)  - Main HTML file
*/

// ✓ STEP 1.2: Verify directory structure
/*
  your-project-directory/
  ├── the-soft-wave.html                    (main file)
  ├── curator-system-prompt.js              (NEW)
  ├── curator-utils.js                      (NEW)
  ├── spa-router.js                         (NEW)
  ├── curator-ai-system.js                  (existing)
  ├── curator-ui-styles.css                 (existing)
  ├── curator-complete-styles.css           (NEW)
  └── images/
      ├── spotify-icon.svg
      ├── youtube-icon.svg
      └── apple-icon.svg
*/

// ============================================================================
// PHASE 2: HTML MODIFICATIONS (10 minutes)
// ============================================================================

// ✓ STEP 2.1: Add script tags to <head> (BEFORE closing </head>)
/*
Add in this EXACT ORDER with defer attribute:

<script defer src="curator-system-prompt.js"></script>
<script defer src="curator-utils.js"></script>
<script defer src="spa-router.js"></script>
<script defer src="curator-ai-system.js"></script>

Note: Your existing scripts should be loaded AFTER these.
      If you have app.js or main.js, ensure it loads last.
*/

// ✓ STEP 2.2: Add stylesheet to <head>
/*
<link rel="stylesheet" href="curator-complete-styles.css">

Place AFTER other stylesheets so it doesn't override critical styles.
*/

// ✓ STEP 2.3: Add ambient waves container to <body>
/*
Place this FIRST in <body>, before any other content:

<div id="ambientWavesContainer">
  <div class="wave"></div>
  <div class="wave"></div>
  <div class="wave"></div>
</div>
*/

// ✓ STEP 2.4: Update sidebar navigation buttons
/*
Add data-route attribute to all navigation buttons:

BEFORE:
<button class="nav-btn">Wave Generator</button>

AFTER:
<button class="nav-btn" data-route="generator">Wave Generator</button>

DO THIS FOR ALL NAVIGATION OPTIONS:
- data-route="generator"      (Wave Generator)
- data-route="archives"       (Saved Waves / My Archives)
- data-route="constellation"  (The Constellation)
- data-route="profile"        (Settings)

Example complete navigation:
<nav class="sidebar">
  <div class="sidebar-section">
    <h3>Navigation</h3>
    <button data-route="generator" class="nav-btn">
      <span class="icon">◈</span>
      <span>Wave Generator</span>
    </button>
    <button data-route="archives" class="nav-btn">
      <span class="icon">◈</span>
      <span>Saved Waves</span>
    </button>
    <button data-route="constellation" class="nav-btn">
      <span class="icon">◈</span>
      <span>The Constellation</span>
    </button>
    <button data-route="profile" class="nav-btn">
      <span class="icon">◈</span>
      <span>Settings</span>
    </button>
  </div>
</nav>
*/

// ✓ STEP 2.5: Verify main content area
/*
Ensure you have a <main> element or role="main" div:

<main role="main">
  <!-- Router will populate page containers here -->
</main>

OR:

<div role="main">
  <!-- Router will populate page containers here -->
</div>

The router automatically creates these page containers:
  - <div id="page-generator" class="page-container" data-page="generator">
  - <div id="page-archives" class="page-container" data-page="archives">
  - <div id="page-constellation" class="page-container" data-page="constellation">
  - <div id="page-profile" class="page-container" data-page="profile">
*/

// ============================================================================
// PHASE 3: JAVASCRIPT INITIALIZATION (15 minutes)
// ============================================================================

// ✓ STEP 3.1: Move existing generator UI into template
/*
Your current "Generate a Playlist" modal and "Discovery Chat" should
remain in the HTML but will be managed by the router.

Option A (RECOMMENDED): Keep existing structure
  - Leave current generator UI in the HTML as-is
  - Router will show/hide it using CSS display/visibility

Option B: Convert to template
  - Create a template for generator content
  - Router dynamically renders it

For now, use Option A to minimize changes.
*/

// ✓ STEP 3.2: Update "Generate" button handler
/*
Your current generate button needs to:
  1. Collect inputs (mood, artists, track count)
  2. Get curator density from settings
  3. Build API request
  4. Show skeleton loader
  5. Fetch from LLM
  6. Parse and render tracks
  7. Show success toast

Template:
async function generatePlaylist() {
  try {
    // 1. Collect inputs
    const mood = document.querySelector('[mood-input]').value;
    const artists = getSelectedArtists();
    const trackCount = parseInt(document.querySelector('[track-count]').value);
    const curatorDensity = window.SoftWaveRouterInstance.state.userSettings.curatorDensity;

    // 2. Validate
    if (!mood || artists.length === 0 || trackCount < 1) {
      window.CuratorUtils.showToastNotification('Please fill in all fields', 'warning');
      return;
    }

    // 3. Build prompt
    const userPrompt = `Generate ${trackCount} track recommendations for:
      Mood: ${mood}
      Artists: ${artists.join(', ')}`;

    // 4. Build request
    const request = window.CuratorUtils.CuratorAPIBuilder.buildRequest(
      userPrompt,
      curatorDensity
    );

    // 5. Show skeleton
    const container = document.querySelector('.tracks-container');
    container.innerHTML = getSkeletonHTML(5);

    // 6. Fetch
    const apiKey = window.SoftWaveRouterInstance.state.userSettings.apiKey;
    if (!apiKey) {
      throw new Error('API key not configured. Go to Settings to add one.');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    // 7. Parse
    const result = window.CuratorUtils.CuratorAPIBuilder.processResponse(
      await response.json()
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    // 8. Render
    const tracksHTML = result.tracks.map(track => renderTrackCard(track)).join('');
    container.innerHTML = tracksHTML;

    // 9. Save
    const wave = window.SoftWaveRouterInstance.saveWave({
      mood: mood,
      prompt: userPrompt,
      tracks: result.tracks
    });

    window.CuratorUtils.showToastNotification(
      `Generated ${result.tracks.length} tracks! Wave saved.`,
      'success'
    );

  } catch (error) {
    console.error('Generation failed:', error);
    window.CuratorUtils.showToastNotification(error.message, 'error');
  }
}
*/

// ✓ STEP 3.3: Create track rendering function
/*
function renderTrackCard(track) {
  const links = window.CuratorUtils.StreamingLinks.generateAll(
    track.artist,
    track.track
  );

  return `
    <div class="track-card">
      <div class="track-header">
        <h4 class="track-artist">${escapeHTML(track.artist)}</h4>
        <h3 class="track-name">${escapeHTML(track.track)}</h3>
      </div>
      <p class="track-reason">${escapeHTML(track.reason)}</p>
      <div class="track-actions">
        <a href="${links.spotify}" target="_blank" class="platform-link spotify" title="Search on Spotify">
          <img src="images/spotify-icon.svg" alt="Spotify">
        </a>
        <a href="${links.youtube}" target="_blank" class="platform-link youtube" title="Search on YouTube">
          <img src="images/youtube-icon.svg" alt="YouTube">
        </a>
        <a href="${links.appleMusic}" target="_blank" class="platform-link apple" title="Search on Apple Music">
          <img src="images/apple-icon.svg" alt="Apple Music">
        </a>
      </div>
      <div class="track-selection">
        <input 
          type="checkbox" 
          class="track-checkbox" 
          data-artist="${escapeAttr(track.artist)}"
          data-track="${escapeAttr(track.track)}"
          onchange="handleTrackSelection(this)"
        />
      </div>
    </div>
  `;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function handleTrackSelection(checkbox) {
  const artist = checkbox.dataset.artist;
  const track = checkbox.dataset.track;
  
  if (checkbox.checked) {
    window.CuratorAI.trackSelection.addTrack(artist, track);
  } else {
    window.CuratorAI.trackSelection.removeTrack(artist, track);
  }
}
*/

// ✓ STEP 3.4: Create skeleton HTML helper
/*
function getSkeletonHTML(count) {
  return Array(count).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-heading"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line" style="width: 80%;"></div>
      <div class="skeleton-track">
        <div class="skeleton-track-image"></div>
        <div class="skeleton-track-content">
          <div class="skeleton-text"></div>
          <div class="skeleton-text" style="width: 70%;"></div>
        </div>
      </div>
    </div>
  `).join('');
}
*/

// ============================================================================
// PHASE 4: USER SETTINGS INTEGRATION (10 minutes)
// ============================================================================

// ✓ STEP 4.1: Connect API key input
/*
The settings page in Profile has an input with id="api-key"
It automatically saves to:
  window.SoftWaveRouterInstance.state.userSettings.apiKey

When user changes it, it's persisted to localStorage.
You can retrieve it with:
  const apiKey = window.SoftWaveRouterInstance.state.userSettings.apiKey;
*/

// ✓ STEP 4.2: Use curator density in generation
/*
The slider on Profile page updates:
  window.SoftWaveRouterInstance.state.userSettings.curatorDensity

Values: 'mainstream' | 'balanced' | 'deep-cuts' | 'underground'

Pass it to API request:
  const density = window.SoftWaveRouterInstance.state.userSettings.curatorDensity;
  const request = window.CuratorUtils.CuratorAPIBuilder.buildRequest(
    userPrompt,
    density  // <-- This adjusts the LLM's approach
  );
*/

// ✓ STEP 4.3: Check settings before generating
/*
Add this validation to your generate button:

if (!window.SoftWaveRouterInstance.state.userSettings.apiKey) {
  window.CuratorUtils.showToastNotification(
    'Please add your API key in Settings first',
    'warning'
  );
  window.SoftWaveRouterInstance.navigate('profile');
  return;
}
*/

// ============================================================================
// PHASE 5: STREAMING LINKS & CLIPBOARD (5 minutes)
// ============================================================================

// ✓ STEP 5.1: Generate streaming links for each track
/*
Done automatically in renderTrackCard() function above.

For custom use:
  const links = window.CuratorUtils.StreamingLinks.generateAll('Daniel Caesar', 'Get You');
  console.log(links);
  // {
  //   spotify: "https://open.spotify.com/search/Daniel%20Caesar%20Get%20You",
  //   youtube: "https://www.youtube.com/results?search_query=Daniel%20Caesar%20Get%20You",
  //   appleMusic: "https://music.apple.com/search?term=Daniel%20Caesar%20Get%20You"
  // }
*/

// ✓ STEP 5.2: Enable copy to clipboard
/*
Your existing "Copy Selected" button should call:

window.CuratorUtils.ClipboardManager.copyTracklist(
  getSelectedTracks(),
  true  // show toast notification
);

Where getSelectedTracks() returns:
  [
    { artist: "Daniel Caesar", track: "Get You" },
    { artist: "Raahiim", track: "Suffocating" },
    ...
  ]
*/

// ============================================================================
// PHASE 6: TRACK SELECTION BAR (5 minutes)
// ============================================================================

// ✓ STEP 6.1: Update selection count display
/*
Your bottom bar currently shows "0 selected"

Connect it to the TrackSelectionManager:
  window.CuratorAI.trackSelection.onUpdate = () => {
    const count = window.CuratorAI.trackSelection.getCount();
    document.querySelector('.selection-count').textContent = `${count} selected`;
  };

This callback fires whenever selection changes.
*/

// ✓ STEP 6.2: Implement YouTube search
/*
Button onclick should call:

window.CuratorAI.searchSelectedOnYouTube();

This function already exists in curator-ai-system.js
It opens YouTube searches for all selected tracks.
*/

// ✓ STEP 6.3: Clear button functionality
/*
Button onclick should call:

window.CuratorAI.trackSelection.clear();

This clears selection count and unchecks all checkboxes.
Already fully implemented!
*/

// ============================================================================
// PHASE 7: SAVED WAVES / ARCHIVES (10 minutes)
// ============================================================================

// ✓ STEP 7.1: Saving happens automatically
/*
When you call:
  window.SoftWaveRouterInstance.saveWave({
    mood: "...",
    prompt: "...",
    tracks: [...]
  });

It automatically:
  1. Creates wave object with id and timestamp
  2. Saves to window.SoftWaveRouterInstance.state.savedWaves
  3. Persists to localStorage
  4. Shows success toast

Nothing additional needed!
*/

// ✓ STEP 7.2: View archives
/*
User can navigate to "Saved Waves" page to see all saved playlists.
Each wave card shows:
  - Mood title
  - Date created
  - Preview of first 3 artists
  - "Load Playlist" button
  - "Delete" button

Clicking "Load Playlist" retrieves the wave and shows it in generator.
*/

// ============================================================================
// PHASE 8: THE CONSTELLATION (Visual Mood Map)
// ============================================================================

// ✓ STEP 8.1: Interactive nodes
/*
The Constellation page is fully implemented with:
  - 8 mood nodes positioned on a canvas
  - Click a node to see details and artists
  - "Curate from Mood" button pre-fills generator

Nodes included:
  1. Melancholic Midnight - echoy, vulnerable vocals
  2. Sun-Drenched Lofi - warm, analog, jazz-influenced
  3. Sensual & Slow - intimate R&B, spacious production
  4. Raw Acoustic - stripped-down guitar, minimal
  5. Ethereal Ambient - floating, textural, minimalist
  6. Dark & Experimental - glitchy, boundary-pushing
  7. Energetic & Groovy - funky bass, uplifting
  8. Introspective & Quiet - whisper-soft, minimal

Each node has baseline artists and tracks you can customize.
Edit in spa-router.js initConstellationNodes() method.
*/

// ✓ STEP 8.2: Customizing nodes
/*
Open spa-router.js and find initConstellationNodes().

Edit any node:
  {
    id: 'your-node-id',
    label: 'Node Display Name',
    description: 'Detailed mood description...',
    x: 50,        // x position (0-100%)
    y: 30,        // y position (0-100%)
    artists: ['Artist 1', 'Artist 2', ...],
    tracks: [
      { track: 'Track Name', artist: 'Artist Name' },
      ...
    ]
  }

x and y control node position on canvas (0-100 percentage).
*/

// ============================================================================
// PHASE 9: TESTING & VALIDATION (20 minutes)
// ============================================================================

// ✓ TEST 9.1: Check browser console for errors
/*
After all modifications, open browser DevTools (F12):
  - Look for any red error messages
  - Check that all scripts load (Network tab)
  - Verify no 404s for CSS files
  
Common issues:
  - Missing file paths in <script> src or <link> href
  - Script loading order incorrect
  - Typo in data-route attribute
*/

// ✓ TEST 9.2: Navigate between pages
/*
Click each navigation button:
  - Wave Generator (default page)
  - Saved Waves (should be empty initially)
  - The Constellation (should show mood nodes)
  - Settings (should show form fields)

URL should change to: #generator, #archives, etc.
Browser back/forward should work.
*/

// ✓ TEST 9.3: Generate a test playlist
/*
1. Go to Settings, add a fake API key (for now)
2. Return to Wave Generator
3. Fill in mood, artists, track count
4. Click Generate
5. Should show skeleton loader for ~3-5 seconds
6. Should display tracks (from LLM or test data)
7. Should show success toast
8. Should be saveable to archives
*/

// ✓ TEST 9.4: Test streaming links
/*
1. Generate playlist
2. Click Spotify/YouTube/Apple Music icons next to a track
3. Should open new tab with search results
4. Verify track name and artist are in search query
*/

// ✓ TEST 9.5: Test track selection
/*
1. Check a few track checkboxes
2. Selection count at bottom should update
3. Copy button should copy selected tracks
4. Clear button should uncheck all and reset count
5. YouTube button should open YouTube searches
*/

// ✓ TEST 9.6: Test archives
/*
1. Generate and save a playlist
2. Go to Saved Waves
3. Should see card with mood, date, artists preview
4. Click "Load Playlist" should return to generator with wave data
5. Click "Delete" should remove wave
6. Close browser and reopen - wave should still be there (localStorage)
*/

// ============================================================================
// PHASE 10: PERFORMANCE OPTIMIZATION (10 minutes)
// ============================================================================

// ✓ OPT 10.1: Minify and compress
/*
In production:
  - Minify all .js files
  - Minify curator-complete-styles.css
  - Gzip compression on server
  - Use CDN for static assets

Services:
  - JavaScript: terser, esbuild, webpack
  - CSS: cssnano, lightningcss
  - Compression: gzip, brotli
*/

// ✓ OPT 10.2: Lazy load images
/*
For streaming platform icons, use loading="lazy":
  <img src="spotify-icon.svg" loading="lazy" alt="Spotify">
*/

// ✓ OPT 10.3: Limit localStorage
/*
Monitor saved waves size:
  const size = new Blob(
    [JSON.stringify(localStorage)]
  ).size;
  console.log(`LocalStorage: ${(size / 1024).toFixed(2)} KB`);

Most browsers allow 5-10MB.
Archive old waves or provide export feature.
*/

// ============================================================================
// PHASE 11: DEPLOYMENT (5 minutes)
// ============================================================================

// ✓ DEPLOY 11.1: Push to GitHub
/*
git add .
git commit -m "Add complete curator system with multi-page routing"
git push origin main

GitHub Pages will automatically rebuild and deploy.
Cache-buster in script tag handles CDN propagation.
*/

// ✓ DEPLOY 11.2: Verify on production
/*
Visit: https://purpjuice.github.io/the-soft-wave/the-soft-wave.html

1. All pages accessible via navigation
2. All scripts and CSS loaded (check Network tab)
3. No console errors
4. Styling looks correct
5. Interactive elements responsive
*/

// ✓ DEPLOY 11.3: Clear browser cache if needed
/*
If changes don't appear:
  - Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
  - Select "All time"
  - Check Cookies and Cached images/files
  - Clear

Or:
  - Ctrl+Shift+R (hard refresh)
  - F12 → Settings → Disable cache while DevTools open
*/

// ============================================================================
// PHASE 12: FUTURE ENHANCEMENTS (Optional)
// ============================================================================

// IDEA 12.1: Export playlists
/*
Add export functionality:
  - JSON export (import elsewhere)
  - CSV format (spreadsheet)
  - Spotify playlist link generator
*/

// IDEA 12.2: Collaborative playlists
/*
Share waves with others:
  - Generate shareable link
  - Allow others to remix/edit
  - Comments and ratings
*/

// IDEA 12.3: Analytics & insights
/*
Track user preferences:
  - Most used moods
  - Favorite artists across playlists
  - Curator density distribution
  - Popular nodes in Constellation
*/

// IDEA 12.4: Advanced filters
/*
Filter tracks in archives:
  - By date range
  - By curator density
  - By mood keywords
  - By artist
*/

// IDEA 12.5: Offline mode
/*
Service Worker + IndexedDB:
  - Cache playlists offline
  - Generate recommendations without internet
  - Sync when back online
*/

// ============================================================================
// CHECKLIST COMPLETION
// ============================================================================

// FINAL VERIFICATION:
const completionChecklist = {
  phase1_files: false,        // All files created?
  phase2_html: false,         // HTML modified with scripts/links/buttons?
  phase3_javascript: false,   // Generate function updated?
  phase4_settings: false,     // API key and density working?
  phase5_streaming: false,    // Streaming links opening correctly?
  phase6_selection: false,    // Track selection updating count?
  phase7_archives: false,     // Playlists saved and loadable?
  phase8_constellation: false, // Mood nodes interactive?
  phase9_testing: false,      // All tests passing?
  phase10_optimization: false, // Performance checked?
  phase11_deployment: false,  // Deployed to production?
};

// Mark as complete:
// completionChecklist.phase1_files = true;
// etc...

console.log('Implementation Checklist Ready!');
console.log('Total Estimated Time: 90 minutes');
console.log('Start with Phase 1 and work sequentially.');
