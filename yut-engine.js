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
 {id:'modo',tag:'g',icon:'🎲',name:'모 아니면 도',d:'모와 도만 나옵니다. (모 45%, 도 55%)'},
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
 {id:'chaos',tag:'g',icon:'🌀',name:'혼돈의 말',d:'게임 내내 내 윷 결과로 상대 말도 움직일 수 있습니다. 상대 말이 도착한 칸에 있던 다른 말은 누구 것이든 잡힙니다. (상대 말로 잡으면 한 번 더 던지지 않음)'},
 {id:'swap',tag:'g',icon:'🔀',name:'자리 바꾸기',d:'판 위 내 말 무리 하나와 상대 말 무리 하나의 자리를 서로 바꿉니다.',use:1,tg:'swap'},
 {id:'reset',tag:'g',icon:'🔄',name:'리셋',d:'고르는 즉시 게임이 리셋됩니다. 모든 말(골인한 말 포함)이 집으로 돌아가고, 판 위 물건과 접힌 판도 원래대로 돌아옵니다. 증강은 그대로 남습니다.'},
 {id:'magnet',tag:'g',icon:'🧲',name:'자석',d:'판 위에 있는 모든 상대 말이 1칸씩 뒤로 끌려옵니다.',use:1},
 {id:'tele',tag:'g',icon:'✨',name:'순간이동',d:'고른 내 말 무리가 바로 3칸 앞으로 갑니다. 도착한 칸에 상대 말이 있으면 잡습니다.',use:1,tg:'own'},
 {id:'tornado',tag:'g',icon:'🌪️',name:'회오리',d:'판 위에 있는 모든 말 무리(내 말 포함)의 자리를 무작위로 섞습니다.',use:1},
 {id:'ice',tag:'g',icon:'🧊',name:'얼음',d:'상대 한 명을 고릅니다. 그 사람의 판 위 말은 다음 라운드가 끝날 때까지 움직일 수 없습니다.',use:1,tg:'opp'},
 {id:'clover',tag:'g',icon:'🍀',name:'네잎클로버',d:'빽도가 나오지 않습니다.'},
 {id:'rabbit',tag:'g',icon:'🐇',name:'토끼',d:'집에서 새로 출발하는 말은 1칸 더 갑니다.'},
 {id:'gift',tag:'g',icon:'🎁',name:'선물 상자',d:'판 위 빈 칸 3곳에 보상 상자를 놓습니다. 상자 칸에 멈춘 말은 3칸 더 갑니다. (누구든)',use:1},
 {id:'mirror',tag:'g',icon:'🪞',name:'거울 세계',d:'판을 거울에 비춘 것처럼 좌우로 뒤집습니다. 모든 말과 물건이 반대편 같은 자리로 옮겨집니다.',use:1},
 {id:'timemachine',tag:'g',icon:'⏳',name:'타임머신',d:'모든 말을 한 라운드 전 자리로 되돌립니다. (골인한 말은 그대로)',use:1},
 {id:'ghost',tag:'g',icon:'👻',name:'유령',d:'내 말이 잡히면, 잡은 상대 말 무리도 원한을 품은 유령에게 끌려가 함께 집으로 돌아갑니다.'},
 {id:'slot',tag:'g',icon:'🎰',name:'슬롯머신',d:'릴 3개를 돌립니다. 7️⃣7️⃣7️⃣ = 가장 앞선 내 말 무리가 즉시 골인 / 같은 그림 3개 = 모 2개 / 2개 = 개 1개 / 꽝',use:2},
 {id:'clone',tag:'g',icon:'👥',name:'분신술',d:'판 위 내 말을 고르면, 집에 있는 내 말 하나가 그 말의 분신으로 같은 칸에 나타납니다.',use:1,tg:'own'},
 {id:'lifeswap',tag:'g',icon:'🎭',name:'인생 교환',d:'상대 한 명과 판 위·집에 있는 말 자리를 통째로 맞바꿉니다. (골인한 말 수는 그대로)',use:1,tg:'opp'},
 {id:'murder',tag:'g',icon:'🔪',name:'나에게 윷놀이는 "살인"이다',d:'모두에게 체력 3이 생깁니다. 내가 상대 말을 잡을 때마다 그 상대는 잡힌 말 수만큼 피해를 입습니다. 체력이 0이 되면 탈락합니다.'},
 {id:'necro',tag:'g',icon:'🧟',name:'네크로맨서',d:'1회: 탈락한 플레이어를 부활시킵니다. 그 플레이어가 승리하면 나도 같이 승리합니다. 능력을 쓰지 않았다면 내 탈락을 한 번 자동으로 막습니다.',use:1,tg:'dead'},
 {id:'demon',tag:'g',icon:'👹',name:'마신 소환',d:'내 모든 일반 말을 광신도로 바꿉니다. 판 위의 광신도는 내 차례가 시작될 때마다 의식 코인을 1개씩 줍니다. 의식 코인 12개를 모으면 승리합니다.'},
 {id:'pelican',tag:'g',icon:'🦤',name:'변환: 펠리컨',d:'1회: 판 위 내 일반 말 하나를 펠리컨으로 바꿉니다. 펠리컨은 말을 잡으면 죽이지 않고 삼킵니다. 삼킨 채로 골인하면 삼킨 말의 주인을 탈락시킵니다. (펠리컨이 잡히면 삼킨 말은 풀려납니다)',use:1,tg:'own'},
 {id:'nunchi',tag:'start',icon:'👀',name:'눈치싸움',d:'다음 증강 선택 때 모두에게 같은 선택지가 나옵니다. 가장 많이 선택된 증강은 무효가 됩니다. 내가 고른 증강이 무효가 되지 않으면 내 말 2개를 골인시킵니다.'},
 {id:'pd',tag:'g',icon:'⛓️',name:'죄수의 딜레마',d:'1회: 원하는 플레이어 2명을 고릅니다(나 포함 가능). 두 사람은 몰래 협력/배신을 고릅니다. 둘 다 협력 = 둘 다 다음 턴에 걸 1개 / 한 명만 배신 = 배신자는 다음 턴에 모 2개, 협력자는 한 턴 쉼 / 둘 다 배신 = 둘 다 가장 앞선 말이 집으로',use:1,tg:'two_p'},
 {id:'bluff',tag:'g',icon:'🤫',name:'블러핑',d:'2회: 다음 윷 결과를 숨기고 원하는 값을 말합니다. 다른 플레이어들이 믿을지 판정합니다. 거짓이 들키면 그 값은 사라집니다. 진실을 거짓이라고 한 플레이어는 다음 턴을 건너뜁니다.',use:2},
 {id:'zombie',tag:'g',icon:'🧟‍♂️',name:'변환: 좀비',d:'1회: 판 위 내 일반 말 하나를 좀비로 바꿉니다. 좀비에게 잡힌 말은 좀비가 됩니다(좀비가 된 말도 다른 말을 잡으면 감염시킴). 전체 말의 절반 이상이 좀비가 되면 내가 승리합니다.',use:1,tg:'own'},
 {id:'cannon',tag:'g',icon:'💣',name:'변환: 포',d:'1회: 판 위 내 일반 말 하나를 장기의 포로 바꿉니다. 매 차례 한 번, 포는 말이 있는 칸 하나를 뛰어넘어 그 줄을 따라 원하는 만큼 일직선으로 갈 수 있습니다. 상대 말이 있는 칸에 서면 잡습니다.',use:1,tg:'own'},
 {id:'spin',tag:'g',icon:'🎡',name:'돌려돌려 돌림판',d:'판을 무작위로 90°/180°/270° 회전시킵니다. 모든 말과 물건이 함께 돌아갑니다. 결과가 마음에 안 들면 한 번 더 돌릴 수 있습니다.',use:2},
 {id:'overflow',tag:'g',icon:'🎋',name:'과유불급',d:'윷 6개를 던집니다. 앞면 0개 = 모, 1 = 도, 2 = 개, 3 = 걸, 4·5 = 윷, 6개 모두 앞면 = 탈락!'},
 {id:'queen',tag:'start',icon:'👑',name:'시작 변환: 중전마마',d:'말 하나가 중전마마가 되어 좌측 상단에서 시작합니다. 중전마마가 잡혀 목숨이 0이 되면 탈락하고, 내가 윷을 12번 던질 때까지 지키면 승리합니다. 중전마마는 골인할 수 없습니다. 다른 내 말이 골인할 때마다 목숨이 1개 늘어납니다. (처음 목숨 1)'},
 {id:'monster',tag:'start',icon:'👾',name:'시작 변환: 괴물',d:'골인할 수 없는 괴물 하나만 가지고 시작합니다. (한 바퀴를 돌면 다시 돕니다) 괴물이 말을 12개 잡으면 승리합니다. 괴물은 잡혀도 죽지 않지만, 잡힐 때마다 목표 개수가 1개씩 늘어납니다.'},
 {id:'star',tag:'start',icon:'⭐',name:'시작 변환: 1성',d:'말이 8개가 되고 모두 1성이 됩니다. 내 말끼리 업힐 때마다 하나로 합쳐지며 성급이 더해집니다. 8성을 만들면 승리합니다.'},
 {id:'flick',tag:'g',icon:'🥌',name:'알까기',d:'1회: 내 차례(윷을 던지기 전)를 써서 알까기를 합니다. 판 위 내 말 하나와 방향을 고르고 힘을 정해 튕깁니다. 줄을 따라 날아가다 처음 부딪힌 상대 말을 쳐내고 그 자리에 섭니다. 너무 세게 튕겨 판 밖으로 나가면 내 말이 집으로 돌아갑니다.',use:1,tg:'flick'},
 {id:'combo',tag:'start',icon:'🧮',name:'위치콤보',d:'판의 모든 칸에 숫자(1~9) 또는 부호(+ − × ÷) 카드가 생기고 목표 숫자가 정해집니다. 모두가 말이 멈춘 칸의 카드를 1장씩 얻고, 먹은 칸은 새 카드로 채워집니다. 새 말을 내보내면 숫자 카드 2장을 얻습니다. 가진 카드로 목표 숫자가 되는 수식을 먼저 제출한 사람이 승리합니다. (나는 숫자 카드 2장을 먼저 받고 시작)'},
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
 {id:'plan',tag:'end',icon:'📜',name:'계획대로',d:'이 판의 최종 순위를 1위부터 끝까지 예측합니다. 끝났을 때 순위가 모두 맞으면, 기존 순위를 모두 없애고 나 혼자 승리합니다.',use:1,tg:'order'},
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
const TYPEICON={van:'🚩',pawn:'♟️',kim:'🛺',mara:'🏃',cult:'🕯️',peli:'🦤'};

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
 if(G.nunchi&&!G.nunchi.on&&!G.nunchi.done){const by=G.nunchi.by;const base=offersFor(G,alive(G).includes(by)?by:alive(G)[0],tag).filter(x=>x!=='redo');
  G.nunchi.on=true;G.nunchi.picks={};G.seats.forEach(st=>{if(st.offers)st.offers=base.slice()});addLog(G,'👀 눈치싸움! 모두에게 같은 선택지가 나왔습니다. 가장 많이 고른 증강은 무효가 됩니다.')}
 if(G.seats.every(x=>!x.offers))return beginTurn(G)}
