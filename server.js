import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const app = express();
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

// Mock gesture detection endpoint
// Returns { detected: boolean, gesture: 'yes' | 'no' | null }
app.get('/api/gesture', (req, res) => {
  const forced = req.query.force;
  if (forced === 'yes' || forced === 'no') {
    return res.json({ detected: true, gesture: forced });
  }

  // 25% chance to detect on each poll; when detected, 50/50 yes or no
  const detected = Math.random() < 0.25;
  const gesture = detected ? (Math.random() < 0.5 ? 'yes' : 'no') : null;
  res.json({ detected, gesture });
});

// Fallback to SPA index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});