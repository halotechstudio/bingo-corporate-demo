'use strict';
/* ============================================================
   Bingo Corporate — simulation engine (no backend; everything
   here stands in for what the real server will do).
   ============================================================ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const ms=(n,c='',st='')=>`<span class="ms ${c}"${st?` style="${st}"`:''}>${n}</span>`;
const first=n=>n.split(' ')[0];
const ini=n=>n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
const md=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);       // roads are a grid: Manhattan distance
const KMU=0.035, KMPM=0.42, SPD=KMPM/KMU, RATE=1.6;         // km per map unit · km per sim-minute · units per sim-minute · sim-minutes per real second
const r5=n=>Math.round(n/5)*5;
const tstr=m=>{m=((Math.round(m)%1440)+1440)%1440;const h=m/60|0;return (h%12||12)+':'+String(m%60).padStart(2,'0')+(h<12?' AM':' PM')};
const dayLabel=d=>d==0?'Today':d==1?'Tomorrow':d==-1?'Yesterday':'In '+d+' days';

const OFFICES={
  hq:{id:'hq',n:'Acme HQ',a:'Manyata Tech Park, Nagavara',x:560,y:140,ic:'apartment'},
  orr:{id:'orr',n:'Acme ORR Campus',a:'Bellandur, Outer Ring Road',x:650,y:470,ic:'domain'}
};
const VENUES={
  air:{id:'air',n:'Airport Terminal 2',a:'Kempegowda International Airport',x:650,y:10,ic:'flight'},
  conv:{id:'conv',n:'Convention Centre',a:'BIEC, Tumkur Road',x:170,y:160,ic:'stadium'}
};
const place=id=>OFFICES[id]||VENUES[id];
const AREAS={
  ind:{n:'Indiranagar',a:'12th Main, HAL 2nd Stage',x:520,y:330}, wf:{n:'Whitefield',a:'ITPL Main Road',x:850,y:300},
  kor:{n:'Koramangala',a:'5th Block, 80 Feet Road',x:500,y:440}, hsr:{n:'HSR Layout',a:'Sector 2, 27th Main',x:540,y:520},
  jay:{n:'Jayanagar',a:'4th Block, 11th Main',x:380,y:470}, heb:{n:'Hebbal',a:'Kempapura Main Road',x:470,y:120},
  mar:{n:'Marathahalli',a:'Outer Ring Road',x:710,y:380}, krp:{n:'KR Puram',a:'Old Madras Road',x:720,y:250},
  btm:{n:'BTM Layout',a:'2nd Stage, 16th Main',x:450,y:520}, bel:{n:'Bellandur',a:'Green Glen Layout',x:640,y:490},
  jpn:{n:'JP Nagar',a:'6th Phase',x:400,y:570}, mal:{n:'Malleshwaram',a:'15th Cross, Sampige Road',x:330,y:230},
  yel:{n:'Yelahanka',a:'New Town, 4th Phase',x:450,y:40}, raj:{n:'Rajajinagar',a:'1st Block',x:270,y:290}
};
const VEH={
  sedan:{id:'sedan',n:'Sedan',seats:4,base:60,km:16,min:1.5,ic:'local_taxi',eg:'Dzire · Etios · Aura'},
  suv:{id:'suv',n:'SUV',seats:6,base:90,km:21,min:2,ic:'airport_shuttle',eg:'Innova · Ertiga'}
};
const fareFor=(veh,km)=>r5(VEH[veh].base+km*VEH[veh].km+(km/KMPM)*VEH[veh].min);
const TEAMS=['Design','Engineering','Finance','Sales','HR','Product','Support'];

let S, U;                     // S = simulated world (serialisable) · U = presenter/UI state (ui.js)
let _seed=11; const rnd=()=>((_seed=(_seed*9301+49297)%233280)/233280);
const otp4=()=>String(1000+Math.floor(rnd()*9000));

const E=id=>S.emps.find(e=>e.id==id), DR=id=>S.drivers.find(d=>d.id==id), R=id=>S.rides.find(r=>r.id==id);
function hook(n,...a){ if(!S.quiet&&typeof UI!=='undefined'&&UI.on)UI.on(n,...a) }

/* ---------- World ---------- */
function initWorld(){
  _seed=11;
  const emp=(id,name,phone,g,team,shift,area,status='active')=>({id,name,phone,g,team,shift,home:area?{...AREAS[area]}:null,status,
    ec:status=='active'?[{n:g=='F'?'Amma':'Appa',p:'98450 •••• '+(10+id.length*7)}]:[]});
  S={
    now:8*60+10, speed:1, auto:true, quiet:false,
    seq:{ride:1042,bk:204,wd:5003,inc:101,ad:6,emp:13,co:4},
    cfg:{comm:15,womenRule:true,nightFrom:20,otp:true,mask:true,deviation:true,rideCheck:true,lowBal:2000,autoTopup:false},
    company:{id:'c1',name:'Acme Technologies',code:'ACME-4821',gst:'29AAECA1234F1Z5',since:'Mar 2026'},
    manager:{name:'Neha Sharma',role:'Admin · Facilities',phone:'98860 12345'},
    wallet:18500,
    emps:[
      emp('e1','Priya Nair','98801 10001','F','Design','General','ind'), emp('e2','Rahul Verma','98801 10002','M','Engineering','General','wf'),
      emp('e3','Ananya Rao','98801 10003','F','Finance','General','kor'), emp('e4','Karthik S','98801 10004','M','Sales','General','hsr'),
      emp('e5','Meera Iyer','98801 10005','F','HR','General','jay'), emp('e6','Arjun Das','98801 10006','M','Product','General','heb'),
      emp('e7','Sneha Kulkarni','98801 10007','F','Engineering','Evening','mar'), emp('e8','Vikram Shetty','98801 10008','M','Engineering','Evening','krp'),
      emp('e9','Divya Menon','98801 10009','F','Support','Evening','btm'), emp('e10','Farhan Ali','98801 10010','M','Support','Evening','bel'),
      emp('e11','Pooja Hegde','98801 10011','F','Design','General',null,'invited'), emp('e12','Nikhil Jain','98801 10012','M','Sales','General','jpn','request')
    ],
    drivers:[
      ['d1','Suresh Gowda','98450 20001','sedan','Swift Dzire · White','KA 01 AB 1234',4.8,1783,520,250],
      ['d2','Imran Pasha','98450 20002','sedan','Toyota Etios · Silver','KA 03 CD 5521',4.9,1476,760,330],
      ['d3','Lakshmi P','98450 20003','sedan','Hyundai Aura · Grey','KA 05 EF 9087',4.9,912,430,470],
      ['d4','Manoj R','98450 20004','suv','Maruti Ertiga · Blue','KA 02 GH 4410',4.7,2210,600,420],
      ['d5','Divya T','98450 20005','sedan','Maruti Swift · Red','KA 51 JK 7765',4.8,640,440,180],
      ['d6','Ravi B','98450 20006','suv','Toyota Innova · White','KA 04 LM 3302',5.0,3105,660,230],
      ['d7','Naveen K','98450 20007','sedan','Honda Amaze · Black','KA 53 NP 2210',4.6,388,360,380],
      ['d8','Asif Khan','98450 20008','sedan','Tata Tigor · Blue','KA 41 QR 6620',0,0,560,560]
    ].map(([id,name,phone,veh,car,plate,rating,trips,x,y],i)=>({id,name,phone,veh,car,plate,rating,trips,x,y,online:i<7,state:'idle',ride:null,
      earn:[1240,860,0,1430,310,2050,0,0][i],hold:0,kyc:i<7?'approved':'pending',today:{trips:0,earn:0},upi:first(name).toLowerCase()+'@okaxis',bank:['SBI','HDFC','ICICI','Axis','Kotak','Canara','SBI','HDFC'][i]+' ••'+(4200+i*377)})),
    rides:[], bookings:[], ledger:[], oledger:[], wds:[], incidents:[], feed:[], notes:{}, unread:{},
    owner:{adRev:1840,offerRev:0,offers:[]},
    // Cab branding: advertisers pay per car per month; the driver gets a share for carrying it.
    brand:[{id:'b1',adv:'Kaveri Bank',rate:2000,share:600,cars:['d2','d5','d6']}],
    companies:[
      {id:'c1',name:'Acme Technologies',admin:'Neha Sharma',phone:'98860 12345',emps:12,status:'active'},
      {id:'c2',name:'Northwind Logistics',admin:'Rohit Bansal',phone:'98860 55210',emps:46,wallet:61200,rides:312,status:'active'},
      {id:'c3',name:'Zenith Pharma',admin:'Kavitha Reddy',phone:'98860 77431',emps:28,wallet:9400,rides:127,status:'active'}
    ],
    ads:[
      {id:'ad1',adv:'Kaveri Bank',head:'Corporate cards with 2% travel cashback',sub:'Zero annual fee for teams',cta:'Apply now',bg:'linear-gradient(120deg,#0b3d2e,#167a55)',slots:['m_home','m_reports','splash'],active:true,imp:4210,clk:96,cpm:300},
      {id:'ad2',adv:'LunchBox',head:'Hot lunch at your desk by 1 PM',sub:'₹99 meals for office teams',cta:'Order',bg:'linear-gradient(120deg,#7a2a12,#e0662b)',slots:['e_home','e_trip','e_wait'],active:true,imp:9870,clk:412,cpm:200},
      {id:'ad3',adv:'ShieldSure',head:'Cab insurance from ₹19 a day',sub:'Made for full-time drivers',cta:'Get cover',bg:'linear-gradient(120deg,#1b2a6b,#3b63d9)',slots:['d_home','d_done'],active:true,imp:3120,clk:140,cpm:90},
      {id:'ad5',adv:'Pulse Fitness',head:'Corporate gym pass, 40% off',sub:'120 gyms across Bengaluru',cta:'Claim',bg:'linear-gradient(120deg,#4a1466,#b13ad6)',slots:['e_trips','m_done','e_home'],active:true,imp:2380,clk:88,cpm:180},
      {id:'ad4',adv:'FuelUp',head:'Save ₹3 per litre on every fill',sub:'Partner pumps across the city',cta:'Find pumps',bg:'linear-gradient(120deg,#3a3a3a,#111)',slots:['d_home','d_earn'],active:true,imp:1500,clk:31,cpm:90}
    ],
    draft:null
  };
  // History so nothing starts empty: a top-up and five rides yesterday.
  S.quiet=true;S.ads.forEach(a=>a.imp0=a.imp);
  S.ledger.push({t:9*60,day:-2,type:'topup',desc:'Added via UPI · neha@okhdfc',amt:25000});
  S.oledger.push({t:9*60,day:-2,type:'topup',desc:'Acme Technologies wallet top-up',amt:25000});
  const hist=[['pickup','hq',['e2','e1'],'sedan',8*60+30,'d2'],['pickup','hq',['e3','e4','e5'],'sedan',8*60+35,'d3'],['pickup','hq',['e6'],'sedan',8*60+50,'d5'],
    ['drop','hq',['e7','e8'],'sedan',22*60+30,'d1'],['drop','hq',['e10','e9'],'sedan',22*60+35,'d4']];
  for(const [type,pl,emps,veh,when,drv] of hist){
    const r=mkRide({type,place:pl,emps,veh,when,day:-1});
    r.status='completed';r.driver=drv;r.leg=r.stops.length;emps.forEach(e=>r.board[e]='dropped');r.stops.forEach(s=>s.status='done');
    r.share=Math.round(r.fare*(1-S.cfg.comm/100));r.comm=r.fare-r.share;r.stars=5;r.done=when+r.mins;
    S.rides.push(r);
    S.ledger.push({t:when-30,day:-1,type:'ride',desc:r.id+' · '+emps.length+' rider'+(emps.length>1?'s':'')+' · '+rideTitle(r),amt:-r.fare});
    S.oledger.push({t:when-30,day:-1,type:'booking',desc:r.id+' · Acme Technologies',amt:r.fare});
  }
  S.wallet=25000+S.ledger.filter(l=>l.type=='ride').reduce((s,l)=>s+l.amt,0);
  S.wds.push({id:'WD-5001',drv:'d6',amt:1800,to:'ravi@okaxis',status:'paid',t:19*60,day:-1},{id:'WD-5002',drv:'d2',amt:950,to:'HDFC ••4577',status:'paid',t:20*60,day:-1});
  S.oledger.push({t:19*60,day:-1,type:'payout',desc:'WD-5001 · Ravi B',amt:-1800},{t:20*60,day:-1,type:'payout',desc:'WD-5002 · Imran Pasha',amt:-950});
  // A recurring evening drop already on the calendar for tonight.
  const eve=mkRide({type:'drop',place:'hq',emps:orderStops('drop',['e7','e8'],OFFICES.hq,22*60+30).order,veh:'sedan',when:22*60+30,day:0});
  eve.status='scheduled';eve.repeat='Mon–Fri';S.rides.push(eve);
  S.wallet-=eve.fare;S.ledger.push({t:7*60+40,day:0,type:'ride',desc:eve.id+' · 2 riders · '+rideTitle(eve),amt:-eve.fare});
  S.oledger.push({t:7*60+40,day:0,type:'booking',desc:eve.id+' · Acme Technologies',amt:eve.fare});
  feed('bolt','Platform live · 7 drivers online · Acme wallet '+fmt(S.wallet));
  S.quiet=false;
}

