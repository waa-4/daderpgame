(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
let active=false,scene,camera,renderer,clock,host,raf=0;
let yaw=.72,pitch=.78,distance=540,verticalVelocity=0,jumpHeight=0,onGround=true,currentMode="";
let dragging=false,lastX=0,lastY=0,pinchDistance=0,lastDynamicBuild=0,lastDrawingBuild=0,lastStateSig="",lastDrawSig="";
const playerMeshes=new Map();
const staticGroup=new THREE.Group(),dynamicGroup=new THREE.Group(),drawingGroup=new THREE.Group();
const geomCache=new Map(),matCache=new Map();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

function isFirstPerson(){return distance<=82}
function transformInput(x,y){
 const forward=-y,s=Math.sin(yaw),c=Math.cos(yaw);
 return{x:-x*c+forward*s,y:x*s+forward*c}
}
function cachedGeometry(w,h,d){
 const key=`${Math.round(w)}|${Math.round(h)}|${Math.round(d)}`;
 if(!geomCache.has(key))geomCache.set(key,new THREE.BoxGeometry(w,h,d));
 return geomCache.get(key)
}
function cachedMaterial(color,opacity=1){
 const key=`${String(color)}|${opacity}`;
 if(!matCache.has(key))matCache.set(key,new THREE.MeshLambertMaterial({color,transparent:opacity<1,opacity}));
 return matCache.get(key)
}
function addBox(group,x,z,w,d,h,color,opacity=1){
 const mesh=new THREE.Mesh(cachedGeometry(w,h,d),cachedMaterial(color,opacity));
 mesh.position.set(x+w/2,h/2,z+d/2);group.add(mesh);return mesh
}
function disposeObject(o){
 if(o.userData?.ownedGeometry)o.geometry?.dispose?.();
 if(o.userData?.ownedMaterial)o.material?.dispose?.();
 if(o.material?.map&&o.userData?.ownedTexture)o.material.map.dispose?.()
}
function clearGroup(group){
 while(group.children.length){const o=group.children.pop();group.remove(o);disposeObject(o)}
}
function setup(mode,use3d){currentMode=mode;if(use3d)start(mode);else stop()}
function buildStaticWorld(){
 clearGroup(staticGroup);
 const st=B().getState(),world=st.world;
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(world.w,world.h),cachedMaterial(0x6ca46a));
 ground.geometry.dispose=ground.geometry.dispose.bind(ground.geometry);ground.userData.ownedGeometry=true;
 ground.rotation.x=-Math.PI/2;ground.position.set(world.w/2,0,world.h/2);staticGroup.add(ground);
 const divisions=Math.max(12,Math.min(40,Math.round(Math.max(world.w,world.h)/150)));
 const grid=new THREE.GridHelper(Math.max(world.w,world.h),divisions,0x315f44,0x4f8a5f);
 grid.position.set(world.w/2,.7,world.h/2);grid.userData.ownedGeometry=true;grid.userData.ownedMaterial=true;staticGroup.add(grid);
 const t=45,h=150;
 addBox(staticGroup,0,0,world.w,t,h,0x41536b);addBox(staticGroup,0,world.h-t,world.w,t,h,0x41536b);
 addBox(staticGroup,0,0,t,world.h,h,0x41536b);addBox(staticGroup,world.w-t,0,t,world.h,h,0x41536b)
}
function init(){
 if(active)return true;
 if(!window.THREE){B().toast("Three.js did not load");return false}
 host=document.querySelector("#threeHost");host.innerHTML="";
 renderer=new THREE.WebGLRenderer({antialias:!window.DDG_SYSTEMS?.settings.lowPerformance,powerPreference:"high-performance"});
 const low=!!window.DDG_SYSTEMS?.settings.lowPerformance;
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,low?1:1.35));
 renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.id="threeCanvas";
 host.append(renderer.domElement);
 scene=new THREE.Scene();scene.background=new THREE.Color(0x91cae7);scene.fog=new THREE.Fog(0x91cae7,1500,5200);
 camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.5,8000);clock=new THREE.Clock();
 scene.add(new THREE.HemisphereLight(0xf0fbff,0x554d3b,1.8));
 const sun=new THREE.DirectionalLight(0xffffff,1.25);sun.position.set(-900,1400,-700);scene.add(sun);
 scene.add(staticGroup,dynamicGroup,drawingGroup);buildStaticWorld();addEvents();active=true;resize();loop();return true
}
function addEvents(){
 const c=renderer.domElement;
 c.addEventListener("contextmenu",e=>e.preventDefault());
 c.addEventListener("pointerdown",e=>{if(e.button===2)return;dragging=true;lastX=e.clientX;lastY=e.clientY;c.setPointerCapture?.(e.pointerId)});
 c.addEventListener("pointermove",e=>{if(!dragging)return;yaw-=(e.clientX-lastX)*.006;pitch=clamp(pitch+(e.clientY-lastY)*.004,.28,1.2);lastX=e.clientX;lastY=e.clientY});
 c.addEventListener("pointerup",()=>dragging=false);c.addEventListener("pointercancel",()=>dragging=false);c.addEventListener("pointerleave",()=>dragging=false);
 c.addEventListener("wheel",e=>{distance=clamp(distance+e.deltaY*.5,35,950);e.preventDefault()},{passive:false});
 c.addEventListener("touchstart",e=>{if(e.touches.length===2)pinchDistance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)},{passive:true});
 c.addEventListener("touchmove",e=>{if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);distance=clamp(distance+(pinchDistance-d)*1.25,35,950);pinchDistance=d}},{passive:true});
 addEventListener("resize",resize)
}
function resize(){if(!active)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
function playerMesh(p){
 const g=new THREE.Group();
 const body=new THREE.Mesh(cachedGeometry(42,42,42),new THREE.MeshLambertMaterial({color:p.color||"#46d7ff"}));body.position.y=21;body.userData.ownedMaterial=true;g.add(body);
 const eyeMat=cachedMaterial(0x111827);
 for(const x of [-8,8]){const e=new THREE.Mesh(cachedGeometry(5,6,2),eyeMat);e.position.set(x,25,-21.2);g.add(e)}
 const cv=document.createElement("canvas");cv.width=256;cv.height=64;const tex=new THREE.CanvasTexture(cv);
 const spriteMat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});const sprite=new THREE.Sprite(spriteMat);
 sprite.position.y=78;sprite.scale.set(150,38,1);sprite.visible=false;g.add(sprite);
 g.userData={body,cv,tex,sprite,spriteMat,last:""};scene.add(g);playerMeshes.set(p.id,g);return g
}
function removePlayer(id,m){scene.remove(m);m.userData.body?.material?.dispose?.();m.userData.tex?.dispose?.();m.userData.spriteMat?.dispose?.();playerMeshes.delete(id)}
function syncPlayers(){
 const st=B().getState(),me=B().getMe(),ids=new Set(st.players.keys());
 for(const [id,m] of [...playerMeshes])if(!ids.has(id))removePlayer(id,m);
 for(const p of st.players.values()){
  const g=playerMeshes.get(p.id)||playerMesh(p);
  let py=p.id===me.id?jumpHeight:0,z=p.y;if(currentMode==="platform"){py=Math.max(0,1220-p.y);z=700}
  g.position.set(p.x,py,z);g.rotation.y=yaw+Math.PI;
  if(g.userData.body.material.color.getStyle()!==p.color)g.userData.body.material.color.set(p.color||"#46d7ff");
  g.visible=p.alive!==false&&!(p.id===me.id&&isFirstPerson());
  const msg=p.msgUntil>Date.now()?p.msg:"",s=g.userData.sprite;
  s.visible=!!msg&&window.DDG_SYSTEMS?.settings.showChatBubbles!==false&&!isFirstPerson();
  if(msg&&g.userData.last!==msg){const c=g.userData.cv.getContext("2d");c.clearRect(0,0,256,64);c.fillStyle="#07111fee";c.fillRect(0,0,256,64);c.fillStyle="#fff";c.font="bold 22px Arial";c.textAlign="center";c.textBaseline="middle";c.fillText(msg.length>28?msg.slice(0,27)+"…":msg,128,32);g.userData.tex.needsUpdate=true;g.userData.last=msg}
 }
}
function stateSignature(){
 const d=B().get3DData(),gd=window.DDG_GAMES66?.getRenderData?.(),md=window.DDG_MACHINE?.getRenderData?.();
 return [
  d.mode,d.round?.mapIndex,d.creator?.objects?.length||0,d.teamBase?.red,d.teamBase?.blue,
  gd?.walls?.length||0,gd?.loot?.length||0,gd?.triangles?.length||0,gd?.userPlatforms?.length||0,
  md?.parts?.length||0,md?.wires?.length||0
 ].join("|")
}
function rebuildDynamic(force=false){
 const now=performance.now(),sig=stateSignature();
 if(!force&&sig===lastStateSig&&now-lastDynamicBuild<650)return;
 lastStateSig=sig;lastDynamicBuild=now;clearGroup(dynamicGroup);
 const d=B().get3DData(),mode=d.mode;
 if(mode==="evil")for(const w of d.evilWalls||[])addBox(dynamicGroup,w.x,w.y,w.w,w.h,170,0x302f3a);
 if(mode==="warfare"){addBox(dynamicGroup,80,d.world.h/2-180,170,360,130,0xa52f3f);addBox(dynamicGroup,d.world.w-250,d.world.h/2-180,170,360,130,0x3266a5)}
 if(mode==="create")for(const o of d.creator?.objects||[])addBox(dynamicGroup,o.x-o.w/2,o.y-o.h/2,o.w,o.h,o.type==="block"?Math.max(35,o.h*.55):30,o.color||"#46d7ff",o.type==="spawn"?.5:1);
 const gd=window.DDG_GAMES66?.getRenderData?.();
 if(mode==="meat"&&gd){
  for(const w of gd.walls||[])addBox(dynamicGroup,w.x,w.y,w.w,w.h,150,0x604a34);
  for(const l of gd.loot||[])addBox(dynamicGroup,l.x-25,l.y-25,50,50,l.type==="metal"?80:60,l.type==="metal"?0x7e8b91:0x95643d);
  for(const t of gd.triangles||[]){const cone=new THREE.Mesh(new THREE.ConeGeometry(28,70,3),cachedMaterial(0xffe11f));cone.userData.ownedGeometry=true;cone.position.set(t.x,35,t.y);cone.rotation.y=Math.PI;dynamicGroup.add(cone)}
 }
 if(mode==="platform"&&gd)for(const p of [...(gd.platforms||[]),...(gd.userPlatforms||[])])addBox(dynamicGroup,p.x,650,p.w,80,26,0x50d4c9);
 const md=window.DDG_MACHINE?.getRenderData?.();
 if(mode==="machine"&&md)for(const p of md.parts||[])addBox(dynamicGroup,p.x-p.w/2,p.y-p.h/2,p.w,p.h,55,p.value?p.color:"#24313d")
}
function rebuildDrawings(force=false){
 const now=performance.now(),strokes=B().get3DData().strokes||[];
 const cap=window.DDG_SYSTEMS?.settings.lowPerformance?500:1200;
 const recent=strokes.slice(-cap),sig=`${recent.length}|${recent.at(-1)?.id||""}`;
 if(!force&&sig===lastDrawSig&&now-lastDrawingBuild<1000)return;
 lastDrawSig=sig;lastDrawingBuild=now;clearGroup(drawingGroup);
 if(!recent.length)return;
 const positions=[],colors=[];
 for(const s of recent){
  positions.push(s.x1,3,s.y1,s.x2,3,s.y2);
  const c=new THREE.Color(s.color||"#ff4fc3");colors.push(c.r,c.g,c.b,c.r,c.g,c.b)
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
 const mat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.95});
 const lines=new THREE.LineSegments(geo,mat);lines.userData.ownedGeometry=true;lines.userData.ownedMaterial=true;drawingGroup.add(lines)
}
function updateMovingObjects(){
 const mode=B().getMode(),gd=window.DDG_GAMES66?.getRenderData?.();
 if(mode!=="meat"||!gd)return;
 // Rebuild less often; hunter positions are cheap enough at 5 fps and still look acceptable.
 if(performance.now()-lastDynamicBuild>200)rebuildDynamic(true)
}
function updateCamera(){
 const me=B().getMe();if(!me)return;
 let py=22+jumpHeight,z=me.y;if(currentMode==="platform"){py=Math.max(22,1242-me.y);z=700}
 const f=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 if(isFirstPerson()){camera.position.set(me.x,py+18,z);camera.lookAt(me.x+f.x*250,py+12,z+f.z*250)}
 else{const h=Math.cos(pitch)*distance,v=Math.sin(pitch)*distance;camera.position.set(me.x-Math.sin(yaw)*h,py+v,z-Math.cos(yaw)*h);camera.lookAt(me.x,py,z)}
}
function loop(){
 if(!active)return;
 const dt=Math.min(.04,clock.getDelta());verticalVelocity-=900*dt;jumpHeight+=verticalVelocity*dt;if(jumpHeight<=0){jumpHeight=0;verticalVelocity=0;onGround=true}
 rebuildDynamic();rebuildDrawings();updateMovingObjects();syncPlayers();updateCamera();renderer.render(scene,camera);raf=requestAnimationFrame(loop)
}
function start(mode){
 currentMode=mode;document.body.classList.add("mode-3d");document.querySelector("#gameCanvas").style.visibility="hidden";
 document.querySelector("#threeHost").setAttribute("aria-hidden","false");document.querySelector("#threeCameraHint").classList.remove("hidden");
 jumpHeight=0;verticalVelocity=0;onGround=true;lastStateSig="";lastDrawSig="";init();rebuildDynamic(true);rebuildDrawings(true)
}
function stop(){
 if(!active&&!document.body.classList.contains("mode-3d"))return;
 active=false;cancelAnimationFrame(raf);document.body.classList.remove("mode-3d");document.querySelector("#gameCanvas")?.style.removeProperty("visibility");
 document.querySelector("#threeHost")?.setAttribute("aria-hidden","true");document.querySelector("#threeCameraHint")?.classList.add("hidden");
 for(const [id,m] of [...playerMeshes])removePlayer(id,m);
 clearGroup(staticGroup);clearGroup(dynamicGroup);clearGroup(drawingGroup);
 try{renderer?.renderLists?.dispose?.();renderer?.dispose?.();renderer?.forceContextLoss?.()}catch{}
 if(host)host.innerHTML="";scene=camera=renderer=clock=null
}
function jump(mode,use3d){if(!use3d)return false;if(onGround){verticalVelocity=430;onGround=false}return true}
function action(){return false}
window.DDG_3D={setup,start,stop,jump,action,transformInput,isFirstPerson};
})();