'use strict';
/* ============================================================
   Onboarding simulation: a new client company, its manager,
   an invited employee and a new driver, from first SMS to ready.
   Runs on its own small state (OB) so the live demo is untouched.
   ============================================================ */
let OB;
function initOB(){
  OB={co:{name:'Orbit Infotech',admin:'Sanjay Kulkarni',phone:'98860 40021',gst:'29AAOCO7781K1Z2',email:'accounts@orbitinfotech.in',office:'hq',shift:'General',status:'none',wallet:0},
    team:[], m:'lock', e:'lock', d:'lock', dash:'companies',
    emp:{name:'Tanvi Bhat',phone:'98801 20031',area:'kor',ec:'Appa',joined:false},
    drv:{name:'Ramesh Naik',phone:'98450 30019',city:'Bengaluru',lang:['Kannada','Hindi'],veh:'sedan',model:'Maruti Dzire · White',plate:'KA 53 MC 4471',docs:{},status:'none',checks:{}},
    sms:{m:false,e:false,d:true}};
}
const OB_DOCS=[['dl','Driving licence','badge','Fetched from DigiLocker'],['rc','Vehicle RC','directions_car','Fetched from DigiLocker'],['aadhaar','Aadhaar','fingerprint','Verified by OTP'],['pan','PAN card','credit_card','Photo'],['police','Police verification','shield','Certificate PDF'],['bank','Bank account','account_balance','Cancelled cheque or UPI ID']];
const OB_TEAM=[['Tanvi Bhat','98801 20031','Engineering'],['Rohan Mehta','98801 20032','Engineering'],['Shalini Gupta','98801 20033','Finance'],['Kiran Rao','98801 20034','Sales'],['Fatima Sheikh','98801 20035','HR']];

/* ---------- Pieces ---------- */
const lockScr=(cards,hint)=>({c:'dk',h:`<div style="position:absolute;inset:0;background:radial-gradient(80% 50% at 30% 10%,#3a4410 0%,#151812 45%,#0b0b0b 100%)"></div>
  <div class="over" style="padding:0 16px"><div style="text-align:center;margin-top:30px"><div class="gray" style="font-size:13px">${['Wednesday','Wednesday'][0]}, 11 November</div><div class="big" style="font-size:78px;color:#fff;font-weight:600">${tstr(S.now).replace(/ [AP]M/,'')}</div></div>
  <div class="col" style="gap:8px;margin-top:22px">${cards.join('')||`<div class="gray" style="text-align:center;font-size:12px;margin-top:20px">No notifications</div>`}</div>
  <div class="sp"></div>${hint?`<div style="text-align:center;font-size:11.5px;color:#9a9a9a;margin-bottom:22px">${hint}</div>`:''}</div>`});
const smsCard=(from,body,act)=>`<div class="press" data-act="${act}" style="background:rgba(255,255,255,.14);backdrop-filter:blur(10px);border-radius:24px;padding:12px 14px;color:#fff"><div class="row" style="gap:8px;font-size:11px;color:#cfcfcf"><span class="cbtn sm" style="width:22px;height:22px;background:#2fbf5b;color:#fff">${ms('sms','','font-size:13px')}</span><b style="flex:1">MESSAGES</b>now</div><b style="display:block;margin-top:6px;font-size:13px">${from}</b><div style="font-size:12.5px;line-height:1.4;color:#e6e6e6">${body}</div></div>`;
const appCard=(app,title,body,act)=>`<div class="press" data-act="${act}" style="background:rgba(255,255,255,.14);backdrop-filter:blur(10px);border-radius:24px;padding:12px 14px;color:#fff"><div class="row" style="gap:8px;font-size:11px;color:#cfcfcf">${mark(22)}<b style="flex:1">${app}</b>now</div><b style="display:block;margin-top:6px;font-size:13px">${title}</b><div style="font-size:12.5px;line-height:1.4;color:#e6e6e6">${body}</div></div>`;
const step=(n,of)=>`<span class="chip s">${n} of ${of}</span>`;
const obField=(icon,val,ph='')=>`<div class="field mt8">${icon.startsWith('+')?`<span class="gray">${icon}</span>`:ms(icon,'gray')}<input value="${val}" placeholder="${ph}"></div>`;
const checkRow=(ok,t,s='')=>`<div class="li"><span class="ck ${ok?'on':''}">${ms('check')}</span><div class="t"><b>${t}</b>${s?`<small>${s}</small>`:''}</div></div>`;