function comboNum(G){return String(1+Math.floor(rnd(G)*9))}
function comboCard(G){return rnd(G)<.68?comboNum(G):['+','-','×','÷'][Math.floor(rnd(G)*4)]}
function comboGet(G,s,n){if(!G.combo||!G.combo.cells[n])return;const st=G.seats[s];st.cards=st.cards||[];const c=G.combo.cells[n];st.cards.push(c);G.combo.cells[n]=comboCard(G);addLog(G,`🧮 ${st.name}: 카드 「${c}」 획득`)}
function comboEval(cards,seq){if(!Array.isArray(seq)||!seq.length||seq.length>20)return null;const used=new Set();let str='',ops=0,prevNum=false;
 for(const i of seq){if(!Number.isInteger(i)||i<0||i>=cards.length||used.has(i))return null;used.add(i);const c=cards[i];
  if(/^[0-9]$/.test(c)){str+=c;prevNum=true}else{if(!prevNum)return null;str+={'+':'+','-':'-','×':'*','÷':'/'}[c];ops++;prevNum=false}}
 if(!prevNum||!ops)return null;const tk=str.match(/\d+|[-+*/]/g);
 const nums=[],opsA=[];tk.forEach((t,i)=>{if(i%2===0)nums.push(+t);else opsA.push(t)});
 let a=[nums[0]],o2=[];for(let i=0;i<opsA.length;i++){const op=opsA[i],b=nums[i+1];if(op==='*')a[a.length-1]*=b;else if(op==='/'){if(b===0)return null;a[a.length-1]/=b}else{o2.push(op);a.push(b)}}
 let v=a[0];for(let i=0;i<o2.length;i++)v=o2[i]==='+'?v+a[i+1]:v-a[i+1];return v}
function aiFormula(cards,target){const N=cards.map((c,i)=>/[0-9]/.test(c)?i:-1).filter(i=>i>=0),O=cards.map((c,i)=>/[0-9]/.test(c)?-1:i).filter(i=>i>=0);let tries=0;
 for(const a of N)for(const o of O)for(const b of N){if(b===a)continue;const sq=[a,o,b];if(comboEval(cards,sq)===target)return sq}
 for(const a of N)for(const o of O)for(const b of N){if(b===a)continue;for(const o2 of O){if(o2===o)continue;for(const c of N){if(c===a||c===b)continue;if(++tries>40000)return null;const sq=[a,o,b,o2,c];const v=comboEval(cards,sq);if(v!=null&&Math.abs(v-target)<1e-9)return sq}}}return null}
function comboSubmit(G,s,seq){const st=G.seats[s];if(!G.combo||st.out||st.done||G.phase==='over'||G.phase==='pick')return false;const v=comboEval(st.cards||[],seq);
 const txt=(seq||[]).map(i=>(st.cards||[])[i]).join(' ');if(v==null||Math.abs(v-G.combo.target)>1e-9){addLog(G,`🧮 ${st.name}: ${txt} — 틀렸습니다.`);G.ev++;return true}
 addLog(G,`🧮 ${st.name}: ${txt} = ${G.combo.target}!`);win(G,s,`🧮 위치콤보: ${txt} = ${G.combo.target}`);if(G.phase!=='over'&&G.turn===s)endTurn(G);G.ev++;return true}
function mapBoard(G,f){const h=G.half?HALF[G.half]:null;const m=n=>{if(!POS[n])return n;const[x,y]=f(POS[n][0],POS[n][1]);const k=AT[Math.round(x)+','+Math.round(y)]||n;return h?nearKeep(h,k):k};
 G.seats.forEach(x=>x.pieces.forEach(p=>{if(onBoard(p)){p.n=m(p.n);p.prev=null}}));const mo=o=>{const r={};for(const k in o)r[m(k)]=o[k];return r};
 G.traps=mo(G.traps);G.rewards=mo(G.rewards);G.poop=mo(G.poop);G.fires=mo(G.fires);if(G.reaper)G.reaper.n=m(G.reaper.n);if(G.garlic)G.garlic.nodes=G.garlic.nodes.map(m)}
