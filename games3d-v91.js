(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
let mode="",data={};
const hit=(x,y,r,p=22)=>x+p>r.x&&x-p<r.x+r.w&&y+p>r.y&&y-p<r.y+r.h;
function setup(m){
 mode=m;data={};
 if(m==="og")data={speedZones:[{x:500,y:500,w:420,h:260}],flingPads:[{x:1200,y:700,w:180,h:180},{x:2100,y:1100,w:180,h:180}],toys:[{x:850,y:1450,w:180,h:180},{x:1800,y:420,w:220,h:160}]};
 if(m==="warfare")data={walls:[{x:620,y:260,w:90,h:680},{x:620,y:1260,w:90,h:680},{x:1280,y:700,w:420,h:90},{x:1280,y:1320,w:420,h:90},{x:2070,y:260,w:90,h:680},{x:2070,y:1260,w:90,h:680},{x:930,y:1020,w:320,h:90},{x:1610,y:1020,w:320,h:90}],weaponFx:[],lastFire:0}
}
function update(m,dt){
 const st=B().getState(),me=B().getMe();
 if(m==="og"){
  st.speedBoost=(data.speedZones||[]).some(z=>hit(me.x,me.y,z,18))?2.1:1
 }
 if(m==="warfare"){
  for(const f of data.weaponFx||[])f.life-=dt;
  data.weaponFx=(data.weaponFx||[]).filter(f=>f.life>0)
 }
 return false
}
function action(m){
 if(m==="og"){
  const me=B().getMe(),pad=(data.flingPads||[]).find(p=>hit(me.x,me.y,p,25));
  if(pad){me.x=Math.min(B().getWorld().w-80,me.x+180);me.y=Math.min(B().getWorld().h-80,me.y+110);B().toast("FLING!");return true}
 }
 if(m==="warfare"){
  const me=B().getMe(),weapon=document.querySelector("#weaponSelect")?.value||"bat",now=performance.now();
  if(now-(data.lastFire||0)<250)return true;
  data.lastFire=now;const fx={id:crypto.randomUUID(),weapon,x:me.x,y:me.y,life:weapon==="bat"?.35:1.4};
  data.weaponFx.push(fx);B().net.send("v91_event",{kind:"weapon_fx",fx});return false
 }
 return false
}
function pointerGround(m,x,y){
 if(m==="create"){
  const c=B().getCreator();if(!c?.placing)return false;
  const type=document.querySelector("#createObjectType")?.value||"block";
  c.objects.push({id:crypto.randomUUID(),type,x,y,w:+document.querySelector("#createWidth")?.value||100,h:+document.querySelector("#createHeight")?.value||80,color:document.querySelector("#createColor")?.value||"#46d7ff"});
  c.placing=false;B().syncCreator();B().toast("Object placed");return true
 }
 if(m==="machine")return window.DDG_MACHINE?.pointerAt?.(x,y)||false;
 return false
}
function solidRects(m){
 const base=m==="warfare"?(data.walls||[]):[];
 const gd=window.DDG_GAMES66?.getRenderData?.();
 if(m==="meat"&&gd)return [...base,...(gd.walls||[]),...(gd.loot||[]).filter(l=>!l.carriedBy).map(l=>({x:l.x-25,y:l.y-25,w:50,h:50}))];
 if(m==="create")return [...base,...(B().getCreator()?.objects||[]).filter(o=>o.type==="block").map(o=>({x:o.x-o.w/2,y:o.y-o.h/2,w:o.w,h:o.h}))];
 return base
}
function addLine(group,THREE,a,b,color,height=3){
 const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x,height,a.y),new THREE.Vector3(b.x,height,b.y)]);
 const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color}));group.add(line)
}
function render(group,fx,api){
 const {box,THREE,mat}=api,st=B().getState(),gd=window.DDG_GAMES66?.getRenderData?.(),md=window.DDG_MACHINE?.getRenderData?.();
 if(mode==="og"){
  for(const z of data.speedZones||[])box(group,z.x,z.y,z.w,z.h,8,0x31d7ff,.65);
  for(const p of data.flingPads||[])box(group,p.x,p.y,p.w,p.h,18,0xff4fc3,.8);
  for(const t of data.toys||[])box(group,t.x,t.y,t.w,t.h,75,0xffd35a)
 }
 if(mode==="evil"){
  for(const w of B().get3DData().evilWalls||[])box(group,w.x,w.y,w.w,w.h,170,0x3d3347)
 }
 if(mode==="warfare"){
  box(group,80,st.world.h/2-260,260,520,140,0xa52f3f);box(group,st.world.w-340,st.world.h/2-260,260,520,140,0x3266a5);
  for(const w of data.walls||[])box(group,w.x,w.y,w.w,w.h,165,0x3b4656);
  for(const f of data.weaponFx||[]){
   if(f.weapon==="bat"){const m=new THREE.Mesh(new THREE.BoxGeometry(18,18,115),mat(0x8b5a2b));m.position.set(f.x,55,f.y-65);m.rotation.x=-.35+f.life*3;fx.add(m)}
   else{const c=f.weapon==="laser"?0xffdf55:0x62c8ff,r=f.weapon==="laser"?22:10,m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),mat(c));m.position.set(f.x,38,f.y-90+(1.4-f.life)*260);fx.add(m)}
  }
  for(const p of B().getProjectiles?.()||[]){const m=new THREE.Mesh(new THREE.SphereGeometry(p.radius*.45,8,6),mat(p.weapon==="laser"?0xffdf55:0x62c8ff));m.position.set(p.x,28,p.y);fx.add(m)}
 }
 if(mode==="meat"&&gd){
  for(const w of gd.walls||[])box(group,w.x,w.y,w.w,w.h,150,0x604a34);
  for(const l of gd.loot||[])box(group,l.x-25,l.y-25,50,50,l.type==="metal"?80:60,l.type==="metal"?0x7e8b91:0x95643d);
  for(const t of gd.triangles||[]){const cone=new THREE.Mesh(new THREE.ConeGeometry(28,70,3),mat(0xffe11f));cone.position.set(t.x,35,t.y);cone.rotation.y=Math.PI;group.add(cone)}
 }

 if(mode==="create"){
  for(const o of B().getCreator()?.objects||[])box(group,o.x-o.w/2,o.y-o.h/2,o.w,o.h,o.type==="block"?Math.max(35,o.h*.55):30,o.color||"#46d7ff",o.type==="spawn"?.5:1)
 }
 if(mode==="machine"&&md){
  for(const p of md.parts||[])box(group,p.x-p.w/2,p.y-p.h/2,p.w,p.h,55,p.value?p.color:"#24313d");
  for(const w of md.wires||[]){const a=md.parts.find(p=>p.id===w.a),b=md.parts.find(p=>p.id===w.b);if(a&&b)addLine(group,THREE,a,b,a.value?"#ffe45e":"#4f6f88",62)}
 }
 if(mode==="freedraw"){
  box(group,140,140,st.world.w-280,st.world.h-280,8,0xf0ead6,.95);
  const sign=box(group,st.world.w/2-260,60,520,55,90,0x28384f);sign.userData.label="Drawing returns in v9.5"
 }
}
function network(p){if(p.kind==="weapon_fx"&&mode==="warfare")data.weaponFx.push(p.fx)}
window.DDG_GAMES3D={setup,update,action,pointerGround,solidRects,render,network};
})();