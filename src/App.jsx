import { useState, useRef, useEffect, useCallback } from 'react';
import { generateMatrix } from './qr.js';
import { renderQR, getPngUrl, getSvgUrls } from './render.js';
import { TH } from './themes.js';
import { Ic } from './icons.jsx';
import { MS, AS, SP, FOP, FIP } from './shapes.jsx';
import { PT, TD } from './content-types.js';
import { Fld, TI, Sel, CForm } from './form-components.jsx';
import { SecHdr, ShPick, ClrRow, DlModal } from './ui-components.jsx';
import { loadCollection, addSavedQR, removeSavedQR } from './storage.js';

function App(){
  const[themeMode,setThemeMode]=useState('auto');
  const[sysDark,setSysDark]=useState(()=>window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(()=>{const mq=window.matchMedia('(prefers-color-scheme: dark)');const h=e=>setSysDark(e.matches);mq.addEventListener('change',h);return()=>mq.removeEventListener('change',h);},[]);
  const isDark=themeMode==='auto'?sysDark:themeMode==='dark';
  const T=isDark?TH.dark:TH.light;

  const[cType,setCType]=useState('url');
  const[input,setInput]=useState('https://www.example.com');
  const[fgC,setFgC]=useState('#000000');
  const[fgA,setFgA]=useState(1);
  const[bgC,setBgC]=useState('#ffffff');
  const[bgA,setBgA]=useState(1);
  const[scale,setScale]=useState(10);
  const[mShape,setMShape]=useState('square');
  const[aOuter,setAOuter]=useState('square');
  const[aInner,setAInner]=useState('square');
  const[logoImg,setLogoImg]=useState(null);
  const[logoDU,setLogoDU]=useState(null);
  const[logoSh,setLogoSh]=useState('square');
  const[logoR,setLogoR]=useState(0.22);
  const[logoBg,setLogoBg]=useState('#ffffff');
  const[ec,setEc]=useState('L');
  const[showAdv,setShowAdv]=useState(false);
  const[err,setErr]=useState(null);
  const[qrData,setQrData]=useState(null);
  const[copied,setCopied]=useState(false);
  const[modal,setModal]=useState(null);
  const[collection,setCollection]=useState(()=>loadCollection());
  const[saveName,setSaveName]=useState('');
  const[showSave,setShowSave]=useState(false);
  const[showCollection,setShowCollection]=useState(false);
  const collectionRef=useRef(null);
  useEffect(()=>{
    if(!showCollection)return;
    const h=e=>{if(collectionRef.current&&!collectionRef.current.contains(e.target))setShowCollection(false);};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[showCollection]);
  const logoRef=useRef(null);
  const canvasRef=useRef(null);
  const rootRef=useRef(null);
  useEffect(()=>{
    const el=rootRef.current;
    if(!el)return;
    Object.entries({
      '--bg':T.bg,'--surf':T.surf,'--surf2':T.surf2,
      '--brd':T.brd,'--brd2':T.brd2,
      '--txt':T.txt,'--txtM':T.txtM,'--txtF':T.txtF,'--txtD':T.txtD,
      '--acc':T.acc,'--accBg':T.accBg,'--accTxt':T.accTxt,'--accDim':T.accDim,
      '--dan':T.dan,'--warn':T.warn,
      '--ok':T.ok,'--okBg':T.okBg,'--okBdr':T.okBdr,
      '--inp':T.inp,
    }).forEach(([k,v])=>el.style.setProperty(k,v));
  },[T]);

  const ECR={L:0,M:1,Q:2,H:3};
  const ECRV={L:0.07,M:0.15,Q:0.25,H:0.30};
  const minEc=r=>{const a=r*r;if(a<=ECRV.L)return'L';if(a<=ECRV.M)return'M';if(a<=ECRV.Q)return'Q';return'H';};
  const logoMin=logoImg?minEc(logoR):null;
  const effEc=logoMin&&ECR[ec]<ECR[logoMin]?logoMin:ec;

  const gen=useCallback(()=>{
    if(!input.trim()){setQrData(null);setErr(null);return;}
    const lm=logoImg?minEc(logoR):null;const e=lm&&ECR[ec]<ECR[lm]?lm:ec;
    try{setQrData(generateMatrix(input.trim(),e));setErr(null);}
    catch{setErr('Could not encode — try shorter text.');setQrData(null);}
  },[input,logoImg,ec,logoR]);
  useEffect(()=>gen(),[gen]);

  const opts={fgColor:fgC,fgAlpha:fgA,bgColor:bgC,bgAlpha:bgA,scale,moduleShape:mShape,anchorOuterShape:aOuter,anchorInnerShape:aInner,logoImg,logoDataUrl:logoDU,logoShape:logoSh,logoRatio:logoR,logoBg};
  useEffect(()=>{if(!qrData||!canvasRef.current)return;renderQR(canvasRef.current,qrData,opts);},[qrData,fgC,fgA,bgC,bgA,scale,mShape,aOuter,aInner,logoImg,logoSh,logoR,logoBg]);

  const dlPng=()=>{if(!qrData)return;setModal({type:'png',dataUrl:getPngUrl(qrData,opts)});};
  const dlSvg=()=>{if(!qrData)return;const{previewUrl,downloadUrl}=getSvgUrls(qrData,opts);setModal({type:'svg',dataUrl:previewUrl,downloadUrl,onCloseExtra:()=>URL.revokeObjectURL(downloadUrl)});};
  const copyImg=()=>{if(!canvasRef.current||!qrData)return;const o=document.createElement('canvas');renderQR(o,qrData,opts);o.toBlob(b=>{navigator.clipboard.write([new ClipboardItem({'image/png':b})]).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>alert('Copy not supported.'));},'image/png');};

  const upLogo=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const du=ev.target.result;const img=new Image();img.onload=()=>{setLogoImg(img);setLogoDU(du);const lm=minEc(logoR);const e2=ECR[ec]<ECR[lm]?lm:ec;try{setQrData(generateMatrix(input.trim(),e2));}catch{}};img.src=du;};r.readAsDataURL(f);e.target.value='';};
  const rmLogo=()=>{setLogoImg(null);setLogoDU(null);try{setQrData(generateMatrix(input.trim(),ec));}catch{}};

  const saveCurrent=()=>{
    if(!input.trim())return;
    const name=saveName.trim()||`${cType.toUpperCase()} — ${input.slice(0,30)}`;
    const updated=addSavedQR(collection,{name,cType,input,fgC,fgA,bgC,bgA,scale,mShape,aOuter,aInner,logoSh,logoR,logoBg,ec});
    setCollection(updated);
    setSaveName('');
    setShowSave(false);
  };

  const loadSaved=entry=>{
    setCType(entry.cType);
    setInput(entry.input);
    setFgC(entry.fgC);
    setFgA(entry.fgA);
    setBgC(entry.bgC);
    setBgA(entry.bgA);
    setScale(entry.scale);
    setMShape(entry.mShape);
    setAOuter(entry.aOuter);
    setAInner(entry.aInner);
    setLogoSh(entry.logoSh);
    setLogoR(entry.logoR);
    setLogoBg(entry.logoBg);
    setEc(entry.ec);
    setLogoImg(null);
    setLogoDU(null);
  };

  const deleteSaved=id=>{
    const updated=removeSavedQR(collection,id);
    setCollection(updated);
  };

  const totalPx=qrData?(qrData.size+8)*scale:null;

  const chkBg=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='${encodeURIComponent(T.chk1)}'/%3E%3Crect x='8' y='8' width='8' height='8' fill='${encodeURIComponent(T.chk1)}'/%3E%3Crect x='8' width='8' height='8' fill='${encodeURIComponent(T.chk2)}'/%3E%3Crect y='8' width='8' height='8' fill='${encodeURIComponent(T.chk2)}'/%3E%3C/svg%3E")`;

  const thBtns=[{id:'light',I:Ic.Sun},{id:'auto',I:Ic.Mon},{id:'dark',I:Ic.Moon}];

  const s1={background:'var(--surf)',border:`1px solid var(--brd)`,borderRadius:8,padding:'8px 12px',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'};

  return(
    <div ref={rootRef} style={{fontFamily:"'Inter',system-ui,sans-serif",minHeight:'100vh',background:'var(--bg)',color:'var(--txt)',display:'flex',flexDirection:'column'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box;}input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:var(--brd2);outline:none;}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--acc);cursor:pointer;border:2px solid color-mix(in srgb,var(--acc) 60%,black);}input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--acc);cursor:pointer;border:none;}select{color:var(--txt);}.eb:hover:not(:disabled){opacity:.88;transform:translateY(-1px);}.eb{transition:all .15s;}::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:var(--bg);}::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:3px;}`}</style>

      {/* Topbar */}
      <div style={{borderBottom:`1px solid var(--brd)`,padding:'12px 24px',display:'flex',alignItems:'center',gap:10,flexShrink:0,background:'var(--surf)'}}>
        <span style={{color:'var(--acc)',display:'flex'}}><Ic.QR/></span>
        <span style={{fontSize:15,fontWeight:700,letterSpacing:'-0.3px',color:'var(--txt)'}}>QR Studio</span>
        <div ref={collectionRef} style={{position:'relative',marginLeft:8}}>
          <button onClick={()=>setShowCollection(x=>!x)} style={{display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:8,border:`1px solid ${showCollection?'var(--acc)':'var(--brd)'}`,cursor:'pointer',background:showCollection?'var(--accBg)':'var(--surf2)',color:showCollection?'var(--accTxt)':'var(--txtF)',transition:'all .15s',position:'relative'}} title="Saved QR codes">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            {collection.length>0&&<span style={{position:'absolute',top:-4,right:-4,width:14,height:14,background:'var(--acc)',color:'white',borderRadius:'50%',fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,border:'2px solid var(--surf)'}}>{collection.length}</span>}
          </button>
          {showCollection&&<div style={{position:'absolute',top:'calc(100% + 8px)',left:0,width:300,background:'var(--surf)',border:`1px solid var(--brd2)`,borderRadius:12,boxShadow:'0 12px 40px rgba(0,0,0,0.25)',zIndex:100,overflow:'hidden'}}>
            <div style={{padding:'12px 14px',borderBottom:`1px solid var(--brd)`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:13,fontWeight:600,color:'var(--txt)'}}>Saved QR codes</span>
              <span style={{fontSize:11,color:'var(--txtD)'}}>{collection.length}</span>
            </div>
            <div style={{maxHeight:400,overflowY:'auto',padding:'8px'}}>
              {collection.length===0?<div style={{padding:'24px 16px',textAlign:'center',color:'var(--txtD)',fontSize:12}}>No saved codes yet</div>:collection.map(item=>(
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,cursor:'pointer',transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--surf2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{width:36,height:36,borderRadius:6,background:'var(--accBg)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accDim)" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  </div>
                  <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={()=>{loadSaved(item);setShowCollection(false);}}>
                    <div style={{fontSize:12.5,fontWeight:500,color:'var(--txt)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>
                    <div style={{fontSize:10.5,color:'var(--txtD)',marginTop:1}}>{item.cType} · EC {item.ec}</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();deleteSaved(item.id);}} style={{background:'none',border:'none',color:'var(--txtD)',cursor:'pointer',padding:'4px',display:'flex',borderRadius:4,transition:'color .1s'}} onMouseEnter={e=>e.currentTarget.style.color='var(--dan)'} onMouseLeave={e=>e.currentTarget.style.color='var(--txtD)'}><Ic.Trash/></button>
                </div>
              ))}
            </div>
          </div>}
        </div>
        <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:3,background:'var(--surf2)',border:`1px solid var(--brd)`,borderRadius:20,padding:'3px 4px'}}>
          {thBtns.map(({id,I})=><button key={id} onClick={()=>setThemeMode(id)} title={id} style={{display:'flex',alignItems:'center',justifyContent:'center',width:26,height:26,borderRadius:16,border:'none',cursor:'pointer',background:themeMode===id?'var(--acc)':'transparent',color:themeMode===id?'white':'var(--txtF)',transition:'all .15s'}}><I/></button>)}
        </span>
        <span style={{fontSize:11,color:'var(--txtD)',marginLeft:6}}>100% in-browser</span>
      </div>

      <div style={{display:'flex',flex:1,minHeight:0,overflow:'hidden'}}>
        {/* Sidebar */}
        <div style={{width:320,flexShrink:0,borderRight:`1px solid var(--brd)`,overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:22,background:'var(--surf)'}}>

          <div>
            <SecHdr icon={Ic.Txt}>Content</SecHdr>
            <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:14}}>
              {PT.map(p=>{const PI=Ic[p.icon]||Ic.Txt,a=cType===p.id;return<button key={p.id} onClick={()=>{setCType(p.id);setInput(TD[p.id]);}} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',fontSize:11,fontWeight:500,background:a?'var(--acc)':'var(--surf2)',color:a?'white':'var(--txtM)',border:`1.5px solid ${a?'var(--acc)':'var(--brd)'}`,borderRadius:20,cursor:'pointer',transition:'all .15s'}}><span style={{display:'flex',opacity:a?1:.6}}><PI/></span>{p.label}{a&&<span style={{display:'flex',color:'white'}}><Ic.Ok/></span>}</button>;})}
            </div>
            <CForm type={cType} value={input} onChange={setInput}/>
            {err&&<p style={{margin:'8px 0 0',fontSize:11.5,color:'var(--dan)'}}>{err}</p>}
          </div>

          <div>
            <SecHdr icon={Ic.Pal}>Colours</SecHdr>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <ClrRow label="Foreground" color={fgC} alpha={fgA} onColor={setFgC} onAlpha={setFgA}/>
              <ClrRow label="Background" color={bgC} alpha={bgA} onColor={setBgC} onAlpha={setBgA}/>
            </div>
          </div>

          <div>
            <SecHdr icon={Ic.Sl}>Output size</SecHdr>
            <div style={{...s1,flexDirection:'column',alignItems:'stretch'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="range" min={4} max={20} step={1} value={scale} onChange={e=>setScale(+e.target.value)} style={{flex:1}}/>
                <div style={{background:'var(--bg)',border:`1.5px solid var(--brd)`,borderRadius:6,padding:'3px 8px',minWidth:42,textAlign:'center'}}><span style={{fontSize:11.5,fontFamily:'monospace',color:'var(--txt)'}}>{scale}px</span></div>
              </div>
              <p style={{margin:0,fontSize:11,color:'var(--txtF)',lineHeight:1.5}}>Each module is <strong style={{color:'var(--txtM)'}}>{scale}×{scale}px</strong>.{totalPx&&<> Total: <strong style={{color:'var(--txtM)'}}>{totalPx}×{totalPx}px</strong>.</>}</p>
            </div>
          </div>

          <div>
            <SecHdr icon={Ic.Gr}>Shapes</SecHdr>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <ShPick label="Data modules" shapes={MS} previewMap={SP} value={mShape} onChange={setMShape}/>
              <div style={{height:1,background:'var(--brd)'}}/>
              <div style={{fontSize:11,color:'var(--txtF)',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase'}}>Anchor patterns</div>
              <ShPick label="Outer ring" shapes={AS} previewMap={FOP} value={aOuter} onChange={setAOuter}/>
              <ShPick label="Inner dot"  shapes={AS} previewMap={FIP} value={aInner} onChange={setAInner}/>
            </div>
          </div>

          <div>
            <SecHdr icon={Ic.Img}>Logo</SecHdr>
            <input ref={logoRef} type="file" accept="image/*" onChange={upLogo} style={{display:'none'}}/>
            {!logoImg?(
              <button onClick={()=>logoRef.current?.click()} style={{width:'100%',padding:'20px 16px',background:'var(--surf2)',border:`1.5px dashed var(--brd2)`,borderRadius:10,cursor:'pointer',color:'var(--txtF)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--acc)';e.currentTarget.style.color='var(--accTxt)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--brd2)';e.currentTarget.style.color='var(--txtF)';}}>
                <Ic.Up/><span style={{fontSize:12,fontWeight:500}}>Click to upload logo</span><span style={{fontSize:11,color:'var(--txtD)'}}>PNG, JPG, SVG, WebP</span>
              </button>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={{...s1}}>
                  <div style={{width:48,height:48,borderRadius:logoSh==='circle'?'50%':logoSh==='rounded'?8:4,overflow:'hidden',flexShrink:0,border:`1px solid var(--brd2)`}}><img src={logoDU} alt="logo" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,color:'var(--txt)',fontWeight:500}}>Logo applied</div><div style={{fontSize:11,color:'var(--txtD)',marginTop:2}}>EC raised to {effEc}</div></div>
                  <button onClick={rmLogo} style={{background:'none',border:`1.5px solid var(--brd2)`,borderRadius:6,padding:'5px 7px',cursor:'pointer',color:'var(--txtM)',display:'flex',flexShrink:0}}><Ic.Trash/></button>
                </div>
                <div>
                  <div style={{fontSize:11,color:'var(--txtM)',fontWeight:500,marginBottom:6}}>Frame</div>
                  <div style={{display:'flex',gap:6}}>
                    {['square','rounded','circle'].map(sh=>{
                      const a=logoSh===sh;
                      return(
                        <button key={sh} onClick={()=>setLogoSh(sh)} style={{flex:1,padding:'7px 0',fontSize:11,fontWeight:500,background:a?'var(--accBg)':'var(--surf2)',color:a?'var(--accTxt)':'var(--txtF)',border:`1.5px solid ${a?'var(--acc)':'var(--brd)'}`,borderRadius:7,cursor:'pointer',transition:'all .15s'}}>
                          {sh[0].toUpperCase()+sh.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div><div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:11,color:'var(--txtM)',fontWeight:500}}>Logo size</span><span style={{fontSize:11,color:'var(--txtF)',fontFamily:'monospace'}}>{Math.round(logoR*100)}%</span></div><input type="range" min={0.10} max={0.35} step={0.01} value={logoR} onChange={e=>setLogoR(+e.target.value)} style={{width:'100%'}}/><div style={{fontSize:10.5,color:'var(--txtD)',marginTop:4}}>Keep under 30% for reliable scanning</div></div>
                <div><div style={{fontSize:11,color:'var(--txtM)',fontWeight:500,marginBottom:6}}>Padding colour</div><div style={{...s1,gap:8,padding:'6px 10px'}}><label style={{cursor:'pointer',position:'relative',flexShrink:0}}><div style={{width:22,height:22,borderRadius:4,background:logoBg,border:`1px solid var(--brd2)`}}/><input type="color" value={logoBg} onChange={e=>setLogoBg(e.target.value)} style={{position:'absolute',opacity:0,width:0,height:0,pointerEvents:'none'}}/></label><input type="text" value={logoBg} onChange={e=>{if(/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))setLogoBg(e.target.value);}} style={{flex:1,background:'transparent',border:'none',color:'var(--txt)',fontSize:12,fontFamily:'monospace',outline:'none'}}/><button onClick={()=>setLogoBg('transparent')} style={{fontSize:10,color:'var(--txtD)',background:'none',border:'none',cursor:'pointer',padding:0,whiteSpace:'nowrap'}}>transparent</button></div></div>
                <button onClick={()=>logoRef.current?.click()} style={{fontSize:11,color:'var(--txtF)',background:'none',border:'none',cursor:'pointer',textDecoration:'underline',textAlign:'left',padding:0}}>Replace image</button>
              </div>
            )}
          </div>

          <div>
            <button onClick={()=>setShowAdv(x=>!x)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:'none',border:'none',cursor:'pointer',padding:'2px 0'}}>
              <div style={{display:'flex',alignItems:'center',gap:7}}><span style={{color:'var(--txtF)',display:'flex'}}><Ic.Sh/></span><span style={{fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--txtF)'}}>Advanced</span></div>
              <span style={{color:'var(--txtD)',display:'flex'}}>{showAdv?<Ic.ChU/>:<Ic.ChD/>}</span>
            </button>
            {showAdv&&<div style={{marginTop:14,display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <div style={{fontSize:11,color:'var(--txtM)',fontWeight:500,marginBottom:8}}>Error correction level</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:5}}>
                  {[{id:'L',p:'7%'},{id:'M',p:'15%'},{id:'Q',p:'25%'},{id:'H',p:'30%'}].map(({id,p})=>{const a=ec===id,blk=logoMin&&ECR[id]<ECR[logoMin];return<button key={id} onClick={()=>setEc(id)} title={`${p} recovery`} style={{padding:'8px 4px',display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:a?'var(--accBg)':'var(--surf2)',color:a?'var(--accTxt)':'var(--txtF)',border:`1.5px solid ${a?'var(--acc)':'var(--brd)'}`,borderRadius:8,cursor:'pointer',transition:'all .15s',boxShadow:a?'0 0 0 2px rgba(59,130,246,0.2)':'none',opacity:blk?0.4:1}}><span style={{fontSize:14,fontWeight:700,fontFamily:'monospace'}}>{id}</span><span style={{fontSize:9,opacity:.7}}>{p}</span></button>;})}
                </div>
                {logoImg&&logoMin&&ECR[ec]<ECR[logoMin]&&<p style={{margin:'6px 0 0',fontSize:10.5,color:'var(--warn)',lineHeight:1.4}}>Bumped to <strong>{logoMin}</strong> — logo covers ~{Math.round(logoR*logoR*100)}% of area, needs {Math.round(ECRV[logoMin]*100)}% recovery.</p>}
                <p style={{margin:'8px 0 0',fontSize:10.5,color:'var(--txtD)',lineHeight:1.5}}>Higher levels add redundancy but produce a denser code.</p>
              </div>
              {qrData&&<div style={{...s1}}><span style={{fontSize:11,color:'var(--txtD)'}}>Active:</span><span style={{fontFamily:'monospace',fontSize:12,fontWeight:700,color:'var(--accTxt)'}}>{effEc}</span><span style={{fontSize:11,color:'var(--txtD)'}}>·</span><span style={{fontSize:11,color:'var(--txtD)'}}>V{Math.round((qrData.size-17)/4)}</span><span style={{fontSize:11,color:'var(--txtD)'}}>·</span><span style={{fontSize:11,color:'var(--txtD)'}}>{qrData.size}×{qrData.size}</span></div>}
            </div>}
          </div>

        </div>

        {/* Preview */}
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px',gap:20,background:'var(--bg)'}}>
          <div style={{backgroundImage:chkBg,borderRadius:16,overflow:'hidden',border:`1px solid var(--brd)`,display:'flex',alignItems:'center',justifyContent:'center',minWidth:260,minHeight:260,padding:20}}>
            {qrData?<canvas ref={canvasRef} style={{imageRendering:'pixelated',maxWidth:380,maxHeight:380,display:'block',borderRadius:2}}/>:<div style={{textAlign:'center',color:'var(--txtD)',padding:'32px 24px'}}><div style={{marginBottom:10,opacity:.2,transform:'scale(2)',display:'inline-block'}}><Ic.QR/></div><div style={{fontSize:13,marginTop:8}}>Start typing to generate</div></div>}
          </div>
          {qrData&&<div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center'}}>{[['Version',`V${Math.round((qrData.size-17)/4)}`],['Modules',`${qrData.size}×${qrData.size}`],['EC',effEc],['Image',`${totalPx}×${totalPx}px`]].map(([k,v])=><div key={k} style={{background:'var(--surf)',border:`1px solid var(--brd)`,borderRadius:20,padding:'3px 10px',display:'flex',gap:5,alignItems:'center'}}><span style={{fontSize:10,color:'var(--txtD)',fontWeight:600}}>{k}</span><span style={{fontSize:10.5,color:'var(--txtM)',fontFamily:'monospace'}}>{v}</span></div>)}</div>}
          <div style={{display:'flex',gap:8}}>
            <button className="eb" onClick={dlPng} disabled={!qrData} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 20px',fontSize:12.5,fontWeight:600,background:qrData?'var(--acc)':'var(--surf2)',color:qrData?'white':'var(--txtD)',border:'none',borderRadius:8,cursor:qrData?'pointer':'default'}}><Ic.Dl/> PNG</button>
            <button className="eb" onClick={dlSvg} disabled={!qrData} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 20px',fontSize:12.5,fontWeight:600,background:'var(--surf)',color:qrData?'var(--txt)':'var(--txtD)',border:`1.5px solid ${qrData?'var(--brd2)':'var(--brd)'}`,borderRadius:8,cursor:qrData?'pointer':'default'}}><Ic.Dl/> SVG</button>
            <button className="eb" onClick={copyImg} disabled={!qrData} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 20px',fontSize:12.5,fontWeight:600,background:copied?'var(--okBg)':'var(--surf)',color:copied?'var(--ok)':qrData?'var(--txt)':'var(--txtD)',border:`1.5px solid ${copied?'var(--okBdr)':qrData?'var(--brd2)':'var(--brd)'}`,borderRadius:8,cursor:qrData?'pointer':'default',transition:'all .2s'}}>{copied?<><Ic.Ok/> Copied!</>:<><Ic.Cp/> Copy</>}</button>
            <button className="eb" onClick={()=>setShowSave(x=>!x)} disabled={!qrData} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'9px 20px',fontSize:12.5,fontWeight:600,background:qrData?'var(--surf)':'var(--surf2)',color:qrData?'var(--txt)':'var(--txtD)',border:`1.5px solid ${qrData?'var(--brd2)':'var(--brd)'}`,borderRadius:8,cursor:qrData?'pointer':'default'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save</button>
          </div>
          {showSave&&<div style={{display:'flex',gap:8,alignItems:'center',width:'100%',maxWidth:400}}>
            <input type="text" value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="Name (optional)" style={{flex:1,background:'var(--inp)',border:'1.5px solid var(--brd)',borderRadius:8,padding:'8px 11px',fontSize:12.5,color:'var(--txt)',outline:'none',fontFamily:'inherit'}} onFocus={e=>e.target.style.borderColor='var(--acc)'} onBlur={e=>e.target.style.borderColor='var(--brd)'}/>
            <button onClick={saveCurrent} style={{padding:'9px 16px',fontSize:12.5,fontWeight:600,background:'var(--acc)',color:'white',border:'none',borderRadius:8,cursor:'pointer'}}>Save</button>
            <button onClick={()=>{setShowSave(false);setSaveName('');}} style={{padding:'9px 16px',fontSize:12.5,fontWeight:600,background:'var(--surf)',color:'var(--txt)',border:`1.5px solid var(--brd2)`,borderRadius:8,cursor:'pointer'}}>Cancel</button>
          </div>}
          <p style={{fontSize:11,color:'var(--txtD)',margin:0,textAlign:'center'}}>PNG exports at 2× resolution.</p>
        </div>
      </div>
      {modal&&<DlModal type={modal.type} dataUrl={modal.dataUrl} downloadUrl={modal.downloadUrl} onClose={()=>setModal(null)} onCloseExtra={modal.onCloseExtra}/>}
    </div>
  );
}

export default App;
