// 공개 방 목록을 Firebase(랭킹과 같은 저장소)로 옮깁니다.
// 페이지들은 예전처럼 ntfy 주소로 fetch를 부르고, 여기서 그 요청을 Firebase로 바꿔 줍니다.
// Firebase 규칙에 rooms가 없거나 실패하면 예전 ntfy로 그대로 보냅니다. (ntfy는 같은 와이파이에서 요청이 많으면 막혀서 10초에 한 번만)
(function(){const F0=window.fetch.bind(window),ROOMT='https://ntfy.sh/pomok-rooms-b6e19d42a7c3';
 const FB=()=>(window.POMOK_FB||'').replace(/\/+$/,'');let fbOk=true,lastNtfy=0,ntfyCache='';
 const key=(g,c)=>encodeURIComponent(g+'_'+c);
 window.fetch=async function(url,opt){
  if(typeof url!=='string'||!url.startsWith(ROOMT))return F0(url,opt);
  const fb=FB();
  if(url===ROOMT&&opt&&opt.method==='POST'){let m={};try{m=JSON.parse(opt.body)}catch(e){}
   if(fb&&fbOk&&m.g&&m.c){try{const r=m.t==='close'?await F0(`${fb}/rooms/${key(m.g,m.c)}.json`,{method:'DELETE'}):await F0(`${fb}/rooms/${key(m.g,m.c)}.json`,{method:'PUT',body:JSON.stringify({g:m.g,c:m.c,n:String(m.n||'').slice(0,12),p:m.p|0,t:Date.now()})});
     if(r.ok)return new Response('{}');fbOk=false}catch(e){}}
   return F0(url,opt)}
  if(url.startsWith(ROOMT+'/json')){
   if(fb&&fbOk){try{const r=await F0(`${fb}/rooms.json`);if(r.ok){const all=await r.json()||{},now=Date.now(),lines=[];
     for(const k in all){const v=all[k];if(!v||typeof v.t!=='number')continue;if(now-v.t>3600e3){F0(`${fb}/rooms/${encodeURIComponent(k)}.json`,{method:'DELETE'}).catch(()=>{});continue}
      lines.push(JSON.stringify({id:k,time:Math.floor(v.t/1000),event:'message',message:JSON.stringify({v:1,t:'open',g:v.g,c:v.c,n:v.n,p:v.p})}))}
     return new Response(lines.join('\n'))}fbOk=false}catch(e){}}
   if(document.hidden||Date.now()-lastNtfy<10000)return new Response(ntfyCache);
   lastNtfy=Date.now();const r=await F0(url,opt);if(r.ok){ntfyCache=await r.text();return new Response(ntfyCache)}return r}
  return F0(url,opt)}})();
