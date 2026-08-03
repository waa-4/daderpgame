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
let grounded=false,lastBroadcast=0,mode="blocks",selectedId=null,draggingBlock=false,dragPlane=null,dragOffset=new THREE.Vector3();
const isMobile=matchMedia("(pointer:coarse)").matches||navigator.maxTouchPoints>0;
let mobileMoveX=0,mobileMoveY=0,mobileCameraTouch=null,mobilePinchDistance=0,mobileGrabbed=false,mobileGrabHeight=1.5;


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
  if(e.pointerType==="touch")return;
  pointerRay(e);
  if(e.button===2){
    orbiting=true;lastPointer={x:e.clientX,y:e.clientY};return;
  }
  if(e.button!==0)return;

  if(mode==="blocks"){placeFromPointer(e);return}
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
  if(mode==="scale"||mode==="rotate"){
    const hit=pickBlock(false);
    selectBlock(hit?.object.userData.blockId||null);
  }
}
function onPointerMove(e){
  if(orbiting){
    const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;
    yaw-=dx*.006;
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
    rotX:0,rotY:0,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,
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
  data.scaleX??=data.scale??1;data.scaleY??=data.scale??1;data.scaleZ??=data.scale??1;
  const s=Number(data.size)||1;
  const geo=data.shape==="sphere"?new THREE.SphereGeometry(s/2,20,14):new THREE.BoxGeometry(s,s,s);
  const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:data.color||"#3a9bdc",roughness:.75}));
  mesh.position.set(Number(data.x)||0,Number(data.y)||s/2,Number(data.z)||0);
  mesh.rotation.set(THREE.MathUtils.degToRad(data.rotX||0),THREE.MathUtils.degToRad(data.rotY||0),THREE.MathUtils.degToRad(data.rotZ||0));
  mesh.scale.set(Number(data.scaleX)||1,Number(data.scaleY)||1,Number(data.scaleZ)||1);mesh.userData.blockId=data.id;scene.add(mesh);blocks.set(data.id,{mesh,data});
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
  b.mesh.scale.set(Number(data.scaleX)||1,Number(data.scaleY)||1,Number(data.scaleZ)||1);
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
  const base=Number(d.size)||1;
  const sx=base*(Number(d.scaleX)||1),sy=base*(Number(d.scaleY)||1),sz=base*(Number(d.scaleZ)||1);
  return new THREE.Box3(new THREE.Vector3(d.x-sx/2,d.y-sy/2,d.z-sz/2),new THREE.Vector3(d.x+sx/2,d.y+sy/2,d.z+sz/2));
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
  if(Math.abs(mobileMoveY)>.08)wish.addScaledVector(forward,-mobileMoveY);
  if(Math.abs(mobileMoveX)>.08)wish.addScaledVector(right,mobileMoveX);
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
  const physics=[...blocks.values()].filter(b=>b.data.physics);
  for(const b of physics){
    const d=b.data;if(draggingBlock&&d.id===selectedId)continue;
    d.vx=Number(d.vx)||0;d.vy=Number(d.vy)||0;d.vz=Number(d.vz)||0;
    const weight=Math.max(.1,Number(d.weight)||1),bounce=Math.max(0,Math.min(1,Number(d.bounce)||0));
    d.vy-=9.8*dt*(.75+Math.min(weight,10)*.025);
    const slide=Math.max(0,Math.min(1,Number(d.sliding)||0));
    const drag=Math.pow(.82+slide*.17,dt*60);d.vx*=drag;d.vz*=drag;
    const base=Number(d.size)||1;
    const halfX=base*(Number(d.scaleX)||1)/2,halfY=base*(Number(d.scaleY)||1)/2,halfZ=base*(Number(d.scaleZ)||1)/2;
    let next=b.mesh.position.clone();next.x+=d.vx*dt;next.y+=d.vy*dt;next.z+=d.vz*dt;
    if(next.y-halfY<0){next.y=halfY;if(d.vy<0)d.vy=-d.vy*bounce;if(Math.abs(d.vy)<.12)d.vy=0}
    // Land on static or other physics blocks using their world AABBs.
    const nextBox=new THREE.Box3(new THREE.Vector3(next.x-halfX,next.y-halfY,next.z-halfZ),new THREE.Vector3(next.x+halfX,next.y+halfY,next.z+halfZ));
    for(const other of blocks.values()){
      if(other===b)continue;
      const ob=blockBox(other.data);
      if(!nextBox.intersectsBox(ob))continue;
      const oldBottom=b.mesh.position.y-halfY,otherTop=ob.max.y;
      if(d.vy<=0&&oldBottom>=otherTop-.15){next.y=otherTop+halfY;d.vy=-d.vy*bounce;if(Math.abs(d.vy)<.12)d.vy=0;nextBox.min.y=next.y-halfY;nextBox.max.y=next.y+halfY}
      else{
        // Simple side response.
        const dx=Math.min(nextBox.max.x-ob.min.x,ob.max.x-nextBox.min.x);
        const dz=Math.min(nextBox.max.z-ob.min.z,ob.max.z-nextBox.min.z);
        if(dx<dz){next.x=b.mesh.position.x;d.vx=-d.vx*bounce}else{next.z=b.mesh.position.z;d.vz=-d.vz*bounce}
      }
    }
    b.mesh.position.copy(next);d.x=next.x;d.y=next.y;d.z=next.z;
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
  const dt=Math.min(.033,clock.getDelta());
  updateLocal(dt);
  if(mobileGrabbed&&selectedId){
    const b=blocks.get(selectedId);
    if(b?.data.physics){
      const dir=new THREE.Vector3();camera.getWorldDirection(dir);
      const target=camera.position.clone().addScaledVector(dir,4);
      target.y=Math.max((Number(b.data.size)||1)/2,mobileGrabHeight);
      target.x=snap(target.x);target.z=snap(target.z);
      b.mesh.position.lerp(target,Math.min(1,dt*12));
      b.data.x=b.mesh.position.x;b.data.y=b.mesh.position.y;b.data.z=b.mesh.position.z;
      b.data.vx=b.data.vy=b.data.vz=0;
    }
  }
  updatePhysics(dt);updateCamera();broadcastMovement(now);renderer.render(scene,camera);
}

