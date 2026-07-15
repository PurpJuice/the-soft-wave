/**
 * INTEGRATION GUIDE: CURATOR SYSTEM COMPLETE
 * ===========================================
 * 
 * Step-by-step instructions to integrate all new curator system components
 * into The Soft Wave application.
 * 
 * Total Files to Add/Modify:
 *   - curator-system-prompt.js (NEW) - System prompts & few-shot examples
 *   - curator-utils.js (NEW) - Utilities for sanitization, links, clipboard
 *   - spa-router.js (NEW) - Multi-page SPA router system
 *   - curator-complete-styles.css (NEW) - Complete styling system
 *   - the-soft-wave.html (MODIFY) - Add script tags & page containers
 *   - curator-ai-system.js (EXISTING) - Already integrated
 *   - curator-ui-styles.css (EXISTING) - Already integrated
 * 
 * =========================================================================
 */

// ============================================================================
// SECTION 1: HTML HEAD ADDITIONS
// ============================================================================
/*
Add these <script> and <link> tags to your HTML <head> in order:

<!-- Curator System Prompt (LLM instructions) -->
<script defer src="curator-system-prompt.js"></script>

<!-- Curator Utilities (sanitization, links, clipboard) -->
<script defer src="curator-utils.js"></script>

<!-- SPA Router (multi-page navigation) -->
<script defer src="spa-router.js"></script>

<!-- Complete Style System -->
<link rel="stylesheet" href="curator-complete-styles.css">
*/

// ============================================================================
// SECTION 2: HTML BODY STRUCTURE
// ============================================================================
/*
Ensure your HTML has these key elements:

1. AMBIENT WAVES CONTAINER (Background effect)
   Place before your main content:
   
   <div id="ambientWavesContainer">
     <div class="wave"></div>
     <div class="wave"></div>
     <div class="wave"></div>
   </div>

2. SIDEBAR NAVIGATION (Update with new routes)
   Add data-route attributes to navigation buttons:
   
   <nav class="sidebar">
     <button data-route="generator">Wave Generator</button>
     <button data-route="archives">Saved Waves</button>
     <button data-route="constellation">The Constellation</button>
     <button data-route="profile">Settings</button>
   </nav>

3. MAIN CONTENT AREA
   The router will inject page containers into this element:
   
   <main role="main">
     <!-- Router will populate this with page containers -->
   </main>

4. EXISTING ELEMENTS TO PRESERVE
   Your current generator UI, discovery chat, etc. should remain
   but will be moved into the page container system.
*/

// ============================================================================
// SECTION 3: JAVASCRIPT INITIALIZATION SEQUENCE
// ============================================================================
/*
The scripts initialize in this order:

1. curator-system-prompt.js loads first (defer attribute)
   - Exposes window.CuratorPrompt object
   - Provides: getSystemPrompt(), parseResponse(), validateTrackPairing()

2. curator-utils.js loads second
   - Depends on: window.CuratorPrompt
   - Exposes window.CuratorUtils object
   - Provides: sanitizeQuery(), StreamingLinks, ClipboardManager, etc.

3. spa-router.js loads third
   - Depends on: window.CuratorUtils
   - Exposes window.SoftWaveRouterInstance
   - Initializes on DOMContentLoaded
   - Sets up multi-page navigation

4. curator-ai-system.js (existing)
   - Already integrated
   - Works alongside new systems

5. Your existing app.js or main initialization
   - Should call methods on window.SoftWaveRouterInstance
   - Should use window.CuratorUtils for track operations
*/

