# Media Streamer

A simple, lightweight media streaming server with a clean web interface for streaming video and audio files.

## Features

- Stream video files (MP4, WebM, AVI, MKV, MOV)
- Stream audio files (MP3, WAV, OGG)
- Upload new media files through web interface
- Delete unwanted files
- Range request support for efficient streaming
- Responsive web player
- Filter library by media type
- Beautiful, modern UI

## Installation

### Option 1: Docker (Recommended)

```bash
# Using docker-compose
docker-compose up -d

# Or using docker directly
docker build -t media-streamer .
docker run -d -p 3000:3000 -v $(pwd)/media:/app/media --name media-streamer media-streamer
```

### Option 2: Node.js

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Usage

### Docker

```bash
# Start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Node.js

Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### Access the web interface

Open your browser and navigate to:
```
http://localhost:3000
```

### Add media files

You can add media files in two ways:

1. **Web Upload**: Use the upload form in the web interface
2. **Manual**: Place files directly in the `media/` directory

## API Endpoints

### Get Media Library

```
GET /api/media
```

Returns a list of all available media files.

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "name": "example.mp4",
      "path": "uploads/example.mp4",
      "size": 1024000,
      "modified": "2025-12-12T10:00:00.000Z",
      "type": "video"
    }
  ]
}
```

### Stream Media

```
GET /api/stream/:path
```

Streams the requested media file. Supports range requests for partial content delivery.

**Parameters:**
- `path`: Relative path to the media file within the media directory

**Headers:**
- `Range` (optional): Byte range for partial content (e.g., "bytes=0-1023")

### Upload Media

```
POST /api/upload
```

Upload a new media file.

**Body:**
- `media`: File (multipart/form-data)

**Response:**
```json
{
  "success": true,
  "file": {
    "name": "1234567890-video.mp4",
    "originalName": "video.mp4",
    "size": 1024000,
    "path": "uploads/1234567890-video.mp4"
  }
}
```

### Delete Media

```
DELETE /api/media/:path
```

Delete a media file.

**Parameters:**
- `path`: Relative path to the media file

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Configuration

### Port

Set the port using the `PORT` environment variable:

```bash
PORT=8080 npm start
```

Default port is 3000.

### File Size Limit

The upload size limit is set to 500MB by default. Modify this in `server.js`:

```javascript
limits: { fileSize: 500 * 1024 * 1024 }
```

### Allowed File Types

Supported formats are defined in the multer file filter. To add more formats, edit the `fileFilter` in `server.js`.

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

## Project Structure

```
media-streamer/
├── server.js           # Express server and API routes
├── package.json        # Dependencies and scripts
├── jest.config.js      # Jest configuration
├── public/             # Frontend files
│   ├── index.html      # Main HTML page
│   ├── styles.css      # Styling
│   └── app.js          # Frontend JavaScript
├── media/              # Media files directory
│   └── uploads/        # Uploaded files
├── __tests__/          # Test files
│   └── server.test.js  # API tests
└── README.md           # This file
```

## Security Considerations

- Files are validated on upload (type and size)
- Path traversal protection prevents access outside media directory
- CORS enabled for API access
- No authentication (add if needed for production)

## Browser Compatibility

Works on all modern browsers that support HTML5 video/audio:
- Chrome/Edge
- Firefox
- Safari
- Opera

## License

MIT

## Contributing

Feel free to submit issues and pull requests!
