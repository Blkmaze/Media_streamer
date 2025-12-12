# Jellyfin/Radarr/Sonarr Integration Guide

This guide explains how to integrate Media Streamer with your existing media infrastructure.

## Your Current Setup

- **Portainer** - Docker management
- **Radarr** - Movie management
- **Sonarr** - TV show management
- **Jellyfin** - Media server
- **Jellystat** - Jellyfin statistics
- **Tailscale** - VPN/remote access

## Integration Options

### Option 1: Share Jellyfin's Media Library (Recommended)

Mount your existing Jellyfin media as read-only in the Media Streamer:

**Edit docker-compose.yml:**
```yaml
services:
  media-streamer:
    volumes:
      - ./media:/app/media

      # Mount Jellyfin's libraries (read-only)
      - /path/to/jellyfin/movies:/app/media/videos/movies:ro
      - /path/to/jellyfin/tv-shows:/app/media/videos/tv-shows:ro
      - /path/to/jellyfin/music:/app/media/audio/music:ro

      # Radarr/Sonarr download folders (if needed)
      # - /path/to/radarr/downloads:/app/media/videos/new-movies:ro
      # - /path/to/sonarr/downloads:/app/media/videos/new-shows:ro

      - media-uploads:/app/media/uploads

    # Join same network as Jellyfin (optional)
    networks:
      - media-network
      - jellyfin-network  # If Jellyfin has its own network

networks:
  media-network:
    driver: bridge
  jellyfin-network:
    external: true  # If using existing Jellyfin network
```

### Option 2: Use Shared Network Storage

If you're using NAS/network storage for Jellyfin:

```yaml
volumes:
  # Mount NAS/SMB/NFS shares
  - type: bind
    source: /mnt/nas/media/movies
    target: /app/media/videos/movies
    read_only: true

  - type: bind
    source: /mnt/nas/media/tv
    target: /app/media/videos/tv-shows
    read_only: true
```

### Option 3: Separate Libraries

Keep Media Streamer independent but add it to Portainer:

```yaml
# Standard setup, manage via Portainer
services:
  media-streamer:
    build: .
    container_name: media-streamer
    labels:
      - "com.docker.compose.project=media-infrastructure"
      - "maintainer=your-name"
```

## Portainer Integration

### Method 1: Deploy via Portainer Stack

