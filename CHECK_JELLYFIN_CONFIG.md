# How to Find Your Jellyfin Configuration

Since you have Jellyfin, Radarr, Sonarr, and Jellystat already running, here's how to find your current configuration and integrate it with Media Streamer.

## Step 1: Find Your Jellyfin Container

Run this command on your system:
```bash
docker ps | grep jellyfin
```

Expected output:
```
CONTAINER ID   IMAGE              PORTS                    NAMES
abc123def456   jellyfin/jellyfin  0.0.0.0:8096->8096/tcp   jellyfin
```

## Step 2: Inspect Jellyfin Volume Mounts

```bash
docker inspect jellyfin | grep -A 20 "Mounts"
```

This will show you something like:
```json
"Mounts": [
    {
        "Type": "bind",
        "Source": "/mnt/storage/media/movies",
        "Destination": "/media/movies",
        "Mode": "",
        "RW": true
    },
    {
        "Type": "bind",
        "Source": "/mnt/storage/media/tv",
        "Destination": "/media/tv",
        "Mode": "",
        "RW": true
    },
    {
        "Type": "bind",
        "Source": "/mnt/storage/media/music",
        "Destination": "/media/music",
        "Mode": "",
        "RW": true
    }
]
```

**The "Source" paths are what you need!**

## Step 3: Check Your Jellyfin docker-compose.yml (if you have it)

If you deployed Jellyfin with docker-compose, find the file:
```bash
# Common locations:
cat ~/jellyfin/docker-compose.yml
cat /opt/jellyfin/docker-compose.yml
cat ~/docker/jellyfin/docker-compose.yml
```

Look for the `volumes:` section:
```yaml
volumes:
  - /mnt/storage/media/movies:/media/movies
  - /mnt/storage/media/tv:/media/tv
  - /mnt/storage/media/music:/media/music
  - /mnt/storage/media/photos:/media/photos
```

## Step 4: Check Jellyfin Library Paths (via Web UI)

1. Open Jellyfin: http://localhost:8096
2. Go to **Dashboard** → **Libraries**
3. Click on each library (Movies, TV Shows, Music)
4. Note the folder paths shown

Example:
- Movies: `/media/movies` or `/data/movies`
- TV Shows: `/media/tv` or `/data/tv`
- Music: `/media/music` or `/data/music`

## Step 5: Check Radarr/Sonarr Paths

These usually download to specific folders that Jellyfin then imports.

**Radarr:**
```bash
docker inspect radarr | grep -A 20 "Mounts"
```

Look for download paths like:
- `/downloads/movies`
- `/data/downloads/movies`

**Sonarr:**
```bash
docker inspect sonarr | grep -A 20 "Mounts"
```

Look for:
- `/downloads/tv`
- `/data/downloads/tv`

## Step 6: Common Setups

### Setup A: Separate Folders
```
/mnt/storage/
├── media/
│   ├── movies/
│   ├── tv/
│   └── music/
└── downloads/
    ├── radarr/
    └── sonarr/
```

### Setup B: Combined Data Folder
```
/data/
├── media/
│   ├── movies/
│   ├── tv/
│   └── music/
└── torrents/
    ├── movies/
    └── tv/
```

### Setup C: NAS Mount
```
/mnt/nas/
├── Movies/
├── TV Shows/
└── Music/
```

## Step 7: Apply to Media Streamer

Once you know your paths, edit `docker-compose.yml`:

**Example for Setup A:**
```yaml
services:
  media-streamer:
    volumes:
      - ./media:/app/media

      # Mount your Jellyfin media (read-only)
      - /mnt/storage/media/movies:/app/media/videos/movies:ro
      - /mnt/storage/media/tv:/app/media/videos/tv-shows:ro
      - /mnt/storage/media/music:/app/media/audio/music:ro

      # Optionally monitor downloads
      - /mnt/storage/downloads/radarr:/app/media/videos/radarr-queue:ro
      - /mnt/storage/downloads/sonarr:/app/media/videos/sonarr-queue:ro

      - media-uploads:/app/media/uploads
```

**Example for Setup B:**
```yaml
volumes:
  - /data/media/movies:/app/media/videos/movies:ro
  - /data/media/tv:/app/media/videos/tv-shows:ro
  - /data/media/music:/app/media/audio/music:ro
  - /data/torrents/movies:/app/media/videos/new-movies:ro
```

**Example for Setup C (NAS):**
```yaml
volumes:
  - /mnt/nas/Movies:/app/media/videos/movies:ro
  - /mnt/nas/TV Shows:/app/media/videos/tv-shows:ro
  - /mnt/nas/Music:/app/media/audio/music:ro
```

## Quick Command to Find Everything

Run this comprehensive check:
```bash
echo "=== JELLYFIN CONFIGURATION ==="
echo ""
echo "1. Jellyfin Container:"
docker ps -a | grep jellyfin
echo ""
echo "2. Jellyfin Mounts:"
docker inspect jellyfin 2>/dev/null | grep -A 50 '"Mounts"' | grep -E '"Source"|"Destination"' | head -20
echo ""
echo "3. Radarr Mounts:"
docker inspect radarr 2>/dev/null | grep -A 50 '"Mounts"' | grep -E '"Source"|"Destination"' | head -10
echo ""
echo "4. Sonarr Mounts:"
docker inspect sonarr 2>/dev/null | grep -A 50 '"Mounts"' | grep -E '"Source"|"Destination"' | head -10
echo ""
echo "5. Common media directories:"
ls -la /mnt/storage/media/ 2>/dev/null || echo "  /mnt/storage/media not found"
ls -la /data/media/ 2>/dev/null || echo "  /data/media not found"
ls -la /mnt/nas/ 2>/dev/null || echo "  /mnt/nas not found"
```

## What to Look For

You need to find:
1. ✅ **Movies path** - Where Jellyfin/Radarr stores movies
2. ✅ **TV Shows path** - Where Jellyfin/Sonarr stores TV
3. ✅ **Music path** - Where Jellyfin stores music (optional)
4. ✅ **Downloads path** - Where Radarr/Sonarr download to (optional)

## After Finding Your Paths

1. Update `docker-compose.yml` with your actual paths
2. Make sure to use `:ro` (read-only) for Jellyfin media
3. Test the mount: `docker-compose config` to validate
4. Deploy: `docker-compose up -d`
5. Verify: Check http://localhost:3001 to see your media

## Need Help?

If you're stuck, share the output of:
```bash
docker inspect jellyfin | grep -A 50 Mounts
```

And I can help you configure the exact paths!
