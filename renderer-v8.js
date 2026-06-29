(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
let active=false,scene,camera,renderer,clock,host;
let yaw=.72,pitch=.78,distance=540,verticalVelocity=0,jumpHeight=0,onGround=true;
let dragging=false,lastX=0,lastY=0,pinchDistance=0,currentMode="";
const meshes=new Map(),dynamic=new THREE.Group(),drawingGroup=new THREE.Group();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const colorOf=v=>new THREE.Color(v||"#46d7ff");

function isFirstPerson(){return distance<=82}
function transformInput(x,y){
 const forward=-y,s=Math.sin(yaw),c=Math.cos(yaw);
 // A/D corrected: A goes camera-left and D goes camera-right.
 return{x:-x*c+forward*s,y:x*s+forward*c}
}
function setup(mode,use3d){
 currentMode=mode;
 if(use3d)start(mode);else stop()
}
function clearGroup(g){while(g.children.length){const o=g.children.pop();o.geometry?.dispose?.();o.material?.dispose?.()}}
function box(x,z,w,d,h,color,opacity=1){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color,transparent:opacity<1,opacity}));
 m.position.set(x+w/2,h/2,z+d/2);dynamic.add(m);return m
}
function addBaseWorld(){
 const st=B().getState(),world=st.world;
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(world.w,world.h),new THREE.MeshLambertMaterial({color:0x6ca46a}));
 ground.rotation.x=-Math.PI/2;ground.position.set(world.w/2,0,world.h/2);scene.add(ground);
 const grid=new THREE.GridHelper(Math.max(world.w,world.h),Math.max(12,Math.round(Math.max(world.w,world.h)/120)),0x315f44,0x4f8a5f);
 grid.position.set(world.w/2,.7,world.h/2);scene.add(grid);
 const t=45,h=150;
 box(0,0,world.w,t,h,0x41536b);box(0,world.h-t,world.w,t,h,0x41536b);
 box(0,0,t,world.h,h,0x41536b);box(world.w-t,0,t,world.h,h,0x41536b)
}
function init(){
 if(active)return true;
 if(!window.THREE){B().toast("Three.js did not load");return false}
 host=document.querySelector("#threeHost");host.innerHTML="";
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.id="threeCanvas";host.append(renderer.domElement);
 scene=new THREE.Scene();scene.background=new THREE.Color(0x91cae7);scene.fog=new THREE.Fog(0x91cae7,1500,5200);
 camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.5,8000);clock=new THREE.Clock();
 scene.add(new THREE.HemisphereLight(0xf0fbff,0x554d3b,2.1));
 const sun=new THREE.DirectionalLight(0xffffff,1.5);sun.position.set(-900,1400,-700);scene.add(sun);
 scene.add(dynamic);scene.add(drawingGroup);addBaseWorld();addEvents();active=true;resize();loop();return true
}
function addEvents(){
 const c=renderer.domElement;
 c.addEventListener("contextmenu",e=>e.preventDefault());
 c.addEventListener("pointerdown",e=>{
  if(e.button===2)return; // right-click intentionally does nothing
  dragging=true;lastX=e.clientX;lastY=e.clientY;c.setPointerCapture?.(e.pointerId)
 });
 c.addEventListener("pointermove",e=>{if(!dragging)return;yaw-=(e.clientX-lastX)*.006;pitch=clamp(pitch+(e.clientY-lastY)*.004,.28,1.2);lastX=e.clientX;lastY=e.clientY});
 c.addEventListener("pointerup",()=>dragging=false);c.addEventListener("pointercancel",()=>dragging=false);c.addEventListener("pointerleave",()=>dragging=false);
 c.addEventListener("wheel",e=>{distance=clamp(distance+e.deltaY*.5,35,950);e.preventDefault()},{passive:false});
 c.addEventListener("touchstart",e=>{if(e.touches.length===2)pinchDistance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)},{passive:true});
 c.addEventListener("touchmove",e=>{if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);distance=clamp(distance+(pinchDistance-d)*1.25,35,950);pinchDistance=d}},{passive:true});
 addEventListener("resize",resize)
}
function resize(){if(!active)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
function playerMesh(p){
 const g=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(42,42,42),new THREE.MeshLambertMaterial({color:colorOf(p.color)}));body.position.y=21;g.add(body);
 const eyeMat=new THREE.MeshBasicMaterial({color:0x111827});
 for(const x of [-8,8]){const e=new THREE.Mesh(new THREE.BoxGeometry(5,6,2),eyeMat);e.position.set(x,25,-21.2);g.add(e)}
 const cv=document.createElement("canvas");cv.width=256;cv.height=64;const tex=new THREE.CanvasTexture(cv);
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sprite.position.y=78;sprite.scale.set(150,38,1);sprite.visible=false;g.add(sprite);
 g.userData={body,cv,tex,sprite,last:""};scene.add(g);meshes.set(p.id,g);return g
}
function syncPlayers(){
 const st=B().getState(),me=B().getMe(),ids=new Set(st.players.keys());
 for(const [id,m] of meshes)if(!ids.has(id)){scene.remove(m);meshes.delete(id)}
 for(const p of st.players.values()){
  const g=meshes.get(p.id)||playerMesh(p);
  let py=p.id===me.id?jumpHeight:0,z=p.y;
  if(currentMode==="platform"){py=Math.max(0,1220-p.y);z=700}
  g.position.set(p.x,py,z);g.rotation.y=yaw+Math.PI;
  g.userData.body.material.color.set(p.color||"#46d7ff");
  g.visible=p.alive!==false && !(p.id===me.id&&isFirstPerson());
  const msg=p.msgUntil>Date.now()?p.msg:"",s=g.userData.sprite;
  s.visible=!!msg&&window.DDG_SYSTEMS?.settings.showChatBubbles!==false&&!isFirstPerson();
  if(msg&&g.userData.last!==msg){const c=g.userData.cv.getContext("2d");c.clearRect(0,0,256,64);c.fillStyle="#07111fee";c.fillRect(0,0,256,64);c.fillStyle="#fff";c.font="bold 22px Arial";c.textAlign="center";c.textBaseline="middle";c.fillText(msg.length>28?msg.slice(0,27)+"…":msg,128,32);g.userData.tex.needsUpdate=true;g.userData.last=msg}
 }
}
function line3D(a,b,color,size=4,height=2){
 const pts=[new THREE.Vector3(a.x,height,a.y),new THREE.Vector3(b.x,height,b.y)];
 const geo=new THREE.BufferGeometry().setFromPoints(pts),mat=new THREE.LineBasicMaterial({color:color||"#ff4fc3",linewidth:size});
 drawingGroup.add(new THREE.Line(geo,mat))
}
function rebuildWorld(){
 clearGroup(dynamic);clearGroup(drawingGroup);addBaseWorld();
 const d=B().get3DData(),mode=d.mode;
 if(mode==="evil")for(const w of d.evilWalls||[])box(w.x,w.y,w.w,w.h,170,0x302f3a);
 if(mode==="warfare"){box(80,d.world.h/2-180,170,360,130,0xa52f3f);box(d.world.w-250,d.world.h/2-180,170,360,130,0x3266a5)}
 if(mode==="create")for(const o of d.creator?.objects||[])box(o.x-o.w/2,o.y-o.h/2,o.w,o.h,o.type==="block"?Math.max(35,o.h*.55):30,o.color||"#46d7ff",o.type==="spawn"?.5:1);
 const gd=window.DDG_GAMES66?.getRenderData?.();
 if(mode==="meat"&&gd){
  for(const w of gd.walls||[])box(w.x,w.y,w.w,w.h,150,0x604a34);
  for(const l of gd.loot||[])box(l.x-25,l.y-25,50,50,l.type==="metal"?80:60,l.type==="metal"?0x7e8b91:0x95643d);
  for(const t of gd.triangles||[]){const cone=new THREE.Mesh(new THREE.ConeGeometry(28,70,3),new THREE.MeshLambertMaterial({color:0xffe11f}));cone.position.set(t.x,35,t.y);cone.rotation.y=Math.PI;dynamic.add(cone)}
 }
 if(mode==="platform"&&gd){for(const p of [...(gd.platforms||[]),...(gd.userPlatforms||[])])box(p.x,650,p.w,80,26,0x50d4c9)}
 const md=window.DDG_MACHINE?.getRenderData?.();
 if(mode==="machine"&&md){
  for(const p of md.parts||[])box(p.x-p.w/2,p.y-p.h/2,p.w,p.h,55,p.value?p.color:"#24313d");
  for(const w of md.wires||[]){const a=md.parts.find(p=>p.id===w.a),b=md.parts.find(p=>p.id===w.b);if(a&&b)line3D(a,b,a.value?"#ffe45e":"#4f6f88",4,62)}
 }
 for(const s of d.strokes||[])line3D({x:s.x1,y:s.y1},{x:s.x2,y:s.y2},s.color,s.size,3)
}
let lastRebuild=0;
function updateCamera(){
 const me=B().getMe();if(!me)return;
 let py=22+jumpHeight,z=me.y;if(currentMode==="platform"){py=Math.max(22,1242-me.y);z=700}
 const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 if(isFirstPerson()){
  camera.position.set(me.x,py+18,z);camera.lookAt(me.x+forward.x*250,py+12,z+forward.z*250)
 }else{
  const horizontal=Math.cos(pitch)*distance,vertical=Math.sin(pitch)*distance;
  camera.position.set(me.x-Math.sin(yaw)*horizontal,py+vertical,z-Math.cos(yaw)*horizontal);
  camera.lookAt(me.x,py,z)
 }
}
function loop(){
 if(!active)return;
 const dt=Math.min(.04,clock.getDelta());verticalVelocity-=900*dt;jumpHeight+=verticalVelocity*dt;if(jumpHeight<=0){jumpHeight=0;verticalVelocity=0;onGround=true}
 if(performance.now()-lastRebuild>180){rebuildWorld();lastRebuild=performance.now()}
 syncPlayers();updateCamera();renderer.render(scene,camera);requestAnimationFrame(loop)
}
function start(mode){
 currentMode=mode;document.body.classList.add("mode-3d");document.querySelector("#gameCanvas").style.visibility="hidden";
 document.querySelector("#threeHost").setAttribute("aria-hidden","false");document.querySelector("#threeCameraHint").classList.remove("hidden");
 jumpHeight=0;verticalVelocity=0;onGround=true;init()
}
function stop(){
 if(!active&&!document.body.classList.contains("mode-3d"))return;
 active=false;document.body.classList.remove("mode-3d");document.querySelector("#gameCanvas")?.style.removeProperty("visibility");
 document.querySelector("#threeHost")?.setAttribute("aria-hidden","true");document.querySelector("#threeCameraHint")?.classList.add("hidden");
 for(const m of meshes.values())scene?.remove(m);meshes.clear();try{renderer?.dispose()}catch{};if(host)host.innerHTML="";scene=camera=renderer=clock=null
}
function jump(mode,use3d){if(!use3d)return false;if(onGround){verticalVelocity=430;onGround=false}return true}
function action(){return false}
window.DDG_3D={setup,start,stop,jump,action,transformInput,isFirstPerson};
})();