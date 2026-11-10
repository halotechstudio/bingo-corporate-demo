'use strict';
/* ============================================================
   Shared UI: presenter state, navigation, components, maps.
   Screens are pure functions of S + U so the gallery can render
   any of them from a snapshot.
   ============================================================ */
const SC={m:{},e:{},d:{}};      // screen registries: SC.m.home = p => ({c,h,tab})
const ACT={};                   // click actions: data-act="name:arg1:arg2"
const DP={};                    // dashboard pages
function initUI(){
  U={view:'live',emp:'e1',drv:'d1',dash:'overview',nav:{m:[{s:'login'}],e:[{s:'login'}],d:[{s:'login'}]},signed:{m:false,e:false,d:false},
     ban:{},bq:{},seen:{},banSeq:0,toast:null,toastSeen:[],imp:{},bell:false,pure:false,adDraft:{slots:['e_home'],img:null},coForm:false,otpFill:{},dsel:null};
}
const topOf=a=>U.nav[a][U.nav[a].length-1];
function go(a,s,p={}){U.nav[a].push({s,p})}
function back(a){if(U.nav[a].length>1)U.nav[a].pop()}
function root(a,s,p={}){U.nav[a]=[{s,p}]}
const keyOf=a=>a=='m'?'m':a=='e'?'e:'+U.emp:'d:'+U.drv;
const meE=()=>E(U.emp), meD=()=>DR(U.drv);
function ptoast(a,t,b='',ic='info'){const k=keyOf(a);delete U.ban[k];(U.seen[k]||[]).splice(0);showBan(k,{t,b,ic})}  // the user's own tap always gets feedback

/* ---------- Components ---------- */
const pill=(label,act,o={})=>`<button class="pill press ${o.cls||''}" data-act="${act}" ${o.dis?'disabled':''}><span class="t">${label}${o.sub?`<small>${o.sub}</small>`:''}</span>${o.noarr?'':`<span class="arr">${ms(o.ic||'arrow_forward')}</span>`}</button>`;
const slide=(label,act,ic='check',cls='')=>`<button class="slide press ${cls}" data-act="${act}"><span class="th">${ms(ic)}</span>${label}<span class="ms ch">keyboard_double_arrow_right</span></button>`;
const av=(name,cls='')=>`<span class="av ${cls}">${ini(name)}</span>`;
const plate=p=>`<span class="plate"><i>IND</i>${p}</span>`;
const kv=(k,v,cls='')=>`<div class="kv ${cls}"><span>${k}</span><b>${v}</b></div>`;
const sw=(on,act)=>`<span class="sw ${on?'on':''}" data-act="${act}"><i></i></span>`;
const backBtn=(cls='')=>`<button class="cbtn ${cls} press" data-act="back">${ms('arrow_back')}</button>`;
const hd=(title,o={})=>`<div class="hd">${o.noback?'':backBtn(o.dk?'c':'')}<h2 class="nw">${title}</h2>${o.right||''}</div>`;
const sbar=()=>`<div class="sbar"><span>${tstr(S.now).replace(/ [AP]M/,'')}</span><span class="isl"></span><span class="row" style="gap:4px">${ms('signal_cellular_alt')}${ms('wifi')}${ms('battery_full')}</span></div>`;
const mark=s=>`<svg width="${s}" height="${s}" viewBox="0 0 100 100" style="border-radius:${s*.28}px;flex:none;display:block"><rect width="100" height="100" fill="#C7FF2E"/><g fill="none" stroke="#0F0F0F" stroke-width="12" stroke-linecap="round"><circle cx="54" cy="58" r="19"/><line x1="35" y1="22" x2="35" y2="58"/></g><circle cx="54" cy="58" r="5" fill="#0F0F0F"/></svg>`;
const otpBoxes=(code,cls='')=>`<div class="otp ${cls}">${String(code).padEnd(4,' ').split('').map((c,i,a)=>`<i class="${c==' '&&(i==0||a[i-1]!=' ')?'cur':''}">${c==' '?'&nbsp;':c}</i>`).join('')}</div>`;
const TABS={m:[['home','home'],['rides','route'],['team','groups'],['wallet','account_balance_wallet'],['more','person']],
            e:[['home','home'],['trips','schedule'],['safety','shield'],['profile','person']],
            d:[['home','home'],['earnings','bar_chart'],['alerts','notifications'],['profile','person']]};