/* ---------- Rides ---------- */
function rideTitle(r){const p=place(r.place);return r.type=='drop'?p.n+' → homes':(r.type=='custom'?'Homes → '+p.n:'Homes → '+p.n)}
function mkRide({type,place:pl,emps,veh,when,day=0,bk=null}){
  const p=place(pl);
  const stops=type=='drop'
    ?[{k:'pickup',emps:[...emps],p:{n:p.n,a:p.a,x:p.x,y:p.y},status:'pending'},...emps.map(e=>({k:'drop',emps:[e],p:{...E(e).home},status:'pending'}))]
    :[...emps.map(e=>({k:'pickup',emps:[e],p:{...E(e).home},status:'pending'})),{k:'drop',emps:[...emps],p:{n:p.n,a:p.a,x:p.x,y:p.y},status:'pending'}];
  let u=0;for(let i=1;i<stops.length;i++)u+=md(stops[i-1].p,stops[i].p);
  const km=Math.round(u*KMU*10)/10, mins=Math.round(km/KMPM)+stops.length*2;
  const r={id:'BC-'+(S.seq.ride++),bk,type,place:pl,emps:[...emps],veh,when,day,status:'searching',stops,km,mins,fare:fareFor(veh,km),
    otp:{},board:{},driver:null,leg:0,phase:'moving',pts:[],pi:0,rejected:[],timer:1.5,notes:[]};
  emps.forEach(e=>{r.otp[e]=otp4();r.board[e]='waiting'});
  return r;
}
/* Stop order: nearest-neighbour chain, then the night safety rule. */
function orderStops(type,emps,pl,when){
  const left=[...emps],order=[];let cur=pl,note='';
  if(type=='drop'){while(left.length){left.sort((a,b)=>md(E(a).home,cur)-md(E(b).home,cur));const e=left.shift();order.push(e);cur=E(e).home}}
  else{left.sort((a,b)=>md(E(b).home,pl)-md(E(a).home,pl));let c=E(left[0]).home;order.push(left.shift());
    while(left.length){left.sort((a,b)=>md(E(a).home,c)-md(E(b).home,c));const e=left.shift();order.push(e);c=E(e).home}}
  const h=(when/60|0)%24, night=h>=S.cfg.nightFrom||h<6;
  if(S.cfg.womenRule&&night&&order.length>1){
    const men=order.filter(e=>E(e).g=='M');
    if(type=='drop'&&E(order[order.length-1]).g=='F'&&men.length){const m=men[men.length-1];order.splice(order.indexOf(m),1);order.push(m);
      note='Night safety rule: '+first(E(m).name)+' is dropped last, so no woman rides alone with the driver.'}
    else if(type!='drop'&&E(order[0]).g=='F'&&men.length){const m=men[0];order.splice(order.indexOf(m),1);order.unshift(m);
      note='Night safety rule: '+first(E(m).name)+' is picked up first, so no woman rides alone with the driver.'}
    else if(!men.length)note='Night ride with only women on board: a verified top-rated driver is assigned and the safety desk tracks it live.';
  }
  return {order,note};
}
/* Smart plan: people whose homes lie in the same direction share one cab. */
function planRides(D){
  const pl=place(D.place), sel=D.sel.filter(e=>E(e)&&E(e).home&&E(e).status=='active');
  const ang=e=>Math.atan2(E(e).home.y-pl.y,E(e).home.x-pl.x);
  let groups=[];
  if(D.pool){
    const s=[...sel].sort((a,b)=>ang(a)-ang(b));
    for(const e of s){const g=groups[groups.length-1];
      if(g&&g.length<6&&Math.abs(ang(e)-ang(g[0]))<0.75&&md(E(e).home,E(g[g.length-1]).home)<330)g.push(e);else groups.push([e])}
    // wrap-around: first and last groups may face the same way
    if(groups.length>2){const a=groups[0],b=groups[groups.length-1];if(a.length+b.length<=6&&Math.abs(ang(a[0])+2*Math.PI-ang(b[0]))<0.75){groups[0]=[...b,...a];groups.pop()}}
  }else groups=sel.map(e=>[e]);
  const out=[];
  for(const g of groups){
    const key=[...g].sort().join('+');
    const parts=(D.split||[]).includes(key)?g.map(e=>[e]):[g];
    for(const p of parts){
      const {order,note}=orderStops(D.type,p,pl,D.when);
      const veh=order.length>4?'suv':'sedan';
      const solo=order.reduce((s,e)=>s+fareFor('sedan',md(E(e).home,pl)*KMU),0);
      const seqn=S.seq.ride;const r=mkRide({type:D.type,place:D.place,emps:order,veh,when:D.when,day:D.day});S.seq.ride=seqn; // preview only
      out.push({key,emps:order,veh,km:r.km,mins:r.mins,fare:r.fare,solo,note,stops:r.stops,pooled:order.length>1,canSplit:g.length>1,isSplit:parts.length>1});
    }
  }
  const total=out.reduce((s,r)=>s+r.fare,0), solo=out.reduce((s,r)=>s+r.solo,0);
  return {rides:out,total,solo,saved:Math.max(0,solo-total),cabs:out.length,people:sel.length};
}
function newDraft(type='pickup'){
  S.draft={type,place:'hq',when:Math.ceil((S.now+5)/5)*5,day:0,now:true,repeat:false,sel:[],pool:true,split:[],team:'All'};
}
function payBooking(){
  const D=S.draft, P=planRides(D);
  if(!P.rides.length||S.wallet<P.total)return null;
  const bk={id:'GB-'+(S.seq.bk++),t:S.now,total:P.total,rides:[],type:D.type,place:D.place,when:D.when,day:D.day,repeat:D.repeat};
  for(const p of P.rides){
    const r=mkRide({type:D.type,place:D.place,emps:p.emps,veh:p.veh,when:D.when,day:D.day,bk:bk.id});
    r.safety=p.note;r.repeat=D.repeat?'Mon–Fri':'';
    r.status=(D.now&&D.day==0)?'searching':'scheduled';
    S.rides.push(r);bk.rides.push(r.id);
    const w=(D.now&&D.day==0)?'now':dayLabel(D.day)+' '+tstr(D.when);
    p.emps.forEach(e=>note('e:'+e,{ic:'event_available',t:'Ride booked for you',b:first(S.manager.name)+' booked your cab · '+rideTitle(r)+' · '+w,ride:r.id}));
  }
  S.wallet-=P.total;S.bookings.push(bk);
  S.ledger.push({t:S.now,day:0,type:'ride',desc:bk.id+' · '+P.cabs+' cab'+(P.cabs>1?'s':'')+' · '+P.people+' riders',amt:-P.total});
  S.oledger.push({t:S.now,day:0,type:'booking',desc:bk.id+' · '+S.company.name+' · '+P.cabs+' cab'+(P.cabs>1?'s':''),amt:P.total});
  note('o',{ic:'payments',t:'Payment received · '+fmt(P.total),b:S.company.name+' booked '+P.cabs+' cab'+(P.cabs>1?'s':'')+' for '+P.people+' employees ('+bk.id+')'});
  note('m',{ic:'check_circle',t:'Booking confirmed · '+bk.id,b:fmt(P.total)+' paid from wallet · '+P.cabs+' cab'+(P.cabs>1?'s':'')+' for '+P.people+' people'});
  feed('add_circle',S.company.name+' booked '+P.cabs+' cab'+(P.cabs>1?'s':'')+' · '+fmt(P.total)+' received','g');
  if(S.wallet<S.cfg.lowBal)note('m',{ic:'account_balance_wallet',t:'Wallet running low',b:'Only '+fmt(S.wallet)+' left. Add money so tomorrow\'s rides are not blocked.',kind:'warn'});
  S.draft=null;hook('booked',bk);
  return bk;
}
const active=r=>['searching','offered','enroute'].includes(r.status);
const live=()=>S.rides.filter(active);
function empStatus(r,e){
  if(r.board[e]=='noshow')return 'noshow';
  if(r.status!='enroute')return r.status;
  const b=r.board[e];if(b=='in')return 'onboard';if(b!='waiting')return b;
  const i=r.stops.findIndex(s=>s.k=='pickup'&&s.emps.includes(e));
  return r.leg==i?(r.phase=='wait'?'here':'arriving'):'assigned';
}
/* The ride an employee should be looking at right now (live first, else next scheduled). */
function rideFor(e){
  const mine=S.rides.filter(r=>r.emps.includes(e)&&r.day>=0);
  return mine.find(r=>active(r)&&!['dropped','noshow'].includes(r.board[e]))
      ||mine.filter(r=>r.status=='scheduled').sort((a,b)=>a.day*1440+a.when-b.day*1440-b.when)[0]||null;
}
function buildPath(r){
  const d=DR(r.driver);let cur={x:d.x,y:d.y};r.pts=[];r.pi=0;
  for(let i=r.leg;i<r.stops.length;i++){const s=r.stops[i].p;if(s.x!=cur.x&&s.y!=cur.y)r.pts.push({x:s.x,y:cur.y});r.pts.push({x:s.x,y:s.y,stop:i});cur=s}
}
function distToStop(r,i){
  if(i<r.leg||(i==r.leg&&r.phase=='wait'))return 0;
  const d=DR(r.driver);let cur=d,u=0;
  for(let k=r.pi;k<r.pts.length;k++){u+=md(cur,r.pts[k]);cur=r.pts[k];if(r.pts[k].stop===i)return u}
  return i<r.leg?0:u;
}
const etaTo=(r,i)=>Math.max(1,Math.round(distToStop(r,i)*KMU/KMPM+Math.max(0,i-r.leg)*1.5));
const myStop=(r,e,k)=>r.stops.findIndex(s=>s.k==k&&s.emps.includes(e));
function progress(r){if(r.status=='completed')return 1;if(r.status!='enroute')return 0;const tot=r.totalU||1;return Math.max(0,Math.min(1,1-distToStop(r,r.stops.length-1)/tot))}

