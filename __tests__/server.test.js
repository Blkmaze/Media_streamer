const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock server for testing
let app;
let server;

beforeAll(() => {
  // Set test environment
  process.env.PORT = 3001;
  app = require('../server');
});

afterAll((done) => {
  // Clean up test files
  const testDir = path.join(__dirname, '../media/uploads');
  if (fs.existsSync(testDir)) {
    const files = fs.readdirSync(testDir);
    files.forEach(file => {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(testDir, file));
      }
    });
  }

  // Close server if running
  if (server && server.listening) {
    server.close(done);
  } else {
    done();
  }
});

describe('Media Streamer API', () => {
  describe('GET /api/media', () => {
    test('should return list of media files', async () => {
      const response = await request(app)
        .get('/api/media')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('files');
      expect(Array.isArray(response.body.files)).toBe(true);
    });
  });

  describe('POST /api/upload', () => {
    test('should upload a media file', async () => {
      // Create a test file
      const testFilePath = path.join(__dirname, 'test-video.mp4');
      fs.writeFileSync(testFilePath, 'fake video content');

      const response = await request(app)
        .post('/api/upload')
        .attach('media', testFilePath)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('file');
      expect(response.body.file).toHaveProperty('name');
      expect(response.body.file).toHaveProperty('size');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    test('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid file types', async () => {
      const testFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(testFilePath, 'text content');

      const response = await request(app)
        .post('/api/upload')
        .attach('media', testFilePath)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('GET /api/stream/:path', () => {
    test('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/stream/nonexistent.mp4')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should deny access to files outside media directory', async () => {
      const response = await request(app)
        .get('/api/stream/../../package.json')
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Access denied');
    });

    test('should stream an existing file', async () => {
      // Create a test file
      const testFile = 'test-stream.mp4';
      const testFilePath = path.join(__dirname, '../media/uploads', testFile);
      fs.writeFileSync(testFilePath, 'video content for streaming');

      const response = await request(app)
        .get(`/api/stream/uploads/${testFile}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('video/mp4');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    test('should support range requests for streaming', async () => {
      // Create a test file
      const testFile = 'test-range.mp4';
      const testFilePath = path.join(__dirname, '../media/uploads', testFile);
      const content = 'a'.repeat(1000);
      fs.writeFileSync(testFilePath, content);

      const response = await request(app)
        .get(`/api/stream/uploads/${testFile}`)
        .set('Range', 'bytes=0-499')
        .expect(206);

      expect(response.headers['content-range']).toBeDefined();
      expect(response.headers['accept-ranges']).toBe('bytes');

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('DELETE /api/media/:path', () => {
    test('should delete an existing file', async () => {
      // Create a test file
      const testFile = 'test-delete.mp4';
      const testFilePath = path.join(__dirname, '../media/uploads', testFile);
      fs.writeFileSync(testFilePath, 'content to delete');

      const response = await request(app)
        .delete(`/api/media/uploads/${testFile}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(fs.existsSync(testFilePath)).toBe(false);
    });

    test('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .delete('/api/media/uploads/nonexistent.mp4')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should deny deletion of files outside media directory', async () => {
      const response = await request(app)
        .delete('/api/media/../../package.json')
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Access denied');
    });
  });

  describe('GET /', () => {
    test('should serve index.html', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('Media Streamer');
    });
  });
});

describe('Helper Functions', () => {
  test('server should be exportable', () => {
    expect(app).toBeDefined();
  });
});
