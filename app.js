"use strict";

const SUPABASE_URL="https://hjezefwwradgurpbkcfr.supabase.co";
const SUPABASE_KEY="sb_publishable_Q7XxTFNOO0OTzpgodFmtjQ_4ga7p0MU";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{realtime:{params:{eventsPerSecond:20}}});
const $=id=>document.getElementById(id);

const playerId=crypto.randomUUID();
let roomCode="",playerName="Derp",channel=null,connected=false;
let scene,camera,renderer,clock,raycaster,mouse,ground,localPlayer;
let yaw=0,pitch=.32,camDistance=7,orbiting=false,lastPointer={x:0,y:0};
const keys={},velocity=new THREE.Vector3(),blocks=new Map(),remotePlayers=new Map();
const playerRadius=.48,PLAYER_HEIGHT=.96;
let grounded=false,lastBroadcast=0,mode="move",selectedId=null,draggingBlock=false,dragPlane=null,dragOffset=new THREE.Vector3();

function bootCheck(){
  const status=$("joinStatus");
  if(!window.THREE){status.textContent="Three.js did not load.";status.style.color="#ff9a9a";return false}
  if(!window.supabase){status.textContent="Supabase library did not load.";status.style.color="#ff9a9a";return false}
  status.textContent="Ready.";return true;
}
const normalizeCode=v=>v.trim().replace(/\s+/g,"-").slice(0,24)||"room";
const safeName=v=>v.trim().slice(0,20)||"Derp";
function setJoinStatus(msg,bad=false){$("joinStatus").textContent=msg;$("joinStatus").style.color=bad?"#ff9a9a":"#bbb"}

async function joinRoom(){
  if(channel)return;
  if(!$("codeInput").value.trim()){setJoinStatus("Enter a room code.",true);return}
  roomCode=normalizeCode($("codeInput").value);playerName=safeName($("nameInput").value);
  setJoinStatus("Connecting...");
  try{
    channel=sb.channel(`daderpg:${roomCode}`,{config:{presence:{key:playerId},broadcast:{self:true,ack:false}}});
    channel
      .on("presence",{event:"sync"},handlePresence)
      .on("broadcast",{event:"move"},({payload})=>updateRemote(payload))
      .on("broadcast",{event:"block_add"},({payload})=>addBlock(payload))
      .on("broadcast",{event:"block_remove"},({payload})=>removeBlock(payload?.id))
      .on("broadcast",{event:"block_update"},({payload})=>updateBlock(payload))
      .on("broadcast",{event:"chat"},({payload})=>appendMessage(payload))
      .on("broadcast",{event:"state_request"},({payload})=>{
        if(!payload?.requester||payload.requester===playerId)return;
        const mine=[...blocks.values()].filter(v=>v.data.owner_id===playerId).map(v=>v.data);
        channel.send({type:"broadcast",event:"state_response",payload:{to:payload.requester,blocks:mine}});
      })
      .on("broadcast",{event:"state_response"},({payload})=>{
        if(payload?.to!==playerId)return;(payload.blocks||[]).forEach(addBlock);
      });

    const status=await new Promise(resolve=>{
      let done=false;
      const timer=setTimeout(()=>{if(!done){done=true;resolve("TIMEOUT")}},10000);
      channel.subscribe(async s=>{
        if(done)return;
        if(s==="SUBSCRIBED"){
          done=true;clearTimeout(timer);
          try{await channel.track({id:playerId,name:playerName,joined_at:Date.now()})}catch{}
          resolve("SUBSCRIBED");
        }else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT"){
          done=true;clearTimeout(timer);resolve(s);
        }
      });
    });
    if(status!=="SUBSCRIBED"){setJoinStatus(`Connection failed: ${status}`,true);try{await sb.removeChannel(channel)}catch{}channel=null;return}
    await new Promise(r=>setTimeout(r,250));
    if(activePresenceCount()>10){setJoinStatus("That room already has 10 players.",true);try{await channel.untrack();await sb.removeChannel(channel)}catch{}channel=null;return}

    init3D();connected=true;$("joinScreen").classList.add("hidden");$("gameUI").classList.remove("hidden");
    $("roomLabel").textContent=`Room: ${roomCode}`;handlePresence();
    channel.send({type:"broadcast",event:"state_request",payload:{requester:playerId}});
    animate();
  }catch(err){console.error(err);setJoinStatus(`Join failed: ${err?.message||err}`,true);channel=null}
}

