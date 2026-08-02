"use strict";

const SUPABASE_URL="https://hjezefwwradgurpbkcfr.supabase.co";
const SUPABASE_KEY="sb_publishable_Q7XxTFNOO0OTzpgodFmtjQ_4ga7p0MU";
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);

const playerId=crypto.randomUUID();
let roomCode="",playerName="Derp",channel=null,connected=false;
let scene,camera,renderer,clock,raycaster,mouse,ground,localPlayer;
let yaw=Math.PI,pitch=-0.45,camDistance=7,dragging=false,lastPointer={x:0,y:0};
const keys={},velocity=new THREE.Vector3(),blocks=new Map(),remotePlayers=new Map();
const playerHalf=new THREE.Vector3(.38,.9,.38),PLAYER_HEIGHT=1.8;
let grounded=false,lastBroadcast=0;

const normalizeCode=v=>v.trim().replace(/\s+/g,"-").slice(0,24)||"room";
const safeName=v=>v.trim().slice(0,20)||"Derp";

async function joinRoom(){
  roomCode=normalizeCode($("codeInput").value);
  playerName=safeName($("nameInput").value);
  $("joinStatus").textContent="Joining...";

  const {error:roomError}=await sb.from("daderp_rooms").upsert({code:roomCode});
  if(roomError){$("joinStatus").textContent="Run SUPABASE_SETUP.sql first.";return}

  channel=sb.channel(`daderp:${roomCode}`,{config:{presence:{key:playerId}}});
  channel
    .on("presence",{event:"sync"},handlePresence)
    .on("broadcast",{event:"move"},({payload})=>updateRemote(payload))
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"daderp_blocks",filter:`room_code=eq.${roomCode}`},p=>addBlock(p.new))
    .on("postgres_changes",{event:"DELETE",schema:"public",table:"daderp_blocks"},p=>removeBlock(p.old.id))
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"daderp_messages",filter:`room_code=eq.${roomCode}`},p=>appendMessage(p.new));

  const ok=await new Promise(resolve=>{
    channel.subscribe(async status=>{
      if(status==="SUBSCRIBED"){await channel.track({id:playerId,name:playerName,joined_at:Date.now()});resolve(true)}
      if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")resolve(false);
    });
  });
  if(!ok){$("joinStatus").textContent="Could not connect.";return}

  await new Promise(r=>setTimeout(r,250));
  if(activePresenceCount()>10){
    await channel.untrack();await sb.removeChannel(channel);channel=null;
    $("joinStatus").textContent="That room already has 10 players.";return;
  }

  const [{data:blockRows,error:blockError},{data:messages}]=await Promise.all([
    sb.from("daderp_blocks").select("*").eq("room_code",roomCode),
    sb.from("daderp_messages").select("*").eq("room_code",roomCode).order("created_at",{ascending:true}).limit(60)
  ]);
  if(blockError){$("joinStatus").textContent="Database is not ready.";return}

  init3D();
  (blockRows||[]).forEach(addBlock);
  (messages||[]).forEach(appendMessage);
  connected=true;
  $("joinScreen").classList.add("hidden");$("gameUI").classList.remove("hidden");
  $("roomLabel").textContent=`Room: ${roomCode}`;
  handlePresence();
  animate();
}

function activePresenceCount(){return channel?Object.values(channel.presenceState()).flat().length:0}
function handlePresence(){
  if(!channel)return;
  const all=Object.values(channel.presenceState()).flat();
  $("playerCount").textContent=`${all.length}/10 players`;
  const seen=new Set();
  for(const p of all){
    if(!p.id||p.id===playerId)continue;
    seen.add(p.id);
    if(!remotePlayers.has(p.id)){
      const av=makeAvatar(0xff9f43);av.userData.name=p.name||"Derp";scene?.add(av);remotePlayers.set(p.id,av);
    }
  }
  for(const [id,obj] of remotePlayers)if(!seen.has(id)){scene?.remove(obj);remotePlayers.delete(id)}
}