function dispatch(r){
  const need=r.emps.length, f=r.stops[0].p;
  let pool=S.drivers.filter(d=>d.kyc=='approved'&&d.online&&d.state=='idle'&&VEH[d.veh].seats>=need&&!r.rejected.includes(d.id)&&(r.veh!='suv'||d.veh=='suv'));
  if(!pool.length){r.timer=2;return}
  pool.sort((a,b)=>md(a,f)-md(b,f));
  let d=pool[0];
  if(!S.auto&&typeof U!=='undefined'){const mine=pool.find(x=>x.id==U.drv);if(mine)d=mine}  // manual mode: the phone on screen gets the request
  d.state='offered';d.ride=r.id;r.driver=d.id;r.status='offered';r.offerT=20;r.autoT=2.2;
  note('d:'+d.id,{ic:'notifications_active',t:'New corporate ride',b:r.emps.length+' rider'+(r.emps.length>1?'s':'')+' · '+r.stops.length+' stops · you earn '+fmt(r.fare*(1-S.cfg.comm/100)),ride:r.id});
  feed('radar','Offered '+r.id+' to nearest driver '+d.name+' ('+(md(d,f)*KMU).toFixed(1)+' km away)');
  hook('offer',r,d);
}
function acceptRide(r){
  const d=DR(r.driver);r.status='enroute';d.state='busy';r.leg=0;r.phase='moving';buildPath(r);r.totalU=distToStop(r,r.stops.length-1);r.accepted=S.now;
  for(const e of r.emps){const i=myStop(r,e,'pickup');
    note('e:'+e,{ic:'local_taxi',t:d.name+' is your driver',b:d.car+' · '+d.plate+' · arriving in '+etaTo(r,i)+' min · your OTP is '+r.otp[e],ride:r.id})}
  note('m',{ic:'local_taxi',t:'Driver assigned · '+r.id,b:d.name+' ('+d.plate+') is on the way for '+r.emps.map(e=>first(E(e).name)).join(', '),ride:r.id});
  feed('near_me',d.name+' accepted '+r.id+' · '+r.emps.length+' rider'+(r.emps.length>1?'s':''));
  hook('accepted',r,d);
}
function declineRide(r){const d=DR(r.driver);d.state='idle';d.ride=null;r.rejected.push(d.id);r.driver=null;r.status='searching';r.timer=1;
  feed('block',d.name+' passed on '+r.id+' · finding the next driver');hook('declined',r,d)}