function zombieCheck(G){const own=alive(G).filter(o=>has(G,o,'zombie'));if(!own.length)return;let z=0,t=0;G.seats.forEach(x=>{if(x.out)return;x.pieces.forEach(p=>{t++;if(p.t==='zomb')z++})});
 if(t&&z*2>=t)win(G,own[0],`🧟‍♂️ 좀비가 전체 말의 절반을 넘었습니다! (${z}/${t})`)}
function poTargets(G,s,pi){const p=G.seats[s].pieces[pi];if(!p||p.t!=='po'||!onBoard(p))return[];const keep=G.half?HALF[G.half].keep:null;const occ=n=>{let r=null;G.seats.forEach((x,o)=>{if(x.out)return;x.pieces.forEach(q=>{if(q.n===n)r=r==null?o:r})});return r};
 const out=new Set();LINES.forEach(L=>{const i=L.indexOf(p.n);if(i<0)return;[1,-1].forEach(d=>{let j=i+d,jumped=false;while(j>=0&&j<L.length){const n=L[j];if(keep&&!keep.has(n))break;const o=occ(n);
  if(!jumped){if(o!=null)jumped=true}else{if(o==null)out.add(n);else{if(o!==s)out.add(n);break}}j+=d}})});return[...out]}
function poMove(G,s,pi,n){if(s!==G.turn||!['throw','move'].includes(G.phase))return false;const st=G.seats[s];if(G.poT&&G.poT[s]===G.turnNo)return false;if(!poTargets(G,s,pi).includes(n))return false;
 (G.poT=G.poT||{})[s]=G.turnNo;const g=groupOf(G,s,pi);g.forEach(k=>{st.pieces[k].n=n;st.pieces[k].prev=null});addLog(G,`💣 ${st.name}의 포가 뛰어넘었습니다!`);land(G,s,g,n,false);G.ev++;
 if(G.phase==='move'&&G.throws>0)G.phase='throw';return true}
function castVote(G,s,v){const V=G.vote;if(G.phase!=='vote'||!V||!V.voters.includes(s)||V.votes[s]!=null)return false;
 if(V.kind==='bluff'&&V.step===1){if(!KINDS.includes(v))return false}else if(V.kind==='bluff'){if(v!=='믿음'&&v!=='거짓')return false}else if(v!=='협력'&&v!=='배신')return false;
 V.votes[s]=v;G.ev++;if(V.voters.every(o=>V.votes[o]!=null||G.seats[o].out||G.seats[o].done))resolveVote(G);return true}
function resolveVote(G){const V=G.vote;
 if(V.kind==='bluff'&&V.step===1){V.decl=V.votes[V.s];const ot=alive(G).filter(o=>o!==V.s);addLog(G,`🤫 ${G.seats[V.s].name}: "${V.decl}!" — 믿을까요?`);
  if(!ot.length){V.votes={};V.voters=[];V.step=2;return resolveVote(G)}V.step=2;V.voters=ot;V.votes={};G.ev++;return}
 G.phase=V.ret;G.vote=null;
 if(V.kind==='bluff'){const st=G.seats[V.s],lie=V.decl!==V.real,dbt=V.voters.filter(o=>V.votes[o]==='거짓');let k=null;
  if(lie&&dbt.length)addLog(G,`🤫 거짓말이 들켰습니다! (실제: ${V.real}) 값이 사라집니다.`);
  else if(lie){k=V.decl;addLog(G,`🤫 아무도 의심하지 않았습니다. ${st.name}: ${V.decl} (실제: ${V.real})`)}
  else{k=V.real;addLog(G,`🤫 진짜였습니다! ${st.name}: ${V.real}`);dbt.forEach(o=>{G.seats[o].skip++;addLog(G,`⏸️ ${G.seats[o].name}: 진실을 의심해서 다음 턴을 건너뜁니다.`)})}
  if(k){G.results.push(mk(k,'블러핑'));G.turnRes.push(k);if(k==='윷'||k==='모')G.throws++}
  G.lastThrow={k:k||'꽝',extra:0,id:Math.random(),s:V.s,sticks:st.sticks};
  if(G.turn===V.s&&!st.out&&!st.done){if(G.throws<=0)toMove(G);else G.phase='throw'}G.ev++;return}
 const[a,b]=V.voters,va=V.votes[a],vb=V.votes[b],A=G.seats[a],B=G.seats[b];addLog(G,`⛓️ ${A.name}: ${va||'협력'} / ${B.name}: ${vb||'협력'}`);
 const front=o=>{const x=G.seats[o];let k=-1,d=99;x.pieces.forEach((p,i)=>{if(onBoard(p)&&distFin(p.n)<d){d=distFin(p.n);k=i}});if(k>=0){groupOf(G,o,k).forEach(i=>sendHome(G,o,i));addLog(G,`⛓️ ${x.name}의 가장 앞선 말이 집으로!`)}};
 if(va!=='배신'&&vb!=='배신'){[A,B].forEach(x=>x.bankRes.push(mk('걸','협력')));addLog(G,'⛓️ 둘 다 협력! 둘 다 다음 턴에 걸 1개.')}
 else if(va==='배신'&&vb==='배신'){front(a);front(b);addLog(G,'⛓️ 둘 다 배신!')}
 else{const bt=va==='배신'?A:B,co=va==='배신'?B:A;bt.bankRes.push(mk('모','배신'),mk('모','배신'));co.skip++;addLog(G,`⛓️ ${bt.name}의 배신! ${bt.name}은 다음 턴에 모 2개, ${co.name}은 한 턴 쉽니다.`)}
 const cur=G.seats[G.turn];if(cur.out||cur.done){endTurn(G);return}if(G.phase==='throw'&&G.throws<=0)toMove(G);G.ev++}
function aiVote(G,s){const V=G.vote;if(V.kind==='bluff'&&V.step===1)return['도','개','빽도'].includes(V.real)&&rnd(G)<.6?(rnd(G)<.5?'윷':'모'):V.real;
 if(V.kind==='bluff')return['윷','모'].includes(V.decl)?(rnd(G)<.5?'거짓':'믿음'):(rnd(G)<.15?'거짓':'믿음');return rnd(G)<.55?'배신':'협력'}
function nunchiEnd(G){const N=G.nunchi;N.on=false;N.done=true;const cnt={};for(const k in N.picks)cnt[N.picks[k]]=(cnt[N.picks[k]]||0)+1;
 const mx=Math.max(0,...Object.values(cnt));const bad=new Set(mx>=2?Object.keys(cnt).filter(k=>cnt[k]===mx):[]);
 if(bad.size)addLog(G,`👀 가장 많이 고른 ${[...bad].map(k=>AUG[k].icon+' '+AUG[k].name).join(', ')} → 무효!`);else addLog(G,'👀 겹친 증강이 없어 무효가 없습니다.');
 for(const k in N.picks){const id=N.picks[k];if(G.phase==='over')break;if(bad.has(id))addLog(G,`${G.seats[k].name}: ${AUG[id].icon} ${AUG[id].name} (무효)`);else gain(G,+k,id)}
 const by=N.by,bs=G.seats[by];if(G.phase!=='over'&&N.picks[by]!=null&&!bad.has(N.picks[by])&&!bs.out&&!bs.done){
  const ks=bs.pieces.map((p,k)=>k).filter(k=>bs.pieces[k].n!=='F'&&bs.pieces[k].t!=='pawn').sort((a,b)=>(bs.pieces[a].n==='H'?99:distFin(bs.pieces[a].n))-(bs.pieces[b].n==='H'?99:distFin(bs.pieces[b].n))).slice(0,2);
  ks.forEach(k=>{const p=bs.pieces[k];p.n='F';p.prev=null});if(ks.length){fx(G,'fin','o0',ks.length);addLog(G,`👀 ${bs.name}: 눈치싸움 성공! 말 ${ks.length}개 골인!`)}boardWins(G)}}