function activePresenceCount(){try{return Object.values(channel?.presenceState?.()||{}).flat().length}catch{return 0}}
function handlePresence(){
  if(!channel)return;
  const all=Object.values(channel.presenceState()).flat();
  if($("playerCount"))$("playerCount").textContent=`${all.length}/10 players`;
  if(!scene)return;
  const seen=new Set();
  for(const p of all){
    if(!p.id||p.id===playerId)continue;seen.add(p.id);
    if(!remotePlayers.has(p.id)){const av=makeAvatar(0xe58b45);scene.add(av);remotePlayers.set(p.id,av)}
  }
  for(const [id,obj] of remotePlayers)if(!seen.has(id)){scene.remove(obj);remotePlayers.delete(id)}
}

function init3D(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0xa7c9dd);
  camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,250);
  renderer=new THREE.WebGLRenderer({canvas:$("game"),antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight,false);
  clock=new THREE.Clock();raycaster=new THREE.Raycaster();mouse=new THREE.Vector2();
  scene.add(new THREE.HemisphereLight(0xffffff,0x66717a,2));
  const sun=new THREE.DirectionalLight(0xffffff,1.7);sun.position.set(8,16,7);scene.add(sun);
  scene.add(new THREE.GridHelper(120,120,0x444444,0x777777));
  ground=new THREE.Mesh(new THREE.BoxGeometry(120,.2,120),new THREE.MeshStandardMaterial({color:0x6f7f78,roughness:1}));
  ground.position.y=-.1;ground.userData.isGround=true;scene.add(ground);
  localPlayer=makeAvatar(0x3a9bdc);localPlayer.position.set(0,playerRadius,0);scene.add(localPlayer);

  const canvas=$("game");
  canvas.addEventListener("pointerdown",onPointerDown);
  addEventListener("pointermove",onPointerMove);
  addEventListener("pointerup",onPointerUp);
  canvas.addEventListener("contextmenu",e=>e.preventDefault());
  canvas.addEventListener("wheel",e=>{camDistance=THREE.MathUtils.clamp(camDistance+Math.sign(e.deltaY)*.7,3,18)},{passive:true});
  addEventListener("resize",onResize);
}
function makeAvatar(color){
  const g=new THREE.Group();
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(playerRadius,24,16),new THREE.MeshStandardMaterial({color,roughness:.7}));
  g.add(sphere);g.userData.isPlayer=true;return g;
}
function onResize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)}

function pointerRay(e){
  const r=renderer.domElement.getBoundingClientRect();
  mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(mouse,camera);
}
function onPointerDown(e){
  if(e.target!==$("game"))return;
  pointerRay(e);
  if(e.button===2){
    orbiting=true;lastPointer={x:e.clientX,y:e.clientY};return;
  }
  if(e.button!==0)return;

  if(mode==="place"){placeFromPointer(e);return}
  if(mode==="move"){
    const hit=pickBlock(true);
    if(hit){
      selectBlock(hit.object.userData.blockId);
      const b=blocks.get(selectedId);
      if(b?.data.physics){
        draggingBlock=true;
        dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-b.mesh.position.y);
        const p=new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane,p);
        dragOffset.copy(b.mesh.position).sub(p);
      }
    }else selectBlock(null);
    return;
  }
  if(mode==="scale"){
    const hit=pickBlock(false);
    selectBlock(hit?.object.userData.blockId||null);
  }
}
function onPointerMove(e){
  if(orbiting){
    const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;
    yaw+=dx*.006;
    pitch-=dy*.005;
    pitch=THREE.MathUtils.clamp(pitch,-.15,1.35);
    lastPointer={x:e.clientX,y:e.clientY};
    return;
  }
  if(draggingBlock&&selectedId){
    pointerRay(e);
    const p=new THREE.Vector3();
    if(raycaster.ray.intersectPlane(dragPlane,p)){
      p.add(dragOffset);
      const b=blocks.get(selectedId);
      if(!b)return;
      const step=.5;
      p.x=Math.round(p.x/step)*step;p.z=Math.round(p.z/step)*step;
      const s=b.data.size||1;p.y=Math.max(s/2,p.y);
      b.mesh.position.copy(p);
      b.data.x=p.x;b.data.y=p.y;b.data.z=p.z;
      b.data.vx=0;b.data.vy=0;b.data.vz=0;
    }
  }
}
function onPointerUp(){
  if(draggingBlock&&selectedId)broadcastBlockUpdate(selectedId);
  orbiting=false;draggingBlock=false;
}
function pickBlock(physicsOnly=false){
  const list=[...blocks.values()].filter(v=>!physicsOnly||v.data.physics).map(v=>v.mesh);
  return raycaster.intersectObjects(list,false)[0];
}

