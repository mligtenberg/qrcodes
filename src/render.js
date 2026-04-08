export function h2r(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;}

export function dRR(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();}

export function dRC(ctx,x,y,w,h,r,{tl=true,tr=true,br=true,bl=true}){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+(tl?r:0),y);ctx.lineTo(x+w-(tr?r:0),y);if(tr)ctx.arcTo(x+w,y,x+w,y+r,r);else ctx.lineTo(x+w,y);ctx.lineTo(x+w,y+h-(br?r:0));if(br)ctx.arcTo(x+w,y+h,x+w-r,y+h,r);else ctx.lineTo(x+w,y+h);ctx.lineTo(x+(bl?r:0),y+h);if(bl)ctx.arcTo(x,y+h,x,y+h-r,r);else ctx.lineTo(x,y+h);ctx.lineTo(x,y+(tl?r:0));if(tl)ctx.arcTo(x,y,x+r,y,r);else ctx.lineTo(x,y);ctx.closePath();}

export function dMod(ctx,x,y,s,shape,gapPct){
  const gap=s*((gapPct||0)/100);
  const xg=x+gap,yg=y+gap,wg=s-gap*2;
  if(shape==='circle'){ctx.beginPath();ctx.arc(xg+wg/2,yg+wg/2,wg/2,0,Math.PI*2);ctx.fill();}
  else if(shape==='rounded'){dRR(ctx,xg,yg,wg,wg,wg*0.3);ctx.fill();}
  else if(shape==='diamond'){const cx=x+s/2,cy=y+s/2,r=Math.max(0,wg*0.48);ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r,cy);ctx.lineTo(cx,cy+r);ctx.lineTo(cx-r,cy);ctx.closePath();ctx.fill();}
  else if(wg>0)ctx.fillRect(xg,yg,wg,wg);
}

export function dModC(ctx,x,y,s,shape,n,gapPct){
  const r=s*0.38;
  const gp=(gapPct||0)/100;
  if(shape==='connected-h'){const g=s*gp;dRC(ctx,x,y+g,s,s-g*2,r,{tl:!n.W,tr:!n.E,br:!n.E,bl:!n.W});ctx.fill();return;}
  if(shape==='connected-v'){const g=s*gp;dRC(ctx,x+g,y,s-g*2,s,r,{tl:!n.N,tr:!n.N,br:!n.S,bl:!n.S});ctx.fill();return;}
  if(shape==='fluid'){
    const tl=!(n.N||n.W),tr=!(n.N||n.E),br=!(n.S||n.E),bl=!(n.S||n.W);
    dRC(ctx,x,y,s,s,r,{tl,tr,br,bl});ctx.fill();
    if(n.N&&n.W&&!n.NW){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x,y);ctx.lineTo(x,y+r);ctx.arc(x,y,r,Math.PI/2,0,true);ctx.closePath();ctx.fill();}
    if(n.N&&n.E&&!n.NE){ctx.beginPath();ctx.moveTo(x+s-r,y);ctx.lineTo(x+s,y);ctx.lineTo(x+s,y+r);ctx.arc(x+s,y,r,Math.PI/2,Math.PI);ctx.closePath();ctx.fill();}
    if(n.S&&n.E&&!n.SE){ctx.beginPath();ctx.moveTo(x+s,y+s-r);ctx.lineTo(x+s,y+s);ctx.lineTo(x+s-r,y+s);ctx.arc(x+s,y+s,r,Math.PI,3*Math.PI/2);ctx.closePath();ctx.fill();}
    if(n.S&&n.W&&!n.SW){ctx.beginPath();ctx.moveTo(x+r,y+s);ctx.lineTo(x,y+s);ctx.lineTo(x,y+s-r);ctx.arc(x,y+s,r,3*Math.PI/2,2*Math.PI);ctx.closePath();ctx.fill();}
    return;
  }
  dMod(ctx,x,y,s,shape);
}

export function gNbr(matrix,size,fS,r,c){
  const dk=(dr,dc)=>{const nr=r+dr,nc=c+dc;if(nr<0||nr>=size||nc<0||nc>=size)return false;if(fS.has(`${nr},${nc}`))return false;return matrix[nr][nc].dark===1;};
  return{N:dk(-1,0),S:dk(1,0),E:dk(0,1),W:dk(0,-1),NE:dk(-1,1),NW:dk(-1,-1),SE:dk(1,1),SW:dk(1,-1)};
}