1. Open Portainer (usually http://localhost:9000)
2. Go to **Stacks** → **Add Stack**
3. Name it: `media-streamer`
4. Paste your `docker-compose.yml` content
5. Set environment variables if needed
6. Click **Deploy the stack**

### Method 2: Import from Git

1. In Portainer: **Stacks** → **Add Stack**
2. Choose **Repository**
3. Enter your Git repository URL
4. Compose path: `docker-compose.yml`
5. Deploy

### Method 3: Existing Docker Compose

If you deployed via command line:
```bash
docker-compose up -d
```

Portainer will automatically detect it in **Containers** view.

## Network Configuration

### Join Existing Docker Networks

If your media stack shares a network:

```bash
# List existing networks
docker network ls

# Example: Connect to jellyfin network
docker network connect jellyfin-network media-streamer
```

**Or in docker-compose.yml:**
```yaml
networks:
  default:
    external: true
    name: jellyfin-network  # Use your existing network name
```

## Typical Media Stack Architecture

```
┌─────────────────────────────────────────┐
│           Tailscale VPN                  │
│  (Remote Access to all services)         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    ┌───▼────┐  ┌──▼────┐  ┌──▼──────┐
    │ Radarr │  │Sonarr │  │Portainer│
    │        │  │       │  │         │
    └───┬────┘  └──┬────┘  └─────────┘
        │          │
        └────┬─────┘
             │
    ┌────────▼────────┐
    │  Shared Storage │
    │  /mnt/media/    │
    └────────┬────────┘
             │
        ┌────┼────┐
        │    │    │
    ┌───▼─┐ │ ┌──▼───────────┐
    │Jelly│ │ │Media Streamer│
    │fin  │ │ │              │
    └───┬─┘ │ └──────────────┘
        │   │
    ┌───▼───▼──┐
    │Jellystat │
    └──────────┘
```

## Common Volume Paths

Find your Jellyfin media paths:

```bash
# Check Jellyfin container
docker inspect jellyfin | grep -A 10 Mounts

# Typical paths:
# Movies: /media/movies or /data/movies
# TV: /media/tv or /data/tv
# Music: /media/music
```

**Example real-world setup:**
```yaml
services:
  media-streamer:
    volumes:
      # Point to same media as Jellyfin
      - /mnt/storage/movies:/app/media/videos/movies:ro
      - /mnt/storage/tv:/app/media/videos/tv-shows:ro
      - /mnt/storage/music:/app/media/audio/music:ro

      # Uploads separate
      - media-uploads:/app/media/uploads
```

## Port Conflicts

Make sure ports don't conflict:

- **Jellyfin**: 8096
- **Radarr**: 7878
- **Sonarr**: 8989
- **Portainer**: 9000
- **Tailscale**: Various
- **Jellystat**: 3000 (⚠️ CONFLICT!)
- **Media Streamer**: 3000 (⚠️ CONFLICT!)

**Solution - Change Media Streamer port:**
```yaml
ports:
  - "3001:3000"  # Access on port 3001 instead
```

Or update `.env`:
```env
PORT=3001
```

## Reverse Proxy Setup (Optional)

If using nginx/Traefik with Jellyfin:

**nginx example:**
```nginx
# Jellyfin
location /jellyfin {
    proxy_pass http://jellyfin:8096;
}

# Media Streamer
location /media-streamer {
    proxy_pass http://media-streamer:3000;
}
```

**Traefik labels:**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.media-streamer.rule=Host(`media.yourdomain.com`)"
  - "traefik.http.services.media-streamer.loadbalancer.server.port=3000"
```

## Access via Tailscale

Once deployed, access from anywhere via Tailscale:

```
http://[your-tailscale-ip]:3000
```

Or set up a Tailscale DNS name:
```
http://your-server.tailnet-name.ts.net:3000
```

## Dashboard Integration

Add to your NAS dashboard alongside Jellyfin:

```html
<!-- Jellyfin -->
<div class="app-card">
  <h3>🎬 Jellyfin</h3>
  <a href="http://localhost:8096">Open</a>
</div>

<!-- Media Streamer -->
<div class="app-card">
  <h3>📺 Media Streamer</h3>
  <a href="http://localhost:3001">Open</a>
</div>

<!-- Radarr -->
<div class="app-card">
  <h3>🎥 Radarr</h3>
  <a href="http://localhost:7878">Open</a>
</div>

<!-- Sonarr -->
<div class="app-card">
  <h3>📺 Sonarr</h3>
  <a href="http://localhost:8989">Open</a>
</div>
```

## Use Cases

**When to use Media Streamer vs Jellyfin:**

### Use Media Streamer for:
- Quick file uploads
- Simple streaming without metadata
- Temporary/personal videos
- Quick access to specific files
- Lightweight alternative

### Use Jellyfin for:
- Full media library with metadata
- Multiple users
- Transcoding
- TV/movie collections
- Mobile apps

### Use Both:
- Jellyfin for main library
- Media Streamer for quick uploads/personal content
- Both share same storage backend

## Complete Example

```yaml
version: '3.8'

services:
  media-streamer:
    build: .
    container_name: media-streamer
    restart: unless-stopped
    ports:
      - "3001:3000"  # Changed to avoid conflict with Jellystat
    volumes:
      # Share Jellyfin's media (read-only)
      - /mnt/storage/movies:/app/media/videos/movies:ro
      - /mnt/storage/tv:/app/media/videos/tv-shows:ro
      - /mnt/storage/music:/app/media/audio/music:ro

      # Radarr downloads (when processing)
      - /mnt/storage/radarr/downloads:/app/media/videos/new-movies:ro

      # Separate uploads folder
      - media-uploads:/app/media/uploads
    environment:
      - NODE_ENV=production
      - PORT=3000
    networks:
      - media-network
    labels:
      - "com.docker.compose.project=media-stack"

networks:
  media-network:
    external: true  # Join existing network

volumes:
  media-uploads:
    driver: local
```

## Monitoring in Portainer

Once deployed:
1. Open Portainer
2. **Containers** → Select `media-streamer`
3. View logs, stats, console
4. Quick actions: Stop, Restart, Kill

## Troubleshooting

**Can't see Jellyfin media:**
- Check volume paths match Jellyfin's
- Verify read permissions: `ls -la /mnt/storage/movies`
- Check container logs: `docker logs media-streamer`

**Port 3000 already in use:**
- Change to 3001 or another port
- Check: `docker ps | grep 3000`

**Network issues:**
- Verify network exists: `docker network ls`
- Join manually: `docker network connect [network] media-streamer`

**Portainer can't see it:**
- Refresh: Click refresh in Containers view
- Check labels are set
- Ensure Portainer can access Docker socket
