
"use strict";

const SUPABASE_URL="https://hjezefwwradgurpbkcfr.supabase.co";
const SUPABASE_KEY="sb_publishable_Q7XxTFNOO0OTzpgodFmtjQ_4ga7p0MU";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{realtime:{params:{eventsPerSecond:20}}});
const $=id=>document.getElementById(id);

const playerId=crypto.randomUUID();
let roomCode="",playerName="Derp",channel=null,connected=false;
let scene,camera,renderer,clock,raycaster,mouse,ground,localPlayer;
let yaw=Math.PI,pitch=-0.45,camDistance=7,dragging=false,lastPointer={x:0,y:0};
const keys={},velocity=new THREE.Vector3(),blocks=new Map(),remotePlayers=new Map();
const playerHalf=new THREE.Vector3(.48,.48,.48),PLAYER_HEIGHT=.96;
let grounded=false,lastBroadcast=0;
let interactionMode="move",removeOwnNext=false,placementGhost=null,selectedBlockId=null,draggedPhysicsId=null,dragPlane=null,dragOffset=new THREE.Vector3();


function bootCheck(){
  const status=$("joinStatus");
  if(!window.THREE){
    status.textContent="Three.js did not load.";
    status.style.color="#ff9a9a";
    return false;
  }
  if(!window.supabase){
    status.textContent="Supabase library did not load.";
    status.style.color="#ff9a9a";
    return false;
  }
  status.textContent="Ready.";
  return true;
}

const normalizeCode=v=>v.trim().replace(/\s+/g,"-").slice(0,24)||"room";
const safeName=v=>v.trim().slice(0,20)||"Derp";

function setJoinStatus(msg,bad=false){
  const el=$("joinStatus");
  el.textContent=msg;
  el.style.color=bad?"#ff9a9a":"#9dc4d9";
}

async function joinRoom(){
  if(channel)return;
  if(!$("codeInput").value.trim()){setJoinStatus("Enter a room code.",true);return;}
  roomCode=normalizeCode($("codeInput").value);
  playerName=safeName($("nameInput").value);
  setJoinStatus("Connecting to realtime room...");

  try{
    if(!navigator.onLine){setJoinStatus("No internet connection.",true);return;}
    console.log("Joining room:",roomCode);
    channel=sb.channel(`daderpg:${roomCode}`,{
      config:{
        presence:{key:playerId},
        broadcast:{self:true,ack:false}
      }
    });

    channel
      .on("presence",{event:"sync"},handlePresence)
      .on("broadcast",{event:"move"},({payload})=>updateRemote(payload))
      .on("broadcast",{event:"block_add"},({payload})=>addBlock(payload))
      .on("broadcast",{event:"block_update"},({payload})=>updateBlock(payload))
      .on("broadcast",{event:"block_remove"},({payload})=>removeBlock(payload?.id))
      .on("broadcast",{event:"chat"},({payload})=>appendMessage(payload))
      .on("broadcast",{event:"state_request"},({payload})=>{
        if(!payload?.requester||payload.requester===playerId)return;
        // Each client responds with blocks it owns. This avoids duplicates.
        const mine=[...blocks.values()].filter(v=>v.data.owner_id===playerId).map(v=>v.data);
        channel.send({type:"broadcast",event:"state_response",payload:{to:payload.requester,blocks:mine}});
      })
      .on("broadcast",{event:"state_response"},({payload})=>{
        if(payload?.to!==playerId)return;
        (payload.blocks||[]).forEach(addBlock);
      });

    const status = await new Promise(resolve=>{
      let done=false;
      const timer=setTimeout(()=>{if(!done){done=true;resolve("TIMEOUT")}},10000);
      channel.subscribe(async s=>{
        if(done)return;
        if(s==="SUBSCRIBED"){
          done=true;clearTimeout(timer);
          try{await channel.track({id:playerId,name:playerName,joined_at:Date.now()})}catch{}
          resolve("SUBSCRIBED");
        }else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT"||s==="CLOSED"){
          done=true;clearTimeout(timer);resolve(s);
        }
      });
    });

    if(status!=="SUBSCRIBED"){
      setJoinStatus(`Connection failed: ${status}. Open the browser console for details.`,true);
      try{await sb.removeChannel(channel)}catch{}
      channel=null;
      return;
    }

    await new Promise(r=>setTimeout(r,300));
    if(activePresenceCount()>10){
      setJoinStatus("That room already has 10 players.",true);
      try{await channel.untrack();await sb.removeChannel(channel)}catch{}
      channel=null;
      return;
    }

    init3D();
    connected=true;
    $("joinScreen").classList.add("hidden");
    $("gameUI").classList.remove("hidden");
    $("roomLabel").textContent=`Room: ${roomCode}`;
    handlePresence();

    // Ask existing clients for their owned blocks.
    channel.send({type:"broadcast",event:"state_request",payload:{requester:playerId}});
    appendMessage({player_name:"SYSTEM",body:`${playerName} joined ${roomCode}.`});
    animate();
  }catch(err){
    console.error(err);
    setJoinStatus(`Join failed: ${err?.message||err}`,true);
    channel=null;
  }
}