export function dFinder(fg,ox,oy,s,oShape,iShape,fgColor,border,innerSize){
  const full=7*s,bt=border||1,is=innerSize||1;
  fg.fillStyle=fgColor;
  const dOuter=()=>{if(oShape==='circle'){fg.beginPath();fg.arc(ox+full/2,oy+full/2,full/2,0,Math.PI*2);fg.fill();}else if(oShape==='rounded'){dRR(fg,ox,oy,full,full,full*0.22);fg.fill();}else fg.fillRect(ox,oy,full,full);};
  const punchHole=()=>{fg.globalCompositeOperation='destination-out';fg.fillStyle='rgba(0,0,0,1)';const hs=full-2*bt*s,hx=ox+bt*s,hy=oy+bt*s;if(oShape==='circle'){fg.beginPath();fg.arc(ox+full/2,oy+full/2,hs/2,0,Math.PI*2);fg.fill();}else if(oShape==='rounded'){dRR(fg,hx,hy,hs,hs,hs*0.18);fg.fill();}else fg.fillRect(hx,hy,hs,hs);fg.globalCompositeOperation='source-over';};
  dOuter();punchHole();
  fg.fillStyle=fgColor;
  const ix=ox+2*s,iy=oy+2*s,iw=3*s*is;
  const iox=ox+(7*s-iw)/2,ioy=oy+(7*s-iw)/2;
  if(iShape==='circle'){fg.beginPath();fg.arc(iox+iw/2,ioy+iw/2,iw/2,0,Math.PI*2);fg.fill();}
  else if(iShape==='rounded'){dRR(fg,iox,ioy,iw,iw,iw*0.28);fg.fill();}
  else fg.fillRect(iox,ioy,iw,iw);
}

export function renderQR(canvas,{matrix,size},opts){
  const{fgColor,fgAlpha,bgColor,bgAlpha,scale,moduleShape,moduleGap,anchorOuterShape,anchorInnerShape,anchorInnerSize,anchorBorder}=opts;
  const quiet=4,total=(size+quiet*2)*scale;
  canvas.width=total;canvas.height=total;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,total,total);
  if(bgAlpha>0){ctx.fillStyle=h2r(bgColor,bgAlpha);ctx.fillRect(0,0,total,total);}
  const fgC=document.createElement('canvas');fgC.width=total;fgC.height=total;
  const fg=fgC.getContext('2d');
  const fO=[{r:0,c:0},{r:0,c:size-7},{r:size-7,c:0}];
  const fS=new Set();fO.forEach(({r,c})=>{for(let dr=0;dr<7;dr++)for(let dc=0;dc<7;dc++)fS.add(`${r+dr},${c+dc}`);});
  const CON=new Set(['connected-h','connected-v','fluid']);
  fg.fillStyle=fgColor;
  if(moduleShape==='square'){
    const gap=scale*((moduleGap||0)/100);
    const wg=scale-gap*2;
    if(wg>0){
      fg.beginPath();
      for(let r=0;r<size;r++)for(let c=0;c<size;c++){
        if(fS.has(`${r},${c}`))continue;
        if(matrix[r][c].dark)fg.rect((c+quiet)*scale+gap,(r+quiet)*scale+gap,wg,wg);
      }
      fg.fill();
    }
  }else{
    for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      if(fS.has(`${r},${c}`))continue;
      if(matrix[r][c].dark){fg.fillStyle=fgColor;if(CON.has(moduleShape)){const n=gNbr(matrix,size,fS,r,c);dModC(fg,(c+quiet)*scale,(r+quiet)*scale,scale,moduleShape,n,moduleGap);}else dMod(fg,(c+quiet)*scale,(r+quiet)*scale,scale,moduleShape,moduleGap);}
    }
  }
  fO.forEach(({r,c})=>dFinder(fg,(c+quiet)*scale,(r+quiet)*scale,scale,anchorOuterShape,anchorInnerShape,fgColor,anchorBorder,anchorInnerSize));
  if(opts.logoImg&&(!opts.logoBg||opts.logoBg==='transparent')){
    const ls=Math.round(total*(opts.logoRatio||0.22));
    const lx=Math.round((total-ls)/2),ly=Math.round((total-ls)/2),pad=Math.round(ls*0.12);
    fg.globalCompositeOperation='destination-out';fg.fillStyle='rgba(0,0,0,1)';
    if(opts.logoShape==='circle'){fg.beginPath();fg.arc(lx+ls/2,ly+ls/2,ls/2+pad,0,Math.PI*2);fg.fill();}
    else if(opts.logoShape==='rounded'){dRR(fg,lx-pad,ly-pad,ls+pad*2,ls+pad*2,(ls+pad*2)*0.2);fg.fill();}
    else fg.fillRect(lx-pad,ly-pad,ls+pad*2,ls+pad*2);
    fg.globalCompositeOperation='source-over';
  }
  ctx.globalAlpha=fgAlpha;ctx.drawImage(fgC,0,0);ctx.globalAlpha=1;
  if(opts.logoImg){
    const ls=Math.round(total*(opts.logoRatio||0.22));
    const lx=Math.round((total-ls)/2),ly=Math.round((total-ls)/2),pad=Math.round(ls*0.12);
    if(opts.logoBg&&opts.logoBg!=='transparent'){
      ctx.fillStyle=opts.logoBg;
      if(opts.logoShape==='circle'){ctx.save();ctx.beginPath();ctx.arc(lx+ls/2,ly+ls/2,ls/2+pad,0,Math.PI*2);ctx.fill();}
      else if(opts.logoShape==='rounded'){dRR(ctx,lx-pad,ly-pad,ls+pad*2,ls+pad*2,(ls+pad*2)*0.2);ctx.fill();}
      else ctx.fillRect(lx-pad,ly-pad,ls+pad*2,ls+pad*2);
    }
    if(opts.logoShape==='circle'){ctx.save();ctx.beginPath();ctx.arc(lx+ls/2,ly+ls/2,ls/2,0,Math.PI*2);ctx.clip();ctx.drawImage(opts.logoImg,lx,ly,ls,ls);ctx.restore();}
    else if(opts.logoShape==='rounded'){ctx.save();dRR(ctx,lx,ly,ls,ls,ls*0.18);ctx.clip();ctx.drawImage(opts.logoImg,lx,ly,ls,ls);ctx.restore();}
    else ctx.drawImage(opts.logoImg,lx,ly,ls,ls);
  }
}

