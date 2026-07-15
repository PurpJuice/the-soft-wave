# The Soft Wave — Curator AI System Documentation

## Overview

Your music discovery app now includes a complete, production-ready Curator AI system with four integrated components:

1. **AI Engine** — Precision music recommendations via LLM
2. **Streaming Service Integration** — Spotify, YouTube, Apple Music links
3. **Selection Tracking** — Track management & bulk actions
4. **Visual Effects** — Ambient waves + skeleton loaders

All code is **modular**, **performant**, and **vanilla JavaScript** (no external frameworks).

---

## 1. AI ENGINE: System Prompt & JSON Structure

### Location
- **File**: `curator-ai-system.js` (lines 1-110)
- **Export**: `CuratorAI.CURATOR_SYSTEM_PROMPT`, `CuratorAI.buildCuratorPrompt()`

### The Curator System Prompt

The system prompt forces the LLM to:
- **Act as an obsessive record store clerk** with impeccable taste
- **Avoid generic hits** (no Top 40, no TikTok trends)
- **Prioritize texture & mood** over popularity
- **Return deep cuts** — B-sides, underground gems, slept-on classics
- **Write poetic 1-sentence reasons** for each track
- **Return strict JSON format** that's reliably parsable

**Key Principles:**
```
"If someone says 'sad,' you don't suggest Adele. 
You suggest the album track on side B that nobody talks about — 
the one that actually captures the feeling."
```

### JSON Output Schema

The LLM returns this exact format:

```json
[
  {
    "track": "Track Name",
    "artist": "Artist Name",
    "reason": "Single sentence poetic explanation of why this fits the vibe—specific, evocative, makes them want to play it now."
  }
]
```

### Usage Example

```javascript
// Build a curator prompt for the LLM
const messages = CuratorAI.buildCuratorPrompt(
  "It's 2am and I can't sleep, something heavy but not aggressive",
  ["Frank Ocean", "Daniel Caesar"],  // Reference artists
  ["Drake"],                          // Avoid artists
  "midnight in my bedroom",           // Context
  10                                  // Track count
);

// messages is ready for API: callOpenRouter(messages) or callGemini()
```

---

## 2. STREAMING SERVICE UTILITIES

### Location
- **File**: `curator-ai-system.js` (lines 115-160)
- **Exports**: `CuratorAI.generateStreamingLinks()`, `CuratorAI.createStreamingLinksHTML()`

### Generate Search URLs

**Function**: `generateStreamingLinks(artist, track)`

Returns object with platform URLs:

```javascript
const links = CuratorAI.generateStreamingLinks("Frank Ocean", "Nights");

// Result:
{
  spotify: "https://open.spotify.com/search/Frank%20Ocean%20Nights",
  youtube: "https://www.youtube.com/results?search_query=Frank%20Ocean%20Nights",
  appleMusic: "https://music.apple.com/search?term=Frank%20Ocean%20Nights"
}
```

### Create Streaming Link Buttons

**Function**: `createStreamingLinksHTML(artist, track)`

Returns minimalist SVG icon buttons with hover colors:

```javascript
const html = CuratorAI.createStreamingLinksHTML("Frank Ocean", "Nights");
document.getElementById('links-container').innerHTML = html;

// Renders:
// 🎵 (Spotify - green hover)  🎬 (YouTube - red hover)  🍎 (Apple Music - pink hover)
```

### CSS Styling

Located in `curator-ui-styles.css` (lines 1-90):

- **Minimalist circles** with platform-specific colors
- **Smooth hover effects** + scale transforms
- **Accessible** — proper `title` attributes and ARIA labels
- **Mobile responsive** — smaller on small screens

---

## 3. CLIPBOARD & EXPORT UTILITIES

### Location
- **File**: `curator-ai-system.js` (lines 165-220)
- **Exports**: `CuratorAI.copyTracklistToClipboard()`, `CuratorAI.showToast()`, `CuratorAI.exportTracklist()`