function activePresenceCount(){
  if(!channel)return 0;
  try{return Object.values(channel.presenceState()).flat().length}catch{return 0}
}
function handlePresence(){
  if(!channel)return;
  const all=Object.values(channel.presenceState()).flat();
  if($("playerCount"))$("playerCount").textContent=`${all.length}/10 players`;
  if(!scene)return;

  const seen=new Set();
  for(const p of all){
    if(!p.id||p.id===playerId)continue;
    seen.add(p.id);
    if(!remotePlayers.has(p.id)){
      const av=makeAvatar(0xff9f43);av.userData.name=p.name||"Derp";scene.add(av);remotePlayers.set(p.id,av);
    }
  }
  for(const [id,obj] of remotePlayers){
    if(!seen.has(id)){scene.remove(obj);remotePlayers.delete(id)}
  }
}

function init3D(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x90c8ff);
  scene.fog=new THREE.Fog(0x90c8ff,35,100);

  camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,250);
  renderer=new THREE.WebGLRenderer({canvas:$("game"),antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.shadowMap.enabled=true;
  clock=new THREE.Clock();
  raycaster=new THREE.Raycaster();
  mouse=new THREE.Vector2();

  scene.add(new THREE.HemisphereLight(0xffffff,0x52606d,2.1));
  const sun=new THREE.DirectionalLight(0xffffff,2);
  sun.position.set(8,16,7);sun.castShadow=true;scene.add(sun);

  scene.add(new THREE.GridHelper(120,120,0x26485e,0x6ba7c8));
  ground=new THREE.Mesh(
    new THREE.BoxGeometry(120,.2,120),
    new THREE.MeshStandardMaterial({color:0x36515d,roughness:1})
  );
  ground.position.y=-.1;ground.receiveShadow=true;ground.userData.isGround=true;scene.add(ground);

  localPlayer=makeAvatar(0x42d3ff);
  localPlayer.position.set(0,PLAYER_HEIGHT/2,0);
  scene.add(localPlayer);

  $("game").addEventListener("pointerdown",onPointerDown);
  addEventListener("pointermove",onPointerMove);
  addEventListener("pointerup",()=>{dragging=false;finishPhysicsDrag()});
  $("game").addEventListener("contextmenu",e=>e.preventDefault());
  $("game").addEventListener("wheel",e=>{
    camDistance=THREE.MathUtils.clamp(camDistance+Math.sign(e.deltaY)*.7,3,18);
  },{passive:true});
  addEventListener("resize",onResize);
}
function makeAvatar(color){
  const g=new THREE.Group();
  const sphere=new THREE.Mesh(
    new THREE.SphereGeometry(.5,24,18),
    new THREE.MeshStandardMaterial({color,roughness:.75})
  );
  sphere.castShadow=true;
  sphere.receiveShadow=true;
  g.add(sphere);
  g.userData.isPlayer=true;
  return g;
}
function onResize(){
  if(!renderer)return;
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);
}
function onPointerDown(e){
  if(e.target!==$("game"))return;
  if(e.button===2){
    dragging=true;
    lastPointer={x:e.clientX,y:e.clientY};
    return;
  }
  if(e.button!==0)return;

  if(interactionMode==="place"){
    if(removeOwnNext)deleteFromPointer(e);
    else placeFromPointer(e);
    return;
  }

  if(interactionMode==="scale"){
    selectBlockFromPointer(e);
    return;
  }

  if(interactionMode==="move"){
    startPhysicsDrag(e);
  }
}
function onPointerMove(e){
  if(draggedPhysicsId){
    dragPhysicsBlock(e);
    return;
  }
  if(!dragging)return;
  yaw+=(e.clientX-lastPointer.x)*.006;
  pitch+=(e.clientY-lastPointer.y)*.005;
  pitch=THREE.MathUtils.clamp(pitch,-1.15,.25);
  lastPointer={x:e.clientX,y:e.clientY};
}
function pointerRay(e){
  const r=renderer.domElement.getBoundingClientRect();
  mouse.x=((e.clientX-r.left)/r.width)*2-1;
  mouse.y=-((e.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(mouse,camera);
}
function buildTargets(){return [ground,...[...blocks.values()].map(v=>v.mesh)]}

function snapValue(value,grid){
  return Math.round(value/grid)*grid;
}
function blockTypeCollision(){
  const type=$("blockType").value;
  if(type==="default")return {self:false,others:false};
  return {self:$("collideSelf").checked,others:$("collideOthers").checked};
}
function snappedPlacement(hit,size){
  const grid=Math.max(.25,Number($("gridSize").value)||1);
  const p=hit.point.clone();

  if(hit.object.userData.blockId){
    const n=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    p.addScaledVector(n,size/2+.001);
  }else{
    p.y=size/2;
  }

  // Snap by block center. Y is offset by half block size so blocks sit exactly on grid planes.
  p.x=snapValue(p.x,grid);
  p.z=snapValue(p.z,grid);
  p.y=snapValue(p.y-size/2,grid)+size/2;
  p.y=Math.max(size/2,p.y);
  return p;
}

async function placeFromPointer(e){
  pointerRay(e);
  const hit=raycaster.intersectObjects(buildTargets(),false)[0];
  if(!hit)return;

  const size=Number($("blockSize").value)||1;
  const p=snappedPlacement(hit,size);
  const collision=blockTypeCollision();
  const rotationY=THREE.MathUtils.degToRad(Number($("blockRotation").value)||0);

  if(intersectsAnyPlayer(p,size)){
    flashStatus("Can't place a block on a player.");
    return;
  }

  const data={
    id:crypto.randomUUID(),
    room_code:roomCode,
    owner_id:playerId,
    owner_name:playerName,
    x:p.x,y:p.y,z:p.z,
    size,
    color:$("blockColor").value,
    block_type:$("blockType").value,
    rotation_y:rotationY,
    physics_shape:$("physicsShape").value,
    bounciness:Number($("bounciness").value)||0,
    weight:Math.max(.1,Number($("weight").value)||1),
    sliding:Number($("sliding").value)||0,
    collide_self:collision.self,
    collide_others:collision.others
  };

  addBlock(data);
  channel?.send({type:"broadcast",event:"block_add",payload:data});
}

function intersectsAnyPlayer(pos,size){
  const b=new THREE.Box3(
    new THREE.Vector3(pos.x-size/2,pos.y-size/2,pos.z-size/2),
    new THREE.Vector3(pos.x+size/2,pos.y+size/2,pos.z+size/2)
  );
  return [localPlayer,...remotePlayers.values()].filter(Boolean).some(pl=>{
    const p=pl.position;
    const pb=new THREE.Box3(
      new THREE.Vector3(p.x-playerHalf.x,p.y-PLAYER_HEIGHT/2,p.z-playerHalf.z),
      new THREE.Vector3(p.x+playerHalf.x,p.y+PLAYER_HEIGHT/2,p.z+playerHalf.z)
    );
    return b.intersectsBox(pb);
  });
}
function deleteFromPointer(e){
  pointerRay(e);
  const hit=raycaster.intersectObjects([...blocks.values()].map(v=>v.mesh),false)[0];if(!hit)return;
  const d=blocks.get(hit.object.userData.blockId)?.data;
  if(!d||d.owner_id!==playerId){flashStatus("You can only remove blocks you placed.");return}
  removeBlock(d.id);
  removeOwnNext=false;
  channel?.send({type:"broadcast",event:"block_remove",payload:{id:d.id}});
}
function addBlock(data){
  if(!scene||!data?.id||blocks.has(data.id))return;
  const s=Number(data.size)||1;
  let geometry;
  if(data.block_type==="physics"&&data.physics_shape==="sphere")geometry=new THREE.SphereGeometry(s/2,20,14);
  else if(data.block_type==="physics"&&data.physics_shape==="cylinder")geometry=new THREE.CylinderGeometry(s/2,s/2,s,20);
  else geometry=new THREE.BoxGeometry(s,s,s);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:data.color||"#38bdf8",roughness:.75}));
  mesh.position.set(Number(data.x)||0,Number(data.y)||s/2,Number(data.z)||0);
  mesh.scale.set(Number(data.scale_x)||1,Number(data.scale_y)||1,Number(data.scale_z)||1);
  mesh.rotation.y=Number(data.rotation_y)||0;
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.blockId=data.id;
  scene.add(mesh);blocks.set(data.id,{mesh,data});
}
function updateBlock(data){
  if(!data?.id)return;
  const b=blocks.get(data.id);
  if(!b){addBlock(data);return}
  b.data={...b.data,...data};
  b.mesh.position.set(Number(data.x)||0,Number(data.y)||0,Number(data.z)||0);
  b.mesh.rotation.y=Number(data.rotation_y)||0;
  b.mesh.scale.set(Number(data.scale_x)||1,Number(data.scale_y)||1,Number(data.scale_z)||1);
}
function removeBlock(id){
  const b=blocks.get(id);if(!b)return;
  scene?.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();blocks.delete(id);
}
function shouldCollide(data){
  if((data.block_type||"physics")==="default")return false;
  return data.owner_id===playerId?data.collide_self:data.collide_others;
}
function playerBoxAt(p){
  return new THREE.Box3(
    new THREE.Vector3(p.x-playerHalf.x,p.y-PLAYER_HEIGHT/2,p.z-playerHalf.z),
    new THREE.Vector3(p.x+playerHalf.x,p.y+PLAYER_HEIGHT/2,p.z+playerHalf.z)
  );
}
function blockBox(d){
  const s=Number(d.size)||1;
  const sx=s*(Number(d.scale_x)||1),sy=s*(Number(d.scale_y)||1),sz=s*(Number(d.scale_z)||1);
  return new THREE.Box3(
    new THREE.Vector3(Number(d.x)-sx/2,Number(d.y)-sy/2,Number(d.z)-sz/2),
    new THREE.Vector3(Number(d.x)+sx/2,Number(d.y)+sy/2,Number(d.z)+sz/2)
  );
}
function collidesAt(pos){
  if(pos.y-PLAYER_HEIGHT/2<0)return true;
  const pb=playerBoxAt(pos);
  for(const {data} of blocks.values())if(shouldCollide(data)&&pb.intersectsBox(blockBox(data)))return true;
  return false;
}

