/**
 * SPA ROUTER & PAGE SYSTEM
 * =========================
 * Vanilla JS single-page application router for multi-page navigation.
 * Manages:
 *   - Page 1: Wave Generator (current)
 *   - Page 2: Saved Waves (My Archives)
 *   - Page 3: The Constellation (Visual Mood Map)
 *   - Page 4: Profile & Curator Dial (Settings)
 * 
 * Integrates with existing sidebar navigation and state management.
 */

class SoftWaveRouter {
  /**
   * Single Page App Router for The Soft Wave
   * Manages route transitions, state, and navigation updates
   */

  constructor(config = {}) {
    this.currentPage = 'generator';
    this.pages = {
      generator: { id: 'page-generator', title: 'Wave Generator' },
      archives: { id: 'page-archives', title: 'Saved Waves' },
      constellation: { id: 'page-constellation', title: 'The Constellation' },
      profile: { id: 'page-profile', title: 'Profile & Settings' }
    };

    this.state = {
      savedWaves: this.loadSavedWaves() || [],
      userSettings: this.loadUserSettings() || {
        apiKey: '',
        curatorDensity: 'balanced', // 'mainstream' | 'balanced' | 'deep-cuts' | 'underground'
        preferredStreaming: 'spotify', // 'spotify' | 'youtube' | 'apple'
        theme: 'dark'
      },
      constellationNodes: this.initConstellationNodes()
    };

    this.initializeRouter();
  }