function snap(v,step=.5){return Math.round(v/step)*step}
function placeFromPointer(e){
  pointerRay(e);
  const targets=[ground,...[...blocks.values()].map(v=>v.mesh)];
  const hit=raycaster.intersectObjects(targets,false)[0];if(!hit)return;

  const size=Number($("blockSize").value)||1;
  const p=hit.point.clone();
  if(hit.object.userData.blockId){
    const other=blocks.get(hit.object.userData.blockId)?.data;
    const otherSize=Number(other?.size)||1;
    const n=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    p.copy(hit.object.position).addScaledVector(n,(otherSize+size)/2);
  }else p.set(hit.point.x,size/2,hit.point.z);

  p.x=snap(p.x);p.z=snap(p.z);p.y=Math.max(size/2,snap(p.y));
  if(intersectsAnyPlayer(p,size)){flashStatus("Can't place on a player.");return}

  const physics=$("blockType").value==="physics";
  const data={
    id:crypto.randomUUID(),owner_id:playerId,owner_name:playerName,
    x:p.x,y:p.y,z:p.z,size,
    color:$("blockColor").value,
    collide_self:$("collideSelf").checked,collide_others:$("collideOthers").checked,
    physics,shape:physics?$("physicsShape").value:"cube",
    bounce:Number($("physicsBounce").value)||0,
    weight:Math.max(.1,Number($("physicsWeight").value)||1),
    sliding:Number($("physicsSliding").value)||0,
    rotX:Number($("rotX").value)||0,rotY:Number($("rotY").value)||0,rotZ:Number($("rotZ").value)||0,
    vx:0,vy:0,vz:0
  };
  addBlock(data);
  channel?.send({type:"broadcast",event:"block_add",payload:data});
}
function intersectsAnyPlayer(pos,size){
  const b=new THREE.Box3(new THREE.Vector3(pos.x-size/2,pos.y-size/2,pos.z-size/2),new THREE.Vector3(pos.x+size/2,pos.y+size/2,pos.z+size/2));
  return [localPlayer,...remotePlayers.values()].filter(Boolean).some(pl=>{
    const p=pl.position;
    const pb=new THREE.Box3(new THREE.Vector3(p.x-playerRadius,p.y-playerRadius,p.z-playerRadius),new THREE.Vector3(p.x+playerRadius,p.y+playerRadius,p.z+playerRadius));
    return b.intersectsBox(pb);
  });
}

function addBlock(data){
  if(!scene||!data?.id||blocks.has(data.id))return;
  const s=Number(data.size)||1;
  const geo=data.shape==="sphere"?new THREE.SphereGeometry(s/2,20,14):new THREE.BoxGeometry(s,s,s);
  const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:data.color||"#3a9bdc",roughness:.75}));
  mesh.position.set(Number(data.x)||0,Number(data.y)||s/2,Number(data.z)||0);
  mesh.rotation.set(THREE.MathUtils.degToRad(data.rotX||0),THREE.MathUtils.degToRad(data.rotY||0),THREE.MathUtils.degToRad(data.rotZ||0));
  mesh.userData.blockId=data.id;scene.add(mesh);blocks.set(data.id,{mesh,data});
}
function updateBlock(data){
  if(!data?.id)return;
  let b=blocks.get(data.id);
  if(!b){addBlock(data);return}
  const shapeChanged=b.data.shape!==data.shape;
  b.data={...b.data,...data};
  if(shapeChanged){
    scene.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();blocks.delete(data.id);addBlock(b.data);return;
  }
  b.mesh.position.set(data.x,data.y,data.z);
  b.mesh.scale.setScalar(Number(data.scale)||1);
  b.mesh.rotation.set(THREE.MathUtils.degToRad(data.rotX||0),THREE.MathUtils.degToRad(data.rotY||0),THREE.MathUtils.degToRad(data.rotZ||0));
  b.mesh.material.color.set(data.color||"#3a9bdc");
}
function broadcastBlockUpdate(id){
  const b=blocks.get(id);if(!b)return;
  b.data.x=b.mesh.position.x;b.data.y=b.mesh.position.y;b.data.z=b.mesh.position.z;
  channel?.send({type:"broadcast",event:"block_update",payload:b.data});
}
function removeBlock(id){const b=blocks.get(id);if(!b)return;scene?.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();blocks.delete(id)}