// ============================================================================
// SECTION 4: API REQUEST WORKFLOW
// ============================================================================
/*
When user clicks "Generate Playlist":

1. Collect user inputs (mood, artists, track count, curator density)

2. Build API request:
   const request = window.CuratorUtils.CuratorAPIBuilder.buildRequest(
     userPrompt,
     window.SoftWaveRouterInstance.state.userSettings.curatorDensity
   );

3. Send to LLM (OpenRouter/Google AI Studio):
   const response = await fetch('YOUR_API_ENDPOINT', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${apiKey}` },
     body: JSON.stringify(request)
   });

4. Parse response:
   const result = window.CuratorUtils.CuratorAPIBuilder.processResponse(
     await response.json()
   );

   if (result.success) {
     const tracks = result.tracks; // Array of {track, artist, reason}
     // Render tracks, save to state, etc.
   } else {
     window.CuratorUtils.showToastNotification(result.error, 'error');
   }

5. For each track, generate streaming links:
   const links = window.CuratorUtils.StreamingLinks.generateAll(
     track.artist,
     track.track
   );
   // Use links.spotify, links.youtube, links.appleMusic

6. When user clicks "Save Playlist":
   const wave = window.SoftWaveRouterInstance.saveWave({
     mood: selectedMood,
     prompt: userDescription,
     tracks: generatedTracks
   });
   // Wave is now in localStorage and appears in archives
*/

// ============================================================================
// SECTION 5: CORE API REFERENCE
// ============================================================================
/*

CURATOR PROMPT SYSTEM
=====================
window.CuratorPrompt.getSystemPrompt(density)
  - density: 'mainstream' | 'balanced' | 'deep-cuts' | 'underground'
  - Returns: Full system prompt string for LLM

window.CuratorPrompt.parseResponse(jsonString)
  - Parses LLM JSON response
  - Returns: Array of {track, artist, reason}
  - Throws: Error if invalid format

window.CuratorPrompt.validateTrackPairing(artist, track)
  - Pre-flight validation for hallucination detection
  - Returns: {isValid: boolean, warnings: array}

CURATOR UTILITIES
=================
window.CuratorUtils.sanitizeQuery(artist, track)
  - Removes remasters, live versions, special chars
  - Returns: Clean search query string
  - Example: "Frank Ocean - Pyramids (2012)" → "Frank Ocean Pyramids"

window.CuratorUtils.StreamingLinks.spotify(artist, track)
window.CuratorUtils.StreamingLinks.youtube(artist, track)
window.CuratorUtils.StreamingLinks.appleMusic(artist, track)
window.CuratorUtils.StreamingLinks.generateAll(artist, track)
  - Generate search URLs for each platform
  - Returns: Full HTTPS URL (spotify, youtube, appleMusic, or object)

window.CuratorUtils.ClipboardManager.copy(text)
  - Copy any text to clipboard
  - Returns: Promise<boolean> (success)

window.CuratorUtils.ClipboardManager.copyTracklist(tracks, showToast)
  - Copy array of {artist, track} as formatted text
  - Shows toast notification
  - Returns: Promise<boolean>

window.CuratorUtils.showToastNotification(message, type, duration)
  - Types: 'success' | 'error' | 'info' | 'warning'
  - Duration in ms (default 3000)

window.CuratorUtils.TrackFormatting.formatTrack(track)
  - Add displayName and searchableText to track object

window.CuratorUtils.TrackFormatting.searchTracks(tracks, query)
  - Filter tracks by query string

window.CuratorUtils.TrackFormatting.sortTracks(tracks, sortBy, order)
  - Sort by 'artist' or 'track'
  - order: 'asc' | 'desc'

SPA ROUTER
==========
window.SoftWaveRouterInstance.navigate(pageName)
  - Pages: 'generator' | 'archives' | 'constellation' | 'profile'
  - Updates UI and browser history

window.SoftWaveRouterInstance.state.savedWaves
  - Array of saved playlists with metadata

window.SoftWaveRouterInstance.state.userSettings
  - {apiKey, curatorDensity, preferredStreaming, theme}

window.SoftWaveRouterInstance.saveWave({mood, prompt, tracks})
  - Save playlist to localStorage and state
  - Returns: Wave object with id and createdAt

window.SoftWaveRouterInstance.loadWave(waveId)
  - Load saved wave and navigate to generator

window.SoftWaveRouterInstance.deleteWave(waveId)
  - Remove wave from archives

window.SoftWaveRouterInstance.updateSetting(key, value)
  - Update user setting and persist to localStorage

window.SoftWaveRouterInstance.state.constellationNodes
  - Array of mood nodes for The Constellation page

CURATOR AI SYSTEM (Existing)
============================
window.CuratorAI.trackSelection
  - TrackSelectionManager instance
  - Methods: addTrack(), removeTrack(), toggleTrack(), clear(), getCount()

window.CuratorAI.createStreamingLinksHTML(artist, track)
  - Returns: HTML string with icon buttons

window.CuratorAI.searchSelectedOnYouTube()
  - Opens YouTube search for selected tracks

window.CuratorAI.copySelectedTracks()
  - Copy selected tracks to clipboard
*/

