const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Media directory setup
const MEDIA_DIR = path.join(__dirname, 'media');
const UPLOADS_DIR = path.join(MEDIA_DIR, 'uploads');

// Ensure directories exist
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mp3|webm|ogg|wav|avi|mkv|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video and audio files are allowed'));
    }
  }
});

// Get all media files
function getMediaFiles(directory) {
  const files = [];
  const items = fs.readdirSync(directory);

  items.forEach(item => {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getMediaFiles(fullPath));
    } else {
      const ext = path.extname(item).toLowerCase();
      if (['.mp4', '.mp3', '.webm', '.ogg', '.wav', '.avi', '.mkv', '.mov'].includes(ext)) {
        files.push({
          name: item,
          path: path.relative(MEDIA_DIR, fullPath),
          size: stat.size,
          modified: stat.mtime,
          type: ext.includes('mp4') || ext.includes('webm') || ext.includes('avi') || ext.includes('mkv') || ext.includes('mov') ? 'video' : 'audio'
        });
      }
    }
  });

  return files;
}

// API Routes

// Get list of all media files
app.get('/api/media', (req, res) => {
  try {
    const files = getMediaFiles(MEDIA_DIR);
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stream media file
app.get('/api/stream/:path(*)', (req, res) => {
  try {
    const filePath = path.join(MEDIA_DIR, req.params.path);

    // Security check - ensure path is within MEDIA_DIR
    const resolvedPath = path.resolve(filePath);
    const resolvedMediaDir = path.resolve(MEDIA_DIR);
    if (!resolvedPath.startsWith(resolvedMediaDir)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': getContentType(filePath),
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range, send entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': getContentType(filePath),
      };

      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload media file
app.post('/api/upload', (req, res) => {
  upload.single('media')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    res.json({
      success: true,
      file: {
        name: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: path.relative(MEDIA_DIR, req.file.path)
      }
    });
  });
});

// Delete media file
app.delete('/api/media/:path(*)', (req, res) => {
  try {
    const filePath = path.join(MEDIA_DIR, req.params.path);

    // Security check
    const resolvedPath = path.resolve(filePath);
    const resolvedMediaDir = path.resolve(MEDIA_DIR);
    if (!resolvedPath.startsWith(resolvedMediaDir)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to get content type
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };
  return types[ext] || 'application/octet-stream';
}

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server only if not in test mode
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Media Streamer running on http://localhost:${PORT}`);
    console.log(`Media directory: ${MEDIA_DIR}`);
  });
}

module.exports = app;
