# Service Integration Agents

Automation agents for interacting with your media infrastructure services.

## Available Agents

### 1. Jellyfin Agent (`jellyfin-agent.js`)
Interact with Jellyfin media server

**Features:**
- Get server info and statistics
- List libraries and recently added content
- Search media
- Get currently playing items
- Trigger library scans

### 2. Radarr Agent (`radarr-agent.js`)
Manage movies and downloads

**Features:**
- Search and add movies
- Monitor download queue
- Check calendar for upcoming releases
- Get missing movies
- Trigger movie searches
- Check disk space and health

### 3. Sonarr Agent (`sonarr-agent.js`)
Manage TV shows and episodes

**Features:**
- Search and add TV series
- Monitor download queue
- Check calendar for upcoming episodes
- Get wanted/missing episodes
- Trigger episode/series searches
- Get upcoming releases

### 4. Integration Agent (`integration-agent.js`)
Coordinate between all services

**Features:**
- Unified dashboard statistics
- Cross-service search
- Active downloads from all sources
- Upcoming content calendar
- Service health monitoring

## Setup

### 1. Get API Keys

**Jellyfin:**
1. Open Jellyfin: http://192.168.1.182:8096
2. Dashboard → API Keys → Create new key
3. Copy the key and user ID

**Radarr:**
1. Open Radarr: http://192.168.1.182:7878
2. Settings → General → Security → API Key
3. Copy the key

**Sonarr:**
1. Open Sonarr: http://192.168.1.182:8989
2. Settings → General → Security → API Key
3. Copy the key

### 2. Configure Environment

Create `.env` file in project root:

```env
# Jellyfin Configuration
JELLYFIN_API_KEY=your_jellyfin_api_key_here
JELLYFIN_USER_ID=your_user_id_here
JELLYFIN_URL=http://192.168.1.182:8096

# Radarr Configuration
RADARR_API_KEY=your_radarr_api_key_here
RADARR_URL=http://192.168.1.182:7878

# Sonarr Configuration
SONARR_API_KEY=your_sonarr_api_key_here
SONARR_URL=http://192.168.1.182:8989
```

### 3. Install Dependencies

```bash
npm install
```

## Usage Examples

### Jellyfin Agent

```javascript
const JellyfinAgent = require('./agents/jellyfin-agent');

const jellyfin = new JellyfinAgent({
  baseUrl: 'http://192.168.1.182:8096',
  apiKey: 'your-api-key',
  userId: 'your-user-id'
});

// Get server info
const info = await jellyfin.getServerInfo();
console.log(`Server: ${info.ServerName} v${info.Version}`);

// Get recently added
const recent = await jellyfin.getRecentlyAdded(10);
console.log('Recently added:', recent.map(i => i.Name));

// Search
const results = await jellyfin.search('Inception');
console.log('Search results:', results.Items.length);
```

### Radarr Agent

```javascript
const RadarrAgent = require('./agents/radarr-agent');

const radarr = new RadarrAgent({
  baseUrl: 'http://192.168.1.182:7878',
  apiKey: 'your-api-key'
});

// Get download queue
const queue = await radarr.getQueue();
console.log(`Downloading ${queue.records.length} movies`);

// Search for a movie
const results = await radarr.searchMovie('The Matrix');
console.log('Found movies:', results.length);

// Get missing movies
const missing = await radarr.getMissing();
console.log(`${missing.length} movies are missing`);

// Get upcoming releases
const upcoming = await radarr.getCalendar();
console.log('Upcoming:', upcoming.map(m => m.title));
```

### Sonarr Agent

```javascript
const SonarrAgent = require('./agents/sonarr-agent');

const sonarr = new SonarrAgent({
  baseUrl: 'http://192.168.1.182:8989',
  apiKey: 'your-api-key'
});

// Get download queue
const queue = await sonarr.getQueue();
console.log(`Downloading ${queue.records.length} episodes`);

// Get upcoming episodes
const upcoming = await sonarr.getUpcoming(7);
console.log('Airing this week:', upcoming.length);

// Search for a series
const results = await sonarr.searchSeries('Breaking Bad');
console.log('Found series:', results.length);
```

### Integration Agent

```javascript
const IntegrationAgent = require('./agents/integration-agent');

const agent = new IntegrationAgent();

// Get unified dashboard stats
const stats = await agent.getDashboardStats();
console.log('Movies:', stats.radarr.totalMovies);
console.log('TV Shows:', stats.sonarr.totalSeries);
console.log('Downloading:', stats.radarr.downloading + stats.sonarr.downloading);

// Get all active downloads
const downloads = await agent.getActiveDownloads();
console.log('Active downloads:', downloads.items);

// Get upcoming content
const upcoming = await agent.getUpcoming(7);
console.log('Upcoming movies:', upcoming.movies);
console.log('Upcoming episodes:', upcoming.episodes);

// Check service health
const health = await agent.getHealthStatus();
console.log('Service health:', health);

// Search across all services
const results = await agent.searchAll('Inception');
console.log(`Found ${results.total} results across all services`);
```