### Copy to Clipboard

```javascript
// Copy selected tracks to clipboard
const tracks = [
  { artist: "Frank Ocean", track: "Nights" },
  { artist: "Daniel Caesar", track: "Get You" }
];

const success = await CuratorAI.copyTracklistToClipboard(tracks);
if (success) {
  CuratorAI.showToast("Copied 2 tracks to clipboard");
}

// Clipboard contains:
// Frank Ocean – Nights
// Daniel Caesar – Get You
```

### Show Toast Notification

```javascript
// Customizable toast with duration
CuratorAI.showToast("✓ Copied 5 tracks", 3000);  // 3 second display
```

### Export to File

```javascript
// Download tracks as .txt file
CuratorAI.exportTracklist(tracks, "my-playlist.txt");

// Opens file dialog to save
```

---

## 4. SELECTION TRACKING SYSTEM

### Location
- **File**: `curator-ai-system.js` (lines 225-290)
- **Export**: `CuratorAI.trackSelection` (global manager instance)

### TrackSelectionManager API

```javascript
// Add track to selection
CuratorAI.trackSelection.addTrack('track-1', 'Frank Ocean', 'Nights');

// Remove track
CuratorAI.trackSelection.removeTrack('track-1');

// Toggle track (add if not present, remove if present)
const isNowSelected = CuratorAI.trackSelection.toggleTrack(
  'track-1', 
  'Frank Ocean', 
  'Nights'
);

// Get all selected tracks
const selected = CuratorAI.trackSelection.getSelectedTracks();
// → [{ artist: 'Frank Ocean', track: 'Nights' }, ...]

// Get count
const count = CuratorAI.trackSelection.getCount();
// → 1

// Clear all
CuratorAI.trackSelection.clear();

// Listen for changes
CuratorAI.trackSelection.onUpdate((count, tracks) => {
  console.log(`${count} tracks selected`);
  console.log(tracks);
});
```

### Integration in HTML

Enhanced track cards include checkboxes:

```html
<input 
  type="checkbox" 
  class="track-checkbox" 
  onchange="trackSelection.toggleTrack('track-id', 'Artist', 'Track')"
>
```

---

## 5. SELECTION BAR ACTIONS

### Location
- **File**: `the-soft-wave.html` (selection bar HTML)
- **CSS**: `curator-ui-styles.css` (lines 380-430)

### Bottom Bar Features

The sticky bottom bar displays:
- **Selected count** — "5 selected"
- **YouTube Search button** — Opens YouTube with all tracks in search query
- **Copy Selected button** — Copies to clipboard with confirmation
- **Clear button** — Resets selection

### Action Buttons

**Search Selected on YouTube:**
```javascript
CuratorAI.searchSelectedOnYouTube();
// Opens YouTube search with first 5 tracks combined into one query
```

**Copy Selected:**
```javascript
CuratorAI.copySelectedTracks();
// Copies selected tracks, shows toast: "Copied X tracks to clipboard"
```

### HTML Structure

```html
<div class="select-bar" id="selectBar">
  <span><span id="selectCount">0</span> selected</span>
  <button onclick="CuratorAI.searchSelectedOnYouTube()">YouTube</button>
  <button onclick="CuratorAI.copySelectedTracks()">Copy</button>
  <button onclick="trackSelection.clear()">Clear</button>
</div>
```

---

## 6. SKELETON LOADERS

### Location
- **File**: `curator-ai-system.js` (lines 320-350)
- **CSS**: `curator-ui-styles.css` (lines 120-180)

### Usage

Show skeleton loaders while fetching:

```javascript
const container = document.getElementById('ai-results');

// Show 5 skeleton placeholders
CuratorAI.showSkeletonLoaders(container, 5);

// ... wait for API response ...

// Hide and replace with actual content
CuratorAI.hideSkeletonLoaders(container);
renderAiTracks(tracksData, 'ai-results');
```

