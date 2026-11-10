'use strict';
/* ============================================================
   Presenter shell: live demo (3 phones + dashboard), the screen
   gallery, and the loop that keeps everything in sync.
   ============================================================ */
const UI={on(n,a,b){
  if(n=='note'){if(a=='o')dtoast(b.t,b.kind=='sos'?'sos':'');else showBan(a,b)}
  if(n=='booked'){const emps=a.rides.flatMap(id=>R(id).emps);if(!emps.includes(U.emp)){U.emp=emps[0];if(U.signed.e)root('e','home')}}
  if(n=='offer'){const r=a,d=b;
    if(S.auto&&r.emps.includes(U.emp)&&meD().state!='busy'){U.drv=d.id;if(U.signed.d)root('d','home')}   // follow the cab of the employee on screen
    if(d.id==U.drv&&U.signed.d)root('d','request')}
  if(n=='accepted'){const r=a;if(r.driver==U.drv&&U.signed.d)root('d','trip');if(r.emps.includes(U.emp)&&U.signed.e&&meE().status=='active'){root('e','home');go('e','trip',{id:r.id})}}
  if(n=='complete'){if(b.id==U.drv&&U.signed.d)root('d','done',{id:a.id})}
  if((n=='declined'||n=='cancelled')&&U.signed.d&&['request','trip','stops'].includes(topOf('d').s)&&!meD().ride)root('d','home');
}};

/* ---------- Top bar ---------- */
function renderTop(){
  setHTML($('#views'),[['live','Live demo','play_circle'],['onboard','Onboarding','person_add'],['gallery','All screens','grid_view']].map(([k,l,i])=>`<button class="press ${U.view==k?'on':''}" data-act="view:${k}">${ms(i)}${l}</button>`).join(''));
  const next=S.rides.filter(r=>r.status=='scheduled'&&r.day==0).sort((a,b)=>a.when-b.when)[0];
  const all=U.signed.m&&U.signed.e&&U.signed.d;
  if(U.view=='onboard')return setHTML($('#ctrl'),`<span class="clock">${tstr(S.now)}</span><button class="chip c press" data-act="obreset">${ms('restart_alt')}Start onboarding over</button>`);
  setHTML($('#ctrl'),`<span class="clock">${tstr(S.now)}</span>
    ${all?'':`<button class="chip g press" data-act="signall">${ms('login')}Sign in all three</button>`}
    ${next?`<button class="chip c press" data-act="skip">${ms('fast_forward')}Jump to ${tstr(next.when)} ride</button>`:''}
    <span class="row press" data-act="auto" style="gap:8px;font-weight:600"><span class="sw ${S.auto?'on':''}"><i></i></span>Drivers on auto-pilot</span>
    <div class="seg">${[1,2,4].map(v=>`<button class="${S.speed==v?'on':''}" data-act="speed:${v}">${v}×</button>`).join('')}</div>
    <button class="chip c press" data-act="reset">${ms('restart_alt')}Reset</button>`);
  if(U.view=='onboard')return;   // the onboarding view draws its own step bar
  const done=r=>r.day==0;
  const steps=[['Sign in by phone number',all],['Manager adds money',S.ledger.some(l=>l.type=='topup'&&l.day==0)],['Manager books cabs',S.bookings.length>0],['Driver accepts',S.rides.some(r=>done(r)&&r.accepted)],['OTP pickup',S.rides.some(r=>done(r)&&Object.values(r.board).some(b=>b=='in'||b=='dropped'))],['Drop-off, everyone notified',S.rides.some(r=>done(r)&&r.status=='completed')],['Driver asks to withdraw',S.wds.some(w=>w.day==0)],['Owner pays out',S.wds.some(w=>w.day==0&&w.status=='paid')],['Owner publishes an ad',S.ads.length>5],['SOS drill',S.incidents.length>0]];
  const cur=steps.findIndex(s=>!s[1]);
  setHTML($('#guide'),`<span class="lab" style="white-space:nowrap">Demo path</span>`+steps.map((s,i)=>`<span class="g ${s[1]?'done':i==cur?'cur':''}"><b>${s[1]?'✓':i+1}</b>${s[0]}</span>`).join(''));
}
ACT.view=(a,v)=>{U.view=v;buildStage()};
ACT.auto=()=>{S.auto=!S.auto};
ACT.speed=(a,v)=>{S.speed=+v};
ACT.reset=()=>{const v=U.view;initWorld();initUI();U.view=v;buildStage()};
ACT.signall=()=>{['m','e','d'].forEach(a=>{if(!U.signed[a])ACT.signin(a)})};
ACT.skip=()=>{const next=S.rides.filter(r=>r.status=='scheduled'&&r.day==0).sort((a,b)=>a.when-b.when)[0];if(next){S.now=next.when-21;
  if(!next.emps.includes(U.emp)){U.emp=next.emps[next.type=='drop'?next.emps.length-1:0];if(U.signed.e)root('e','home')}}};