function arrive(r,i){
  const s=r.stops[i],d=DR(r.driver);r.phase='wait';r.waitT=1.6;s.status='arrived';s.at=S.now;
  if(s.k=='pickup'){
    for(const e of s.emps)if(r.board[e]=='waiting')note('e:'+e,{ic:'place',t:'Your driver has arrived',b:d.name+' is at '+s.p.n+' · '+d.plate+' · share OTP '+r.otp[e]+' to board',ride:r.id});
    feed('place',d.name+' reached '+s.p.n+' for pickup');
  }
  hook('arrive',r,i);
}
function board(r,e){
  if(r.board[e]!='waiting')return;r.board[e]='in';r.waitT=1.3;
  note('e:'+e,{ic:'verified_user',t:'OTP verified · trip started',b:'You are on board. Live trip is shared with '+first(S.manager.name)+' and your trusted contact.',ride:r.id});
  note('m',{ic:'how_to_reg',t:first(E(e).name)+' is on board',b:r.id+' · OTP verified by '+DR(r.driver).name,ride:r.id});
  feed('how_to_reg','OTP verified · '+E(e).name+' boarded '+r.id);
  hook('board',r,e);
}
function noShow(r,e){
  if(r.board[e]!='waiting')return;r.board[e]='noshow';r.waitT=.8;
  note('e:'+e,{ic:'person_off',t:'You missed your cab',b:'The driver waited at your pickup and has left. Contact '+first(S.manager.name)+' for another ride.',kind:'warn',ride:r.id});
  note('m',{ic:'person_off',t:first(E(e).name)+' did not show up',b:r.id+' · driver waited at '+E(e).home.n+' and moved on',kind:'warn',ride:r.id});
  feed('person_off',E(e).name+' was a no-show on '+r.id);
}
function dropStop(r,i){
  const s=r.stops[i];const h=(S.now/60|0)%24,night=h>=S.cfg.nightFrom||h<6;
  for(const e of s.emps){if(r.board[e]!='in')continue;r.board[e]='dropped';
    note('e:'+e,{ic:'check_circle',t:'You have arrived',b:'Dropped at '+s.p.n+'. Paid by '+S.company.name+', nothing to pay.'+(night?' Tap "I\'m home safe" to confirm.':''),ride:r.id});
    if(s.emps.length==1)note('m',{ic:'home',t:first(E(e).name)+' reached '+s.p.n,b:r.id+' · dropped safely at '+tstr(S.now),ride:r.id});
  }
  if(s.emps.length>1)note('m',{ic:'apartment',t:s.emps.length+' people reached '+s.p.n,b:r.id+' · '+s.emps.filter(e=>r.board[e]=='dropped').map(e=>first(E(e).name)).join(', '),ride:r.id});
  feed('flag',DR(r.driver).name+' dropped '+s.emps.filter(e=>r.board[e]=='dropped').map(e=>first(E(e).name)).join(', ')+' at '+s.p.n);
  hook('drop',r,i);
}
function leave(r){
  const s=r.stops[r.leg];s.status='done';r.leg++;
  if(r.leg>=r.stops.length)return completeRide(r);
  r.phase='moving';
  const n=r.stops[r.leg];
  if(n.k=='pickup')for(const e of n.emps)note('e:'+e,{ic:'schedule',t:'You are next',b:DR(r.driver).name+' reaches you in about '+etaTo(r,r.leg)+' min. Please be at the pickup point.',ride:r.id});
}
function completeRide(r){
  const d=DR(r.driver);r.status='completed';r.done=S.now;
  r.share=Math.round(r.fare*(1-S.cfg.comm/100));r.comm=r.fare-r.share;
  d.earn+=r.share;d.today.trips++;d.today.earn+=r.share;d.trips++;d.state='idle';d.ride=null;
  note('d:'+d.id,{ic:'payments',t:fmt(r.share)+' added to your wallet',b:r.id+' complete · withdraw any time',ride:r.id});
  note('m',{ic:'task_alt',t:r.id+' complete',b:r.emps.filter(e=>r.board[e]=='dropped').length+' of '+r.emps.length+' riders dropped · '+fmt(r.fare),ride:r.id});
  feed('task_alt',r.id+' complete · '+d.name+' earned '+fmt(r.share)+' · Bingo commission '+fmt(r.comm),'g');
  hook('complete',r,d);
}
function cancelRide(r,by='manager'){
  if(!['scheduled','searching','offered','enroute'].includes(r.status))return false;
  if(Object.values(r.board).some(b=>b=='in'||b=='dropped'))return false;
  if(r.driver){const d=DR(r.driver);d.state='idle';d.ride=null;note('d:'+d.id,{ic:'cancel',t:'Ride cancelled',b:r.id+' was cancelled by the company. You are free for new rides.',kind:'warn'})}
  r.status='cancelled';S.wallet+=r.fare;
  S.ledger.push({t:S.now,day:0,type:'refund',desc:r.id+' cancelled · refund',amt:r.fare});
  S.oledger.push({t:S.now,day:0,type:'refund',desc:r.id+' cancelled · refunded to '+S.company.name,amt:-r.fare});
  r.emps.forEach(e=>note('e:'+e,{ic:'cancel',t:'Ride cancelled',b:first(S.manager.name)+' cancelled your '+tstr(r.when)+' cab.',kind:'warn'}));
  note('m',{ic:'undo',t:fmt(r.fare)+' refunded',b:r.id+' cancelled · money is back in the wallet'});
  note('o',{ic:'undo',t:'Refund issued · '+fmt(r.fare),b:r.id+' cancelled by '+S.company.name});
  feed('cancel',r.id+' cancelled by '+by+' · '+fmt(r.fare)+' refunded');
  hook('cancelled',r);return true;
}
const autoFor=r=>S.auto||typeof U==='undefined'||U.drv!==r.driver;

