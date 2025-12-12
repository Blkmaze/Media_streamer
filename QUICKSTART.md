# Quick Start Guide

Get your Media Streamer up and running in minutes!

## Prerequisites

Choose one of these options:

**Option A: Docker (Recommended)**
- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- docker-compose installed ([Get docker-compose](https://docs.docker.com/compose/install/))

**Option B: Node.js**
- Node.js 18+ installed ([Get Node.js](https://nodejs.org/))
- npm (comes with Node.js)

## Installation Steps

### Using Docker (Recommended)

1. **Clone and setup**
   ```bash
   git clone <your-repo-url>
   cd Media_streamer
   ./setup.sh
   ```

2. **Start the container**
   ```bash
   docker-compose up -d
   ```

3. **Access the app**
   Open http://localhost:3000 in your browser

That's it! 🎉

### Using Node.js

1. **Clone and install**
   ```bash
   git clone <your-repo-url>
   cd Media_streamer
   npm install
   ```

2. **Start the server**
   ```bash
   npm start
   ```

3. **Access the app**
   Open http://localhost:3000 in your browser

## First Time Setup

### 1. Add Your First Media File

**Via Web Interface:**
1. Click the upload button
2. Select a video or audio file
3. Wait for upload to complete
4. Click "Play" to start streaming!

**Via File System:**
1. Copy media files to:
   - Videos: `media/videos/`
   - Audio: `media/audio/`
2. Refresh the library in the web interface

### 2. Connect to Your NAS or Media Library

Edit `docker-compose.yml` to mount your existing media:

```yaml
volumes:
  - /mnt/nas/movies:/app/media/videos/movies:ro
  - /mnt/nas/music:/app/media/audio/music:ro
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### 3. Add to Your Dashboard

1. Open `DASHBOARD_SNIPPET.html`
2. Copy the HTML code
3. Paste into your NAS dashboard HTML file
4. Customize the URL if needed (change `localhost` to your server IP)

## Common Commands

### Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build

# Check status
docker-compose ps
```

### Node.js Commands

```bash
# Start
npm start

# Development mode (auto-reload)
npm run dev

# Run tests
npm test

# Stop (Ctrl+C or)
pkill -f "node server.js"
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```env
PORT=3000                    # Server port
MAX_FILE_SIZE=524288000      # Upload limit (500MB)
NODE_ENV=production          # Environment
```

### Custom Port

**Docker:**
Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Access on port 8080
```

**Node.js:**
```bash
PORT=8080 npm start
```

## Accessing from Other Devices

### On Your Local Network

1. Find your server IP:
   ```bash
   # Linux/Mac
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. Access from other devices:
   ```
   http://YOUR_SERVER_IP:3000
   ```

### Using a Domain Name

Set up a reverse proxy (nginx, Traefik) and configure DNS to point to your server.

Example nginx config:
```nginx
server {
    listen 80;
    server_name media.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs

# Check if port is already in use
lsof -i :3000

# Remove and recreate
docker-compose down
docker-compose up -d
```

### Can't upload files
- Check disk space: `df -h`
- Verify permissions: `ls -la media/uploads/`
- Check file size (max 500MB by default)

### Files not showing in library
- Refresh the page
- Check file extensions are supported
- Verify files are in `media/` directory
- Check container logs: `docker-compose logs`

### Streaming is slow
- Check network speed
- Verify file isn't corrupted
- Try a smaller file first
- Check server CPU/RAM usage

## Next Steps

1. **Organize Your Media**
   - Read [MEDIA_ORGANIZATION.md](MEDIA_ORGANIZATION.md) for tips
   - Set up folder structure
   - Import your existing library

2. **Secure Your Setup**
   - Add authentication (see README.md)
   - Set up SSL with Let's Encrypt
   - Configure firewall rules

3. **Optimize Performance**
   - Transcode videos to web formats
   - Use SSD for frequently accessed files
   - Set up caching reverse proxy

## Getting Help

- Check the [README.md](README.md) for detailed documentation
- Review [MEDIA_ORGANIZATION.md](MEDIA_ORGANIZATION.md) for organization tips
- Run tests: `npm test`
- Check logs: `docker-compose logs -f`

## Uninstallation

### Docker
```bash
docker-compose down -v  # -v removes volumes
docker rmi media-streamer
rm -rf Media_streamer/
```

### Node.js
```bash
# Stop server (Ctrl+C)
rm -rf Media_streamer/
```

---

**Happy Streaming! 🎬🎵**
