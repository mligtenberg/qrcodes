const { useState, useRef, useEffect, useCallback } = React;

const qrcodeGenerator = (() => {
  const PAD0=0xEC,PAD1=0x11;
  const QRMode={MODE_NUMBER:1<<0,MODE_ALPHA_NUM:1<<1,MODE_8BIT_BYTE:1<<2};
  const ECLevel={L:1,M:0,Q:3,H:2};
  const PPT=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]];
  const RST=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,26],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[4,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16]];
  const ET=new Array(256),LT=new Array(256);
  for(let i=0;i<8;i++)ET[i]=1<<i;
  for(let i=8;i<256;i++)ET[i]=ET[i-4]^ET[i-5]^ET[i-6]^ET[i-8];
  for(let i=0;i<255;i++)LT[ET[i]]=i;
  const gl=n=>{if(n<1)throw new Error('g');return LT[n];};
  const ge=n=>ET[((n%255)+255)%255];
  const poly=num=>{let _n=num.slice(num.findIndex(x=>x!==0)||0);return{get:i=>_n[i],len:()=>_n.length,mul(e){const r=new Array(_n.length+e.len()-1).fill(0);for(let i=0;i<_n.length;i++)for(let j=0;j<e.len();j++)r[i+j]^=ge(gl(_n[i])+gl(e.get(j)));return poly(r);},mod(e){if(_n.length-e.len()<0)return{get:i=>_n[i],len:()=>_n.length,mod:()=>{}};const ratio=gl(_n[0])-gl(e.get(0));const r=_n.slice();for(let i=0;i<e.len();i++)r[i]^=ge(gl(e.get(i))+ratio);return poly(r).mod(e);}};};
  const ecP=n=>{let a=poly([1]);for(let i=0;i<n;i++)a=a.mul(poly([1,ge(i)]));return a;};
  const G15=(1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|(1<<0);
  const G18=(1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|(1<<0);
  const G15M=(1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1);
  const bD=d=>{let n=0;while(d!==0){n++;d>>>=1;}return n;};
  const bTI=d=>{let v=d<<10;while(bD(v)-bD(G15)>=0)v^=G15<<(bD(v)-bD(G15));return((d<<10)|v)^G15M;};
  const bTN=d=>{let v=d<<12;while(bD(v)-bD(G18)>=0)v^=G18<<(bD(v)-bD(G18));return(d<<12)|v;};
  const mFn=[(r,c)=>(r+c)%2===0,r=>r%2===0,(_,c)=>c%3===0,(r,c)=>(r+c)%3===0,(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,(r,c)=>(r*c)%2+(r*c)%3===0,(r,c)=>((r*c)%2+(r*c)%3)%2===0,(r,c)=>((r+c)%2+(r*c)%3)%2===0];
  const lB=(mode,t)=>{if(mode===QRMode.MODE_NUMBER)return t<10?10:t<27?12:14;if(mode===QRMode.MODE_ALPHA_NUM)return t<10?9:t<27?11:13;return t<10?8:16;};
  const bb=()=>{const buf=[],len=[0];const pB=b=>{const i=Math.floor(len[0]/8);if(buf.length<=i)buf.push(0);if(b)buf[i]|=0x80>>>(len[0]%8);len[0]++;};return{buf:()=>buf,put:(n,l)=>{for(let i=0;i<l;i++)pB(((n>>>(l-i-1))&1)===1);},len:()=>len[0],putBit:pB};};
  const ECO={0:1,1:0,2:3,3:2};
  const gRS=(tn,ecl)=>{const t=RST[(tn-1)*4+ECO[ecl]];const l=[];for(let i=0;i<t.length;i+=3)for(let j=0;j<t[i];j++)l.push({total:t[i+1],data:t[i+2]});return l;};
  const cB=(buf,rsB)=>{let off=0,mD=0,mE=0;const dc=[],ec=[];for(let r=0;r<rsB.length;r++){const dn=rsB[r].data,en=rsB[r].total-dn;mD=Math.max(mD,dn);mE=Math.max(mE,en);dc[r]=Array.from({length:dn},(_,i)=>0xff&buf.buf()[i+off]);off+=dn;const rp=ecP(en),raw=poly([...dc[r],...new Array(rp.len()-1).fill(0)]),mp=raw.mod(rp);ec[r]=Array.from({length:rp.len()-1},(_,i)=>{const mi=i+mp.len()-rp.len()+1;return mi>=0?mp.get(mi):0;});}const total=rsB.reduce((s,b)=>s+b.total,0);const data=new Array(total);let idx=0;for(let i=0;i<mD;i++)for(let r=0;r<rsB.length;r++)if(i<dc[r].length)data[idx++]=dc[r][i];for(let i=0;i<mE;i++)for(let r=0;r<rsB.length;r++)if(i<ec[r].length)data[idx++]=ec[r][i];return data;};
  const cD=(tn,ecl,dL)=>{const rsB=gRS(tn,ecl);const b=bb();for(const d of dL){b.put(d.mode,4);b.put(d.length,lB(d.mode,tn));d.write(b);}const tD=rsB.reduce((s,x)=>s+x.data,0);if(b.len()>tD*8)throw new Error('overflow');if(b.len()+4<=tD*8)b.put(0,4);while(b.len()%8!==0)b.putBit(false);for(let i=0;b.len()<tD*8;i++)b.put(i%2===0?PAD0:PAD1,8);return cB(b,rsB);};
  const lP=qr=>{const mc=qr.size;let lp=0;for(let r=0;r<mc;r++)for(let c=0;c<mc;c++){let sc=0;const d=qr.m[r][c];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(dr===0&&dc===0)continue;const nr=r+dr,nc=c+dc;if(nr>=0&&nr<mc&&nc>=0&&nc<mc&&d===qr.m[nr][nc])sc++;}if(sc>5)lp+=3+sc-5;}for(let r=0;r<mc-1;r++)for(let c=0;c<mc-1;c++){const cnt=[qr.m[r][c],qr.m[r+1][c],qr.m[r][c+1],qr.m[r+1][c+1]].filter(Boolean).length;if(cnt===0||cnt===4)lp+=3;}const ck=(r,c)=>qr.m[r][c];for(let r=0;r<mc;r++)for(let c=0;c<mc-6;c++){if(ck(r,c)&&!ck(r,c+1)&&ck(r,c+2)&&ck(r,c+3)&&ck(r,c+4)&&!ck(r,c+5)&&ck(r,c+6))lp+=40;}for(let c=0;c<mc;c++)for(let r=0;r<mc-6;r++){if(ck(r,c)&&!ck(r+1,c)&&ck(r+2,c)&&ck(r+3,c)&&ck(r+4,c)&&!ck(r+5,c)&&ck(r+6,c))lp+=40;}let dark=0;for(let r=0;r<mc;r++)for(let c=0;c<mc;c++)if(qr.m[r][c])dark++;lp+=Math.abs(100*dark/mc/mc-50)/5*10;return lp;};
  return function(tn0,ecS){
    const ecl=ECLevel[ecS];let tn=tn0,dC=null;const dL=[];let mod=null,mc=0;
    const mI=(test,mask)=>{
      mc=tn*4+17;mod=Array.from({length:mc},()=>new Array(mc).fill(null));
      const probe=(row,col)=>{for(let r=-1;r<=7;r++){if(row+r<0||mc<=row+r)continue;for(let c=-1;c<=7;c++){if(col+c<0||mc<=col+c)continue;mod[row+r][col+c]=(r>=0&&r<=6&&(c===0||c===6))||(c>=0&&c<=6&&(r===0||r===6))||(r>=2&&r<=4&&c>=2&&c<=4);}}};
      probe(0,0);probe(0,mc-7);probe(mc-7,0);
      for(let i=8;i<mc-8;i++){if(mod[i][6]==null)mod[i][6]=i%2===0;if(mod[6][i]==null)mod[6][i]=i%2===0;}
      const pos=PPT[tn-1];
      for(let i=0;i<pos.length;i++)for(let j=0;j<pos.length;j++){const r=pos[i],c=pos[j];if(mod[r][c]!=null)continue;for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++)mod[r+dr][c+dc]=(Math.abs(dr)===2||Math.abs(dc)===2||(dr===0&&dc===0));}
      const tB=bTI((ecl<<3)|mask);
      for(let i=0;i<15;i++){const b=!test&&((tB>>i)&1)===1;if(i<6)mod[i][8]=b;else if(i<8)mod[i+1][8]=b;else mod[mc-15+i][8]=b;}
      for(let i=0;i<15;i++){const b=!test&&((tB>>i)&1)===1;if(i<8)mod[8][mc-i-1]=b;else if(i<9)mod[8][15-i]=b;else mod[8][15-i-1]=b;}
      mod[mc-8][8]=!test;
      if(tn>=7){const nb=bTN(tn);for(let i=0;i<18;i++){const b=!test&&((nb>>i)&1)===1;mod[Math.floor(i/3)][i%3+mc-8-3]=b;mod[i%3+mc-8-3][Math.floor(i/3)]=b;}}
      if(dC==null)dC=cD(tn,ecl,dL);
      let inc=-1,row=mc-1,bi=7,byte=0;const mf=mFn[mask];
      for(let col=mc-1;col>0;col-=2){if(col===6)col--;while(true){for(let c=0;c<2;c++){if(mod[row][col-c]==null){let dark=byte<dC.length&&((dC[byte]>>>bi)&1)===1;if(mf(row,col-c))dark=!dark;mod[row][col-c]=dark;bi--;if(bi===-1){byte++;bi=7;}}}row+=inc;if(row<0||mc<=row){row-=inc;inc=-inc;break;}}}
    };
    return{addData(text){const bytes=[...new TextEncoder().encode(text)];dL.push({mode:QRMode.MODE_8BIT_BYTE,length:bytes.length,write(b){bytes.forEach(x=>b.put(x,8));}});dC=null;},make(){if(tn===0){for(tn=1;tn<=40;tn++){try{mI(true,0);break;}catch(e){if(tn===40)throw e;}}}let best=0,bS=Infinity;for(let m=0;m<8;m++){mI(true,m);const s=lP({m:mod,size:mc});if(s<bS){bS=s;best=m;}}mI(false,best);},isDark:(r,c)=>mod[r][c],getModuleCount:()=>mc};
  };
})();