// ============================================================================
// SECTION 6: STYLING SYSTEM (CSS Variables)
// ============================================================================
/*
The curator-complete-styles.css defines these CSS custom properties:

Colors:
  --bg-primary: #0a0e27
  --bg-secondary: #0f1229
  --bg-tertiary: #14182f
  --text-primary: #e8eaed
  --text-secondary: #a8adb8
  --text-muted: #6b7280
  --accent-gold: #d4af37
  --accent-blue: #4a90e2
  --accent-purple: #8b5cf6
  --accent-green: #10b981

Spacing:
  --spacing-xs: 4px
  --spacing-sm: 8px
  --spacing-md: 16px
  --spacing-lg: 24px
  --spacing-xl: 32px
  --spacing-2xl: 48px

Transitions:
  --transition-fast: 150ms ease-in-out
  --transition-normal: 300ms ease-in-out
  --transition-slow: 500ms ease-in-out

Use in your custom CSS:
  button {
    background: var(--accent-gold);
    padding: var(--spacing-md);
    transition: all var(--transition-fast);
  }
*/

// ============================================================================
// SECTION 7: LOADING SKELETON SYSTEM
// ============================================================================
/*
Show skeleton loaders while fetching tracks:

HTML:
  <div class="skeleton-card">
    <div class="skeleton-heading"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
  </div>

  <div class="skeleton-track">
    <div class="skeleton-track-image"></div>
    <div class="skeleton-track-content">
      <div class="skeleton-text"></div>
      <div class="skeleton-text" style="width: 70%;"></div>
    </div>
  </div>

JavaScript:
  // Show skeleton
  trackContainer.innerHTML = skeltonHTML;

  // Fetch tracks...

  // Replace with actual tracks
  trackContainer.innerHTML = tracksHTML;
*/

