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

export function generateMatrix(text,ecLevel='L'){
  const qr=qrcodeGenerator(0,ecLevel);qr.addData(text);qr.make();
  const size=qr.getModuleCount();
  const fC=new Set();
  for(let r=0;r<=8;r++)for(let c=0;c<=8;c++)fC.add(`${r},${c}`);
  for(let r=0;r<=8;r++)for(let c=size-8;c<size;c++)fC.add(`${r},${c}`);
  for(let r=size-8;r<size;r++)for(let c=0;c<=8;c++)fC.add(`${r},${c}`);
  const matrix=Array.from({length:size},(_,r)=>Array.from({length:size},(__,c)=>({dark:qr.isDark(r,c)?1:0,finder:fC.has(`${r},${c}`)})));
  return{matrix,size};
}