/* ---------- Clock ---------- */
function tick(dt){
  const sim=dt*RATE*S.speed;S.now+=sim;
  for(const w of S.wds)if(w.status=='processing'){w.timer-=dt*S.speed;if(w.timer<=0)paidOut(w)}
  for(const r of S.rides){
    if(r.status=='scheduled'){if(r.day==0&&S.now>=r.when-20){r.status='searching';r.timer=1;
        r.emps.forEach(e=>note('e:'+e,{ic:'radar',t:'Finding your driver',b:'Your '+tstr(r.when)+' cab is being assigned. You will get the driver details shortly.',ride:r.id}))}}
    else if(r.status=='searching'){r.timer-=dt*S.speed;if(r.timer<=0)dispatch(r)}
    else if(r.status=='offered'){r.offerT-=dt;if(autoFor(r)){r.autoT-=dt*S.speed;if(r.autoT<=0)acceptRide(r)}else if(r.offerT<=0)declineRide(r)}
    else if(r.status=='enroute'){
      const d=DR(r.driver);
      if(r.phase=='moving'){
        let step=sim*SPD;
        while(step>0&&r.pi<r.pts.length){const p=r.pts[r.pi],L=md(d,p);
          if(L<=step){d.x=p.x;d.y=p.y;step-=L;r.pi++;if(p.stop!==undefined){arrive(r,p.stop);break}}
          else{const dx=p.x-d.x,dy=p.y-d.y;d.x+=Math.sign(dx)*Math.min(Math.abs(dx),step);if(dx==0)d.y+=Math.sign(dy)*Math.min(Math.abs(dy),step);step=0}}
      }else{
        const s=r.stops[r.leg];
        if(s.k=='pickup'){const w=s.emps.filter(e=>r.board[e]=='waiting');
          if(!w.length){r.waitT-=dt*S.speed;if(r.waitT<=0)leave(r)}
          else if(autoFor(r)){r.waitT-=dt*S.speed;if(r.waitT<=0)board(r,w[0])}}
        else if(autoFor(r)||r.dropOk){r.waitT-=dt*S.speed;if(r.waitT<=0){r.dropOk=false;dropStop(r,r.leg);leave(r)}}
      }
    }
  }
}