function generateMatrix(text,ecLevel='L'){
  const qr=qrcodeGenerator(0,ecLevel);qr.addData(text);qr.make();
  const size=qr.getModuleCount();
  const fC=new Set();
  for(let r=0;r<=8;r++)for(let c=0;c<=8;c++)fC.add(`${r},${c}`);
  for(let r=0;r<=8;r++)for(let c=size-8;c<size;c++)fC.add(`${r},${c}`);
  for(let r=size-8;r<size;r++)for(let c=0;c<=8;c++)fC.add(`${r},${c}`);
  const matrix=Array.from({length:size},(_,r)=>Array.from({length:size},(__,c)=>({dark:qr.isDark(r,c)?1:0,finder:fC.has(`${r},${c}`)})));
  return{matrix,size};
}

function h2r(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;}

function dRR(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();}

function dRC(ctx,x,y,w,h,r,{tl=true,tr=true,br=true,bl=true}){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+(tl?r:0),y);ctx.lineTo(x+w-(tr?r:0),y);if(tr)ctx.arcTo(x+w,y,x+w,y+r,r);else ctx.lineTo(x+w,y);ctx.lineTo(x+w,y+h-(br?r:0));if(br)ctx.arcTo(x+w,y+h,x+w-r,y+h,r);else ctx.lineTo(x+w,y+h);ctx.lineTo(x+(bl?r:0),y+h);if(bl)ctx.arcTo(x,y+h,x,y+h-r,r);else ctx.lineTo(x,y+h);ctx.lineTo(x,y+(tl?r:0));if(tl)ctx.arcTo(x,y,x+r,y,r);else ctx.lineTo(x,y);ctx.closePath();}

