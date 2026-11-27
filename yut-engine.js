// 마법 윷놀이 규칙 엔진 v2 — 방장 화면에서만 실행하고, 결과 상태를 모두에게 보냅니다.
(function(root){
'use strict';
const PIECES=4,PICK_ROUNDS=[1,6,12];
const COLORS=['#d8443f','#3f7fd8','#3fae5c','#e0a92e'];
const CNAMES=['빨강','파랑','초록','노랑'];

/* ---- 판 ---- */
const POS={};
for(let i=0;i<20;i++){let x,y;
 if(i<=5){x=100;y=100-i*20}else if(i<=10){x=100-(i-5)*20;y=0}else if(i<=15){x=0;y=(i-10)*20}else{x=(i-15)*20;y=100}
 POS['o'+i]=[x,y]}
POS.a1=[83.33,16.67];POS.a2=[66.67,33.33];POS.C=[50,50];POS.a3=[33.33,66.67];POS.a4=[16.67,83.33];
POS.b1=[16.67,16.67];POS.b2=[33.33,33.33];POS.b3=[66.67,66.67];POS.b4=[83.33,83.33];
const NODES=Object.keys(POS);
const LINES=[['o0','o1','o2','o3','o4','o5'],['o5','o6','o7','o8','o9','o10'],['o10','o11','o12','o13','o14','o15'],['o15','o16','o17','o18','o19','o0'],
 ['o5','a1','a2','C','a3','a4','o15'],['o10','b1','b2','C','b3','b4','o0']];
const DIAG=['a1','a2','C','a3','a4','b1','b2','b3','b4'];
const ADJ={};NODES.forEach(n=>ADJ[n]=new Set());LINES.forEach(l=>{for(let i=1;i<l.length;i++){ADJ[l[i]].add(l[i-1]);ADJ[l[i-1]].add(l[i])}});
// 판을 반으로 접으면 칸이 절반만 남고 한 바퀴가 짧아집니다. (FG: 지금 계산 중인 게임)
let FG=null;
const HALF={
 up:{start:'o0',seq:['o1','o2','C','o13','o14','o15','o16','o17','o18','o19'],exit:['b3','b4']},
 down:{start:'o5',seq:['o4','o3','C','o12','o11','o10','o9','o8','o7','o6'],exit:['a2','a1']},
 left:{start:'o0',seq:['o1','o2','o3','o4','o5','o6','o7','C','o18','o19'],exit:['b3','b4'],corner:'o5',cut:['a1','a2']},
 right:{start:'o15',seq:['o14','o13','o12','o11','o10','o9','o8','C','o17','o16'],exit:['a3','a4'],corner:'o10',cut:['b1','b2']}};
Object.values(HALF).forEach(h=>{h.keep=new Set([h.start,...h.seq,...h.exit,...(h.cut||[])])});
const half=()=>FG&&FG.half?HALF[FG.half]:null;
function stepHalf(h,cur,prev,start){
 if(cur==='H')return h.seq[0];if(cur===h.start)return'FIN';
 if(h.corner&&cur===h.corner&&cur===start)return h.cut[0];
 let i=(h.cut||[]).indexOf(cur);if(i>=0)return i+1<h.cut.length?h.cut[i+1]:'C';
 i=h.exit.indexOf(cur);if(i>=0)return i+1<h.exit.length?h.exit[i+1]:'FIN';
 if(cur==='C'&&(cur===start||(h.cut&&prev===h.cut[h.cut.length-1])))return h.exit[0];
 i=h.seq.indexOf(cur);if(i>=0)return i+1<h.seq.length?h.seq[i+1]:'FIN';
 return'FIN'}
function backHalf(h,n){if(n===h.start)return h.seq[h.seq.length-1];let i=h.seq.indexOf(n);if(i>=0)return i?h.seq[i-1]:h.start;
 i=h.exit.indexOf(n);if(i>=0)return i?h.exit[i-1]:'C';i=(h.cut||[]).indexOf(n);if(i>=0)return i?h.cut[i-1]:h.corner;return n}
function nearKeep(h,n){if(h.keep.has(n))return n;const[x,y]=POS[n];let b=null,bd=1e9;h.keep.forEach(k=>{const[a,c]=POS[k],d=(a-x)**2+(c-y)**2;if(d<bd){bd=d;b=k}});return b}
function step(cur,prev,start){const h=half();if(h)return stepHalf(h,cur,prev,start);
 if(cur==='H')return'o1';
 if(cur[0]==='o'){const k=+cur.slice(1);if(k===5&&cur===start)return'a1';if(k===10&&cur===start)return'b1';if(k===19||k===0)return'FIN';return'o'+(k+1)}
 switch(cur){case'a1':return'a2';case'a2':return'C';case'a3':return'a4';case'a4':return'o15';case'b1':return'b2';case'b2':return'C';case'b3':return'b4';case'b4':return'FIN';
  case'C':return cur===start?'b3':prev==='a2'?'a3':'b3'}
 return'FIN'}
function walk(from,v){const path=[];let cur=from,prev=null;for(let i=0;i<v;i++){const n=step(cur,prev,from);path.push(n);if(n==='FIN')return path;prev=cur;cur=n}return path}
function backOf(p){if(p.prev&&p.prev!=='H')return p.prev;const n=p.n;const h=half();if(h)return backHalf(h,n);if(n[0]==='o'){const k=+n.slice(1);return'o'+((k+19)%20)}
 return{a1:'o5',a2:'a1',C:'a2',a3:'C',a4:'a3',b1:'o10',b2:'b1',b3:'C',b4:'b3'}[n]||n}
function nbr(x){const h=half();if(!h)return[...ADJ[x]];const out=new Set();try{const a=stepHalf(h,x,null,null);if(a!=='FIN')out.add(a);const b=backHalf(h,x);if(b!==x)out.add(b)}catch(e){}if(x==='C'||x===h.corner){const c=stepHalf(h,x,null,x);if(c!=='FIN')out.add(c)}return[...out]}
function distFin(n){if(n==='F')return 0;let cur=n,prev=null,d=0;while(d<40){const x=step(cur,prev,n);d++;if(x==='FIN')return d;prev=cur;cur=x}return d}

/* ---- 윷 ---- */
const KINDS=['빽도','도','개','걸','윷','모'],KV={'빽도':-1,'도':1,'개':2,'걸':3,'윷':4,'모':5};
const FLATS={'모':0,'빽도':1,'도':1,'개':2,'걸':3,'윷':4},BYFLATS=['모','도','개','걸','윷'];
const mk=(k,tag)=>({k,v:KV[k],tag:tag||''});

/* ---- 증강 (tag: g 범용 · start 1라운드 · mid 6라운드 · end 12라운드 / use: 직접 쓰는 횟수 / tg: 대상) ---- */
const AUGS=[
 // 범용
 {id:'cat',tag:'g',icon:'🐈',name:'고양이',d:'아무 능력도 없습니다. 대신 귀엽습니다. (고양이 계열: 3개를 모으면 승리)'},
 {id:'cat_all',tag:'g',icon:'🙀',name:'집사 모집',d:'이제 모든 플레이어는 선택지에 고양이가 나오면 반드시 고양이를 골라야 합니다. (고양이 계열)'},
 {id:'cat_me',tag:'g',icon:'😻',name:'고양이 홀릭',d:'내 선택지에 고양이가 나오면 반드시 고양이를 골라야 합니다. (고양이 계열)'},
 {id:'dogs',tag:'g',icon:'🐕',name:'개 풀기',d:'개 결과를 하나 얻습니다.',use:3},
 {id:'dogae',tag:'g',icon:'🐖',name:'도개 선택',d:'던질 때마다 도와 개 중에서 골라서 냅니다. 다른 결과는 나오지 않습니다.'},
 {id:'loan',tag:'g',icon:'💳',name:'대출',d:'지금 던지기 1번을 얻고, 다음 내 턴을 쉽니다.',use:2},
 {id:'dober',tag:'g',icon:'🦮',name:'도베르만',d:'이번 판에서 지금까지 낸 개 수만큼 모를 얻습니다. (최대 3)',use:1},
 {id:'modo',tag:'g',icon:'🎲',name:'모 아니면 도',d:'모와 도만 나옵니다.'},
 {id:'baduk',tag:'g',icon:'⚫',name:'바둑',d:'한 줄에 있는 내 말 무리 두 개 사이의 상대 말을 모두 잡고, 잡은 수만큼 더 던집니다.',use:1,tg:'two'},
 {id:'fix',tag:'g',icon:'🪄',name:'조작된 윷',d:'다음에 던질 결과를 내가 정합니다.',use:1,tg:'kind'},
 {id:'flip',tag:'g',icon:'🤏',name:'슬쩍',d:'아직 안 쓴 결과 하나에서 윷가락 하나를 뒤집습니다. (한 단계 위나 아래)',use:2,tg:'flip'},
 {id:'lonely',tag:'g',icon:'☝️',name:'외톨이',d:'다음에 던지면 도가 나옵니다.',use:3},
 {id:'jinmori',tag:'g',icon:'🥁',name:'장단',d:'걸이 2번 나올 때마다 개를 하나 더 얻습니다.'},
 {id:'shield',tag:'g',icon:'🫧',name:'보호막',d:'고른 내 말 무리가 한 번 잡혀도 살아남습니다.',use:1,tg:'own'},
 {id:'friend',tag:'g',icon:'🤝',name:'동료 방패',d:'내 말 무리가 잡힐 때 말 1개만 잡힙니다.'},
 {id:'fire',tag:'g',icon:'🔥',name:'화톳불',d:'고른 내 말 자리에 화톳불을 피웁니다. 다음에 내 말이 잡히면 집 대신 화톳불에서 다시 시작하고 불은 꺼집니다.',use:1,tg:'own'},
 {id:'sacri',tag:'g',icon:'🕯️',name:'희생',d:'판 위 내 말 하나를 스스로 집으로 보내고, 판 위의 다른 내 말 모두에 보호막을 씌웁니다.',use:1,tg:'own'},
 {id:'poop',tag:'g',icon:'💩',name:'똥',d:'얻는 즉시 빈칸 하나에 똥을 쌉니다. 상대 말이 지나가다 밟으면 그 칸에서 멈춥니다.'},
 {id:'sniper',tag:'g',icon:'🎯',name:'명사수',d:'턴마다 한 번, 던지기 1번을 써서 칸 하나를 조준합니다. 다음 내 턴이 시작되면 그 칸의 말이 모두 잡힙니다.',tg:'node',perTurn:1},
 {id:'assassin',tag:'g',icon:'🗡️',name:'자객',d:'내 말 무리에 자객을 숨깁니다. 그 칸을 지나가는 상대 말 무리는 잡히고 자객은 사라집니다.',use:2,tg:'own'},
 {id:'reaper',tag:'g',icon:'💀',name:'사신',d:'얻는 즉시 방(가운데)에 죽지 않는 사신이 나타납니다. 라운드가 끝날 때마다 가장 가까운 상대 말 쪽으로 1칸 가서 그 칸의 말을 잡습니다.'},
 {id:'redbtn',tag:'g',icon:'🔴',name:'빨간 버튼',d:'얻는 즉시 두 대각선(방 포함) 위의 말이 모두 잡힙니다. 내 말도 예외가 아닙니다.'},
 {id:'notme',tag:'g',icon:'🙈',name:'나만 아니면 돼',d:'얻는 즉시 무작위 상대 한 명의 판 위 말이 모두 잡힙니다.'},
 {id:'illusion',tag:'g',icon:'🐱',name:'착각',d:'상대 증강 하나를 3라운드 동안 고양이로 바꿉니다. (다 쓴 증강은 못 바꿈)',use:1,tg:'oppAug'},
 {id:'hit',tag:'g',icon:'🥏',name:'윷 맞히기',d:'상대 한 명에게 윷을 맞혀서, 그 사람의 턴 2번을 건너뛰게 합니다.',use:1,tg:'opp'},
 {id:'fold',tag:'g',icon:'📄',name:'판 접기',d:'윷판을 진짜로 반으로 접습니다. 접은 쪽 칸이 사라져서 판이 절반(한 바퀴 20칸 → 10칸)이 되고, 그쪽에 있던 말과 물건은 반대편으로 넘어갑니다. 넘어간 자리에 있던 상대 말은 깔려서 잡힙니다. 판은 한 번만 접을 수 있습니다.',use:1,tg:'fold'},
 {id:'redo',tag:'g',icon:'✋',name:'이의 있음',d:'고르는 즉시 이번 증강 선택을 새 선택지로 다시 합니다. 자리를 차지하지 않습니다.'},
 {id:'bystander',tag:'g',icon:'🎣',name:'어부지리',d:'내 턴이 아닐 때 다른 사람의 말이 2개 잡힐 때마다 개를 하나 받습니다. (다음 내 턴에 사용)'},
 {id:'vanguard',tag:'g',icon:'🚩',name:'선봉장',d:'내 말 하나가 선봉장이 됩니다. 선봉장이 판 위에 있는 동안 내 모든 이동이 1칸 늘어납니다.'},
 {id:'pawn',tag:'g',icon:'♟️',name:'폰',d:'집에 있는 내 말 하나가 폰이 됩니다. 폰은 직접 못 움직이지만, 내가 던질 때마다 1칸씩 나아갑니다.'},
 {id:'four',tag:'g',icon:'🧩',name:'사목',d:'내 말이 한 줄로 이어진 4칸을 차지하거나, 말 4개가 한 무리로 업히면 승리합니다.'},
 {id:'backwin',tag:'g',icon:'🐄',name:'소 뒷걸음질',d:'빽도로 상대 말을 잡으면 승리합니다.'},
 {id:'score',tag:'g',icon:'🎼',name:'악보',d:'이번 판에서 빽도·도·개·걸·윷·모를 모두 한 번 이상 내면 승리합니다.'},
 {id:'prophet',tag:'g',icon:'🔮',name:'예언',d:'플레이어 한 명과 윷 결과를 고릅니다. 그 사람이 다음에 던질 첫 결과가 맞으면 다음 내 턴에 모를 하나 받습니다.',use:2,tg:'predict'},
 // 1라운드 전용
 {id:'exch',tag:'start',icon:'⚖️',name:'등가교환',d:'내 말이 3개가 되고 윷가락 3개로 던집니다. (윷은 안 나오고 모·걸이 잘 나옴)'},
 {id:'fast',tag:'start',icon:'⏩',name:'스피드 게임',d:'모든 플레이어의 말이 2개가 되고, 내 말은 도·개 자리에서 시작합니다.'},
 {id:'piggy',tag:'start',icon:'🎒',name:'업고 놀자',d:'내 말 모두가 업힌 채 도 자리에서 시작합니다.'},
 {id:'alone',tag:'start',icon:'👑',name:'유아독존',d:'판 위에 말 무리가 내 것 하나뿐이면 승리합니다.'},
 {id:'catlover',tag:'start',icon:'😺',name:'애묘인',d:'누구든 고양이 증강을 가지고 있으면 승리합니다. (고양이 계열)'},
 {id:'bear',tag:'start',icon:'🧄',name:'웅녀',d:'판 위 무작위 칸에 마늘 4개가 생깁니다. 내 말로 모두 밟으면 승리합니다.'},
 {id:'kim',tag:'start',icon:'🛺',name:'김첨지',d:'내 말 하나가 김첨지가 됩니다. 김첨지가 내 턴 6번 안에 골인하면 승리합니다.'},
 {id:'party',tag:'start',icon:'🎪',name:'함정 파티',d:'판에 함정 5개와 보상 3개가 생깁니다. 함정에 멈춘 상대 말은 집으로, 보상에 멈춘 말은 3칸 더 갑니다.'},
 // 6라운드 전용
 {id:'s777',tag:'mid',icon:'🎰',name:'777',d:'한 턴에 같은 결과가 3번 나오면 승리합니다.'},
 {id:'nofriend',tag:'mid',icon:'🥲',name:'나만 친구 없어',d:'이제부터 다른 모든 플레이어에게 한 번씩 잡히면 승리합니다.'},
 {id:'coup',tag:'mid',icon:'⚔️',name:'무신정변',d:'이제부터 상대 말을 4개 잡으면 승리합니다.'},
 {id:'treason',tag:'mid',icon:'🗝️',name:'역모',d:'나보다 골인한 말이 많은 사람의 말을 잡으면 한 번 더 던집니다.'},
 {id:'halt',tag:'mid',icon:'⛔',name:'잠깐!',d:'얻는 즉시 상대들의 가장 앞선 말 무리 하나를 2라운드 동안 못 움직이게 합니다.'},
 {id:'peace',tag:'mid',icon:'🕊️',name:'평화 협정',d:'나는 상대 말을 잡을 수 없고, 어떤 방법으로도 잡히지 않습니다.'},
 {id:'gambler',tag:'mid',icon:'🃏',name:'도박사',d:'다음에 상대 말을 잡을 사람을 예측합니다. (나 포함) 맞으면 다음 내 턴에 모 2개를 받습니다.',use:1,tg:'anyp'},
 // 12라운드 전용
 {id:'plan',tag:'end',icon:'📜',name:'계획대로',d:'이 판의 최종 순위를 1위부터 끝까지 예측합니다. 끝났을 때 순위가 모두 맞으면 내가 단독 1위가 됩니다.',use:1,tg:'order'},
 {id:'bronze',tag:'end',icon:'🥉',name:'동메달도 잘한 거야',d:'얻는 즉시 3위가 되어 판에서 빠집니다. (3명 이상일 때만 나옴)'},
 {id:'grail',tag:'end',icon:'🍷',name:'독이 든 성배',d:'던지기 3번을 얻습니다. 이번 턴에 모가 나오면 탈락합니다.',use:1},
 {id:'lastdance',tag:'end',icon:'💃',name:'라스트 댄스',d:'던지기 2번을 얻고 이번 턴 이동이 2배가 됩니다. 이번 턴이 끝나면 탈락합니다.',use:1},
 {id:'comeback',tag:'end',icon:'🎁',name:'역전 찬스',d:'무작위 범용 증강 4개를 얻습니다.'},
 {id:'echo',tag:'end',icon:'🔁',name:'메아리',d:'지금부터 모든 플레이어가 턴을 두 번씩 합니다.'},
 {id:'marathon',tag:'end',icon:'🏃',name:'마라토너',d:'집에 있는 내 말 하나가 마라토너가 됩니다. 마라토너가 골인하면 승리합니다.',use:1},
 {id:'duel',tag:'end',icon:'🤺',name:'승부다!',d:'상대 한 명을 고릅니다. 그 사람이 자기 턴 3번 안에 말을 골인시키지 못하면 탈락, 골인시키면 내가 탈락합니다.',use:1,tg:'opp'},
 {id:'domain',tag:'end',icon:'🌌',name:'영역 전개',d:'판 위 내 말 하나를 못 움직이게 묶습니다. 내 턴 2번 동안 살아남으면 승리, 잡히면 탈락합니다.',use:1,tg:'own'},
 {id:'cannibal',tag:'end',icon:'🍖',name:'카니발리즘',d:'내 말끼리 업히지 않고 서로 잡을 수 있습니다. 내 말을 잡으면 한 번 더 던집니다.'}];
const AUG={};AUGS.forEach(a=>AUG[a.id]=a);
const CATS=['cat','cat_all','cat_me','catlover'];// 고양이 계열: 3개 모으면 시너지 승리 (착각으로 고양이가 된 증강도 셈)
const isCat=a=>CATS.includes(a.id)||!!(a.off&&a.until);
const TYPEICON={van:'🚩',pawn:'♟️',kim:'🛺',mara:'🏃'};

/* ---- 기본 ---- */
function rnd(G){G.seed=(Math.imul(G.seed^(G.seed>>>15),2246822519)+0x9e3779b9)>>>0;G.seed=(G.seed^(G.seed>>>13))>>>0;return G.seed/4294967296}
const pickR=(G,a)=>a[Math.floor(rnd(G)*a.length)];
function fx(G,t,n,c){G.fxN=(G.fxN||0)+1;G.fx=(G.fx||[]).concat([{t,n,c:c||1,id:G.fxN}]).slice(-8)}
function addLog(G,t){G.log.push(t);if(G.log.length>80)G.log.shift()}
function has(G,s,id){return G.seats[s].aug.some(a=>a.id===id&&!a.off)}
const alive=G=>G.seats.map((x,i)=>i).filter(i=>!G.seats[i].out&&!G.seats[i].done);
const onBoard=p=>p.n!=='H'&&p.n!=='F';
function newPiece(){return{n:'H',prev:null,t:'',sh:0,lock:0,asn:0,dom:0}}
function newGame(players,seed){
 const G={v:2,seed:(seed>>>0)||1,seats:players.map((p,i)=>({name:p.name,ai:!!p.ai,color:COLORS[i],cname:CNAMES[i],
  pieces:Array.from({length:PIECES},newPiece),aug:[],offers:null,used:{},skip:0,bankRes:[],out:false,sticks:4,
  st:{kills:0,gae:0,geol:0,thrown:{},killedBy:[],coupBase:-1,nfOn:false,bys:0,kimTurns:0,turns:0}})),
  order:0,turn:0,round:1,turnNo:0,phase:'pick',results:[],throws:0,turnRes:[],traps:{},rewards:{},poop:{},garlic:null,fires:{},marks:[],reaper:null,
  echo:false,echoSecond:false,duels:[],log:[],winner:null,ranks:players.map(()=>null),plans:[],props:[],bets:[],pickRound:1,picked:{},ev:0,lastThrow:null,force:{},snTurn:{},dance:-1,grail:-1};
 G.order=G.turn=Math.floor(rnd(G)*players.length);
 addLog(G,'게임 시작! 1라운드 증강을 고르세요.');startPick(G);return G}
function startPick(G){G.phase='pick';G.pickRound=G.round;G.picked[G.round]=1;
 const tag=G.round===1?'start':G.round===6?'mid':'end';
 G.seats.forEach((st,s)=>{if(st.out||st.done){st.offers=null;return}st.offers=offersFor(G,s,tag)});
 if(G.seats.every(x=>!x.offers))return beginTurn(G)}
function offersFor(G,s,tag){const st=G.seats[s],own=new Set(st.aug.map(a=>a.id));
 const pool=AUGS.filter(a=>(a.tag==='g'||a.tag===tag)&&!own.has(a.id)&&!(st.redoUsed&&a.id==='redo')&&!(a.id==='bronze'&&(G.seats.length<3||G.ranks[2]!=null))).map(a=>a.id);
 const off=[];while(off.length<3&&pool.length)off.push(pool.splice(Math.floor(rnd(G)*pool.length),1)[0]);return off}
function catForced(G,s){const st=G.seats[s];return!!(st.offers&&st.offers.includes('cat')&&(has(G,s,'cat_me')||G.seats.some((x,i)=>has(G,i,'cat_all'))))}
function pickAug(G,s,id){const st=G.seats[s];if(G.phase!=='pick'||!st.offers||!st.offers.includes(id))return false;
 if(catForced(G,s)&&id!=='cat')return false;
 if(id==='redo'){st.redoUsed=true;addLog(G,`${st.name}: ✋ 이의 있음! 다시 고릅니다.`);st.offers=offersFor(G,s,G.round===1?'start':G.round===6?'mid':'end');G.ev++;return true}
 st.offers=null;gain(G,s,id);
 if(G.phase!=='over'&&G.seats.every(x=>!x.offers))beginTurn(G);G.ev++;return true}
function gain(G,s,id){const st=G.seats[s],A=AUG[id];st.aug.push({id});addLog(G,`${st.name}: ${A.icon} ${A.name}`);
 const others=alive(G).filter(o=>o!==s);
 switch(id){
  case'poop':{const k=freeNode(G);if(k)G.poop[k]=s;break}
  case'reaper':G.reaper={n:'C',s};killAt(G,'C',s,{exceptSeat:s,cause:'💀 사신'});break;
  case'redbtn':DIAG.forEach(n=>killAt(G,n,s,{cause:'🔴 빨간 버튼'}));break;
  case'notme':{if(others.length){const o=pickR(G,others);const idx=G.seats[o].pieces.map((p,k)=>onBoard(p)?k:-1).filter(k=>k>=0);if(idx.length)killStack(G,o,idx,s,'🙈 나만 아니면 돼')}break}
  case'vanguard':{const k=pickPiece(st,true);if(k>=0)st.pieces[k].t='van';break}
  case'pawn':{const k=pickPiece(st,false);if(k>=0){st.pieces[k].t='pawn'}break}
  case'comeback':{const pool=AUGS.filter(a=>a.tag==='g'&&!['redo','cat_all','cat_me'].includes(a.id)&&!st.aug.some(x=>x.id===a.id)).map(a=>a.id);for(let i=0;i<4&&pool.length;i++)gain(G,s,pool.splice(Math.floor(rnd(G)*pool.length),1)[0]);break}
  case'echo':G.echo=true;break;
  case'halt':{let best=null;others.forEach(o=>G.seats[o].pieces.forEach((p,k)=>{if(onBoard(p)&&(!best||distFin(p.n)<best.d))best={o,k,d:distFin(p.n)}}));
   if(best){const n=G.seats[best.o].pieces[best.k].n;G.seats[best.o].pieces.forEach(p=>{if(p.n===n)p.lock=G.round+2});addLog(G,`⛔ ${G.seats[best.o].name}의 말이 2라운드 동안 묶였습니다.`)}break}
  case'exch':{const k=st.pieces.findIndex(p=>p.n==='H');if(k>=0&&st.pieces.length>1)st.pieces.splice(k,1);st.sticks=3;break}
  case'fast':G.seats.forEach((x,i)=>{x.pieces=[newPiece(),newPiece()]});st.pieces[0].n='o1';st.pieces[1].n='o2';break;
  case'piggy':st.pieces.forEach(p=>{if(p.n==='H')p.n='o1'});break;
  case'bear':{const nodes=[];for(let i=0;i<4;i++){const k=freeNode(G,nodes);if(k)nodes.push(k)}G.garlic={s,nodes,got:[]};break}
  case'kim':{const k=pickPiece(st,false);if(k>=0){st.pieces[k].t='kim';st.st.kimTurns=0}break}
  case'party':for(let i=0;i<5;i++){const k=freeNode(G);if(k)G.traps[k]=s}for(let i=0;i<3;i++){const k=freeNode(G);if(k)G.rewards[k]=1}break;
  case'coup':st.st.coupBase=st.st.kills;break;
  case'nofriend':st.st.nfOn=true;st.st.killedBy=[];break;
  case'bronze':if(G.seats.length>=3)place(G,s,true,'🥉 동메달도 잘한 거야',2);break}
 checkCat(G)}
function pickPiece(st,anyOk){let k=st.pieces.findIndex(p=>!p.t&&p.n==='H');if(k<0&&anyOk)k=st.pieces.findIndex(p=>!p.t&&p.n!=='F');return k}
function freeNode(G,extra){const occ=new Set(extra||[]);G.seats.forEach(st=>st.pieces.forEach(p=>occ.add(p.n)));Object.keys(G.traps).concat(Object.keys(G.rewards),Object.keys(G.poop)).forEach(k=>occ.add(k));
 if(G.garlic)G.garlic.nodes.forEach(k=>occ.add(k));const free=NODES.filter(k=>!['o0','o1','C'].includes(k)&&!occ.has(k));return free.length?pickR(G,free):null}
function checkCat(G){G.seats.forEach((st,s)=>{if(G.phase==='over'||st.out||st.done)return;if(st.aug.filter(isCat).length>=3)return win(G,s,'🐾 고양이 시너지: 고양이 계열 3마리가 모였습니다!');if(has(G,s,'catlover')&&G.seats.some((x,i)=>!x.out&&x.aug.some(a=>a.id==='cat'||(a.off&&a.until))))win(G,s,'😺 애묘인: 고양이가 나타났습니다!')})}

/* ---- 순위 · 승리 · 탈락 (한 명이 이겨도 끝까지 순위를 가립니다) ---- */
function place(G,s,top,why,at){const st=G.seats[s];if(G.phase==='over'||st.out||st.done)return;
 let idx=at!=null&&G.ranks[at]==null?at:top?G.ranks.indexOf(null):G.ranks.lastIndexOf(null);if(idx<0)return;
 G.ranks[idx]=s;st.rank=idx+1;if(top||at!=null)st.done=true;else st.out=true;st.offers=null;st.why=why||'';
 st.pieces.forEach(p=>{if(p.n!=='F'){p.n='H';p.prev=null;p.lock=0;p.dom=0;p.asn=0}});
 addLog(G,top||at!=null?`🏅 ${st.name} ${idx+1}위 확정! ${why||''}`:`☠️ ${st.name} 탈락 (${idx+1}위). ${why||''}`);fx(G,'rank','C',idx+1);G.ev++;
 G.duels.forEach(d=>{if(!d.done&&(d.o===s||d.by===s))d.done=true});if(G.reaper&&G.reaper.s===s){G.reaper=null;addLog(G,'💀 사신이 사라졌습니다.')}
 const left=alive(G);if(left.length<=1){if(left.length===1){const k=left[0];G.ranks[G.ranks.indexOf(null)]=k;G.seats[k].rank=G.ranks.indexOf(k)+1;G.seats[k].done=true;addLog(G,`${G.seats[k].name} ${G.seats[k].rank}위.`)}finishGame(G)}}
function finishGame(G){G.plans.forEach(pl=>{if(G.phase==='over')return;if(JSON.stringify(pl.order)===JSON.stringify(G.ranks)){G.ranks=[pl.by].concat(G.ranks.filter(x=>x!==pl.by));G.ranks.forEach((x,i)=>G.seats[x].rank=i+1);addLog(G,`📜 계획대로! ${G.seats[pl.by].name}이(가) 순위를 모두 맞혀 단독 1위가 됩니다.`)}});
 G.phase='over';G.winner=G.ranks[0];G.winWhy=G.seats[G.winner].why||'';addLog(G,`🎉 최종 1위: ${G.seats[G.winner].name}`);G.ev++}
function win(G,s,why){place(G,s,true,why)}
function eliminate(G,s,why){place(G,s,false,why)}
function boardWins(G){if(G.phase==='over')return;
 G.seats.forEach((st,s)=>{if(st.out||st.done||G.phase==='over')return;
  if(has(G,s,'four')){const mine=new Set(st.pieces.filter(onBoard).map(p=>p.n));
   if(st.pieces.length>=4&&st.pieces.every(p=>onBoard(p)&&p.n===st.pieces[0].n))return win(G,s,'🧩 사목: 말 4개가 한 무리!');
   for(const l of LINES)for(let i=0;i+4<=l.length;i++)if(l.slice(i,i+4).every(n=>mine.has(n)))return win(G,s,'🧩 사목: 한 줄 4칸!')}
  if(has(G,s,'alone')){const occ=new Set();G.seats.forEach((x,o)=>x.pieces.forEach(p=>{if(onBoard(p))occ.add(o+':'+p.n)}));if(occ.size===1&&[...occ][0].startsWith(s+':'))win(G,s,'👑 유아독존: 판 위에 내 무리 하나뿐!')}})}

/* ---- 잡기 ---- */
function sendHome(G,o,k){const p=G.seats[o].pieces[k];if(p.dom>0){eliminate(G,o,'🌌 영역 전개 실패');}
 const f=G.fires[o];if(f){p.n=f;delete G.fires[o];addLog(G,`🔥 ${G.seats[o].name}의 말이 화톳불에서 되살아납니다.`)}else p.n='H';
 p.prev=null;p.lock=0;p.asn=0;p.dom=0;p.sh=0}
function killStack(G,o,idx,by,cause){// o의 말 idx를 잡음. 반환: 잡힌 개수
 const ot=G.seats[o];if(!idx.length||ot.out)return 0;
 if(has(G,o,'peace')||(by!=null&&by!==o&&has(G,by,'peace'))){if(has(G,o,'peace'))addLog(G,`🕊️ ${ot.name}은(는) 평화 협정으로 잡히지 않습니다.`);return 0}
 const sh=idx.filter(k=>ot.pieces[k].sh>0);if(sh.length){idx.forEach(k=>ot.pieces[k].sh=0);addLog(G,`🫧 ${ot.name}의 보호막이 막았습니다.`);return 0}
 if(has(G,o,'friend')&&idx.length>1){idx=[idx[0]];addLog(G,`🤝 동료 방패: ${ot.name}의 말 1개만 잡힙니다.`)}
 fx(G,'kill',ot.pieces[idx[0]].n,idx.length);idx.forEach(k=>sendHome(G,o,k));
 addLog(G,`${cause?cause+': ':''}${by!=null&&by!==o?G.seats[by].name+'이(가) ':''}${ot.name}의 말 ${idx.length}개를 잡았습니다.`);
 if(by!=null&&by!==o){G.bets=G.bets.filter(b=>{const bb=G.seats[b.by];if(b.who===by){bb.bankRes.push(mk('모','도박사'),mk('모','도박사'));addLog(G,`🃏 ${bb.name}의 도박 적중! 다음 턴에 모 2개.`)}else addLog(G,`🃏 ${bb.name}의 도박은 빗나갔습니다.`);return false});
  const bs=G.seats[by].st;bs.kills+=idx.length;
  if(ot.st.nfOn&&!ot.st.killedBy.includes(by)){ot.st.killedBy.push(by);if(alive(G).filter(x=>x!==o).every(x=>ot.st.killedBy.includes(x)))win(G,o,'🥲 나만 친구 없어: 모두에게 잡혔습니다!')}
  if(has(G,by,'coup')&&bs.coupBase>=0&&bs.kills-bs.coupBase>=4)win(G,by,'⚔️ 무신정변: 말 4개를 잡았습니다!')}
 G.seats.forEach((x,i)=>{if(i===o||i===G.turn||x.out||!has(G,i,'bystander'))return;x.st.bys+=idx.length;while(x.st.bys>=2){x.st.bys-=2;x.bankRes.push(mk('개','어부지리'));addLog(G,`🎣 ${x.name}: 어부지리로 개를 얻었습니다.`)}});
 return idx.length}
function killAt(G,node,by,opt){opt=opt||{};let n=0;G.seats.forEach((st,o)=>{if(opt.exceptSeat===o)return;const idx=st.pieces.map((p,k)=>p.n===node?k:-1).filter(k=>k>=0);if(idx.length)n+=killStack(G,o,idx,by,opt.cause)});return n}

/* ---- 턴 ---- */
function beginTurn(G){
 if(G.phase!=='over')G.phase='wait';
 for(let guard=0;guard<30&&G.phase!=='over';guard++){const s=G.turn,st=G.seats[s];
  if(st.out||st.done){advance(G);if(G.phase==='pick'||G.phase==='over')return;continue}
  if(st.skip>0){st.skip--;st.st.turns++;addLog(G,`⏸️ ${st.name}의 턴을 건너뜁니다.`);tickDuel(G,s);advance(G);if(G.phase==='pick')return;continue}
  break}
 if(G.phase==='over')return;
 const s=G.turn,st=G.seats[s];G.phase='throw';G.results=st.bankRes.splice(0);G.throws=1;G.turnRes=[];G.lastThrow=null;G.turnNo++;
 // 내 턴 시작 효과
 G.marks=G.marks.filter(m=>{if(m.s!==s)return true;const c=killAt(G,m.n,s,{cause:'🎯 명사수'});if(!c)addLog(G,`🎯 ${st.name}의 조준이 빗나갔습니다.`);return false});
 st.pieces.forEach(p=>{if(p.dom>0){p.dom--;if(p.dom===0&&onBoard(p))win(G,s,'🌌 영역 전개: 끝까지 버텼습니다!')}});
 if(st.pieces.some(p=>p.t==='kim'&&p.n!=='F'))st.st.kimTurns++;
 G.ev++;if(G.phase!=='over'&&(st.done||st.out))endTurn(G)}
function advance(G){// 다음 사람으로
 if(G.echo&&!G.echoSecond&&!G.seats[G.turn].out&&!G.seats[G.turn].done){G.echoSecond=true;return}
 G.echoSecond=false;const n=G.seats.length;G.turn=(G.turn+1)%n;
 if(G.turn===G.order){G.round++;endRound(G);if(G.phase==='over')return;
  if(PICK_ROUNDS.includes(G.round)&&!G.picked[G.round]){addLog(G,`${G.round}라운드! 증강을 고르세요.`);startPick(G);return}}}
function endRound(G){
 if(G.round>40){addLog(G,'40라운드가 지나 골인한 말 수로 남은 순위를 정합니다.');alive(G).sort((a,b)=>G.seats[b].pieces.filter(p=>p.n==='F').length-G.seats[a].pieces.filter(p=>p.n==='F').length).forEach(k=>{if(G.phase!=='over')place(G,k,true,'40라운드 판정')});return}
 G.seats.forEach(st=>st.aug.forEach(a=>{if(a.off&&a.until&&G.round>=a.until){a.off=false;delete a.until;addLog(G,`🐱 ${st.name}의 ${AUG[a.id].name}이(가) 돌아왔습니다.`)}}));
 if(G.reaper){const R=G.reaper;// 가장 가까운 상대 말 쪽으로 한 칸
  const targets=new Set();G.seats.forEach((st,o)=>{if(o===R.s||st.out)return;st.pieces.forEach(p=>{if(onBoard(p))targets.add(p.n)})});
  if(targets.size){const prev={},q=[R.n];prev[R.n]=null;let hit=null;while(q.length){const x=q.shift();if(targets.has(x)&&x!==R.n){hit=x;break}if(targets.has(x)&&x===R.n){hit=x;break}nbr(x).forEach(y=>{if(!(y in prev)){prev[y]=x;q.push(y)}})}
   if(hit&&hit!==R.n){let c=hit;while(prev[c]!==R.n)c=prev[c];R.n=c}
   killAt(G,R.n,R.s,{exceptSeat:R.s,cause:'💀 사신'})}}}
function tickDuel(G,s){G.duels.forEach(d=>{if(d.done||d.o!==s)return;d.left--;if(d.left<=0){d.done=true;eliminate(G,s,'🤺 승부에서 졌습니다 (3턴 안에 골인 실패).')}})}
function endTurn(G){if(G.phase==='over')return;const s=G.turn,st=G.seats[s];st.st.turns++;G.results=[];G.throws=0;
 if(G.dance===s){G.dance=-1;eliminate(G,s,'💃 라스트 댄스가 끝났습니다.')}
 G.grail=-1;tickDuel(G,s);if(G.phase==='over')return;
 advance(G);if(G.phase==='pick'||G.phase==='over')return;beginTurn(G)}

/* ---- 던지기 ---- */
function rollKind(G,s){const st=G.seats[s];
 if(G.force[s]){const k=G.force[s];delete G.force[s];return[k,'조작']}
 if(has(G,s,'modo'))return[rnd(G)<.5?'모':'도',''];
 if(st.sticks===3){const r=rnd(G)*8;return[r<1?'모':r<2?'빽도':r<4?'도':r<7?'개':'걸','']}
 const w=[1,3,6,4,1,1];let r=rnd(G)*16,i=0;while(r>=w[i]){r-=w[i];i++}return[KINDS[i],'']}
function throwYut(G,s,choose){if(G.phase!=='throw'||s!==G.turn||G.throws<=0)return null;const st=G.seats[s];
 let k,tag;if(has(G,s,'dogae')&&!G.force[s]){k=choose==='개'?'개':choose==='도'?'도':(rnd(G)<.5?'도':'개');tag='도개'}else[k,tag]=rollKind(G,s);
 G.throws--;let extra=0;if(k==='윷'||k==='모')extra++;G.throws+=extra;
 const res=mk(k,tag);G.results.push(res);G.turnRes.push(k);st.st.thrown[k]=1;if(k==='개')st.st.gae++;
 G.lastThrow={k,extra,id:Math.random(),s,sticks:st.sticks};
 addLog(G,`${st.name}: ${k}${tag?' ('+tag+')':''}${extra?' · 한 번 더!':''}`);
 if(k==='걸'&&has(G,s,'jinmori')){st.st.geol++;if(st.st.geol%2===0){G.results.push(mk('개','장단'));addLog(G,`🥁 장단: 개를 하나 더 얻었습니다.`)}}
 if(k==='모'&&G.grail===s){G.ev++;eliminate(G,s,'🍷 독이 든 성배를 마신 뒤 모가 나왔습니다.');if(G.phase!=='over')endTurn(G);return res}
 if(has(G,s,'s777')&&G.turnRes.filter(x=>x===k).length>=3)win(G,s,`🎰 777: ${k}가 세 번!`);
 if(has(G,s,'score')&&KINDS.every(x=>st.st.thrown[x]))win(G,s,'🎼 악보 완성!');
 // 예언 확인 (이 사람의 첫 결과)
 if(G.turnRes.length===1)G.props=G.props.filter(pr=>{if(pr.o!==s)return true;const by=G.seats[pr.by];if(pr.k===k){by.bankRes.push(mk('모','예언'));addLog(G,`🔮 ${by.name}의 예언 적중! (${st.name}: ${k}) 다음 턴에 모를 받습니다.`)}else addLog(G,`🔮 ${by.name}의 예언은 빗나갔습니다. (${pr.k} 예상, 실제 ${k})`);return false});
 if(st.done||st.out){if(G.phase!=='over')endTurn(G);G.ev++;return res}
 // 폰 전진
 st.pieces.forEach((p,k2)=>{if(G.phase==='over'||p.t!=='pawn'||p.n==='F'||p.lock>=G.round)return;doMove(G,s,[k2],walk(p.n,1),false)});
 if(G.phase==='over'){G.ev++;return res}
 if(st.done||st.out){endTurn(G);G.ev++;return res}
 if(G.throws<=0)toMove(G);G.ev++;return res}

/* ---- 움직이기 ---- */
function groupOf(G,s,pi){const st=G.seats[s],p=st.pieces[pi];
 if(p.n==='H'||has(G,s,'cannibal')||p.t==='pawn')return[pi];
 return st.pieces.map((q,k)=>q.n===p.n&&q.t!=='pawn'?k:-1).filter(k=>k>=0)}
function canUse(G,s,r,pi){const st=G.seats[s],p=st.pieces[pi];if(!p||p.n==='F'||p.t==='pawn')return false;if(p.n==='H'&&r.v<0)return false;
 return!groupOf(G,s,pi).some(k=>st.pieces[k].lock>=G.round||st.pieces[k].dom>0)}
function anyMove(G,s){return G.results.some(r=>G.seats[s].pieces.some((p,pi)=>canUse(G,s,r,pi)))}
function toMove(G){G.phase='move';if(!anyMove(G,G.turn)){if(G.results.length)addLog(G,'쓸 수 있는 결과가 없어 넘어갑니다.');endTurn(G)}}
function moveLen(G,s,r){let v=r.v;if(v<0)return v;if(G.seats[s].pieces.some(p=>p.t==='van'&&onBoard(p)))v++;if(G.dance===s)v*=2;return v}
function preview(G,s,ri,pi){const r=G.results[ri];if(!r||!canUse(G,s,r,pi))return null;const p=G.seats[s].pieces[pi],g=groupOf(G,s,pi);
 const v=moveLen(G,s,r);const path=v<0?[backOf(p)]:walk(p.n,v);return{dest:path[path.length-1],path,g,back:v<0}}
function doMove(G,s,g,path,back){// 경로를 따라 이동하며 똥·자객 처리 후 도착 처리. 반환: 잡은 횟수
 const st=G.seats[s];let from=st.pieces[g[0]].n;
 for(let i=0;i<path.length;i++){const n=path[i];if(n==='FIN')break;const last=i===path.length-1;
  if(!back&&!last&&G.poop[n]!=null&&G.poop[n]!==s){path=path.slice(0,i+1);addLog(G,`💩 ${st.name}의 말이 똥을 밟고 멈췄습니다.`);break}
  if(!back&&!last){let as=null;G.seats.forEach((x,o)=>{if(o===s)return;x.pieces.forEach(q=>{if(q.n===n&&q.asn)as={o,q}})});
   if(as){as.q.asn=0;g.forEach(k=>{st.pieces[k].n=n});killStack(G,s,g.slice(),as.o,'🗡️ 자객');return 0}}}
 const dest=path[path.length-1],prevNode=path.length>=2?path[path.length-2]:from;
 if(dest==='FIN'){g.forEach(k=>{st.pieces[k].n='F';st.pieces[k].prev=null;st.pieces[k].asn=0});finished(G,s,g);return 0}
 g.forEach(k=>{st.pieces[k].n=dest;st.pieces[k].prev=back?null:prevNode});
 return land(G,s,g,dest,back)}
function finished(G,s,g){const st=G.seats[s];fx(G,'fin','o0',g.length);addLog(G,`🏠 ${st.name}의 말 ${g.length}개 골인!`);
 G.duels.forEach(d=>{if(!d.done&&d.o===s){d.done=true;eliminate(G,d.by,`🤺 ${st.name}이(가) 골인해서 승부에서 졌습니다.`)}});
 if(g.some(k=>st.pieces[k].t==='mara'))return win(G,s,'🏃 마라토너 골인!');
 if(g.some(k=>st.pieces[k].t==='kim')&&st.st.kimTurns<=6)return win(G,s,`🛺 김첨지가 ${st.st.kimTurns}턴 만에 골인!`);
 if(st.pieces.every(p=>p.n==='F'))win(G,s,'말을 모두 골인시켰습니다.')}
function land(G,s,g,dest,back){const st=G.seats[s];let caught=0;
 if(G.reaper&&G.reaper.n===dest&&G.reaper.s!==s){killStack(G,s,g.slice(),G.reaper.s,'💀 사신');return 0}
 if(G.traps[dest]!=null&&G.traps[dest]!==s){delete G.traps[dest];fx(G,'kill',dest,g.length);g.forEach(k=>sendHome(G,s,k));addLog(G,`🪤 ${st.name}의 말이 함정에 빠져 집으로!`);return 0}
 if(G.rewards[dest]){delete G.rewards[dest];addLog(G,`🎁 보상! ${st.name}의 말이 3칸 더 갑니다.`);return doMove(G,s,g,walk(dest,3),false)}
 if(G.garlic&&G.garlic.s===s&&G.garlic.nodes.includes(dest)&&!G.garlic.got.includes(dest)){G.garlic.got.push(dest);addLog(G,`🧄 ${st.name}: 마늘 ${G.garlic.got.length}/4`);if(G.garlic.got.length>=4){win(G,s,'🧄 웅녀: 마늘 4개를 모았습니다!');return 0}}
 G.seats.forEach((ot,o)=>{if(o===s||G.phase==='over')return;const vs=ot.pieces.map((q,k)=>q.n===dest?k:-1).filter(k=>k>=0);if(!vs.length)return;
  const before=G.seats[o].pieces.filter(q=>q.n==='F').length,mine=st.pieces.filter(q=>q.n==='F').length;
  const n=killStack(G,o,vs,s);if(n){caught++;if(back&&has(G,s,'backwin'))win(G,s,'🐄 소 뒷걸음질: 빽도로 잡았습니다!');if(has(G,s,'treason')&&before>mine){G.throws++;addLog(G,'🗝️ 역모: 한 번 더!')}}});
 if(has(G,s,'cannibal')){const own=st.pieces.map((q,k)=>q.n===dest&&!g.includes(k)?k:-1).filter(k=>k>=0);if(own.length){own.forEach(k=>sendHome(G,s,k));addLog(G,`🍖 ${st.name}이(가) 자기 말을 잡았습니다.`);G.throws++}}
 if(caught)G.throws+=caught;
 boardWins(G);return caught}
function movePiece(G,s,ri,pi){if(G.phase!=='move'||s!==G.turn)return false;const pv=preview(G,s,ri,pi);if(!pv)return false;
 G.results.splice(ri,1);const t0=G.throws;doMove(G,s,pv.g,pv.path,pv.back);
 if(G.throws>t0&&G.phase!=='over')addLog(G,'한 번 더 던집니다.');
 G.ev++;afterAction(G,s);return true}
function afterAction(G,s){if(G.phase==='over'||G.phase==='pick')return;if(G.seats[s].out||G.seats[s].done){if(G.turn===s)endTurn(G);return}
 if(G.throws>0){G.phase='throw';return}
 if(!G.results.length||!anyMove(G,s)){if(G.results.length)addLog(G,'남은 결과를 쓸 수 없어 넘어갑니다.');endTurn(G)}else G.phase='move'}

/* ---- 판 접기 ---- */
const FOLDS={up:'위쪽 절반을 아래로',down:'아래쪽 절반을 위로',left:'왼쪽 절반을 오른쪽으로',right:'오른쪽 절반을 왼쪽으로'};
const AT={};NODES.forEach(n=>AT[POS[n].map(v=>Math.round(v)).join(',')]=n);
function foldNode(n,dir){if(!POS[n])return n;const[x,y]=POS[n];let nx=x,ny=y;
 if(dir==='up'&&y<49)ny=100-y;else if(dir==='down'&&y>51)ny=100-y;else if(dir==='left'&&x<49)nx=100-x;else if(dir==='right'&&x>51)nx=100-x;else return n;
 return AT[[nx,ny].map(v=>Math.round(v)).join(',')]||n}
function foldBoard(G,s,dir){const moved=[];// 접히는 쪽 말 옮기기
 const h=HALF[dir],fn=n=>nearKeep(h,foldNode(n,dir));
 G.seats.forEach((st,o)=>{if(st.out)return;st.pieces.forEach((p,k)=>{if(!onBoard(p))return;const m=fn(p.n);if(m!==p.n){moved.push({o,k,to:m});}})});
 const dests=new Set(moved.map(m=>m.to));
 // 받는 쪽에 원래 있던 상대 말은 깔림
 dests.forEach(n=>{G.seats.forEach((st,o)=>{if(o===s)return;const idx=st.pieces.map((p,k)=>p.n===n&&!moved.some(m=>m.o===o&&m.k===k)?k:-1).filter(k=>k>=0);if(idx.length)killStack(G,o,idx,s,'📄 판 접기')})});
 moved.forEach(m=>{const p=G.seats[m.o].pieces[m.k];if(p.n==='H'||p.n==='F')return;p.n=m.to;p.prev=null});
 moved.forEach(m=>{const p=G.seats[m.o].pieces[m.k];if(p.n===h.start){p.n='F'}});
 const mv=obj=>{const out={};for(const k in obj){const t=fn(k);if(t!==h.start)out[t]=obj[k]}return out};
 G.traps=mv(G.traps);G.rewards=mv(G.rewards);G.poop=mv(G.poop);
 for(const k in G.fires)G.fires[k]=fn(G.fires[k]);G.marks.forEach(m=>m.n=fn(m.n));
 if(G.garlic){G.garlic.nodes=G.garlic.nodes.map(fn);G.garlic.got=G.garlic.got.map(fn)}
 if(G.reaper)G.reaper.n=fn(G.reaper.n);
 G.half=dir;G.fold={dir,id:Math.random()};
 G.seats.forEach(st=>st.pieces.forEach(p=>{if(onBoard(p))p.prev=null}));
 addLog(G,`📄 ${G.seats[s].name}이(가) 판을 반으로 접었습니다 (${FOLDS[dir]}). 이제 한 바퀴가 절반으로 짧아집니다! 말 ${moved.length}개가 넘어갔습니다.`);
 G.seats.forEach((st,o)=>{if(!st.out&&!st.done&&st.pieces.every(p=>p.n==='F'))win(G,o,'📄 판이 접히면서 모두 골인!')});boardWins(G)}

/* ---- 직접 쓰는 증강 ---- */
function usesLeft(G,s,id){const A=AUG[id];if(A.perTurn)return G.snTurn[s]===G.turnNo?0:1;return(A.use||0)-(G.seats[s].used[id]||0)}
function useAug(G,s,id,t){if(s!==G.turn||!['throw','move'].includes(G.phase)||!has(G,s,id))return false;const A=AUG[id];if(!A.use&&!A.perTurn)return false;if(usesLeft(G,s,id)<=0)return false;
 const st=G.seats[s];t=t||{};const others=alive(G).filter(o=>o!==s);let ok=true;
 const ownOn=pi=>st.pieces[pi]&&onBoard(st.pieces[pi]);
 switch(id){
  case'dogs':G.results.push(mk('개','개 풀기'));break;
  case'loan':G.throws++;st.skip++;break;
  case'dober':{const n=Math.min(3,st.st.gae);if(!n){ok=false;break}for(let i=0;i<n;i++)G.results.push(mk('모','도베르만'));break}
  case'baduk':{if(!ownOn(t.a)||!ownOn(t.b))return false;const A1=st.pieces[t.a].n,B1=st.pieces[t.b].n;if(A1===B1)return false;
   const line=LINES.find(l=>l.includes(A1)&&l.includes(B1));if(!line)return false;let i=line.indexOf(A1),j=line.indexOf(B1);if(i>j)[i,j]=[j,i];
   let n=0;line.slice(i+1,j).forEach(nd=>{n+=killAt(G,nd,s,{exceptSeat:s,cause:'⚫ 바둑'})});G.throws+=n;break}
  case'fix':{if(!KINDS.includes(t.k))return false;G.force[s]=t.k;break}
  case'flip':{const r=G.results[t.ri];if(!r||![1,-1].includes(t.d))return false;const f=FLATS[r.k]+t.d;if(f<0||f>4)return false;G.results[t.ri]=mk(BYFLATS[f],'슬쩍');break}
  case'lonely':G.force[s]='도';break;
  case'shield':if(!ownOn(t.pi))return false;groupOf(G,s,t.pi).forEach(k=>st.pieces[k].sh=1);break;
  case'fire':if(!ownOn(t.pi))return false;G.fires[s]=st.pieces[t.pi].n;break;
  case'sacri':if(!ownOn(t.pi))return false;sendHome(G,s,t.pi);st.pieces.forEach(p=>{if(onBoard(p))p.sh=1});break;
  case'sniper':{if(G.phase!=='throw'||G.throws<=0||!NODES.includes(t.n))return false;G.throws--;G.marks.push({n:t.n,s});G.snTurn[s]=G.turnNo;break}
  case'assassin':if(!ownOn(t.pi))return false;st.pieces[t.pi].asn=1;break;
  case'illusion':{const o=G.seats[t.o];if(!o||t.o===s||o.out)return false;const a=o.aug.find(x=>x.id===t.aug&&!x.off&&!(AUG[x.id].use&&(o.used[x.id]||0)>=AUG[x.id].use));if(!a)return false;a.off=true;a.until=G.round+3;G.catCheck=1;break}
  case'hit':{const o=G.seats[t.o];if(!o||t.o===s||o.out)return false;o.skip+=2;break}
  case'grail':G.throws+=3;G.grail=s;break;
  case'lastdance':G.throws+=2;G.dance=s;break;
  case'marathon':{const k=st.pieces.findIndex(p=>p.n==='H'&&!p.t);if(k<0)return false;st.pieces[k].t='mara';break}
  case'duel':{const o=G.seats[t.o];if(!o||t.o===s||o.out)return false;G.duels.push({by:s,o:t.o,left:3,done:false});break}
  case'domain':if(!ownOn(t.pi))return false;st.pieces[t.pi].dom=2;break;
  case'fold':if(!FOLDS[t.dir]||G.half)return false;foldBoard(G,s,t.dir);break;
  case'prophet':{if(!G.seats[t.o]||G.seats[t.o].out||G.seats[t.o].done||!KINDS.includes(t.k))return false;if(t.o===s&&G.turnRes.length>0)return false;G.props.push({by:s,o:t.o,k:t.k});break}
  case'gambler':{if(!G.seats[t.o]||G.seats[t.o].out||G.seats[t.o].done)return false;G.bets.push({by:s,who:t.o});break}
  case'plan':{const n=G.seats.length;if(!Array.isArray(t.order)||t.order.length!==n||new Set(t.order).size!==n||t.order.some(x=>!Number.isInteger(x)||x<0||x>=n))return false;
   if(t.order.some((x,i)=>G.ranks[i]!=null&&G.ranks[i]!==x))return false;G.plans.push({by:s,order:t.order});break}
  default:return false}
 if(!ok)return false;
 if(A.perTurn)G.snTurn[s]=G.turnNo;else st.used[id]=(st.used[id]||0)+1;
 addLog(G,`${A.icon} ${st.name}: ${A.name}${['prophet','gambler','plan'].includes(id)?' (예측은 비밀)':t.o!=null&&G.seats[t.o]?' → '+G.seats[t.o].name:''}`);
 G.ev++;if(G.catCheck){delete G.catCheck;checkCat(G);if(G.phase==='over')return true}
 if(st.done||st.out){endTurn(G);return true}
 if(G.phase==='move'&&G.throws>0)G.phase='throw';
 else if(G.phase==='throw'&&G.throws<=0)toMove(G);
 else if(G.phase==='move'&&!anyMove(G,s)&&G.phase!=='over'){if(G.results.length)addLog(G,'쓸 수 있는 결과가 없어 넘어갑니다.');endTurn(G)}
 return true}

/* ---- 악마 AI ---- */
const PREF=['peace','shield','fire','vanguard','dogs','dober','four','coup','treason','assassin','friend','sniper','hit','illusion','marathon','jinmori','poop','reaper','notme','halt','bystander','fix','baduk','kim','piggy','bear','party','alone','s777','echo','comeback','pawn','loan','modo','dogae','flip','lonely','redbtn','exch','fast','sacri','cat','cat_me','cat_all','catlover','backwin','nofriend','domain','duel','cannibal','score','prophet','gambler','plan','bronze','grail','lastdance','redo'];
function aiPick(G,s){const st=G.seats[s];if(!st.offers)return null;if(catForced(G,s))return'cat';return st.offers.slice().sort((a,b)=>PREF.indexOf(a)-PREF.indexOf(b)+(rnd(G)-.5)*12)[0]}
function aiMove(G,s){let best=null,bs=-1e9;const st=G.seats[s];
 G.results.forEach((r,ri)=>st.pieces.forEach((p,pi)=>{const pv=preview(G,s,ri,pi);if(!pv)return;let sc=0;const d=pv.dest;
  if(d==='FIN')sc+=120*pv.g.length+(pv.g.some(k=>['mara','kim'].includes(st.pieces[k].t))?500:0);
  else{G.seats.forEach((ot,o)=>{if(o!==s&&ot.pieces.some(q=>q.n===d))sc+=80});
   if(G.traps[d]!=null&&G.traps[d]!==s)sc-=150;if(G.reaper&&G.reaper.n===d&&G.reaper.s!==s)sc-=200;if(G.rewards[d])sc+=25;if(G.garlic&&G.garlic.s===s&&G.garlic.nodes.includes(d)&&!G.garlic.got.includes(d))sc+=90;
   if(['o5','o10','C'].includes(d))sc+=18;sc+=(distFin(p.n)-distFin(d))*4;
   if(st.pieces.some((q,k)=>!pv.g.includes(k)&&q.n===d))sc+=has(G,s,'cannibal')?-60:20;
   G.seats.forEach((ot,o)=>{if(o===s)return;ot.pieces.forEach(q=>{if(!onBoard(q))return;for(let v=1;v<=5;v++){const w=walk(q.n,v);if(w[w.length-1]===d){sc-=12;break}}})})}
  if(p.n==='H')sc+=6;sc+=rnd(G)*4;if(sc>bs){bs=sc;best={ri,pi}}}));
 return best}
function aiActive(G,s){const st=G.seats[s];if(rnd(G)>.4)return null;
 const others=alive(G).filter(o=>o!==s);if(!others.length)return null;
 const lead=others.slice().sort((a,b)=>G.seats[b].pieces.filter(p=>p.n==='F').length-G.seats[a].pieces.filter(p=>p.n==='F').length)[0];
 const front=()=>{let k=-1,d=99;st.pieces.forEach((p,i)=>{if(onBoard(p)&&distFin(p.n)<d){d=distFin(p.n);k=i}});return k};
 for(const a of st.aug){if(a.off||usesLeft(G,s,a.id)<=0)continue;const f=front();
  switch(a.id){case'dogs':if(G.phase==='move')return{id:'dogs'};break;case'dober':if(st.st.gae>0)return{id:'dober'};break;
   case'shield':case'fire':case'assassin':if(f>=0&&!st.pieces[f].sh)return{id:a.id,t:{pi:f}};break;
   case'hit':return{id:'hit',t:{o:lead}};
   case'prophet':{const o=others[Math.floor(rnd(G)*others.length)];return{id:'prophet',t:{o,k:'개'}}}
   case'gambler':return{id:'gambler',t:{o:lead}};
   case'plan':{const order=G.ranks.slice();const rest=alive(G).sort((a,b)=>G.seats[b].pieces.filter(p=>p.n==='F').length-G.seats[a].pieces.filter(p=>p.n==='F').length);for(let i=0;i<order.length;i++)if(order[i]==null)order[i]=rest.shift();return{id:'plan',t:{order}}}
   case'fold':{let bd=null,bv=3;for(const dir in FOLDS){let v=0;G.seats.forEach((x,o)=>x.pieces.forEach(p=>{if(!onBoard(p))return;const m=foldNode(p.n,dir);const d=distFin(p.n)-distFin(m);v+=o===s?d:-d*.6}));if(v>bv){bv=v;bd=dir}}if(bd)return{id:'fold',t:{dir:bd}};break}
   case'illusion':{const x=G.seats[lead].aug.find(y=>!y.off&&y.id!=='cat');if(x)return{id:'illusion',t:{o:lead,aug:x.id}};break}
   case'marathon':if(st.pieces.some(p=>p.n==='H'&&!p.t))return{id:'marathon'};break;
   case'fix':if(G.phase==='throw')return{id:'fix',t:{k:'모'}};break;
   case'sniper':{if(G.phase!=='throw'||G.throws<1)break;let bn=null,bc=0;const cnt={};others.forEach(o=>G.seats[o].pieces.forEach(p=>{if(onBoard(p)){cnt[p.n]=(cnt[p.n]||0)+1;if(cnt[p.n]>bc){bc=cnt[p.n];bn=p.n}}}));if(bc>=2)return{id:'sniper',t:{n:bn}};break}
   case'baduk':{const mine=st.pieces.map((p,i)=>onBoard(p)?i:-1).filter(i=>i>=0);for(const i of mine)for(const j of mine){const A1=st.pieces[i].n,B1=st.pieces[j].n;if(A1===B1)continue;const l=LINES.find(x=>x.includes(A1)&&x.includes(B1));if(!l)continue;let x=l.indexOf(A1),y=l.indexOf(B1);if(x>y)[x,y]=[y,x];if(l.slice(x+1,y).some(nd=>others.some(o=>G.seats[o].pieces.some(p=>p.n===nd))))return{id:'baduk',t:{a:i,b:j}}}break}}}
 return null}
function autoStep(G,s){
 if(G.phase==='pick'){const st=G.seats[s];if(st.offers)return pickAug(G,s,aiPick(G,s));return false}
 if(s!==G.turn)return false;const st=G.seats[s];
 if(G.phase==='throw'){const u=st.ai?aiActive(G,s):null;if(u&&useAug(G,s,u.id,u.t))return true;return!!throwYut(G,s,rnd(G)<.6?'개':'도')}
 if(G.phase==='move'){const u=st.ai?aiActive(G,s):null;if(u&&u.id==='dogs'&&useAug(G,s,'dogs'))return true;const m=aiMove(G,s);if(m)return movePiece(G,s,m.ri,m.pi);endTurn(G);G.ev++;return true}
 return false}
function apply(G,s,a){if(!a||G.phase==='over')return false;
 if(a.t==='pick')return pickAug(G,s,a.id);
 if(a.t==='throw')return!!throwYut(G,s,a.k);
 if(a.t==='move')return movePiece(G,s,a.ri,a.pi);
 if(a.t==='use')return useAug(G,s,a.id,a.x);
 return false}
const API0={HALF,FOLDS,foldNode,CATS,isCat,PIECES,PICK_ROUNDS,COLORS,CNAMES,POS,NODES,LINES,AUGS,AUG,TYPEICON,KINDS,FLATS,BYFLATS,step,walk,backOf,distFin,newGame,pickAug,throwYut,movePiece,useAug,usesLeft,preview,canUse,groupOf,apply,autoStep,endTurn,has,catForced,onBoard};
const API={};for(const k in API0){const f=API0[k];API[k]=typeof f==='function'?function(G){if(G&&G.seats)FG=G;return f.apply(null,arguments)}:f}
API.setGame=G=>{FG=G};
if(typeof module!=='undefined')module.exports=API;else root.YUT=API;
})(this);
