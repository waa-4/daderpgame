(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
let scene,camera,renderer,clock,host,active=false,raf=0;
let yaw=.65,pitch=.72,distance=520,cameraMode="third",jumpY=0,vy=0,onGround=true;
let dragging=false,lastX=0,lastY=0,pointerMoved=false,pinching=false,pinchDistance=0;const touchPointers=new Map();
const staticGroup=new THREE.Group(),dynamicGroup=new THREE.Group(),fxGroup=new THREE.Group();
const playerMeshes=new Map(),geomCache=new Map(),matCache=new Map();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function geom(w,h,d){const k=`${w}|${h}|${d}`;if(!geomCache.has(k))geomCache.set(k,new THREE.BoxGeometry(w,h,d));return geomCache.get(k)}
function mat(c,o=1){const k=`${c}|${o}`;if(!matCache.has(k))matCache.set(k,new THREE.MeshLambertMaterial({color:c,transparent:o<1,opacity:o}));return matCache.get(k)}
function box(g,x,z,w,d,h,c,o=1){const m=new THREE.Mesh(geom(w,h,d),mat(c,o));m.position.set(x+w/2,h/2,z+d/2);g.add(m);return m}
function clear(g){while(g.children.length)g.remove(g.children[g.children.length-1])}
function transformInput(x,y){const f=-y,s=Math.sin(yaw),c=Math.cos(yaw);return{x:-x*c+f*s,y:x*s+f*c}}
function getCameraMode(){return cameraMode}
function getYaw(){return yaw}
function getJumpY(){return jumpY}
function cycleCamera(){cameraMode=cameraMode==="third"?"first":"third";return cameraMode}
function jump(){if(onGround){vy=430;onGround=false}return true}
function setup(mode){
 const overlay=document.querySelector("#gameLoadingOverlay");
 const text=document.querySelector("#gameLoadingText");
 if(overlay)overlay.classList.remove("hidden");
 if(text)text.textContent="Loading 3D world…";
 try{start(mode)}
 catch(err){
  console.error("3D startup failed:",err);
  if(text)text.textContent="3D failed to start — refresh or check the console";
  B()?.toast?.("3D startup failed");
 }
}
function start(mode){stop();firstFrame=true;host=document.querySelector('#threeHost');host.innerHTML='';renderer=new THREE.WebGLRenderer({antialias:!window.DDG_SYSTEMS?.settings.lowPerformance,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,window.DDG_SYSTEMS?.settings.lowPerformance?1:1.2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.id='threeCanvas';host.append(renderer.domElement);scene=new THREE.Scene();scene.background=new THREE.Color(0x91cae7);scene.fog=new THREE.Fog(0x91cae7,1800,5200);camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.5,9000);clock=new THREE.Clock();scene.add(new THREE.HemisphereLight(0xf0fbff,0x554d3b,1.8));const sun=new THREE.DirectionalLight(0xffffff,1.25);sun.position.set(-800,1300,-600);scene.add(sun);scene.add(staticGroup,dynamicGroup,fxGroup);buildBase();addEvents();active=true;document.body.classList.add('mode-3d');loop()}
function buildBase(){clear(staticGroup);const st=B().getState(),w=st.world.w,h=st.world.h;const ground=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat(0x6aa268));ground.rotation.x=-Math.PI/2;ground.position.set(w/2,0,h/2);staticGroup.add(ground);const grid=new THREE.GridHelper(Math.max(w,h),Math.max(12,Math.round(Math.max(w,h)/160)),0x315f44,0x4f8a5f);grid.position.set(w/2,.6,h/2);staticGroup.add(grid);const t=45;box(staticGroup,0,0,w,t,150,0x33465d);box(staticGroup,0,h-t,w,t,150,0x33465d);box(staticGroup,0,0,t,h,150,0x33465d);box(staticGroup,w-t,0,t,h,150,0x33465d)}
function groundPoint(clientX,clientY){
 const rect=renderer.domElement.getBoundingClientRect();
 const mouse=new THREE.Vector2(((clientX-rect.left)/rect.width)*2-1,-((clientY-rect.top)/rect.height)*2+1);
 const ray=new THREE.Raycaster();ray.setFromCamera(mouse,camera);
 const p=new THREE.Vector3();
 return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),p)?{x:p.x,y:p.z}:null
}
function addEvents(){
 const c=renderer.domElement;
 const pointerDistance=()=>{const pts=[...touchPointers.values()];return pts.length<2?0:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)};
 c.addEventListener("contextmenu",e=>e.preventDefault());
 c.addEventListener("pointerdown",e=>{
  if(e.button===2)return;
  if(e.pointerType==="touch"){
   touchPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(touchPointers.size===2){
    pinching=true;pinchDistance=pointerDistance();dragging=false;pointerMoved=true;
    c.setPointerCapture?.(e.pointerId);e.preventDefault();return
   }
  }
  if(window.DDG_PHYSICS95?.pointerDown?.(e,renderer,camera)){c.setPointerCapture?.(e.pointerId);return}
  dragging=true;pointerMoved=false;lastX=e.clientX;lastY=e.clientY;c.setPointerCapture?.(e.pointerId)
 });
 c.addEventListener("pointermove",e=>{
  if(e.pointerType==="touch"&&touchPointers.has(e.pointerId)){
   touchPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pinching&&touchPointers.size>=2){
    const now=pointerDistance(),delta=now-pinchDistance;
    distance=clamp(distance-delta*1.35,70,900);pinchDistance=now;
    if(distance<95)cameraMode="first";else if(cameraMode==="first"&&distance>130)cameraMode="third";
    e.preventDefault();return
   }
  }
  if(window.DDG_PHYSICS95?.pointerMove?.(e,renderer,camera))return;
  if(!dragging)return;
  const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(dx)+Math.abs(dy)>3)pointerMoved=true;
  yaw-=dx*.006;pitch=clamp(pitch+dy*.004,.2,1.28);lastX=e.clientX;lastY=e.clientY
 });
 const finish=e=>{
  if(e?.pointerType==="touch")touchPointers.delete(e.pointerId);
  if(pinching){
   if(touchPointers.size<2){pinching=false;pinchDistance=0;dragging=false}
   return
  }
  if(window.DDG_PHYSICS95?.pointerUp?.())return;
  if(e&&!pointerMoved){const p=groundPoint(e.clientX,e.clientY);if(p)window.DDG_GAMES3D?.pointerGround?.(B().getMode(),p.x,p.y)}
  dragging=false
 };
 c.addEventListener("pointerup",finish);c.addEventListener("pointercancel",finish);
 c.addEventListener("wheel",e=>{
  distance=clamp(distance+e.deltaY*.45,70,900);
  if(distance<95)cameraMode="first";else if(cameraMode==="first"&&distance>130)cameraMode="third";
  e.preventDefault()
 },{passive:false});
 addEventListener("resize",()=>{if(!active)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)})
}
function playerMesh(p){
 const g=new THREE.Group(),body=new THREE.Mesh(geom(42,42,42),new THREE.MeshLambertMaterial({color:p.color||"#46d7ff"}));
 body.position.y=21;body.userData.body=true;g.add(body);
 window.DDG_AVATAR_PAINT?.decoratePlayer?.(g,p,{THREE,geom,mat});
 scene.add(g);playerMeshes.set(p.id,g);return g
}
function syncPlayers(){
 const st=B().getState(),me=B().getMe(),ids=new Set(st.players.keys());
 for(const [id,m] of [...playerMeshes])if(!ids.has(id)){scene.remove(m);playerMeshes.delete(id)}
 for(const p of st.players.values()){
  const g=playerMeshes.get(p.id)||playerMesh(p);
  const baseHeight=window.DDG_GAMES3D?.getPlayerHeight?.(B().getMode(),p)||0;
  g.position.set(p.x,baseHeight+(p.id===me.id?jumpY:(p.jumpY||0)),p.y);g.rotation.y=(p.id===me.id?yaw:(p.rot||0))+Math.PI;
  const body=g.children.find(c=>c.userData?.body);if(body)body.material.color.set(p.color||"#46d7ff");
  window.DDG_AVATAR_PAINT?.refreshPlayer?.(g,p,{THREE,geom,mat});
  g.visible=p.id!==me.id||cameraMode!=="first"
 }
}
function updateCamera(){
 const me=B().getMe();if(!me)return;
 const py=22+jumpY+(window.DDG_GAMES3D?.getPlayerHeight?.(B().getMode(),me)||0),f=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 if(cameraMode==="first"){
  const vertical=(.72-pitch)*1.45;
  camera.position.set(me.x,py+18,me.y);
  camera.lookAt(me.x+f.x*250,py+12+vertical*250,me.y+f.z*250)
 }else{
  const h=Math.cos(pitch)*distance,v=Math.sin(pitch)*distance;
  camera.position.set(me.x-Math.sin(yaw)*h,Math.max(35,py+v),me.y-Math.cos(yaw)*h);
  camera.lookAt(me.x,py,me.y)
 }
}
function collision(mode,nx,ny){const st=B().getState(),me=B().getMe(),r=22,rects=[{x:0,y:0,w:st.world.w,h:45},{x:0,y:st.world.h-45,w:st.world.w,h:45},{x:0,y:0,w:45,h:st.world.h},{x:st.world.w-45,y:0,w:45,h:st.world.h},...(window.DDG_GAMES3D?.solidRects?.(mode)||[])];return rects.some(o=>nx+r>o.x&&nx-r<o.x+o.w&&ny+r>o.y&&ny-r<o.y+o.h)?{x:me.x,y:me.y}:{x:nx,y:ny}}
let firstFrame=true;
function loop(){if(!active)return;const dt=Math.min(.04,clock.getDelta());vy-=900*dt;jumpY+=vy*dt;if(jumpY<=0){jumpY=0;vy=0;onGround=true}clear(dynamicGroup);clear(fxGroup);window.DDG_GAMES3D?.render?.(dynamicGroup,fxGroup,{box,geom,mat,THREE});window.DDG_PHYSICS95?.render?.(dynamicGroup,fxGroup,{box,geom,mat,THREE});window.DDG_YCSN95?.render?.(dynamicGroup,fxGroup,{box,geom,mat,THREE});window.DDG_AVATAR_PAINT?.renderPaint?.(fxGroup,{THREE});syncPlayers();updateCamera();renderer.render(scene,camera);
 if(firstFrame){
  firstFrame=false;
  document.querySelector("#gameLoadingOverlay")?.classList.add("hidden");
 }
 raf=requestAnimationFrame(loop)}
function stop(){
 if(!active){
  document.querySelector("#gameLoadingOverlay")?.classList.add("hidden");
  return
 }
 active=false;cancelAnimationFrame(raf);document.body.classList.remove('mode-3d');for(const m of playerMeshes.values())scene.remove(m);playerMeshes.clear();clear(staticGroup);clear(dynamicGroup);clear(fxGroup);try{renderer.renderLists.dispose();renderer.dispose();renderer.forceContextLoss()}catch{}if(host)host.innerHTML=''}
window.DDG_CORE3D={setup,start,stop,jump,transformInput,collision,getCameraMode,getYaw,getJumpY,cycleCamera,groundPoint};
})();