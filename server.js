const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const META_FILE = path.join(DATA_DIR, 'metadata.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(META_FILE)) fs.writeFileSync(META_FILE, JSON.stringify({}, null, 2));

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'replace-this-with-a-long-random-secret';

function deriveKey(secret) {
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptBuffer(buffer, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { encrypted, iv, tag };
}

function decryptBuffer(payload, key, iv, tag) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(payload), decipher.final()]);
}

function loadMetadata() {
  return JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
}

function saveMetadata(metadata) {
  fs.writeFileSync(META_FILE, JSON.stringify(metadata, null, 2));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 100 }, // 100MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/', 'video/', 'audio/'];
    if (allowed.some((prefix) => file.mimetype.startsWith(prefix))) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image, video, and audio files are allowed.'));
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/upload', upload.single('media'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const id = crypto.randomUUID();
    const key = deriveKey(ENCRYPTION_SECRET);
    const { encrypted, iv, tag } = encryptBuffer(req.file.buffer, key);

    const encryptedFileName = `${id}.bin`;
    const encryptedFilePath = path.join(UPLOAD_DIR, encryptedFileName);
    fs.writeFileSync(encryptedFilePath, encrypted);

    const metadata = loadMetadata();
    metadata[id] = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      encryptedFileName,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      createdAt: new Date().toISOString()
    };
    saveMetadata(metadata);

    const shareUrl = `${req.protocol}://${req.get('host')}/view/${id}`;
    return res.status(201).json({ id, shareUrl });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Upload failed.' });
  }
});

app.get('/api/media/:id/stream', (req, res) => {
  try {
    const metadata = loadMetadata();
    const fileMeta = metadata[req.params.id];

    if (!fileMeta) {
      return res.status(404).send('File not found.');
    }

    const encryptedPath = path.join(UPLOAD_DIR, fileMeta.encryptedFileName);
    if (!fs.existsSync(encryptedPath)) {
      return res.status(404).send('Encrypted file missing.');
    }

    const encryptedPayload = fs.readFileSync(encryptedPath);
    const key = deriveKey(ENCRYPTION_SECRET);
    const decrypted = decryptBuffer(encryptedPayload, key, fileMeta.iv, fileMeta.tag);

    res.setHeader('Content-Type', fileMeta.mimeType);
    res.setHeader('Content-Length', decrypted.length);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(decrypted);
  } catch (error) {
    return res.status(500).send('Failed to stream media.');
  }
});

app.get('/api/media/:id/meta', (req, res) => {
  const metadata = loadMetadata();
  const fileMeta = metadata[req.params.id];

  if (!fileMeta) {
    return res.status(404).json({ error: 'File not found.' });
  }

  return res.json({
    mimeType: fileMeta.mimeType,
    originalName: fileMeta.originalName,
    createdAt: fileMeta.createdAt
  });
});

app.get('/view/:id', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(400).json({ error: err.message || 'Bad request.' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