function init3D(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x90c8ff);scene.fog=new THREE.Fog(0x90c8ff,35,100);
  camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,250);
  renderer=new THREE.WebGLRenderer({canvas:$("game"),antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight,false);renderer.shadowMap.enabled=true;
  clock=new THREE.Clock();raycaster=new THREE.Raycaster();mouse=new THREE.Vector2();

  scene.add(new THREE.HemisphereLight(0xffffff,0x52606d,2.1));
  const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(8,16,7);sun.castShadow=true;scene.add(sun);
  scene.add(new THREE.GridHelper(120,120,0x26485e,0x6ba7c8));
  ground=new THREE.Mesh(new THREE.BoxGeometry(120,.2,120),new THREE.MeshStandardMaterial({color:0x36515d,roughness:1}));
  ground.position.y=-.1;ground.receiveShadow=true;ground.userData.isGround=true;scene.add(ground);

  localPlayer=makeAvatar(0x42d3ff);localPlayer.position.set(0,PLAYER_HEIGHT/2,0);scene.add(localPlayer);

  $("game").addEventListener("pointerdown",onPointerDown);
  addEventListener("pointermove",onPointerMove);addEventListener("pointerup",()=>dragging=false);
  $("game").addEventListener("contextmenu",e=>e.preventDefault());
  $("game").addEventListener("wheel",e=>{camDistance=THREE.MathUtils.clamp(camDistance+Math.sign(e.deltaY)*.7,3,18)},{passive:true});
  addEventListener("resize",onResize);
}
function makeAvatar(color){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(.75,1.15,.55),new THREE.MeshStandardMaterial({color}));
  body.position.y=-.12;body.castShadow=true;
  const head=new THREE.Mesh(new THREE.SphereGeometry(.38,16,12),new THREE.MeshStandardMaterial({color:0xffdfbf}));
  head.position.y=.72;head.castShadow=true;g.add(body,head);g.userData.isPlayer=true;return g;
}
function onResize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)}

function onPointerDown(e){
  if(e.target!==$("game"))return;
  if(e.button===1||(e.button===0&&e.shiftKey)){dragging=true;lastPointer={x:e.clientX,y:e.clientY};return}
  if(e.button===0)placeFromPointer(e);
  if(e.button===2)deleteFromPointer(e);
}
function onPointerMove(e){
  if(!dragging)return;
  yaw-=(e.clientX-lastPointer.x)*.006;pitch-=(e.clientY-lastPointer.y)*.005;
  pitch=THREE.MathUtils.clamp(pitch,-1.15,.25);lastPointer={x:e.clientX,y:e.clientY};
}
function pointerRay(e){
  const r=renderer.domElement.getBoundingClientRect();
  mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(mouse,camera);
}
function buildTargets(){return [ground,...[...blocks.values()].map(v=>v.mesh)]}

async function placeFromPointer(e){
  pointerRay(e);
  const hit=raycaster.intersectObjects(buildTargets(),false)[0];if(!hit)return;
  const size=Number($("blockSize").value)||1,p=hit.point.clone();
  if(hit.object.userData.blockId){
    const n=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    p.addScaledVector(n,size/2+.02);
  }else p.y=size/2;
  p.x=Math.round(p.x);p.z=Math.round(p.z);p.y=Math.max(size/2,Math.round(p.y-size/2)+size/2);
  if(intersectsAnyPlayer(p,size)){flashStatus("Can't place a block on a player.");return}
  const row={room_code:roomCode,owner_id:playerId,owner_name:playerName,x:p.x,y:p.y,z:p.z,size,color:$("blockColor").value,collide_self:$("collideSelf").checked,collide_others:$("collideOthers").checked};
  const {error}=await sb.from("daderp_blocks").insert(row);if(error)flashStatus(error.message);
}
function intersectsAnyPlayer(pos,size){
  const b=new THREE.Box3(new THREE.Vector3(pos.x-size/2,pos.y-size/2,pos.z-size/2),new THREE.Vector3(pos.x+size/2,pos.y+size/2,pos.z+size/2));
  return [localPlayer,...remotePlayers.values()].filter(Boolean).some(pl=>{
    const p=pl.position;
    const pb=new THREE.Box3(new THREE.Vector3(p.x-playerHalf.x,p.y-PLAYER_HEIGHT/2,p.z-playerHalf.z),new THREE.Vector3(p.x+playerHalf.x,p.y+PLAYER_HEIGHT/2,p.z+playerHalf.z));
    return b.intersectsBox(pb);
  });
}
async function deleteFromPointer(e){
  pointerRay(e);const hit=raycaster.intersectObjects([...blocks.values()].map(v=>v.mesh),false)[0];if(!hit)return;
  const d=blocks.get(hit.object.userData.blockId)?.data;
  if(!d||d.owner_id!==playerId){flashStatus("You can only remove blocks you placed.");return}
  await sb.from("daderp_blocks").delete().eq("id",d.id).eq("owner_id",playerId);
}

function addBlock(data){
  if(!scene||blocks.has(data.id))return;
  const s=Number(data.size)||1;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),new THREE.MeshStandardMaterial({color:data.color||"#38bdf8",roughness:.75}));
  mesh.position.set(data.x,data.y,data.z);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.blockId=data.id;
  scene.add(mesh);blocks.set(data.id,{mesh,data});
}
function removeBlock(id){
  const b=blocks.get(id);if(!b)return;
  scene?.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();blocks.delete(id);
}
function shouldCollide(data){return data.owner_id===playerId?data.collide_self:data.collide_others}
function playerBoxAt(p){return new THREE.Box3(new THREE.Vector3(p.x-playerHalf.x,p.y-PLAYER_HEIGHT/2,p.z-playerHalf.z),new THREE.Vector3(p.x+playerHalf.x,p.y+PLAYER_HEIGHT/2,p.z+playerHalf.z))}
function blockBox(d){const s=Number(d.size)||1;return new THREE.Box3(new THREE.Vector3(d.x-s/2,d.y-s/2,d.z-s/2),new THREE.Vector3(d.x+s/2,d.y+s/2,d.z+s/2))}
function collidesAt(pos){
  if(pos.y-PLAYER_HEIGHT/2<0)return true;
  const pb=playerBoxAt(pos);
  for(const {data} of blocks.values())if(shouldCollide(data)&&pb.intersectsBox(blockBox(data)))return true;
  return false;
}