### CSS Animation

**Pulsing shimmer effect:**
```css
@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

- Smooth 1.8s loop
- Gold shimmer accent
- No layout shift

---

## 7. AMBIENT WAVES BACKGROUND

### Location
- **File**: `curator-ai-system.js` (lines 355-415)
- **CSS**: `curator-ui-styles.css` (lines 185-270)

### How It Works

**Three layered SVG wave animations:**
1. Purple/Blue wave (20s drift) — opacity 0.6
2. Blue wave reversed (18s, -6s delay) — opacity 0.4
3. Red accent wave (25s, -12s delay) — opacity 0.3

**Performance optimizations:**
- Pure CSS animations (no Canvas, no JavaScript tick)
- SVG waves generated inline (no external images)
- Radial gradient overlays for depth
- Soft vignette for dark aesthetic

### Initialization

Automatic on page load via `initCuratorSystem()`:

```javascript
CuratorAI.initAmbientWaves();
// Creates #ambientWavesContainer with 3 wave divs
// Injects CSS into <head>
```

### Responsive Behavior

- Waves scale down opacity on mobile
- Hidden completely on screens < 480px (battery savings)
- Backdrop stays visible (just less prominent)

---

## 8. INTEGRATION CHECKLIST

### Files Created/Modified

✅ **curator-ai-system.js** — 350+ lines of utilities
✅ **curator-ui-styles.css** — Complete styling system
✅ **the-soft-wave.html** — Enhanced with:
   - New CSS/JS imports
   - Ambient waves container
   - Updated selection bar
   - Enhanced track rendering with checkboxes & streaming links
   - Initialization code

### What's Connected

- ✅ Streaming links rendered on every track
- ✅ Selection checkboxes functional on all tracks
- ✅ Bottom bar updates dynamically
- ✅ YouTube/Copy/Clear buttons working
- ✅ Toast notifications display
- ✅ Ambient waves animate on load
- ✅ Skeleton loaders available for loading states

---

## 9. USAGE GUIDE

### For End Users

1. **Generate playlist** — Select mood, artists, click "Generate"
2. **Select tracks** — Check boxes next to favorites
3. **Bulk actions:**
   - **YouTube** — Search selected tracks on YouTube
   - **Copy** — Copy to clipboard as `Artist – Track` format
   - **Clear** — Deselect all

4. **Individual track actions:**
   - **Streaming icons** — Jump to Spotify/YouTube/Apple Music search
   - **Spotify/Apple links** — Official platform searches

### For Developers

#### Add Streaming Links to Any Element

```javascript
const html = CuratorAI.createStreamingLinksHTML("Artist", "Track");
container.innerHTML += html;
```

#### Track Selection in Custom Components

```javascript
CuratorAI.trackSelection.addTrack(uniqueId, artist, track);
CuratorAI.trackSelection.onUpdate((count, tracks) => {
  // Update your custom UI
});
```

#### Show Skeleton Loaders During Loading

```javascript
CuratorAI.showSkeletonLoaders(container, 10);
// Later...
CuratorAI.hideSkeletonLoaders(container);
```

#### Build LLM Prompts

```javascript
const messages = CuratorAI.buildCuratorPrompt(
  mood,
  referenceArtists,
  avoidArtists,
  context,
  trackCount
);
const reply = await callLLM(messages);
```

---

## 10. PERFORMANCE NOTES

### Bundle Size
- **curator-ai-system.js** — ~12 KB (uncompressed, minifies to ~4 KB)
- **curator-ui-styles.css** — ~8 KB (uncompressed, minifies to ~5 KB)
- **Total overhead** — ~9 KB minified + gzipped

### Runtime Performance
- **Ambient waves** — CSS-only, negligible CPU impact
- **Selection tracking** — O(1) Map lookups
- **Skeleton loaders** — Pure CSS animation, no JS tick
- **Streaming links** — Pre-computed URLs, no API calls

### Mobile Optimization
- Waves hidden on very small screens
- Simpler animations on low-performance devices
- Selection bar responsive, stacks vertically on mobile
- Touch-friendly 44px minimum tap targets

---

## 11. Customization Guide

### Change Wave Colors

Edit `curator-ui-styles.css`, `.wave` fill colors:

```css
.wave:nth-child(1) {
  /* Change %23a08ec7 (purple) to your color */
  background-image: url('data:image/svg+xml;utf8,...fill=%23YOUR_COLOR...');
}
```

### Adjust Animation Speed

Edit wave keyframes duration:

```css
.wave:nth-child(1) {
  animation: wave-drift 20s linear infinite; /* Change 20s to desired duration */
}
```

### Customize Toast Position/Style

Edit `.copy-tooltip` in `curator-ui-styles.css`:

```css
.copy-tooltip {
  bottom: 4rem;     /* Change vertical position */
  background: linear-gradient(135deg, var(--green) 0%, ...);  /* Change colors */
}
```

### Add More Streaming Platforms

Extend `generateStreamingLinks()`:

```javascript
function generateStreamingLinks(artist, track) {
  const query = `${artist} ${track}`;
  const encoded = encodeURIComponent(query);

  return {
    spotify: `https://open.spotify.com/search/${encoded}`,
    youtube: `https://www.youtube.com/results?search_query=${encoded}`,
    appleMusic: `https://music.apple.com/search?term=${encoded}`,
    bandcamp: `https://bandcamp.com/search?q=${encoded}`,  // NEW
    tidal: `https://tidal.com/search?q=${encoded}`        // NEW
  };
}
```

---

## 12. Troubleshooting

### Ambient Waves Not Showing
- Check browser console for errors loading `curator-ai-system.js`
- Verify `#ambientWavesContainer` exists in DOM
- Check z-index conflicts with other fixed elements