/* ---------- Manager ---------- */
const OM={
  lock:()=>lockScr(OB.co.status=='none'?[]:[smsCard('BINGO','Hi '+first(OB.co.admin)+', '+OB.co.name+' is now on Bingo Corporate. Install the app and sign in with this number: bingo.in/c/orbit','obm:login')],OB.co.status=='none'?'Waiting for the owner to set up the company':'Tap the message'),
  login:()=>SC.login('m',{tag:'MANAGER',head:'Move your <span class="lime">whole team</span> in a few taps.',sub:'Use the number your company registered with Bingo.',phone:OB.co.phone}),
  otp:()=>SC.otp('m',{phone:OB.co.phone,code:'5530'}),
  welcome:()=>({c:'dk',h:`<div class="scroll" style="display:flex;flex-direction:column"><span class="cbtn g" style="width:60px;height:60px;margin-top:10px">${ms('apartment','','font-size:30px')}</span>
    <div class="h1 mt20" style="font-size:42px">Welcome,<br><span class="lime">${first(OB.co.admin)}.</span></div>
    <p class="gray mt12" style="font-size:13px;line-height:1.5">${OB.co.name} has been set up on Bingo Corporate, with you as the admin. Four quick steps and your team can ride.</p>
    <div class="card mt16">${[['Company details','For GST invoices'],['Your office','Where cabs go'],['Your team','Invite by phone number'],['Company wallet','Prepay for rides']].map(([t,s],i)=>`<div class="row" style="padding:7px 0"><span class="av sm k">${i+1}</span><div class="f1"><b>${t}</b><div class="gray" style="font-size:11.5px">${s}</div></div></div>`).join('')}</div>
    <div class="sp"></div><div class="mt16">${pill('Set up in 2 minutes','obm:profile')}</div></div>`}),
  profile:()=>({h:`${hd('Company details',{right:step(1,4)})}<div class="scroll" style="padding-top:0"><p class="gray" style="font-size:12.5px">Used on your monthly GST invoice.</p>
    <div class="lab mt16">Legal name</div>${obField('apartment',OB.co.name+' Pvt Ltd')}
    <div class="lab mt12">GSTIN</div>${obField('receipt_long',OB.co.gst)}
    <div class="lab mt12">Billing email</div>${obField('mail',OB.co.email)}
    <div class="lab mt12">Billing address</div>${obField('location_on','4th Floor, Prestige Tech Park, Bengaluru')}</div>
    <div class="foot">${pill('Next · your office','obm:office')}</div>`}),
  office:()=>{const o=OFFICES[OB.co.office];return {h:`${hd('Your office',{right:step(2,4)})}<div class="scroll" style="padding-top:0">
    <div class="mapbox" style="height:150px">${mapSvg({ar:2.2,fit:[o],pad:130,dest:{x:o.x,y:o.y,label:o.n}})}</div>
    ${Object.values(OFFICES).map(x=>`<div class="li press mt8 ${OB.co.office==x.id?'sel':''}" data-act="obm:setoffice:${x.id}"><span class="cbtn ${OB.co.office==x.id?'g':'w'}">${ms(x.ic)}</span><div class="t"><b>${x.a.split(',')[0]}</b><small>${x.a}</small></div><span class="ck">${ms('check')}</span></div>`).join('')}
    <div class="sec">Shift timings</div><div class="seg">${['General · 9:00–6:30','Evening · 2:00–10:30','Night · 10:00–7:00'].map(s=>`<button class="${s.startsWith(OB.co.shift)?'on':''}" data-act="obm:shift:${s.split(' ')[0]}">${s}</button>`).join('')}</div>
    <p class="gray mt12" style="font-size:11.5px">You can add more offices and venues later.</p></div><div class="foot">${pill('Next · your team','obm:team')}</div>`}},
  team:()=>({h:`${hd('Your team',{right:step(3,4)})}<div class="scroll" style="padding-top:0"><p class="gray" style="font-size:12.5px">Add a name and mobile number. Each person signs in with that number and is linked to ${OB.co.name} automatically.</p>
    <div class="li press mt16" data-act="obm:sheet"><span class="cbtn g">${ms('upload_file')}</span><div class="t"><b>Upload a sheet</b><small>Excel or CSV with name and number</small></div>${ms('arrow_forward')}</div>
    <div class="li" style="opacity:.55"><span class="cbtn">${ms('person_add')}</span><div class="t"><b>Add one person</b><small>Name and mobile number</small></div></div>
    <div class="li" style="opacity:.55"><span class="cbtn">${ms('qr_code_2')}</span><div class="t"><b>Share company code</b><small>People join, you approve</small></div></div>
    <div class="li" style="opacity:.55"><span class="cbtn">${ms('sync')}</span><div class="t"><b>Sync from your HR system</b><small>Keka, Darwinbox, Zoho People</small></div></div></div>`}),
  sheet:()=>({h:`${hd('Upload a sheet',{right:step(3,4)})}<div class="scroll" style="padding-top:0">
    <div class="card g"><div class="row">${ms('description','','font-size:30px')}<div class="f1"><b>orbit-team.xlsx</b><div style="font-size:12px">5 rows read · all ready</div></div>${ms('check_circle')}</div></div>
    <div class="sec">Preview</div>${OB_TEAM.map(t=>`<div class="li">${av(t[0],'s')}<div class="t"><b>${t[0]}</b><small>+91 ${t[1]} · ${t[2]}</small></div><span class="ck on">${ms('check')}</span></div>`).join('')}</div>
    <div class="foot">${pill('Invite 5 people','obm:invite',{sub:'Each gets an SMS with the app link'})}</div>`}),
  wallet:()=>({h:`${hd('Company wallet',{right:step(4,4)})}<div class="scroll" style="padding-top:0"><p class="gray" style="font-size:12.5px">Rides are paid from this wallet the moment you book. Unused money stays in the wallet.</p>
    <div class="big" style="font-size:60px;margin:14px 0">₹25,000</div><div class="seg">${['₹10,000','₹25,000','₹50,000'].map((v,i)=>`<button class="${i==1?'on':''}">${v}</button>`).join('')}</div>
    <div class="sec">Pay with</div>${[['UPI','qr_code_2','sanjay@okicici · instant',1],['Bank transfer','sync_alt','NEFT to Orbit\'s own account number',0],['Net banking','account_balance','Any bank',0]].map(([n,i,s,on])=>`<div class="li ${on?'sel':''}"><span class="cbtn sm ${on?'g':'w'}">${ms(i)}</span><div class="t"><b>${n}</b><small>${s}</small></div><span class="ck">${ms('check')}</span></div>`).join('')}</div>
    <div class="foot">${pill('Add ₹25,000','obm:pay',{sub:'You can also do this later'})}</div>`}),
  ready:()=>{const joined=OB.team.filter(t=>t.joined).length;return {c:'lm',h:`<div class="scroll" style="display:flex;flex-direction:column"><span class="cbtn k" style="width:60px;height:60px;margin-top:10px">${ms('check','lime','font-size:30px')}</span>
    <div class="h1 mt20" style="font-size:50px">You're<br>all set.</div><p class="mt8" style="font-size:13.5px">${OB.co.name} is ready to book rides.</p>
    <div class="card k mt20">${kv('Company',OB.co.name)}${kv('Office',OFFICES[OB.co.office].a.split(',')[0])}${kv('Wallet',fmt(OB.co.wallet))}${kv('Team',joined+' of '+OB.team.length+' signed in')}</div>
    <div class="card w mt8">${OB.team.map(t=>`<div class="row" style="padding:5px 0">${av(t.name,t.joined?'':'s')}<b class="f1" style="font-size:13px">${t.name}</b>${t.joined?'<span class="chip g">Joined</span>':'<span class="chip am">Invited</span>'}</div>`).join('')}</div>
    <div class="sp"></div><div class="mt16">${pill('Book the first ride','obgolive',{cls:'dark',sub:'Continue in the live demo'})}</div></div>`}}
};
/* ---------- Employee ---------- */
const OE={
  lock:()=>lockScr(OB.team.length?[smsCard('BINGO',first(OB.co.admin)+' added you to '+OB.co.name+' on Bingo. Get your office cab app and sign in with this number: bingo.in/e/orbit','obe:login')]:[],OB.team.length?'Tap the message':'Waiting for the manager to invite the team'),
  login:()=>SC.login('e',{tag:'EMPLOYEE',head:'Your office cab, <span class="lime">sorted.</span>',sub:'Use the mobile number your company has on record.',phone:OB.emp.phone}),
  otp:()=>SC.otp('e',{phone:OB.emp.phone,code:'2718'}),
  found:()=>({c:'dk',h:`<div class="scroll" style="display:flex;flex-direction:column"><span class="cbtn g" style="width:60px;height:60px;margin-top:10px">${ms('verified','','font-size:30px')}</span>
    <div class="h1 mt20" style="font-size:42px">We found<br>your <span class="lime">company.</span></div>
    <p class="gray mt12" style="font-size:13px;line-height:1.5">${OB.co.admin} added +91 ${OB.emp.phone} to the team, so this number is already linked. Nothing to type.</p>
    <div class="card mt20"><div class="row"><span class="cbtn g">${ms('apartment')}</span><div class="f1"><b>${OB.co.name}</b><div class="gray" style="font-size:12px">Engineering · added by ${first(OB.co.admin)}</div></div>${ms('check_circle','lime')}</div></div>
    <div class="sp"></div>${pill('Continue as '+first(OB.emp.name),'obe:setup')}</div>`}),
  setup:()=>{const a=AREAS[OB.emp.area];return {h:`${hd('Set up once')}<div class="scroll" style="padding-top:0"><p class="gray" style="font-size:12.5px">Your manager never has to ask for these.</p>
    <div class="sec">Pickup point</div><div class="mapbox" style="height:130px">${mapSvg({ar:2.4,fit:[a],pad:120,homes:Object.values(AREAS).map(p=>({x:p.x,y:p.y,dim:true})),dest:{x:a.x,y:a.y,label:a.n}})}</div>
    <div class="seg mt12">${['kor','hsr','ind','btm','jay','bel'].map(k=>`<button class="${OB.emp.area==k?'on':''}" data-act="obe:area:${k}">${AREAS[k].n}</button>`).join('')}</div>
    ${obField('home',a.a)}
    <div class="sec">Emergency contact</div>${obField('favorite','Appa')}${obField('+91','98450 66120')}
    <p class="gray mt8" style="font-size:11.5px">They get your live trip link if you press SOS, and on night rides.</p></div>
    <div class="foot">${pill('Finish','obe:done')}</div>`}},
  ready:()=>({tab:null,h:`<div class="scroll"><div class="row" style="align-items:flex-start;margin-top:6px"><div class="h1 f1" style="font-size:38px">You're in,<br>${first(OB.emp.name)}</div>${av(OB.emp.name,'lg')}</div>
    <p class="gray mt8" style="font-size:12.5px">${OB.co.name} · rides paid by your company</p>
    <div class="card mt16"><div class="row">${ms('event_busy','gray','font-size:30px')}<div class="f1"><b>No cab booked yet</b><div class="gray" style="font-size:12px;line-height:1.4">When ${first(OB.co.admin)} books a cab, your driver, vehicle number, OTP and arrival time show up here.</div></div></div></div>
    <div class="card k mt8"><div class="row"><span class="cbtn sm g">${ms('home')}</span><div class="f1"><b>Pickup point</b><div class="gray" style="font-size:12px">${AREAS[OB.emp.area].n} · ${AREAS[OB.emp.area].a}</div></div></div><div class="row mt12"><span class="cbtn sm g">${ms('favorite')}</span><div class="f1"><b>Emergency contact</b><div class="gray" style="font-size:12px">Appa · gets your live trip on SOS</div></div></div></div>
    <div class="card mt8"><div class="row">${ms('shield','','font-size:22px')}<div class="f1"><b>Safety is on</b><div class="gray" style="font-size:12px">OTP to board, verified drivers, SOS on every ride</div></div></div></div></div>`})
};
/* ---------- Driver ---------- */
const OD={
  lock:()=>lockScr([appCard('BINGO DRIVER','Drive with Bingo Corporate','Steady office rides, prepaid by companies. Withdraw your earnings any time. Sign up in 10 minutes.','obd:login')],'Tap to sign up as a driver'),
  login:()=>SC.login('d',{tag:'DRIVER',head:'Steady corporate rides. <span class="lime">Paid on request.</span>',sub:'Use the number linked to your driving licence.',phone:OB.drv.phone}),
  otp:()=>SC.otp('d',{phone:OB.drv.phone,code:'9064'}),
  profile:()=>({c:'dk',h:`${hd('About you',{dk:1,right:'<span class="chip c">1 of 3</span>'})}<div class="scroll" style="padding-top:0">
    <div class="lab">Full name as on licence</div>${obField('person',OB.drv.name)}
    <div class="lab mt12">City</div>${obField('location_city',OB.drv.city)}
    <div class="lab mt12">Languages you speak</div><div class="seg mt8">${['Kannada','Hindi','English','Tamil','Telugu'].map(l=>`<button class="${OB.drv.lang.includes(l)?'on':''}" data-act="obd:lang:${l}">${l}</button>`).join('')}</div>
    <div class="card mt16"><b>${ms('verified_user','lime','font-size:17px')} Why we ask</b><p class="gray" style="font-size:12px;line-height:1.5;margin-top:6px">Corporate riders see your name, photo, rating and vehicle number before pickup.</p></div></div>
    <div class="foot">${pill('Next · your vehicle','obd:vehicle')}</div>`}),
  vehicle:()=>({c:'dk',h:`${hd('Your vehicle',{dk:1,right:'<span class="chip c">2 of 3</span>'})}<div class="scroll" style="padding-top:0">
    ${Object.values(VEH).map(v=>`<div class="li press ${OB.drv.veh==v.id?'sel':''}" data-act="obd:veh:${v.id}" style="${OB.drv.veh==v.id?'background:var(--green);color:var(--black)':''}"><span class="cbtn ${OB.drv.veh==v.id?'k':'c'}">${ms(v.ic,OB.drv.veh==v.id?'lime':'')}</span><div class="t"><b>${v.n} · ${v.seats} seats</b><small style="${OB.drv.veh==v.id?'color:#3b4a00':''}">${v.eg}</small></div></div>`).join('')}
    <div class="lab mt12">Model and colour</div>${obField('directions_car',OB.drv.model)}
    <div class="lab mt12">Number plate</div><div class="mt8">${plate(OB.drv.plate)}</div></div>
    <div class="foot">${pill('Next · documents','obd:docs')}</div>`}),
  docs:()=>{const n=OB_DOCS.filter(d=>OB.drv.docs[d[0]]).length;return {c:'dk',h:`${hd('Documents',{dk:1,right:'<span class="chip c">3 of 3</span>'})}<div class="scroll" style="padding-top:0">
    <p class="gray" style="font-size:12.5px">Bingo checks every driver before the first ride. ${n} of ${OB_DOCS.length} added.</p>
    <div class="bar mt8"><i style="width:${n/OB_DOCS.length*100}%"></i></div>
    <div class="mt12">${OB_DOCS.map(([k,t,i,s])=>`<div class="li"><span class="cbtn sm c">${ms(i,'lime')}</span><div class="t"><b>${t}</b><small>${OB.drv.docs[k]?'Added · '+s:s}</small></div>${OB.drv.docs[k]?`<span class="chip g">${ms('check')}Added</span>`:`<button class="chip w press" data-act="obd:up:${k}">${ms('upload')}Add</button>`}</div>`).join('')}</div>
    <div class="li"><span class="cbtn sm c">${ms('photo_camera','lime')}</span><div class="t"><b>Profile photo</b><small>${OB.drv.docs.selfie?'Selfie taken':'Live selfie, matched with your licence'}</small></div>${OB.drv.docs.selfie?`<span class="chip g">${ms('check')}Done</span>`:`<button class="chip w press" data-act="obd:up:selfie">${ms('photo_camera')}Take</button>`}</div></div>
    <div class="foot">${pill(n<OB_DOCS.length||!OB.drv.docs.selfie?'Add everything to continue':'Submit for review','obd:submit',{dis:n<OB_DOCS.length||!OB.drv.docs.selfie})}</div>`}},
  review:()=>{const c=OB.drv.checks;return {c:'dk',h:`<div class="scroll"><span class="tag d" style="margin-top:8px">Under review</span><div class="h1 mt16" style="font-size:40px">We're checking<br><span class="lime">your documents.</span></div>
    <p class="gray mt8" style="font-size:13px;line-height:1.5">Usually done within a day. You'll get a notification when you're approved.</p>
    <div class="mt16">${OB_DOCS.map(([k,t,i])=>`<div class="li"><span class="cbtn sm c">${ms(i,'lime')}</span><div class="t"><b>${t}</b></div><span class="chip ${c[k]?'g':'c'}">${c[k]?'Verified':'Checking'}</span></div>`).join('')}</div>
    <div class="card mt8"><div class="row">${ms(VEH[OB.drv.veh].ic,'lime')}<div class="f1"><b>${OB.drv.model}</b><div class="gray" style="font-size:12px">${VEH[OB.drv.veh].n} · ${VEH[OB.drv.veh].seats} seats</div></div>${plate(OB.drv.plate)}</div></div></div>`}},
  approved:()=>({c:'lm',h:`<div class="scroll" style="display:flex;flex-direction:column"><span class="cbtn k" style="width:60px;height:60px;margin-top:10px">${ms('verified','lime','font-size:30px')}</span>
    <div class="h1 mt20" style="font-size:50px">You're<br>approved.</div><p class="mt8" style="font-size:13.5px">All documents verified. Go online to start getting corporate rides.</p>
    <div class="card k mt20">${kv('Driver',OB.drv.name)}${kv('Vehicle',VEH[OB.drv.veh].n+' · '+OB.drv.plate)}${kv('Payouts to','UPI · '+first(OB.drv.name).toLowerCase()+'@oksbi')}${kv('Insurance','Accident cover active')}</div>
    <div class="sp"></div><div class="mt16">${slide('Go online','obd:online','power_settings_new')}</div></div>`}),
  online:()=>({c:'dk',h:`<div class="mapbg">${mapSvg({ar:.5,fit:[{x:560,y:380}],pad:150,cars:[{x:560,y:380,busy:true,ic:VEH[OB.drv.veh].ic}]})}</div><div class="over">
    <div class="row" style="padding:6px 18px">${av(OB.drv.name,'lg')}<div class="f1"><div class="disp nw" style="font-size:24px;color:#fff">Hi, ${first(OB.drv.name)}</div><div class="gray nw" style="font-size:12px">New driver · ${OB.drv.plate}</div></div><span class="chip g">${ms('circle','','font-size:9px')}ONLINE</span></div>
    <div style="flex:1;display:grid;place-items:center;position:relative"><span class="pulse"></span></div>
    <div class="sheet"><div class="disp" style="font-size:32px;font-weight:500">Finding rides<br>near you…</div><p class="gray mt8" style="font-size:12.5px">You're live. Corporate requests will show up here with every stop and your earning.</p></div></div>`})
};

