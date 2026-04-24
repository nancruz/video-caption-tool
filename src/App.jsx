import React, { useRef, useState } from 'react';

function parseTimecode(value) {
  const [timePart] = value.split(' --> ');
  if (!timePart) return 0;
  const [hours = 0, minutes = 0, seconds = 0] = timePart.replace(',', '.').split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

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
  const videoRef = useRef(null);
  const subtitleRefs = useRef({});
  const [video,setVideo]=useState(null);
  const [id,setId]=useState(null);
  const [blocks,setBlocks]=useState([]);
  const [trimStart,setTrimStart]=useState(0);
  const [trimEnd,setTrimEnd]=useState(0);
  const [raw,setRaw]=useState('');
  const [currentTime,setCurrentTime]=useState(0);
  const [activeIndex,setActiveIndex]=useState(-1);

  const upload=async(file)=>{
    const f=new FormData();f.append('video',file);
    const r=await fetch('http://localhost:3001/api/upload',{method:'POST',body:f});
    const d=await r.json();setVideo(d.url);setId(d.id);setBlocks([]);setRaw('');
  };

  const generateSubs=async()=>{
    const r=await fetch(`http://localhost:3001/api/${id}/whisper`,{method:'POST'});
    const d=await r.json();
    if(d.subtitles) setBlocks(parseSRT(d.subtitles)); else alert(d.message);
  };

  const onTimeUpdate=()=>{
    const time=videoRef.current?.currentTime || 0;
    setCurrentTime(time);
    const index=blocks.findIndex((block, i)=>{
      const start=parseTimecode(block.time);
      const next=blocks[i+1] ? parseTimecode(blocks[i+1].time) : Number.MAX_SAFE_INTEGER;
      return time >= start && time < next;
    });
    setActiveIndex(index);
    subtitleRefs.current[index]?.scrollIntoView({block:'center',behavior:'smooth'});
  };

  const seekToSubtitle=(timecode)=>{
    const time=parseTimecode(timecode);
    if(videoRef.current){videoRef.current.currentTime=time;videoRef.current.play();}
  };

  const exportVideo=async()=>{
    const srt=serializeSRT(blocks);
    const r=await fetch(`http://localhost:3001/api/${id}/export`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({subtitles:srt,trimStart,trimEnd})
    });
    const d=await r.json();
    if(d.url) window.open(`http://localhost:3001${d.url}`); else alert(d.message || 'Export failed');
  };

  return (
    <div style={{padding:20,maxWidth:900,margin:'0 auto',fontFamily:'Arial, sans-serif'}}>
      <h1>Video Caption Tool</h1>
      <input type='file' accept='video/*' onChange={e=>upload(e.target.files[0])}/>

      {video && <>
        <div style={{marginTop:20}}>
          <video ref={videoRef} src={`http://localhost:3001${video}`} controls width='100%' onTimeUpdate={onTimeUpdate}/>
          <p>Current time: {currentTime.toFixed(2)}s</p>
        </div>

        <section style={{marginTop:20,padding:16,border:'1px solid #ddd',borderRadius:8}}>
          <h2>Trim</h2>
          <button onClick={()=>setTrimStart((videoRef.current?.currentTime || 0).toFixed(2))}>Set Start from current time</button>
          <button onClick={()=>setTrimEnd((videoRef.current?.currentTime || 0).toFixed(2))} style={{marginLeft:8}}>Set End from current time</button>
          <div style={{marginTop:10}}>
            <input type='number' value={trimStart} onChange={e=>setTrimStart(e.target.value)} placeholder='Start seconds'/>
            <input type='number' value={trimEnd} onChange={e=>setTrimEnd(e.target.value)} placeholder='End seconds' style={{marginLeft:8}}/>
          </div>
        </section>

        <section style={{marginTop:20,padding:16,border:'1px solid #ddd',borderRadius:8}}>
          <h2>Subtitles</h2>
          <button onClick={generateSubs}>Generate Subtitles with Whisper</button>
          <div style={{marginTop:12}}>
            <textarea value={raw} onChange={e=>setRaw(e.target.value)} placeholder='Paste SRT here if Whisper is not installed or fails' rows={5} style={{width:'100%'}}/>
            <button onClick={()=>setBlocks(parseSRT(raw))}>Load pasted SRT</button>
          </div>
        </section>

        <section style={{marginTop:20,maxHeight:420,overflow:'auto',paddingRight:8}}>
          <h2>Subtitle Editor</h2>
          {blocks.map((b,i)=>(
            <div key={i} ref={el=>subtitleRefs.current[i]=el} onClick={()=>seekToSubtitle(b.time)} style={{border:'1px solid #ccc',marginBottom:8,padding:10,borderRadius:8,background:i===activeIndex?'#f2f2f2':'white',cursor:'pointer'}}>
              <input value={b.time} onClick={e=>e.stopPropagation()} onChange={e=>{
                const nb=[...blocks];nb[i].time=e.target.value;setBlocks(nb);
              }} style={{width:'100%',marginBottom:6}}/>
              <textarea value={b.text} onClick={e=>e.stopPropagation()} onChange={e=>{
                const nb=[...blocks];nb[i].text=e.target.value;setBlocks(nb);
              }} rows={2} style={{width:'100%'}}/>
            </div>
          ))}
        </section>

        <button onClick={exportVideo} style={{marginTop:20,padding:'10px 16px'}}>Export Video</button>
      </>}
    </div>
  );
}