/* ---------- Notifications & activity ---------- */
function note(to,n){
  n={...n,at:S.now,id:(S.nid=(S.nid||0)+1)};
  (S.notes[to]=S.notes[to]||[]).unshift(n);if(S.notes[to].length>40)S.notes[to].pop();
  S.unread[to]=(S.unread[to]||0)+1;hook('note',to,n);
}
function feed(ic,msg,c=''){S.feed.unshift({ic,msg,c,at:S.now});if(S.feed.length>80)S.feed.pop()}

/* ---------- Wallet & payouts ---------- */
function topUp(amt,method='UPI'){
  S.wallet+=amt;S.ledger.push({t:S.now,day:0,type:'topup',desc:'Added via '+method,amt});
  S.oledger.push({t:S.now,day:0,type:'topup',desc:S.company.name+' wallet top-up ('+method+')',amt});
  note('m',{ic:'account_balance_wallet',t:fmt(amt)+' added to wallet',b:'New balance '+fmt(S.wallet)+' · '+method});
  note('o',{ic:'account_balance_wallet',t:'Wallet top-up · '+fmt(amt),b:S.company.name+' added money via '+method});
  feed('account_balance_wallet',S.company.name+' topped up '+fmt(amt)+' via '+method);
}
function withdraw(d,amt,to){
  amt=Math.floor(amt);if(amt<100||amt>d.earn)return null;
  d.earn-=amt;d.hold+=amt;
  const w={id:'WD-'+(S.seq.wd++),drv:d.id,amt,to,status:'pending',t:S.now,day:0};S.wds.unshift(w);
  note('o',{ic:'payments',t:'Payout request · '+fmt(amt),b:d.name+' asked to withdraw to '+to+' ('+w.id+')',kind:'req'});
  note('d:'+d.id,{ic:'hourglass_top',t:'Withdrawal requested',b:fmt(amt)+' to '+to+' · Bingo will process it shortly'});
  feed('payments',d.name+' requested a payout of '+fmt(amt));hook('withdraw',w);return w;
}
function approveWd(w){if(w.status!='pending')return;w.status='processing';w.timer=3;
  note('d:'+w.drv,{ic:'sync_alt',t:'Payout approved',b:fmt(w.amt)+' is on its way to '+w.to});feed('task_alt',w.id+' approved · sent to bank')}
