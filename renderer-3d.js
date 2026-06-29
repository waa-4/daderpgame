(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
const MODE="test3d";
const WORLD={w:3000,h:2200};
const walls=[
 {x:0,y:0,w:3000,h:55,height:180},
 {x:0,y:2145,w:3000,h:55,height:180},
 {x:0,y:0,w:55,h:2200,height:180},
 {x:2945,y:0,w:55,h:2200,height:180},
 {x:480,y:280,w:55,h:820,height:180},
 {x:480,y:1045,w:620,h:55,height:180},
 {x:1045,y:570,w:55,h:530,height:180},
 {x:1310,y:250,w:700,h:55,height:180},
 {x:1955,y:250,w:55,h:760,height:180},
 {x:1510,y:955,w:500,h:55,height:180},
 {x:2250,y:570,w:430,h:55,height:180},
 {x:2250,y:570,w:55,h:780,height:180},
 {x:850,y:1420,w:1020,h:55,height:180},
 {x:850,y:1420,w:55,h:430,height:180},
 {x:1815,y:1420,w:55,h:500,height:180},
 {x:2350,y:1680,w:430,h:55,height:180}
];
const blocks=[
 {x:360,y:1530,w:180,h:180,height:135,color:0xff5f78},
 {x:1250,y:720,w:220,h:180,height:105,color:0xffcf55},
 {x:2550,y:1180,w:180,h:240,height:165,color:0x8b72ff},
 {x:2050,y:1880,w:260,h:150,height:90,color:0x50d2a0}
];
let scene,camera,renderer,clock,host,active=false;
let yaw=.72,pitch=.82,distance=520;
let dragging=false,lastX=0,lastY=0,pinchDistance=0;
const playerMeshes=new Map();
const tempColor=new THREE.Color();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function allSolids(){return [...walls,...blocks]}
function intersects(x,z,r=22){
 return allSolids().some(o=>x+r>o.x&&x-r<o.x+o.w&&z+r>o.y&&z-r<o.y+o.h);
}
function safeSpawn(){
 const candidates=[[200,200],[2800,200],[200,2000],[2800,2000],[1450,1150]];
 for(const [x,z] of candidates)if(!intersects(x,z,40))return{x,z};
 return{x:160,z:160};
}
function makeBox(o,material){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(o.w,o.height,o.h),material);
 mesh.position.set(o.x+o.w/2,o.height/2,o.y+o.h/2);
 mesh.castShadow=false;mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
function init(){
 if(active)return true;
 if(!window.THREE){B()?.toast?.("Three.js did not load");return false}
 host=document.querySelector("#threeHost");
 host.innerHTML="";
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
 renderer.setSize(innerWidth,innerHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.domElement.id="threeCanvas";
 renderer.domElement.tabIndex=0;
 host.append(renderer.domElement);
 scene=new THREE.Scene();scene.background=new THREE.Color(0x8ec8e8);scene.fog=new THREE.Fog(0x8ec8e8,1200,3300);
 camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,1,6000);
 clock=new THREE.Clock();
 scene.add(new THREE.HemisphereLight(0xe7f7ff,0x554d3b,2.1));
 const sun=new THREE.DirectionalLight(0xffffff,1.7);sun.position.set(-700,1100,-450);scene.add(sun);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(WORLD.w,WORLD.h),new THREE.MeshLambertMaterial({color:0x69a865}));
 ground.rotation.x=-Math.PI/2;ground.position.set(WORLD.w/2,0,WORLD.h/2);ground.receiveShadow=true;scene.add(ground);
 const grid=new THREE.GridHelper(Math.max(WORLD.w,WORLD.h),30,0x315f44,0x4f8a5f);
 grid.position.set(WORLD.w/2,.8,WORLD.h/2);scene.add(grid);
 const wallMat=new THREE.MeshLambertMaterial({color:0x42536d});
 for(const w of walls)makeBox(w,wallMat);
 for(const b of blocks)makeBox(b,new THREE.MeshLambertMaterial({color:b.color}));
 const platform=new THREE.Mesh(new THREE.CylinderGeometry(115,115,18,32),new THREE.MeshLambertMaterial({color:0x4ed7ff}));
 platform.position.set(1450,9,1150);scene.add(platform);
 addEvents();active=true;resize();loop();return true;
}
function addEvents(){
 const c=renderer.domElement;
 c.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;c.setPointerCapture?.(e.pointerId)});
 c.addEventListener("pointermove",e=>{
  if(!dragging)return;
  yaw-=(e.clientX-lastX)*.006;pitch=clamp(pitch+(e.clientY-lastY)*.004,.35,1.18);lastX=e.clientX;lastY=e.clientY
 });
 c.addEventListener("pointerup",()=>dragging=false);c.addEventListener("pointercancel",()=>dragging=false);
 c.addEventListener("wheel",e=>{distance=clamp(distance+e.deltaY*.45,260,900);e.preventDefault()},{passive:false});
 c.addEventListener("touchstart",e=>{if(e.touches.length===2)pinchDistance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)},{passive:true});
 c.addEventListener("touchmove",e=>{if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);distance=clamp(distance+(pinchDistance-d)*1.2,260,900);pinchDistance=d}},{passive:true});
 addEventListener("resize",resize);
}
function resize(){
 if(!active||!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)
}
function makePlayerMesh(p){
 const group=new THREE.Group();
 const color=new THREE.Color(p.color||"#46d7ff");
 const body=new THREE.Mesh(new THREE.BoxGeometry(42,42,42),new THREE.MeshLambertMaterial({color}));
 body.position.y=21;group.add(body);
 const eyeMat=new THREE.MeshBasicMaterial({color:0x111827});
 for(const x of [-8,8]){const eye=new THREE.Mesh(new THREE.BoxGeometry(5,6,2),eyeMat);eye.position.set(x,25,-21.3);group.add(eye)}
 scene.add(group);playerMeshes.set(p.id,group);return group;
}
function syncPlayers(){
 const st=B()?.getState?.();if(!st)return;
 const ids=new Set(st.players.keys());
 for(const [id,m] of playerMeshes)if(!ids.has(id)){scene.remove(m);playerMeshes.delete(id)}
 for(const p of st.players.values()){
  const m=playerMeshes.get(p.id)||makePlayerMesh(p);
  m.position.set(p.x,0,p.y);
  const mat=m.children[0]?.material;if(mat?.color){tempColor.set(p.color||"#46d7ff");mat.color.lerp(tempColor,.25)}
  m.visible=p.alive!==false
 }
}
function getInput(){
 const keys=B().getKeys(),joy=B().getJoy();let sx=0,sz=0;
 if(keys.has("a")||keys.has("arrowleft"))sx--;if(keys.has("d")||keys.has("arrowright"))sx++;
 if(keys.has("w")||keys.has("arrowup"))sz--;if(keys.has("s")||keys.has("arrowdown"))sz++;
 sx+=joy.x;sz+=joy.y;
 const len=Math.hypot(sx,sz);if(len>.05){sx/=len;sz/=len}
 const sin=Math.sin(yaw),cos=Math.cos(yaw);
 return{x:sx*cos+sz*sin,z:sz*cos-sx*sin,active:len>.05}
}
function movePlayer(dt){
 const me=B().getMe();if(!me)return;
 const i=getInput(),speed=300;
 const nx=clamp(me.x+i.x*speed*dt,24,WORLD.w-24);
 const nz=clamp(me.y+i.z*speed*dt,24,WORLD.h-24);
 if(!intersects(nx,me.y))me.x=nx;
 if(!intersects(me.x,nz))me.y=nz;
}
function updateCamera(){
 const me=B().getMe();if(!me)return;
 const horizontal=Math.cos(pitch)*distance,vertical=Math.sin(pitch)*distance;
 camera.position.set(me.x-Math.sin(yaw)*horizontal,vertical,me.y-Math.cos(yaw)*horizontal);
 camera.lookAt(me.x,22,me.y)
}
function loop(){
 if(!active)return;
 const dt=Math.min(.04,clock.getDelta());
 movePlayer(dt);syncPlayers();updateCamera();renderer.render(scene,camera);requestAnimationFrame(loop)
}
function start(){
 const st=B()?.getState?.(),me=B()?.getMe?.();if(!st||!me)return;
 st.world={...WORLD};const spawn=safeSpawn();me.x=spawn.x;me.y=spawn.z;
 document.body.classList.add("mode-3d");
 document.querySelector("#gameCanvas").style.visibility="hidden";
 document.querySelector("#threeHost").setAttribute("aria-hidden","false");
 document.querySelector("#threeCameraHint")?.classList.remove("hidden");
 document.querySelector("#toolPanel")?.classList.add("hidden");
 document.querySelector("#roundPanel")?.classList.remove("hidden");
 document.querySelector("#roundTitle").textContent="3D TEST ZONE";
 document.querySelector("#roundTimer").textContent="3D";
 document.querySelector("#roundInfo").textContent="Ground, walls, blocks, collision, camera, and online cubes";
 init()
}
function stop(){
 if(!active&&!document.body.classList.contains("mode-3d"))return;
 active=false;document.body.classList.remove("mode-3d");
 document.querySelector("#gameCanvas")?.style.removeProperty("visibility");
 document.querySelector("#threeHost")?.setAttribute("aria-hidden","true");
 document.querySelector("#threeCameraHint")?.classList.add("hidden");
 playerMeshes.clear();
 try{renderer?.dispose()}catch{}
 if(host)host.innerHTML="";
 scene=camera=renderer=clock=null
}
function update(mode){return mode===MODE}
function action(mode){
 if(mode!==MODE)return false;
 yaw+=Math.PI/2;B()?.toast?.("Camera rotated");return true
}
function wrap(){
 const games=window.DDG_GAMES66;
 if(!games)return setTimeout(wrap,50);
 const originalSetup=games.setup?.bind(games);
 const originalUpdate=games.update?.bind(games);
 games.setup=mode=>{originalSetup?.(mode);if(mode===MODE)start();else stop()};
 games.update=(mode,dt)=>mode===MODE?(update(mode,dt),true):(originalUpdate?.(mode,dt)||false);
}
window.DDG_3D={start,stop,action,solidRects:()=>allSolids()};
wrap();
})();