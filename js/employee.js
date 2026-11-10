'use strict';
/* ============================================================
   Employee app — sees every detail of the ride booked for them.
   ============================================================ */
function enterEmp(){const e=meE();root('e',e.status=='invited'?'link':e.status=='request'?'pending':'home')}
(()=>{
const X=SC.e;
const greet=()=>{const h=(S.now/60|0)%24;return h<12?'Good morning':h<17?'Good afternoon':'Good evening'};
const others=(r,e)=>r.emps.filter(x=>x!=e);
const openSos=e=>S.incidents.find(i=>i.emp==e&&i.status!='resolved');

X.login=()=>SC.login('e',{tag:'EMPLOYEE',head:'Your office cab, <span class="lime">sorted.</span>',sub:'Use the mobile number your company has on record.',phone:meE().phone});
X.otp=()=>SC.otp('e',{phone:meE().phone,code:'7305'});

/* ---------- Joining a company ---------- */
X.link=()=>{const e=meE();return {c:'dk',h:`<div class="scroll" style="display:flex;flex-direction:column"><span class="cbtn g" style="width:60px;height:60px;margin-top:10px">${ms('verified','','font-size:30px')}</span>
  <div class="h1 mt20" style="font-size:42px">We found<br>your <span class="lime">company.</span></div>
  <p class="gray mt12" style="font-size:13px;line-height:1.5">${S.manager.name} added +91 ${e.phone} to the team, so this number is already linked. Nothing to type.</p>
  <div class="card mt20"><div class="row"><span class="cbtn g">${ms('apartment')}</span><div class="f1"><b>${S.company.name}</b><div class="gray" style="font-size:12px">${e.team} · added by ${first(S.manager.name)}</div></div>${ms('check_circle','lime')}</div></div>
  <div class="sp"></div>${pill('Continue as '+first(e.name),'go:setup')}
  <a class="press mt12" data-act="go:code" style="text-align:center;font-size:12.5px;color:var(--gray);text-decoration:underline">Not your company? Enter a company code</a></div>`}};
X.code=()=>({h:`${hd('Join with a code')}<div class="scroll" style="padding-top:0"><p class="gray" style="font-size:12.5px">Ask your manager for the company code or scan their QR.</p>
  <div class="field mt16">${ms('tag','gray')}<input id="ccode" value="${S.company.code}" style="letter-spacing:2px;font-family:Urbanist;font-size:20px"></div>
  <div class="mt12">${pill('Scan QR instead','say:Camera:Point at the QR in your manager\'s app:qr_code_scanner',{cls:'soft ctr sm',noarr:1})}</div>
  <div class="card mt16"><b>${ms('admin_panel_settings','','font-size:17px')} What happens next</b><p class="gray mt4" style="font-size:12px;line-height:1.5">Your manager gets a request with your name and number. Once they approve, you can be booked on company cabs.</p></div></div>
  <div class="foot">${pill('Send request','joincode')}</div>`});
ACT.joincode=()=>{const e=meE();e.status='request';note('m',{ic:'person_add',t:first(e.name)+' wants to join',b:'Joined with the company code. Approve in Team → Requests.'});root('e','pending')};
X.pending=()=>{const e=meE();if(e.status=='active'){return X.setupOrHome()}
  return {h:`<div class="scroll" style="display:flex;flex-direction:column;align-items:flex-start"><span class="cbtn" style="width:60px;height:60px;margin-top:10px">${ms('hourglass_top','','font-size:28px')}</span>
  <div class="h1 mt20" style="font-size:42px">Waiting for<br><span class="gray">approval.</span></div>
  <p class="gray mt12" style="font-size:13px;line-height:1.5">You asked to join ${S.company.name} with code ${S.company.code}. ${S.manager.name} has been notified.</p>
  <div class="card mt20" style="align-self:stretch"><div class="tl"><div class="st done"><span class="n">✓</span><b>Signed in with +91 ${e.phone}</b><small>Phone number verified by OTP</small></div><div class="st done"><span class="n">✓</span><b>Request sent</b><small>To ${S.manager.name}, ${S.manager.role}</small></div><div class="st cur"><span class="n">3</span><b>Manager approval</b><small>You will get a notification</small></div></div></div></div>`}};
X.setupOrHome=()=>{const e=meE();if(!e.home){return X.setup()}return X.home()};
X.setup=()=>{const e=meE(),a=U.setArea||'ind';
  return {h:`${hd('Set up once')}<div class="scroll" style="padding-top:0"><p class="gray" style="font-size:12.5px">Your manager never has to ask for these. You can change them any time.</p>
  <div class="sec">Where should the cab pick you up?</div>
  <div class="mapbox" style="height:150px">${mapSvg({ar:2.1,fit:[AREAS[a]],pad:120,homes:Object.values(AREAS).map(p=>({x:p.x,y:p.y,dim:true})),dest:{x:AREAS[a].x,y:AREAS[a].y,label:AREAS[a].n}})}</div>
  <div class="seg mt12">${Object.entries(AREAS).slice(0,9).map(([k,p])=>`<button class="${a==k?'on':''}" data-act="setarea:${k}">${p.n}</button>`).join('')}</div>
  <div class="field mt12">${ms('home','gray')}<input id="addr" value="${AREAS[a].a}"></div>
  <div class="sec">Emergency contact</div>
  <div class="field">${ms('favorite','gray')}<input id="ecname" value="Amma" placeholder="Name"></div>
  <div class="field mt8"><span class="gray">+91</span><input id="ecphone" value="98450 31142" placeholder="Mobile number"></div>
  <p class="gray mt8" style="font-size:11.5px;padding:0 4px">They get your live trip link if you press SOS, and on every night ride.</p></div>
  <div class="foot">${pill('Finish','setupdone',{sub:'You\'re ready to be booked'})}</div>`}};
ACT.setarea=(a,k)=>U.setArea=k;
ACT.setupdone=()=>{const e=meE();const n=($('#ecname')||{}).value||'Emergency contact';activateEmp(e,U.setArea||'ind',n);root('e','home');ptoast('e','You\'re all set','Your manager can now book cabs for you','check_circle')};

/* ---------- Home ---------- */
X.home=()=>{const e=meE(),r=rideFor(e.id),st=r?empStatus(r,e.id):null,d=r&&r.driver&&DR(r.driver);const sos=openSos(e.id);
  let card;
  if(!r)card=`<div class="card"><div class="row">${ms('event_busy','gray','font-size:30px')}<div class="f1"><b>No cab booked yet</b><div class="gray" style="font-size:12px;line-height:1.4">When ${first(S.manager.name)} books a cab for you, the driver, vehicle and timing show up here.</div></div></div></div>`;
  else if(r.status=='scheduled')card=`<div class="card k press" data-act="go:trip:${r.id}"><div class="row"><span class="tag d">Your next cab</span><span class="sp"></span>${r.repeat?`<span class="chip c">${ms('repeat')}${r.repeat}</span>`:''}</div>
     <div class="big lime mt12" style="font-size:44px">${tstr(r.when)}</div><div style="font-size:13px;margin-top:4px">${dayLabel(r.day)} · ${r.type=='drop'?place(r.place).n+' → '+e.home.n:e.home.n+' → '+place(r.place).n}</div>
     <div class="row mt12" style="font-size:12px;color:var(--gray)">${ms('group','','font-size:16px')}${others(r,e.id).length?'Sharing with '+others(r,e.id).map(x=>first(E(x).name)).join(', '):'Just you'}<span class="sp"></span><span class="lime">Details ›</span></div></div>`;
  else{const i=myStop(r,e.id,st=='onboard'?'drop':'pickup');
    card=`<div class="card g press" data-act="go:trip:${r.id}"><div class="row"><div class="f1"><b style="font-size:13px">${st=='onboard'?'On your way':st=='here'?'Your driver is here':d?'Your cab is on the way':'Finding your driver'}</b>
     <div class="big" style="font-size:44px;margin-top:2px">${d?(st=='here'?'Now':etaTo(r,i)+' min'):'…'}</div><div style="font-size:12px">${d?d.name+' · '+d.plate:'Hang tight, this takes under a minute'}</div></div><span class="cbtn k" style="width:52px;height:52px">${ms('arrow_forward','','color:#fff')}</span></div></div>`}
  return {tab:'home',h:`<div class="scroll"><div class="row" style="align-items:flex-start;margin-top:6px"><div class="h1 f1" style="font-size:38px">${greet()},<br>${first(e.name)}</div><div class="col" style="gap:8px;align-items:center">${av(e.name,'lg')}${bell('e')}</div></div>
    <p class="gray mt8" style="font-size:12.5px">${S.company.name} · rides paid by your company</p>
    ${sos?`<div class="card press mt12" style="background:var(--sos);color:#fff" data-act="go:sos"><div class="row">${ms('sos','','font-size:26px')}<b class="f1">SOS is active · help is on the way</b>${ms('arrow_forward')}</div></div>`:''}
    <div class="mt12">${card}</div>
    <div class="mt12">${adSlot('e_home','e')}</div>
    <div class="row mt12" style="gap:8px"><div class="card f1 press" data-act="tab:safety">${ms('shield')}<b style="display:block;margin-top:8px">Safety</b><small class="gray" style="font-size:11.5px">SOS · trusted contact</small></div><div class="card f1 press" data-act="tab:trips">${ms('schedule')}<b style="display:block;margin-top:8px">My trips</b><small class="gray" style="font-size:11.5px">${S.rides.filter(x=>x.emps.includes(e.id)&&x.status=='completed').length} rides so far</small></div></div>
    <div class="card mt12"><div class="row"><span class="cbtn sm k">${ms('home','lime')}</span><div class="f1"><b>Pickup point</b><div class="gray nw" style="font-size:12px">${e.home.n} · ${e.home.a}</div></div><a class="press" data-act="tab:profile" style="font-size:12px;font-weight:600;text-decoration:underline">Change</a></div></div>
  </div>`}};

/* ---------- The ride, in every state ---------- */
const safetyRow=(r)=>`<div class="row mt12" style="gap:8px"><button class="pill soft ctr sm press f1" data-act="say:Trip shared:Live link sent to your trusted contact:ios_share">${ms('ios_share','','font-size:17px;margin-right:6px')}Share trip</button><button class="pill ctr sm press f1" style="background:#fff;color:var(--sos);box-shadow:inset 0 0 0 1.5px var(--sos)" data-act="sos">${ms('sos','','font-size:19px;margin-right:6px')}SOS</button></div>`;
X.trip=p=>{const e=meE(),r=R(p.id)||rideFor(e.id);if(!r)return X.home();
  const st=empStatus(r,e.id),d=r.driver&&DR(r.driver),pl=place(r.place),co=others(r,e.id);
  const from=r.type=='drop'?pl.n:e.home.n,to=r.type=='drop'?e.home.n:pl.n;
  const pi=myStop(r,e.id,'pickup'),di=myStop(r,e.id,'drop');
  if(st=='scheduled')return {h:`${hd('Cab booked',{right:r.repeat?`<span class="chip s">${ms('repeat')}${r.repeat}</span>`:''})}<div class="scroll" style="padding-top:0">
    <div class="card k"><div class="gray" style="font-size:12px">${dayLabel(r.day)}</div><div class="big lime" style="font-size:54px">${tstr(r.when)}</div><div class="mt8" style="font-size:14px;font-weight:600">${from} → ${to}</div><div class="gray mt4" style="font-size:12px">${VEH[r.veh].n} · booked by ${S.manager.name}</div></div>
    <div class="mapbox mt8" style="height:150px">${rideMap(r,{ar:2.1,labels:true})}</div>
    <div class="sec">Stops in order</div><div class="card">${stopsTl(r,{me:e.id})}</div>
    ${co.length?`<div class="sec">Riding with you</div>${co.map(x=>`<div class="li">${av(E(x).name)}<div class="t"><b>${E(x).name}</b><small>${E(x).team} · ${E(x).home.n}</small></div></div>`).join('')}`:''}
    <div class="card line mt8"><div class="row" style="align-items:flex-start">${ms('notifications_active','','font-size:18px')}<span style="font-size:12px;line-height:1.5">Your driver's name, photo, vehicle number and OTP arrive about 20 minutes before pickup.</span></div></div>
    ${r.safety?`<div class="card line mt8"><div class="row" style="align-items:flex-start">${ms('shield','','font-size:18px;color:#6b9400')}<span style="font-size:12px;line-height:1.5">${r.safety}</span></div></div>`:''}
    <div class="mt12">${pill('I can\'t make it','cantgo:'+r.id,{cls:'soft ctr sm',noarr:1})}</div></div>`};
  if(st=='searching'||st=='offered')return {c:'dk',h:`<div class="col" style="flex:1;padding:8px 22px 22px"><div class="row"><span class="disp" style="font-size:24px;font-weight:800">bingo</span><span class="sp"></span><span class="chip g">LIVE · ${S.company.name.split(' ')[0]}</span></div>
    <div class="f1" style="display:grid;place-items:center;position:relative"><span class="pulse"></span><span style="width:120px;height:120px;border-radius:38px;background:var(--green);color:var(--black);display:grid;place-items:center">${ms(VEH[r.veh].ic,'','font-size:60px')}</span></div>
    <div class="disp" style="font-size:38px">Finding your <span class="lime">${VEH[r.veh].n.toLowerCase()}</span> driver</div><p class="gray mt8" style="font-size:13px">Notifying verified drivers near ${r.stops[0].p.n}…</p>${adWrap('e_wait','e','mt12')}
    <div class="card mt16"><div class="row"><div class="f1"><b>${from} → ${to}</b><div class="gray" style="font-size:12px">${co.length?'With '+co.map(x=>first(E(x).name)).join(', '):'Just you'} · paid by ${S.company.name}</div></div></div></div></div>`};
  if(st=='cancelled')return {h:`${hd('')}<div class="scroll" style="padding-top:0"><span class="cbtn r" style="width:60px;height:60px">${ms('close','','font-size:30px')}</span><div class="h1 mt20">Ride<br>cancelled.</div><p class="gray mt12" style="font-size:13px;line-height:1.5">${first(S.manager.name)} cancelled this cab. There is nothing to pay. Ask your manager if you still need a ride.</p></div>`};
  if(st=='noshow')return {h:`${hd('')}<div class="scroll" style="padding-top:0"><span class="cbtn" style="width:60px;height:60px">${ms('person_off','','font-size:30px')}</span><div class="h1 mt20">You missed<br>this cab.</div><p class="gray mt12" style="font-size:13px;line-height:1.5">${d?d.name:'The driver'} waited at ${e.home.n} and had to leave for the next pickup. ${first(S.manager.name)} has been told.</p><div class="mt20">${pill('Call '+first(S.manager.name),'say:Calling '+first(S.manager.name)+'…::call')}</div></div>`};
  if(st=='dropped'||st=='completed'){const h=(S.now/60|0)%24,night=h>=S.cfg.nightFrom||h<6,stars=(r.rated||{})[e.id]||0;
    return {c:'dk',h:`<div class="scroll"><div class="row" style="margin-top:6px"><span class="cbtn g" style="width:56px;height:56px">${ms('check','','font-size:28px')}</span><span class="sp"></span><span class="chip c">Paid by ${S.company.name.split(' ')[0]}</span></div>
    <div class="h1 mt16" style="font-size:54px">You<br>arrived!</div><p class="gray mt8" style="font-size:13px">${VEH[r.veh].n} · ${to}</p>
    <div class="card w mt16"><div class="tl"><div class="st done"><span class="n">✓</span><b>${from}</b></div><div class="st done"><span class="n">✓</span><b>${to}</b></div></div>
      <div class="row mt12" style="border-top:1px solid var(--soft);padding-top:12px"><div class="f1"><div class="gray" style="font-size:11px">Trip fare</div><div class="big" style="font-size:22px">${fmt(r.fare/r.emps.length)}</div></div><div class="f1"><div class="gray" style="font-size:11px">Paid by company</div><div class="big" style="font-size:22px">${fmt(r.fare/r.emps.length)}</div></div><div><div class="gray" style="font-size:11px">You pay</div><div class="big" style="font-size:28px">₹0</div></div></div></div>
    ${night&&!(r.safe||{})[e.id]?`<div class="mt8">${pill('I\'m home safe','homesafe:'+r.id,{sub:'Tells '+first(S.manager.name)+' and your trusted contact',ic:'verified_user'})}</div>`:''}
    ${d?`<div class="sec">Rate ${first(d.name)}</div><div class="row" style="gap:4px">${[1,2,3,4,5].map(n=>`<span class="ms press" data-act="rate:${r.id}:${n}" style="font-size:40px;color:${n<=stars?'var(--green)':'var(--charcoal)'}">star</span>`).join('')}</div>`:''}
    <div class="mt16">${adSlot('e_trip','e')}</div>
    <div class="mt12">${pill('Report a problem','say:Report sent:Your manager and Bingo support will follow up:flag',{cls:'ctr sm',noarr:1}).replace('class="pill','style="background:var(--charcoal);color:#fff" class="pill')}</div>
    <div class="mt8">${pill('Done','tab:home')}</div></div>`}}
  if(st=='onboard'){const before=r.stops.slice(r.leg,di).filter(s=>s.status!='done').length;
    return {c:'dk',h:`<div class="mapbg">${rideMap(r,{ar:.5,focus:di,pad:110,px:360})}</div><div class="over">
    <div class="topcard"><div class="f1"><b>Heading to</b><b style="color:#6b9400">${to}</b></div><button class="cbtn r press" style="width:54px;height:54px;font-size:14px" data-act="sos">SOS</button></div>
    <div class="panelk dk"><div class="stats3"><div><b>${etaTo(r,di)}</b><small>min left</small></div><div><b>${before}</b><small>stop${before==1?'':'s'} before you</small></div><div><b>${(distToStop(r,di)*KMU).toFixed(1)}</b><small>km left</small></div></div>
      <div class="bar mt12"><i style="width:${(progress(r)*100).toFixed(0)}%"></i></div>
      <div class="mt12">${stopsTl(r,{me:e.id})}</div>
      <div class="row mt12">${av(d.name,'sm')}<span class="f1 nw" style="font-size:12px;color:var(--gray)">${d.name} · ${d.plate}</span><button class="chip c press" data-act="say:Trip shared:Live link sent to your trusted contact:ios_share">${ms('ios_share')}Share trip</button></div>
      <div class="row mt8" style="font-size:11px;color:var(--gray)">${ms('visibility','lime','font-size:15px')}Tracked live by ${first(S.manager.name)}, your trusted contact and the Bingo safety desk</div></div></div>`}}
  // assigned / arriving / here
  const here=st=='here',eta=etaTo(r,pi),ahead=r.stops.slice(r.leg,pi).filter(s=>s.status!='done').length;
  return {c:'lm',h:`<div class="row" style="padding:6px 18px">${backBtn('w')}<span class="sp"></span><span class="chip">${here?'At your pickup point':(distToStop(r,pi)*KMU).toFixed(1)+' km away'}</span></div>
    <div class="f1" style="padding:0 24px;display:flex;flex-direction:column;justify-content:center;min-height:0">
      ${here?`<div class="disp" style="font-size:46px">Your driver<br>is here.</div><p class="mt8" style="font-size:13.5px">Check the number plate, then share your OTP.</p>`
        :`<div class="disp" style="font-size:36px">Your ${VEH[r.veh].n}<br>is arriving.</div><div class="row" style="align-items:baseline;gap:8px"><span style="font-size:16px">in</span><span class="big" style="font-size:96px">${eta}</span><span style="font-size:16px">min</span></div>
         <p style="font-size:12.5px">${ahead?ahead+' pickup'+(ahead>1?'s':'')+' before you · reaching about '+tstr(S.now+eta):'You are the next stop · '+tstr(S.now+eta)}</p>`}</div>
    <div class="sheet">${driverCard(d)}
      <div class="row mt12" style="background:var(--black);border-radius:28px;padding:12px 14px;color:#fff"><div class="f1"><b>Ride OTP</b><div class="gray" style="font-size:11px">Share only after you check the plate</div></div><div style="width:150px">${otpBoxes(r.otp[e.id],'k')}</div></div>
      ${co.length?`<div class="row mt12" style="font-size:12px">${ms('group','gray','font-size:17px')}<span class="gray f1">Sharing with ${co.map(x=>first(E(x).name)).join(', ')}</span><a class="press" data-act="go:route:${r.id}" style="font-weight:600;text-decoration:underline">Stop order</a></div>`:''}
      ${safetyRow(r)}</div>`};
};
X.route=p=>{const r=R(p.id),e=meE();return {h:`${hd('Your route')}<div class="scroll" style="padding-top:0"><div class="mapbox" style="height:220px">${rideMap(r,{ar:1.45,labels:true})}</div><div class="card mt8">${stopsTl(r,{me:e.id})}</div>
  <div class="card line mt8"><div class="row" style="align-items:flex-start">${ms('route','','font-size:18px')}<span style="font-size:12px;line-height:1.5">One cab, several stops. The order is planned so the whole group reaches on time${r.safety?', and to follow your company\'s night safety rule':''}.</span></div></div></div>`}};
ACT.cantgo=(a,id)=>{const e=meE();note('m',{ic:'event_busy',t:first(e.name)+' can\'t make the '+tstr(R(id).when)+' cab',b:R(id).id+' · you can cancel or rebook from Rides',kind:'warn',ride:id});ptoast('e','Manager informed',first(S.manager.name)+' will update the booking','event_busy')};
ACT.rate=(a,id,n)=>{const r=R(id);(r.rated=r.rated||{})[U.emp]=+n;if(r.driver)note('d:'+r.driver,{ic:'star',t:first(meE().name)+' rated you '+n+' stars',b:r.id});ptoast('e','Thanks for rating','','star')};
ACT.homesafe=(a,id)=>{const r=R(id),e=meE();(r.safe=r.safe||{})[e.id]=true;note('m',{ic:'verified_user',t:first(e.name)+' is home safe',b:r.id+' · confirmed in the app at '+tstr(S.now)});ptoast('e','Glad you\'re home','Your manager and trusted contact know','verified_user')};

/* ---------- SOS ---------- */
ACT.sos=()=>{if(!openSos(U.emp))raiseSOS(U.emp);go('e','sos')};
X.sos=()=>{const e=meE(),i=S.incidents.find(x=>x.emp==e.id)||{log:[],status:'resolved'};
  return {c:'dk',h:`<div class="scroll" style="display:flex;flex-direction:column;background:${i.status=='resolved'?'var(--black)':'#3a0d0d'}"><div class="row" style="margin-top:6px">${backBtn('c')}<span class="sp"></span><span class="chip ${i.status=='resolved'?'g':'sos'}">${i.status=='resolved'?'Closed':i.status=='ack'?'Help is calling you':'SOS active'}</span></div>
  <div class="h1 mt20" style="font-size:44px">${i.status=='resolved'?'You\'re<br>marked safe.':'Help is<br>on the way.'}</div>
  <p class="mt8" style="font-size:13px;color:#e6c9c9">${i.status=='resolved'?'This alert is closed.':'Stay on this screen. Your live location is being shared.'}</p>
  <div class="card mt16"><div class="tl">${i.log.map(l=>`<div class="st done"><span class="n">✓</span><b>${l.m}</b><small>${tstr(l.at)}</small></div>`).join('')}</div></div>
  <div class="sp"></div>${i.status!='resolved'?`<div class="mt16">${pill('Call 112 · Police','say:Calling 112…:Emergency services:call',{cls:'red',ic:'call'})}</div><div class="mt8">${pill('I\'m safe now · cancel alert','sossafe:'+i.id,{cls:'ctr',noarr:1}).replace('class="pill','style="background:var(--charcoal);color:#fff" class="pill')}</div>`:pill('Back to home','tab:home')}</div>`}};
ACT.sossafe=(a,id)=>incStep(S.incidents.find(i=>i.id==id),'resolved',meE().name);

/* ---------- Trips, alerts, safety, profile ---------- */
X.trips=()=>{const e=meE(),all=S.rides.filter(r=>r.emps.includes(e.id)).reverse();
  return {tab:'trips',h:`<div class="scroll"><div class="h1" style="font-size:44px;margin-top:6px">My trips</div><p class="gray mt4" style="font-size:12.5px">${all.length} rides · all paid by ${S.company.name}</p>${adWrap('e_trips','e','mt12')}
  <div class="mt16">${all.map(r=>{const from=r.type=='drop'?place(r.place).n:e.home.n,to=r.type=='drop'?e.home.n:place(r.place).n;return `<div class="card mb8 press" data-act="go:trip:${r.id}"><div class="row" style="font-size:12px;color:var(--gray)">${ms(VEH[r.veh].ic,'','font-size:17px')}${VEH[r.veh].n}<span class="sp"></span>${dayLabel(r.day)} · ${tstr(r.when)}</div><b style="display:block;font-size:15px;margin-top:6px">${from} → ${to}</b><div class="row mt8">${rideChip(r)}<span class="sp"></span><span class="gray" style="font-size:12px">${r.driver?DR(r.driver).name:''}</span></div></div>`}).join('')||'<div class="empty">No trips yet.</div>'}</div></div>`}};
X.alerts=()=>{S.unread['e:'+U.emp]=0;return {h:`${hd('Notifications')}<div class="scroll" style="padding-top:0">${notesList('e:'+U.emp)}</div>`}};
X.safety=()=>{const e=meE();return {c:'dk',tab:'safety',h:`<div class="scroll"><div class="h1" style="font-size:40px;margin-top:6px">Your safety,<br><span class="lime">one tap away.</span></div>
  <div style="padding:34px 0 30px"><button class="sosbtn press" data-act="sos">SOS</button></div><p class="gray" style="text-align:center;font-size:12px">Alerts ${first(S.manager.name)}, the Bingo safety desk and your trusted contact with your live location</p>
  <div class="sec">Trusted contact</div>
  ${e.ec.map(c=>`<div class="li"><span class="cbtn sm c">${ms('favorite','lime')}</span><div class="t"><b>${c.n}</b><small>+91 ${c.p}</small></div><span class="chip c">Gets live link</span></div>`).join('')}
  <div class="li press" data-act="say:Add a contact:You can add up to three trusted contacts:person_add"><span class="cbtn sm c">${ms('add')}</span><div class="t"><b>Add another contact</b></div></div>
  <div class="sec">On every ride</div>
  ${[['pin','OTP before boarding','The trip can\'t start without your code'],['badge','Verified driver','ID-checked and background-verified. Name, photo and plate shown before pickup'],['share_location','Live tracking','Your manager and trusted contact can follow the cab'],['phone_locked','Hidden phone number','Calls to and from the driver are masked'],['nightlight','Night rule','After 8 PM you are never the last drop when a male colleague shares the cab'],['timer','Ride check','We check on you if the cab stops for too long or leaves the route']].map(([i,t,s])=>`<div class="li"><span class="cbtn sm c">${ms(i,'lime')}</span><div class="t"><b>${t}</b><small style="white-space:normal">${s}</small></div></div>`).join('')}</div>`}};
X.profile=()=>{const e=meE();return {tab:'profile',h:`<div class="scroll"><div class="row" style="margin-top:6px">${av(e.name,'lg')}<div class="f1"><div class="disp" style="font-size:30px">${e.name}</div><div class="gray" style="font-size:12.5px">+91 ${e.phone}</div></div></div>
  <div class="card k mt16"><div class="row"><span class="cbtn g">${ms('apartment')}</span><div class="f1"><b>${S.company.name}</b><div class="gray" style="font-size:11.5px">${e.team} · ${e.shift} shift · linked by phone number</div></div>${ms('verified','lime')}</div></div>
  <div class="mt12">${[['home','Pickup point',e.home?e.home.n+' · '+e.home.a:'Not set','go:setup'],['favorite','Emergency contact',e.ec[0]?e.ec[0].n+' · +91 '+e.ec[0].p:'Not set','tab:safety'],['notifications','Notifications','Ride updates and reminders','go:alerts'],['translate','Language','English','say:Language:Hindi, Kannada, Tamil and Telugu are included at launch:translate'],['support_agent','Help','Chat with Bingo support','say:Support:Opens a chat with Bingo support:support_agent']].map(([i,t,s,act])=>`<div class="li press" data-act="${act}"><span class="cbtn sm">${ms(i)}</span><div class="t"><b>${t}</b><small>${s}</small></div>${ms('arrow_forward')}</div>`).join('')}</div>
  <div class="mt8">${pill('Log out','logout',{cls:'soft ctr sm',noarr:1})}</div><p class="gray" style="text-align:center;font-size:11px;margin-top:14px">Bingo Corporate · Employee v1.0</p></div>`}};
})();
