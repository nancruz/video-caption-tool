import React, { useState } from 'react';

export default function App() {
  const [video, setVideo] = useState(null);
  const [id, setId] = useState(null);
  const [subtitles, setSubtitles] = useState('');

  const upload = async (file) => {
    const form = new FormData();
    form.append('video', file);
    const res = await fetch('http://localhost:3001/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    setVideo(data.url);
    setId(data.id);
  };

  const generateSubs = async () => {
    const res = await fetch(`http://localhost:3001/api/${id}/whisper`, { method: 'POST' });
    const data = await res.json();
    setSubtitles(data.subtitles);
  };

  const exportVideo = async () => {
    const res = await fetch(`http://localhost:3001/api/${id}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtitles })
    });
    const data = await res.json();
    window.open(`http://localhost:3001${data.url}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Video Caption Tool</h1>

      <input type="file" onChange={e => upload(e.target.files[0])} />

      {video && (
        <>
          <video src={`http://localhost:3001${video}`} controls width="400" />

          <div>
            <button onClick={generateSubs}>Generate Subtitles</button>
          </div>

          <textarea
            value={subtitles}
            onChange={e => setSubtitles(e.target.value)}
            rows={10}
            cols={60}
          />

          <div>
            <button onClick={exportVideo}>Export</button>
          </div>
        </>
      )}
    </div>
  );
}