function dMod(ctx,x,y,s,shape){
  const gap=shape==='circle'?s*0.1:shape==='rounded'?s*0.07:0;
  const xg=x+gap,yg=y+gap,wg=s-gap*2;
  if(shape==='circle'){ctx.beginPath();ctx.arc(xg+wg/2,yg+wg/2,wg/2,0,Math.PI*2);ctx.fill();}
  else if(shape==='rounded'){dRR(ctx,xg,yg,wg,wg,wg*0.3);ctx.fill();}
  else if(shape==='diamond'){const cx=x+s/2,cy=y+s/2,r=s*0.48;ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r,cy);ctx.lineTo(cx,cy+r);ctx.lineTo(cx-r,cy);ctx.closePath();ctx.fill();}
  else ctx.fillRect(x,y,s,s);
}

function dModC(ctx,x,y,s,shape,n){
  const r=s*0.38;
  if(shape==='connected-h'){const g=s*0.08;dRC(ctx,x,y+g,s,s-g*2,r,{tl:!n.W,tr:!n.E,br:!n.E,bl:!n.W});ctx.fill();return;}
  if(shape==='connected-v'){const g=s*0.08;dRC(ctx,x+g,y,s-g*2,s,r,{tl:!n.N,tr:!n.N,br:!n.S,bl:!n.S});ctx.fill();return;}
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

function gNbr(matrix,size,fS,r,c){
  const dk=(dr,dc)=>{const nr=r+dr,nc=c+dc;if(nr<0||nr>=size||nc<0||nc>=size)return false;if(fS.has(`${nr},${nc}`))return false;return matrix[nr][nc].dark===1;};
  return{N:dk(-1,0),S:dk(1,0),E:dk(0,1),W:dk(0,-1),NE:dk(-1,1),NW:dk(-1,-1),SE:dk(1,1),SW:dk(1,-1)};
}

function dFinder(fg,ox,oy,s,oShape,iShape,fgColor){
  const full=7*s;
  fg.fillStyle=fgColor;
  const dOuter=()=>{if(oShape==='circle'){fg.beginPath();fg.arc(ox+full/2,oy+full/2,full/2,0,Math.PI*2);fg.fill();}else if(oShape==='rounded'){dRR(fg,ox,oy,full,full,full*0.22);fg.fill();}else fg.fillRect(ox,oy,full,full);};
  const punchHole=()=>{fg.globalCompositeOperation='destination-out';fg.fillStyle='rgba(0,0,0,1)';if(oShape==='circle'){fg.beginPath();fg.arc(ox+full/2,oy+full/2,full/2-s,0,Math.PI*2);fg.fill();}else if(oShape==='rounded'){dRR(fg,ox+s,oy+s,5*s,5*s,5*s*0.18);fg.fill();}else fg.fillRect(ox+s,oy+s,5*s,5*s);fg.globalCompositeOperation='source-over';};
  dOuter();punchHole();
  fg.fillStyle=fgColor;
  const ix=ox+2*s,iy=oy+2*s,iw=3*s;
  if(iShape==='circle'){fg.beginPath();fg.arc(ix+iw/2,iy+iw/2,iw/2,0,Math.PI*2);fg.fill();}
  else if(iShape==='rounded'){dRR(fg,ix,iy,iw,iw,iw*0.28);fg.fill();}
  else fg.fillRect(ix,iy,iw,iw);
}

function renderQR(canvas,{matrix,size},opts){
  const{fgColor,fgAlpha,bgColor,bgAlpha,scale,moduleShape,anchorOuterShape,anchorInnerShape}=opts;
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
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    if(fS.has(`${r},${c}`))continue;
    if(matrix[r][c].dark){fg.fillStyle=fgColor;if(CON.has(moduleShape)){const n=gNbr(matrix,size,fS,r,c);dModC(fg,(c+quiet)*scale,(r+quiet)*scale,scale,moduleShape,n);}else dMod(fg,(c+quiet)*scale,(r+quiet)*scale,scale,moduleShape);}
  }
  fO.forEach(({r,c})=>dFinder(fg,(c+quiet)*scale,(r+quiet)*scale,scale,anchorOuterShape,anchorInnerShape,fgColor));
  ctx.globalAlpha=fgAlpha;ctx.drawImage(fgC,0,0);ctx.globalAlpha=1;
  if(opts.logoImg){
    const ls=Math.round(total*(opts.logoRatio||0.22));
    const lx=Math.round((total-ls)/2),ly=Math.round((total-ls)/2),pad=Math.round(ls*0.12);
    ctx.fillStyle=opts.logoBg||'#ffffff';
    if(opts.logoShape==='circle'){ctx.beginPath();ctx.arc(lx+ls/2,ly+ls/2,ls/2+pad,0,Math.PI*2);ctx.fill();}
    else if(opts.logoShape==='rounded'){dRR(ctx,lx-pad,ly-pad,ls+pad*2,ls+pad*2,(ls+pad*2)*0.2);ctx.fill();}
    else ctx.fillRect(lx-pad,ly-pad,ls+pad*2,ls+pad*2);
    if(opts.logoShape==='circle'){ctx.save();ctx.beginPath();ctx.arc(lx+ls/2,ly+ls/2,ls/2,0,Math.PI*2);ctx.clip();ctx.drawImage(opts.logoImg,lx,ly,ls,ls);ctx.restore();}
    else if(opts.logoShape==='rounded'){ctx.save();dRR(ctx,lx,ly,ls,ls,ls*0.18);ctx.clip();ctx.drawImage(opts.logoImg,lx,ly,ls,ls);ctx.restore();}
    else ctx.drawImage(opts.logoImg,lx,ly,ls,ls);
  }
}

