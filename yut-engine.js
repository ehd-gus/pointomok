// 마법 윷놀이 규칙 엔진 (화면과 분리: 방장 화면에서만 실행하고, 결과 상태를 모두에게 보냅니다)
(function(root){
'use strict';
const PIECES=4,MAX_AUG=3,PICK_EVERY=3;
const COLORS=['#d8443f','#3f7fd8','#3fae5c','#e0a92e'];
const CNAMES=['빨강','파랑','초록','노랑'];

/* ---- 판: 바깥 20칸(o0=참먹이) + 대각선 2줄(a: 모→찌모, b: 뒷모→참먹이), C=방 ---- */
const POS={};
for(let i=0;i<20;i++){let x,y;
 if(i<=5){x=100;y=100-i*20}else if(i<=10){x=100-(i-5)*20;y=0}else if(i<=15){x=0;y=(i-10)*20}else{x=(i-15)*20;y=100}
 POS['o'+i]=[x,y]}
POS.a1=[83.33,16.67];POS.a2=[66.67,33.33];POS.C=[50,50];POS.a3=[33.33,66.67];POS.a4=[16.67,83.33];
POS.b1=[16.67,16.67];POS.b2=[33.33,33.33];POS.b3=[66.67,66.67];POS.b4=[83.33,83.33];
const NODES=Object.keys(POS);
function step(cur,prev,start){
 if(cur==='H')return'o1';
 if(cur[0]==='o'){const k=+cur.slice(1);
  if(k===5&&cur===start)return'a1';if(k===10&&cur===start)return'b1';
  if(k===19||k===0)return'FIN';return'o'+(k+1)}
 switch(cur){case'a1':return'a2';case'a2':return'C';case'a3':return'a4';case'a4':return'o15';
  case'b1':return'b2';case'b2':return'C';case'b3':return'b4';case'b4':return'FIN';
  case'C':return cur===start?'b3':prev==='a2'?'a3':'b3'}
 return'FIN'}
function walk(from,v){const path=[];let cur=from,prev=null;
 for(let i=0;i<v;i++){const n=step(cur,prev,from);if(n==='FIN'){path.push('FIN');return path}prev=cur;cur=n;path.push(n)}
 return path}
function backOf(p){if(p.prev&&p.prev!=='H')return p.prev;const n=p.n;
 if(n[0]==='o'){const k=+n.slice(1);return'o'+((k+19)%20)}
 return{a1:'o5',a2:'a1',C:'a2',a3:'C',a4:'a3',b1:'o10',b2:'b1',b3:'C',b4:'b3'}[n]||n}
function distFin(n){if(n==='F')return 0;let cur=n,prev=null,d=0;while(d<40){const x=step(cur,prev,n);d++;if(x==='FIN')return d;prev=cur;cur=x}return d}
const NEAR=['o15','o16','o17','o18','o19','b3','b4','C'];

/* ---- 윷 ---- */
const YUT=[['빽도',-1,1],['도',1,3],['개',2,6],['걸',3,4],['윷',4,1],['모',5,1]];

/* ---- 증강 ---- */
const AUGS=[
 {id:'mo3',name:'모의 축복',icon:'🌟',d:'모가 나올 확률이 3배가 됩니다.'},
 {id:'yut3',name:'윷의 축복',icon:'✨',d:'윷이 나올 확률이 3배가 됩니다.'},
 {id:'gae3',name:'개 전문가',icon:'🐕',d:'개가 나오면 2칸 대신 3칸 갑니다.'},
 {id:'geol4',name:'걸 도약',icon:'🐑',d:'걸이 나오면 3칸 대신 4칸 갑니다.'},
 {id:'backfwd',name:'빽도 반전',icon:'🔄',d:'빽도가 나오면 뒤로 1칸 대신 앞으로 2칸 갑니다.'},
 {id:'noback',name:'꾸준함',icon:'🧱',d:'빽도가 나오지 않습니다. (도로 바뀜)'},
 {id:'firstdo',name:'도 보너스',icon:'🐷',d:'턴의 첫 결과가 도면 한 번 더 던집니다.'},
 {id:'start1',name:'출발 부스트',icon:'🚀',d:'새 말을 판에 올릴 때 1칸 더 갑니다.'},
 {id:'twins',name:'쌍둥이 출발',icon:'👯',d:'새 말을 낼 때 집에 말이 2개 이상이면 둘이 업혀서 출발합니다.'},
 {id:'stack1',name:'업기 달인',icon:'🧗',d:'2개 이상 업힌 말이 움직일 때 1칸 더 갑니다.'},
 {id:'sprint',name:'결승 질주',icon:'🏁',d:'방(가운데)이나 마지막 줄에서 움직이면 1칸 더 갑니다.'},
 {id:'hunter',name:'사냥꾼',icon:'🏹',d:'상대 말을 잡으면 한 번이 아니라 두 번 더 던집니다.'},
 {id:'armor',name:'철갑',icon:'🛡️',d:'처음 한 번은 잡혀도 버팁니다.'},
 {id:'thorn',name:'가시',icon:'🌵',d:'내 말을 잡은 상대 말도 함께 집으로 돌아갑니다.'},
 {id:'revenge',name:'복수',icon:'😤',d:'내 말이 잡히면 다음 턴에 한 번 더 던집니다.'},
 {id:'safe',name:'성역',icon:'⛩️',d:'방(가운데)에 있는 내 말은 잡히지 않습니다.'},
 {id:'insure',name:'보험',icon:'📄',d:'잡혀도 집 대신 첫 칸(도 자리)으로 돌아갑니다.'},
 {id:'trap',name:'덫',icon:'🪤',d:'받는 순간 빈칸 2곳에 덫이 놓입니다. 상대가 덫에 멈추면 집으로 돌아갑니다.'},
 {id:'tele',name:'순간이동',icon:'🌀',d:'한 번만: 내 말 하나(업힌 말 포함)를 방(가운데)으로 옮깁니다.',a:1},
 {id:'swap',name:'바꿔치기',icon:'🔀',d:'한 번만: 내 말과 상대 말의 자리를 바꿉니다.',a:1},
 {id:'freeze',name:'얼리기',icon:'🧊',d:'한 번만: 상대 한 명의 다음 턴을 건너뜁니다.',a:1},
 {id:'seal',name:'봉인',icon:'🔒',d:'한 번만: 상대의 증강 하나를 이번 판 동안 못 쓰게 합니다.',a:1}];
const AUG={};AUGS.forEach(a=>AUG[a.id]=a);

/* ---- 상태 ---- */
function rnd(G){G.seed=(Math.imul(G.seed^(G.seed>>>15),2246822519)+0x9e3779b9)>>>0;G.seed=(G.seed^(G.seed>>>13))>>>0;return G.seed/4294967296}
function newGame(players,seed){
 const G={v:1,seed:(seed>>>0)||1,seats:players.map((p,i)=>({name:p.name,ai:!!p.ai,color:COLORS[i],cname:CNAMES[i],
  pieces:Array.from({length:PIECES},()=>({n:'H',prev:null})),aug:[],offers:null,used:{},frozen:false,bank:0,armorUsed:false,turns:0})),
  turn:0,phase:'pick',results:[],throws:0,firstThrow:true,traps:{},log:[],winner:null,pickNo:1,nextPickAt:PICK_EVERY,lastThrow:null,ev:0};
 G.turn=Math.floor(rnd(G)*players.length);
 startPick(G);addLog(G,'게임 시작! 증강을 하나씩 고르세요.');return G}
function addLog(G,t){G.log.push(t);if(G.log.length>60)G.log.shift()}
const has=(G,s,id)=>G.seats[s].aug.some(a=>a.id===id&&!a.off);
function startPick(G){G.phase='pick';let any=false;
 G.seats.forEach((st,s)=>{if(st.aug.length>=MAX_AUG){st.offers=null;return}
  const own=new Set(st.aug.map(a=>a.id)),pool=AUGS.filter(a=>!own.has(a.id)).map(a=>a.id);
  const off=[];while(off.length<3&&pool.length){off.push(pool.splice(Math.floor(rnd(G)*pool.length),1)[0])}
  st.offers=off;any=true});
 if(!any)beginTurn(G)}
function pickAug(G,s,id){const st=G.seats[s];if(G.phase!=='pick'||!st.offers||!st.offers.includes(id))return false;
 st.aug.push({id});st.offers=null;addLog(G,`${st.name}: ${AUG[id].icon} ${AUG[id].name}`);
 if(id==='trap')placeTraps(G,s,2);
 if(G.seats.every(x=>!x.offers))beginTurn(G);G.ev++;return true}
function placeTraps(G,s,n){const occ=new Set();G.seats.forEach(st=>st.pieces.forEach(p=>occ.add(p.n)));
 const free=NODES.filter(k=>k!=='o0'&&k!=='o1'&&!occ.has(k)&&!G.traps[k]);
 for(let i=0;i<n&&free.length;i++){const k=free.splice(Math.floor(rnd(G)*free.length),1)[0];G.traps[k]=s}}
function beginTurn(G){
 for(let guard=0;guard<10;guard++){const st=G.seats[G.turn];
  if(st.frozen){st.frozen=false;st.turns++;addLog(G,`🧊 ${st.name}의 턴이 얼어서 넘어갑니다.`);G.turn=(G.turn+1)%G.seats.length;continue}
  break}
 const st=G.seats[G.turn];G.phase='throw';G.results=[];G.throws=1+st.bank;st.bank=0;G.firstThrow=true;G.lastThrow=null}
function throwYut(G,s){if(G.phase!=='throw'||s!==G.turn||G.throws<=0)return null;
 let w=YUT.map(y=>y[2]);if(has(G,s,'mo3'))w[5]*=3;if(has(G,s,'yut3'))w[4]*=3;
 let r=rnd(G)*w.reduce((a,b)=>a+b,0),i=0;while(r>=w[i]){r-=w[i];i++}
 let [k,v]=YUT[i],tag='';
 if(k==='빽도'&&has(G,s,'noback')){k='도';v=1;tag='꾸준함'}
 if(k==='빽도'&&has(G,s,'backfwd')){v=2;tag='앞으로 2'}
 if(k==='개'&&has(G,s,'gae3')){v=3;tag='+1'}
 if(k==='걸'&&has(G,s,'geol4')){v=4;tag='+1'}
 G.throws--;let extra=0;
 if(k==='윷'||k==='모')extra++;
 if(G.firstThrow&&k==='도'&&has(G,s,'firstdo'))extra++;
 G.firstThrow=false;G.throws+=extra;
 const res={k,v,tag};G.results.push(res);G.lastThrow={k,v,tag,extra,id:Math.random()};
 addLog(G,`${G.seats[s].name}: ${k}${tag?' ('+tag+')':''}${extra?' · 한 번 더!':''}`);
 if(G.throws<=0)toMove(G);G.ev++;return res}
function canUse(G,s,r,pi){const p=G.seats[s].pieces[pi];if(!p||p.n==='F')return false;if(p.n==='H'&&r.v<0)return false;return true}
function anyMove(G,s){return G.results.some(r=>G.seats[s].pieces.some((p,pi)=>canUse(G,s,r,pi)))}
function toMove(G){G.phase='move';if(!anyMove(G,G.turn)){if(G.results.length)addLog(G,'쓸 수 있는 결과가 없어 넘어갑니다.');endTurn(G)}}
function groupOf(G,s,pi){const st=G.seats[s],p=st.pieces[pi];
 if(p.n==='H'){const g=[pi];if(has(G,s,'twins')){const j=st.pieces.findIndex((q,k)=>k!==pi&&q.n==='H');if(j>=0)g.push(j)}return g}
 return st.pieces.map((q,k)=>q.n===p.n?k:-1).filter(k=>k>=0)}
function preview(G,s,ri,pi){const r=G.results[ri];if(!r||!canUse(G,s,r,pi))return null;const st=G.seats[s],p=st.pieces[pi],g=groupOf(G,s,pi);
 if(r.v<0)return{dest:backOf(p),path:[backOf(p)],g};
 let v=r.v;if(p.n==='H'&&has(G,s,'start1'))v++;if(g.length>=2&&p.n!=='H'&&has(G,s,'stack1'))v++;if(NEAR.includes(p.n)&&has(G,s,'sprint'))v++;
 if(p.n==='H'&&has(G,s,'twins')&&g.length>=2&&has(G,s,'stack1'))v++;
 const path=walk(p.n,v);return{dest:path[path.length-1],path,g}}
function sendHome(G,o,k){const st=G.seats[o];st.pieces[k].n=has(G,o,'insure')?'o1':'H';st.pieces[k].prev=null}
function land(G,s,g,dest){// 도착 처리: 덫, 잡기
 const st=G.seats[s];let caught=0;
 if(G.traps[dest]!=null&&G.traps[dest]!==s){const owner=G.seats[G.traps[dest]];delete G.traps[dest];g.forEach(k=>{st.pieces[k].n='H';st.pieces[k].prev=null});
  addLog(G,`🪤 ${st.name}의 말이 ${owner.name}의 덫에 걸려 집으로!`);return 0}
 G.seats.forEach((ot,o)=>{if(o===s)return;const vs=ot.pieces.map((q,k)=>q.n===dest?k:-1).filter(k=>k>=0);if(!vs.length)return;
  if(dest==='C'&&has(G,o,'safe')){addLog(G,`⛩️ ${ot.name}의 말은 방에서 보호받습니다.`);return}
  if(has(G,o,'armor')&&!ot.armorUsed){ot.armorUsed=true;addLog(G,`🛡️ ${ot.name}의 철갑이 공격을 막았습니다.`);return}
  vs.forEach(k=>sendHome(G,o,k));caught++;
  addLog(G,`💥 ${st.name}이(가) ${ot.name}의 말 ${vs.length}개를 잡았습니다!`);
  if(has(G,o,'revenge')){ot.bank++;addLog(G,`😤 ${ot.name}: 복수의 한 번 더 (다음 턴)`)}
  if(has(G,o,'thorn')){g.forEach(k=>{st.pieces[k].n='H';st.pieces[k].prev=null});addLog(G,`🌵 가시! ${st.name}의 말도 집으로.`)}});
 return caught}
function movePiece(G,s,ri,pi){if(G.phase!=='move'||s!==G.turn)return false;const pv=preview(G,s,ri,pi);if(!pv)return false;
 const st=G.seats[s],from=st.pieces[pi].n,r=G.results[ri];
 const prevNode=pv.path.length>=2?pv.path[pv.path.length-2]:from;
 pv.g.forEach(k=>{const p=st.pieces[k];if(pv.dest==='FIN'){p.n='F';p.prev=null}else{p.n=pv.dest;p.prev=r.v<0?null:prevNode}});
 G.results.splice(ri,1);
 if(pv.dest==='FIN')addLog(G,`🏠 ${st.name}의 말 ${pv.g.length}개 골인!`);
 else{const c=land(G,s,pv.g,pv.dest);if(c){const add=has(G,s,'hunter')?2:1;G.throws+=add;addLog(G,`한 번 더 던집니다${add>1?' (사냥꾼 2번)':''}.`)}}
 G.ev++;
 if(st.pieces.every(p=>p.n==='F')){G.phase='over';G.winner=s;addLog(G,`🎉 ${st.name} 승리!`);return true}
 if(G.throws>0){G.phase='throw';return true}
 if(!G.results.length||!anyMove(G,s)){if(G.results.length)addLog(G,'남은 결과를 쓸 수 없어 넘어갑니다.');endTurn(G)}
 return true}
function endTurn(G){const st=G.seats[G.turn];st.turns++;G.results=[];G.throws=0;
 G.turn=(G.turn+1)%G.seats.length;
 const minT=Math.min(...G.seats.map(x=>x.turns));
 if(minT>=G.nextPickAt&&G.seats.some(x=>x.aug.length<MAX_AUG)){G.nextPickAt+=PICK_EVERY;G.pickNo++;addLog(G,`모두 ${minT}턴을 돌았습니다. 새 증강을 고르세요.`);startPick(G);return}
 if(minT>=G.nextPickAt)G.nextPickAt+=PICK_EVERY;
 beginTurn(G)}
function useAug(G,s,id,t){if(s!==G.turn||!['throw','move'].includes(G.phase)||!has(G,s,id)||!AUG[id].a||G.seats[s].used[id])return false;
 const st=G.seats[s];t=t||{};
 if(id==='tele'){const p=st.pieces[t.pi];if(!p||p.n==='H'||p.n==='F'||p.n==='C')return false;const g=groupOf(G,s,t.pi);g.forEach(k=>{st.pieces[k].n='C';st.pieces[k].prev=null});
  st.used[id]=1;addLog(G,`🌀 ${st.name}: 순간이동! 말 ${g.length}개가 방으로.`);const c=land(G,s,g,'C');if(c){G.throws+=has(G,s,'hunter')?2:1;if(G.phase==='move')G.phase='throw'}}
 else if(id==='swap'){const p=st.pieces[t.pi],o=G.seats[t.o];if(!p||!o||t.o===s)return false;const q=o.pieces[t.qi];
  if(!q||['H','F'].includes(p.n)||['H','F'].includes(q.n))return false;const a=p.n,b=q.n;
  groupOf(G,s,t.pi).forEach(k=>{st.pieces[k].n=b;st.pieces[k].prev=null});o.pieces.forEach(x=>{if(x.n===b){x.n=a;x.prev=null}});
  st.used[id]=1;addLog(G,`🔀 ${st.name}이(가) ${o.name}의 말과 자리를 바꿨습니다.`)}
 else if(id==='freeze'){const o=G.seats[t.o];if(!o||t.o===s)return false;o.frozen=true;st.used[id]=1;addLog(G,`🧊 ${st.name}이(가) ${o.name}을(를) 얼렸습니다. 다음 턴을 쉽니다.`)}
 else if(id==='seal'){const o=G.seats[t.o];if(!o||t.o===s)return false;const a=o.aug.find(x=>x.id===t.aug&&!x.off);if(!a)return false;a.off=true;st.used[id]=1;addLog(G,`🔒 ${st.name}이(가) ${o.name}의 ${AUG[a.id].name}을(를) 봉인했습니다.`)}
 else return false;
 G.ev++;return true}

/* ---- 악마 AI ---- */
function aiPick(G,s){const st=G.seats[s];if(!st.offers)return null;const pref=['hunter','armor','safe','mo3','yut3','tele','freeze','start1','sprint','gae3','geol4','twins','stack1','thorn','swap','trap','seal','revenge','insure','backfwd','noback','firstdo'];
 return st.offers.slice().sort((a,b)=>pref.indexOf(a)-pref.indexOf(b)+(rnd(G)-.5)*6)[0]}
function aiMove(G,s){let best=null,bs=-1e9;const st=G.seats[s];
 G.results.forEach((r,ri)=>st.pieces.forEach((p,pi)=>{const pv=preview(G,s,ri,pi);if(!pv)return;
  let sc=0;const d=pv.dest;
  if(d==='FIN')sc+=120*pv.g.length;
  else{G.seats.forEach((ot,o)=>{if(o!==s&&ot.pieces.some(q=>q.n===d))sc+=80});
   if(G.traps[d]!=null&&G.traps[d]!==s)sc-=150;
   if(['o5','o10','C'].includes(d))sc+=18;
   sc+=(distFin(p.n==='H'?'H':p.n)-distFin(d))*4;
   if(st.pieces.some((q,k)=>!pv.g.includes(k)&&q.n===d))sc+=20;
   G.seats.forEach((ot,o)=>{if(o===s)return;ot.pieces.forEach(q=>{if(q.n==='H'||q.n==='F')return;for(let v=1;v<=5;v++){const w=walk(q.n,v);if(w[w.length-1]===d){sc-=12;break}}})})}
  if(p.n==='H')sc+=6;sc+=rnd(G)*4;
  if(sc>bs){bs=sc;best={ri,pi}}}));
 return best}
function aiActive(G,s){const st=G.seats[s];if(rnd(G)>.35)return null;
 const others=G.seats.map((x,o)=>o).filter(o=>o!==s);
 const lead=others.slice().sort((a,b)=>G.seats[b].pieces.filter(p=>p.n==='F').length-G.seats[a].pieces.filter(p=>p.n==='F').length)[0];
 for(const a of st.aug){if(a.off||!AUG[a.id].a||st.used[a.id])continue;
  if(a.id==='freeze')return{id:'freeze',t:{o:lead}};
  if(a.id==='seal'){const x=G.seats[lead].aug.find(y=>!y.off);if(x)return{id:'seal',t:{o:lead,aug:x.id}}}
  if(a.id==='tele'){const pi=st.pieces.findIndex(p=>p.n!=='H'&&p.n!=='F'&&p.n!=='C'&&distFin(p.n)>6);if(pi>=0)return{id:'tele',t:{pi}}}
  if(a.id==='swap'){let me=-1,md=0;st.pieces.forEach((p,k)=>{if(p.n!=='H'&&p.n!=='F'&&distFin(p.n)>md){md=distFin(p.n);me=k}});
   let bo=null;others.forEach(o=>G.seats[o].pieces.forEach((q,k)=>{if(q.n!=='H'&&q.n!=='F'&&me>=0&&distFin(q.n)+4<md&&(!bo||distFin(q.n)<bo.d))bo={o,k,d:distFin(q.n)}}));
   if(bo)return{id:'swap',t:{pi:me,o:bo.o,qi:bo.k}}}}
 return null}
// 한 걸음 자동 진행 (악마 차례이거나 시간이 다 됐을 때)
function autoStep(G,s){
 if(G.phase==='pick'){const st=G.seats[s];if(st.offers)return pickAug(G,s,aiPick(G,s));return false}
 if(s!==G.turn)return false;
 if(G.phase==='throw'){const u=G.seats[s].ai?aiActive(G,s):null;if(u&&useAug(G,s,u.id,u.t))return true;return!!throwYut(G,s)}
 if(G.phase==='move'){const m=aiMove(G,s);if(m)return movePiece(G,s,m.ri,m.pi);endTurn(G);G.ev++;return true}
 return false}
function apply(G,s,a){if(!a||G.phase==='over')return false;
 if(a.t==='pick')return pickAug(G,s,a.id);
 if(a.t==='throw')return!!throwYut(G,s);
 if(a.t==='move')return movePiece(G,s,a.ri,a.pi);
 if(a.t==='use')return useAug(G,s,a.id,a.x);
 return false}
const API={PIECES,MAX_AUG,COLORS,CNAMES,POS,NODES,AUGS,AUG,step,walk,backOf,distFin,newGame,pickAug,throwYut,movePiece,useAug,preview,canUse,groupOf,apply,autoStep,endTurn,has};
if(typeof module!=='undefined')module.exports=API;else root.YUT=API;
})(this);