### Selection Not Persisting
- Selection is session-only (cleared on page reload by design)
- To persist: save to localStorage/database when user clicks action button

### Skeleton Loaders Look Wrong
- Ensure `curator-ui-styles.css` loaded before skeleton DOM creation
- Check for CSS conflicts with custom body::before pseudo-element

### Streaming Links Not Working
- Verify URL encoding: test with `encodeURIComponent()`
- Check for CORS issues if opening in iframe
- Some platforms may block certain search query formats

---

## 13. Future Enhancements

- **Playlist export** — Download as Spotify-compatible format
- **Collaborative selection** — Share selected tracks via URL
- **AI refinement** — "More like these selections"
- **Persistent bookmarks** — Save favorite combinations
- **Advanced analytics** — Track which selections convert to adds

---

## Quick Reference API

```javascript
// Core objects
CuratorAI.CURATOR_SYSTEM_PROMPT      // The system prompt string
CuratorAI.trackSelection             // Global TrackSelectionManager instance

// Functions
CuratorAI.buildCuratorPrompt(...)    // Build LLM prompt with context
CuratorAI.generateStreamingLinks()   // Get platform URLs
CuratorAI.createStreamingLinksHTML() // Get HTML buttons
CuratorAI.copyTracklistToClipboard() // Copy to clipboard (async)
CuratorAI.showToast()                // Display notification
CuratorAI.exportTracklist()          // Download .txt file
CuratorAI.createSkeletonLoaders()    // Generate skeleton HTML
CuratorAI.showSkeletonLoaders()      // Show in container
CuratorAI.hideSkeletonLoaders()      // Hide from container
CuratorAI.initAmbientWaves()         // Initialize background

// TrackSelectionManager methods
.addTrack(id, artist, track)
.removeTrack(id)
.toggleTrack(id, artist, track)
.getSelectedTracks()
.getCount()
.clear()
.onUpdate(callback)
```

---

**Built for The Soft Wave — A Curated Space for Sound and Feeling**
