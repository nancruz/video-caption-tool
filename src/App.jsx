import React, { useState } from 'react';

function parseSRT(srt) {
  return srt.split('\n\n').map(block => {
    const lines = block.split('\n');
    if (lines.length < 3) return null;
    return { time: lines[1], text: lines.slice(2).join('\n') };
  }).filter(Boolean);
}

function serializeSRT(blocks) {
  return blocks.map((b,i)=>`${i+1}\n${b.time}\n${b.text}`).join('\n\n');
}

export default function App() {
  const [video,setVideo]=useState(null);
  const [id,setId]=useState(null);
  const [blocks,setBlocks]=useState([]);
  const [trimStart,setTrimStart]=useState(0);
  const [trimEnd,setTrimEnd]=useState(0);
  const [raw,setRaw]=useState('');

  const upload=async(file)=>{
    const f=new FormData();f.append('video',file);
    const r=await fetch('http://localhost:3001/api/upload',{method:'POST',body:f});
    const d=await r.json();setVideo(d.url);setId(d.id);
  };

  const generateSubs=async()=>{
    const r=await fetch(`http://localhost:3001/api/${id}/whisper`,{method:'POST'});
    const d=await r.json();
    if(d.subtitles) setBlocks(parseSRT(d.subtitles)); else alert(d.message);
  };

  const exportVideo=async()=>{
    const srt=serializeSRT(blocks);
    const r=await fetch(`http://localhost:3001/api/${id}/export`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({subtitles:srt,trimStart,trimEnd})
    });
    const d=await r.json();window.open(`http://localhost:3001${d.url}`);
  };

  return (
    <div style={{padding:20}}>
      <h1>Video Caption Tool</h1>
      <input type='file' onChange={e=>upload(e.target.files[0])}/>

      {video && <>
        <video src={`http://localhost:3001${video}`} controls width='400'/>

        <div>
          <input type='number' value={trimStart} onChange={e=>setTrimStart(e.target.value)} placeholder='Start (s)'/>
          <input type='number' value={trimEnd} onChange={e=>setTrimEnd(e.target.value)} placeholder='End (s)'/>
        </div>

        <button onClick={generateSubs}>Generate Subtitles</button>

        <textarea value={raw} onChange={e=>setRaw(e.target.value)} placeholder='Paste SRT here'/>
        <button onClick={()=>setBlocks(parseSRT(raw))}>Load SRT</button>

        {blocks.map((b,i)=>(
          <div key={i}>
            <input value={b.time} onChange={e=>{
              const nb=[...blocks];nb[i].time=e.target.value;setBlocks(nb);
            }}/>
            <textarea value={b.text} onChange={e=>{
              const nb=[...blocks];nb[i].text=e.target.value;setBlocks(nb);
            }}/>
          </div>
        ))}

        <button onClick={exportVideo}>Export</button>
      </>}
    </div>
  );
}