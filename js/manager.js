'use strict';
/* ============================================================
   Manager app — books and pays for employee rides.
   ============================================================ */
(()=>{
const M=SC.m;
const greet=()=>{const h=(S.now/60|0)%24;return h<12?'Good morning':h<17?'Good afternoon':'Good evening'};
const tripNames={pickup:['Pick up to office','Homes → office','login'],drop:['Drop home','Office → homes','logout'],custom:['Custom trip','Offsite, airport, event','flight_takeoff']};
const whenText=r=>(r.status=='scheduled'||r.day!=0?dayLabel(r.day)+' · ':'')+tstr(r.when);
const names=(ids,n=3)=>ids.slice(0,n).map(e=>first(E(e).name)).join(', ')+(ids.length>n?' +'+(ids.length-n):'');
const openInc=()=>S.incidents.filter(i=>i.status!='resolved');

/* ---------- Sign in ---------- */
function login(a,o){return {c:'dk',h:`<div class="col" style="flex:1;min-height:0"><div class="row" style="padding:10px 22px">${mark(44)}<span class="disp" style="font-size:26px;font-weight:800">bingo</span><span class="chip c">${o.tag}</span></div>
  <div class="f1" style="display:flex;flex-direction:column;justify-content:center;padding:0 24px;gap:18px"><div class="disp" style="font-size:44px">${o.head}</div>${adSlot('splash',a)}</div>
  <div class="sheet"><div class="disp" style="font-size:28px">Your number</div><p class="gray mt4" style="font-size:12.5px">${o.sub}</p>
  <div class="row mt16"><span class="av k" style="width:56px;height:56px;font-size:14px;font-family:Inter">+91</span><div class="field f1">${o.phone}</div></div>
  <div class="mt12">${pill('Continue','go:otp',{sub:'We\'ll text you a 4-digit code'})}</div>
  <p class="gray mt12" style="font-size:11px;text-align:center">No passwords. Your phone number is your account.</p></div></div>`}}
function otp(a,o){return {h:`<div class="scroll">${backBtn()}<div class="h1 mt20">Enter<br>code.</div><p class="gray mt8">Sent to +91 ${o.phone}</p>
  <div class="mt20">${otpBoxes(o.code)}</div><p class="gray mt12" style="font-size:12px">${ms('sms','','font-size:15px')} Code read from SMS automatically · Resend in 0:24</p></div>
  <div class="foot">${pill('Verify & continue','signin')}</div>`}}
SC.login=login;SC.otp=otp;
M.login=()=>login('m',{tag:'MANAGER',head:'Move your <span class="lime">whole team</span> in a few taps.',sub:'Use the number your company registered with Bingo.',phone:S.manager.phone});
M.otp=()=>otp('m',{phone:S.manager.phone,code:'4821'});
ACT.signin=a=>{U.signed[a]=true;if(a=='m')root('m','home');else if(a=='e')enterEmp();else root('d',meD().kyc=='approved'?'home':'kyc')};

/* ---------- Home ---------- */
function rideCard(r){
  const d=r.driver&&DR(r.driver);
  return `<div class="card press mb8" data-act="go:ride:${r.id}"><div class="row"><span class="cbtn sm k">${ms(VEH[r.veh].ic)}</span><div class="f1"><b class="nw" style="display:block">${names(r.emps)}</b><small class="gray nw" style="display:block;font-size:11.5px">${r.id} · ${rideTitle(r)}</small></div>${rideChip(r)}</div>
    ${r.status=='enroute'?`<div class="bar mt12"><i style="width:${(progress(r)*100).toFixed(0)}%"></i></div>`:''}
    <div class="row mt8" style="font-size:12px;justify-content:space-between"><span class="gray nw">${d?d.name+' · '+d.plate:r.status=='scheduled'?whenText(r)+(r.repeat?' · repeats '+r.repeat:''):'Notifying drivers nearby…'}</span><b>${fmt(r.fare)}</b></div></div>`;
}
M.home=()=>{
  const lv=live(), sch=S.rides.filter(r=>r.status=='scheduled'), inc=openInc();
  return {tab:'home',h:`<div class="scroll">
    <div class="row" style="align-items:flex-start;margin-top:6px"><div class="h1 f1" style="font-size:38px">${greet()},<br>${first(S.manager.name)}</div><div class="col" style="gap:8px;align-items:center"><span class="av lg">${ini(S.manager.name)}</span>${bell('m')}</div></div>
    <p class="gray mt8" style="font-size:12.5px">${S.company.name} · ${S.manager.role}</p>
    ${inc.length?`<div class="card press mt12" style="background:var(--sos);color:#fff" data-act="go:incident:${inc[0].id}"><div class="row">${ms('sos','','font-size:28px')}<div class="f1"><b>SOS from ${E(inc[0].emp).name}</b><div style="font-size:12px;opacity:.9">Tap to see live location and call now</div></div>${ms('arrow_forward')}</div></div>`:''}
    <div class="card k mt12"><div class="row"><div class="f1"><div class="gray" style="font-size:12px">Company wallet</div><div class="big lime" style="font-size:42px;margin-top:4px">${fmt(S.wallet)}</div></div><button class="chip g press" data-act="go:addMoney">${ms('add')}Add money</button></div>
      <div class="row mt12" style="font-size:11.5px;color:var(--gray)">${ms('bolt','','font-size:15px;color:var(--green)')}Rides are paid from here the moment you book${S.wallet<S.cfg.lowBal?' · <b style="color:#ffb0b0">low balance</b>':''}</div></div>
    <div class="mt12">${pill('Book rides','newbook',{sub:'Pick up, drop home or a custom trip'})}</div>
    <div class="tiles mt12"><div class="tile press" data-act="mrtab:live"><b>${lv.length}</b><small>Live now</small></div><div class="tile press" data-act="mrtab:sched"><b>${sch.length}</b><small>Scheduled</small></div><div class="tile press" data-act="tab:team"><b>${S.emps.filter(e=>e.status=='active').length}</b><small>People</small></div></div>
    ${lv.length?`<div class="sec">Happening now <a data-act="mrtab:live">See all</a></div>${lv.slice(0,3).map(rideCard).join('')}`:''}
    ${sch.length?`<div class="sec">Coming up <a data-act="mrtab:sched">See all</a></div>${sch.slice(0,2).map(rideCard).join('')}`:''}
    <div class="mt16">${adSlot('m_home','m')}</div>
    <div class="row mt12" style="gap:8px"><div class="card f1 press" data-act="go:safety">${ms('shield')}<b style="display:block;margin-top:8px">Safety centre</b><small class="gray" style="font-size:11.5px">${inc.length?inc.length+' open alert':'All rides safe'}</small></div><div class="card f1 press" data-act="go:reports">${ms('insights')}<b style="display:block;margin-top:8px">Reports</b><small class="gray" style="font-size:11.5px">Spend and savings</small></div></div>
  </div>`};
};
ACT.mrtab=(a,t)=>{U.mrTab=t;root('m','rides')};

/* ---------- Team & onboarding ---------- */
M.team=()=>{
  const t=U.teamTab||'all', req=S.emps.filter(e=>e.status=='request');
  const list=S.emps.filter(e=>t=='all'||e.status==t);
  const row=e=>`<div class="li" data-find="${e.name.toLowerCase()} ${e.phone} ${e.team.toLowerCase()}">${av(e.name,e.status=='active'?'':'s')}<div class="t press" data-act="go:emp:${e.id}"><b>${e.name}</b><small class="nw">${e.status=='active'?e.team+' · '+e.home.n:e.status=='invited'?'Invite sent · +91 '+e.phone:'Joined with company code · wants access'}</small></div>
    ${e.status=='request'?`<button class="cbtn sm g press" data-act="approve:${e.id}">${ms('check')}</button><button class="cbtn sm press" data-act="decline:${e.id}">${ms('close')}</button>`:e.status=='invited'?'<span class="chip am">Invited</span>':`<span class="gray" style="font-size:11px">${e.shift}</span>`}</div>`;
  return {tab:'team',h:`<div class="hd"><h2>Team</h2><button class="cbtn g press" data-act="go:teamAdd">${ms('person_add')}</button></div><div class="scroll" style="padding-top:0">
    <div class="field" style="height:48px">${ms('search','gray')}<input id="teamq" data-filter placeholder="Search name, number or team"></div>
    <div class="seg mt12">${[['all','All',S.emps.length],['active','Active',S.emps.filter(e=>e.status=='active').length],['invited','Invited',S.emps.filter(e=>e.status=='invited').length],['request','Requests',req.length]].map(([k,l,n])=>`<button class="${t==k?'on':''}" data-act="teamtab:${k}">${l}<span class="n">${n}</span></button>`).join('')}</div>
    <div class="mt12">${list.map(row).join('')||'<div class="empty">Nobody here yet.</div>'}</div>
    <div class="card line mt8"><b>${ms('lightbulb','','font-size:17px')} How people join</b><p class="gray mt4" style="font-size:12px;line-height:1.5">Add a name and mobile number. They sign in with that number and are linked to ${S.company.name} automatically, then add their own pickup address and emergency contact.</p></div>
  </div>`};
};
ACT.teamtab=(a,t)=>U.teamTab=t;
ACT.approve=(a,id)=>{const e=E(id);e.status='active';if(!e.ec.length)e.ec=[{n:'Emergency contact',p:'98450 •••• 31'}];ptoast('m',first(e.name)+' approved','They can now be booked on rides','how_to_reg');note('e:'+id,{ic:'how_to_reg',t:'You\'re in',b:S.manager.name+' approved your request to join '+S.company.name+'.'});feed('how_to_reg',S.manager.name+' approved '+e.name)};
ACT.decline=(a,id)=>{S.emps=S.emps.filter(e=>e.id!=id);ptoast('m','Request declined','','block')};
M.teamAdd=()=>({h:`${hd('Add people')}<div class="scroll" style="padding-top:0">
  <div class="card"><b>Add one person</b><div class="field mt12" style="background:#fff">${ms('person','gray')}<input id="newName" placeholder="Full name" value="Tanvi Bhat"></div><div class="field mt8" style="background:#fff"><span class="gray">+91</span><input id="newPhone" placeholder="Mobile number" value="98801 10013" inputmode="numeric"></div>
    <div class="seg mt12">${['Design','Engineering','Sales','Support'].map(t=>`<button class="${(U.newTeam||'Design')==t?'on':''}" data-act="newteam:${t}">${t}</button>`).join('')}</div>
    <div class="mt12">${pill('Send invite by SMS','addone',{cls:'sm'})}</div></div>
  <div class="li press mt12" data-act="go:teamBulk"><span class="cbtn g">${ms('upload_file')}</span><div class="t"><b>Upload a sheet</b><small>Excel or CSV with name and number · add hundreds at once</small></div>${ms('arrow_forward')}</div>
  <div class="li press" data-act="go:teamInvite"><span class="cbtn g">${ms('qr_code_2')}</span><div class="t"><b>Share company code or QR</b><small>People join themselves · you approve each request</small></div>${ms('arrow_forward')}</div>
  <div class="li press" data-act="say:HRMS sync:Connects to Keka, Darwinbox or Zoho People so joiners and leavers update on their own:sync"><span class="cbtn">${ms('sync')}</span><div class="t"><b>Sync from your HR system</b><small>Joiners and leavers update automatically</small></div><span class="chip s">Add-on</span></div>
  <div class="card k mt8"><b>${ms('verified_user','lime','font-size:17px')} You never type addresses</b><p style="font-size:12px;line-height:1.5;color:#bdbdbd;margin-top:6px">Each person confirms their own pickup point on a map and adds an emergency contact when they first sign in. You only see who is ready to be booked.</p></div></div>`});
ACT.newteam=(a,t)=>U.newTeam=t;
ACT.addone=()=>{const n=($('#newName')||{}).value||'New Joiner',p=($('#newPhone')||{}).value||'98801 10099';const e=addEmp(n.trim(),p.trim(),U.newTeam||'Design','F');back('m');U.teamTab='invited';ptoast('m','Invite sent to '+first(e.name),'SMS with the app link went to +91 '+e.phone,'sms')};
const BULK=[['Aditya Rao','98801 10021','Engineering','M'],['Shreya Pillai','98801 10022','Engineering','F'],['Mohammed Irfan','98801 10023','Support','M'],['Lavanya K','98801 10024','Finance','F']];
M.teamBulk=()=>({h:`${hd('Upload a sheet')}<div class="scroll" style="padding-top:0">
  <div class="card g"><div class="row">${ms('description','','font-size:30px')}<div class="f1"><b>acme-new-joiners.xlsx</b><div style="font-size:12px">5 rows read · 4 ready · 1 skipped</div></div>${ms('check_circle')}</div></div>
  <div class="sec">Preview</div>
  ${BULK.map(b=>`<div class="li">${av(b[0],'s')}<div class="t"><b>${b[0]}</b><small>+91 ${b[1]} · ${b[2]}</small></div><span class="ck on">${ms('check')}</span></div>`).join('')}
  <div class="li" style="opacity:.6">${av('Rahul Verma','s')}<div class="t"><b>Rahul Verma</b><small>+91 98801 10002 · already on your team</small></div><span class="chip s">Skipped</span></div>
  <p class="gray" style="font-size:11.5px;margin:6px 4px">Need the format? Two columns are enough: Name, Mobile. Team and shift are optional.</p></div>
  <div class="foot">${pill('Invite 4 people','bulkadd',{sub:'Each gets an SMS with the app link'})}</div>`});
ACT.bulkadd=()=>{BULK.forEach(b=>{if(!S.emps.some(e=>e.phone==b[1]))addEmp(...b)});root('m','team');U.teamTab='invited';ptoast('m','4 invites sent','They appear as Active once they sign in','sms')};
const qr=()=>{let r=42,s='';const q=()=>((r=(r*9301+49297)%233280)/233280);for(let y=0;y<21;y++)for(let x=0;x<21;x++){const c=(x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13);const on=c?((x%6==0||y%6==0||(x>1&&x<5&&y>1&&y<5)||(x>15&&x<19&&y>1&&y<5)||(x>1&&x<5&&y>15&&y<19))&&!(x==7||y==7)):q()>.5;if(on)s+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}return `<svg viewBox="0 0 21 21" width="126" height="126" shape-rendering="crispEdges">${s}</svg>`};
M.teamInvite=()=>({c:'dk',h:`${hd('Company code',{dk:1})}<div class="scroll" style="padding-top:0;text-align:center">
  <p class="gray" style="font-size:12.5px">Share this with your team. They install Bingo, sign in with their number and enter the code.</p>
  <div class="qr mt20">${qr()}</div>
  <div class="disp lime mt16" style="font-size:40px;letter-spacing:2px">${S.company.code}</div>
  <p class="gray mt4" style="font-size:12px">bingo.in/join/${S.company.code.toLowerCase()}</p>
  <div class="row mt20" style="gap:8px">${pill('Share link','say:Link copied:Paste it in your team chat or email:link',{cls:'sm'})}</div>
  <div class="card mt16" style="text-align:left"><b>${ms('admin_panel_settings','lime','font-size:17px')} You stay in control</b><p style="font-size:12px;line-height:1.5;color:#bdbdbd;margin-top:6px">Anyone who joins with the code waits in Requests until you approve them. People you invited by number are linked instantly.</p></div></div>`});
M.emp=p=>{const e=E(p.id);if(!e)return {h:hd('Person')};const rs=S.rides.filter(r=>r.emps.includes(e.id)&&r.status=='completed').length;
  return {h:`${hd('')}<div class="scroll" style="padding-top:0"><div class="row">${av(e.name,'lg')}<div class="f1"><div class="disp" style="font-size:30px">${e.name}</div><div class="gray" style="font-size:12.5px">+91 ${e.phone}</div></div></div>
  <div class="tiles mt16"><div class="tile k"><b>${rs}</b><small>Rides</small></div><div class="tile"><b>${e.team}</b><small>Team</small></div><div class="tile"><b>${e.shift}</b><small>Shift</small></div></div>
  <div class="card mt12">${kv('Status',e.status=='active'?'Active':e.status=='invited'?'Invited · not signed in yet':'Waiting for approval')}${kv('Pickup point',e.home?e.home.n+' · '+e.home.a:'Not added yet')}${kv('Emergency contact',e.ec[0]?e.ec[0].n+' · '+e.ec[0].p:'Not added yet')}${kv('Linked by',e.status=='request'?'Company code':'Phone number')}</div>
  <div class="mt12">${e.status=='active'?pill('Book a ride for '+first(e.name),'bookfor:'+e.id):e.status=='invited'?pill('Resend invite SMS','say:Invite sent again:SMS went to +91 '+e.phone+':sms'):pill('Approve','approve:'+e.id)}</div>
  <div class="mt8">${pill('Remove from team','say:Removed:They can no longer be booked on company rides:person_remove',{cls:'soft ctr',noarr:1})}</div></div>`}};
ACT.bookfor=(a,id)=>{newDraft('pickup');S.draft.sel=[id];root('m','home');go('m','book1')};

/* ---------- Booking ---------- */
ACT.newbook=()=>{newDraft('pickup');go('m','book1')};
M.book1=()=>{const D=S.draft||(newDraft(),S.draft);const pls=D.type=='custom'?VENUES:OFFICES;
  if(!pls[D.place])D.place=Object.keys(pls)[0];
  return {h:`${hd('New booking',{right:'<span class="chip s">1 of 4</span>'})}<div class="scroll" style="padding-top:0">
  <div class="sec" style="margin-top:4px">What kind of trip?</div>
  ${Object.entries(tripNames).map(([k,v])=>`<div class="li press ${D.type==k?'sel':''}" data-act="dtype:${k}"><span class="cbtn ${D.type==k?'g':'w'}">${ms(v[2])}</span><div class="t"><b>${v[0]}</b><small>${v[1]}</small></div><span class="ck">${ms('check')}</span></div>`).join('')}
  <div class="sec">${D.type=='drop'?'Leaving from':'Going to'}</div>
  ${Object.values(pls).map(o=>`<div class="li press ${D.place==o.id?'sel':''}" data-act="dplace:${o.id}"><span class="cbtn ${D.place==o.id?'g':'w'}">${ms(o.ic)}</span><div class="t"><b>${o.n}</b><small>${o.a}</small></div><span class="ck">${ms('check')}</span></div>`).join('')}
  <div class="sec">When?</div>
  <div class="seg"><button class="${D.now?'on':''}" data-act="dnow:1">${ms('bolt','','font-size:15px')} Leave now</button><button class="${D.now?'':'on'}" data-act="dnow:0">${ms('event','','font-size:15px')} Schedule</button></div>
  ${D.now?'':`<div class="card mt12"><div class="seg">${[0,1,2,3].map(d=>`<button class="${D.day==d?'on':''}" data-act="dday:${d}">${d<2?dayLabel(d):['Wed','Thu'][d-2]}</button>`).join('')}</div>
    <div class="row mt12" style="justify-content:center;gap:16px"><button class="cbtn w press" data-act="dtime:-15">${ms('remove')}</button><div class="big" style="font-size:38px;min-width:150px;text-align:center">${tstr(D.when)}</div><button class="cbtn w press" data-act="dtime:15">${ms('add')}</button></div>
    <div class="seg mt12" style="justify-content:center">${[['Login 9:00',540],['Logout 6:30',1110],['Night 10:30',1350]].map(([l,t])=>`<button class="${D.when==t?'on':''}" data-act="dset:${t}">${l}</button>`).join('')}</div>
    <div class="row mt12" style="justify-content:space-between"><div><b>Repeat every weekday</b><div class="gray" style="font-size:11.5px">Books Mon–Fri until you stop it</div></div>${sw(D.repeat,'drep')}</div></div>`}
  </div><div class="foot">${pill('Choose people','go:book2',{sub:tripNames[D.type][0]+' · '+(D.now?'now':dayLabel(D.day)+' '+tstr(D.when))})}</div>`}};
ACT.dtype=(a,t)=>{S.draft.type=t;S.draft.place=t=='custom'?'air':'hq'};
ACT.dplace=(a,p)=>S.draft.place=p;
ACT.dnow=(a,v)=>{const D=S.draft;D.now=v=='1';if(D.now){D.when=Math.ceil((S.now+5)/5)*5;D.day=0;D.repeat=false}else if(D.when<S.now+30)D.when=1110};
ACT.dday=(a,d)=>S.draft.day=+d;
ACT.dtime=(a,m)=>{S.draft.when=Math.max(0,Math.min(1425,S.draft.when+ +m))};
ACT.dset=(a,t)=>S.draft.when=+t;
ACT.drep=()=>S.draft.repeat=!S.draft.repeat;
M.book2=()=>{const D=S.draft;if(!D)return M.home();const teams=['All',...new Set(S.emps.map(e=>e.team))];
  const list=S.emps.filter(e=>D.team=='All'||e.team==D.team), ok=list.filter(e=>e.status=='active');
  const allOn=ok.length&&ok.every(e=>D.sel.includes(e.id));
  return {h:`${hd('Who\'s riding?',{right:'<span class="chip s">2 of 4</span>'})}<div class="scroll" style="padding-top:0">
  <div class="seg" style="flex-wrap:nowrap;overflow-x:auto">${teams.map(t=>`<button class="${D.team==t?'on':''}" data-act="dteam:${t}">${t}</button>`).join('')}</div>
  <div class="row mt12" style="justify-content:space-between;padding:0 4px"><b>${D.sel.length} selected</b><a class="press" data-act="dall" style="font-size:12.5px;font-weight:600;text-decoration:underline">${allOn?'Clear':'Select all'}</a></div>
  <div class="mt8">${list.map(e=>e.status=='active'?`<div class="li press ${D.sel.includes(e.id)?'sel':''}" data-act="dsel:${e.id}">${av(e.name)}<div class="t"><b>${e.name}</b><small>${e.team} · ${e.home.n} · ${(md(e.home,place(D.place))*KMU).toFixed(1)} km</small></div><span class="ck">${ms('check')}</span></div>`
    :`<div class="li" style="opacity:.5">${av(e.name,'s')}<div class="t"><b>${e.name}</b><small>${e.status=='invited'?'Has not signed in yet · no pickup point':'Waiting for your approval'}</small></div></div>`).join('')}</div>
  </div><div class="foot">${pill('See smart plan','go:book3',{dis:!D.sel.length,sub:D.sel.length?D.sel.length+' people · we group same-route riders':'Pick at least one person'})}</div>`}};
ACT.dteam=(a,t)=>S.draft.team=t;
ACT.dsel=(a,id)=>{const s=S.draft.sel,i=s.indexOf(id);i<0?s.push(id):s.splice(i,1)};
ACT.dall=()=>{const D=S.draft,ok=S.emps.filter(e=>(D.team=='All'||e.team==D.team)&&e.status=='active').map(e=>e.id);const all=ok.every(e=>D.sel.includes(e));D.sel=all?D.sel.filter(e=>!ok.includes(e)):[...new Set([...D.sel,...ok])]};
function planCard(p,i,D){
  const fake={stops:p.stops,type:D.type,status:'scheduled',veh:p.veh};
  return `<div class="card mb8"><div class="row"><span class="cbtn k">${ms(VEH[p.veh].ic)}</span><div class="f1"><b>Cab ${i+1} · ${VEH[p.veh].n}</b><div class="gray" style="font-size:11.5px">${p.emps.length} rider${p.emps.length>1?'s':''} · ${p.stops.length} stops · ${p.km} km · ${p.mins} min</div></div><div class="big" style="font-size:24px">${fmt(p.fare)}</div></div>
    <div class="mapbox mt12" style="height:128px">${rideMap(fake,{ar:2.5,pad:55,labels:true})}</div>
    <div class="mt12">${stopsTl(fake)}</div>
    ${p.pooled?`<div class="row mt12" style="justify-content:space-between"><span class="chip g">${ms('savings')}Saves ${fmt(Math.max(0,p.solo-p.fare))} by sharing</span><a class="press" data-act="dsplit:${p.key}" style="font-size:12px;font-weight:600;text-decoration:underline">Use separate cabs</a></div>`:p.canSplit?`<div class="row mt12" style="justify-content:flex-end"><a class="press" data-act="dsplit:${p.key}" style="font-size:12px;font-weight:600;text-decoration:underline">Share one cab again</a></div>`:''}
    ${p.note?`<div class="row mt12" style="background:#fff;border-radius:18px;padding:10px 12px;font-size:11.5px;align-items:flex-start">${ms('shield','','font-size:17px;color:#6b9400')}<span>${p.note}</span></div>`:''}</div>`;
}
M.book3=()=>{const D=S.draft;if(!D)return M.home();const P=planRides(D);
  return {h:`${hd('Smart plan',{right:'<span class="chip s">3 of 4</span>'})}<div class="scroll" style="padding-top:0">
  <div class="card k"><div class="disp" style="font-size:30px">${P.cabs} cab${P.cabs>1?'s':''} for <span class="lime">${P.people} people</span></div>
    <p style="font-size:12.5px;color:#bdbdbd;margin-top:6px">${P.saved>0?'People on the same route share one cab with several stops. You save <b class="lime">'+fmt(P.saved)+'</b> against '+P.people+' separate cabs.':'Everyone gets their own cab.'}</p>
    <div class="row mt12" style="justify-content:space-between"><span style="font-size:13px;font-weight:600">Share cabs on the same route</span>${sw(D.pool,'dpool')}</div></div>
  <div class="mt12">${P.rides.map((p,i)=>planCard(p,i,D)).join('')}</div>
  </div><div class="foot">${pill('Review & pay '+fmt(P.total),'go:book4')}</div>`}};
ACT.dpool=()=>{S.draft.pool=!S.draft.pool;S.draft.split=[]};
ACT.dsplit=(a,k)=>{const s=S.draft.split,i=s.indexOf(k);i<0?s.push(k):s.splice(i,1)};
M.book4=()=>{const D=S.draft;if(!D)return M.home();const P=planRides(D),ok=S.wallet>=P.total;
  return {h:`${hd('Review & pay',{right:'<span class="chip s">4 of 4</span>'})}<div class="scroll" style="padding-top:0">
  <div class="card">${kv('Trip',tripNames[D.type][0])}${kv(D.type=='drop'?'From':'To',place(D.place).n)}${kv('When',D.now?'Now · '+tstr(S.now):dayLabel(D.day)+' · '+tstr(D.when)+(D.repeat?' · every weekday':''))}${kv('People',P.people)}</div>
  <div class="card mt8">${P.rides.map((p,i)=>kv('Cab '+(i+1)+' · '+VEH[p.veh].n+' · '+names(p.emps,2),fmt(p.fare))).join('')}${P.saved?kv('Saved by sharing','− '+fmt(P.saved)):''}${kv('Total',fmt(P.total),'tot')}</div>
  <div class="card k mt8">${kv('Wallet balance',fmt(S.wallet))}${kv('After this booking',ok?fmt(S.wallet-P.total):'Short by '+fmt(P.total-S.wallet))}</div>
  <div class="row mt12" style="font-size:11.5px;color:var(--gray);align-items:flex-start;padding:0 4px">${ms('info','','font-size:16px')}<span>The fare is paid to Bingo from your wallet now. Cancel any cab before pickup and the full fare returns to the wallet.</span></div>
  </div><div class="foot">${ok?pill('Pay '+fmt(P.total)+' from wallet','paybook',{sub:'Everyone gets their cab details at once'}):pill('Add money to continue','go:addMoney',{cls:'dark',sub:'Wallet is short by '+fmt(P.total-S.wallet)})}</div>`}};
ACT.paybook=()=>{const bk=payBooking();if(bk){root('m','home');go('m','bookDone',{id:bk.id})}};
M.bookDone=p=>{const bk=S.bookings.find(b=>b.id==p.id)||S.bookings[S.bookings.length-1];const rs=bk?bk.rides.map(R):[];const n=rs.reduce((s,r)=>s+r.emps.length,0);
  return {c:'lm',h:`<div class="scroll" style="display:flex;flex-direction:column"><span class="cbtn k" style="width:60px;height:60px;margin-top:10px">${ms('check','lime','font-size:30px')}</span>
  <div class="h1 mt20" style="font-size:54px">Booked.</div><p class="mt8" style="font-size:14px">${rs.length} cab${rs.length>1?'s':''} for ${n} ${n>1?'people':'person'} · ${bk?bk.id:''}</p>
  <div class="card k mt20">${kv('Paid from wallet',fmt(bk?bk.total:0))}${kv('Wallet now',fmt(S.wallet))}${kv('Starts',rs[0]&&rs[0].status=='scheduled'?whenText(rs[0]):'Now · finding drivers')}</div>
  <div class="card w mt8"><b>${ms('notifications_active','','font-size:17px')} Everyone has been told</b><p class="gray mt4" style="font-size:12px;line-height:1.5">${n>1?'Each rider':'Your rider'} got a notification. Driver name, vehicle number, OTP and live ETA follow as soon as a driver accepts.</p></div>
  ${adWrap('m_done','m','mt12')}<div class="sp"></div><div class="mt16">${pill('Track rides','mrtab:'+(rs[0]&&rs[0].status=='scheduled'?'sched':'live'),{cls:'dark'})}</div><div class="mt8">${pill('Back to home','tab:home',{cls:'ctr',noarr:1})}</div></div>`}};

/* ---------- Rides ---------- */
M.rides=()=>{const t=U.mrTab||'live';const sets={live:live(),sched:S.rides.filter(r=>r.status=='scheduled'),past:S.rides.filter(r=>['completed','cancelled'].includes(r.status)).reverse()};
  return {tab:'rides',h:`<div class="hd"><h2>Rides</h2><button class="cbtn g press" data-act="newbook">${ms('add')}</button></div><div class="scroll" style="padding-top:0">
  <div class="seg">${[['live','Live'],['sched','Scheduled'],['past','Past']].map(([k,l])=>`<button class="${t==k?'on':''}" data-act="mrtab:${k}">${l}<span class="n">${sets[k].length}</span></button>`).join('')}</div>
  <div class="mt12">${sets[t].map(rideCard).join('')||`<div class="empty">${ms(t=='live'?'route':'event','','font-size:34px')}<br><br>${t=='live'?'No cabs on the road right now.':t=='sched'?'Nothing scheduled.':'No past rides yet.'}</div>`}</div></div>`}};
M.ride=p=>{const r=R(p.id);if(!r)return {h:hd('Ride')};const d=r.driver&&DR(r.driver);const inc=S.incidents.find(i=>i.ride==r.id&&i.status!='resolved');
  const can=['scheduled','searching','offered','enroute'].includes(r.status)&&!Object.values(r.board).some(b=>b=='in'||b=='dropped');
  const bs={waiting:['s','Waiting'],in:['','On board'],dropped:['g','Dropped'],noshow:['red','No-show']};
  return {h:`${hd(r.id,{right:rideChip(r)})}<div class="scroll" style="padding-top:0">
  ${inc?`<div class="card press mb8" style="background:var(--sos);color:#fff" data-act="go:incident:${inc.id}"><div class="row">${ms('sos')}<b class="f1">SOS raised by ${first(E(inc.emp).name)}</b>${ms('arrow_forward')}</div></div>`:''}
  <div class="mapbox" style="height:190px">${rideMap(r,{ar:1.7,labels:true})}</div>
  <div class="card mt8">${d?driverCard(d):`<div class="row">${ms(r.status=='scheduled'?'event':'radar')}<div class="f1"><b>${r.status=='scheduled'?'Scheduled for '+whenText(r):r.status=='cancelled'?'Cancelled':'Finding the nearest driver…'}</b><div class="gray" style="font-size:11.5px">${r.status=='scheduled'?'A driver is assigned 20 minutes before'+(r.repeat?' · repeats '+r.repeat:''):r.status=='cancelled'?'Fare refunded to wallet':'Usually under a minute'}</div></div></div>`}</div>
  <div class="sec">Stops</div><div class="card">${stopsTl(r)}</div>
  <div class="sec">Riders</div>${r.emps.map(e=>{const b=bs[r.board[e]];return `<div class="li">${av(E(e).name)}<div class="t"><b>${E(e).name}</b><small>${E(e).home.n} · OTP ${r.otp[e]}</small></div><span class="chip ${b[0]}">${b[1]}</span></div>`}).join('')}
  ${r.safety?`<div class="row mt8" style="background:var(--softer);border-radius:18px;padding:10px 12px;font-size:11.5px;align-items:flex-start">${ms('shield','','font-size:17px;color:#6b9400')}<span>${r.safety}</span></div>`:''}
  <div class="card mt8">${kv('Vehicle',VEH[r.veh].n)}${kv('Distance',r.km+' km · about '+r.mins+' min')}${kv('Fare (paid)',fmt(r.fare))}</div>
  <div class="mt12">${pill('Share live tracking link','say:Link copied:Anyone with the link can follow this cab until it ends:share',{cls:'soft ctr sm',noarr:1})}</div>
  ${can?`<div class="mt8">${pill('Cancel this cab · refund '+fmt(r.fare),'mcancel:'+r.id,{cls:'ctr sm',noarr:1})}</div>`:''}</div>`.replace('class="pill press ctr sm" data-act="mcancel','class="pill press ctr sm" style="background:#fff;color:var(--red);box-shadow:inset 0 0 0 1px #E57373" data-act="mcancel')}};
ACT.mcancel=(a,id)=>{if(cancelRide(R(id)))ptoast('m','Cab cancelled','Fare is back in the wallet','undo')};

/* ---------- Wallet ---------- */
M.wallet=()=>{const today=S.ledger.filter(l=>l.day==0&&l.type=='ride').reduce((s,l)=>s-l.amt,0);
  const ic={topup:['add','g'],ride:['local_taxi','k'],refund:['undo','']};
  return {tab:'wallet',h:`<div style="background:var(--black);color:#fff;border-radius:0 0 40px 40px;padding:20px 22px 24px;margin:0 8px;border-radius:36px;flex:none">
    <span class="tag d">Company wallet</span><div class="gray mt16" style="font-size:13px">Balance</div><div class="big" style="font-size:60px;margin-top:2px">${fmt(S.wallet)}</div>
    <div class="lime mt8" style="font-size:12.5px">${fmt(today)} spent on rides today</div>
    <div class="mt16">${pill('Add money','go:addMoney')}</div></div>
  <div class="scroll">
    <div class="li"><span class="cbtn sm">${ms('autorenew')}</span><div class="t"><b>Auto top-up</b><small>Add ${fmt(10000)} when balance drops below ${fmt(S.cfg.lowBal)}</small></div>${sw(S.cfg.autoTopup,'autotop')}</div>
    <div class="li press" data-act="say:Invoice sent:GST invoice for this month emailed to accounts@acme.in:receipt_long"><span class="cbtn sm">${ms('receipt_long')}</span><div class="t"><b>GST invoices</b><small>GSTIN ${S.company.gst} · monthly statement</small></div>${ms('download')}</div>
    <div class="sec">Transactions</div>
    ${[...S.ledger].reverse().map(l=>`<div class="li"><span class="cbtn sm ${ic[l.type][1]}">${ms(ic[l.type][0])}</span><div class="t"><b class="nw">${l.type=='topup'?'Money added':l.type=='refund'?'Refund':'Rides booked'}</b><small class="nw">${l.desc}</small><small>${dayLabel(l.day)} · ${tstr(l.t)}</small></div><b class="disp" style="font-size:18px">${l.amt>0?'+':'−'}${fmt(Math.abs(l.amt))}</b></div>`).join('')}
  </div>`}};
ACT.autotop=()=>{S.cfg.autoTopup=!S.cfg.autoTopup};
M.addMoney=()=>{const amt=U.addAmt||10000,m=U.addMethod||'UPI';
  return {h:`${hd('Add money')}<div class="scroll" style="padding-top:0"><div class="gray" style="font-size:12.5px">Amount</div><div class="big" style="font-size:64px;margin:4px 0 14px">${fmt(amt)}</div>
  <div class="seg">${[5000,10000,25000,50000].map(v=>`<button class="${amt==v?'on':''}" data-act="amt:${v}">${fmt(v)}</button>`).join('')}</div>
  <div class="sec">Pay with</div>
  ${[['UPI','qr_code_2','neha@okhdfc · instant'],['Net banking','account_balance','HDFC Bank corporate account'],['Corporate card','credit_card','Visa ••4410'],['Bank transfer','sync_alt','NEFT / RTGS to your virtual account']].map(([n,i,s])=>`<div class="li press ${m==n?'sel':''}" data-act="meth:${n}"><span class="cbtn sm ${m==n?'g':'w'}">${ms(i)}</span><div class="t"><b>${n}</b><small>${s}</small></div><span class="ck">${ms('check')}</span></div>`).join('')}
  </div><div class="foot">${pill('Add '+fmt(amt),'topup',{sub:'New balance '+fmt(S.wallet+amt)})}</div>`}};
ACT.amt=(a,v)=>U.addAmt=+v;ACT.meth=(a,m)=>U.addMethod=m;
ACT.topup=()=>{topUp(U.addAmt||10000,U.addMethod||'UPI');back('m')};

/* ---------- Alerts, safety, reports, profile ---------- */
M.alerts=()=>{S.unread.m=0;return {h:`${hd('Notifications')}<div class="scroll" style="padding-top:0">${notesList('m')}</div>`}};
const RULES=[['otp','OTP before boarding','The driver cannot start until the rider\'s 4-digit code matches','pin'],['womenRule','Night rule for women','After 8 PM a woman is never the first pickup or last drop when a male colleague shares the cab','nightlight'],['deviation','Route deviation alerts','You and the Bingo safety desk are alerted if a cab leaves its route','alt_route'],['rideCheck','Ride check','We check in with the rider if a cab stops for too long','timer'],['mask','Number masking','Riders and drivers call each other without seeing phone numbers','phone_locked']];
M.safety=()=>{const inc=S.incidents;
  return {c:'dk',h:`${hd('',{dk:1})}<div class="scroll" style="padding-top:0"><div class="h1" style="font-size:40px">Every ride,<br><span class="lime">watched over.</span></div>
  ${openInc().length?openInc().map(i=>`<div class="card press mt12" style="background:var(--sos);color:#fff" data-act="go:incident:${i.id}"><div class="row">${ms('sos','','font-size:26px')}<div class="f1"><b>${E(i.emp).name}</b><div style="font-size:12px;opacity:.9">${i.id} · raised ${tstr(i.at)} · ${i.status=='ack'?'being handled':'needs attention'}</div></div>${ms('arrow_forward')}</div></div>`).join(''):`<div class="card mt16"><div class="row">${ms('verified_user','lime','font-size:26px')}<div class="f1"><b>All clear</b><div class="gray" style="font-size:12px">${live().length} cab${live().length==1?'':'s'} on the road · no open alerts</div></div></div></div>`}
  <div class="sec">Company safety rules</div>
  ${RULES.map(([k,t,s,i])=>`<div class="li"><span class="cbtn sm c">${ms(i,'lime')}</span><div class="t"><b>${t}</b><small style="white-space:normal">${s}</small></div>${sw(S.cfg[k],'rule:'+k)}</div>`).join('')}
  <div class="sec">Built into every ride</div>
  <div class="card" style="font-size:12.5px;line-height:1.7;color:#cfcfcf">${['Drivers are ID-checked and background-verified before they can go online','Riders see the driver\'s name, photo, rating and number plate before pickup','Every trip is tracked live by you, the rider\'s trusted contact and the Bingo safety desk','SOS on every ride screen alerts you, the safety desk and the trusted contact at once'].map(x=>`<div class="row" style="align-items:flex-start">${ms('check_circle','lime','font-size:16px;margin-top:3px')}<span>${x}</span></div>`).join('')}</div>
  ${inc.filter(i=>i.status=='resolved').length?`<div class="sec">Closed alerts</div>${inc.filter(i=>i.status=='resolved').map(i=>`<div class="li press" data-act="go:incident:${i.id}"><span class="cbtn sm c">${ms('task_alt','lime')}</span><div class="t"><b>${E(i.emp).name}</b><small>${i.id} · closed</small></div></div>`).join('')}`:''}</div>`}};
ACT.rule=(a,k)=>{S.cfg[k]=!S.cfg[k]};
M.incident=p=>{const i=S.incidents.find(x=>x.id==p.id);if(!i)return {h:hd('Alert')};const e=E(i.emp),d=i.drv&&DR(i.drv),r=i.ride&&R(i.ride);const pos=d&&r&&r.status=='enroute'?{x:d.x,y:d.y}:{x:i.x,y:i.y};
  return {c:'dk',h:`${hd(i.id,{dk:1,right:`<span class="chip ${i.status=='resolved'?'g':'sos'}">${i.status=='resolved'?'Closed':i.status=='ack'?'Being handled':'SOS · open'}</span>`})}<div class="scroll" style="padding-top:0">
  <div class="mapbox" style="height:180px">${mapSvg({ar:1.8,fit:[pos],pad:110,cars:[{...pos,busy:true,sos:i.status!='resolved',label:first(e.name)}]})}</div>
  <div class="card mt8"><div class="row">${av(e.name,'lg')}<div class="f1"><b style="font-size:16px">${e.name}</b><div class="gray" style="font-size:12px">${e.team} · +91 ${e.phone}</div></div><button class="cbtn g press" data-act="say:Calling ${first(e.name)}…::call">${ms('call')}</button></div>
    ${d?`<div class="row mt12" style="justify-content:space-between"><span style="font-size:12.5px">${ms('local_taxi','','font-size:16px')} ${d.name} · ${d.car.split(' · ')[0]}</span>${plate(d.plate)}</div>`:''}
    ${kv('Trusted contact',e.ec[0]?e.ec[0].n+' · notified by SMS':'—')}</div>
  <div class="sec">Timeline</div><div class="card"><div class="tl">${i.log.map(l=>`<div class="st done"><span class="n">✓</span><b>${l.m}</b><small>${tstr(l.at)}</small></div>`).join('')}</div></div>
  </div>${i.status!='resolved'?`<div class="foot">${i.status=='open'?pill('I\'m on it · call '+first(e.name),'incack:'+i.id):''}<div class="mt8">${pill('Mark safe & close','incres:'+i.id,{cls:'dark ctr',noarr:1})}</div></div>`:''}`}};
ACT.incack=(a,id)=>incStep(S.incidents.find(i=>i.id==id),'ack',a=='m'?S.manager.name:'Bingo safety desk');
ACT.incres=(a,id)=>incStep(S.incidents.find(i=>i.id==id),'resolved',a=='m'?S.manager.name:'Bingo safety desk');
M.reports=()=>{const done=S.rides.filter(r=>r.status=='completed'),spend=done.reduce((s,r)=>s+r.fare,0);
  const solo=done.reduce((s,r)=>s+r.emps.reduce((x,e)=>x+fareFor('sedan',md(E(e).home,place(r.place))*KMU),0),0);
  const byTeam={};done.forEach(r=>r.emps.forEach(e=>byTeam[E(e).team]=(byTeam[E(e).team]||0)+Math.round(r.fare/r.emps.length)));const mx=Math.max(1,...Object.values(byTeam));
  return {h:`${hd('Reports')}<div class="scroll" style="padding-top:0"><div class="seg"><button class="on">This week</button><button>This month</button><button>Quarter</button></div>
  <div class="tiles mt12"><div class="tile k"><b>${fmt(spend)}</b><small>Spent on rides</small></div><div class="tile g"><b>${fmt(Math.max(0,solo-spend))}</b><small>Saved by sharing cabs</small></div></div>
  <div class="tiles mt8"><div class="tile"><b>${done.length}</b><small>Cabs</small></div><div class="tile"><b>${done.reduce((s,r)=>s+r.emps.length,0)}</b><small>Seats</small></div><div class="tile"><b>${fmt(done.length?spend/done.reduce((s,r)=>s+r.emps.length,0):0)}</b><small>Per seat</small></div></div>
  <div class="sec">Spend by team</div><div class="card">${Object.entries(byTeam).sort((a,b)=>b[1]-a[1]).map(([t,v])=>`<div style="margin-bottom:10px"><div class="row" style="justify-content:space-between;font-size:12.5px"><b>${t}</b><span>${fmt(v)}</span></div><div class="bar mt4"><i style="width:${(v/mx*100).toFixed(0)}%"></i></div></div>`).join('')||'<div class="empty">No completed rides yet.</div>'}</div>
  ${adWrap('m_reports','m','mt12')}<div class="mt12">${pill('Export to Excel','say:Report exported:Sent to your email as an Excel file:download',{cls:'soft ctr sm',noarr:1})}</div></div>`}};
M.more=()=>({tab:'more',h:`<div class="scroll"><div class="row" style="margin-top:6px">${av(S.manager.name,'lg')}<div class="f1"><div class="disp" style="font-size:30px">${S.manager.name}</div><div class="gray" style="font-size:12.5px">+91 ${S.manager.phone} · ${S.manager.role}</div></div></div>
  <div class="card k mt16"><div class="row"><span class="cbtn g">${ms('apartment')}</span><div class="f1"><b>${S.company.name}</b><div class="gray" style="font-size:11.5px">On Bingo Corporate since ${S.company.since}</div></div></div><div class="row mt12" style="justify-content:space-between"><span class="gray" style="font-size:12px">Company code</span><b class="lime disp" style="font-size:20px;letter-spacing:1px">${S.company.code}</b></div></div>
  <div class="mt12">${[['manage_accounts','Managers','Neha Sharma (Admin) · Arvind Rao (Travel desk)','say:Managers:Add more managers by phone number. Each has their own sign-in and booking limit:manage_accounts'],['location_city','Offices & venues','Acme HQ · ORR Campus · 2 venues','say:Offices:Add offices and frequent venues once and reuse them in every booking:location_city'],['insights','Reports','Spend, savings and usage','go:reports'],['shield','Safety centre','Rules and alerts','go:safety'],['notifications','Notifications','All updates','go:alerts'],['support_agent','Support','24/7 corporate desk','say:Support:Opens a chat with your Bingo account manager:support_agent']].map(([i,t,s,act])=>`<div class="li press" data-act="${act}"><span class="cbtn sm">${ms(i)}</span><div class="t"><b>${t}</b><small>${s}</small></div>${ms('arrow_forward')}</div>`).join('')}</div>
  <div class="mt8">${pill('Log out','logout',{cls:'soft ctr sm',noarr:1})}</div><p class="gray" style="text-align:center;font-size:11px;margin-top:14px">Bingo Corporate · Manager v1.0</p></div>`});
ACT.logout=a=>{U.signed[a]=false;root(a,'login')};
})();
