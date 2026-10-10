import express from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { aiDeck, localDeck } from './study.js';
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
app.get('/api/status', (req, res) => res.json({ aiAvailable: Boolean(process.env.STUDY_API_KEY) }));
app.post('/api/pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || req.file.buffer.subarray(0, 5).toString() !== '%PDF-') return res.status(400).json({ error: 'Please upload a valid PDF file.' });
    const parser = new PDFParse({ data: req.file.buffer });
    let result;
    try { result = await parser.getText({ first: 100, pageJoiner: '' }); } finally { await parser.destroy(); }
    const text = result.text.trim();
    if (text.length < 80) return res.status(400).json({ error: 'This PDF has too little readable text. Scanned PDFs need OCR first; paste their extracted text instead.' });
    if (text.length > 60000) return res.status(400).json({ error: 'This PDF is too long. Upload a smaller chapter (up to 60,000 characters).' });
    res.json({ text, pages: result.total, partial: result.total > 100 });
  } catch { res.status(400).json({ error: 'Could not read this PDF. It may be encrypted or damaged. Try another PDF or paste your notes.' }); }
});
let active = 0;
app.post('/api/generate', async (req, res) => {
  const { text, count, variations, mode } = req.body;
  if (typeof text !== 'string' || text.trim().length < 80 || text.length > 60000 || ![6, 10, 15].includes(count) || ![2, 3].includes(variations) || !['ai', 'local'].includes(mode)) return res.status(400).json({ error: 'Use 80–60,000 characters of notes and valid study settings.' });
  if (mode === 'ai' && !process.env.STUDY_API_KEY) return res.status(400).json({ error: 'AI generation needs STUDY_API_KEY on the server. Local practice is available now.' });
  if (active >= 3) return res.status(429).json({ error: 'Generation is busy. Please try again shortly.' });
  active++;
  try { res.json({ ...(mode === 'ai' ? await aiDeck(text, count, variations, process.env.STUDY_API_KEY) : localDeck(text, count, variations)), mode }); }
  catch (error) { res.status(422).json({ error: error instanceof SyntaxError || error.name === 'ZodError' ? 'The generator returned an incomplete study set. Please retry.' : error.name === 'TimeoutError' ? 'AI generation took too long. Please retry.' : error.message }); }
  finally { active--; }
});
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
app.use(express.static(dist));
app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
app.use((err, req, res, next) => res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'PDF files must be smaller than 10 MB.' : 'Request could not be processed. Check your input and try again.' }));
app.listen(Number(process.env.PORT) || 3001, '0.0.0.0', () => console.log('Lecture Lab server listening'));
