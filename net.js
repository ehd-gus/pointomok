// 온라인 연결 보강: STUN·TURN 서버를 여러 개 쓰고, 신호 서버와 끊기면 자동으로 다시 붙습니다.
(function(){const P0=window.Peer;if(!P0)return;
 const ICE=[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'},
  {urls:['turn:eu-0.turn.peerjs.com:3478','turn:us-0.turn.peerjs.com:3478'],username:'peerjs',credential:'peerjsp'}];
 function Peer(id,opt){if(id&&typeof id==='object'){opt=id;id=undefined}
  opt=Object.assign({debug:0,pingInterval:4000,config:{iceServers:ICE,sdpSemantics:'unified-plan'}},opt||{});
  const p=id!==undefined?new P0(id,opt):new P0(opt);let tries=0;
  p.on('disconnected',()=>{const again=()=>{if(p.destroyed||!p.disconnected||tries>20)return;tries++;try{p.reconnect()}catch(e){}setTimeout(again,3000)};setTimeout(again,800)});
  p.on('open',()=>{tries=0});
  const oc=p.connect.bind(p);p.connect=(rid,o)=>oc(rid,Object.assign({reliable:true},o||{}));
  return p}
 Peer.prototype=P0.prototype;window.Peer=Peer})();