/* ---------- Owner console ---------- */
/* Snapshots of onboarding states for the gallery and the PDF. */
const OB_SET={
  invited:o=>{o.co.status='invited'},
  team:o=>{o.co.status='active';o.team=OB_TEAM.map(t=>({name:t[0],phone:t[1],team:t[2],joined:false}))},
  joined:o=>{OB_SET.team(o);o.team[0].joined=true;o.emp.joined=true;o.co.wallet=25000},
  docs:o=>{o.drv.docs={dl:1,rc:1,aadhaar:1}},
  review:o=>{OB_SET.joined(o);OB_DOCS.forEach(d=>o.drv.docs[d[0]]=1);o.drv.docs.selfie=1;o.drv.status='review';o.drv.checks={dl:1,rc:1,aadhaar:1};o.dash='drivers'},
  approved:o=>{OB_SET.review(o);OB_DOCS.forEach(d=>o.drv.checks[d[0]]=1);o.drv.status='approved'}
};
function obWith(state,fn){const s=OB;initOB();if(state)OB_SET[state](OB);try{return fn()}finally{OB=s}}
function obShot(a,screen,state){return obWith(state,()=>{OB[a]=screen;const v=obPhone(a);return {c:v.c,h:`${sbar()}<div class="body">${v.h}</div>`}})}
function obDashMain(page,state){return obWith(state,()=>{OB.dash=page;return obDash(true)})}
const OB_GAL=[['m','lock','invited','SMS invite to the new manager'],['m','welcome','invited','Welcome · company found'],['m','profile','invited','Company details'],['m','office','invited','Office and shifts'],['m','team','invited','Add your team'],['m','sheet','invited','Upload a sheet'],['m','wallet','team','First wallet top-up'],['m','ready','joined','Company ready'],
  ['e','lock','team','SMS invite to an employee'],['e','found','team','Company found by number'],['e','setup','team','Pickup point and emergency contact'],['e','ready','joined','Employee ready'],
  ['d','lock',null,'Driver sign-up prompt'],['d','profile',null,'About you'],['d','vehicle',null,'Your vehicle'],['d','docs','docs','Documents'],['d','review','review','Under review'],['d','approved','approved','Approved'],['d','online','approved','First time online']];