/* ---------- Live stage ---------- */
function buildStage(){
  const st=$('#stage');st._h=null;
  if(U.view=='gallery'){st.innerHTML=galleryHTML();return}
  if(U.view=='onboard'){
    st.innerHTML=`<div id="obhint" class="obhint"></div><div class="phones">
      <div class="pcol"><div class="stagelab"><span class="tag">① Manager · new company</span><span class="sp"></span><span class="gray" style="font-size:12px">${OB.co.admin}</span></div><div class="phone"><div class="scr" id="scr-m" data-app="m"></div></div></div>
      <div class="pcol"><div class="stagelab"><span class="tag">② Employee · invited</span><span class="sp"></span><span class="gray" style="font-size:12px">${OB.emp.name}</span></div><div class="phone"><div class="scr" id="scr-e" data-app="e"></div></div></div>
      <div class="pcol"><div class="stagelab"><span class="tag">③ Driver · new sign-up</span><span class="sp"></span><span class="gray" style="font-size:12px">${OB.drv.name}</span></div><div class="phone"><div class="scr" id="scr-d" data-app="d"></div></div></div></div>
      <div class="stagelab" style="max-width:1500px;margin:0 auto 12px"><span class="tag">④ Owner console · web</span><span class="gray" style="font-size:12px">Where the company and drivers are approved</span></div>
      <div class="laptop"><div class="lscr"><div class="chrome"><i></i><i></i><i></i><span class="url">🔒 console.bingo.in</span></div><div class="dash" id="dash" data-app="o"></div></div><div class="lbase"></div></div>`;
    renderAll();return}
  st.innerHTML=`<div class="phones">
    <div class="pcol"><div class="stagelab"><span class="tag">① Manager app</span><span class="sp"></span><span class="gray" style="font-size:12px">${S.manager.name}</span></div><div class="phone"><div class="scr" id="scr-m" data-app="m"></div><div class="bhost" id="ban-m" data-app="m"></div></div></div>
    <div class="pcol"><div class="stagelab"><span class="tag">② Employee app</span><span class="sp"></span><select id="selEmp"></select></div><div class="phone"><div class="scr" id="scr-e" data-app="e"></div><div class="bhost" id="ban-e" data-app="e"></div></div></div>
    <div class="pcol"><div class="stagelab"><span class="tag">③ Driver app</span><span class="sp"></span><select id="selDrv"></select></div><div class="phone"><div class="scr" id="scr-d" data-app="d"></div><div class="bhost" id="ban-d" data-app="d"></div></div></div></div>
    <div class="stagelab" style="max-width:1500px;margin:0 auto 12px"><span class="tag">④ Owner dashboard · web</span><span class="gray" style="font-size:12px">The ride-hailing company's console</span></div>
    <div class="laptop"><div class="lscr"><div class="chrome"><i></i><i></i><i></i><span class="url">🔒 console.bingo.in</span></div><div class="dash" id="dash" data-app="o"></div><div id="dtoast" data-app="o"></div></div><div class="lbase"></div></div>`;
  renderAll();
}
function syncSelects(){
  const se=$('#selEmp'),sd=$('#selDrv');if(!se)return;
  const eo=S.emps.map(e=>`<option value="${e.id}">${e.name}${e.status=='invited'?' · new joiner':e.status=='request'?' · wants to join':''}</option>`).join('');
  if(se._o!==eo){se.innerHTML=eo;se._o=eo}if(se.value!=U.emp)se.value=U.emp;
  const dop=S.drivers.map(d=>`<option value="${d.id}">${d.name} · ${VEH[d.veh].n}${d.kyc!='approved'?' · new sign-up':''}</option>`).join('');
  if(sd._o!==dop){sd.innerHTML=dop;sd._o=dop}if(sd.value!=U.drv)sd.value=U.drv;
}
document.addEventListener('change',ev=>{
  if(ev.target.id=='selEmp'){U.emp=ev.target.value;if(U.signed.e)enterEmp();else root('e','login');renderAll()}
  if(ev.target.id=='selDrv'){U.drv=ev.target.value;const d=meD();if(!U.signed.d)root('d','login');else if(d.kyc!='approved')root('d','kyc');else if(d.ride&&R(d.ride).status=='offered')root('d','request');else if(d.ride)root('d','trip');else root('d','home');renderAll()}
  if(ev.target.id=='adFile'&&ev.target.files[0]){const fr=new FileReader();fr.onload=()=>{U.adDraft.img=fr.result;renderAll()};fr.readAsDataURL(ev.target.files[0]);ev.target.value=''}
});
document.addEventListener('input',ev=>{
  if(ev.target.matches('[data-filter]')){const q=ev.target.value.toLowerCase();$$('[data-find]',ev.target.closest('.scroll')).forEach(x=>x.style.display=x.dataset.find.includes(q)?'':'none')}
});
function renderAll(){
  renderTop();
  if(U.view=='onboard')return renderOB();
  if(U.view!='live')return;
  syncSelects();
  // screens that depend on a state that has ended fall back by themselves; keep stacks tidy
  if(U.signed.e&&meE().status=='active'&&['pending','link'].includes(topOf('e').s)&&meE().home)root('e','home');
  if(U.signed.d&&topOf('d').s=='kyc'&&meD().kyc=='approved')root('d','home');
  ['m','e','d'].forEach(renderPhone);
  setHTML($('#dash'),dashHTML(),'dash'+U.dash);syncPulses($('#dash'));
  renderToast();
}
/* Dashboard toast, in its own layer like the phone banners. */
function renderToast(){
  const host=$('#dtoast');if(!host)return;const t=U.toast&&U.toast.until>Date.now()?U.toast:null,id=t?t.id:0;
  if(host._tid===id)return;host._tid=id;
  host.innerHTML=t?`<div class="toast ${t.kind||''}">${ms(t.kind=='sos'?'sos':'check_circle')}${t.m}</div>`:'';
}