function updateLocal(dt){
  const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),right=new THREE.Vector3(forward.z,0,-forward.x),wish=new THREE.Vector3();
  if(keys.w)wish.add(forward);if(keys.s)wish.sub(forward);if(keys.d)wish.add(right);if(keys.a)wish.sub(right);if(wish.lengthSq())wish.normalize();
  const speed=5,next=localPlayer.position.clone();
  next.x+=wish.x*speed*dt;if(!collidesAt(next))localPlayer.position.x=next.x;
  next.copy(localPlayer.position);next.z+=wish.z*speed*dt;if(!collidesAt(next))localPlayer.position.z=next.z;
  velocity.y-=18*dt;if(keys[" "]&&grounded){velocity.y=7;grounded=false}
  next.copy(localPlayer.position);next.y+=velocity.y*dt;
  if(collidesAt(next)){if(velocity.y<=0)grounded=true;velocity.y=0}else{localPlayer.position.y=next.y;grounded=false}
  if(localPlayer.position.y<PLAYER_HEIGHT/2){localPlayer.position.y=PLAYER_HEIGHT/2;velocity.y=0;grounded=true}
}
function broadcastMovement(now){
  if(!channel||now-lastBroadcast<70)return;lastBroadcast=now;
  channel.send({type:"broadcast",event:"move",payload:{id:playerId,name:playerName,x:localPlayer.position.x,y:localPlayer.position.y,z:localPlayer.position.z}});
}
function updateRemote(p){
  if(!p||p.id===playerId||!scene)return;
  let obj=remotePlayers.get(p.id);if(!obj){obj=makeAvatar(0xff9f43);scene.add(obj);remotePlayers.set(p.id,obj)}
  obj.position.set(Number(p.x)||0,Number(p.y)||PLAYER_HEIGHT/2,Number(p.z)||0);
}
function updateCamera(){
  const target=localPlayer.position.clone().add(new THREE.Vector3(0,.55,0)),cp=Math.cos(pitch);
  const off=new THREE.Vector3(Math.sin(yaw)*cp*camDistance,Math.sin(pitch)*camDistance,Math.cos(yaw)*cp*camDistance);
  camera.position.copy(target).sub(off);camera.lookAt(target);
}
function animate(now=performance.now()){
  if(!connected)return;requestAnimationFrame(animate);
  const dt=Math.min(.033,clock.getDelta());updateLocal(dt);updateCamera();broadcastMovement(now);renderer.render(scene,camera);
}

async function sendMessage(){
  const body=$("chatInput").value.trim();if(!body||!connected)return;$("chatInput").value="";
  await sb.from("daderp_messages").insert({room_code:roomCode,player_id:playerId,player_name:playerName,body});
}
function appendMessage(m){
  if(!m||m.room_code!==roomCode)return;
  const div=document.createElement("div");div.className="message";
  const who=document.createElement("span");who.className="who";who.textContent=(m.player_name||"Derp")+": ";
  div.append(who,document.createTextNode(m.body||""));$("messages").appendChild(div);$("messages").scrollTop=$("messages").scrollHeight;
}
function flashStatus(msg){$("roomLabel").textContent=msg;setTimeout(()=>{if(connected)$("roomLabel").textContent=`Room: ${roomCode}`},1800)}
async function leave(){connected=false;if(channel){try{await channel.untrack();await sb.removeChannel(channel)}catch{}}location.reload()}

$("joinBtn").onclick=joinRoom;
$("codeInput").addEventListener("keydown",e=>{if(e.key==="Enter")joinRoom()});
$("nameInput").addEventListener("keydown",e=>{if(e.key==="Enter")joinRoom()});
$("sendBtn").onclick=sendMessage;
$("chatInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();sendMessage()}e.stopPropagation()});
$("chatInput").addEventListener("keyup",e=>e.stopPropagation());
$("leaveBtn").onclick=leave;
addEventListener("keydown",e=>{if(document.activeElement&&["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName))return;keys[e.key.toLowerCase()]=true});
addEventListener("keyup",e=>{if(document.activeElement&&["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName))return;keys[e.key.toLowerCase()]=false});
window.addEventListener("beforeunload",()=>{if(channel)channel.untrack()});