function obGalleryHTML(){
  const cells=OB_GAL.map(([a,s,st,cap],i)=>{const v=obShot(a,s,st);return `<div class="gcell"><div class="gframe"><div class="scr ${v.c}">${v.h}</div></div><div class="cap"><b>${String(i+1).padStart(2,'0')}</b>${{m:'Manager',e:'Employee',d:'Driver'}[a]} · ${cap}</div></div>`}).join('');
  const dc=(cap,page,st,n)=>`<div class="gcell gdash"><div class="wrap"><div class="dmain">${obDashMain(page,st)}</div></div><div class="cap"><b>${n}</b>${cap}</div></div>`;
  return `<h3 class="disp">Onboarding</h3><p class="sub">From the first SMS to a working team and an approved driver · ${OB_GAL.length+3} screens</p><div class="galgrid">${cells}
    ${dc('Owner · onboard a company','companies',null,OB_GAL.length+1)}${dc('Owner · company is live','companies','joined',OB_GAL.length+2)}${dc('Owner · verify driver documents','drivers','review',OB_GAL.length+3)}</div>`;
}
function obDash(mainOnly){
  const co=OB.co,joined=OB.team.filter(t=>t.joined).length;
  const coStatus={none:'',invited:'<span class="spill am">Invite sent</span>',setup:'<span class="spill am">Setting up</span>',active:'<span class="spill g">'+ms('check_circle')+'Active</span>'}[co.status];
  let main;
  if(OB.dash=='companies'){
    main=`<div class="dtop"><h3 class="disp">Companies</h3></div>
    ${co.status=='none'?`<div class="panel" style="margin-bottom:14px;box-shadow:0 0 0 3px var(--green)"><h4>Onboard a company <small>The admin signs in with this number and becomes the first manager</small></h4>
      <div class="dform"><label class="dfield">Company name<input value="${co.name}"></label><label class="dfield">Admin name<input value="${co.admin}"></label><label class="dfield">Admin mobile number<input value="${co.phone}"></label><label class="dfield">Commission on this company's rides<input value="${S.cfg.comm}% (default)"></label></div>
      <div style="margin-top:14px"><button class="ract press" data-act="obcreate" style="padding:12px 20px;font-size:13.5px">Create company & send SMS invite</button></div></div>`:''}
    <div class="ghead" style="grid-template-columns:1.6fr 1.3fr 140px 130px 150px"><span>Company</span><span>Admin manager</span><span>Team</span><span>Wallet</span><span>Status</span></div>
    ${co.status!='none'?`<div class="grow" style="grid-template-columns:1.6fr 1.3fr 140px 130px 150px;box-shadow:0 0 0 2px var(--green)"><span><div class="row">${av(co.name,'k')}<div><b>${co.name}</b><small>New today</small></div></div></span><span><b>${co.admin}</b><small>+91 ${co.phone}</small></span><span><b>${OB.team.length?joined+' of '+OB.team.length:'—'}</b><small>${OB.team.length?'signed in':'not invited yet'}</small></span><span class="u">${fmt(co.wallet)}</span><span>${coStatus}</span></div>`:''}
    ${S.companies.filter(c=>c.id!='c1').map(c=>`<div class="grow" style="grid-template-columns:1.6fr 1.3fr 140px 130px 150px"><span><div class="row">${av(c.name,'k')}<div><b>${c.name}</b><small>Joined 2026</small></div></div></span><span><b>${c.admin}</b><small>+91 ${c.phone}</small></span><span><b>${c.emps}</b><small>employees</small></span><span class="u">${fmt(c.wallet||0)}</span><span><span class="spill g">${ms('check_circle')}Active</span></span></div>`).join('')}`;
  }else{
    const d=OB.drv,all=OB_DOCS.every(x=>d.checks[x[0]]);
    main=`<div class="dtop"><h3 class="disp">Drivers</h3></div>
    ${d.status=='none'?`<div class="empty" style="background:#fff;border-radius:22px">No new sign-ups yet. When a driver submits documents, they appear here for review.</div>`:
    `<div class="panel" style="${d.status=='review'?'box-shadow:0 0 0 3px var(--green)':''}"><h4><span class="row">${av(d.name,'k')}<span><b style="font-size:15px">${d.name}</b><small class="gray" style="display:block;font-size:12px;font-weight:500">+91 ${d.phone} · ${d.city} · ${d.lang.join(', ')}</small></span></span>${d.status=='approved'?'<span class="spill g">'+ms('verified')+'Approved</span>':'<span class="spill am">'+ms('hourglass_top')+'Documents to review</span>'}</h4>
      <div class="row" style="gap:12px;margin-bottom:12px">${ms(VEH[d.veh].ic)}<b>${d.model}</b><span class="gray">${VEH[d.veh].n} · ${VEH[d.veh].seats} seats</span>${plate(d.plate)}</div>
      <div class="ghead" style="grid-template-columns:1.4fr 1.6fr 160px"><span>Document</span><span>Check</span><span></span></div>
      ${OB_DOCS.map(([k,t,i,s])=>`<div class="grow" style="grid-template-columns:1.4fr 1.6fr 160px"><span><div class="row">${ms(i)}<b>${t}</b></div></span><span><small style="color:var(--black)">${{dl:'Valid till 2031 · LMV transport · no endorsements',rc:'Owner matches driver · fitness valid · commercial permit',aadhaar:'Name and photo match licence',pan:'Name matches · linked to Aadhaar',police:'No records found · issued Oct 2026',bank:'₹1 test deposit confirmed'}[k]}</small></span><span>${d.checks[k]?'<span class="spill g">'+ms('check')+'Verified</span>':`<button class="ract press" data-act="obcheck:${k}">Mark verified</button>`}</span></div>`).join('')}
      <div style="margin-top:14px">${d.status=='approved'?'':`<button class="ract ${all?'':'s'} press" data-act="obapprove" style="padding:12px 20px;font-size:13.5px" ${all?'':'disabled'}>${all?'Approve '+first(d.name):'Verify all documents to approve'}</button>${all?'':`<button class="ract k press" data-act="obcheckall">Verify all</button>`}`}</div></div>`}`;
  }
  if(mainOnly)return main;
  const nav=[['overview','Overview','space_dashboard'],['rides','Rides','route'],['companies','Companies','apartment'],['drivers','Drivers','sports_motorsports'],['payouts','Payouts','payments'],['revenue','Revenue','account_balance'],['ads','Ads','campaign'],['safety','Safety','shield'],['settings','Settings','tune']];
  return `<aside class="dside"><div class="brand" style="padding-left:6px">${mark(38)}<span class="wm">bingo</span></div><div class="sub">Owner console</div>
    ${nav.map(n=>`<button class="nv press ${OB.dash==n[0]?'on':''}" ${['companies','drivers'].includes(n[0])?`data-act="obdash:${n[0]}"`:''} style="${['companies','drivers'].includes(n[0])?'':'opacity:.45'}">${ms(n[2])}${n[1]}${n[0]=='drivers'&&OB.drv.status=='review'?'<span class="bd">1</span>':''}</button>`).join('')}
    <div class="dme"><span class="av">B</span><div class="f1"><b>Bingo Operations</b><small>Owner · Admin</small></div></div></aside><div class="dmain">${main}</div>`;
}