function offersFor(G,s,tag){const st=G.seats[s],own=new Set(st.aug.map(a=>a.id));
 const EXC=[['dogae','modo','overflow']],bad=new Set();EXC.forEach(gp=>{if(gp.some(x=>own.has(x)))gp.forEach(x=>bad.add(x))});
 const pool=AUGS.filter(a=>(a.tag==='g'||a.tag===tag)&&!own.has(a.id)&&!bad.has(a.id)&&!(st.redoUsed&&a.id==='redo')&&!(a.id==='bronze'&&(G.seats.length<3||G.ranks[2]!=null))).map(a=>a.id);
 const off=[];while(off.length<3&&pool.length){const x=pool.splice(Math.floor(rnd(G)*pool.length),1)[0];off.push(x);const gp=EXC.find(g=>g.includes(x));if(gp)for(let i=pool.length-1;i>=0;i--)if(gp.includes(pool[i]))pool.splice(i,1)}return off}
function catForced(G,s){const st=G.seats[s];return!!(st.offers&&st.offers.includes('cat')&&(has(G,s,'cat_me')||G.seats.some((x,i)=>has(G,i,'cat_all'))))}
function pickAug(G,s,id){const st=G.seats[s];if(G.phase!=='pick'||!st.offers||!st.offers.includes(id))return false;
 if(catForced(G,s)&&id!=='cat')return false;
 if(G.nunchi&&G.nunchi.on){G.nunchi.picks[s]=id;st.offers=null;addLog(G,`${st.name}: 👀 선택 완료`);if(G.seats.every(x=>!x.offers)){nunchiEnd(G);if(G.phase!=='over')beginTurn(G)}G.ev++;return true}
 if(id==='redo'){st.redoUsed=true;addLog(G,`${st.name}: ✋ 이의 있음! 다시 고릅니다.`);st.offers=offersFor(G,s,G.round===1?'start':G.round===6?'mid':'end');G.ev++;return true}
 st.offers=null;gain(G,s,id);
 if(G.phase!=='over'&&G.seats.every(x=>!x.offers))beginTurn(G);G.ev++;return true}
