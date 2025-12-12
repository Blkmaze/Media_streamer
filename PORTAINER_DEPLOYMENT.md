# Deploy Media Streamer via Portainer

**Your Portainer:** http://192.168.1.182:9000

This guide shows you how to find your Jellyfin configuration and deploy Media Streamer using Portainer.

## Part 1: Find Your Jellyfin Configuration

### Step 1: Open Portainer
1. Go to http://192.168.1.182:9000
2. Log in to your Portainer instance

### Step 2: Find Jellyfin Container
1. Click **Containers** in the left sidebar
2. Find the container named `jellyfin` (or similar)
3. Click on the container name to open details

### Step 3: Check Jellyfin Volumes
In the container details page:
1. Scroll down to **Volumes** section
2. You'll see a table with mounts, something like:

| Container Path | Host Path | Type |
|----------------|-----------|------|
| /config | /path/to/jellyfin/config | bind |
| /media/movies | /mnt/storage/movies | bind |
| /media/tv | /mnt/storage/tv | bind |
| /media/music | /mnt/storage/music | bind |

**Write down the "Host Path" values** - these are what you need!

### Step 4: Check Network
While in the container details:
1. Find the **Network** section
2. Note the network name (often `bridge`, `jellyfin_network`, or custom)

### Step 5: Check Radarr/Sonarr (Optional)
Repeat steps 2-3 for:
- **Radarr container** - Note download/media paths
- **Sonarr container** - Note download/media paths

## Part 2: Configure Media Streamer

Based on what you found, edit your `docker-compose.yml`:

### Example Configuration

**If Jellyfin uses:**
- Movies: `/mnt/storage/media/movies`
- TV: `/mnt/storage/media/tv`
- Music: `/mnt/storage/media/music`

**Update docker-compose.yml:**
```yaml
version: '3.8'

services:
  media-streamer:
    build: .
    container_name: media-streamer
    restart: unless-stopped
    ports:
      - "3001:3000"
    volumes:
      # Local media directory
      - ./media:/app/media

      # Mount Jellyfin's media (READ-ONLY)
      - /mnt/storage/media/movies:/app/media/videos/movies:ro
      - /mnt/storage/media/tv:/app/media/videos/tv-shows:ro
      - /mnt/storage/media/music:/app/media/audio/music:ro

      # Upload directory (writable)
      - media-uploads:/app/media/uploads
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/media', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    networks:
      - media-network
      # Uncomment if you want to join Jellyfin's network
      # - jellyfin_network

networks:
  media-network:
    driver: bridge
  # Uncomment if Jellyfin has its own network
  # jellyfin_network:
  #   external: true

volumes:
  media-uploads:
    driver: local
```

## Part 3: Deploy via Portainer

### Method 1: Deploy as Stack (Recommended)

1. In Portainer, go to **Stacks** in the left sidebar
2. Click **+ Add stack**
3. Fill in:
   - **Name:** `media-streamer`
   - **Build method:** Select "Repository"
   - **Repository URL:** `https://github.com/Blkmaze/Media_streamer`
   - **Repository reference:** `claude/improve-test-coverage-012w6CDbJGM2TJrdYVXAUZKJ`
   - **Compose path:** `docker-compose.yml`
4. OR select "Web editor" and paste your updated `docker-compose.yml`
5. Click **Deploy the stack**

### Method 2: Upload from Local Files

1. In Portainer: **Stacks** → **+ Add stack**
2. Name: `media-streamer`
3. Select **Upload** tab
4. Click "Upload file" and select your `docker-compose.yml`
5. Click **Deploy the stack**

### Method 3: Web Editor

1. In Portainer: **Stacks** → **+ Add stack**
2. Name: `media-streamer`
3. Select **Web editor**
4. Copy and paste your entire `docker-compose.yml` content
5. **Update the volume paths** to match your Jellyfin paths
6. Scroll down to **Environment variables** (optional)
   - Add: `NODE_ENV=production`
   - Add: `PORT=3000`
7. Click **Deploy the stack**

## Part 4: Verify Deployment

### Check Container Status
1. Go to **Containers** in Portainer
2. Find `media-streamer` container
3. Status should be "running" with a green indicator
4. Check **Health** status (should be "healthy" after ~30 seconds)

### View Logs
1. Click on the `media-streamer` container
2. Click **Logs** tab
3. You should see:
   ```
   Media Streamer running on http://localhost:3000
   Media directory: /app/media
   ```

### Test Access
1. Open: http://192.168.1.182:3001
2. You should see the Media Streamer interface
3. Your Jellyfin media should appear in the library

## Part 5: Verify Volume Mounts

### In Portainer:
1. Click on `media-streamer` container
2. Scroll to **Volumes** section
3. Verify you see:

| Container Path | Host Path | Mode |
|----------------|-----------|------|
| /app/media | ./media | rw |
| /app/media/videos/movies | /mnt/storage/media/movies | ro |
| /app/media/videos/tv-shows | /mnt/storage/media/tv | ro |
| /app/media/audio/music | /mnt/storage/media/music | ro |
| /app/media/uploads | media-uploads | rw |

