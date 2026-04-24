# Video Caption Tool

A simple, self-hosted video editing tool focused on one thing: **trim videos and add subtitles quickly without paying for subscriptions**.

Built as a lightweight alternative to tools like CapCut for internal workflows (PR teams, comms, social content).

---

## ✨ Features

### 🎬 Video
- Upload video (MP4, MOV, etc.)
- Preview player
- Trim start and end using:
  - Manual input (seconds)
  - "Set from current time" buttons

### 📝 Subtitles
- Auto-generate subtitles using Whisper (optional)
- Paste SRT manually (fallback)
- Structured subtitle editor:
  - Edit timestamps
  - Edit text
  - Click subtitle → jump video to that moment
  - Auto-highlight current subtitle during playback

### 📦 Export
- Burn subtitles into video
- Export final MP4

---

## 🏗️ Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Video processing:** FFmpeg
- **Speech-to-text:** Whisper (optional)

---

## ⚙️ Requirements

You must install these locally:

### 1. FFmpeg
https://ffmpeg.org/download.html

Verify:
```
ffmpeg -version
```

### 2. Whisper (optional but recommended)
```
pip install openai-whisper
```

Verify:
```
whisper --help
```

If Whisper is not installed, you can still use the tool by pasting an SRT file manually.

---

## 🚀 Running the project

```
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## 🧠 How to use

1. Upload a video
2. (Optional) Trim using current playback time
3. Generate subtitles OR paste SRT
4. Edit subtitles (click to jump in video)
5. Export final video

---

## ⚠️ Limitations (by design)

This is intentionally **not a full video editor**.

Missing features:
- No transitions
- No multi-track timeline
- No effects library
- No cloud storage

Focus = **fast subtitle editing + simple trimming**

---

## 💡 Vision

This project explores a niche:

> "The simplest video tool for comms teams"

Instead of competing with full editors, it focuses on:
- speed
- simplicity
- no subscriptions
- repeatable workflows

---

## 🔮 Possible next improvements

- Better subtitle timing editor (start/end per caption)
- Subtitle styling (font, position, background)
- Timeline UI with drag handles
- Silence removal / auto-cut (AI)
- Export presets (LinkedIn, Instagram, etc.)

---

## 👤 Author

Built by Nuno Cruz (and ChatGPT 😄)

---

## 🪪 License

MIT