function raycastBlocks(e){
  pointerRay(e);
  return raycaster.intersectObjects([...blocks.values()].map(v=>v.mesh),false);
}
function selectBlockFromPointer(e){
  const hit=raycastBlocks(e)[0];
  if(!hit){selectedBlockId=null;updateSelectedBlockInfo();return}
  selectedBlockId=hit.object.userData.blockId||null;
  updateSelectedBlockInfo();
}
function updateSelectedBlockInfo(){
  const el=$("selectedBlockInfo");
  const b=selectedBlockId?blocks.get(selectedBlockId):null;
  if(!b){el.textContent="No block selected.";return}
  const d=b.data;
  el.textContent=`Selected: ${d.block_type||"default"} · scale ${(Number(d.scale_x)||1).toFixed(2)}, ${(Number(d.scale_y)||1).toFixed(2)}, ${(Number(d.scale_z)||1).toFixed(2)}`;
}
function scaleSelected(direction){
  const b=selectedBlockId?blocks.get(selectedBlockId):null;
  if(!b)return;
  if(b.data.owner_id!==playerId){flashStatus("You can only scale blocks you placed.");return}
  const step=Math.max(.05,Number($("scaleStep").value)||.5)*direction;
  const axis=$("scaleAxis").value;
  let sx=Number(b.data.scale_x)||1,sy=Number(b.data.scale_y)||1,sz=Number(b.data.scale_z)||1;
  const clamp=v=>Math.max(.25,Math.min(10,v));
  if(axis==="uniform"){sx=clamp(sx+step);sy=clamp(sy+step);sz=clamp(sz+step)}
  if(axis==="x")sx=clamp(sx+step);
  if(axis==="y")sy=clamp(sy+step);
  if(axis==="z")sz=clamp(sz+step);
  b.data.scale_x=sx;b.data.scale_y=sy;b.data.scale_z=sz;
  b.mesh.scale.set(sx,sy,sz);
  channel?.send({type:"broadcast",event:"block_update",payload:b.data});
  updateSelectedBlockInfo();
}
function startPhysicsDrag(e){
  const hit=raycastBlocks(e)[0];
  if(!hit)return;
  const id=hit.object.userData.blockId;
  const b=blocks.get(id);
  if(!b||b.data.block_type!=="physics")return;
  if(b.data.owner_id!==playerId){flashStatus("You can only drag physics blocks you placed.");return}
  draggedPhysicsId=id;
  dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-b.mesh.position.y);
  const point=new THREE.Vector3();
  raycaster.ray.intersectPlane(dragPlane,point);
  dragOffset.copy(b.mesh.position).sub(point);
}
function dragPhysicsBlock(e){
  const b=blocks.get(draggedPhysicsId);
  if(!b)return;
  pointerRay(e);
  const point=new THREE.Vector3();
  if(!raycaster.ray.intersectPlane(dragPlane,point))return;
  point.add(dragOffset);
  const grid=Math.max(.25,Number($("gridSize").value)||1);
  point.x=snapValue(point.x,grid);
  point.z=snapValue(point.z,grid);
  point.y=Math.max((Number(b.data.size)||1)/2,point.y);
  if(intersectsAnyPlayer(point,Number(b.data.size)||1))return;
  b.mesh.position.copy(point);
  b.data.x=point.x;b.data.y=point.y;b.data.z=point.z;
}
function finishPhysicsDrag(){
  if(!draggedPhysicsId)return;
  const b=blocks.get(draggedPhysicsId);
  if(b)channel?.send({type:"broadcast",event:"block_update",payload:b.data});
  draggedPhysicsId=null;dragPlane=null;
}