function rejectWd(w){if(w.status!='pending')return;const d=DR(w.drv);w.status='rejected';d.hold-=w.amt;d.earn+=w.amt;
  note('d:'+w.drv,{ic:'block',t:'Payout rejected',b:fmt(w.amt)+' is back in your wallet. Contact support for details.',kind:'warn'});feed('block',w.id+' rejected')}
function paidOut(w){const d=DR(w.drv);w.status='paid';d.hold-=w.amt;
  S.oledger.push({t:S.now,day:0,type:'payout',desc:w.id+' · '+d.name+' · '+w.to,amt:-w.amt});
  note('d:'+w.drv,{ic:'account_balance',t:fmt(w.amt)+' credited to your bank',b:w.id+' paid to '+w.to});
  note('o',{ic:'check_circle',t:w.id+' paid',b:fmt(w.amt)+' sent to '+d.name});feed('account_balance',d.name+' received '+fmt(w.amt)+' in '+w.to,'g')}
function ownerStats(){
  const today=S.oledger.filter(l=>l.day==0), sum=(a,t)=>a.filter(l=>l.type==t).reduce((s,l)=>s+l.amt,0);
  const done=S.rides.filter(r=>r.status=='completed');
  const brandNet=S.brand.reduce((s,b)=>s+b.cars.length*(b.rate-b.share),0);
  const adRev=S.owner.adRev+S.owner.offerRev+brandNet+S.ads.reduce((s,a)=>s+((a.imp-(a.imp0??a.imp))*a.cpm/1000),0);
  return {received:sum(today,'booking')+sum(today,'refund'),allReceived:sum(S.oledger,'booking')+sum(S.oledger,'refund'),
    commission:done.reduce((s,r)=>s+r.comm,0),commToday:done.filter(r=>r.day==0).reduce((s,r)=>s+r.comm,0),
    due:S.drivers.reduce((s,d)=>s+d.earn,0),hold:S.drivers.reduce((s,d)=>s+d.hold,0),
    paid:-sum(S.oledger,'payout'),pending:S.wds.filter(w=>w.status=='pending'),adRev,float:S.wallet+61200+9400};
}

