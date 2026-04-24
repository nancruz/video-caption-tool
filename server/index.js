import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const STORAGE = path.join(process.cwd(), 'storage');
if (!fs.existsSync(STORAGE)) fs.mkdirSync(STORAGE);
if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');

app.use('/media', express.static(STORAGE));

const upload = multer({ dest: 'tmp/' });

function shellQuote(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function getSourceFile(jobDir) {
  const source = fs.readdirSync(jobDir).find((file) => file.startsWith('source'));
  if (!source) throw new Error('Source video not found');
  return path.join(jobDir, source);
}

app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No video uploaded' });

  const id = uuidv4();
  const jobDir = path.join(STORAGE, id);
  fs.mkdirSync(jobDir);

  const ext = path.extname(req.file.originalname) || '.mp4';
  const dest = path.join(jobDir, `source${ext}`);
  fs.renameSync(req.file.path, dest);

  res.json({ id, url: `/media/${id}/source${ext}` });
});

app.post('/api/:id/export', (req, res) => {
  const { id } = req.params;
  const { trimStart = 0, trimEnd = 0, subtitles = '' } = req.body;

  try {
    const jobDir = path.join(STORAGE, id);
    const sourcePath = getSourceFile(jobDir);
    const output = path.join(jobDir, 'output.mp4');

    const start = Math.max(Number(trimStart) || 0, 0);
    const end = Math.max(Number(trimEnd) || 0, 0);
    const duration = end > start ? end - start : 0;

    const args = ['ffmpeg', '-y'];
    if (start > 0) args.push('-ss', String(start));
    args.push('-i', shellQuote(sourcePath));
    if (duration > 0) args.push('-t', String(duration));

    if (subtitles.trim()) {
      const srtPath = path.join(jobDir, 'captions.srt');
      fs.writeFileSync(srtPath, subtitles);
      const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      args.push('-vf', shellQuote(`subtitles=${escapedSrtPath}`));
    }

    args.push('-c:a', 'aac', '-b:a', '192k', shellQuote(output));

    exec(args.join(' '), (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ url: `/media/${id}/output.mp4` });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/:id/whisper', (req, res) => {
  const { id } = req.params;

  try {
    const jobDir = path.join(STORAGE, id);
    const sourcePath = getSourceFile(jobDir);
    const cmd = `whisper ${shellQuote(sourcePath)} --model base --output_format srt --output_dir ${shellQuote(jobDir)}`;

    exec(cmd, (err) => {
      if (err) {
        return res.status(500).json({
          message: 'Whisper is not available. Install it locally or paste/upload an SRT file instead.'
        });
      }

      const srtFile = fs.readdirSync(jobDir).find((file) => file.endsWith('.srt'));
      if (!srtFile) return res.status(500).json({ message: 'Whisper did not generate an SRT file' });

      const content = fs.readFileSync(path.join(jobDir, srtFile), 'utf-8');
      res.json({ subtitles: content });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(3001, () => console.log('Server running on 3001'));