function tabbar(a,on){
  const un=S.unread[keyOf(a)]||0;
  return `<div class="tabwrap"><div class="tabbar">${TABS[a].map(([s,ic])=>`<button class="press ${s==on?'on':''}" data-act="tab:${s}">${ms(ic)}${a=='d'&&s=='alerts'&&un?`<span class="dot">${un}</span>`:''}</button>`).join('')}</div></div>`;
}
const bell=(a,cls='')=>{const un=S.unread[keyOf(a)]||0;return `<button class="cbtn ${cls} press" data-act="go:alerts">${ms('notifications')}${un?`<span class="dot">${un}</span>`:''}</button>`};
function adSlot(slot,a){
  const ad=adFor(slot);if(!ad)return '';
  if(!U.pure){const k=a+slot+ad.id,now=Date.now();if(!U.imp[k]||now-U.imp[k]>20000){U.imp[k]=now;ad.imp++}}
  return `<div class="ad press ${ad.img?'img':''}" data-act="adclick:${ad.id}" style="background:${ad.img?`url(${ad.img}) center/cover`:ad.bg}"><span class="x">AD · ${ad.adv.toUpperCase()}</span><div><b>${ad.head}</b><small>${ad.sub}</small><span class="cta">${ad.cta}</span></div></div>`;
}
const adWrap=(slot,a,cls='mt8')=>{const x=adSlot(slot,a);return x?`<div class="${cls}">${x}</div>`:''};
const notesList=(key,dk)=>{const l=S.notes[key]||[];return l.length?l.map(n=>`<div class="li" ${n.ride?`data-act="openride:${n.ride}"`:n.inc?`data-act="go:incident:${n.inc}"`:''}><span class="cbtn sm ${n.kind=='sos'?'r':n.kind=='warn'?'':'g'}">${ms(n.ic)}</span><div class="t"><b>${n.t}</b><small style="white-space:normal">${n.b}</small><small>${tstr(n.at)}</small></div></div>`).join(''):`<div class="empty">${ms('notifications_off','','font-size:34px')}<br><br>Nothing yet. Ride updates will show up here.</div>`};
const stChip=st=>({scheduled:['s','event','Scheduled'],searching:['s','radar','Finding driver'],offered:['s','radar','Finding driver'],enroute:['','route','On the way'],completed:['g','check_circle','Completed'],cancelled:['red','cancel','Cancelled']})[st];
const rideChip=r=>{const c=stChip(r.status);return `<span class="chip ${c[0]}">${ms(c[1])}${c[2]}</span>`};

/* ---------- Map (same look as the Bingo CityMap) ---------- */
const MAPBG=(()=>{let s='<rect x="-400" y="-400" width="1900" height="1500" fill="#141414"/>';let r=7;const q=()=>((r=(r*9301+49297)%233280)/233280);
  for(let i=0;i<26;i++)s+=`<rect x="${-100+q()*1200}" y="${-100+q()*900}" width="${50+q()*90}" height="${40+q()*70}" rx="14" fill="#18201A"/>`;
  s+='<path d="M700 520 Q980 480 1000 660 Q860 760 660 660Z" fill="#131B21"/><path d="M120 300 Q220 270 240 360 Q180 420 110 380Z" fill="#131B21"/>';
  for(let x=-380;x<1500;x+=34)s+=`<line x1="${x}" y1="-400" x2="${x+(q()-.5)*26}" y2="1100" stroke="#232323" stroke-width="1.4"/>`;
  for(let y=-380;y<1100;y+=30)s+=`<line x1="-400" y1="${y}" x2="1500" y2="${y+(q()-.5)*26}" stroke="#232323" stroke-width="1.4"/>`;
  s+='<g stroke="#2E2E2E" stroke-width="5" stroke-linecap="round"><line x1="-400" y1="60" x2="1500" y2="330"/><line x1="60" y1="1100" x2="760" y2="-400"/><line x1="-400" y1="640" x2="1500" y2="560"/><line x1="-400" y1="420" x2="1500" y2="180"/></g>';
  return s})();
