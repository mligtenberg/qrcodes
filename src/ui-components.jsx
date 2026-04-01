import { useState, useEffect } from 'react';
import { h2r } from './render.js';
import { SL } from './shapes.jsx';

export function SecHdr({icon:I,children}){return<div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}><span style={{color:'var(--txtF)',display:'flex'}}><I/></span><span style={{fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--txtF)'}}>{children}</span></div>;}

export function ShPick({label,shapes,previewMap,value,onChange}){
  return(
    <div>
      <div style={{fontSize:11,color:'var(--txtM)',marginBottom:8,fontWeight:500}}>{label}</div>
      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
        {shapes.map(s=>{
          const a=value===s;
          return(
            <button key={s} onClick={()=>onChange(s)} title={SL[s]||s} style={{width:48,padding:'6px 4px 5px',background:a?'var(--accBg)':'var(--surf2)',border:`2px solid ${a?'var(--acc)':'var(--brd2)'}`,borderRadius:9,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,transition:'all 0.15s',position:'relative',boxShadow:a?'0 0 0 2px rgba(59,130,246,0.2)':'none'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" style={{color:a?'var(--accDim)':'var(--txtF)',flexShrink:0}}>{previewMap[s]}</svg>
              <span style={{fontSize:9,color:a?'var(--accTxt)':'var(--txtD)',fontWeight:a?600:400,lineHeight:1,textAlign:'center'}}>{SL[s]||s}</span>
              {a&&(
                <div style={{position:'absolute',top:3,right:3,width:8,height:8,background:'var(--acc)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="5" height="5" viewBox="0 0 12 12"><polyline points="10,3 5,9 2,6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ClrRow({label,color,alpha,onColor,onAlpha}){return<div style={{display:'flex',flexDirection:'column',gap:6}}><div style={{fontSize:11,color:'var(--txtM)',fontWeight:500}}>{label}</div><div style={{display:'flex',gap:8,alignItems:'center'}}><label style={{cursor:'pointer',flexShrink:0,position:'relative'}}><div style={{width:34,height:34,borderRadius:7,overflow:'hidden',border:'1.5px solid var(--brd2)',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='4' height='4' fill='%23888'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%23888'/%3E%3Crect x='4' width='4' height='4' fill='%23bbb'/%3E%3Crect y='4' width='4' height='4' fill='%23bbb'/%3E%3C/svg%3E")`}}><div style={{width:'100%',height:'100%',background:h2r(color,alpha)}}/></div><input type="color" value={color} onChange={e=>onColor(e.target.value)} style={{position:'absolute',opacity:0,width:0,height:0,pointerEvents:'none'}}/></label><input type="text" value={color} onChange={e=>{if(/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))onColor(e.target.value);}} style={{flex:1,background:'var(--inp)',border:'1.5px solid var(--brd)',borderRadius:6,padding:'5px 8px',color:'var(--txt)',fontSize:12,fontFamily:'monospace',outline:'none',minWidth:0}}/><div style={{display:'flex',flexDirection:'column',gap:3,width:86,flexShrink:0}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:10,color:'var(--txtF)'}}>opacity</span><span style={{fontSize:10,color:'var(--txtM)',fontFamily:'monospace'}}>{Math.round(alpha*100)}%</span></div><input type="range" min={0} max={1} step={0.01} value={alpha} onChange={e=>onAlpha(+e.target.value)} style={{width:'100%'}}/></div></div></div>;}

export function DlModal({type,dataUrl,downloadUrl,onClose,onCloseExtra}){
  const isPng=type==='png',fn=isPng?'qrcode.png':'qrcode.svg';
  const close=()=>{onClose();onCloseExtra?.();};
  useEffect(()=>{try{const a=document.createElement('a');a.href=downloadUrl||dataUrl;a.download=fn;document.body.appendChild(a);a.click();document.body.removeChild(a);}catch{}},[]);
  return<div onClick={close} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:24}}><div onClick={e=>e.stopPropagation()} style={{background:'var(--surf)',border:'1px solid var(--brd2)',borderRadius:16,padding:24,maxWidth:420,width:'100%',display:'flex',flexDirection:'column',gap:16}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontWeight:600,fontSize:15,color:'var(--txt)'}}>Save {fn}</span><button onClick={close} style={{background:'none',border:'none',color:'var(--txtM)',cursor:'pointer',fontSize:20,lineHeight:1,padding:'0 4px'}}>×</button></div><div style={{background:'var(--surf2)',borderRadius:10,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',padding:12,minHeight:120}}><img src={dataUrl} alt="QR" style={{maxWidth:'100%',maxHeight:280,display:'block',imageRendering:isPng?'pixelated':'auto'}}/></div><div style={{background:'var(--surf2)',borderRadius:8,padding:'10px 14px'}}><p style={{margin:'0 0 6px',fontSize:12,color:'var(--txtM)',fontWeight:600}}>How to save:</p><p style={{margin:0,fontSize:12,color:'var(--txtF)',lineHeight:1.6}}><strong style={{color:'var(--txtM)'}}>Desktop:</strong> Right-click the image → "Save image as…"<br/><strong style={{color:'var(--txtM)'}}>Mobile:</strong> Long-press the image → "Save to Photos"</p></div><a href={downloadUrl||dataUrl} download={fn} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 0',background:'var(--acc)',color:'white',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>↓ Try direct download</a></div></div>;
}