## Running Agents

### Command Line

```bash
# Test Jellyfin agent
node agents/jellyfin-agent.js

# Test Radarr agent
node agents/radarr-agent.js

# Test Sonarr agent
node agents/sonarr-agent.js

# Get integrated stats
node agents/integration-agent.js
```

### Via API

Agents are exposed via the Media Streamer API:

```bash
# Get dashboard stats
curl http://localhost:3001/api/agents/stats

# Get active downloads
curl http://localhost:3001/api/agents/downloads

# Get upcoming content
curl http://localhost:3001/api/agents/upcoming

# Search all services
curl http://localhost:3001/api/agents/search?q=Inception

# Check service health
curl http://localhost:3001/api/agents/health
```

## API Endpoints

Add these to your `server.js`:

```javascript
const IntegrationAgent = require('./agents/integration-agent');
const agent = new IntegrationAgent();

// Dashboard stats
app.get('/api/agents/stats', async (req, res) => {
  const stats = await agent.getDashboardStats();
  res.json(stats);
});

// Active downloads
app.get('/api/agents/downloads', async (req, res) => {
  const downloads = await agent.getDownloadStatus();
  res.json(downloads);
});

// Upcoming content
app.get('/api/agents/upcoming', async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const upcoming = await agent.getUpcoming(days);
  res.json(upcoming);
});

// Search all services
app.get('/api/agents/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter required' });
  }
  const results = await agent.searchAll(query);
  res.json(results);
});

// Service health
app.get('/api/agents/health', async (req, res) => {
  const health = await agent.getHealthStatus();
  res.json(health);
});
```

## Automation Examples

### Auto-scan Jellyfin after downloads complete

```javascript
const agent = new IntegrationAgent();

// Check every 5 minutes
setInterval(async () => {
  const downloads = await agent.getDownloadStatus();

  if (downloads.count === 0) {
    // No active downloads, trigger Jellyfin scan
    await agent.jellyfin.scanLibrary();
    console.log('Triggered Jellyfin library scan');
  }
}, 5 * 60 * 1000);
```

### Notify on new content

```javascript
const agent = new IntegrationAgent();

setInterval(async () => {
  const recent = await agent.checkNewContent();

  if (recent.length > 0) {
    console.log('New content added to Jellyfin:');
    recent.forEach(item => {
      console.log(`  - ${item.name} (${item.type})`);
    });
    // Send notification (email, webhook, etc.)
  }
}, 10 * 60 * 1000);
```

### Monitor download progress

```javascript
const agent = new IntegrationAgent();

async function monitorDownloads() {
  const downloads = await agent.getActiveDownloads();

  console.log('=== Active Downloads ===');
  downloads.movies.forEach(m => {
    console.log(`[Movie] ${m.title}: ${m.progress}%`);
  });
  downloads.shows.forEach(s => {
    console.log(`[TV] ${s.title}: ${s.progress}%`);
  });
}

// Run every minute
setInterval(monitorDownloads, 60 * 1000);
```

## Dashboard Integration

Display live stats on your dashboard:

```html
<div id="live-stats">
  <div id="movie-count">Loading...</div>
  <div id="show-count">Loading...</div>
  <div id="download-count">Loading...</div>
</div>

<script>
async function updateStats() {
  const response = await fetch('http://192.168.1.182:3001/api/agents/stats');
  const stats = await response.json();

  document.getElementById('movie-count').textContent =
    `${stats.radarr.totalMovies} Movies`;
  document.getElementById('show-count').textContent =
    `${stats.sonarr.totalSeries} TV Shows`;
  document.getElementById('download-count').textContent =
    `${stats.radarr.downloading + stats.sonarr.downloading} Downloading`;
}

// Update every 30 seconds
updateStats();
setInterval(updateStats, 30000);
</script>
```

## Error Handling

All agents include error handling:

```javascript
try {
  const stats = await agent.getDashboardStats();
  console.log(stats);
} catch (error) {
  console.error('Failed to get stats:', error.message);
}
```

## Security Notes

- **Never commit API keys** to version control
- Store keys in `.env` file (already in `.gitignore`)
- Use read-only API keys where possible
- Restrict API access to local network
- Use Tailscale for secure remote access

## Troubleshooting

**"Connection refused":**
- Check service is running: `docker ps`
- Verify IP address and port
- Check firewall settings

**"Invalid API key":**
- Regenerate API key in service settings
- Update `.env` file
- Restart Media Streamer

**"Timeout":**
- Service may be slow or overloaded
- Increase timeout in agent code
- Check network connectivity

## Future Enhancements

Planned features:
- [ ] Webhook notifications
- [ ] Automatic library cleanup
- [ ] Download priority management
- [ ] Multi-user support
- [ ] Statistics dashboard
- [ ] Scheduled tasks
- [ ] Email notifications
- [ ] Mobile app integration