function fmtC(hex,a){if(a<=0)return'none';const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);if(a>=1)return `rgb(${r},${g},${b})`;return `rgba(${r},${g},${b},${a.toFixed(3)})`;}
function svgRR(x,y,w,h,r){r=Math.min(r,w/2,h/2);return `M${x+r},${y}L${x+w-r},${y}Q${x+w},${y} ${x+w},${y+r}L${x+w},${y+h-r}Q${x+w},${y+h} ${x+w-r},${y+h}L${x+r},${y+h}Q${x},${y+h} ${x},${y+h-r}L${x},${y+r}Q${x},${y} ${x+r},${y}Z`;}
function svgMod(x,y,s,shape){
  const gap=shape==='circle'?s*0.1:shape==='rounded'?s*0.07:0;
  const xg=x+gap,yg=y+gap,wg=s-gap*2;
  if(shape==='circle')return `<circle cx="${xg+wg/2}" cy="${yg+wg/2}" r="${wg/2}"/>`;
  if(shape==='rounded')return `<path d="${svgRR(xg,yg,wg,wg,wg*0.3)}"/>`;
  if(shape==='diamond'){const cx=x+s/2,cy=y+s/2,r=s*0.48;return `<polygon points="${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}"/>`;}
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}"/>`;
}
function svgModC(x,y,s,shape,n){
  const r=s*0.38;
  const sC=(x,y,w,h,r,{tl=true,tr=true,br=true,bl=true})=>{r=Math.min(r,w/2,h/2);return[`M${x+(tl?r:0)},${y}`,`L${x+w-(tr?r:0)},${y}`,tr?`Q${x+w},${y} ${x+w},${y+r}`:`L${x+w},${y}`,`L${x+w},${y+h-(br?r:0)}`,br?`Q${x+w},${y+h} ${x+w-r},${y+h}`:`L${x+w},${y+h}`,`L${x+(bl?r:0)},${y+h}`,bl?`Q${x},${y+h} ${x},${y+h-r}`:`L${x},${y+h}`,`L${x},${y+(tl?r:0)}`,tl?`Q${x},${y} ${x+r},${y}`:`L${x},${y}`,'Z'].join('');};
  if(shape==='connected-h'){const g=s*0.08;return `<path d="${sC(x,y+g,s,s-g*2,r,{tl:!n.W,tr:!n.E,br:!n.E,bl:!n.W})}"/>`;}
  if(shape==='connected-v'){const g=s*0.08;return `<path d="${sC(x+g,y,s-g*2,s,r,{tl:!n.N,tr:!n.N,br:!n.S,bl:!n.S})}"/>`;}
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
function svgFinder(ox,oy,s,oS,iS){
  const full=7*s,ix=ox+2*s,iy=oy+2*s,iw=3*s;
  let ring='';
  if(oS==='circle')ring=`<path fill-rule="evenodd" d="M${ox+full/2},${oy} a${full/2},${full/2} 0 1,0 0.001,0 Z M${ox+full/2},${oy+s} a${full/2-s},${full/2-s} 0 1,1 -0.001,0 Z"/>`;
  else if(oS==='rounded')ring=`<path fill-rule="evenodd" d="${svgRR(ox,oy,full,full,full*0.22)} ${svgRR(ox+s,oy+s,5*s,5*s,5*s*0.18)}"/>`;
  else ring=`<path fill-rule="evenodd" d="M${ox},${oy}h${full}v${full}h-${full}Z M${ox+s},${oy+s}h${5*s}v${5*s}h-${5*s}Z"/>`;
  let inner='';
  if(iS==='circle')inner=`<circle cx="${ix+iw/2}" cy="${iy+iw/2}" r="${iw/2}"/>`;
  else if(iS==='rounded')inner=`<path d="${svgRR(ix,iy,iw,iw,iw*0.28)}"/>`;
  else inner=`<rect x="${ix}" y="${iy}" width="${iw}" height="${iw}"/>`;
  return ring+inner;
}
function genSVG({matrix,size},opts){
  const{fgColor,fgAlpha,bgColor,bgAlpha,moduleShape,anchorOuterShape,anchorInnerShape}=opts;
  const q=4,t=size+q*2,s=1,fg=fmtC(fgColor,fgAlpha);
  const fO=[{r:0,c:0},{r:0,c:size-7},{r:size-7,c:0}];
  const fS=new Set();fO.forEach(({r,c})=>{for(let dr=0;dr<7;dr++)for(let dc=0;dc<7;dc++)fS.add(`${r+dr},${c+dc}`);});
  const CON=new Set(['connected-h','connected-v','fluid']);
  let dm='';for(let r=0;r<size;r++)for(let c=0;c<size;c++){if(fS.has(`${r},${c}`))continue;if(matrix[r][c].dark){if(CON.has(moduleShape)){const n=gNbr(matrix,size,fS,r,c);dm+=svgModC(c+q,r+q,s,moduleShape,n);}else dm+=svgMod(c+q,r+q,s,moduleShape);}}
  let fe='';fO.forEach(({r,c},i)=>{fe+=svgFinder(c+q,r+q,s,anchorOuterShape,anchorInnerShape);});
  const bgR=bgAlpha>0?`<rect width="${t}" height="${t}" fill="${fmtC(bgColor,bgAlpha)}"/>`:'';
  let lE='';
  if(opts.logoImg&&opts.logoDataUrl){const ls=t*(opts.logoRatio||0.22),lx=(t-ls)/2,ly=(t-ls)/2,pad=ls*0.12,bg=opts.logoBg||'#ffffff';if(opts.logoShape==='circle'){lE=`<circle cx="${lx+ls/2}" cy="${ly+ls/2}" r="${ls/2+pad}" fill="${bg}"/><clipPath id="lc"><circle cx="${lx+ls/2}" cy="${ly+ls/2}" r="${ls/2}"/></clipPath><image href="${opts.logoDataUrl}" x="${lx}" y="${ly}" width="${ls}" height="${ls}" clip-path="url(#lc)" preserveAspectRatio="xMidYMid slice"/>`;}else if(opts.logoShape==='rounded'){const rp=(ls+pad*2)*0.2,ri=ls*0.18;lE=`<rect x="${lx-pad}" y="${ly-pad}" width="${ls+pad*2}" height="${ls+pad*2}" rx="${rp}" fill="${bg}"/><clipPath id="lc"><rect x="${lx}" y="${ly}" width="${ls}" height="${ls}" rx="${ri}"/></clipPath><image href="${opts.logoDataUrl}" x="${lx}" y="${ly}" width="${ls}" height="${ls}" clip-path="url(#lc)" preserveAspectRatio="xMidYMid slice"/>`;}else{lE=`<rect x="${lx-pad}" y="${ly-pad}" width="${ls+pad*2}" height="${ls+pad*2}" fill="${bg}"/><image href="${opts.logoDataUrl}" x="${lx}" y="${ly}" width="${ls}" height="${ls}" preserveAspectRatio="xMidYMid slice"/>`;}}
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges">${bgR}<g fill="${fg}">${dm}${fe}</g>${lE}</svg>`;
}

function getPngUrl(qrData,opts){const c=document.createElement('canvas');renderQR(c,qrData,{...opts,scale:opts.scale*2});return c.toDataURL('image/png');}
function getSvgUrls(qrData,opts){
  const svg=genSVG(qrData,opts);
  const b64=btoa(unescape(encodeURIComponent(svg)));
  const pU='data:image/svg+xml;base64,'+b64;
  const blob=new Blob([svg],{type:'image/svg+xml'});
  return{previewUrl:pU,downloadUrl:URL.createObjectURL(blob)};
}

// ── Themes ────────────────────────────────────────────────────────────────────
const TH={
  dark:{bg:'#0f1117',surf:'#111827',surf2:'#1f2937',brd:'#1f2937',brd2:'#374151',txt:'#e5e7eb',txtM:'#9ca3af',txtF:'#6b7280',txtD:'#4b5563',acc:'#3b82f6',accBg:'#1e3a5f',accTxt:'#93c5fd',accDim:'#60a5fa',dan:'#f87171',warn:'#d97706',ok:'#4ade80',okBg:'#052e16',okBdr:'#166534',inp:'#111827',chk1:'#374151',chk2:'#1f2937'},
  light:{bg:'#f3f4f6',surf:'#ffffff',surf2:'#f9fafb',brd:'#e5e7eb',brd2:'#d1d5db',txt:'#111827',txtM:'#374151',txtF:'#6b7280',txtD:'#9ca3af',acc:'#2563eb',accBg:'#eff6ff',accTxt:'#1d4ed8',accDim:'#3b82f6',dan:'#dc2626',warn:'#b45309',ok:'#16a34a',okBg:'#f0fdf4',okBdr:'#86efac',inp:'#ffffff',chk1:'#d1d5db',chk2:'#e5e7eb'},
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic={
  Link:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Mail:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Phone:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.55 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.46 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Wifi:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>,
  Txt:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>,
  Dl:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Cp:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Ok:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Pal:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.47-1.125-.29-.289-.47-.687-.47-1.125a1.64 1.64 0 0 1 1.648-1.688h1.96c3.083 0 5.684-2.583 5.684-5.688C22 6.075 17.523 2 12 2z"/></svg>,
  Sl:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  Gr:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  QR:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>,
  Msg:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Glo:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Lk:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Eye:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeX:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  At:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>,
  Img:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Trash:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  Up:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  ChD:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  ChU:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  Sh:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  Sun:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Mon:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
};

// ── Shape data ────────────────────────────────────────────────────────────────
const SL={square:'Square',rounded:'Rounded',circle:'Circle',diamond:'Diamond','connected-h':'H-linked','connected-v':'V-linked',fluid:'Fluid'};
const MS=['square','rounded','circle','diamond','connected-h','connected-v','fluid'];
const AS=['square','rounded','circle'];
const SP={
  square:<rect x="3" y="3" width="18" height="18" fill="currentColor"/>,
  rounded:<rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor"/>,
  circle:<circle cx="12" cy="12" r="9" fill="currentColor"/>,
  diamond:<polygon points="12,3 21,12 12,21 3,12" fill="currentColor"/>,
  'connected-h':<g fill="currentColor"><rect x="2" y="8" width="20" height="8" rx="2"/></g>,
  'connected-v':<g fill="currentColor"><rect x="8" y="2" width="8" height="20" rx="2"/></g>,
  fluid:<path d="M8,3 L16,3 Q21,3 21,8 L21,16 Q21,21 16,21 L8,21 Q3,21 3,16 L3,8 Q3,3 8,3 Z" fill="currentColor"/>,
};
const FOP={
  square:<path fillRule="evenodd" d="M2,2h20v20H2Z M5,5h14v14H5Z" fill="currentColor"/>,
  rounded:<path fillRule="evenodd" d="M6,2h12a4,4 0 0 1 4,4v12a4,4 0 0 1-4,4H6a4,4 0 0 1-4,-4V6a4,4 0 0 1 4,-4Z M8,5h8a3,3 0 0 1 3,3v8a3,3 0 0 1-3,3H8a3,3 0 0 1-3,-3V8a3,3 0 0 1 3,-3Z" fill="currentColor"/>,
  circle:<path fillRule="evenodd" d="M12,2a10,10 0 1,0 0.001,0Z M12,5a7,7 0 1,1-0.001,0Z" fill="currentColor"/>,
};
const FIP={
  square:<rect x="6" y="6" width="12" height="12" fill="currentColor"/>,
  rounded:<rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor"/>,
  circle:<circle cx="12" cy="12" r="6" fill="currentColor"/>,
};

const PT=[{id:'url',label:'URL',icon:'Link'},{id:'email',label:'Email',icon:'Mail'},{id:'phone',label:'Phone',icon:'Phone'},{id:'wifi',label:'WiFi',icon:'Wifi'},{id:'sms',label:'SMS',icon:'Msg'},{id:'text',label:'Text',icon:'Txt'}];
const TD={url:'https://www.example.com',email:'mailto:',phone:'tel:',sms:'sms:',wifi:'WIFI:T:WPA;S:;P:;H:false;;',text:''};

// ── Forms ─────────────────────────────────────────────────────────────────────
const fs=()=>({width:'100%',background:'var(--inp)',color:'var(--txt)',border:'1.5px solid var(--brd)',borderRadius:8,padding:'8px 11px',fontSize:12.5,outline:'none',transition:'border-color .15s',fontFamily:'inherit'});
function Fld({label,icon:I,children,hint}){return <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'var(--txtF)',fontWeight:500,display:'block',marginBottom:2}}>{I&&<span style={{display:'inline-flex',verticalAlign:'middle',marginRight:5,opacity:.7}}><I/></span>}{label}</label>{children}{hint&&<span style={{fontSize:10.5,color:'var(--txtD)'}}>{hint}</span>}</div>;}
function TI({value,onChange,placeholder,type='text',prefix,...r}){const s=fs();if(prefix)return <div style={{display:'flex',alignItems:'center',background:'var(--inp)',border:'1.5px solid var(--brd)',borderRadius:8,overflow:'hidden'}} onFocusCapture={e=>e.currentTarget.style.borderColor='var(--acc)'} onBlurCapture={e=>e.currentTarget.style.borderColor='var(--brd)'}><span style={{padding:'8px 10px',background:'var(--surf2)',color:'var(--txtD)',fontSize:12,fontFamily:'monospace',whiteSpace:'nowrap',borderRight:'1.5px solid var(--brd)',flexShrink:0}}>{prefix}</span><input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{...s,border:'none',borderRadius:0,flex:1,minWidth:0}} {...r}/></div>;return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={s} onFocus={e=>e.target.style.borderColor='var(--acc)'} onBlur={e=>e.target.style.borderColor='var(--brd)'} {...r}/>;}
function Sel({value,onChange,children}){return <select value={value} onChange={e=>onChange(e.target.value)} style={{...fs(),cursor:'pointer',appearance:'none',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center',paddingRight:28}}>{children}</select>;}
const ta=s=>({...fs(),resize:'vertical',lineHeight:1.5});

function UrlForm({value,onChange}){const raw=value.replace(/^https?:\/\//,'');const isH=!value.startsWith('http://');return<div style={{display:'flex',flexDirection:'column',gap:10}}><Fld label="URL" icon={Ic.Glo}><div style={{display:'flex',alignItems:'center',background:'var(--inp)',border:'1.5px solid var(--brd)',borderRadius:8,overflow:'hidden'}} onFocusCapture={e=>e.currentTarget.style.borderColor='var(--acc)'} onBlurCapture={e=>e.currentTarget.style.borderColor='var(--brd)'}><button onClick={()=>onChange((isH?'http://':'https://')+raw)} style={{padding:'8px 10px',background:'var(--surf2)',color:'var(--txtD)',fontSize:11.5,fontFamily:'monospace',border:'none',borderRight:'1.5px solid var(--brd)',cursor:'pointer',flexShrink:0,whiteSpace:'nowrap',outline:'none'}}>{isH?'https://':'http://'}</button><input type="text" value={raw} onChange={e=>onChange((isH?'https://':'http://')+e.target.value)} onBlur={e=>{const v=e.target.value;if(v&&!v.startsWith('http'))onChange('https://'+v);}} placeholder="www.example.com" style={{...fs(),border:'none',borderRadius:0,flex:1,minWidth:0}}/></div></Fld></div>;}

function EmailForm({value,onChange}){const parse=v=>{const m=v.match(/^mailto:([^?]*)(\?(.*))?$/);if(!m)return{addr:'',sub:'',body:''};const p=new URLSearchParams(m[3]||'');return{addr:m[1],sub:p.get('subject')||'',body:p.get('body')||''};};const build=(a,s,b)=>{const p=new URLSearchParams();if(s)p.set('subject',s);if(b)p.set('body',b);const q=p.toString();return'mailto:'+a+(q?'?'+q:'');};const{addr,sub,body}=parse(value);return<div style={{display:'flex',flexDirection:'column',gap:10}}><Fld label="Email address" icon={Ic.At}><TI prefix="mailto:" value={addr} onChange={e=>onChange(build(e.target.value,sub,body))} placeholder="name@example.com" type="email"/></Fld><Fld label="Subject" hint="Optional"><TI value={sub} onChange={e=>onChange(build(addr,e.target.value,body))} placeholder="Hello there"/></Fld><Fld label="Body" hint="Optional"><textarea value={body} onChange={e=>onChange(build(addr,sub,e.target.value))} rows={3} style={ta()} onFocus={e=>e.target.style.borderColor='var(--acc)'} onBlur={e=>e.target.style.borderColor='var(--brd)'} placeholder="Your message..."/></Fld></div>;}

function PhoneForm({value,onChange}){const n=value.replace(/^tel:/,'');return<div><Fld label="Phone number" icon={Ic.Phone}><TI prefix="tel:" value={n} onChange={e=>onChange('tel:'+e.target.value)} placeholder="+31612345678" type="tel"/></Fld></div>;}

function SmsForm({value,onChange}){const parse=v=>{const b=v.replace(/^(sms:|smsto:)/,'');const[n,r]=b.split('?');const p=new URLSearchParams(r||'');return{n,body:p.get('body')||''};};const build=(n,b)=>'sms:'+n+(b?'?body='+encodeURIComponent(b):'');const{n,body}=parse(value.startsWith('sms')?value:'sms:');return<div style={{display:'flex',flexDirection:'column',gap:10}}><Fld label="Phone number" icon={Ic.Phone}><TI prefix="sms:" value={n} onChange={e=>onChange(build(e.target.value,body))} placeholder="+31612345678" type="tel"/></Fld><Fld label="Pre-filled message" hint="Optional"><textarea value={body} onChange={e=>onChange(build(n,e.target.value))} rows={2} style={ta()} onFocus={e=>e.target.style.borderColor='var(--acc)'} onBlur={e=>e.target.style.borderColor='var(--brd)'} placeholder="Your message..."/></Fld></div>;}

function WifiForm({onChange}){
  const[ssid,setSsid]=useState('');const[pass,setPass]=useState('');const[sec,setSec]=useState('WPA');const[hidden,setHidden]=useState(false);const[show,setShow]=useState(false);
  const esc=v=>v.replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/"/g,'\\"');
  const emit=(t,s,p,h)=>{let str='WIFI:S:'+esc(s)+';T:'+t+';P:'+esc(p)+';';if(h)str+='H:true;';str+=';;';onChange(str);};
  useEffect(()=>emit(sec,ssid,pass,hidden),[]);
  const hS=v=>{setSsid(v);emit(sec,v,pass,hidden);};const hP=v=>{setPass(v);emit(sec,ssid,v,hidden);};const hT=v=>{setSec(v);emit(v,ssid,pass,hidden);};const hH=v=>{setHidden(v);emit(sec,ssid,pass,v);};
  return<div style={{display:'flex',flexDirection:'column',gap:10}}><Fld label="Network name (SSID)" icon={Ic.Wifi}><TI value={ssid} onChange={e=>hS(e.target.value)} placeholder="My Network"/></Fld><Fld label="Security type"><Sel value={sec} onChange={hT}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">None (open)</option></Sel></Fld>{sec!=='nopass'&&<Fld label="Password" icon={Ic.Lk}><div style={{display:'flex',alignItems:'center',background:'var(--inp)',border:'1.5px solid var(--brd)',borderRadius:8,overflow:'hidden'}} onFocusCapture={e=>e.currentTarget.style.borderColor='var(--acc)'} onBlurCapture={e=>e.currentTarget.style.borderColor='var(--brd)'}><input type={show?'text':'password'} value={pass} onChange={e=>hP(e.target.value)} placeholder="Password" style={{...fs(),border:'none',borderRadius:0,flex:1,minWidth:0}}/><button onClick={()=>setShow(x=>!x)} style={{padding:'0 10px',background:'none',border:'none',color:'var(--txtD)',cursor:'pointer',display:'flex',alignItems:'center'}}>{show?<Ic.EyeX/>:<Ic.Eye/>}</button></div></Fld>}<label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:'var(--txtM)'}}><input type="checkbox" checked={hidden} onChange={e=>hH(e.target.checked)} style={{width:14,height:14,accentColor:'var(--acc)'}}/>Hidden network</label></div>;
}

function TxtForm({value,onChange}){return<div style={{display:'flex',flexDirection:'column',gap:10}}><Fld label="Text content" icon={Ic.Txt}><textarea value={value} onChange={e=>onChange(e.target.value)} rows={4} style={{...ta(),lineHeight:1.6}} placeholder="Enter any text..." onFocus={e=>e.target.style.borderColor='var(--acc)'} onBlur={e=>e.target.style.borderColor='var(--brd)'}/></Fld><div style={{display:'flex',justifyContent:'flex-end'}}><span style={{fontSize:10.5,fontFamily:'monospace',color:value.length>270?'var(--dan)':'var(--txtD)'}}>{value.length}/300</span></div></div>;}

function CForm({type,value,onChange}){if(type==='url')return<UrlForm value={value} onChange={onChange}/>;if(type==='email')return<EmailForm value={value} onChange={onChange}/>;if(type==='phone')return<PhoneForm value={value} onChange={onChange}/>;if(type==='sms')return<SmsForm value={value} onChange={onChange}/>;if(type==='wifi')return<WifiForm onChange={onChange}/>;return<TxtForm value={value} onChange={onChange}/>;}

// ── Sub-components ────────────────────────────────────────────────────────────
function SecHdr({icon:I,children}){return<div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}><span style={{color:'var(--txtF)',display:'flex'}}><I/></span><span style={{fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--txtF)'}}>{children}</span></div>;}

function ShPick({label,shapes,previewMap,value,onChange}){
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

function ClrRow({label,color,alpha,onColor,onAlpha}){return<div style={{display:'flex',flexDirection:'column',gap:6}}><div style={{fontSize:11,color:'var(--txtM)',fontWeight:500}}>{label}</div><div style={{display:'flex',gap:8,alignItems:'center'}}><label style={{cursor:'pointer',flexShrink:0,position:'relative'}}><div style={{width:34,height:34,borderRadius:7,overflow:'hidden',border:'1.5px solid var(--brd2)',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='4' height='4' fill='%23888'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%23888'/%3E%3Crect x='4' width='4' height='4' fill='%23bbb'/%3E%3Crect y='4' width='4' height='4' fill='%23bbb'/%3E%3C/svg%3E")`}}><div style={{width:'100%',height:'100%',background:h2r(color,alpha)}}/></div><input type="color" value={color} onChange={e=>onColor(e.target.value)} style={{position:'absolute',opacity:0,width:0,height:0,pointerEvents:'none'}}/></label><input type="text" value={color} onChange={e=>{if(/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))onColor(e.target.value);}} style={{flex:1,background:'var(--inp)',border:'1.5px solid var(--brd)',borderRadius:6,padding:'5px 8px',color:'var(--txt)',fontSize:12,fontFamily:'monospace',outline:'none',minWidth:0}}/><div style={{display:'flex',flexDirection:'column',gap:3,width:86,flexShrink:0}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:10,color:'var(--txtF)'}}>opacity</span><span style={{fontSize:10,color:'var(--txtM)',fontFamily:'monospace'}}>{Math.round(alpha*100)}%</span></div><input type="range" min={0} max={1} step={0.01} value={alpha} onChange={e=>onAlpha(+e.target.value)} style={{width:'100%'}}/></div></div></div>;}

function DlModal({type,dataUrl,downloadUrl,onClose,onCloseExtra}){
  const isPng=type==='png',fn=isPng?'qrcode.png':'qrcode.svg';
  const close=()=>{onClose();onCloseExtra?.();};
  useEffect(()=>{try{const a=document.createElement('a');a.href=downloadUrl||dataUrl;a.download=fn;document.body.appendChild(a);a.click();document.body.removeChild(a);}catch{}},[]);
  return<div onClick={close} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:24}}><div onClick={e=>e.stopPropagation()} style={{background:'var(--surf)',border:'1px solid var(--brd2)',borderRadius:16,padding:24,maxWidth:420,width:'100%',display:'flex',flexDirection:'column',gap:16}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontWeight:600,fontSize:15,color:'var(--txt)'}}>Save {fn}</span><button onClick={close} style={{background:'none',border:'none',color:'var(--txtM)',cursor:'pointer',fontSize:20,lineHeight:1,padding:'0 4px'}}>×</button></div><div style={{background:'var(--surf2)',borderRadius:10,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',padding:12,minHeight:120}}><img src={dataUrl} alt="QR" style={{maxWidth:'100%',maxHeight:280,display:'block',imageRendering:isPng?'pixelated':'auto'}}/></div><div style={{background:'var(--surf2)',borderRadius:8,padding:'10px 14px'}}><p style={{margin:'0 0 6px',fontSize:12,color:'var(--txtM)',fontWeight:600}}>How to save:</p><p style={{margin:0,fontSize:12,color:'var(--txtF)',lineHeight:1.6}}><strong style={{color:'var(--txtM)'}}>Desktop:</strong> Right-click the image → "Save image as…"<br/><strong style={{color:'var(--txtM)'}}>Mobile:</strong> Long-press the image → "Save to Photos"</p></div><a href={downloadUrl||dataUrl} download={fn} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 0',background:'var(--acc)',color:'white',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>↓ Try direct download</a></div></div>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
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

  const totalPx=qrData?(qrData.size+8)*scale:null;

  // CSS custom properties
  const vars=`--bg:${T.bg};--surf:${T.surf};--surf2:${T.surf2};--brd:${T.brd};--brd2:${T.brd2};--txt:${T.txt};--txtM:${T.txtM};--txtF:${T.txtF};--txtD:${T.txtD};--acc:${T.acc};--accBg:${T.accBg};--accTxt:${T.accTxt};--accDim:${T.accDim};--dan:${T.dan};--warn:${T.warn};--ok:${T.ok};--okBg:${T.okBg};--okBdr:${T.okBdr};--inp:${T.inp};`;
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
          </div>
          <p style={{fontSize:11,color:'var(--txtD)',margin:0,textAlign:'center'}}>PNG exports at 2× resolution.</p>
        </div>
      </div>
      {modal&&<DlModal type={modal.type} dataUrl={modal.dataUrl} downloadUrl={modal.downloadUrl} onClose={()=>setModal(null)} onCloseExtra={modal.onCloseExtra}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