function shouldCollide(data){return data.owner_id===playerId?data.collide_self:data.collide_others}
function playerBoxAt(p){return new THREE.Box3(new THREE.Vector3(p.x-playerRadius,p.y-playerRadius,p.z-playerRadius),new THREE.Vector3(p.x+playerRadius,p.y+playerRadius,p.z+playerRadius))}
function blockBox(d){
  const s=(Number(d.size)||1)*(Number(d.scale)||1);
  return new THREE.Box3(new THREE.Vector3(d.x-s/2,d.y-s/2,d.z-s/2),new THREE.Vector3(d.x+s/2,d.y+s/2,d.z+s/2));
}
function collidesAt(pos){
  if(pos.y-playerRadius<0)return true;
  const pb=playerBoxAt(pos);
  for(const {data} of blocks.values())if(shouldCollide(data)&&pb.intersectsBox(blockBox(data)))return true;
  return false;
}

function updateLocal(dt){
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(-forward.z,0,forward.x);
  const wish=new THREE.Vector3();
  if(keys.w)wish.add(forward);if(keys.s)wish.sub(forward);if(keys.d)wish.add(right);if(keys.a)wish.sub(right);
  if(wish.lengthSq())wish.normalize();
  const speed=5,next=localPlayer.position.clone();
  next.x+=wish.x*speed*dt;if(!collidesAt(next))localPlayer.position.x=next.x;
  next.copy(localPlayer.position);next.z+=wish.z*speed*dt;if(!collidesAt(next))localPlayer.position.z=next.z;
  velocity.y-=18*dt;if(keys[" "]&&grounded){velocity.y=7;grounded=false}
  next.copy(localPlayer.position);next.y+=velocity.y*dt;
  if(collidesAt(next)){if(velocity.y<=0)grounded=true;velocity.y=0}else{localPlayer.position.y=next.y;grounded=false}
  if(localPlayer.position.y<playerRadius){localPlayer.position.y=playerRadius;velocity.y=0;grounded=true}
}

function updatePhysics(dt){
  for(const b of blocks.values()){
    const d=b.data;if(!d.physics||draggingBlock&&d.id===selectedId)continue;
    d.vx=Number(d.vx)||0;d.vy=Number(d.vy)||0;d.vz=Number(d.vz)||0;
    const weight=Math.max(.1,Number(d.weight)||1);
    d.vy-=9.8*dt*(.75+Math.min(weight,10)*.025);
    const slide=Math.max(0,Math.min(1,Number(d.sliding)||0));
    const drag=Math.pow(.88+slide*.11,dt*60);
    d.vx*=drag;d.vz*=drag;

    const size=(Number(d.size)||1)*(Number(d.scale)||1);
    let nx=b.mesh.position.x+d.vx*dt,ny=b.mesh.position.y+d.vy*dt,nz=b.mesh.position.z+d.vz*dt;
    if(ny-size/2<0){
      ny=size/2;
      if(d.vy<0)d.vy=-d.vy*Math.max(0,Math.min(1,Number(d.bounce)||0));
      if(Math.abs(d.vy)<.15)d.vy=0;
    }
    b.mesh.position.set(nx,ny,nz);
    d.x=nx;d.y=ny;d.z=nz;
  }
}

function broadcastMovement(now){
  if(!channel||now-lastBroadcast<70)return;lastBroadcast=now;
  channel.send({type:"broadcast",event:"move",payload:{id:playerId,name:playerName,x:localPlayer.position.x,y:localPlayer.position.y,z:localPlayer.position.z}});
  for(const b of blocks.values())if(b.data.physics&&b.data.owner_id===playerId)channel.send({type:"broadcast",event:"block_update",payload:b.data});
}
function updateRemote(p){
  if(!p||p.id===playerId||!scene)return;
  let obj=remotePlayers.get(p.id);if(!obj){obj=makeAvatar(0xe58b45);scene.add(obj);remotePlayers.set(p.id,obj)}
  obj.position.set(Number(p.x)||0,Number(p.y)||playerRadius,Number(p.z)||0);
}
function updateCamera(){
  const target=localPlayer.position;
  const cp=Math.cos(pitch);
  const offset=new THREE.Vector3(Math.sin(yaw)*cp*camDistance,Math.sin(pitch)*camDistance,Math.cos(yaw)*cp*camDistance);
  camera.position.copy(target).add(offset);camera.lookAt(target);
}
function animate(now=performance.now()){
  if(!connected)return;requestAnimationFrame(animate);
  const dt=Math.min(.033,clock.getDelta());updateLocal(dt);updatePhysics(dt);updateCamera();broadcastMovement(now);renderer.render(scene,camera);
}