const elbow=pts=>{const o=[pts[0]];for(let i=1;i<pts.length;i++){const a=o[o.length-1],b=pts[i];if(a.x!=b.x&&a.y!=b.y)o.push({x:b.x,y:a.y});o.push(b)}return o};
function mapSvg(o){
  const all=o.only?[...o.fit]:[...(o.fit||[]),...(o.route||[]),...(o.stops||[]),...(o.cars||[]),...(o.homes||[]),...(o.dest?[o.dest]:[])];
  if(!all.length)all.push({x:300,y:150},{x:800,y:550});
  let x0=Math.min(...all.map(p=>p.x)),x1=Math.max(...all.map(p=>p.x)),y0=Math.min(...all.map(p=>p.y)),y1=Math.max(...all.map(p=>p.y));
  const ar=o.ar||1.6, pad=o.pad??70;x0-=pad;x1+=pad;y0-=pad*(o.padT||1.15);y1+=pad*(o.padB||1);
  let w=Math.max(x1-x0,180),h=Math.max(y1-y0,120);if(w/h<ar){const nw=h*ar;x0-=(nw-w)/2;w=nw}else{const nh=w/ar;y0-=(nh-h)/2;h=nh}
  const k=w/(o.px||360), f=n=>(n*k).toFixed(1);
  let s=`<svg viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" preserveAspectRatio="xMidYMid slice">${MAPBG}`;
  if(o.route&&o.route.length>1){const d='M'+o.route.map(p=>p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' L');
    s+=`<path d="${d}" fill="none" stroke="rgba(199,255,46,.3)" stroke-width="${f(13)}" stroke-linejoin="round" filter="url(#glow)"/><path d="${d}" fill="none" stroke="#C7FF2E" stroke-width="${f(3.6)}" stroke-linejoin="round" stroke-linecap="round" ${o.dash?`stroke-dasharray="${f(8)} ${f(7)}"`:''}/>`}
  for(const p of o.homes||[])s+=`<g transform="translate(${p.x},${p.y})" opacity="${p.dim?.35:1}"><circle r="${f(8)}" fill="#fff"/><circle r="${f(3.4)}" fill="#0F0F0F"/>${p.label?`<text y="${f(22)}" text-anchor="middle" font-family="Inter" font-size="${f(10.5)}" font-weight="600" fill="#9a9a9a">${p.label}</text>`:''}</g>`;
  for(const p of o.stops||[])s+=`<g transform="translate(${p.x},${p.y})">${p.cur?`<circle r="${f(22)}" fill="#C7FF2E" opacity=".18"/>`:''}<circle r="${f(12)}" fill="${p.done?'#C7FF2E':'#fff'}" stroke="#141414" stroke-width="${f(2)}"/><text y="${f(4.2)}" text-anchor="middle" font-family="Urbanist" font-weight="800" font-size="${f(12.5)}" fill="#0F0F0F">${p.done?'✓':p.n}</text>${p.label?`<text y="${f(-18)}" text-anchor="middle" font-family="Inter" font-size="${f(10.5)}" font-weight="700" fill="#fff" stroke="#141414" stroke-width="${f(3)}" paint-order="stroke">${p.label}</text>`:''}</g>`;
  if(o.dest){const p=o.dest;s+=`<g transform="translate(${p.x},${p.y}) scale(${k})"><path d="M0 2 C-15 -15 -13 -34 0 -34 C13 -34 15 -15 0 2Z" fill="#C7FF2E"/><circle cy="-20" r="5.5" fill="#0F0F0F"/>${p.label?`<text y="-42" text-anchor="middle" font-family="Urbanist" font-weight="700" font-size="13" fill="#C7FF2E" stroke="#141414" stroke-width="3" paint-order="stroke">${p.label}</text>`:''}</g>`}
  for(const c of o.cars||[])s+=`<g transform="translate(${c.x.toFixed(1)},${c.y.toFixed(1)}) scale(${k})" opacity="${c.dim?.5:1}">${c.sos?'<circle r="30" fill="#FF4D4D" opacity=".35"/>':''}<circle r="${c.busy?17:13}" fill="${c.sos?'#FF4D4D':c.busy?'#fff':'#C7FF2E'}" stroke="${c.busy?'#C7FF2E':'#141414'}" stroke-width="3"/><text y="${c.busy?6.5:5.5}" text-anchor="middle" font-family="Material Symbols Rounded" font-size="${c.busy?19:15}" fill="${c.sos?'#fff':'#0F0F0F'}">${c.ic||'local_taxi'}</text>${c.label?`<text y="-25" text-anchor="middle" font-family="Inter" font-size="11" font-weight="700" fill="#fff" stroke="#141414" stroke-width="3" paint-order="stroke">${c.label}</text>`:''}</g>`;
  return s+'</svg>';
}
/* Map for one ride: route still to drive, numbered stops, the cab. */
function rideMap(r,o={}){
  const d=r.driver?DR(r.driver):null, live=r.status=='enroute';
  const stops=r.stops.map((s,i)=>({x:s.p.x,y:s.p.y,n:i+1,done:s.status=='done',cur:live&&i==r.leg,label:o.labels?(s.emps.length==1?first(E(s.emps[0]).name):s.p.n):''}));
  const ls=r.stops[r.stops.length-1], pin=r.type!='drop';          // office / venue at the end gets the lime pin
  const last=pin?stops.pop():null;
  const route=live?[{x:d.x,y:d.y},...r.pts.slice(r.pi)]:elbow(r.stops.map(s=>s.p));
  const m={...o,route,stops,dest:last?{x:last.x,y:last.y,label:ls.p.n}:null,
    cars:live?[{x:d.x,y:d.y,busy:true,ic:VEH[r.veh].ic,sos:S.incidents.some(i=>i.ride==r.id&&i.status!='resolved')}]:[]};
  if(o.focus!=null&&live){m.fit=[{x:d.x,y:d.y},r.stops[Math.min(o.focus,r.stops.length-1)].p];m.only=true;m.pad=o.pad??90}
  return mapSvg(m);
}
function stopsTl(r,o={}){
  return `<div class="tl">${r.stops.map((s,i)=>{const done=s.status=='done',cur=r.status=='enroute'&&i==r.leg;
    const who=s.emps.map(e=>{const b=(r.board||{})[e];return first(E(e).name)+(b=='noshow'?' (no-show)':'')}).join(', ');
    const sub=done?(s.k=='pickup'?'Picked up':'Dropped')+(s.at?' · '+tstr(s.at):''):cur?(r.phase=='wait'?(s.k=='pickup'?'Driver waiting · OTP check':'Dropping now'):'Arriving in '+etaTo(r,i)+' min'):r.status=='enroute'?'ETA '+tstr(S.now+etaTo(r,i)):s.k=='pickup'?'Pickup':'Drop';
    return `<div class="st ${done?'done':cur?'cur':''}"><span class="n">${done?'✓':i+1}</span><b>${s.k=='pickup'?'Pick up':'Drop'} ${who}${o.me&&s.emps.includes(o.me)?' <span class="chip g" style="padding:2px 8px;font-size:9.5px">YOU</span>':''}</b><small>${s.p.n} · ${sub}</small></div>`}).join('')}</div>`;
}
const driverCard=(d,o={})=>`<div class="row"><span class="av k lg">${ini(d.name)}</span><div class="f1"><b style="font-size:16px">${d.name}</b><div class="gray" style="font-size:12px">${ms('star','','font-size:14px;color:inherit')} ${d.rating} · ${d.trips} rides · ${ms('verified','','font-size:14px;color:#6b9400')} Verified</div></div>${o.noact?'':`<button class="cbtn press" data-act="say:Chat:Opens in-app chat with ${first(d.name)}:chat">${ms('chat')}</button><button class="cbtn g press" data-act="say:Calling ${first(d.name)}…:Your number stays hidden (masked call):call">${ms('call')}</button>`}</div>
  <div class="row mt12" style="justify-content:space-between"><span class="gray" style="font-size:12.5px">${d.car}</span>${plate(d.plate)}</div>`;

