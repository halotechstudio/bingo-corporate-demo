'use strict';
/* ============================================================
   Driver app — accepts corporate rides, runs multi-stop trips,
   earns per ride and asks for withdrawals.
   ============================================================ */
(()=>{
const D=SC.d;
const share=r=>Math.round(r.fare*(1-S.cfg.comm/100));
const myRide=()=>{const d=meD();return d.ride?R(d.ride):null};

D.login=()=>SC.login('d',{tag:'DRIVER',head:'Steady corporate rides. <span class="lime">Paid on request.</span>',sub:'Use the number linked to your driving licence.',phone:meD().phone});
D.otp=()=>SC.otp('d',{phone:meD().phone,code:'6142'});
D.kyc=()=>{const d=meD();if(d.kyc=='approved'&&U.signed.d)return D.home();
  return {c:'dk',h:`<div class="scroll"><span class="tag d" style="margin-top:8px">Step 2 of 2 · Documents</span><div class="h1 mt16" style="font-size:40px">Under<br><span class="lime">review.</span></div>
  <p class="gray mt8" style="font-size:13px;line-height:1.5">Bingo checks every driver before the first ride. You'll get a notification as soon as you're approved.</p>
  <div class="mt16">${[['badge','Driving licence'],['directions_car','Vehicle RC'],['fingerprint','Aadhaar'],['shield','Police verification'],['account_balance','Bank account']].map(([i,t],n)=>`<div class="li"><span class="cbtn sm c">${ms(i,'lime')}</span><div class="t"><b>${t}</b><small>Uploaded</small></div><span class="chip ${n<3?'g':'c'}">${n<3?'Verified':'Checking'}</span></div>`).join('')}</div>
  <div class="card mt8"><div class="row">${ms('local_taxi','lime')}<div class="f1"><b>${d.car}</b><div class="gray" style="font-size:12px">${VEH[d.veh].n} · ${VEH[d.veh].seats} seats</div></div>${plate(d.plate)}</div></div></div>`}};

/* ---------- Home ---------- */
D.home=()=>{const d=meD();if(d.kyc!='approved')return D.kyc();
  return {c:'dk',tab:'home',h:`<div class="mapbg">${mapSvg({ar:.5,fit:[d],pad:150,cars:d.online?[{x:d.x,y:d.y,busy:true,ic:VEH[d.veh].ic}]:[]})}${d.online?'':'<div style="position:absolute;inset:0;background:rgba(0,0,0,.55)"></div>'}</div><div class="over">
    <div class="row" style="padding:6px 18px">${av(d.name,'lg')}<div class="f1"><div class="disp nw" style="font-size:24px;color:#fff">Hi, ${first(d.name)}</div><div class="gray nw" style="font-size:12px">${ms('star','lime','font-size:14px')} ${d.rating} · ${VEH[d.veh].n} · ${d.plate}</div></div><span class="chip ${d.online?'g':'c'}">${ms('circle','','font-size:9px')}${d.online?'ONLINE':'OFFLINE'}</span></div>
    ${d.online?'<div style="flex:1;display:grid;place-items:center;position:relative"><span class="pulse"></span></div>':''}
    <div class="sheet"><div class="disp" style="font-size:32px;font-weight:500">${d.online?'Finding rides<br>near you…':'You\'re offline.'}</div>
      <div class="tiles mt12"><div class="tile k"><b>${fmt(d.today.earn)}</b><small>Today</small></div><div class="tile"><b>${d.today.trips}</b><small>Rides</small></div><div class="tile press" data-act="tab:earnings"><b>${fmt(d.earn)}</b><small>Wallet</small></div></div>
      <div class="mt12">${adSlot('d_home','d')}</div>
      <div class="mt12">${d.online?slide('Go offline','donline','power_settings_new','dk'):slide('Go online','donline','power_settings_new')}</div></div></div>`}};
ACT.donline=()=>{const d=meD();if(d.state!='idle')return;d.online=!d.online};

/* ---------- Request ---------- */
D.request=()=>{const r=myRide();if(!r||r.status!='offered')return D.home();const d=meD(),t=Math.max(0,Math.ceil(r.offerT)),C=2*Math.PI*27;
  return {c:'dk',h:`<div class="scroll" style="display:flex;flex-direction:column"><div class="row" style="align-items:flex-start;margin-top:6px"><div class="f1"><span class="chip g">${ms(VEH[r.veh].ic)}CORPORATE · ${r.stops.length} STOPS</span><div class="disp mt12" style="font-size:44px">New ride!</div></div>
    <div class="ring"><svg width="64" height="64"><circle cx="32" cy="32" r="27" stroke="#2E2E2E" stroke-width="6" fill="none"/><circle cx="32" cy="32" r="27" stroke="#C7FF2E" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-t/20)}"/></svg><b>${t}</b></div></div>
    <div class="row mt8"><span class="big lime" style="font-size:64px">${fmt(share(r))}</span><div class="col" style="gap:4px"><span class="chip c">${ms('apartment')}Prepaid</span><span class="gray" style="font-size:11px">you earn</span></div></div>
    <div class="row mt12" style="gap:8px"><div class="card f1" style="padding:14px"><b class="disp" style="font-size:22px">${(md(d,r.stops[0].p)*KMU).toFixed(1)} km</b><div class="gray" style="font-size:11.5px">to first pickup</div></div><div class="card f1" style="padding:14px"><b class="disp" style="font-size:22px">${r.km} km</b><div class="gray" style="font-size:11.5px">${r.mins} min trip</div></div></div>
    <div class="mapbox mt8" style="height:120px">${rideMap(r,{ar:2.6,pad:55})}</div>
    <div class="card w mt8">${stopsTl(r)}<div class="row mt12" style="border-top:1px solid var(--soft);padding-top:10px;font-size:12px"><span class="av k sm">${ini(S.company.name)}</span><b class="f1">${S.company.name}</b><span class="gray">${r.emps.length} rider${r.emps.length>1?'s':''}</span></div></div>
    <div class="sp"></div><div class="mt12">${slide('Swipe to accept','daccept')}</div><a class="press" data-act="ddecline" style="text-align:center;color:var(--gray);font-size:13px;margin-top:10px">Decline</a></div>`}};
ACT.daccept=()=>{const r=myRide();if(r&&r.status=='offered')acceptRide(r)};
ACT.ddecline=()=>{const r=myRide();if(r&&r.status=='offered'){declineRide(r);root('d','home')}};

/* ---------- Trip (multi-stop) ---------- */
D.trip=()=>{const r=myRide();if(!r||r.status!='enroute')return D.home();const d=meD(),s=r.stops[r.leg],wait=r.phase=='wait',auto=autoFor(r);
  const who=s.emps.map(e=>first(E(e).name)).join(', ');
  let panel;
  if(!wait)panel=`<div class="row"><span class="av">${s.emps.length>1?s.emps.length:ini(E(s.emps[0]).name)}</span><div class="f1"><b class="nw" style="display:block">${s.k=='pickup'?'Pick up ':'Drop '}${who}</b><div class="gray" style="font-size:11.5px">${S.company.name} · prepaid</div></div><button class="cbtn c press" data-act="say:Chat:Message the rider without sharing numbers:chat">${ms('chat')}</button><button class="cbtn g press" data-act="say:Calling rider…:Masked call, numbers stay hidden:call">${ms('call')}</button></div>
     <div class="row mt12" style="align-items:baseline"><span class="big lime" style="font-size:54px">${etaTo(r,r.leg)}</span><span class="gray">min · ${(distToStop(r,r.leg)*KMU).toFixed(1)} km to ${s.k=='pickup'?'pickup':'drop'}</span></div>
     <div class="bar mt12"><i style="width:${(progress(r)*100).toFixed(0)}%"></i></div>
     <div class="mt12">${slide(s.k=='pickup'?'Arriving at pickup…':'Reaching drop…','noop',s.k=='pickup'?'place':'flag','locked')}</div>`;
  else if(s.k=='pickup'){const w=s.emps.filter(e=>r.board[e]=='waiting');
    panel=`<div class="disp" style="font-size:26px">${w.length?'Enter ride OTP':'All on board'}</div><div class="gray" style="font-size:12px">${w.length?'Ask each rider for the 4-digit code in their app':'Leaving for the next stop…'}</div>
     <div class="mt12">${s.emps.map(e=>{const b=r.board[e];return `<div style="margin-bottom:10px"><div class="row"><span class="av sm">${ini(E(e).name)}</span><b class="f1">${E(e).name}</b>${b=='in'?'<span class="chip g">'+ms('check')+'On board</span>':b=='noshow'?'<span class="chip red">No-show</span>':auto?'<span class="chip c">Verifying…</span>':''}</div>
       ${b=='waiting'&&!auto?`<div class="mt8">${otpBoxes('','k')}</div><div class="row mt8" style="gap:8px"><button class="pill sm press f1" data-act="dverify:${e}"><span class="t">Verify OTP</span><span class="arr">${ms('arrow_forward')}</span></button><button class="pill sm ctr press" style="width:auto;background:var(--charcoal);color:#fff" data-act="dnoshow:${e}">No-show</button></div>`:''}</div>`}).join('')}</div>`}
  else panel=`<div class="disp" style="font-size:26px">Drop ${who}</div><div class="gray" style="font-size:12px">${s.p.n} · ${s.p.a||''}</div>
     <div class="mt12">${auto?slide('Dropping…','noop','flag','locked'):slide('Confirm drop','ddrop','flag')}</div>`;
  return {c:'dk',h:`<div class="mapbg">${rideMap(r,{ar:.5,focus:r.leg,pad:110})}</div><div class="over">
    <div class="topcard"><div class="f1"><small style="letter-spacing:.6px">${s.k=='pickup'?'PICKUP':'DROP'} · STOP ${r.leg+1} OF ${r.stops.length}</small><b class="nw">${s.p.n}</b><small class="nw">${s.k=='pickup'?who+(wait?' · at the pickup point':' · waiting'):who}</small></div><button class="cbtn g press" style="width:54px;height:54px" data-act="say:Navigation:Opens turn-by-turn directions in Google Maps:navigation">${ms('navigation')}</button></div>
    <div class="panelk dk">${panel}
      <div class="row mt12" style="font-size:11.5px;color:var(--gray)"><span class="f1">${r.id} · ${r.stops.slice(r.leg+1).length} stop${r.stops.slice(r.leg+1).length==1?'':'s'} after this</span><a class="press" data-act="go:stops" style="color:var(--green);font-weight:600">All stops</a><a class="press" data-act="say:Safety desk:Bingo's safety desk is calling you:support_agent" style="color:#ff9a9a;font-weight:600;margin-left:10px">Emergency</a></div></div></div>`}};
D.stops=()=>{const r=myRide();if(!r)return D.home();return {c:'dk',h:`${hd('All stops',{dk:1})}<div class="scroll" style="padding-top:0"><div class="mapbox" style="height:200px">${rideMap(r,{ar:1.6,labels:true})}</div><div class="card mt8">${stopsTl(r)}</div>
  <div class="card mt8">${kv('Trip',r.id)}${kv('Company',S.company.name)}${kv('Distance',r.km+' km')}${kv('You earn',fmt(share(r)))}</div></div>`}};
ACT.dverify=(a,e)=>{const r=myRide();if(r)board(r,e)};
ACT.dnoshow=(a,e)=>{const r=myRide();if(r)noShow(r,e)};
ACT.ddrop=()=>{const r=myRide();if(r){r.dropOk=true;r.waitT=.3}};

/* ---------- Trip complete ---------- */
D.done=p=>{const r=R(p.id);if(!r)return D.home();
  return {c:'lm',h:`<div class="scroll" style="display:flex;flex-direction:column"><div class="row" style="margin-top:6px"><span class="cbtn k" style="width:56px;height:56px">${ms('check','lime','font-size:28px')}</span><span class="sp"></span><span class="chip">${r.km} km · ${r.stops.length} stops</span></div>
  <div class="h1 mt16" style="font-size:52px">Trip<br>complete.</div><div class="big mt8" style="font-size:80px">${fmt(r.share)}</div><p style="font-size:13px">added to your Bingo wallet</p>
  <div class="card k mt16">${kv('Riders dropped',r.emps.filter(e=>r.board[e]=='dropped').length+' of '+r.emps.length)}${kv('Distance',r.km+' km · '+r.stops.length+' stops')}${kv('Paid by','Bingo · corporate ride')}${kv('You earned',fmt(r.share),'tot')}</div>
  ${adWrap('d_done','d')}
  <div class="sp"></div><div class="mt16">${pill('Withdraw '+fmt(meD().earn),'go:withdraw',{cls:'dark',sub:'Wallet balance · ask Bingo to pay out'})}</div><div class="mt8">${pill('Back online','tab:home',{cls:'ctr',noarr:1})}</div></div>`}};

/* ---------- Earnings & withdrawals ---------- */
const wdTl=w=>{const s=w.status;return `<div class="row mt8" style="gap:4px">${s=='rejected'?'<span class="chip red">Rejected · back in wallet</span>':[['Requested',1],['Approved',s!='pending'],['Paid',s=='paid']].map(([l,on])=>`<span class="chip ${on?'g':'s'}" style="flex:1;justify-content:center">${l}</span>`).join('')}</div>`};
D.earnings=()=>{const d=meD(),mine=S.wds.filter(w=>w.drv==d.id),trips=S.rides.filter(r=>r.driver==d.id&&r.status=='completed').reverse();
  const week=[820,1240,960,1430,1100,1680,d.today.earn],mx=Math.max(...week,1);
  return {tab:'earnings',h:`<div style="background:var(--black);color:#fff;border-radius:36px;padding:20px 22px 22px;margin:0 8px;flex:none"><span class="tag d">Earnings</span>
    <div class="row mt12" style="align-items:flex-end"><div class="f1"><div class="gray" style="font-size:12.5px">Wallet balance</div><div class="big" style="font-size:54px">${fmt(d.earn)}</div></div><div style="text-align:right"><div class="gray" style="font-size:11.5px">Today</div><div class="big lime" style="font-size:24px">${fmt(d.today.earn)}</div></div></div>
    <div class="bars mt16" style="height:70px">${week.map((v,i)=>`<div class="${i==6?'g':''}" style="height:${Math.max(6,v/mx*100)}%;background:${i==6?'var(--green)':'var(--charcoal)'}"></div>`).join('')}</div>
    ${d.hold?`<div class="lime mt12" style="font-size:12px">${fmt(d.hold)} being paid out</div>`:''}</div>
  <div class="scroll"><div>${pill('Withdraw','go:withdraw',{sub:'To '+d.upi+' · paid after Bingo approves',dis:d.earn<100})}</div>
    ${mine.length?`<div class="sec">Payout requests</div>${mine.map(w=>`<div class="card mb8"><div class="row"><b class="f1">${w.id} · ${fmt(w.amt)}</b><span class="gray" style="font-size:11.5px">${dayLabel(w.day)} ${tstr(w.t)}</span></div><div class="gray" style="font-size:11.5px">to ${w.to}</div>${wdTl(w)}</div>`).join('')}`:''}
    ${adWrap('d_earn','d','mt12')}<div class="sec">Recent trips</div>${trips.map(r=>`<div class="li"><span class="cbtn sm">${ms(VEH[r.veh].ic)}</span><div class="t"><b class="nw">${rideTitle(r)}</b><small>${dayLabel(r.day)} ${tstr(r.when)} · ${r.km} km · ${r.emps.length} rider${r.emps.length>1?'s':''}</small></div><b class="disp" style="font-size:18px">${fmt(r.share)}</b></div>`).join('')||'<div class="empty">Completed trips show up here.</div>'}</div>`}};
D.withdraw=()=>{const d=meD(),f=U.wdFrac||1,m=U.wdMeth||'upi',amt=Math.floor(d.earn*f);
  return {h:`${hd('Withdraw')}<div class="scroll" style="padding-top:0"><div class="gray" style="font-size:12.5px">You'll receive</div><div class="big" style="font-size:64px;margin:4px 0 4px">${fmt(amt)}</div><div class="gray" style="font-size:12px">Wallet balance ${fmt(d.earn)}</div>
  <div class="seg mt16">${[[1,'Everything'],[.5,'Half'],[.25,'A quarter']].map(([v,l])=>`<button class="${f==v?'on':''}" data-act="wdfrac:${v}">${l}</button>`).join('')}</div>
  <div class="sec">Send to</div>
  ${[['upi','qr_code_2','UPI',d.upi+' · arrives in minutes'],['bank','account_balance','Bank account',d.bank+' · IMPS']].map(([k,i,t,s])=>`<div class="li press ${m==k?'sel':''}" data-act="wdmeth:${k}"><span class="cbtn sm ${m==k?'g':'w'}">${ms(i)}</span><div class="t"><b>${t}</b><small>${s}</small></div><span class="ck">${ms('check')}</span></div>`).join('')}
  <div class="card line mt8"><div class="row" style="align-items:flex-start">${ms('info','','font-size:17px')}<span style="font-size:12px;line-height:1.5">Bingo gets your request right away and pays it out. You'll see each step here and get a notification when the money lands.</span></div></div></div>
  <div class="foot">${pill('Request '+fmt(amt),'wdsend',{dis:amt<100,sub:amt<100?'Minimum ₹100':'No fees'})}</div>`}};
ACT.wdfrac=(a,v)=>U.wdFrac=+v;ACT.wdmeth=(a,m)=>U.wdMeth=m;
ACT.wdsend=()=>{const d=meD(),w=withdraw(d,d.earn*(U.wdFrac||1),(U.wdMeth||'upi')=='upi'?d.upi:d.bank);if(w){root('d','earnings');ptoast('d','Request sent to Bingo',w.id+' · you\'ll be notified when it is paid','hourglass_top')}};

/* ---------- Alerts & profile ---------- */
D.alerts=()=>{S.unread['d:'+U.drv]=0;return {tab:'alerts',h:`<div class="hd"><h2>Notifications</h2></div><div class="scroll" style="padding-top:0">${notesList('d:'+U.drv)}</div>`}};
D.profile=()=>{const d=meD();return {tab:'profile',h:`<div class="scroll"><div class="row" style="margin-top:6px">${av(d.name,'lg')}<div class="f1"><div class="disp" style="font-size:30px">${d.name}</div><div class="gray" style="font-size:12.5px">+91 ${d.phone}</div></div></div>
  <div class="tiles mt16"><div class="tile k"><b>${d.rating||'New'}</b><small>Rating</small></div><div class="tile"><b>${d.trips}</b><small>Rides</small></div><div class="tile"><b>98%</b><small>Acceptance</small></div></div>
  <div class="card k mt12"><div class="row"><span class="cbtn g" style="width:56px;height:56px">${ms(VEH[d.veh].ic,'','font-size:28px')}</span><div class="f1"><b>${VEH[d.veh].n} · ${VEH[d.veh].seats} seats</b><div class="gray" style="font-size:12px">${d.car}</div><div class="mt8">${plate(d.plate)}</div></div></div></div>
  ${(b=>b?`<div class="card g mt12"><div class="row">${ms('directions_car','','font-size:26px')}<div class="f1"><b>Cab branding · ${b.adv}</b><div style="font-size:12px">You get ${fmt(b.share)} a month for carrying the branding</div></div></div></div>`:'')(S.brand.find(b=>b.cars.includes(d.id)))}
  <div class="mt12">${[['folder_shared','Documents',d.kyc=='approved'?'Licence, RC, ID and police check verified':'Under review','go:kyc'],['account_balance','Payout account',d.upi+' · '+d.bank,'go:withdraw'],['shield','Insurance','Accident cover ₹5 lakh active','say:Insurance:Policy BG-INS-2026-0412:shield'],['support_agent','Driver support','24/7 · Kannada, Hindi, English','say:Support:Opens a chat with Bingo driver support:support_agent'],['sos','Emergency','Call the Bingo safety desk','say:Safety desk:Bingo\'s safety desk is calling you:support_agent']].map(([i,t,s,act])=>`<div class="li press" data-act="${act}"><span class="cbtn sm">${ms(i)}</span><div class="t"><b>${t}</b><small>${s}</small></div>${ms('arrow_forward')}</div>`).join('')}</div>
  <div class="mt8">${pill('Log out','logout',{cls:'soft ctr sm',noarr:1})}</div><p class="gray" style="text-align:center;font-size:11px;margin-top:14px">Bingo Corporate · Driver v1.0</p></div>`}};
})();