/* ---------- Gallery: every screen, rendered from snapshots of one full run ---------- */
let SHOTS=null;
function buildShots(){
  const ks=S,ku=U;initWorld();initUI();S.quiet=true;U.pure=true;
  const snap=()=>JSON.stringify(S), run=(pred,max=6000)=>{let n=0;while(!pred()&&n++<max)tick(.15)};
  const sh={};sh.idle=snap();
  newDraft('pickup');S.draft.sel=['e1','e2','e3','e4','e5','e6','e9'];sh.draft=snap();
  const d2=JSON.parse(sh.draft);d2.draft.now=false;d2.draft.when=1110;d2.draft.repeat=true;sh.draftSched=JSON.stringify(d2);
  const bk=payBooking();sh.booked=snap();
  run(()=>S.rides.some(r=>r.status=='offered'));const fr=S.rides.find(r=>r.status=='offered');sh.offered=snap();
  const emp=fr.emps[0],e2=fr.emps[fr.emps.length-1];
  run(()=>fr.status=='enroute');run(()=>distToStop(fr,0)<140);sh.enroute=snap();
  run(()=>fr.phase=='wait');sh.wait=snap();const m=JSON.parse(sh.wait);m.auto=false;sh.waitManual=JSON.stringify(m);
  run(()=>fr.board[emp]=='in'&&fr.phase=='moving');run(()=>fr.leg>=Math.min(1,fr.stops.length-1)&&fr.phase=='moving'&&progress(fr)>.45);sh.onboard=snap();
  const keep=snap();raiseSOS(emp);sh.sos=snap();S=JSON.parse(keep);
  const fr2=R(fr.id);run(()=>fr2.status=='completed');run(()=>live().length==0,3000);sh.done=snap();
  const w=withdraw(DR(fr2.driver),DR(fr2.driver).earn,DR(fr2.driver).upi);sh.wd=snap();
  approveWd(w);run(()=>w.status=='paid');sh.paid=snap();
  SHOTS={sh,ride:fr.id,bk:bk.id,emp,e2,drv:fr2.driver};
  S=ks;U=ku;
}
function shot(key,cfg,fn){const ks=S,ku=U;S=JSON.parse(SHOTS.sh[key]);initUI();U.pure=true;U.signed={m:true,e:true,d:true};Object.assign(U,cfg);let h;try{h=fn()}catch(e){h={c:'',h:'<div class="empty">'+e.message+'</div>'};console.error(key,cfg,e)}S=ks;U=ku;return h}
function galleryHTML(){
  if(!SHOTS)buildShots();
  const {ride,bk,emp,e2,drv}=SHOTS,P={emp,drv};
  const cell=(a,cap,key,s,p={},cfg={})=>{const v=shot(key,{...P,...cfg},()=>screenHTML(a,s,p));return `<div class="gcell"><div class="gframe"><div class="scr ${v.c}">${v.h}</div></div><div class="cap">${cap}</div></div>`};
  const sec=(title,sub,cells)=>`<h3 class="disp">${title}</h3><p class="sub">${sub} · ${cells.length} screens</p><div class="galgrid">${cells.map((c,i)=>c.replace('<div class="cap">','<div class="cap"><b>'+String(i+1).padStart(2,'0')+'</b>')).join('')}</div>`;
  const dcell=(cap,key,page,cfg={})=>{const h=shot(key,{...P,dash:page,...cfg},()=>dashMain(page));return `<div class="gcell gdash"><div class="wrap"><div class="dmain">${h}</div></div><div class="cap">${cap}</div></div>`};
  return `<div class="gal" style="max-width:1500px;margin:0 auto">
  ${sec('Manager app','Books rides for the team and pays from the company wallet',[
    cell('m','Sign in with phone number','idle','login'),cell('m','OTP check','idle','otp'),cell('m','Home','idle','home'),cell('m','Home during rides','onboard','home'),
    cell('m','Team','idle','team'),cell('m','Join requests','idle','team',{}, {teamTab:'request'}),cell('m','Add people','idle','teamAdd'),cell('m','Bulk upload','idle','teamBulk'),cell('m','Company code & QR','idle','teamInvite'),cell('m','Person details','idle','emp',{id:'e1'}),
    cell('m','Booking · trip & time','draft','book1'),cell('m','Booking · schedule & repeat','draftSched','book1'),cell('m','Booking · choose people','draft','book2'),cell('m','Booking · smart plan','draft','book3'),cell('m','Booking · review & pay','draft','book4'),cell('m','Booking confirmed','booked','bookDone',{id:bk}),
    cell('m','Rides · live','onboard','rides',{}, {mrTab:'live'}),cell('m','Ride tracking','onboard','ride',{id:ride}),cell('m','Rides · scheduled','idle','rides',{}, {mrTab:'sched'}),cell('m','Rides · past','done','rides',{}, {mrTab:'past'}),
    cell('m','Wallet','done','wallet'),cell('m','Add money','idle','addMoney'),cell('m','Notifications','done','alerts'),cell('m','Safety centre','idle','safety'),cell('m','SOS alert','sos','incident',{id:'INC-101'}),cell('m','Reports','done','reports'),cell('m','Profile & company','idle','more')])}
  ${sec('Employee app','Shows every detail of the cab booked for them, with safety on each screen',[
    cell('e','Sign in with phone number','idle','login'),cell('e','OTP check','idle','otp'),cell('e','Company found automatically','idle','link',{}, {emp:'e11'}),cell('e','One-time setup','idle','setup',{}, {emp:'e11'}),cell('e','Join with a code','idle','code',{}, {emp:'e11'}),cell('e','Waiting for approval','idle','pending',{}, {emp:'e12'}),
    cell('e','Home · no ride','idle','home',{}, {emp:'e6'}),cell('e','Home · scheduled cab','idle','home',{}, {emp:'e7'}),cell('e','Scheduled cab details','idle','trip',{}, {emp:'e7'}),cell('e','Home · cab on the way','enroute','home'),
    cell('e','Finding a driver','booked','trip',{id:ride}),cell('e','Driver arriving','enroute','trip',{id:ride}),cell('e','Driver is here · OTP','wait','trip',{id:ride}),cell('e','Stop order','enroute','route',{id:ride}),cell('e','On the trip','onboard','trip',{id:ride}),cell('e','SOS active','sos','sos'),cell('e','Arrived','done','trip',{id:ride}),
    cell('e','My trips','done','trips'),cell('e','Notifications','done','alerts'),cell('e','Safety','idle','safety'),cell('e','Profile','idle','profile')])}
  ${sec('Driver app','Accepts corporate rides, runs multi-stop trips, withdraws earnings',[
    cell('d','Sign in with phone number','idle','login'),cell('d','OTP check','idle','otp'),cell('d','Documents under review','idle','kyc',{}, {drv:'d8'}),cell('d','Home · online','idle','home'),
    cell('d','New ride request','offered','request'),cell('d','Driving to pickup','enroute','trip'),cell('d','Pickup · verify OTP','waitManual','trip'),cell('d','Driving to next stop','onboard','trip'),cell('d','All stops','onboard','stops'),
    cell('d','Trip complete','done','done',{id:ride}),cell('d','Earnings','wd','earnings'),cell('d','Withdraw','done','withdraw'),cell('d','Payout paid','paid','earnings'),cell('d','Notifications','paid','alerts'),cell('d','Profile','idle','profile')])}
  <h3 class="disp">Owner dashboard</h3><p class="sub">The ride-hailing company's web console · 9 pages</p><div class="galgrid">
    ${[dcell('Overview','onboard','overview'),dcell('Rides','onboard','rides',{dsel:ride}),dcell('Companies','idle','companies',{coForm:true}),dcell('Drivers','idle','drivers'),dcell('Payouts','wd','payouts'),dcell('Revenue','paid','revenue'),dcell('Ads','idle','ads'),dcell('Safety desk','sos','safety'),dcell('Settings','idle','settings')].map((c,i)=>c.replace('<div class="cap">','<div class="cap"><b>'+String(i+1).padStart(2,'0')+'</b>')).join('')}</div>
  ${typeof obGalleryHTML=='function'?obGalleryHTML():''}</div>`;
}

/* ---------- Go ---------- */
initWorld();initUI();if(typeof initOB=='function')initOB();
$('#mk').innerHTML=mark(32);
buildStage();
/* Never redraw while a mouse button or finger is down: replacing the element
   under the pointer between press and release would swallow the click. */
let _press=false,_pressT=0;
document.addEventListener('pointerdown',()=>{_press=true;clearTimeout(_pressT)},true);
const _release=()=>{clearTimeout(_pressT);_pressT=setTimeout(()=>{_press=false},60)};
document.addEventListener('pointerup',_release,true);document.addEventListener('pointercancel',_release,true);
let _last=performance.now();
setInterval(()=>{const now=performance.now(),dt=Math.min(.25,(now-_last)/1000);_last=now;tick(dt);if(!_press)renderAll()},110);
