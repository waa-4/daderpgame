(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
let active=false,objects=[],drag=null,lastPointer=null,meshById=new Map(),lastSync=0;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function spawn(type){
 const me=B().getMe(),o={id:crypto.randomUUID(),type,x:me.x+80+Math.random()*60,z:me.y+40,y:type==="ball"?55:35,vx:0,vy:0,vz:0,size:type==="heavy"?90:type==="explosive"?65:55,mass:type==="heavy"?5:1,color:type==="explosive"?"#ff5b5b":type==="ball"?"#5bc8ff":"#d9a85b"};
 objects.push(o);sync();status(`Spawned ${type}`)
}
function status(t){const e=document.querySelector("#physicsStatus");if(e)e.textContent=t}
function setup(mode){
 active=mode==="physics";if(!active)return;
 const st=B().getState(),me=B().getMe();st.world={w:3200,h:2200};me.x=1550;me.y=1100;
 if(!objects.length)objects=[{id:crypto.randomUUID(),type:"cube",x:1500,z:1050,y:35,vx:0,vy:0,vz:0,size:60,mass:1,color:"#d9a85b"}];
 wireUI();sync()
}
function wireUI(){
 document.querySelector("#physicsPanel")?.classList.remove("hidden");
 const bind=(id,type)=>{const e=document.querySelector(id);if(e)e.onclick=()=>spawn(type)};
 bind("#physicsCubeBtn","cube");bind("#physicsBallBtn","ball");bind("#physicsHeavyBtn","heavy");bind("#physicsExplodeBtn","explosive");
 const reset=document.querySelector("#physicsResetBtn");if(reset)reset.onclick=()=>{objects=[];sync();status("Objects reset")}
}
function update(mode,dt){
 if(mode!=="physics")return false;
 const world=B().getWorld();
 for(const o of objects){
  if(drag?.id===o.id)continue;
  o.vy-=700*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.z+=o.vz*dt;
  o.vx*=Math.pow(.22,dt);o.vz*=Math.pow(.22,dt);
  const floor=o.size/2;if(o.y<floor){o.y=floor;o.vy=Math.abs(o.vy)*.28;if(Math.abs(o.vy)<18)o.vy=0}
  if(o.x<70||o.x>world.w-70){o.x=clamp(o.x,70,world.w-70);o.vx*=-.55}
  if(o.z<70||o.z>world.h-70){o.z=clamp(o.z,70,world.h-70);o.vz*=-.55}
 }
 // Very lightweight object-object separation.
 for(let i=0;i<objects.length;i++)for(let j=i+1;j<objects.length;j++){
  const a=objects[i],b=objects[j],dx=b.x-a.x,dz=b.z-a.z,min=(a.size+b.size)*.42,d=Math.hypot(dx,dz)||1;
  if(d<min&&Math.abs(a.y-b.y)<Math.max(a.size,b.size)){
   const push=(min-d)/2;a.x-=dx/d*push;a.z-=dz/d*push;b.x+=dx/d*push;b.z+=dz/d*push
  }
 }
 if(performance.now()-lastSync>350){sync();lastSync=performance.now()}
 return true
}
function rayObject(e,renderer,camera){
 const rect=renderer.domElement.getBoundingClientRect(),m=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1),ray=new THREE.Raycaster();
 ray.setFromCamera(m,camera);const hits=ray.intersectObjects([...meshById.values()],false);return hits[0]||null
}
function ground(e,renderer,camera,y=0){
 const rect=renderer.domElement.getBoundingClientRect(),m=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1),ray=new THREE.Raycaster(),p=new THREE.Vector3();
 ray.setFromCamera(m,camera);return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-y),p)?p:null
}
function pointerDown(e,renderer,camera){
 if(!active)return false;const h=rayObject(e,renderer,camera);if(!h)return false;
 const id=h.object.userData.physicsId,o=objects.find(q=>q.id===id);if(!o)return false;
 drag={id,renderer,camera,lastX:o.x,lastZ:o.z,lastTime:performance.now()};lastPointer={x:o.x,z:o.z,time:performance.now()};status(`Dragging ${o.type}`);return true
}
function pointerMove(e,renderer,camera){
 if(!drag)return false;const p=ground(e,renderer,camera,55);if(!p)return true;
 const o=objects.find(q=>q.id===drag.id);if(!o)return true;
 const now=performance.now(),dt=Math.max(.016,(now-lastPointer.time)/1000);
 o.x=p.x;o.z=p.z;o.y=Math.max(o.size/2,70);o.vx=(p.x-lastPointer.x)/dt;o.vz=(p.z-lastPointer.z)/dt;o.vy=0;
 lastPointer={x:p.x,z:p.z,time:now};return true
}
function pointerUp(){
 if(!drag)return false;const o=objects.find(q=>q.id===drag.id);
 if(o?.type==="explosive"){
  for(const q of objects)if(q.id!==o.id){const dx=q.x-o.x,dz=q.z-o.z,d=Math.hypot(dx,dz)||1;if(d<420){q.vx+=dx/d*(620-d);q.vz+=dz/d*(620-d);q.vy+=260}}
  objects=objects.filter(q=>q.id!==o.id);status("BOOM!")
 }
 drag=null;sync();return true
}
function render(group,fx,api){
 if(!active)return;meshById.clear();const T=api.THREE;
 // Spawn pad plaza.
 api.box(group,1300,900,600,400,18,0x3d4b5e);
 for(const o of objects){
  let mesh;
  if(o.type==="ball")mesh=new T.Mesh(new T.SphereGeometry(o.size/2,14,10),api.mat(o.color));
  else mesh=new T.Mesh(api.geom(o.size,o.size,o.size),api.mat(o.color));
  mesh.position.set(o.x,o.y,o.z);mesh.rotation.y=(o.x+o.z)*.002;mesh.userData.physicsId=o.id;group.add(mesh);meshById.set(o.id,mesh)
 }
}
function sync(){B().getNet()?.send("physics95",{kind:"state",objects})}
function network(p){if(!active||p.senderId===B().getMe()?.id)return;if(p.kind==="state"&&Array.isArray(p.objects)&&!drag)objects=p.objects}
function action(mode){if(mode!=="physics")return false;spawn("cube");return true}
window.DDG_PHYSICS95={setup,update,render,pointerDown,pointerMove,pointerUp,network,action};
})();