function updateLocal(dt){
  const forward=new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y=0;
  if(forward.lengthSq()<.0001)forward.set(0,0,-1);
  forward.normalize();

  const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
  const wish=new THREE.Vector3();

  if(keys.w)wish.add(forward);
  if(keys.s)wish.sub(forward);
  if(keys.d)wish.add(right);
  if(keys.a)wish.sub(right);
  if(wish.lengthSq())wish.normalize();

  const speed=5,next=localPlayer.position.clone();
  next.x+=wish.x*speed*dt;
  if(!collidesAt(next))localPlayer.position.x=next.x;

  next.copy(localPlayer.position);
  next.z+=wish.z*speed*dt;
  if(!collidesAt(next))localPlayer.position.z=next.z;

  velocity.y-=18*dt;
  if(keys[" "]&&grounded){velocity.y=7;grounded=false}

  next.copy(localPlayer.position);
  next.y+=velocity.y*dt;
  if(collidesAt(next)){
    let bounce=0;
    for(const {data} of blocks.values()){
      if(data.block_type!=="physics"||!shouldCollide(data))continue;
      if(playerBoxAt(next).intersectsBox(blockBox(data)))bounce=Math.max(bounce,Number(data.bounciness)||0);
    }
    if(velocity.y<=0)grounded=true;
    velocity.y=bounce>0.01?Math.abs(velocity.y)*bounce:0;
  }else{
    localPlayer.position.y=next.y;
    grounded=false;
  }

  if(localPlayer.position.y<PLAYER_HEIGHT/2){
    localPlayer.position.y=PLAYER_HEIGHT/2;
    velocity.y=0;
    grounded=true;
  }
}

