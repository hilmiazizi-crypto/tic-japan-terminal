// Candlestick + chart pattern detection (heuristic)
function swings(h,l,w=3){const H=[],L=[];for(let i=w;i<h.length-w;i++){let isH=true,isL=true;for(let j=i-w;j<=i+w;j++){if(h[j]>h[i])isH=false;if(l[j]<l[i])isL=false}if(isH)H.push({i,v:h[i]});if(isL)L.push({i,v:l[i]})}return{H,L}}
function reg(pts){const n=pts.length,mx=pts.reduce((a,p)=>a+p.i,0)/n,my=pts.reduce((a,p)=>a+p.v,0)/n;let num=0,den=0;pts.forEach(p=>{num+=(p.i-mx)*(p.v-my);den+=(p.i-mx)**2});const m=den?num/den:0;return{m,b:my-m*mx,at:i=>my+m*(i-mx)}}
function detect(cd,atr,sr){const o=cd.map(x=>x.open),h=cd.map(x=>x.high),l=cd.map(x=>x.low),c=cd.map(x=>x.close),T=cd.map(x=>x.time),n=c.length,out=[],lines=[];
 const P=(name,type,bias,conf,i,extra={})=>out.push({name,type,bias,confidence:Math.round(Math.min(95,conf)),time:T[i],barsAgo:n-1-i,...extra});
 const body=i=>Math.abs(c[i]-o[i]),rng=i=>h[i]-l[i]||1e-9,up=i=>h[i]-Math.max(o[i],c[i]),dn=i=>Math.min(o[i],c[i])-l[i],bull=i=>c[i]>o[i];
 const trendBefore=i=>{const k=Math.max(0,i-10);return(c[i-1]-c[k])/atr};
 for(let i=Math.max(2,n-5);i<n;i++){const tb=trendBefore(i);
  if(body(i)<=0.1*rng(i)&&rng(i)>0.3*atr)P('Doji','candle','neutral',55,i,{note:'Indecision'});
  if(dn(i)>=2*body(i)&&up(i)<=0.3*rng(i)&&rng(i)>0.5*atr){if(tb<-1)P('Hammer','candle','bullish',65,i,{note:'Rejection of lows after decline'});else if(tb>1)P('Hanging Man','candle','bearish',55,i);else P('Bullish Pin Bar','candle','bullish',55,i)}
  if(up(i)>=2*body(i)&&dn(i)<=0.3*rng(i)&&rng(i)>0.5*atr){if(tb>1)P('Shooting Star','candle','bearish',65,i,{note:'Rejection of highs after rally'});else if(tb<-1)P('Inverted Hammer','candle','bullish',55,i);else P('Bearish Pin Bar','candle','bearish',55,i)}
  if(bull(i)&&!bull(i-1)&&c[i]>=o[i-1]&&o[i]<=c[i-1]&&body(i)>body(i-1))P('Bullish Engulfing','candle','bullish',tb<0?70:58,i);
  if(!bull(i)&&bull(i-1)&&c[i]<=o[i-1]&&o[i]>=c[i-1]&&body(i)>body(i-1))P('Bearish Engulfing','candle','bearish',tb>0?70:58,i);
  if(!bull(i-2)&&body(i-2)>0.6*atr&&body(i-1)<0.3*body(i-2)&&bull(i)&&c[i]>(o[i-2]+c[i-2])/2)P('Morning Star','candle','bullish',72,i);
  if(bull(i-2)&&body(i-2)>0.6*atr&&body(i-1)<0.3*body(i-2)&&!bull(i)&&c[i]<(o[i-2]+c[i-2])/2)P('Evening Star','candle','bearish',72,i)}
 const st=Math.max(0,n-120),{H,L}=swings(h.slice(st),l.slice(st));H.forEach(p=>p.i+=st);L.forEach(p=>p.i+=st);const tol=0.8*atr,px=c[n-1];
 const ln=(a,b,color,label)=>lines.push({from:{time:T[a.i],value:a.v},to:{time:T[b.i],value:b.v},color,label});
 // Double top/bottom
 if(H.length>=2){const[a,b]=H.slice(-2);if(Math.abs(a.v-b.v)<=tol&&b.i-a.i>=5){const neck=Math.min(...l.slice(a.i,b.i+1)),brk=px<neck;P('Double Top','chart','bearish',brk?78:58,b.i,{note:brk?'Neckline broken '+neck.toFixed(2):'Neckline '+neck.toFixed(2),level:neck});ln(a,b,'#ef4444','Double Top')}}
 if(L.length>=2){const[a,b]=L.slice(-2);if(Math.abs(a.v-b.v)<=tol&&b.i-a.i>=5){const neck=Math.max(...h.slice(a.i,b.i+1)),brk=px>neck;P('Double Bottom','chart','bullish',brk?78:58,b.i,{note:brk?'Neckline broken '+neck.toFixed(2):'Neckline '+neck.toFixed(2),level:neck});ln(a,b,'#22c55e','Double Bottom')}}
 // Head & shoulders
 if(H.length>=3){const[a,b,d]=H.slice(-3);if(b.v>a.v+tol*0.5&&b.v>d.v+tol*0.5&&Math.abs(a.v-d.v)<=1.5*tol){const neck=Math.min(...l.slice(a.i,d.i+1));P('Head & Shoulders','chart','bearish',px<neck?80:60,d.i,{level:neck,note:'Neckline '+neck.toFixed(2)});ln(a,b,'#ef4444','H&S');ln(b,d,'#ef4444','')}}
 if(L.length>=3){const[a,b,d]=L.slice(-3);if(b.v<a.v-tol*0.5&&b.v<d.v-tol*0.5&&Math.abs(a.v-d.v)<=1.5*tol){const neck=Math.max(...h.slice(a.i,d.i+1));P('Inverse Head & Shoulders','chart','bullish',px>neck?80:60,d.i,{level:neck,note:'Neckline '+neck.toFixed(2)});ln(a,b,'#22c55e','Inv H&S');ln(b,d,'#22c55e','')}}
 // Triangles / wedges / channels from last swing points
 const hs=H.slice(-3),ls=L.slice(-3);
 if(hs.length>=2&&ls.length>=2){const rh=reg(hs),rl=reg(ls),flat=0.03*atr,sH=rh.m,sL=rl.m,i0=Math.min(hs[0].i,ls[0].i),w0=rh.at(i0)-rl.at(i0),w1=rh.at(n-1)-rl.at(n-1),conv=w1<w0*0.8,par=Math.abs(w1-w0)<=w0*0.2;
  let name=null,bias='neutral',conf=55;
  if(Math.abs(sH)<=flat&&sL>flat&&conv){name='Ascending Triangle';bias='bullish';conf=62}
  else if(Math.abs(sL)<=flat&&sH<-flat&&conv){name='Descending Triangle';bias='bearish';conf=62}
  else if(sH<-flat&&sL>flat){name='Symmetrical Triangle';bias='neutral';conf=55}
  else if(sH>flat&&sL>flat&&conv){name='Rising Wedge';bias='bearish';conf=60}
  else if(sH<-flat&&sL<-flat&&conv){name='Falling Wedge';bias='bullish';conf=60}
  else if(par&&sH>flat&&sL>flat){name='Ascending Channel';bias='bullish';conf=55}
  else if(par&&sH<-flat&&sL<-flat){name='Descending Channel';bias='bearish';conf=55}
  else if(par&&Math.abs(sH)<=flat&&Math.abs(sL)<=flat){name='Horizontal Channel (Range)';bias='neutral';conf=55}
  if(name){const up=rh.at(n-1),lo=rl.at(n-1);let note=`Upper ${up.toFixed(2)} / Lower ${lo.toFixed(2)}`;if(px>up){note='Breakout UP · '+note;bias='bullish';conf+=12}else if(px<lo){note='Breakdown · '+note;bias='bearish';conf+=12}
   P(name,'chart',bias,conf,n-1,{note});lines.push({from:{time:T[i0],value:rh.at(i0)},to:{time:T[n-1],value:up},color:'#ffb000',label:name});lines.push({from:{time:T[i0],value:rl.at(i0)},to:{time:T[n-1],value:lo},color:'#ffb000',label:''})}}
 // Flag / pennant: strong pole then tight consolidation
 if(n>30){const cs=8,pe=n-1-cs,ps=pe-10,pole=c[pe]-c[ps],ch=Math.max(...h.slice(pe+1)),cl=Math.min(...l.slice(pe+1)),cr=ch-cl;
  if(Math.abs(pole)>4*atr&&cr<0.5*Math.abs(pole)){const bull=pole>0,rs=reg(c.slice(pe+1).map((v,k)=>({i:k,v}))).m,pen=Math.abs(rs)<0.05*atr;P((bull?'Bull ':'Bear ')+(pen?'Pennant':'Flag'),'chart',bull?'bullish':'bearish',60,n-1,{note:`Pole ${pole.toFixed(2)}, range ${cr.toFixed(2)}`})}}
 // S/R breakouts in last 3 bars
 for(const r of sr.resistance.concat(sr.support)){for(let i=Math.max(1,n-3);i<n;i++){if(c[i-1]<r.price&&c[i]>r.price+0.2*atr){P('Breakout above '+r.price.toFixed(2),'breakout','bullish',55+5*Math.min(r.touches,4),i,{level:r.price});break}if(c[i-1]>r.price&&c[i]<r.price-0.2*atr){P('Breakdown below '+r.price.toFixed(2),'breakout','bearish',55+5*Math.min(r.touches,4),i,{level:r.price});break}}}
 const markers=out.filter(p=>p.type!=='breakout').map(p=>({time:p.time,position:p.bias==='bearish'?'aboveBar':'belowBar',color:p.bias==='bullish'?'#22c55e':p.bias==='bearish'?'#ef4444':'#ffb000',shape:p.bias==='bullish'?'arrowUp':p.bias==='bearish'?'arrowDown':'circle',text:p.name}));
 const bs=out.reduce((a,p)=>a+(p.bias==='bullish'?p.confidence:p.bias==='bearish'?-p.confidence:0),0);
 return{list:out.sort((a,b)=>a.barsAgo-b.barsAgo||b.confidence-a.confidence),lines,markers,signal:bs>40?'BUY':bs<-40?'SELL':'NEUTRAL',score:bs}}
module.exports={detect};