/* ---------- Steps, actions, render ---------- */
function obSteps(){const t=OB.team.length>0;return [
  ['Owner creates the company',OB.co.status!='none','o'],
  ['Manager signs in by SMS link',!['lock','login','otp'].includes(OB.m)&&OB.co.status!='none','m'],
  ['Manager sets up company',['team','sheet','wallet','ready'].includes(OB.m),'m'],
  ['Manager invites the team',t,'m'],
  ['Manager adds money',OB.co.wallet>0,'m'],
  ['Employee joins by phone',OB.emp.joined,'e'],
  ['Driver signs up',OB.drv.status!='none','d'],
  ['Owner verifies documents',OB.drv.status=='approved','o'],
  ['Driver goes online',OB.d=='online','d']]}
const go_=(k,s)=>{OB[k]=s};
ACT.obm=(a,s,arg)=>{if(s=='setoffice')OB.co.office=arg;else if(s=='shift')OB.co.shift=arg;else if(s=='invite'){OB.team=OB_TEAM.map(t=>({name:t[0],phone:t[1],team:t[2],joined:false}));OB.co.status='active';go_('m','wallet')}
  else if(s=='pay'){OB.co.wallet=25000;go_('m','ready')}else{if(s=='profile'&&OB.co.status=='invited')OB.co.status='setup';go_('m',s)}};