function selectBlock(id){
  selectedId=id;
  for(const [bid,b] of blocks)b.mesh.material.emissive?.setHex(bid===id?0x222222:0x000000);
  const b=id?blocks.get(id):null;
  $("moveSelectedName").textContent=b?.data.physics?`Physics ${b.data.shape}`:"None";
  $("scaleSelectedName").textContent=b?`${b.data.shape||"cube"} block`:"None selected";
  if(b?.data.physics){
    $("editBounce").value=b.data.bounce??.25;$("editWeight").value=b.data.weight??1;$("editSliding").value=b.data.sliding??.35;
  }
  $("scaleSlider").value=b?.data.scale??1;
}
function setMode(next){
  mode=next;selectBlock(null);
  document.querySelectorAll(".modeTabs button").forEach(b=>b.classList.toggle("on",b.dataset.mode===mode));
  $("moveOptions").classList.toggle("hidden",mode!=="move");
  $("placeOptions").classList.toggle("hidden",mode!=="place");
  $("scaleOptions").classList.toggle("hidden",mode!=="scale");
}
document.querySelectorAll(".modeTabs button").forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
$("blockType").onchange=()=>$("physicsCreate").classList.toggle("hidden",$("blockType").value!=="physics");
$("applyPhysics").onclick=()=>{
  const b=blocks.get(selectedId);if(!b?.data.physics)return;
  b.data.bounce=Number($("editBounce").value);b.data.weight=Number($("editWeight").value);b.data.sliding=Number($("editSliding").value);broadcastBlockUpdate(selectedId);
};
function applyScale(v){
  const b=blocks.get(selectedId);if(!b||b.data.shape==="sphere")return;
  b.data.scale=Math.max(.25,Math.min(4,Number(v)||1));b.mesh.scale.setScalar(b.data.scale);$("scaleSlider").value=b.data.scale;broadcastBlockUpdate(selectedId);
}
$("scaleSlider").oninput=e=>applyScale(e.target.value);
$("scaleDown").onclick=()=>applyScale((Number($("scaleSlider").value)||1)-.25);
$("scaleUp").onclick=()=>applyScale((Number($("scaleSlider").value)||1)+.25);

function sendMessage(){
  const body=$("chatInput").value.trim();if(!body||!connected)return;$("chatInput").value="";
  channel?.send({type:"broadcast",event:"chat",payload:{player_id:playerId,player_name:playerName,body}});
}
function appendMessage(m){
  if(!m)return;const div=document.createElement("div");div.className="message";
  const who=document.createElement("span");who.className="who";who.textContent=(m.player_name||"Derp")+": ";
  div.append(who,document.createTextNode(m.body||""));$("messages").appendChild(div);$("messages").scrollTop=$("messages").scrollHeight;
}
function flashStatus(msg){$("roomLabel").textContent=msg;setTimeout(()=>{if(connected)$("roomLabel").textContent=`Room: ${roomCode}`},1800)}
async function leave(){connected=false;if(channel){try{await channel.untrack();await sb.removeChannel(channel)}catch{}}location.reload()}

$("joinBtn").onclick=()=>{setJoinStatus("Starting...");if(!bootCheck())return;joinRoom()};
$("codeInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("joinBtn").click()});
$("nameInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("joinBtn").click()});
$("sendBtn").onclick=sendMessage;
$("chatInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();sendMessage()}e.stopPropagation()});
$("chatInput").addEventListener("keyup",e=>e.stopPropagation());
$("leaveBtn").onclick=leave;
addEventListener("keydown",e=>{if(document.activeElement&&["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName))return;keys[e.key.toLowerCase()]=true});
addEventListener("keyup",e=>{if(document.activeElement&&["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName))return;keys[e.key.toLowerCase()]=false});
window.addEventListener("beforeunload",()=>{if(channel)channel.untrack()});
setMode("move");setTimeout(bootCheck,0);