function selectBlock(id){
  selectedId=id;
  for(const [bid,b] of blocks)b.mesh.material.emissive?.setHex(bid===id?0x222222:0x000000);
  const b=id?blocks.get(id):null;
  const name=b?`${b.data.physics?'Physics ':''}${b.data.shape||'cube'} block`:'None selected';
  $("moveSelectedName").textContent=b?.data.physics?name:"Select a physics block";
  $("scaleSelectedName").textContent=name;
  $("rotateSelectedName").textContent=name;
  if(b?.data.physics){$("editBounce").value=b.data.bounce??.25;$("editWeight").value=b.data.weight??1;$("editSliding").value=b.data.sliding??.35}
  const sx=b?.data.scaleX??1,sy=b?.data.scaleY??1,sz=b?.data.scaleZ??1;
  $("scaleX").value=sx;$("scaleY").value=sy;$("scaleZ").value=sz;
  $("scaleXValue").value=Number(sx).toFixed(2);$("scaleYValue").value=Number(sy).toFixed(2);$("scaleZValue").value=Number(sz).toFixed(2);
  $("editRotX").value=b?.data.rotX??0;$("editRotY").value=b?.data.rotY??0;$("editRotZ").value=b?.data.rotZ??0;
}
function setMode(next){
  mode=next;selectBlock(null);
  document.querySelectorAll(".modeTabs button").forEach(b=>b.classList.toggle("on",b.dataset.mode===mode));
  $("blocksOptions").classList.toggle("hidden",mode!=="blocks");
  $("moveOptions").classList.toggle("hidden",mode!=="move");
  $("scaleOptions").classList.toggle("hidden",mode!=="scale");
  $("rotateOptions").classList.toggle("hidden",mode!=="rotate");
  $("chatOptions").classList.toggle("hidden",mode!=="chat");
}
document.querySelectorAll(".modeTabs button").forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
$("blockType").onchange=()=>$("physicsCreate").classList.toggle("hidden",$("blockType").value!=="physics");
$("applyPhysics").onclick=()=>{
  const b=blocks.get(selectedId);if(!b?.data.physics)return;
  b.data.bounce=Number($("editBounce").value);b.data.weight=Number($("editWeight").value);b.data.sliding=Number($("editSliding").value);broadcastBlockUpdate(selectedId);
};
function applyAxisScale(axis,value){
  const b=blocks.get(selectedId);if(!b)return;
  const v=Math.max(.25,Math.min(4,Number(value)||1));b.data["scale"+axis]=v;
  b.mesh.scale.set(Number(b.data.scaleX)||1,Number(b.data.scaleY)||1,Number(b.data.scaleZ)||1);
  $("scale"+axis+"Value").value=v.toFixed(2);broadcastBlockUpdate(selectedId);
}
$("scaleX").oninput=e=>applyAxisScale("X",e.target.value);
$("scaleY").oninput=e=>applyAxisScale("Y",e.target.value);
$("scaleZ").oninput=e=>applyAxisScale("Z",e.target.value);
$("resetScale").onclick=()=>{const b=blocks.get(selectedId);if(!b)return;b.data.scaleX=b.data.scaleY=b.data.scaleZ=1;b.mesh.scale.set(1,1,1);selectBlock(selectedId);broadcastBlockUpdate(selectedId)};
$("applyRotation").onclick=()=>{
  const b=blocks.get(selectedId);if(!b)return;
  b.data.rotX=Number($("editRotX").value)||0;b.data.rotY=Number($("editRotY").value)||0;b.data.rotZ=Number($("editRotZ").value)||0;
  b.mesh.rotation.set(THREE.MathUtils.degToRad(b.data.rotX),THREE.MathUtils.degToRad(b.data.rotY),THREE.MathUtils.degToRad(b.data.rotZ));broadcastBlockUpdate(selectedId);
};
$("resetRotation").onclick=()=>{const b=blocks.get(selectedId);if(!b)return;b.data.rotX=b.data.rotY=b.data.rotZ=0;b.mesh.rotation.set(0,0,0);selectBlock(selectedId);broadcastBlockUpdate(selectedId)};
let chatVisible=true;
$("toggleChat").onclick=()=>{chatVisible=!chatVisible;$("chatBody").classList.toggle("hidden",!chatVisible);$("toggleChat").textContent=chatVisible?"Hide chat":"Show chat"};
$("collapseMenu").onclick=()=>{$("sideMenu").classList.toggle("collapsed");$("collapseMenu").textContent=$("sideMenu").classList.contains("collapsed")?"+":"−"};

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

