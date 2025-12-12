/**
 * Jellyfin Agent
 * Interact with Jellyfin API for library management and stats
 */

const https = require('https');
const http = require('http');

class JellyfinAgent {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://192.168.1.182:8096';
    this.apiKey = config.apiKey || process.env.JELLYFIN_API_KEY;
    this.userId = config.userId || process.env.JELLYFIN_USER_ID;
  }

  /**
   * Make API request to Jellyfin
   */
  async request(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);

      if (this.apiKey) {
        url.searchParams.append('api_key', this.apiKey);
      }

      const reqOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-Emby-Token': this.apiKey }),
          ...options.headers
        }
      };

      const protocol = url.protocol === 'https:' ? https : http;

      const req = protocol.get(url, reqOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Get server info
   */
  async getServerInfo() {
    return this.request('/System/Info/Public');
  }

  /**
   * Get all libraries
   */
  async getLibraries() {
    return this.request(`/Users/${this.userId}/Views`);
  }

  /**
   * Get recently added items
   */
  async getRecentlyAdded(limit = 20) {
    return this.request(
      `/Users/${this.userId}/Items/Latest?Limit=${limit}&Fields=BasicSyncInfo,MediaSourceCount,Path`
    );
  }

  /**
   * Get library statistics
   */
  async getLibraryStats(libraryId) {
    return this.request(`/Items/Counts?UserId=${this.userId}&ParentId=${libraryId}`);
  }

  /**
   * Search for media
   */
  async search(query) {
    return this.request(
      `/Users/${this.userId}/Items?searchTerm=${encodeURIComponent(query)}&Recursive=true`
    );
  }

  /**
   * Get currently playing items
   */
  async getNowPlaying() {
    return this.request('/Sessions');
  }

  /**
   * Get user library stats
   */
  async getUserStats() {
    const libraries = await this.getLibraries();
    const stats = {};

    for (const lib of libraries.Items || []) {
      const counts = await this.getLibraryStats(lib.Id);
      stats[lib.Name] = counts;
    }

    return stats;
  }

  /**
   * Trigger library scan
   */
  async scanLibrary(libraryId) {
    return this.request(`/Library/Refresh?libraryId=${libraryId}`, {
      method: 'POST'
    });
  }
}

module.exports = JellyfinAgent;

// Example usage
if (require.main === module) {
  const agent = new JellyfinAgent();

  agent.getServerInfo()
    .then(info => {
      console.log('Jellyfin Server Info:');
      console.log(`  Version: ${info.Version}`);
      console.log(`  Name: ${info.ServerName}`);
    })
    .catch(err => console.error('Error:', err.message));
}