ACT.obe=(a,s,arg)=>{if(s=='area')OB.emp.area=arg;else if(s=='done'){OB.emp.joined=true;OB.team[0].joined=true;go_('e','ready')}else go_('e',s)};
ACT.obd=(a,s,arg)=>{const d=OB.drv;if(s=='lang'){const i=d.lang.indexOf(arg);i<0?d.lang.push(arg):d.lang.splice(i,1)}else if(s=='veh')d.veh=arg;else if(s=='up')d.docs[arg]=true;
  else if(s=='submit'){d.status='review';OB.dash='drivers';go_('d','review')}else if(s=='online')go_('d','online');else go_('d',s)};
ACT.obcreate=()=>{OB.co.status='invited'};
ACT.obdash=(a,p)=>{OB.dash=p};
ACT.obcheck=(a,k)=>{OB.drv.checks[k]=true};
ACT.obcheckall=()=>OB_DOCS.forEach(x=>OB.drv.checks[x[0]]=true);
ACT.obapprove=()=>{if(!OB_DOCS.every(x=>OB.drv.checks[x[0]]))return;OB.drv.status='approved';go_('d','approved')};
ACT.obgolive=()=>{U.view='live';buildStage()};
ACT.obreset=()=>{initOB();buildStage()};
// The shared sign-in screens call go/signin/back; in this view they move the onboarding flow instead.
const OB_FLOW={m:{login:'otp',otp:'welcome'},e:{login:'otp',otp:'found'},d:{login:'otp',otp:'profile'}};
const OB_BACK={m:{otp:'login',profile:'welcome',office:'profile',team:'office',sheet:'team',wallet:'team'},e:{otp:'login',setup:'found'},d:{otp:'login',vehicle:'profile',docs:'vehicle'}};
{const _go=ACT.go,_back=ACT.back,_signin=ACT.signin;
 ACT.go=(a,s,...r)=>U.view=='onboard'&&OB_FLOW[a]?void(OB[a]=s):_go(a,s,...r);
 ACT.back=a=>U.view=='onboard'&&OB_BACK[a]?void(OB[a]=OB_BACK[a][OB[a]]||OB[a]):_back(a);
 ACT.signin=a=>U.view=='onboard'&&OB_FLOW[a]?void(OB[a]=OB_FLOW[a].otp):_signin(a);}