function gain(G,s,id){const st=G.seats[s],A=AUG[id];st.aug.push({id});addLog(G,`${st.name}: ${A.icon} ${A.name}`);
 const others=alive(G).filter(o=>o!==s);
 switch(id){
  case'poop':{const k=freeNode(G);if(k)G.poop[k]=s;break}
  case'overflow':st.sticks=6;break;
  case'combo':{if(!G.combo){const cells={};NODES.forEach(n=>{if(n!=='o0')cells[n]=comboCard(G)});G.combo={target:12+Math.floor(rnd(G)*37),cells};G.seats.forEach(x=>{x.cards=x.cards||[]});addLog(G,`🧮 위치콤보! 모든 칸에 카드가 생겼습니다. 목표 숫자: ${G.combo.target}`)}
   st.cards=(st.cards||[]).concat([comboNum(G),comboNum(G)]);break}
  case'queen':{let k=st.pieces.findIndex(p=>p.n==='H'&&!p.t);if(k<0)k=st.pieces.findIndex(p=>p.n!=='F');if(k>=0){const p=st.pieces[k];p.t='queen';p.n='o10';p.prev=null}st.qLife=1;st.qThrows=0;addLog(G,`👑 ${st.name}: 중전마마가 좌측 상단에 등장했습니다. (목숨 1, 0/12)`);break}
  case'monster':{const p=newPiece();p.t='mon';st.pieces=[p];st.monK=0;st.monNeed=12;addLog(G,`👾 ${st.name}: 괴물 하나만 남았습니다. (잡은 말 0/12)`);break}
  case'star':{st.pieces=Array.from({length:8},()=>{const p=newPiece();p.lv=1;return p});addLog(G,`⭐ ${st.name}: 1성 말 8개!`);break}
  case'murder':if(!G.hp){G.hp=G.seats.map(()=>3);addLog(G,'🔪 모두에게 체력 3이 생겼습니다.')}break;
  case'demon':{let n=0;st.pieces.forEach(p=>{if(p.n!=='F'&&!p.t){p.t='cult';n++}});st.coin=st.coin||0;addLog(G,`👹 ${st.name}: 마신 소환! 광신도 ${n}명`);break}
  case'nunchi':G.nunchi={by:s};break;
  case'reset':{G.seats.forEach(x=>{if(x.out||x.done)return;x.pieces.forEach(p=>{p.n='H';p.prev=null;p.sh=0;p.lock=0;p.asn=0;p.dom=0;p.sw=0;p.belly=[]})});
   G.traps={};G.rewards={};G.poop={};G.fires={};G.marks=[];G.reaper=null;if(G.garlic)G.garlic.got=[];G.half=null;G.fold={dir:null,id:Math.random()};
   addLog(G,'🔄 게임 리셋! 모든 말이 집으로 돌아갑니다.');break}
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
 if(!top&&at==null&&has(G,s,'necro')&&!(st.used.necro>0)&&alive(G).length>1){st.used.necro=1;if(G.hp&&G.hp[s]<=0)G.hp[s]=1;addLog(G,`🧟 ${st.name}: 네크로맨서가 탈락을 막았습니다! (${why||''})`);G.ev++;return}
 let idx=at!=null&&G.ranks[at]==null?at:top?G.ranks.indexOf(null):G.ranks.lastIndexOf(null);if(idx<0)return;
 G.ranks[idx]=s;st.rank=idx+1;if(top||at!=null)st.done=true;else st.out=true;st.offers=null;st.why=why||'';
 st.pieces.forEach(p=>{if(p.n!=='F'){p.n='H';p.prev=null;p.lock=0;p.dom=0;p.asn=0}});
 addLog(G,top||at!=null?`🏅 ${st.name} ${idx+1}위 확정! ${why||''}`:`☠️ ${st.name} 탈락 (${idx+1}위). ${why||''}`);fx(G,'rank','C',idx+1);G.ev++;
 if(top||at!=null)(G.bonds||[]).forEach(b=>{if(b.b===s&&!G.seats[b.a].out&&!G.seats[b.a].done){G.seats[b.a].rank=0;b.go=1}});
 G.duels.forEach(d=>{if(!d.done&&(d.o===s||d.by===s))d.done=true});if(G.reaper&&G.reaper.s===s){G.reaper=null;addLog(G,'💀 사신이 사라졌습니다.')}
 (G.bonds||[]).forEach(b=>{if(b.go===1){b.go=2;place(G,b.a,true,`🧟 네크로맨서: 부활시킨 ${st.name}와(과) 함께 승리!`)}});if(G.phase==='over'||!alive(G).includes(s)&&st.rank!==idx+1)return;
 const left=alive(G);if(left.length<=1){if(left.length===1){const k=left[0];G.ranks[G.ranks.indexOf(null)]=k;G.seats[k].rank=G.ranks.indexOf(k)+1;G.seats[k].done=true;addLog(G,`${G.seats[k].name} ${G.seats[k].rank}위.`)}finishGame(G)}}
function finishGame(G){G.plans.forEach(pl=>{if(G.phase==='over')return;if(JSON.stringify(pl.order)===JSON.stringify(G.ranks)){G.seats.forEach(x=>x.rank=0);G.ranks=[pl.by];G.seats[pl.by].rank=1;G.seats[pl.by].why='📜 계획대로: 순위를 모두 맞혔습니다!';G.solo=true;addLog(G,`📜 계획대로! ${G.seats[pl.by].name}이(가) 순위를 모두 맞혀, 기존 순위가 사라지고 혼자 승리합니다.`)}});
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
function sendHome(G,o,k){const p=G.seats[o].pieces[k];if(p.belly&&p.belly.length){p.belly.forEach(([a,b])=>{const q=G.seats[a].pieces[b];q.lock=0;q.sw=0});p.belly=[];addLog(G,`🦤 펠리컨이 잡혀서 삼킨 말이 풀려났습니다.`)}if(p.dom>0){eliminate(G,o,'🌌 영역 전개 실패');}
 const f=G.fires[o];if(f){p.n=f;delete G.fires[o];addLog(G,`🔥 ${G.seats[o].name}의 말이 화톳불에서 되살아납니다.`)}else p.n='H';
 p.prev=null;p.lock=0;p.asn=0;p.dom=0;p.sh=0}
function killStack(G,o,idx,by,cause){// o의 말 idx를 잡음. 반환: 잡힌 개수
 const ot=G.seats[o];if(!idx.length||ot.out)return 0;
 if(has(G,o,'peace')||(by!=null&&by!==o&&has(G,by,'peace'))){if(has(G,o,'peace'))addLog(G,`🕊️ ${ot.name}은(는) 평화 협정으로 잡히지 않습니다.`);return 0}
 const sh=idx.filter(k=>ot.pieces[k].sh>0);if(sh.length){idx.forEach(k=>ot.pieces[k].sh=0);addLog(G,`🫧 ${ot.name}의 보호막이 막았습니다.`);return 0}
 if(has(G,o,'friend')&&idx.length>1){idx=[idx[0]];addLog(G,`🤝 동료 방패: ${ot.name}의 말 1개만 잡힙니다.`)}
 if(by!=null&&by!==o&&G.seats[by].pieces.some((q,k)=>q.t==='peli'&&q.n===ot.pieces[idx[0]].n)&&G.turn===by){const pk=G.seats[by].pieces.findIndex(q=>q.t==='peli'&&q.n===ot.pieces[idx[0]].n);const pel=G.seats[by].pieces[pk];
  idx.forEach(k=>{const q=ot.pieces[k];q.n='H';q.prev=null;q.lock=1e9;q.sw=1;(pel.belly=pel.belly||[]).push([o,k])});fx(G,'kill',pel.n,idx.length);addLog(G,`🦤 ${G.seats[by].name}의 펠리컨이 ${ot.name}의 말 ${idx.length}개를 삼켰습니다!`);G.ev++;return idx.length}
 if(ot.pieces.some((q,k)=>idx.includes(k)&&q.t==='mon')){idx=idx.filter(k=>ot.pieces[k].t!=='mon');ot.monNeed=(ot.monNeed||12)+1;addLog(G,`👾 ${ot.name}의 괴물은 죽지 않습니다! 목표 +1 (${ot.monK||0}/${ot.monNeed})`);if(!idx.length){G.ev++;return 0}}
 const qn=idx.some(k=>ot.pieces[k].t==='queen'),cnode=ot.pieces[idx[0]].n;
 const zom=by!=null&&by!==o&&G.seats[by].pieces.some(q=>q.t==='zomb'&&q.n===ot.pieces[idx[0]].n);
 fx(G,'kill',ot.pieces[idx[0]].n,idx.length);idx.forEach(k=>sendHome(G,o,k));
 if(has(G,o,'ghost')&&by!=null&&by!==o&&!G.seats[by].out){const bs=G.seats[by],ks=bs.pieces.map((q,k)=>q.n===cnode?k:-1).filter(k=>k>=0&&bs.pieces[k].t!=='mon');if(ks.length){ks.forEach(k=>sendHome(G,by,k));addLog(G,`👻 ${ot.name}의 유령이 ${bs.name}의 말 ${ks.length}개를 끌고 갑니다!`)}}
 if(qn){const q=ot.pieces.find(x=>x.t==='queen');ot.qLife=(ot.qLife||1)-1;if(ot.qLife<=0){addLog(G,`👑 ${ot.name}의 중전마마가 잡혔습니다!`);eliminate(G,o,'👑 중전마마를 지키지 못했습니다.')}else{q.n='o10';q.prev=null;addLog(G,`👑 ${ot.name}의 중전마마가 잡혔지만 목숨이 남아 좌측 상단으로 돌아갑니다. (목숨 ${ot.qLife})`)}}
 if(by!=null&&by!==o&&has(G,by,'monster')&&!G.seats[by].out&&!G.seats[by].done){const ms=G.seats[by];ms.monK=(ms.monK||0)+idx.length;addLog(G,`👾 ${ms.name}의 괴물: ${ms.monK}/${ms.monNeed||12}`);if(ms.monK>=(ms.monNeed||12))win(G,by,'👾 괴물이 목표만큼 말을 잡았습니다!')}
 if(zom){idx.forEach(k=>{ot.pieces[k].t='zomb'});addLog(G,`🧟‍♂️ ${ot.name}의 말 ${idx.length}개가 좀비가 되었습니다!`);zombieCheck(G)}
 addLog(G,`${cause?cause+': ':''}${by!=null&&by!==o?G.seats[by].name+'이(가) ':''}${ot.name}의 말 ${idx.length}개를 잡았습니다.`);
 if(by!=null&&by!==o){G.bets=G.bets.filter(b=>{const bb=G.seats[b.by];if(b.who===by){bb.bankRes.push(mk('모','도박사'),mk('모','도박사'));addLog(G,`🃏 ${bb.name}의 도박 적중! 다음 턴에 모 2개.`)}else addLog(G,`🃏 ${bb.name}의 도박은 빗나갔습니다.`);return false});
  const bs=G.seats[by].st;bs.kills+=idx.length;
  if(ot.st.nfOn&&!ot.st.killedBy.includes(by)){ot.st.killedBy.push(by);if(alive(G).filter(x=>x!==o).every(x=>ot.st.killedBy.includes(x)))win(G,o,'🥲 나만 친구 없어: 모두에게 잡혔습니다!')}
  if(has(G,by,'coup')&&bs.coupBase>=0&&bs.kills-bs.coupBase>=4)win(G,by,'⚔️ 무신정변: 말 4개를 잡았습니다!')}
 if(G.hp&&by!=null&&by!==o&&has(G,by,'murder')&&!ot.out&&!ot.done){G.hp[o]=Math.max(0,G.hp[o]-idx.length);addLog(G,`🔪 ${ot.name} 체력 -${idx.length} (남은 체력 ${G.hp[o]})`);if(G.hp[o]<=0)eliminate(G,o,'🔪 체력이 0이 되었습니다.')}
 G.seats.forEach((x,i)=>{if(i===o||i===G.turn||x.out||!has(G,i,'bystander'))return;x.st.bys+=idx.length;while(x.st.bys>=2){x.st.bys-=2;x.bankRes.push(mk('개','어부지리'));addLog(G,`🎣 ${x.name}: 어부지리로 개를 얻었습니다.`)}});
 return idx.length}
function killAt(G,node,by,opt){opt=opt||{};let n=0;G.seats.forEach((st,o)=>{if(opt.exceptSeat===o)return;const idx=st.pieces.map((p,k)=>p.n===node?k:-1).filter(k=>k>=0);if(idx.length)n+=killStack(G,o,idx,by,opt.cause)});return n}

/* ---- 턴 ---- */
function beginTurn(G){{const cs=G.seats[G.turn];if(cs&&!cs.out&&!cs.done){const n=cs.pieces.filter(p=>p.t==='cult'&&onBoard(p)).length;if(n){cs.coin=(cs.coin||0)+n;addLog(G,`👹 ${cs.name}: 의식 코인 +${n} (${cs.coin}/12)`);if(cs.coin>=12){win(G,G.turn,'👹 마신 소환: 의식 코인 12개를 모았습니다!');if(G.phase==='over')return;G.phase='wait';return endTurn(G)}}}}G.hist=(G.hist||[]).slice(-15);G.hist.push(G.seats.map(x=>x.pieces.map(p=>p.n)));
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
 if(has(G,s,'modo'))return[rnd(G)<.45?'모':'도',''];
 if(has(G,s,'overflow')){let h=0;for(let i=0;i<6;i++)if(rnd(G)<.5)h++;return[['모','도','개','걸','윷','윷','탈락'][h],'과유불급',h]}
 if(st.sticks===3){const r=rnd(G)*8;return[r<1?'모':r<2?(has(G,s,'clover')?'도':'빽도'):r<4?'도':r<7?'개':'걸','']}
 const w=has(G,s,'clover')?[0,3,6,4,1,1]:[1,3,6,4,1,1];let r=rnd(G)*w.reduce((a,b)=>a+b),i=0;while(r>=w[i]){r-=w[i];i++}return[KINDS[i],'']}
function throwYut(G,s,choose){if(G.phase!=='throw'||s!==G.turn||G.throws<=0)return null;const st=G.seats[s];
 let k,tag;if(has(G,s,'dogae')&&!G.force[s]){k=choose==='개'?'개':choose==='도'?'도':(rnd(G)<.5?'도':'개');tag='도개'}else{const rk=rollKind(G,s);k=rk[0];tag=rk[1];var fl=rk[2]}
 if(k==='탈락'){G.throws--;G.lastThrow={k:'탈락',extra:0,id:Math.random(),s,sticks:6,fl:6};eliminate(G,s,'🎋 과유불급: 윷 6개가 모두 앞면!');G.ev++;if(G.phase!=='over'&&G.turn===s)endTurn(G);return{k:'탈락',v:0}}
 if(G.bluffArm===s){G.bluffArm=null;G.throws--;G.lastThrow={k:'?',extra:0,id:Math.random(),s,sticks:st.sticks,hide:1};addLog(G,`🤫 ${st.name}: 윷 결과를 숨겼습니다!`);
  G.vote={kind:'bluff',step:1,s,real:k,voters:[s],votes:{},ret:'throw'};G.phase='vote';G.ev++;return{k:'?',v:0}}
 G.throws--;let extra=0;if(k==='윷'||k==='모')extra++;G.throws+=extra;
 const res=mk(k,tag);G.results.push(res);G.turnRes.push(k);st.st.thrown[k]=1;if(k==='개')st.st.gae++;
 G.lastThrow={k,extra,id:Math.random(),s,sticks:st.sticks,fl};
 addLog(G,`${st.name}: ${k}${tag?' ('+tag+')':''}${extra?' · 한 번 더!':''}`);
 if(has(G,s,'queen')&&st.pieces.some(p=>p.t==='queen')){st.qThrows=(st.qThrows||0)+1;if(st.qThrows>=12){win(G,s,'👑 중전마마를 12번 던질 때까지 지켰습니다!');if(G.phase!=='over'&&G.turn===s)endTurn(G);return res}}
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
function anyMove(G,s){return G.results.some(r=>G.seats[s].pieces.some((p,pi)=>canUse(G,s,r,pi))||has(G,s,'chaos')&&G.seats.some((x,o)=>o!==s&&!x.out&&!x.done&&x.pieces.some((p,pi)=>onBoard(p)&&canUse(G,o,r,pi))))}
function toMove(G){G.phase='move';if(!anyMove(G,G.turn)){if(G.results.length)addLog(G,'쓸 수 있는 결과가 없어 넘어갑니다.');endTurn(G)}}
function moveLen(G,s,r){let v=r.v;if(v<0)return v;if(G.seats[s].pieces.some(p=>p.t==='van'&&onBoard(p)))v++;if(G.dance===s)v*=2;return v}
function preview(G,s,ri,pi){const r=G.results[ri];if(!r||!canUse(G,s,r,pi))return null;const p=G.seats[s].pieces[pi],g=groupOf(G,s,pi);
 let v=moveLen(G,s,r);if(p.n==='H'&&v>0&&has(G,s,'rabbit'))v++;let path=v<0?[backOf(p)]:walk(p.n,v);
 const fi=path.indexOf('FIN');if(fi>=0&&g.some(k=>G.seats[s].pieces[k].t==='queen'))return null;
 if(fi>=0&&g.some(k=>G.seats[s].pieces[k].t==='mon')){const left=v-fi;path=path.slice(0,fi).concat(left>0?walk('H',left):['o1'])}
 if(path.length&&path[path.length-1]==='H')return null;
 return{dest:path[path.length-1],path,g,back:v<0}}
function doMove(G,s,g,path,back){// 경로를 따라 이동하며 똥·자객 처리 후 도착 처리. 반환: 잡은 횟수
 const st=G.seats[s];let from=st.pieces[g[0]].n;
 for(let i=0;i<path.length;i++){const n=path[i];if(n==='FIN')break;const last=i===path.length-1;
  if(!back&&!last&&G.poop[n]!=null&&G.poop[n]!==s){path=path.slice(0,i+1);addLog(G,`💩 ${st.name}의 말이 똥을 밟고 멈췄습니다.`);break}
  if(!back&&!last){let as=null;G.seats.forEach((x,o)=>{if(o===s)return;x.pieces.forEach(q=>{if(q.n===n&&q.asn)as={o,q}})});
   if(as){as.q.asn=0;g.forEach(k=>{st.pieces[k].n=n});killStack(G,s,g.slice(),as.o,'🗡️ 자객');return 0}}}
 const dest=path[path.length-1],prevNode=path.length>=2?path[path.length-2]:from;
 if(G.combo&&from==='H'){st.cards=(st.cards||[]).concat([comboNum(G),comboNum(G)]);addLog(G,`🧮 ${st.name}: 새 말 출발! 숫자 카드 2장`)}
 if(G.combo&&dest!=='FIN')comboGet(G,s,dest);
 if(dest==='FIN'){g.forEach(k=>{st.pieces[k].n='F';st.pieces[k].prev=null;st.pieces[k].asn=0});finished(G,s,g);return 0}
 g.forEach(k=>{st.pieces[k].n=dest;st.pieces[k].prev=back?null:prevNode});
 return land(G,s,g,dest,back)}
function finished(G,s,g){const st=G.seats[s];if(has(G,s,'queen')&&st.pieces.some(p=>p.t==='queen')){st.qLife=(st.qLife||0)+g.length;addLog(G,`👑 ${st.name}: 중전마마 목숨 +${g.length} (${st.qLife})`)}g.forEach(k=>{const p=st.pieces[k];if(p.belly&&p.belly.length){const vs=[...new Set(p.belly.map(x=>x[0]))];p.belly=[];vs.forEach(o=>eliminate(G,o,`🦤 ${st.name}의 펠리컨에게 삼켜진 채로 골인했습니다.`))}});if(G.phase==='over')return;fx(G,'fin','o0',g.length);addLog(G,`🏠 ${st.name}의 말 ${g.length}개 골인!`);
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
 if(has(G,s,'star')&&dest!=='FIN'&&G.phase!=='over'){const here=st.pieces.map((q,k)=>q.n===dest&&!q.gone?k:-1).filter(k=>k>=0);if(here.length>1){const tot=here.reduce((a,k)=>a+(st.pieces[k].lv||1),0);
  here.forEach((k,i)=>{const q=st.pieces[k];if(i===0)q.lv=tot;else{q.n='F';q.gone=1;q.lv=0;q.prev=null}});addLog(G,`⭐ ${st.name}: 합체! ${tot}성`);if(tot>=8)win(G,s,'⭐ 8성을 만들었습니다!')}}
 boardWins(G);return caught}
function movePiece(G,s,ri,pi,o){if(G.phase!=='move'||s!==G.turn)return false;
 if(o!=null&&o!==s){const ot=G.seats[o];if(!has(G,s,'chaos')||!ot||ot.out||ot.done||!onBoard(ot.pieces[pi]||{}))return false;const pv=preview(G,o,ri,pi);if(!pv)return false;
  G.results.splice(ri,1);const t0=G.throws;addLog(G,`🌀 ${G.seats[s].name}이(가) ${ot.name}의 말을 움직입니다!`);doMove(G,o,pv.g,pv.path,pv.back);if(G.phase!=='over')G.throws=t0;
  G.ev++;afterAction(G,s);return true}
const pv=preview(G,s,ri,pi);if(!pv)return false;
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
 const st=G.seats[s];t=t||{};const others=alive(G).filter(o=>o!==s);let ok=true,endAfter=false;
 const ownOn=pi=>st.pieces[pi]&&onBoard(st.pieces[pi]);
 switch(id){
  case'dogs':G.results.push(mk('개','개 풀기'));break;
  case'loan':G.throws++;st.skip++;break;
  case'dober':{const n=Math.min(3,st.st.gae);if(!n){ok=false;break}for(let i=0;i<n;i++)G.results.push(mk('모','도베르만'));break}
  case'baduk':{if(!ownOn(t.a)||!ownOn(t.b))return false;const A1=st.pieces[t.a].n,B1=st.pieces[t.b].n;if(A1===B1)return false;
   const line=LINES.find(l=>l.includes(A1)&&l.includes(B1));if(!line)return false;let i=line.indexOf(A1),j=line.indexOf(B1);if(i>j)[i,j]=[j,i];
   let n=0;line.slice(i+1,j).forEach(nd=>{n+=killAt(G,nd,s,{exceptSeat:s,cause:'⚫ 바둑'})});G.throws+=n;break}
  case'swap':{const ot=G.seats[t.o];if(!ownOn(t.a)||t.o===s||!ot||ot.out||ot.done||!ot.pieces[t.b]||!onBoard(ot.pieces[t.b]))return false;
   const g1=groupOf(G,s,t.a),g2=groupOf(G,t.o,t.b),n1=st.pieces[t.a].n,n2=ot.pieces[t.b].n;if(n1===n2)return false;
   g1.forEach(k=>{st.pieces[k].n=n2;st.pieces[k].prev=null});g2.forEach(k=>{ot.pieces[k].n=n1;ot.pieces[k].prev=null});addLog(G,`🔀 ${st.name}와(과) ${ot.name}의 말이 자리를 바꿨습니다.`);break}
  case'magnet':{let n=0;others.forEach(o=>G.seats[o].pieces.forEach(p=>{if(onBoard(p)&&p.n!=='o0'){p.n=backOf(p);p.prev=null;n++}}));if(!n)return false;addLog(G,`🧲 ${st.name}: 상대 말 ${n}개를 1칸씩 끌어당겼습니다.`);break}
  case'tele':{if(!ownOn(t.pi))return false;const g=groupOf(G,s,t.pi);addLog(G,`✨ ${st.name}의 말이 순간이동!`);doMove(G,s,g,walk(st.pieces[t.pi].n,3),false);break}
  case'tornado':{const grp={};G.seats.forEach((x,o)=>{if(x.out)return;x.pieces.forEach((p,k)=>{if(onBoard(p)){const key=o+'|'+p.n;(grp[key]=grp[key]||[]).push([o,k])}})});
   const gs=Object.values(grp);if(gs.length<2)return false;const ns=gs.map(g=>G.seats[g[0][0]].pieces[g[0][1]].n);
   for(let i=ns.length-1;i>0;i--){const j=Math.floor(rnd(G)*(i+1));[ns[i],ns[j]]=[ns[j],ns[i]]}
   gs.forEach((g,i)=>g.forEach(([o,k])=>{const p=G.seats[o].pieces[k];p.n=ns[i];p.prev=null}));addLog(G,`🌪️ ${st.name}: 회오리! 말들의 자리가 뒤섞였습니다.`);break}
  case'ice':{const ot=G.seats[t.o];if(t.o===s||!ot||ot.out||ot.done)return false;ot.pieces.forEach(p=>{if(onBoard(p))p.lock=G.round+1});addLog(G,`🧊 ${ot.name}의 말이 얼어붙었습니다.`);break}
  case'gift':{let n=0;for(let i=0;i<3;i++){const k=freeNode(G);if(k){G.rewards[k]=1;n++}}if(!n)return false;addLog(G,`🎁 ${st.name}: 선물 상자 ${n}개를 놓았습니다.`);break}
  case'mirror':{const h=G.half?HALF[G.half]:null;const m=n=>{if(!POS[n])return n;const[x,y]=POS[n];const k=AT[Math.round(100-x)+','+Math.round(y)]||n;return h?nearKeep(h,k):k};
   G.seats.forEach(x=>x.pieces.forEach(p=>{if(onBoard(p)){p.n=m(p.n);p.prev=null}}));
   const mo=o=>{const r={};for(const k in o)r[m(k)]=o[k];return r};G.traps=mo(G.traps);G.rewards=mo(G.rewards);G.poop=mo(G.poop);G.fires=mo(G.fires);if(G.reaper)G.reaper.n=m(G.reaper.n);
   addLog(G,`🪞 ${st.name}: 거울 세계! 판이 좌우로 뒤집혔습니다.`);break}
  case'timemachine':{const back=alive(G).length;const H=G.hist||[];const snap=H[H.length-1-back];if(!snap)return false;const h=G.half?HALF[G.half]:null;
   G.seats.forEach((x,o)=>{if(x.out||x.done)return;x.pieces.forEach((p,k)=>{const n=snap[o]&&snap[o][k];if(!n||p.n==='F'||n==='F')return;p.n=n==='H'?'H':(h?nearKeep(h,n):n);p.prev=null})});
   addLog(G,`⏳ ${st.name}: 타임머신! 모든 말이 한 라운드 전으로 돌아갑니다.`);break}
  case'slot':{const sy=['🍒','🔔','7️⃣'],rl=[0,1,2].map(()=>Math.floor(rnd(G)*3)),txt=rl.map(i=>sy[i]).join('');
   const same=rl[0]===rl[1]&&rl[1]===rl[2],two=!same&&(rl[0]===rl[1]||rl[1]===rl[2]||rl[0]===rl[2]);
   if(same&&rl[0]===2){let k=-1,d=99;st.pieces.forEach((p,i)=>{if(onBoard(p)&&distFin(p.n)<d){d=distFin(p.n);k=i}});if(k<0)k=st.pieces.findIndex(p=>p.n==='H'&&p.t!=='pawn');
    addLog(G,`🎰 ${txt} 잭팟!!`);if(k>=0)doMove(G,s,groupOf(G,s,k),['FIN'],false)}
   else if(same){G.results.push(mk('모','슬롯'),mk('모','슬롯'));addLog(G,`🎰 ${txt} 모 2개!`)}
   else if(two){G.results.push(mk('개','슬롯'));addLog(G,`🎰 ${txt} 개 1개`)}
   else addLog(G,`🎰 ${txt} 꽝...`);break}
  case'clone':{if(!ownOn(t.pi))return false;const k=st.pieces.findIndex(p=>p.n==='H'&&!p.t);if(k<0)return false;st.pieces[k].n=st.pieces[t.pi].n;st.pieces[k].prev=st.pieces[t.pi].prev;addLog(G,`👥 ${st.name}: 분신술!`);break}
  case'lifeswap':{const ot=G.seats[t.o];if(t.o===s||!ot||ot.out||ot.done)return false;const A=st.pieces.filter(p=>p.n!=='F'),B=ot.pieces.filter(p=>p.n!=='F');
   const na=A.map(p=>p.n),nb=B.map(p=>p.n);A.forEach((p,i)=>{p.n=nb[i]||'H';p.prev=null});B.forEach((p,i)=>{p.n=na[i]||'H';p.prev=null});addLog(G,`🎭 ${st.name}와(과) ${ot.name}이(가) 인생을 바꿨습니다!`);break}
  case'flick':{if(G.phase!=='throw'||G.results.length||G.turnRes.length)return false;if(!ownOn(t.pi))return false;const pw=Math.max(1,Math.min(6,Math.round(+t.pw||1)));
   const from=st.pieces[t.pi].n;let L=null,d=0,i=0;for(const l of LINES){const j=l.indexOf(from);if(j<0)continue;if(l[j+1]===t.to){L=l;d=1;i=j;break}if(l[j-1]===t.to){L=l;d=-1;i=j;break}}if(!L)return false;
   const g=groupOf(G,s,t.pi),keep=G.half?HALF[G.half].keep:null;let j=i,stop=null,off=false;addLog(G,`🥌 ${st.name}: 알까기! (힘 ${pw})`);
   for(let k=0;k<pw;k++){j+=d;if(j<0||j>=L.length||keep&&!keep.has(L[j])){off=true;break}const n=L[j];let hit=false;G.seats.forEach((x,o)=>{if(o===s||x.out)return;const vs=x.pieces.map((q,qi)=>q.n===n?qi:-1).filter(qi=>qi>=0);if(vs.length){hit=true;killStack(G,o,vs,s,'🥌 알까기')}});stop=n;if(hit)break}
   if(off){g.forEach(k=>sendHome(G,s,k));addLog(G,`🥌 너무 세게 튕겨서 ${st.name}의 말이 판 밖으로 날아갔습니다!`)}else if(stop){g.forEach(k=>{st.pieces[k].n=stop;st.pieces[k].prev=null})}
   endAfter=true;break}
  case'pd':{const ps=[t.a,t.b];if(t.a===t.b||ps.some(o=>!G.seats[o]||G.seats[o].out||G.seats[o].done))return false;G.vote={kind:'pd',voters:ps,votes:{},ret:G.phase};G.phase='vote';
   addLog(G,`⛓️ 죄수의 딜레마: ${G.seats[t.a].name} vs ${G.seats[t.b].name} — 몰래 협력/배신을 고르세요!`);break}
  case'bluff':{if(G.phase!=='throw'||G.throws<=0||G.bluffArm===s)return false;G.bluffArm=s;break}
  case'zombie':{if(!ownOn(t.pi)||st.pieces[t.pi].t)return false;st.pieces[t.pi].t='zomb';addLog(G,`🧟‍♂️ ${st.name}의 말이 좀비가 되었습니다.`);break}
  case'cannon':{if(!ownOn(t.pi)||st.pieces[t.pi].t)return false;st.pieces[t.pi].t='po';addLog(G,`💣 ${st.name}의 말이 포가 되었습니다.`);break}
  case'spin':{const a=[90,180,270][Math.floor(rnd(G)*3)];const f=a===90?(x,y)=>[100-y,x]:a===180?(x,y)=>[100-x,100-y]:(x,y)=>[y,100-x];mapBoard(G,f);addLog(G,`🎡 ${st.name}: 돌림판이 ${a}° 돌았습니다!`);break}
  case'necro':{const ot=G.seats[t.o];if(!ot||!ot.out||t.o===s)return false;const i=G.ranks.indexOf(t.o);if(i>=0)G.ranks[i]=null;ot.out=false;ot.rank=0;ot.why='';ot.skip=0;
   if(G.hp)G.hp[t.o]=3;(G.bonds=G.bonds||[]).push({a:s,b:t.o});addLog(G,`🧟 ${st.name}: ${ot.name}을(를) 부활시켰습니다!`);break}
  case'pelican':{if(!ownOn(t.pi)||st.pieces[t.pi].t)return false;st.pieces[t.pi].t='peli';addLog(G,`🦤 ${st.name}의 말이 펠리컨으로 변했습니다.`);break}
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
 if(endAfter){if(G.phase!=='over'){G.throws=0;G.results=[];endTurn(G)}return true}
 if(G.phase==='vote'){}else if(G.phase==='move'&&G.throws>0)G.phase='throw';
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
 if(G.phase==='vote'){const V=G.vote;if(V&&V.voters.includes(s)&&V.votes[s]==null)return castVote(G,s,aiVote(G,s));return false}
 if(G.phase==='pick'){const st=G.seats[s];if(st.offers)return pickAug(G,s,aiPick(G,s));return false}
 if(s!==G.turn)return false;const st=G.seats[s];
 if(G.phase==='throw'&&st.ai&&G.combo&&(st.cards||[]).length>=3){const sq=aiFormula(st.cards,G.combo.target);if(sq)return comboSubmit(G,s,sq)}
 if(G.phase==='throw'){const u=st.ai?aiActive(G,s):null;if(u&&useAug(G,s,u.id,u.t))return true;return!!throwYut(G,s,rnd(G)<.6?'개':'도')}
 if(G.phase==='move'){const u=st.ai?aiActive(G,s):null;if(u&&u.id==='dogs'&&useAug(G,s,'dogs'))return true;const m=aiMove(G,s);if(m)return movePiece(G,s,m.ri,m.pi);endTurn(G);G.ev++;return true}
 return false}
function apply(G,s,a){if(!a||G.phase==='over')return false;
 if(a.t==='pick')return pickAug(G,s,a.id);
 if(a.t==='throw')return!!throwYut(G,s,a.k);
 if(a.t==='move')return movePiece(G,s,a.ri,a.pi,a.o);
 if(a.t==='use')return useAug(G,s,a.id,a.x);
 if(a.t==='vote')return castVote(G,s,a.v);
 if(a.t==='formula')return comboSubmit(G,s,a.seq);
 if(a.t==='po')return poMove(G,s,a.pi,a.n);
 return false}
const API0={HALF,FOLDS,foldNode,CATS,isCat,PIECES,PICK_ROUNDS,COLORS,CNAMES,POS,NODES,LINES,AUGS,AUG,TYPEICON,KINDS,FLATS,BYFLATS,step,walk,backOf,distFin,newGame,pickAug,poTargets,comboEval,throwYut,movePiece,useAug,usesLeft,preview,canUse,groupOf,apply,autoStep,endTurn,has,catForced,onBoard};
const API={};for(const k in API0){const f=API0[k];API[k]=typeof f==='function'?function(G){if(G&&G.seats)FG=G;return f.apply(null,arguments)}:f}
API.setGame=G=>{FG=G};
if(typeof module!=='undefined')module.exports=API;else root.YUT=API;
})(this);