/* ---------- Safety ---------- */
function raiseSOS(e,from='employee'){
  const r=S.rides.find(x=>x.emps.includes(e)&&x.status=='enroute')||rideFor(e);const d=r&&r.driver?DR(r.driver):null;
  const inc={id:'INC-'+(S.seq.inc++),emp:e,ride:r?r.id:null,drv:d?d.id:null,at:S.now,status:'open',x:d?d.x:E(e).home.x,y:d?d.y:E(e).home.y,kind:'sos',
    log:[{at:S.now,m:first(E(e).name)+' pressed SOS'+(r?' on '+r.id:'')},{at:S.now,m:'Live location shared with trusted contact '+(E(e).ec[0]?E(e).ec[0].n:'')+' by SMS'},{at:S.now,m:'Alert sent to '+S.manager.name+' and the Bingo safety desk'}]};
  S.incidents.unshift(inc);
  note('m',{ic:'sos',t:'SOS · '+E(e).name,b:(r?r.id+' · ':'')+'needs help now. Tap to see live location and call.',kind:'sos',inc:inc.id});
  note('o',{ic:'sos',t:'SOS raised · '+E(e).name,b:S.company.name+(d?' · driver '+d.name+' · '+d.plate:''),kind:'sos',inc:inc.id});
  if(d)note('d:'+d.id,{ic:'sos',t:'Rider pressed SOS',b:'Stop safely. The Bingo safety desk is calling you.',kind:'sos'});
  feed('sos','SOS raised by '+E(e).name+(r?' on '+r.id:''),'r');hook('sos',inc);return inc;
}
function incStep(inc,st,who){
  inc.status=st;const e=E(inc.emp);
  if(st=='ack'){inc.log.push({at:S.now,m:who+' acknowledged and is calling '+first(e.name)});note('e:'+inc.emp,{ic:'support_agent',t:'Help is on the way',b:who+' has seen your SOS and is calling you now.',kind:'sos'})}
  if(st=='resolved'){inc.log.push({at:S.now,m:'Marked safe and closed by '+who});note('e:'+inc.emp,{ic:'verified_user',t:'Marked safe',b:'Your SOS was closed by '+who+'. Stay safe.'});
    note('m',{ic:'verified_user',t:inc.id+' closed',b:e.name+' is safe · closed by '+who});feed('verified_user',inc.id+' resolved · '+e.name+' is safe','g')}
}

/* ---------- Team ---------- */
function addEmp(name,phone,team='Engineering',g='M'){
  const e={id:'e'+(S.seq.emp++),name,phone,g,team,shift:'General',home:null,status:'invited',ec:[]};S.emps.push(e);
  feed('person_add',first(S.manager.name)+' invited '+name+' ('+phone+')');return e;
}
function activateEmp(e,area,contact){
  e.home={...AREAS[area]};e.status='active';e.ec=[{n:contact||'Emergency contact',p:'98450 •••• 42'}];
  note('m',{ic:'how_to_reg',t:first(e.name)+' joined '+S.company.name,b:'Signed in with '+e.phone+' and added a pickup address in '+e.home.n+'. Ready to be booked.'});
  feed('how_to_reg',e.name+' joined '+S.company.name+' by phone number');
}

/* ---------- Ads ---------- */
function adFor(slot){const a=S.ads.filter(a=>a.active&&a.slots.includes(slot));return a.length?a[Math.floor(S.now/7)%a.length]:null}