/* ---------- Rendering ---------- */
function setHTML(el,h,sid=''){
  if(!el||el._h===h)return;
  const same=el._sid===sid, vals={}, act=document.activeElement, fid=act&&el.contains(act)?act.id:null;
  if(same){$$('input[id],select[id]',el).forEach(i=>vals[i.id]=i.value)}
  const sc=same?$$('.scroll,.sheet,.panelk,.dmain,.feed,.dside',el).map(x=>x.scrollTop):[];
  el.innerHTML=h;el._h=h;el._sid=sid;
  if(same){for(const id in vals){const i=el.querySelector('#'+id);if(i)i.value=vals[id]}
    $$('.scroll,.sheet,.panelk,.dmain,.feed,.dside',el).forEach((x,i)=>{if(sc[i])x.scrollTop=sc[i]});
    if(fid){const i=el.querySelector('#'+fid);if(i){i.focus();try{const n=i.value.length;i.setSelectionRange(n,n)}catch(e){}}}}
}
function screenHTML(a,s,p){
  const fn=SC[a][s]||(()=>({h:`<div class="empty">Missing screen ${s}</div>`}));
  const v=fn(p||{});
  return {c:v.c||'',h:`${sbar()}<div class="body">${v.h}</div>${v.tab?tabbar(a,v.tab):''}`};
}
/* Keeps looping animations (pulse rings) on one shared clock, so a re-render doesn't restart them. */
function syncPulses(root){$$('.pulse',root).forEach(p=>{if(!p._ph){p._ph=1;p.style.animationDelay=-((performance.now()%1800)/1000)+'s'}})}
function renderPhone(a){
  const el=$('#scr-'+a);if(!el)return;const t=topOf(a),v=screenHTML(a,t.s,t.p);
  el.className='scr '+v.c;setHTML(el,v.h,a+t.s+(a=='e'?U.emp:a=='d'?U.drv:''));syncPulses(el);
  renderBanner(a);
}

