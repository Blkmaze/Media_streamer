/**
 * Sonarr Agent
 * Interact with Sonarr API for TV show management
 */

const http = require('http');

class SonarrAgent {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://192.168.1.182:8989';
    this.apiKey = config.apiKey || process.env.SONARR_API_KEY;
  }

  /**
   * Make API request to Sonarr
   */
  async request(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(`/api/v3${endpoint}`, this.baseUrl);

      const reqOptions = {
        method: options.method || 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const req = http.request(url, reqOptions, (res) => {
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

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  /**
   * Get system status
   */
  async getStatus() {
    return this.request('/system/status');
  }

  /**
   * Get all series
   */
  async getSeries() {
    return this.request('/series');
  }

  /**
   * Search for a series
   */
  async searchSeries(query) {
    return this.request(`/series/lookup?term=${encodeURIComponent(query)}`);
  }

  /**
   * Add series
   */
  async addSeries(series) {
    return this.request('/series', {
      method: 'POST',
      body: series
    });
  }

  /**
   * Get queue (downloads)
   */
  async getQueue() {
    return this.request('/queue');
  }

  /**
   * Get calendar (upcoming episodes)
   */
  async getCalendar(start, end) {
    const startDate = start || new Date().toISOString().split('T')[0];
    const endDate = end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return this.request(`/calendar?start=${startDate}&end=${endDate}`);
  }

  /**
   * Get wanted/missing episodes
   */
  async getWanted(page = 1, pageSize = 20) {
    return this.request(`/wanted/missing?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Trigger episode search
   */
  async searchEpisode(episodeIds) {
    return this.request('/command', {
      method: 'POST',
      body: {
        name: 'EpisodeSearch',
        episodeIds: Array.isArray(episodeIds) ? episodeIds : [episodeIds]
      }
    });
  }

  /**
   * Trigger series search
   */
  async searchSeriesById(seriesId) {
    return this.request('/command', {
      method: 'POST',
      body: {
        name: 'SeriesSearch',
        seriesId: seriesId
      }
    });
  }

  /**
   * Get disk space
   */
  async getDiskSpace() {
    return this.request('/diskspace');
  }

  /**
   * Get system health
   */
  async getHealth() {
    return this.request('/health');
  }

  /**
   * Get upcoming episodes
   */
  async getUpcoming(days = 7) {
    const calendar = await this.getCalendar();
    return calendar.filter(ep => {
      const airDate = new Date(ep.airDateUtc);
      const now = new Date();
      const diff = (airDate - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= days;
    });
  }
}

module.exports = SonarrAgent;

// Example usage
if (require.main === module) {
  const agent = new SonarrAgent();

  agent.getStatus()
    .then(status => {
      console.log('Sonarr Status:');
      console.log(`  Version: ${status.version}`);
      console.log(`  App Name: ${status.appName}`);
    })
    .catch(err => console.error('Error:', err.message));
}
