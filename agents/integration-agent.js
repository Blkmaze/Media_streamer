/**
 * Integration Agent
 * Coordinates between Jellyfin, Radarr, Sonarr, and Media Streamer
 */

const JellyfinAgent = require('./jellyfin-agent');
const RadarrAgent = require('./radarr-agent');
const SonarrAgent = require('./sonarr-agent');

class IntegrationAgent {
  constructor(config = {}) {
    this.jellyfin = new JellyfinAgent(config.jellyfin);
    this.radarr = new RadarrAgent(config.radarr);
    this.sonarr = new SonarrAgent(config.sonarr);
  }

  /**
   * Get comprehensive dashboard stats
   */
  async getDashboardStats() {
    try {
      const [
        jellyfinInfo,
        radarrQueue,
        sonarrQueue,
        radarrMovies,
        sonarrSeries
      ] = await Promise.all([
        this.jellyfin.getServerInfo().catch(() => null),
        this.radarr.getQueue().catch(() => ({ records: [] })),
        this.sonarr.getQueue().catch(() => ({ records: [] })),
        this.radarr.getMovies().catch(() => []),
        this.sonarr.getSeries().catch(() => [])
      ]);

      return {
        jellyfin: {
          serverName: jellyfinInfo?.ServerName || 'Unknown',
          version: jellyfinInfo?.Version || 'Unknown'
        },
        radarr: {
          totalMovies: radarrMovies.length,
          downloading: radarrQueue.records.length,
          monitored: radarrMovies.filter(m => m.monitored).length,
          missing: radarrMovies.filter(m => !m.hasFile).length
        },
        sonarr: {
          totalSeries: sonarrSeries.length,
          downloading: sonarrQueue.records.length,
          monitored: sonarrSeries.filter(s => s.monitored).length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return null;
    }
  }

  /**
   * Get all active downloads
   */
  async getActiveDownloads() {
    const [radarrQueue, sonarrQueue] = await Promise.all([
      this.radarr.getQueue().catch(() => ({ records: [] })),
      this.sonarr.getQueue().catch(() => ({ records: [] }))
    ]);

    return {
      movies: radarrQueue.records.map(item => ({
        title: item.title,
        status: item.status,
        progress: item.sizeleft > 0 ? ((item.size - item.sizeleft) / item.size * 100).toFixed(1) : 100,
        eta: item.timeleft,
        type: 'movie'
      })),
      shows: sonarrQueue.records.map(item => ({
        title: item.title,
        status: item.status,
        progress: item.sizeleft > 0 ? ((item.size - item.sizeleft) / item.size * 100).toFixed(1) : 100,
        eta: item.timeleft,
        type: 'episode'
      }))
    };
  }

  /**
   * Get upcoming content
   */
  async getUpcoming(days = 7) {
    const [movies, episodes] = await Promise.all([
      this.radarr.getCalendar().catch(() => []),
      this.sonarr.getUpcoming(days).catch(() => [])
    ]);

    return {
      movies: movies.slice(0, 10).map(m => ({
        title: m.title,
        releaseDate: m.physicalRelease || m.digitalRelease || m.inCinemas,
        year: m.year,
        type: 'movie'
      })),
      episodes: episodes.slice(0, 10).map(e => ({
        title: e.series?.title,
        episode: `S${String(e.seasonNumber).padStart(2, '0')}E${String(e.episodeNumber).padStart(2, '0')}`,
        episodeTitle: e.title,
        airDate: e.airDateUtc,
        type: 'episode'
      }))
    };
  }

  /**
   * Check for new content in Jellyfin
   */
  async checkNewContent() {
    const recent = await this.jellyfin.getRecentlyAdded(20);
    return recent.map(item => ({
      name: item.Name,
      type: item.Type,
      added: item.DateCreated,
      path: item.Path
    }));
  }

  /**
   * Sync Radarr/Sonarr downloads with Media Streamer
   */
  async getDownloadStatus() {
    const downloads = await this.getActiveDownloads();
    const total = downloads.movies.length + downloads.shows.length;

    return {
      active: total > 0,
      count: total,
      movies: downloads.movies.length,
      shows: downloads.shows.length,
      items: [...downloads.movies, ...downloads.shows]
    };
  }

  /**
   * Get health status of all services
   */
  async getHealthStatus() {
    const health = {
      jellyfin: 'unknown',
      radarr: 'unknown',
      sonarr: 'unknown'
    };

    try {
      await this.jellyfin.getServerInfo();
      health.jellyfin = 'healthy';
    } catch (e) {
      health.jellyfin = 'offline';
    }

    try {
      await this.radarr.getStatus();
      health.radarr = 'healthy';
    } catch (e) {
      health.radarr = 'offline';
    }

    try {
      await this.sonarr.getStatus();
      health.sonarr = 'healthy';
    } catch (e) {
      health.sonarr = 'offline';
    }

    return health;
  }

  /**
   * Search across all services
   */
  async searchAll(query) {
    const [jellyfinResults, radarrResults, sonarrResults] = await Promise.all([
      this.jellyfin.search(query).catch(() => ({ Items: [] })),
      this.radarr.searchMovie(query).catch(() => []),
      this.sonarr.searchSeries(query).catch(() => [])
    ]);

    return {
      jellyfin: jellyfinResults.Items || [],
      radarr: radarrResults,
      sonarr: sonarrResults,
      total: (jellyfinResults.Items?.length || 0) + radarrResults.length + sonarrResults.length
    };
  }
}

module.exports = IntegrationAgent;

// Example usage
if (require.main === module) {
  const agent = new IntegrationAgent();

  agent.getDashboardStats()
    .then(stats => {
      console.log('=== Dashboard Stats ===');
      console.log(JSON.stringify(stats, null, 2));
    })
    .catch(err => console.error('Error:', err));
}
