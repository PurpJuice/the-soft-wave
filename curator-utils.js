/**
 * CURATOR UTILITIES & HELPERS
 * =============================
 * Production-ready utility functions for search link generation,
 * track sanitization, clipboard operations, and API interactions.
 * 
 * Integrates seamlessly with curator-ai-system.js
 */

// ============================================================================
// SANITIZATION: Accuracy Fix for Search Links
// ============================================================================

function sanitizeQuery(artist, track) {
  /**
   * TASK 1.2: Remove remasters, live versions, and special characters
   * to ensure robust search results across all platforms.
   * 
   * Examples:
   *   "Frank Ocean - Pyramids (2012 Remaster)" → "Frank Ocean Pyramids"
   *   "Kendrick Lamar - HUMBLE. [Explicit]" → "Kendrick Lamar HUMBLE"
   *   "¿Téo? Yellow Light" → "Teo Yellow Light"
   */
  
  if (!artist || !track) return '';

  // Combine artist and track
  let query = `${artist} ${track}`.trim();

  // Remove common remaster/version tags
  query = query.replace(/\s*\(\d{4}\s+remaster\)/gi, '');
  query = query.replace(/\s*\(remaster(ed)?\)/gi, '');
  query = query.replace(/\s*\(originally by.*?\)/gi, '');
  query = query.replace(/\s*\(feat\..*?\)/gi, '');
  query = query.replace(/\s*\(ft\..*?\)/gi, '');
  query = query.replace(/\s*\(live.*?\)/gi, '');
  query = query.replace(/\s*\[live\]/gi, '');
  query = query.replace(/\s*\[explicit\]/gi, '');
  query = query.replace(/\s*\(explicit\)/gi, '');
  query = query.replace(/\s*-\s+\d{4}\s+\d{2}\d{2}/gi, ''); // Remove dates
  query = query.replace(/\s*\(radio edit\)/gi, '');
  query = query.replace(/\s*\(extended mix\)/gi, '');
  query = query.replace(/\s*\(version.*?\)/gi, '');

  // Remove extra special characters but keep apostrophes and dashes
  query = query.replace(/[®™©]/g, '');
  query = query.replace(/[«»‹›]/g, '');
  query = query.replace(/\s+/g, ' '); // Normalize whitespace

  // Trim and encode safely
  return query.trim();
}

// ============================================================================
// STREAMING LINK GENERATORS
// ============================================================================

const StreamingLinks = {
  /**
   * Generate clean, reliable search URLs for Spotify, YouTube, and Apple Music.
   * Always use sanitized queries to avoid broken links.
   */

  spotify: (artist, track) => {
    const query = sanitizeQuery(artist, track);
    return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
  },

  youtube: (artist, track) => {
    const query = sanitizeQuery(artist, track);
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  },

  appleMusic: (artist, track) => {
    const query = sanitizeQuery(artist, track);
    return `https://music.apple.com/search?term=${encodeURIComponent(query)}`;
  },

  /**
   * Generate all three links as an object.
   * Useful for batch operations.
   */
  generateAll: (artist, track) => ({
    spotify: StreamingLinks.spotify(artist, track),
    youtube: StreamingLinks.youtube(artist, track),
    appleMusic: StreamingLinks.appleMusic(artist, track)
  })
};

// ============================================================================
// CLIPBOARD OPERATIONS
// ============================================================================