function obPhone(a){const map={m:OM,e:OE,d:OD}[a],key={m:'m',e:'e',d:'d'}[a],s=OB[key];return (map[s]||map.lock)()}
function renderOB(){
  const st=obSteps(),cur=st.findIndex(x=>!x[1]),who=cur<0?null:st[cur][2];
  setHTML($('#guide'),`<span class="lab" style="white-space:nowrap">Onboarding</span>`+st.map((s,i)=>`<span class="g ${s[1]?'done':i==cur?'cur':''}"><b>${s[1]?'✓':i+1}</b>${s[0]}</span>`).join('')+`<button class="chip s press" data-act="obreset" style="margin-left:8px">${ms('restart_alt')}Start over</button>`);
  for(const a of ['m','e','d']){const el=$('#scr-'+a);if(!el)continue;const v=obPhone(a);el.className='scr '+v.c;
    setHTML(el,`${sbar()}<div class="body">${v.h}</div>`,'ob'+a+OB[a]);syncPulses(el);
    el.parentElement.classList.toggle('needs',who==a)}
  const dash=$('#dash');if(dash){setHTML(dash,obDash(),'ob'+OB.dash);dash.closest('.laptop').classList.toggle('needs',who=='o')}
  const hint=$('#obhint');if(hint)hint.innerHTML=cur<0?`${ms('celebration','lime')} Everyone is onboarded. <button class="chip g press" data-act="obgolive">Open the live demo</button>`
    :`${ms('touch_app','lime')} Next: <b>${st[cur][0]}</b> · ${{o:'use the owner console below',m:'tap through the manager\'s phone',e:'tap through the employee\'s phone',d:'tap through the driver\'s phone'}[who]}`;
}