  /**
   * Initialize router event listeners and set up page containers
   */
  initializeRouter() {
    // Ensure page containers exist in HTML
    this.ensurePageContainers();

    // Listen for navigation clicks in sidebar
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('[data-route]');
      if (navBtn) {
        e.preventDefault();
        const route = navBtn.dataset.route;
        this.navigate(route);
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        this.showPage(e.state.page, false);
      }
    });

    // Initialize first page
    this.navigate('generator');
  }

  /**
   * Ensure all page container divs exist in the DOM
   */
  ensurePageContainers() {
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]') || document.getElementById('mainContent');
    
    if (!mainContent) {
      console.warn('No main content area found. Router may not function correctly.');
      return;
    }

    // Remove existing page containers if present
    Object.values(this.pages).forEach((page) => {
      const existing = document.getElementById(page.id);
      if (existing) existing.remove();
    });

    // Create fresh page containers
    Object.entries(this.pages).forEach(([key, page]) => {
      const container = document.createElement('div');
      container.id = page.id;
      container.className = 'page-container';
      container.setAttribute('data-page', key);
      container.hidden = true;
      mainContent.appendChild(container);
    });
  }

  /**
   * Navigate to a specific page
   */
  navigate(pageName, updateHistory = true) {
    if (!this.pages[pageName]) {
      console.error(`Unknown page: ${pageName}`);
      return;
    }

    this.showPage(pageName, updateHistory);

    // Update active nav button
    document.querySelectorAll('[data-route]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.route === pageName);
    });
  }

  /**
   * Show/hide page containers with smooth transitions
   */
  showPage(pageName, updateHistory = true) {
    // Hide all pages
    document.querySelectorAll('.page-container').forEach((container) => {
      container.hidden = true;
      container.classList.remove('page-active');
    });

    // Show target page
    const pageEl = document.getElementById(this.pages[pageName].id);
    if (pageEl) {
      pageEl.hidden = false;
      pageEl.classList.add('page-active');

      // Render page content
      this.renderPageContent(pageName, pageEl);
    }

    this.currentPage = pageName;

    // Update browser history
    if (updateHistory) {
      window.history.pushState(
        { page: pageName },
        this.pages[pageName].title,
        `#${pageName}`
      );
    }
  }

  /**
   * Route-specific rendering logic
   */
  renderPageContent(pageName, containerEl) {
    switch (pageName) {
      case 'generator':
        this.renderGeneratorPage(containerEl);
        break;
      case 'archives':
        this.renderArchivesPage(containerEl);
        break;
      case 'constellation':
        this.renderConstellationPage(containerEl);
        break;
      case 'profile':
        this.renderProfilePage(containerEl);
        break;
    }
  }

  /**
   * Page 1: Wave Generator (current dashboard)
   * Content already exists in original HTML, just show it
   */
  renderGeneratorPage(containerEl) {
    // The existing generator UI (generate playlist steps, discovery chat)
    // should already be in the HTML. This page is primarily about
    // reparenting existing elements or keeping them visible.

    // If generator content is currently in the original page, we can
    // either move it here or keep it in place and this container can be minimal.

    if (containerEl.children.length === 0) {
      containerEl.innerHTML = `
        <div class="generator-placeholder">
          <!-- Existing generator content will be managed by original HTML structure -->
          <p>Wave Generator loaded</p>
        </div>
      `;
    }
  }

  /**
   * Page 2: Saved Waves (My Archives)
   * Grid-based list of previously generated playlists
   */
  renderArchivesPage(containerEl) {
    const waves = this.state.savedWaves || [];

    if (waves.length === 0) {
      containerEl.innerHTML = `
        <div class="archives-empty">
          <h2>No Waves Saved Yet</h2>
          <p>Generate your first playlist to create a wave and save it here.</p>
          <button class="btn btn-primary" onclick="window.SoftWaveRouterInstance.navigate('generator')">
            Create a Wave
          </button>
        </div>
      `;
      return;
    }

    const waveHTML = waves
      .map(
        (wave) => `
      <div class="wave-card" data-wave-id="${wave.id}">
        <div class="wave-card-header">
          <h3>${this.escapeHTML(wave.mood)}</h3>
          <span class="wave-date">${new Date(wave.createdAt).toLocaleDateString()}</span>
        </div>
        <p class="wave-prompt">${this.escapeHTML(wave.prompt)}</p>
        <div class="wave-tracks-preview">
          ${wave.tracks
            .slice(0, 3)
            .map(
              (t) => `
            <span class="track-tag">${this.escapeHTML(t.artist)}</span>
          `
            )
            .join('')}
          ${wave.tracks.length > 3 ? `<span class="track-tag-more">+${wave.tracks.length - 3}</span>` : ''}
        </div>
        <div class="wave-card-actions">
          <button class="btn-small" onclick="window.SoftWaveRouterInstance.loadWave('${wave.id}')">
            Load Playlist
          </button>
          <button class="btn-small btn-danger" onclick="window.SoftWaveRouterInstance.deleteWave('${wave.id}')">
            Delete
          </button>
        </div>
      </div>
    `
      )
      .join('');

    containerEl.innerHTML = `
      <div class="archives-header">
        <h1>Saved Waves</h1>
        <p>Your curated playlists and moods, preserved.</p>
      </div>
      <div class="archives-grid">
        ${waveHTML}
      </div>
    `;
  }

  /**
   * Page 3: The Constellation (Visual Mood Map)
   * Interactive node-based mood explorer
   */
  renderConstellationPage(containerEl) {
    const nodes = this.state.constellationNodes;

    const nodeHTML = nodes
      .map(
        (node) => `
      <div class="constellation-node" 
           style="--x: ${node.x}%; --y: ${node.y}%;" 
           data-node-id="${node.id}"
           onclick="window.SoftWaveRouterInstance.selectConstellationNode('${node.id}')">
        <span class="node-label">${node.label}</span>
        <div class="node-dot"></div>
      </div>
    `
      )
      .join('');

    containerEl.innerHTML = `
      <div class="constellation-container">
        <div class="constellation-header">
          <h1>The Constellation</h1>
          <p>Explore emotional landscapes. Click a node to curate a baseline playlist.</p>
        </div>
        <div class="constellation-canvas">
          ${nodeHTML}
        </div>
        <div class="constellation-details" id="constellation-details">
          <p>Select a node to explore...</p>
        </div>
      </div>
    `;

    // Re-attach event listeners after rendering
    setTimeout(() => this.initConstellationInteractions(), 100);
  }

  /**
   * Page 4: Profile & Curator Dial (Settings)
   * API key input, curator density slider, streaming preferences
   */
  renderProfilePage(containerEl) {
    const settings = this.state.userSettings;

    containerEl.innerHTML = `
      <div class="profile-container">
        <div class="profile-header">
          <h1>Profile & Curator Dial</h1>
          <p>Fine-tune your curation experience.</p>
        </div>

        <div class="settings-group">
          <h2>API Integration</h2>
          <label for="api-key">Your API Key</label>
          <input
            id="api-key"
            type="password"
            class="input-field"
            placeholder="Enter your OpenRouter or Google AI Studio API key"
            value="${settings.apiKey}"
            onchange="window.SoftWaveRouterInstance.updateSetting('apiKey', this.value)"
          />
          <p class="input-hint">Your key is stored locally and never shared.</p>
        </div>

        <div class="settings-group">
          <h2>Curator Density</h2>
          <p class="setting-label">How deep should recommendations go?</p>
          <div class="density-slider-container">
            <span class="density-label">Mainstream<br/>Comfort</span>
            <input
              type="range"
              id="curator-density"
              class="slider"
              min="0"
              max="3"
              value="${this.densityToValue(settings.curatorDensity)}"
              onchange="window.SoftWaveRouterInstance.updateSetting('curatorDensity', this.value)"
            />
            <span class="density-label">Extremely<br/>Deep Cuts</span>
          </div>
          <p class="density-current">Current: <strong>${settings.curatorDensity}</strong></p>
        </div>

        <div class="settings-group">
          <h2>Preferred Streaming Service</h2>
          <div class="radio-group">
            ${['spotify', 'youtube', 'apple'].map((service) => `
              <label class="radio-label">
                <input
                  type="radio"
                  name="streaming"
                  value="${service}"
                  ${settings.preferredStreaming === service ? 'checked' : ''}
                  onchange="window.SoftWaveRouterInstance.updateSetting('preferredStreaming', '${service}')"
                />
                <span>${service === 'apple' ? 'Apple Music' : service.charAt(0).toUpperCase() + service.slice(1)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="settings-group">
          <h2>Danger Zone</h2>
          <button class="btn btn-danger" onclick="window.SoftWaveRouterInstance.clearAllData()">
            Clear All Saved Data
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Initialize constellation node interactions
   */
  initConstellationInteractions() {
    document.querySelectorAll('.constellation-node').forEach((node) => {
      node.addEventListener('mouseenter', () => {
        node.classList.add('node-hover');
      });
      node.addEventListener('mouseleave', () => {
        node.classList.remove('node-hover');
      });
    });
  }

  /**
   * Handle constellation node selection
   */
  selectConstellationNode(nodeId) {
    const node = this.state.constellationNodes.find((n) => n.id === nodeId);
    if (!node) return;

    const detailsEl = document.getElementById('constellation-details');
    const artists = node.artists.slice(0, 5).join(', ');

    detailsEl.innerHTML = `
      <div class="constellation-node-details">
        <h3>${node.label}</h3>
        <p class="node-mood">${node.description}</p>
        <p><strong>Baseline Artists:</strong></p>
        <p class="artists-list">${artists}</p>
        <button class="btn btn-primary" onclick="window.SoftWaveRouterInstance.curatFromNode('${nodeId}')">
          Curate Playlist from This Mood
        </button>
      </div>
    `;

    // Highlight selected node
    document.querySelectorAll('.constellation-node').forEach((n) => {
      n.classList.remove('node-selected');
    });
    document.querySelector(`[data-node-id="${nodeId}"]`).classList.add('node-selected');
  }

  /**
   * Curate a playlist from a constellation node
   */
  curatFromNode(nodeId) {
    const node = this.state.constellationNodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Pre-populate generator with node's artists and mood
    if (window.CuratorAI && typeof window.CuratorAI.setGeneratorContext === 'function') {
      window.CuratorAI.setGeneratorContext({
        mood: node.label,
        artists: node.artists,
        description: node.description
      });
    }

    // Navigate to generator
    this.navigate('generator');
  }

  /**
   * Save a wave (playlist) to archives
   */
  saveWave(waveData) {
    const wave = {
      id: Date.now().toString(),
      mood: waveData.mood || 'Untitled',
      prompt: waveData.prompt || '',
      tracks: waveData.tracks || [],
      createdAt: new Date().toISOString()
    };

    this.state.savedWaves.push(wave);
    this.persistSavedWaves();
    window.CuratorUtils.showToastNotification('Wave saved to archives!', 'success');

    return wave;
  }

  /**
   * Load a saved wave and navigate to generator
   */
  loadWave(waveId) {
    const wave = this.state.savedWaves.find((w) => w.id === waveId);
    if (!wave) {
      window.CuratorUtils.showToastNotification('Wave not found', 'error');
      return;
    }

    // Pass wave data to generator context
    if (window.CuratorAI) {
      window.CuratorAI.loadedWave = wave;
    }

    this.navigate('generator');
  }

  /**
   * Delete a saved wave
   */
  deleteWave(waveId) {
    if (!confirm('Are you sure you want to delete this wave?')) return;

    this.state.savedWaves = this.state.savedWaves.filter((w) => w.id !== waveId);
    this.persistSavedWaves();

    // Re-render archives
    if (this.currentPage === 'archives') {
      this.renderArchivesPage(document.getElementById(this.pages.archives.id));
    }

    window.CuratorUtils.showToastNotification('Wave deleted', 'info');
  }

  /**
   * Update user settings
   */
  updateSetting(key, value) {
    if (key === 'curatorDensity') {
      value = this.valueToDensity(parseInt(value));
    }

    this.state.userSettings[key] = value;
    this.persistUserSettings();

    if (key === 'curatorDensity') {
      // Update slider display
      const densityLabel = document.querySelector('.density-current strong');
      if (densityLabel) densityLabel.textContent = value;
    }
  }

  /**
   * Clear all user data (with confirmation)
   */
  clearAllData() {
    if (!confirm('This will permanently delete all saved waves and settings. Are you sure?')) return;

    this.state.savedWaves = [];
    this.state.userSettings = {
      apiKey: '',
      curatorDensity: 'balanced',
      preferredStreaming: 'spotify',
      theme: 'dark'
    };

    this.persistSavedWaves();
    this.persistUserSettings();

    window.CuratorUtils.showToastNotification('All data cleared', 'info');
    this.renderProfilePage(document.getElementById(this.pages.profile.id));
  }

  // ========================================================================
  // PERSISTENCE LAYER
  // ========================================================================

  loadSavedWaves() {
    try {
      const stored = localStorage.getItem('softwaveArchivedWaves');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to load saved waves:', e);
      return [];
    }
  }

  persistSavedWaves() {
    try {
      localStorage.setItem('softwaveArchivedWaves', JSON.stringify(this.state.savedWaves));
    } catch (e) {
      console.error('Failed to persist saved waves:', e);
    }
  }

  loadUserSettings() {
    try {
      const stored = localStorage.getItem('softwaveUserSettings');
      return stored
        ? JSON.parse(stored)
        : {
            apiKey: '',
            curatorDensity: 'balanced',
            preferredStreaming: 'spotify',
            theme: 'dark'
          };
    } catch (e) {
      console.warn('Failed to load user settings:', e);
      return null;
    }
  }

  persistUserSettings() {
    try {
      localStorage.setItem('softwaveUserSettings', JSON.stringify(this.state.userSettings));
    } catch (e) {
      console.error('Failed to persist user settings:', e);
    }
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  initConstellationNodes() {
    /**
     * Hand-curated emotional nodes representing different sonic territories.
     * Each node has x/y positioning, artists, and descriptive mood text.
     */
    return [
      {
        id: 'melancholic-midnight',
        label: 'Melancholic Midnight',
        description: 'Late-night introspection with echo-y production and vulnerable vocals.',
        x: 15,
        y: 20,
        artists: ['Daniel Caesar', 'Raahiim', 'Isaiah Falls', 'Sampha', 'Frank Ocean'],
        tracks: [
          { track: 'Get You', artist: 'Daniel Caesar' },
          { track: 'Suffocating', artist: 'Raahiim' }
        ]
      },
      {
        id: 'sun-drenched-lofi',
        label: 'Sun-Drenched Lofi',
        description: 'Warm, analog lo-fi with jazz influences. Sunday morning coffee energy.',
        x: 50,
        y: 10,
        artists: ['Mac Ayres', 'BLK ODYSSY', 'Ólafur Arnalds', 'Syd', 'Reuben Aziz'],
        tracks: [
          { track: 'Warm It Up', artist: 'BLK ODYSSY' },
          { track: 'Good Days', artist: 'Syd' }
        ]
      },
      {
        id: 'sensual-slow',
        label: 'Sensual & Slow',
        description: 'Intimate R&B with spacious production. Perfect for late night vibes.',
        x: 75,
        y: 25,
        artists: ['SZA', 'Bryson Tiller', 'Jacquees', 'ODIE', 'Pink Sweat$'],
        tracks: [
          { track: 'Best Part', artist: 'Daniel Caesar' },
          { track: 'At My Worst', artist: 'Pink Sweat$' }
        ]
      },
      {
        id: 'raw-acoustic',
        label: 'Raw Acoustic',
        description: 'Stripped-down guitar, minimal production. Authenticity over polish.',
        x: 25,
        y: 65,
        artists: ['John Vincent III', 'Gregory Alan Isakov', 'Novo Amor', 'Adrianne Lenker'],
        tracks: [
          { track: 'Sunday Best', artist: 'Surfaces' },
          { track: 'Untitled', artist: 'Mac Ayres' }
        ]
      },
      {
        id: 'ethereal-ambient',
        label: 'Ethereal Ambient',
        description: 'Floating soundscapes. Minimalist, textural, immersive.',
        x: 85,
        y: 60,
        artists: ['Nils Frahm', 'Ólafur Arnalds', 'Shlohmo', 'Ólafur Arnalds', 'Jlin'],
        tracks: [
          { track: 'Bloom', artist: 'Troye Sivan' },
          { track: 'Climax', artist: 'Usher' }
        ]
      },
      {
        id: 'dark-experimental',
        label: 'Dark & Experimental',
        description: 'Unsettling, glitchy, boundary-pushing production.',
        x: 65,
        y: 80,
        artists: ['Arca', 'Holly Herndon', 'Oneohtrix Point Never', 'SOPHIE', 'Merzbow'],
        tracks: [
          { track: 'Bloom (Chlorine Remix)', artist: 'Troye Sivan' },
          { track: 'Obsidian', artist: 'Arca' }
        ]
      },
      {
        id: 'energetic-groovy',
        label: 'Energetic & Groovy',
        description: 'Funky bass lines, uplifting. Dance with purpose.',
        x: 35,
        y: 40,
        artists: ['Anderson .Paak', 'Thundercat', 'Vulfpeck', 'Cory Wong', 'Jacob Mann'],
        tracks: [
          { track: 'Come Down', artist: 'Anderson .Paak' },
          { track: 'Butterflies', artist: 'Herbie Hancock' }
        ]
      },
      {
        id: 'introspective-quiet',
        label: 'Introspective & Quiet',
        description: 'Whisper-soft vocals, minimal arrangements. Inner dialogue.',
        x: 55,
        y: 50,
        artists: ['Bon Iver', 'Sufjan Stevens', 'Elliott Smith', 'The National', 'Adele'],
        tracks: [
          { track: 'Holocene', artist: 'Bon Iver' },
          { track: 'Someone Like You', artist: 'Adele' }
        ]
      }
    ];
  }

  densityToValue(density) {
    const map = { mainstream: 0, balanced: 1, 'deep-cuts': 2, underground: 3 };
    return map[density] || 1;
  }

  valueToDensity(value) {
    const map = { 0: 'mainstream', 1: 'balanced', 2: 'deep-cuts', 3: 'underground' };
    return map[value] || 'balanced';
  }

  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// ============================================================================
// INITIALIZE GLOBAL INSTANCE
// ============================================================================

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.SoftWaveRouterInstance = new SoftWaveRouter();
  });
}

// For module export (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoftWaveRouter;
}