function broadcastMovement(now){
  if(!channel||now-lastBroadcast<70)return;
  lastBroadcast=now;
  channel.send({type:"broadcast",event:"move",payload:{id:playerId,name:playerName,x:localPlayer.position.x,y:localPlayer.position.y,z:localPlayer.position.z}});
}
function updateRemote(p){
  if(!p||p.id===playerId||!scene)return;
  let obj=remotePlayers.get(p.id);
  if(!obj){obj=makeAvatar(0xff9f43);scene.add(obj);remotePlayers.set(p.id,obj)}
  obj.position.set(Number(p.x)||0,Number(p.y)||PLAYER_HEIGHT/2,Number(p.z)||0);
}
function updateCamera(){
  const target=localPlayer.position.clone().add(new THREE.Vector3(0,.55,0)),cp=Math.cos(pitch);
  const off=new THREE.Vector3(Math.sin(yaw)*cp*camDistance,Math.sin(pitch)*camDistance,Math.cos(yaw)*cp*camDistance);
  camera.position.copy(target).sub(off);camera.lookAt(target);
}
function animate(now=performance.now()){
  if(!connected)return;
  requestAnimationFrame(animate);
  const dt=Math.min(.033,clock.getDelta());
  updateLocal(dt);updateCamera();broadcastMovement(now);renderer.render(scene,camera);
}