function rayFromScreenCenter(){
  if(!renderer||!camera)return;
  mouse.set(0,0);
  raycaster.setFromCamera(mouse,camera);
}
function mobileUse(){
  if(!connected)return;
  rayFromScreenCenter();
  if(mode==="blocks"){
    placeFromCurrentRay();
    return;
  }
  const hit=pickBlock(mode==="move");
  selectBlock(hit?.object.userData.blockId||null);
  if(mode==="move"){
    const b=selectedId?blocks.get(selectedId):null;
    if(b?.data.physics){
      mobileGrabbed=!mobileGrabbed;
      mobileGrabHeight=b.mesh.position.y;
      $("mobileLift").classList.toggle("hidden",!mobileGrabbed);
      $("mobileAction").textContent=mobileGrabbed?"Drop":"Grab";
      if(!mobileGrabbed)broadcastBlockUpdate(selectedId);
    }
  }
}
function placeFromCurrentRay(){
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
  const data={id:crypto.randomUUID(),owner_id:playerId,owner_name:playerName,x:p.x,y:p.y,z:p.z,size,color:$("blockColor").value,collide_self:$("collideSelf").checked,collide_others:$("collideOthers").checked,physics,shape:physics?$("physicsShape").value:"cube",bounce:Number($("physicsBounce").value)||0,weight:Math.max(.1,Number($("physicsWeight").value)||1),sliding:Number($("physicsSliding").value)||0,rotX:0,rotY:0,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,vx:0,vy:0,vz:0};
  addBlock(data);channel?.send({type:"broadcast",event:"block_add",payload:data});
}
function mobileDeleteAtCenter(){
  rayFromScreenCenter();
  const hit=pickBlock(false);if(!hit)return;
  const id=hit.object.userData.blockId,b=blocks.get(id);
  if(!b||b.data.owner_id!==playerId){flashStatus("You can only delete your blocks.");return}
  removeBlock(id);channel?.send({type:"broadcast",event:"block_remove",payload:{id}});
}
function setupMobile(){
  if(!isMobile)return;
  document.body.classList.add("mobile");
  $("mobileControls").classList.remove("hidden");
  $("mobileMenu").onclick=()=>$("sideMenu").classList.toggle("mobileClosed");
  $("mobileJump").ontouchstart=e=>{e.preventDefault();keys[" "]=true};
  $("mobileJump").ontouchend=e=>{e.preventDefault();keys[" "]=false};
  $("mobileAction").onclick=mobileUse;
  $("mobileDelete").onclick=mobileDeleteAtCenter;
  $("mobileLiftUp").onclick=()=>{mobileGrabHeight+=.5};
  $("mobileLiftDown").onclick=()=>{mobileGrabHeight=Math.max(.5,mobileGrabHeight-.5)};

  const joy=$("joystick"),knob=$("joystickKnob");
  let joyId=null;
  function updateJoy(e){
    const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=e.clientX-cx,dy=e.clientY-cy;
    const max=r.width*.34,len=Math.hypot(dx,dy)||1;
    if(len>max){dx=dx/len*max;dy=dy/len*max}
    mobileMoveX=dx/max;mobileMoveY=dy/max;
    knob.style.transform=`translate(${dx}px,${dy}px)`;
  }
  joy.addEventListener("pointerdown",e=>{joyId=e.pointerId;joy.setPointerCapture(e.pointerId);updateJoy(e);e.preventDefault()});
  joy.addEventListener("pointermove",e=>{if(e.pointerId===joyId){updateJoy(e);e.preventDefault()}});
  const stopJoy=e=>{if(joyId!==null&&(e.pointerId===joyId||e.type==="pointercancel")){joyId=null;mobileMoveX=mobileMoveY=0;knob.style.transform="translate(0,0)"}};
  joy.addEventListener("pointerup",stopJoy);joy.addEventListener("pointercancel",stopJoy);

  const canvas=$("game");
  const touches=new Map();
  canvas.addEventListener("pointerdown",e=>{
    if(e.pointerType!=="touch")return;
    touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    canvas.setPointerCapture(e.pointerId);
    if(touches.size===1)mobileCameraTouch=e.pointerId;
    if(touches.size===2){
      const a=[...touches.values()];mobilePinchDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
    }
    e.preventDefault();
  },{passive:false});
  canvas.addEventListener("pointermove",e=>{
    if(e.pointerType!=="touch"||!touches.has(e.pointerId))return;
    const old=touches.get(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(touches.size===1&&e.pointerId===mobileCameraTouch&&!mobileGrabbed){
      const dx=e.clientX-old.x,dy=e.clientY-old.y;
      yaw-=dx*.008;
      pitch-=dy*.007;
      pitch=THREE.MathUtils.clamp(pitch,-.15,1.35);
    }else if(touches.size===2){
      const a=[...touches.values()],dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
      if(mobilePinchDistance>0)camDistance=THREE.MathUtils.clamp(camDistance+(mobilePinchDistance-dist)*.02,3,18);
      mobilePinchDistance=dist;
    }
    e.preventDefault();
  },{passive:false});
  const endTouch=e=>{
    touches.delete(e.pointerId);
    mobilePinchDistance=0;
    mobileCameraTouch=touches.size?[...touches.keys()][0]:null;
  };
  canvas.addEventListener("pointerup",endTouch);canvas.addEventListener("pointercancel",endTouch);
}

setMode("blocks");setupMobile();setTimeout(bootCheck,0);