/* ---------- Notification banners ----------
   One banner at a time per phone, drawn in its own layer so screen
   re-renders never restart its animation. Identical notifications
   within a minute are dropped; close-together ones wait their turn. */
const BAN_MS=3600, DUP_MS=60000;
function sameNote(a,b){return a&&b&&a.t==b.t&&(a.b||'')==(b.b||'')}
function showBan(key,n){
  if(U.pure)return;
  const now=Date.now(),cur=U.ban[key],q=(U.bq[key]=U.bq[key]||[]),seen=(U.seen[key]=U.seen[key]||[]);
  if(seen.some(s=>sameNote(s.n,n)&&now-s.at<DUP_MS)||q.some(x=>sameNote(x,n)))return;
  seen.push({n,at:now});while(seen.length>20)seen.shift();
  if(cur&&cur.until>now&&n.kind!='sos'){q.push(n);if(q.length>2)q.shift();return}
  U.ban[key]={n,until:now+BAN_MS,id:++U.banSeq};
}
function nextBan(key){
  const cur=U.ban[key],q=U.bq[key];
  if((!cur||cur.until<=Date.now())&&q&&q.length)U.ban[key]={n:q.shift(),until:Date.now()+BAN_MS,id:++U.banSeq};
  const b=U.ban[key];return b&&b.until>Date.now()?b:null;
}
function renderBanner(a){
  const host=$('#ban-'+a);if(!host)return;const b=nextBan(keyOf(a)),id=b?b.id:0;
  if(host._bid===id)return;host._bid=id;
  host.innerHTML=b?`<div class="banner ${b.n.kind=='sos'?'sos':''}" data-act="banner"><span class="ic">${ms(b.n.ic||'notifications')}</span><div class="f1"><b>${b.n.t}</b><small>${b.n.b||''}</small></div></div>`:'';
}

/* ---------- Click dispatcher ---------- */
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-act]');if(!b)return;
  const [n,...args]=b.dataset.act.split(':');const h=b.closest('[data-app]');const a=h?h.dataset.app:null;
  if(ACT[n])ACT[n](a,...args,b);else console.warn('no action',n);
  if(typeof renderAll=='function')renderAll();
});
ACT.go=(a,s,p1)=>go(a,s,p1!==undefined&&typeof p1=='string'?{id:p1}:{});
ACT.back=a=>back(a);
ACT.tab=(a,s)=>{root(a,s);if(s=='alerts')S.unread[keyOf(a)]=0};
ACT.say=(a,t,b,ic)=>ptoast(a,t,b,ic||'info');
ACT.banner=a=>{const k=keyOf(a),n=U.ban[k]&&U.ban[k].n;if(U.ban[k])U.ban[k].until=0;if(n&&n.inc)go(a,'incident',{id:n.inc});else if(n&&n.ride)ACT.openride(a,n.ride)};
ACT.adclick=(a,id)=>{const ad=S.ads.find(x=>x.id==id);if(ad){ad.clk++;ptoast(a,ad.adv,'Opens the advertiser\'s offer page','open_in_new')}};
ACT.openride=(a,id)=>{const r=R(id);if(!r)return;if(a=='m')go('m','ride',{id});else if(a=='e')go('e','trip',{id});else if(a=='d'&&r.driver==U.drv&&active(r))root('d',r.status=='offered'?'request':'trip',{id})};
ACT.noop=()=>{};