const ClipboardManager = {
  /**
   * Copy text to clipboard with fallback for older browsers.
   * Returns Promise<boolean> indicating success.
   */
  copy: async (text) => {
    try {
      // Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers or non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      return false;
    }
  },

  /**
   * Format tracks as "Artist - Track" and copy to clipboard.
   * Tracks should be array of { artist, track } objects.
   * Shows toast notification on success/failure.
   */
  copyTracklist: async (tracks, showToast = true) => {
    if (!tracks || tracks.length === 0) {
      if (showToast) showToastNotification('No tracks to copy', 'error');
      return false;
    }

    const formatted = tracks
      .map((t) => `${t.artist} - ${t.track}`)
      .join('\n');

    const success = await ClipboardManager.copy(formatted);

    if (showToast) {
      if (success) {
        showToastNotification(
          `Copied ${tracks.length} track${tracks.length !== 1 ? 's' : ''} to clipboard`,
          'success'
        );
      } else {
        showToastNotification('Failed to copy to clipboard', 'error');
      }
    }

    return success;
  },

  /**
   * Copy as JSON (useful for data import/export).
   */
  copyAsJSON: async (tracks, showToast = true) => {
    const json = JSON.stringify(tracks, null, 2);
    const success = await ClipboardManager.copy(json);

    if (showToast) {
      if (success) {
        showToastNotification('Playlist data copied to clipboard', 'success');
      } else {
        showToastNotification('Failed to copy to clipboard', 'error');
      }
    }

    return success;
  }
};

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToastNotification(
  message,
  type = 'info',
  duration = 3000
) {
  /**
   * Display elegant toast notification.
   * Types: 'success', 'error', 'info', 'warning'
   * Auto-dismisses after duration (ms).
   */

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  // Inject styles if not already present
  if (!document.getElementById('toast-styles')) {
    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
      .toast {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: slideUp 0.3s ease-out;
        max-width: 90%;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      .toast-success {
        background-color: var(--success, #4ade80);
        color: white;
      }
      .toast-error {
        background-color: var(--error, #ef4444);
        color: white;
      }
      .toast-info {
        background-color: var(--info, #3b82f6);
        color: white;
      }
      .toast-warning {
        background-color: var(--warning, #f59e0b);
        color: white;
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(styles);
  }

  document.body.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease-out reverse';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, duration);
}

// ============================================================================
// TRACK FORMATTING & UTILITIES
// ============================================================================

const TrackFormatting = {
  /**
   * Format a single track object for display.
   */
  formatTrack: (track) => {
    return {
      ...track,
      displayName: `${track.artist} — ${track.track}`,
      searchableText: `${track.artist} ${track.track} ${track.reason || ''}`.toLowerCase()
    };
  },

  /**
   * Filter and search through tracks.
   */
  searchTracks: (tracks, query) => {
    const normalized = query.toLowerCase();
    return tracks.filter((track) => {
      const searchable = `${track.artist} ${track.track}`.toLowerCase();
      return searchable.includes(normalized);
    });
  },

  /**
   * Sort tracks by artist or track name.
   */
  sortTracks: (tracks, sortBy = 'artist', order = 'asc') => {
    const sorted = [...tracks].sort((a, b) => {
      const aVal = (sortBy === 'artist' ? a.artist : a.track).toLowerCase();
      const bVal = (sortBy === 'artist' ? b.artist : b.track).toLowerCase();
      return aVal.localeCompare(bVal);
    });

    return order === 'desc' ? sorted.reverse() : sorted;
  }
};

// ============================================================================
// API REQUEST BUILDER FOR CURATOR AI
// ============================================================================

const CuratorAPIBuilder = {
  /**
   * Build a complete API request payload for OpenRouter or Google AI Studio.
   * Integrates with curator-system-prompt.js
   */

  buildRequest: (userInput, curatorDensity = 'balanced') => {
    // Ensure curator prompt system is loaded
    if (!window.CuratorPrompt) {
      console.error('curator-system-prompt.js must be loaded before using CuratorAPIBuilder');
      return null;
    }

    return {
      model: 'openrouter/google/gemini-2.0-flash-001', // or your preferred model
      messages: [
        {
          role: 'user',
          content: userInput
        }
      ],
      system: window.CuratorPrompt.getSystemPrompt(curatorDensity),
      temperature: 0.7, // Creativity while maintaining accuracy
      max_tokens: 2000,
      response_format: { type: 'json_object' } // Force JSON if supported
    };
  },

  /**
   * Parse and validate API response.
   * Returns { success: boolean, tracks: array, error?: string }
   */
  processResponse: (apiResponse) => {
    try {
      const content =
        apiResponse.choices?.[0]?.message?.content ||
        apiResponse.response ||
        '';

      if (!content) {
        return {
          success: false,
          tracks: [],
          error: 'Empty API response'
        };
      }

      const tracks = window.CuratorPrompt.parseResponse(content);

      // Validate each track pairing
      const validated = tracks.map((track) => {
        const validation = window.CuratorPrompt.validateTrackPairing(
          track.artist,
          track.track
        );

        if (!validation.isValid) {
          console.warn(`Track validation warnings for "${track.artist} - ${track.track}":`, validation.warnings);
        }

        return track;
      });

      return {
        success: true,
        tracks: validated,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        tracks: [],
        error: `Failed to process API response: ${error.message}`
      };
    }
  }
};

// ============================================================================
// EXPORT FOR FRONTEND INTEGRATION
// ============================================================================

if (typeof window !== 'undefined') {
  window.CuratorUtils = {
    sanitizeQuery,
    StreamingLinks,
    ClipboardManager,
    showToastNotification,
    TrackFormatting,
    CuratorAPIBuilder
  };
}

// For Node/module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeQuery,
    StreamingLinks,
    ClipboardManager,
    showToastNotification,
    TrackFormatting,
    CuratorAPIBuilder
  };
}