### Check Files Are Visible:
1. In Portainer, click on `media-streamer` container
2. Click **Console** tab
3. Click **Connect** with `/bin/sh`
4. Run commands:
   ```sh
   ls -la /app/media/videos/movies
   ls -la /app/media/videos/tv-shows
   ls -la /app/media/audio/music
   ```
5. You should see your Jellyfin media files!

## Part 6: Network Configuration

### Join Jellyfin's Network (Optional)

If you want Media Streamer on the same network as Jellyfin:

1. Find Jellyfin's network:
   - Go to **Networks** in Portainer
   - Note the network name (e.g., `jellyfin_default`)

2. Update your `docker-compose.yml`:
   ```yaml
   networks:
     default:
       external: true
       name: jellyfin_default  # Use your actual network name
   ```

3. Redeploy the stack

## Part 7: Access Points

Once deployed, you can access Media Streamer from:

- **Local network:** http://192.168.1.182:3001
- **Tailscale:** http://[your-tailscale-ip]:3001
- **Via Portainer:** Container → Published Ports → Click port link

## Part 8: Monitor and Manage

### In Portainer Dashboard:

**View Stats:**
- Go to **Containers** → `media-streamer`
- See CPU, Memory, Network usage

**View Logs:**
- Click container → **Logs** tab
- Real-time log streaming

**Restart Container:**
- Click container → **Restart** button

**Update Container:**
1. Go to **Stacks** → `media-streamer`
2. Click **Editor**
3. Make changes
4. Click **Update the stack**

### Health Check:
- Portainer shows health status
- Green checkmark = healthy
- Auto-checks every 30 seconds

## Common Portainer Operations

### Stop Container:
Containers → media-streamer → **Stop**

### Remove Container:
Containers → media-streamer → **Remove** (preserves volumes)

### View Container Inspect:
Containers → media-streamer → **Inspect** → See full config JSON

### Access Console:
Containers → media-streamer → **Console** → Connect with `/bin/sh`

## Example: Real-World Setup

Here's a complete example for a typical setup:

```yaml
version: '3.8'

services:
  media-streamer:
    image: media-streamer:latest
    container_name: media-streamer
    restart: unless-stopped
    ports:
      - "3001:3000"
    volumes:
      # Jellyfin movies (same as Jellyfin container)
      - /mnt/storage/media/movies:/app/media/videos/movies:ro

      # Jellyfin TV shows
      - /mnt/storage/media/tv:/app/media/videos/tv-shows:ro

      # Jellyfin music
      - /mnt/storage/media/music:/app/media/audio/music:ro

      # Radarr downloads (to see what's being processed)
      - /mnt/storage/downloads/radarr:/app/media/videos/radarr-queue:ro

      # Sonarr downloads
      - /mnt/storage/downloads/sonarr:/app/media/videos/sonarr-queue:ro

      # Uploads (writable)
      - media-uploads:/app/media/uploads
    environment:
      - NODE_ENV=production
      - PORT=3000
      - TZ=America/New_York  # Set your timezone
    labels:
      - "com.docker.compose.project=media-infrastructure"
      - "description=Media streaming and upload service"
    networks:
      - jellyfin_default  # Join Jellyfin's network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/media', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3

networks:
  jellyfin_default:
    external: true

volumes:
  media-uploads:
    driver: local
```

## Troubleshooting in Portainer

**Container won't start:**
1. Check logs: Containers → media-streamer → Logs
2. Look for errors in red
3. Common issues:
   - Port conflict: Change from 3001 to another port
   - Volume path doesn't exist: Verify paths exist on host
   - Permission errors: Check file ownership

**Can't see media files:**
1. Console into container: Containers → media-streamer → Console
2. Run: `ls -la /app/media/videos/movies`
3. If empty, volume path is wrong

**Health check failing:**
1. Check logs for startup errors
2. Verify port 3000 is not in use inside container
3. Check application is actually running: `ps aux` in console

**Network issues:**
1. Verify network exists: Networks tab
2. Check container is connected: Container details → Networks
3. Try recreating: Stop → Remove → Redeploy

## Quick Deploy Checklist

- [ ] Found Jellyfin volume paths in Portainer
- [ ] Updated docker-compose.yml with correct paths
- [ ] Created stack in Portainer
- [ ] Container is running (green status)
- [ ] Health check is passing (green checkmark)
- [ ] Logs show "Media Streamer running"
- [ ] Can access http://192.168.1.182:3001
- [ ] Media files are visible in the library
- [ ] Upload functionality works
- [ ] Added to NAS dashboard

## Next Steps

1. **Find your Jellyfin paths** using Portainer (Part 1)
2. **Update docker-compose.yml** with those paths (Part 2)
3. **Deploy via Portainer** as a stack (Part 3)
4. **Verify it's working** (Part 4)
5. **Add to your dashboard** (copy from DASHBOARD_SNIPPET.html)

Your Media Streamer will then:
- ✅ Share the same media library as Jellyfin
- ✅ Show movies/TV/music from Jellyfin
- ✅ Allow uploads to a separate folder
- ✅ Be managed alongside Jellyfin in Portainer
- ✅ Accessible via Tailscale for remote access