export function fmtC(hex,a){if(a<=0)return'none';const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);if(a>=1)return `rgb(${r},${g},${b})`;return `rgba(${r},${g},${b},${a.toFixed(3)})`;}
export function svgRR(x,y,w,h,r){r=Math.min(r,w/2,h/2);return `M${x+r},${y}L${x+w-r},${y}Q${x+w},${y} ${x+w},${y+r}L${x+w},${y+h-r}Q${x+w},${y+h} ${x+w-r},${y+h}L${x+r},${y+h}Q${x},${y+h} ${x},${y+h-r}L${x},${y+r}Q${x},${y} ${x+r},${y}Z`;}
export function svgMod(x,y,s,shape,gapPct){
  const gp=gapPct||0;
  const gap=s*(gp>0?gp/100:shape==='circle'?0.1:shape==='rounded'?0.07:shape==='diamond'?0.04:0);
  const xg=x+gap,yg=y+gap,wg=s-gap*2;
  if(shape==='circle')return `<circle cx="${xg+wg/2}" cy="${yg+wg/2}" r="${wg/2}"/>`;
  if(shape==='rounded')return `<path d="${svgRR(xg,yg,wg,wg,wg*0.3)}"/>`;
  if(shape==='diamond'){const cx=x+s/2,cy=y+s/2,r=Math.max(0,wg*0.48);return `<polygon points="${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}"/>`;}
  return wg>0?`<rect x="${xg}" y="${yg}" width="${wg}" height="${wg}"/>`:'';
}
export function svgModC(x,y,s,shape,n,gapPct){
  const r=s*0.38;
  const gp=(gapPct||0)/100;
  const sC=(x,y,w,h,r,{tl=true,tr=true,br=true,bl=true})=>{r=Math.min(r,w/2,h/2);return[`M${x+(tl?r:0)},${y}`,`L${x+w-(tr?r:0)},${y}`,tr?`Q${x+w},${y} ${x+w},${y+r}`:`L${x+w},${y}`,`L${x+w},${y+h-(br?r:0)}`,br?`Q${x+w},${y+h} ${x+w-r},${y+h}`:`L${x+w},${y+h}`,`L${x+(bl?r:0)},${y+h}`,bl?`Q${x},${y+h} ${x},${y+h-r}`:`L${x},${y+h}`,`L${x},${y+(tl?r:0)}`,tl?`Q${x},${y} ${x+r},${y}`:`L${x},${y}`,'Z'].join('');};
  if(shape==='connected-h'){const g=s*(gp>0?gp:0.08);return `<path d="${sC(x,y+g,s,s-g*2,r,{tl:!n.W,tr:!n.E,br:!n.E,bl:!n.W})}"/>`;}
  if(shape==='connected-v'){const g=s*(gp>0?gp:0.08);return `<path d="${sC(x+g,y,s-g*2,s,r,{tl:!n.N,tr:!n.N,br:!n.S,bl:!n.S})}"/>`;}
  if(shape==='fluid'){
    const tl=!(n.N||n.W),tr=!(n.N||n.E),br=!(n.S||n.E),bl=!(n.S||n.W);
    let d=sC(x,y,s,s,r,{tl,tr,br,bl});
    if(n.N&&n.W&&!n.NW)d+=` M${x+r},${y} L${x},${y} L${x},${y+r} A${r},${r} 0 0,0 ${x+r},${y} Z`;
    if(n.N&&n.E&&!n.NE)d+=` M${x+s-r},${y} L${x+s},${y} L${x+s},${y+r} A${r},${r} 0 0,1 ${x+s-r},${y} Z`;
    if(n.S&&n.E&&!n.SE)d+=` M${x+s},${y+s-r} L${x+s},${y+s} L${x+s-r},${y+s} A${r},${r} 0 0,0 ${x+s},${y+s-r} Z`;
    if(n.S&&n.W&&!n.SW)d+=` M${x+r},${y+s} L${x},${y+s} L${x},${y+s-r} A${r},${r} 0 0,1 ${x+r},${y+s} Z`;
    return `<path d="${d}"/>`;
  }
  return svgMod(x,y,s,shape);
}
export function svgFinder(ox,oy,s,oS,iS,border,innerSize){
  const full=7*s,bt=border||1,is=innerSize||1,hs=full-2*bt*s,hx=ox+bt*s,hy=oy+bt*s;
  const iw=3*s*is,iox=ox+(7*s-iw)/2,ioy=oy+(7*s-iw)/2;
  let ring='';
  if(oS==='circle')ring=`<path fill-rule="evenodd" d="M${ox+full/2},${oy} a${full/2},${full/2} 0 1,0 0.001,0 Z M${ox+full/2},${oy+bt*s} a${hs/2},${hs/2} 0 1,1 -0.001,0 Z"/>`;
  else if(oS==='rounded')ring=`<path fill-rule="evenodd" d="${svgRR(ox,oy,full,full,full*0.22)} ${svgRR(hx,hy,hs,hs,hs*0.18)}"/>`;
  else ring=`<path fill-rule="evenodd" d="M${ox},${oy}h${full}v${full}h-${full}Z M${hx},${hy}h${hs}v${hs}h-${hs}Z"/>`;
  let inner='';
  if(iS==='circle')inner=`<circle cx="${iox+iw/2}" cy="${ioy+iw/2}" r="${iw/2}"/>`;
  else if(iS==='rounded')inner=`<path d="${svgRR(iox,ioy,iw,iw,iw*0.28)}"/>`;
  else inner=`<rect x="${iox}" y="${ioy}" width="${iw}" height="${iw}"/>`;
  return ring+inner;
}
export function genSVG({matrix,size},opts){
  const{fgColor,fgAlpha,bgColor,bgAlpha,moduleShape,moduleGap,anchorOuterShape,anchorInnerShape,anchorInnerSize,anchorBorder}=opts;
  const q=4,t=size+q*2,s=1,fg=fmtC(fgColor,fgAlpha);
  const fO=[{r:0,c:0},{r:0,c:size-7},{r:size-7,c:0}];
  const fS=new Set();fO.forEach(({r,c})=>{for(let dr=0;dr<7;dr++)for(let dc=0;dc<7;dc++)fS.add(`${r+dr},${c+dc}`);});
  const CON=new Set(['connected-h','connected-v','fluid']);
  const logoTransparent=opts.logoImg&&(!opts.logoBg||opts.logoBg==='transparent');
  let maskDef='';
  if(logoTransparent){
    const ls2=t*(opts.logoRatio||0.22),lx=(t-ls2)/2,ly=(t-ls2)/2,pad=ls2*0.12;
    let cutout='';
    if(opts.logoShape==='circle'){cutout=`<circle cx="${lx+ls2/2}" cy="${ly+ls2/2}" r="${ls2/2+pad}" fill="black"/>`;}
    else if(opts.logoShape==='rounded'){const rp=(ls2+pad*2)*0.2;cutout=`<rect x="${lx-pad}" y="${ly-pad}" width="${ls2+pad*2}" height="${ls2+pad*2}" rx="${rp}" fill="black"/>`;}
    else{cutout=`<rect x="${lx-pad}" y="${ly-pad}" width="${ls2+pad*2}" height="${ls2+pad*2}" fill="black"/>`;}
    maskDef=`<mask id="qm"><rect width="${t}" height="${t}" fill="white"/>${cutout}</mask>`;
  }
  let dm='';
  if(moduleShape==='square'){
    const gp=moduleGap||0;
    const gap=s*(gp/100);
    const wg=s-gap*2;
    if(wg>0){
      let d='';
      for(let r=0;r<size;r++)for(let c=0;c<size;c++){
        if(fS.has(`${r},${c}`))continue;
        if(!matrix[r][c].dark)continue;
        const x=c+q+gap,y=r+q+gap;
        d+=`M${x},${y}h${wg}v${wg}h-${wg}Z`;
      }
      dm=`<path d="${d}"/>`;
    }
  }else{
    for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      if(fS.has(`${r},${c}`))continue;
      if(matrix[r][c].dark){
        if(CON.has(moduleShape)){const n=gNbr(matrix,size,fS,r,c);dm+=svgModC(c+q,r+q,s,moduleShape,n,moduleGap);}else dm+=svgMod(c+q,r+q,s,moduleShape,moduleGap);
      }
    }
  }
  let fe='';fO.forEach(({r,c},i)=>{fe+=svgFinder(c+q,r+q,s,anchorOuterShape,anchorInnerShape,anchorBorder,anchorInnerSize);});
  const bgR=bgAlpha>0?`<rect width="${t}" height="${t}" fill="${fmtC(bgColor,bgAlpha)}"/>`:'';
  let lE='';
  if(opts.logoImg&&opts.logoDataUrl){const ls2=t*(opts.logoRatio||0.22),lx=(t-ls2)/2,ly=(t-ls2)/2,pad=ls2*0.12,bg=opts.logoBg||'#ffffff';let bgEl='',clipEl='',logoEl='';if(opts.logoShape==='circle'){bgEl=`<circle cx="${lx+ls2/2}" cy="${ly+ls2/2}" r="${ls2/2+pad}" fill="${bg}"/>`;clipEl=`<clipPath id="lc"><circle cx="${lx+ls2/2}" cy="${ly+ls2/2}" r="${ls2/2}"/></clipPath>`;}else if(opts.logoShape==='rounded'){const rp=(ls2+pad*2)*0.2,ri=ls2*0.18;bgEl=`<rect x="${lx-pad}" y="${ly-pad}" width="${ls2+pad*2}" height="${ls2+pad*2}" rx="${rp}" fill="${bg}"/>`;clipEl=`<clipPath id="lc"><rect x="${lx}" y="${ly}" width="${ls2}" height="${ls2}" rx="${ri}"/></clipPath>`;}else{bgEl=`<rect x="${lx-pad}" y="${ly-pad}" width="${ls2+pad*2}" height="${ls2+pad*2}" fill="${bg}"/>`;}if(opts.logoSvgContent){const{inner,vb}=opts.logoSvgContent;const vw=vb.w||1,vh=vb.h||1;const sc=ls2/Math.max(vw,vh);const ox=lx+(ls2-vw*sc)/2-vb.x*sc,oy=ly+(ls2-vh*sc)/2-vb.y*sc;logoEl=`<g clip-path="url(#lc)" transform="translate(${ox},${oy}) scale(${sc})">${inner}</g>`;}else{logoEl=`<image href="${opts.logoDataUrl}" x="${lx}" y="${ly}" width="${ls2}" height="${ls2}"${clipEl?' clip-path="url(#lc)"':''} preserveAspectRatio="xMidYMid slice"/>`;}lE=bgEl+clipEl+logoEl;}
  const mAttr=logoTransparent?' mask="url(#qm)"':'';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges">${maskDef}${bgR}<g fill="${fg}"${mAttr}>${dm}${fe}</g>${lE}</svg>`;
}

export function getPngUrl(qrData,opts){const c=document.createElement('canvas');renderQR(c,qrData,{...opts,scale:opts.scale*2});return c.toDataURL('image/png');}
export function getSvgUrls(qrData,opts){
  const svg=genSVG(qrData,opts);
  const b64=btoa(unescape(encodeURIComponent(svg)));
  const pU='data:image/svg+xml;base64,'+b64;
  const blob=new Blob([svg],{type:'image/svg+xml'});
  return{previewUrl:pU,downloadUrl:URL.createObjectURL(blob)};
}
