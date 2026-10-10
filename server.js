import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Read database cards from db.json
let cardsData = [];
try {
  const dbPath = path.join(__dirname, 'src', 'json', 'db.json');
  const rawData = fs.readFileSync(dbPath, 'utf8');
  const parsed = JSON.parse(rawData);
  cardsData = parsed.cards || [];
} catch (err) {
  console.error('Failed to load db.json:', err);
}

// API routes
app.get('/cards', (req, res) => {
  res.json(cardsData);
});

app.get('/cards/:id', (req, res) => {
  const card = cardsData.find(c => c.id === parseInt(req.params.id, 10));
  if (card) {
    res.json(card);
  } else {
    res.status(404).json({ error: 'Card not found' });
  }
});

// Static assets
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