function sendMessage(){
  const body=$("chatInput").value.trim();if(!body||!connected)return;
  $("chatInput").value="";
  const payload={player_id:playerId,player_name:playerName,body};
  channel?.send({type:"broadcast",event:"chat",payload});
}
function appendMessage(m){
  if(!m)return;
  const div=document.createElement("div");div.className="message";
  const who=document.createElement("span");who.className="who";who.textContent=(m.player_name||"Derp")+": ";
  div.append(who,document.createTextNode(m.body||""));
  $("messages").appendChild(div);$("messages").scrollTop=$("messages").scrollHeight;
}
function flashStatus(msg){
  $("roomLabel").textContent=msg;
  setTimeout(()=>{if(connected)$("roomLabel").textContent=`Room: ${roomCode}`},1800);
}
async function leave(){
  connected=false;
  if(channel){try{await channel.untrack();await sb.removeChannel(channel)}catch{}}
  location.reload();
}

$("joinBtn").onclick=()=>{
  setJoinStatus("Starting...");
  if(!bootCheck())return;
  joinRoom();
};
$("codeInput").addEventListener("keydown",e=>{if(e.key==="Enter")joinRoom()});
$("nameInput").addEventListener("keydown",e=>{if(e.key==="Enter")joinRoom()});
$("sendBtn").onclick=sendMessage;
$("chatInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();sendMessage()}e.stopPropagation()});
$("chatInput").addEventListener("keyup",e=>e.stopPropagation());
$("leaveBtn").onclick=leave;

addEventListener("keydown",e=>{
  if(document.activeElement&&["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName))return;
  keys[e.key.toLowerCase()]=true;
});
addEventListener("keyup",e=>{
  if(document.activeElement&&["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName))return;
  keys[e.key.toLowerCase()]=false;
});
window.addEventListener("beforeunload",()=>{if(channel)channel.untrack()});


function setInteractionMode(mode){
  interactionMode=mode;
  removeOwnNext=false;
  selectedBlockId=null;
  updateSelectedBlockInfo?.();
  $("moveModeBtn").classList.toggle("active",mode==="move");
  $("placeModeBtn").classList.toggle("active",mode==="place");
  $("scaleModeBtn").classList.toggle("active",mode==="scale");
  $("placeOptions").classList.toggle("hidden",mode!=="place");
  $("scaleOptions").classList.toggle("hidden",mode!=="scale");
  updatePlacementGhost();
}
function updateBlockTypeUI(){
  $("physicsOptions").classList.toggle("hidden",$("blockType").value!=="physics");
}
function clearPlacementGhost(){
  if(!placementGhost)return;
  scene?.remove(placementGhost);
  placementGhost.geometry.dispose();
  placementGhost.material.dispose();
  placementGhost=null;
}
function updatePlacementGhost(e=null){
  if(!scene||interactionMode!=="place"||!$("showPlacementGhost").checked){
    clearPlacementGhost();
    return;
  }
  if(!e||e.target!==$("game"))return;
  pointerRay(e);
  const hit=raycaster.intersectObjects(buildTargets(),false)[0];
  if(!hit){clearPlacementGhost();return}
  const size=Number($("blockSize").value)||1;
  const p=snappedPlacement(hit,size);

  if(!placementGhost){
    placementGhost=new THREE.Mesh(
      new THREE.BoxGeometry(1,1,1),
      new THREE.MeshBasicMaterial({color:$("blockColor").value,transparent:true,opacity:.35,depthWrite:false})
    );
    scene.add(placementGhost);
  }
  placementGhost.scale.setScalar(size);
  placementGhost.position.copy(p);
  placementGhost.rotation.y=THREE.MathUtils.degToRad(Number($("blockRotation").value)||0);
  placementGhost.material.color.set($("blockColor").value);
}

$("moveModeBtn").onclick=()=>setInteractionMode("move");
$("placeModeBtn").onclick=()=>setInteractionMode("place");
$("scaleModeBtn").onclick=()=>setInteractionMode("scale");
$("scaleDownBtn").onclick=()=>scaleSelected(-1);
$("scaleUpBtn").onclick=()=>scaleSelected(1);
$("blockType").onchange=updateBlockTypeUI;
$("removeOwnBtn").onclick=()=>{
  removeOwnNext=true;
  flashStatus("Click one of your blocks to remove it.");
};
$("game").addEventListener("pointermove",updatePlacementGhost);
for(const id of ["blockColor","blockSize","blockRotation","gridSize","showPlacementGhost","physicsShape"]){
  $(id).addEventListener("input",()=>updatePlacementGhost());
  $(id).addEventListener("change",()=>updatePlacementGhost());
}
updateBlockTypeUI();
setInteractionMode("move");

setTimeout(bootCheck,0);
