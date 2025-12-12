# Quick Portainer Deployment Guide

Deploy Media Streamer to your server at **192.168.1.182** using Portainer.

## Step-by-Step Deployment

### 1. Open Portainer
Go to: **http://192.168.1.182:9000**

### 2. Navigate to Stacks
- Click **"Stacks"** in the left sidebar
- Click **"+ Add stack"** button

### 3. Configure Stack

**Name:** `media-streamer`

**Build method:** Select **"Repository"**

**Repository Configuration:**
- **Repository URL:** `https://github.com/Blkmaze/Media_streamer`
- **Repository reference:** `claude/improve-test-coverage-012w6CDbJGM2TJrdYVXAUZKJ`
- **Compose path:** `docker-compose.yml`

### 4. Deploy
Click **"Deploy the stack"** at the bottom

### 5. Wait for Build
- Portainer will clone the repo
- Build the Docker image
- Start the container
- This takes 1-2 minutes

### 6. Verify Deployment

**Check Container Status:**
1. Go to **Containers** in Portainer
2. Find `media-streamer`
3. Status should be **green** with "running"
4. Health check should show **healthy** (after ~30 seconds)

**Check Logs:**
1. Click on `media-streamer` container
2. Click **Logs** tab
3. Should see:
   ```
   Media Streamer running on http://localhost:3000
   Media directory: /app/media
   Integration agents not available (missing dependencies or config)
   ```

**Test Access:**
- Open: http://192.168.1.182:3001
- You should see the Media Streamer interface!

## What Gets Deployed

✅ Media Streamer running on **port 3001**
✅ Web interface accessible
✅ API endpoints ready
✅ Media directories created:
   - `/app/media/videos`
   - `/app/media/audio`
   - `/app/media/uploads`

## Next Steps After Deployment

### A. Update Your Dashboard
1. Open: `Media_streamer/NAS-Apps-Dashboard.html`
2. Copy **entire contents**
3. Replace: `C:/Users/Willie Mayes/OneDrive/Desktop/NAS-Apps-Dashboard.html`
4. Refresh browser to see new dashboard with live stats

### B. Share Jellyfin Media (Optional)
1. In Portainer, go to **Stacks** → `media-streamer`
2. Click **Editor**
3. Find the `volumes:` section
4. Uncomment and update these lines:
   ```yaml
   # - /path/to/your/movies:/app/media/videos/movies:ro
   # - /path/to/your/music:/app/media/audio/music:ro
   ```
5. Replace paths with your actual Jellyfin paths (see PORTAINER_DEPLOYMENT.md)
6. Click **Update the stack**

### C. Enable Live Stats (Optional)
1. Get API keys from:
   - Jellyfin: http://192.168.1.182:8096 → Dashboard → API Keys
   - Radarr: http://192.168.1.182:7878 → Settings → General → API Key
   - Sonarr: http://192.168.1.182:8989 → Settings → General → API Key

2. In Portainer, edit the stack and add environment variables:
   ```yaml
   environment:
     - NODE_ENV=production
     - PORT=3000
     - JELLYFIN_API_KEY=your_key_here
     - JELLYFIN_USER_ID=your_user_id_here
     - RADARR_API_KEY=your_key_here
     - SONARR_API_KEY=your_key_here
   ```

3. Click **Update the stack**

## Troubleshooting

**Stack fails to deploy:**
- Check repository URL is correct
- Verify branch name: `claude/improve-test-coverage-012w6CDbJGM2TJrdYVXAUZKJ`
- Try "Web editor" method instead (see below)

**Container won't start:**
- Check logs in Portainer
- Verify port 3001 isn't already in use
- Try changing port in docker-compose.yml

**Can't access http://192.168.1.182:3001:**
- Verify container is running in Portainer
- Check firewall on your server
- Try: `curl http://localhost:3001` from server

**Health check fails:**
- Wait 30-60 seconds for app to fully start
- Check logs for errors
- Restart container in Portainer

## Alternative: Web Editor Method

If repository method doesn't work:

1. Portainer → Stacks → "+ Add stack"
2. Name: `media-streamer`
3. Select **"Web editor"**
4. Copy contents of `docker-compose.yml` from the repo
5. Paste into editor
6. Deploy

## Access Points After Deployment

- **Web Interface:** http://192.168.1.182:3001
- **API Endpoint:** http://192.168.1.182:3001/api/media
- **Upload:** http://192.168.1.182:3001 (use web interface)
- **Stats API:** http://192.168.1.182:3001/api/agents/stats
- **Health Check:** http://192.168.1.182:3001/api/agents/health

## Managing the Container

**View Logs:**
Portainer → Containers → media-streamer → Logs

**Restart:**
Portainer → Containers → media-streamer → Restart

**Stop:**
Portainer → Containers → media-streamer → Stop

**Remove:**
Portainer → Stacks → media-streamer → Remove

**Update:**
Portainer → Stacks → media-streamer → Editor → Update the stack

## Quick Commands Reference

If you need CLI access:

```bash
# View logs
docker logs media-streamer

# Restart
docker restart media-streamer

# Stop
docker stop media-streamer

# Remove and redeploy
cd ~/Media_streamer
git pull
docker-compose up -d --build
```

---

**You're all set!** After deployment, Media Streamer will be accessible at http://192.168.1.182:3001 and visible in your Portainer dashboard.
