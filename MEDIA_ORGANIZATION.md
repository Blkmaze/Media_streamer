# Media Organization Guide

This guide explains how to organize your media files for optimal use with the Media Streamer.

## Directory Structure

```
media/
├── videos/          # Store video files here
│   ├── movies/
│   ├── tv-shows/
│   └── personal/
├── audio/           # Store audio files here
│   ├── music/
│   ├── podcasts/
│   └── audiobooks/
└── uploads/         # Auto-managed by the app
    └── (uploaded files appear here)
```

## Recommended Organization

### Videos

**Movies:**
```
media/videos/movies/
├── Action/
│   ├── movie-name-1.mp4
│   └── movie-name-2.mp4
├── Comedy/
└── Drama/
```

**TV Shows:**
```
media/videos/tv-shows/
├── Show Name/
│   ├── Season 01/
│   │   ├── S01E01.mp4
│   │   └── S01E02.mp4
│   └── Season 02/
```

**Personal Videos:**
```
media/videos/personal/
├── 2024/
│   ├── vacation.mp4
│   └── birthday.mp4
└── 2023/
```

### Audio

**Music:**
```
media/audio/music/
├── Artist Name/
│   ├── Album Name/
│   │   ├── 01-track-name.mp3
│   │   └── 02-track-name.mp3
```

**Podcasts:**
```
media/audio/podcasts/
├── Podcast Name/
│   ├── episode-001.mp3
│   └── episode-002.mp3
```

## Adding Media Files

### Method 1: Web Upload
1. Open http://localhost:3000
2. Click the upload button
3. Select your media file
4. Files will be stored in `media/uploads/`

### Method 2: Direct Copy
1. Copy files to appropriate folders:
   - Videos → `media/videos/`
   - Audio → `media/audio/`
2. Refresh the library in the web interface

### Method 3: Docker Volume
If using Docker, you can mount your existing media library:

```yaml
# In docker-compose.yml
volumes:
  - ./media:/app/media
  - /path/to/your/movies:/app/media/videos/movies:ro  # Read-only
  - /path/to/your/music:/app/media/audio/music:ro     # Read-only
```

## File Naming Best Practices

### Videos
- Use descriptive names: `movie-title-2024.mp4`
- Include quality if relevant: `movie-title-1080p.mp4`
- Avoid special characters: Use hyphens instead of spaces

### Audio
- Format: `artist-name - song-title.mp3`
- Include track numbers: `01-song-title.mp3`
- Keep consistent naming within albums

## Supported Formats

### Video
- MP4 (H.264/H.265)
- WebM
- AVI
- MKV
- MOV

### Audio
- MP3
- WAV
- OGG

## Storage Tips

1. **Use symbolic links** for large media libraries:
   ```bash
   ln -s /mnt/nas/movies media/videos/movies
   ```

2. **Set up automatic organization** with tools like:
   - Filebot for movies/TV shows
   - MusicBrainz Picard for music

3. **Regular maintenance:**
   - Delete duplicate files
   - Organize new uploads periodically
   - Check for corrupted files

## Docker Volumes

When using Docker, your media persists in:
- **Named volume:** `media-uploads` (managed by Docker)
- **Bind mount:** `./media` (mapped to your local folder)

To backup:
```bash
# Backup uploads volume
docker run --rm -v media-uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restore uploads volume
docker run --rm -v media-uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## Performance Optimization

1. **SSD Storage:** For frequently accessed files
2. **Network Storage:** Mount NAS for large libraries
3. **Transcoding:** Pre-encode to web-friendly formats (MP4/H.264)
4. **File Size:** Keep individual files under 4GB for best streaming

## Security Notes

- The `uploads/` folder is writable by the app
- Other folders can be mounted read-only for safety
- Never expose the server directly to the internet without authentication
- Consider using a reverse proxy (nginx, Traefik) with SSL

## Troubleshooting

**Files not appearing?**
- Check file permissions (readable by user running the app)
- Ensure file extensions are supported
- Refresh the library in the web interface

**Slow streaming?**
- Check network speed
- Verify file isn't corrupted
- Consider transcoding large files

**Docker volume issues?**
- Verify volume mounts: `docker-compose config`
- Check permissions: `ls -la media/`
- Restart container: `docker-compose restart`
