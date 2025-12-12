/**
 * Radarr Agent
 * Interact with Radarr API for movie management
 */

const http = require('http');

class RadarrAgent {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://192.168.1.182:7878';
    this.apiKey = config.apiKey || process.env.RADARR_API_KEY;
  }

  /**
   * Make API request to Radarr
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
   * Get all movies
   */
  async getMovies() {
    return this.request('/movie');
  }

  /**
   * Search for a movie
   */
  async searchMovie(query) {
    return this.request(`/movie/lookup?term=${encodeURIComponent(query)}`);
  }

  /**
   * Add movie
   */
  async addMovie(movie) {
    return this.request('/movie', {
      method: 'POST',
      body: movie
    });
  }

  /**
   * Get queue (downloads)
   */
  async getQueue() {
    return this.request('/queue');
  }

  /**
   * Get calendar (upcoming releases)
   */
  async getCalendar(start, end) {
    const startDate = start || new Date().toISOString().split('T')[0];
    const endDate = end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return this.request(`/calendar?start=${startDate}&end=${endDate}`);
  }

  /**
   * Get missing movies
   */
  async getMissing() {
    const movies = await this.getMovies();
    return movies.filter(m => !m.hasFile);
  }

  /**
   * Trigger movie search
   */
  async searchMovieById(movieId) {
    return this.request('/command', {
      method: 'POST',
      body: {
        name: 'MoviesSearch',
        movieIds: [movieId]
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
}

module.exports = RadarrAgent;

// Example usage
if (require.main === module) {
  const agent = new RadarrAgent();

  agent.getStatus()
    .then(status => {
      console.log('Radarr Status:');
      console.log(`  Version: ${status.version}`);
      console.log(`  App Name: ${status.appName}`);
    })
    .catch(err => console.error('Error:', err.message));
}
