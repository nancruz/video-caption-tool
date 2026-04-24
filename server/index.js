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

app.use('/media', express.static(STORAGE));

const upload = multer({ dest: 'tmp/' });

app.post('/api/upload', upload.single('video'), (req, res) => {
  const id = uuidv4();
  const jobDir = path.join(STORAGE, id);
  fs.mkdirSync(jobDir);

  const ext = path.extname(req.file.originalname);
  const dest = path.join(jobDir, 'source' + ext);
  fs.renameSync(req.file.path, dest);

  res.json({ id, url: `/media/${id}/source${ext}` });
});

app.post('/api/:id/export', (req, res) => {
  const { id } = req.params;
  const { trimStart = 0, trimEnd = 0, subtitles = '' } = req.body;

  const jobDir = path.join(STORAGE, id);
  const source = fs.readdirSync(jobDir).find(f => f.startsWith('source'));
  const sourcePath = path.join(jobDir, source);

  const srtPath = path.join(jobDir, 'captions.srt');
  fs.writeFileSync(srtPath, subtitles);

  const output = path.join(jobDir, 'output.mp4');

  const cmd = `ffmpeg -y -ss ${trimStart} -i \"${sourcePath}\" ${trimEnd ? `-to ${trimEnd}` : ''} -vf subtitles=\"${srtPath}\" -c:a copy \"${output}\"`;

  exec(cmd, (err) => {
    if (err) return res.status(500).send(err.message);
    res.json({ url: `/media/${id}/output.mp4` });
  });
});

app.post('/api/:id/whisper', (req, res) => {
  const { id } = req.params;
  const jobDir = path.join(STORAGE, id);
  const source = fs.readdirSync(jobDir).find(f => f.startsWith('source'));
  const sourcePath = path.join(jobDir, source);

  const cmd = `whisper \"${sourcePath}\" --model base --output_format srt --output_dir \"${jobDir}\"`;

  exec(cmd, (err) => {
    if (err) return res.status(500).send('Whisper not installed');

    const srtFile = fs.readdirSync(jobDir).find(f => f.endsWith('.srt'));
    const content = fs.readFileSync(path.join(jobDir, srtFile), 'utf-8');
    res.json({ subtitles: content });
  });
});

app.listen(3001, () => console.log('Server running on 3001'));