// ============================================================================
// SECTION 8: EXAMPLE: COMPLETE GENERATION FLOW
// ============================================================================
/*

// 1. User fills in mood, artists, track count
const userMood = "Sunday morning, introspective and warm";
const selectedArtists = ["Mac Ayres", "Syd", "Daniel Caesar"];
const trackCount = 10;
const curatorDensity = window.SoftWaveRouterInstance.state.userSettings.curatorDensity;

// 2. Build user prompt
const userPrompt = `
  Mood: ${userMood}
  Preferred artists: ${selectedArtists.join(', ')}
  Track count: ${trackCount}
  
  Generate a playlist that captures this exact vibe.
`;

// 3. Build API request with system prompt
const request = window.CuratorUtils.CuratorAPIBuilder.buildRequest(
  userPrompt,
  curatorDensity
);

// 4. Show skeleton loader
trackContainer.innerHTML = `
  ${Array(5).fill(0).map(() => `
    <div class="skeleton-track">
      <div class="skeleton-track-image"></div>
      <div class="skeleton-track-content">
        <div class="skeleton-text"></div>
        <div class="skeleton-text" style="width: 70%;"></div>
      </div>
    </div>
  `).join('')}
`;

// 5. Make API request
const apiKey = window.SoftWaveRouterInstance.state.userSettings.apiKey;
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(request)
});

// 6. Parse response
const result = window.CuratorUtils.CuratorAPIBuilder.processResponse(
  await response.json()
);

if (!result.success) {
  window.CuratorUtils.showToastNotification(result.error, 'error');
  return;
}

const tracks = result.tracks;

// 7. Render tracks with streaming links
const tracksHTML = tracks.map(track => {
  const links = window.CuratorUtils.StreamingLinks.generateAll(
    track.artist,
    track.track
  );
  
  return `
    <div class="track-item">
      <div class="track-info">
        <h4>${track.artist}</h4>
        <p>${track.track}</p>
        <em>${track.reason}</em>
      </div>
      <div class="track-actions">
        <a href="${links.spotify}" target="_blank" title="Search on Spotify">
          <img src="spotify-icon.svg" alt="Spotify">
        </a>
        <a href="${links.youtube}" target="_blank" title="Search on YouTube">
          <img src="youtube-icon.svg" alt="YouTube">
        </a>
        <a href="${links.appleMusic}" target="_blank" title="Search on Apple Music">
          <img src="apple-icon.svg" alt="Apple Music">
        </a>
      </div>
      <input type="checkbox" class="track-checkbox" data-artist="${track.artist}" data-track="${track.track}">
    </div>
  `;
}).join('');

trackContainer.innerHTML = tracksHTML;

// 8. Save playlist
const wave = window.SoftWaveRouterInstance.saveWave({
  mood: userMood,
  prompt: userPrompt,
  tracks: tracks
});

window.CuratorUtils.showToastNotification(
  `Playlist saved to archives! Wave ID: ${wave.id}`,
  'success'
);

// 9. User can now:
//    - Click streaming links to listen
//    - Select tracks with checkboxes
//    - Copy selected tracks to clipboard
//    - Save multiple playlists to archives
//    - Load previously saved playlists
*/

// ============================================================================
// SECTION 9: TROUBLESHOOTING
// ============================================================================
/*

Q: Scripts not loading?
A: Check browser console for 404 errors. Ensure all .js and .css files
   are in the same directory as the-soft-wave.html, or adjust paths in
   <script> and <link> tags.

Q: CuratorAI not defined error?
A: Ensure curator-ai-system.js is loaded before your app code.
   The defer attribute on <script> tags ensures correct load order.

Q: Toast notifications not appearing?
A: CSS styles are injected dynamically. Check that curator-complete-styles.css
   is loaded. If using custom CSS, ensure .toast classes aren't overridden.

Q: Streaming links broken?
A: Sanitize query function handles most cases. If links still broken,
   check browser console for the generated URLs and test them manually.
   Some special characters may need additional handling.

Q: Local storage full?
A: Archives are stored in localStorage (typically 5-10MB limit).
   Clearing old waves or exporting data can free space.
   Use developer tools Storage tab to inspect.

Q: Router not navigating between pages?
A: Ensure [data-route] attributes exist on navigation buttons.
   Check console for any JavaScript errors.
   Verify page container divs are present in HTML.
*/

// ============================================================================
// SECTION 10: PERFORMANCE OPTIMIZATION
// ============================================================================
/*

Code Splitting:
  - All scripts use defer attribute for non-blocking load
  - CSS is loaded in <head> for fastest rendering
  - No heavy dependencies (pure vanilla JS)

Animation Performance:
  - Ambient waves use CSS keyframes (GPU-accelerated)
  - All transitions use transform and opacity only (60fps)
  - Avoid layout thrashing with proper class toggles

Memory Management:
  - Toast notifications auto-remove from DOM
  - Page containers use hidden attribute (not display: none)
  - Event listeners cleaned up on navigation

Bundle Sizes:
  - curator-system-prompt.js: ~3KB
  - curator-utils.js: ~8KB
  - spa-router.js: ~15KB
  - curator-complete-styles.css: ~12KB
  - Total: ~38KB (minified: ~12KB)

Caching:
  - LocalStorage for user settings and saved waves
  - Query string sanitization for URL caching benefits
*/

export {};
