// Technical analysis computations (pure functions over OHLC arrays)
const sma=(a,n)=>a.map((_,i)=>i<n-1?null:a.slice(i-n+1,i+1).reduce((x,y)=>x+y,0)/n);
function ema(a,n){const k=2/(n+1),o=[];let p=null;a.forEach((v,i)=>{if(i<n-1){o.push(null);return}if(p===null)p=a.slice(0,n).reduce((x,y)=>x+y,0)/n;else p=v*k+p*(1-k);o.push(p)});return o}
function wilder(a,n){const o=[];let p=null;a.forEach((v,i)=>{if(i<n-1){o.push(null);return}if(p===null)p=a.slice(i-n+1,i+1).reduce((x,y)=>x+y,0)/n;else p=(p*(n-1)+v)/n;o.push(p)});return o}
function rsi(c,n=14){const g=[],l=[];for(let i=1;i<c.length;i++){const d=c[i]-c[i-1];g.push(Math.max(d,0));l.push(Math.max(-d,0))}const ag=wilder(g,n),al=wilder(l,n);return [null,...ag.map((x,i)=>x==null?null:al[i]===0?100:100-100/(1+x/al[i]))]}
function macd(c){const f=ema(c,12),s=ema(c,26),m=c.map((_,i)=>f[i]!=null&&s[i]!=null?f[i]-s[i]:null);const st=m.findIndex(x=>x!=null);const sig=[...Array(st).fill(null),...ema(m.slice(st),9)];return{macd:m,signal:sig,hist:m.map((x,i)=>x!=null&&sig[i]!=null?x-sig[i]:null)}}
function stoch(h,l,c,n=14,d=3){const k=c.map((v,i)=>{if(i<n-1)return null;const hh=Math.max(...h.slice(i-n+1,i+1)),ll=Math.min(...l.slice(i-n+1,i+1));return hh===ll?50:(v-ll)/(hh-ll)*100});const st=k.findIndex(x=>x!=null);return{k,d:[...Array(st).fill(null),...sma(k.slice(st),d)]}}
function trs(h,l,c){return c.map((_,i)=>i===0?h[0]-l[0]:Math.max(h[i]-l[i],Math.abs(h[i]-c[i-1]),Math.abs(l[i]-c[i-1])))}
function adx(h,l,c,n=14){const tr=trs(h,l,c).slice(1),pdm=[],mdm=[];for(let i=1;i<c.length;i++){const u=h[i]-h[i-1],d=l[i-1]-l[i];pdm.push(u>d&&u>0?u:0);mdm.push(d>u&&d>0?d:0)}const atr=wilder(tr,n),p=wilder(pdm,n),m=wilder(mdm,n);const pdi=atr.map((a,i)=>a?100*p[i]/a:null),mdi=atr.map((a,i)=>a?100*m[i]/a:null);const dx=pdi.map((x,i)=>x==null?null:(x+mdi[i])===0?0:100*Math.abs(x-mdi[i])/(x+mdi[i]));const st=dx.findIndex(x=>x!=null);const ad=[...Array(st).fill(null),...wilder(dx.slice(st),n)];return{adx:ad.at(-1),pdi:pdi.at(-1),mdi:mdi.at(-1)}}
function bb(c,n=20,k=2){const m=sma(c,n);const i=c.length-1;const s=c.slice(-n),mu=m[i],sd=Math.sqrt(s.reduce((a,v)=>a+(v-mu)**2,0)/n);return{mid:mu,upper:mu+k*sd,lower:mu-k*sd}}
function srLevels(h,l,c,atr){const piv=[],w=3;for(let i=w;i<c.length-w;i++){const hs=h.slice(i-w,i+w+1),ls=l.slice(i-w,i+w+1);if(h[i]===Math.max(...hs))piv.push(h[i]);if(l[i]===Math.min(...ls))piv.push(l[i])}piv.sort((a,b)=>a-b);const cl=[];const tol=atr*0.6;for(const p of piv){const g=cl.at(-1);if(g&&p-g.max<=tol){g.v.push(p);g.max=p}else cl.push({v:[p],max:p})}const lv=cl.map(g=>({price:g.v.reduce((a,b)=>a+b,0)/g.v.length,touches:g.v.length})).filter(x=>x.touches>=2);const px=c.at(-1);return{support:lv.filter(x=>x.price<px).sort((a,b)=>b.price-a.price).slice(0,3),resistance:lv.filter(x=>x.price>px).sort((a,b)=>a.price-b.price).slice(0,3)}}
const S=(s)=>s;// 'BUY'|'SELL'|'NEUTRAL'
function analyze(cd){const o=cd.map(x=>x.open),h=cd.map(x=>x.high),l=cd.map(x=>x.low),c=cd.map(x=>x.close),px=c.at(-1),n=c.length;
 const R=rsi(c).at(-1),M=macd(c),Mv=M.macd.at(-1),Ms=M.signal.at(-1),Mh=M.hist.at(-1),St=stoch(h,l,c),K=St.k.at(-1),D=St.d.at(-1);
 const A=wilder(trs(h,l,c),14).at(-1),X=adx(h,l,c),B=bb(c);
 const ind=[];const add=(name,value,signal,note='')=>ind.push({name,value,signal,note});
 add('RSI (14)',R,R==null?'NEUTRAL':R<30?'BUY':R>70?'SELL':R>50?'BUY':R<50?'SELL':'NEUTRAL',R<30?'Oversold':R>70?'Overbought':'');
 add('MACD (12,26,9)',Mv,Mv==null?'NEUTRAL':Mv>Ms?'BUY':'SELL',Mh!=null?'Hist '+Mh.toFixed(4):'');
 add('Stochastic %K (14,3)',K,K==null?'NEUTRAL':K<20&&K>D?'BUY':K>80&&K<D?'SELL':K>D?'BUY':K<D?'SELL':'NEUTRAL',K<20?'Oversold':K>80?'Overbought':'');
 for(const p of [10,20,50,100,200]){const v=ema(c,p).at(-1);add(`EMA (${p})`,v,v==null?'NEUTRAL':px>v?'BUY':'SELL')}
 for(const p of [20,50,200]){const v=sma(c,p).at(-1);add(`SMA (${p})`,v,v==null?'NEUTRAL':px>v?'BUY':'SELL')}
 add('Bollinger (20,2)',B.mid,px<B.lower?'BUY':px>B.upper?'SELL':'NEUTRAL',`U ${B.upper.toFixed(2)} / L ${B.lower.toFixed(2)}`);
 add('ADX (14)',X.adx,X.adx==null||X.adx<20?'NEUTRAL':X.pdi>X.mdi?'BUY':'SELL',X.adx>=25?'Trending':'Weak trend');
 add('ATR (14)',A,'NEUTRAL',`Volatility ${(A/px*100).toFixed(2)}%`);
 const _sr=srLevels(h.slice(-150),l.slice(-150),c.slice(-150),A);const pat=require('./patterns').detect(cd,A,_sr);add('Patterns ('+pat.list.length+')',pat.list.length,pat.signal,pat.list.slice(0,2).map(p=>p.name).join(', ')||'None');
 const cnt={BUY:0,SELL:0,NEUTRAL:0};ind.forEach(i=>{if(i.value!=null)cnt[i.signal]++});const tot=cnt.BUY+cnt.SELL+cnt.NEUTRAL,score=tot?(cnt.BUY-cnt.SELL)/tot:0;
 const summary=score>=0.5?'STRONG BUY':score>=0.1?'BUY':score<=-0.5?'STRONG SELL':score<=-0.1?'SELL':'NEUTRAL';
 const e50=ema(c,50).at(-1),e200=ema(c,200).at(-1),e20=ema(c,20).at(-1);
 const trend=e50==null?'N/A':px>e50&&(e200==null||e50>e200)&&e20>e50?'UPTREND':px<e50&&(e200==null||e50<e200)&&e20<e50?'DOWNTREND':'SIDEWAYS';
 const ph=h.at(-2),pl=l.at(-2),pc=c.at(-2),P=(ph+pl+pc)/3;const pivots={R3:ph+2*(P-pl),R2:P+(ph-pl),R1:2*P-pl,P,S1:2*P-ph,S2:P-(ph-pl),S3:pl-2*(ph-P)};
 const ov={ema20:ema(c,20),ema50:ema(c,50),ema200:ema(c,200),bbU:[],bbL:[]};const m20=sma(c,20);c.forEach((_,i)=>{if(m20[i]==null){ov.bbU.push(null);ov.bbL.push(null);return}const s=c.slice(i-19,i+1),sd=Math.sqrt(s.reduce((a,v)=>a+(v-m20[i])**2,0)/20);ov.bbU.push(m20[i]+2*sd);ov.bbL.push(m20[i]-2*sd)});
 const T=cd.map(x=>x.time),line=a=>a.map((v,i)=>v==null?null:{time:T[i],value:v}).filter(Boolean).slice(-300);
 return{price:px,bars:n,lastTime:T.at(-1),summary,score,counts:cnt,trend,indicators:ind,pivots,sr:_sr,patterns:pat.list,patternLines:pat.lines,patternMarkers:pat.markers,candles:cd.slice(-300),overlay:{ema20:line(ov.ema20),ema50:line(ov.ema50),ema200:line(ov.ema200),bbU:line(ov.bbU),bbL:line(ov.bbL)}}}
function to4h(cd){const m=new Map();for(const x of cd){const k=Math.floor(x.time/14400)*14400;const g=m.get(k);if(!g)m.set(k,{...x,time:k});else{g.high=Math.max(g.high,x.high);g.low=Math.min(g.low,x.low);g.close=x.close}}return[...m.values()]}
module.exports={analyze,to4h};
