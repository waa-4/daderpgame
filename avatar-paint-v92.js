(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
let paint=[],painting=false,last=null,lastAt=0;

function currentAvatar(){return B()?.getAvatar?.()||{face:"happy",hat:"none"}}
function load(){try{paint=JSON.parse(localStorage.ddg_v92_paint||"[]");if(!Array.isArray(paint))paint=[]}catch{paint=[]}}
function savePaint(){localStorage.ddg_v92_paint=JSON.stringify(paint.slice(-900))}

function normalizeFace(f){
 const map={classic:"happy",cat:"catface",surprised:"shocked",xd:"silly",blank:"none",smug:"cool"};
 return map[f]||f||"happy"
}
function normalizeHat(h){
 const map={tophat:"cap",catears:"cat",headphones:"cap",pickle:"bucket",horns:"antenna"};
 return map[h]||h||"none"
}
function faceTexture(T,raw){
 const f=normalizeFace(raw),c=document.createElement("canvas");c.width=c.height=128;
 const x=c.getContext("2d");x.strokeStyle=x.fillStyle="#111827";x.lineWidth=10;x.lineCap="round";x.lineJoin="round";
 const dot=(px,py,r=8)=>{x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill()};
 if(f==="none"){}
 else if(f==="robot"){x.strokeRect(22,20,84,78);x.fillRect(37,38,13,13);x.fillRect(78,38,13,13);x.fillRect(40,73,48,9)}
 else if(f==="cyclops"){dot(64,44,13);x.beginPath();x.arc(64,72,27,.1*Math.PI,.9*Math.PI);x.stroke()}
 else{
  if(f==="wink"){x.beginPath();x.moveTo(28,43);x.lineTo(50,43);x.stroke();dot(88,43)}
  else if(f==="sleepy"){x.beginPath();x.moveTo(27,43);x.lineTo(51,43);x.moveTo(77,43);x.lineTo(101,43);x.stroke()}
  else if(f==="cool"){x.fillRect(25,34,34,18);x.fillRect(69,34,34,18);x.fillRect(57,40,14,6)}
  else{dot(40,43);dot(88,43)}
  x.beginPath();
  if(f==="angry"||f==="evil"){x.moveTo(25,27);x.lineTo(51,38);x.moveTo(103,27);x.lineTo(77,38);x.moveTo(38,87);x.quadraticCurveTo(64,67,92,87)}
  else if(f==="shocked")x.arc(64,82,14,0,Math.PI*2);
  else if(f==="silly"){x.arc(64,70,27,.1*Math.PI,.9*Math.PI);x.moveTo(70,91);x.lineTo(80,108)}
  else if(f==="catface"){x.moveTo(53,68);x.lineTo(64,77);x.lineTo(75,68);x.moveTo(64,77);x.lineTo(64,89);x.moveTo(52,87);x.lineTo(28,82);x.moveTo(76,87);x.lineTo(100,82)}
  else if(f==="sleepy")x.arc(64,83,17,.15*Math.PI,.85*Math.PI);
  else x.arc(64,68,28,.12*Math.PI,.88*Math.PI);
  x.stroke()
 }
 const tex=new T.CanvasTexture(c);tex.needsUpdate=true;return tex
}
function addFace(g,p,a){
 const T=a.THREE,m=new T.Mesh(new T.PlaneGeometry(34,34),new T.MeshBasicMaterial({map:faceTexture(T,p.face),transparent:true,depthWrite:false}));
 m.position.set(0,22,-21.35);m.userData.cosmetic=true;m.userData.facePlane=true;g.add(m)
}
function addHat(g,p,a){
 const T=a.THREE,h=normalizeHat(p.hat);if(h==="none")return;
 const add=(geo,y,col)=>{const m=new T.Mesh(geo,a.mat(col));m.position.y=y;m.userData.cosmetic=true;g.add(m);return m};
 if(h==="cap"){add(new T.CylinderGeometry(17,17,11,12),48,0x3267a8);const brim=add(new T.BoxGeometry(25,3,12),45,0x3267a8);brim.position.z=-12}
 else if(h==="crown"){const m=add(new T.CylinderGeometry(17,22,20,5),51,0xffd43b);m.rotation.y=.3}
 else if(h==="cone")add(new T.ConeGeometry(20,45,12),65,0xff8c32)
 else if(h==="cat"){for(const q of[-12,12]){const m=add(new T.ConeGeometry(9,22,3),53,0x30343d);m.position.x=q}}
 else if(h==="wizard")add(new T.ConeGeometry(23,58,12),70,0x5633a8)
 else if(h==="bucket")add(new T.CylinderGeometry(18,15,27,12),56,0x7d8589)
 else if(h==="halo"){const m=add(new T.TorusGeometry(18,3,8,20),61,0xfff07a);m.rotation.x=Math.PI/2}
 else if(h==="antenna"){add(new T.CylinderGeometry(2,2,31,8),58,0x7d8792);add(new T.SphereGeometry(6,8,6),75,0xff4f73)}
 else if(h==="chef"){add(new T.CylinderGeometry(16,17,16,12),53,0xffffff);for(const q of[-11,0,11]){const m=add(new T.SphereGeometry(11,10,8),67,0xffffff);m.position.x=q}}
 else if(h==="party")add(new T.ConeGeometry(18,42,12),64,0xff4fc3)
}
function decoratePlayer(g,p,a){addFace(g,p,a);addHat(g,p,a);g.userData.face=p.face;g.userData.hat=p.hat}
function refreshPlayer(g,p,a){
 const av=p.id===B()?.getMe?.()?.id?currentAvatar():p,f=av.face||"happy",h=av.hat||"none";
 if(g.userData.face===f&&g.userData.hat===h)return;
 for(const c of[...g.children])if(c.userData?.cosmetic){c.material?.map?.dispose?.();c.material?.dispose?.();g.remove(c)}
 addFace(g,{...p,face:f},a);addHat(g,{...p,hat:h},a);g.userData.face=f;g.userData.hat=h
}
function ray(e,r,c){const q=r.domElement.getBoundingClientRect(),m=new THREE.Vector2(((e.clientX-q.left)/q.width)*2-1,-((e.clientY-q.top)/q.height)*2+1),rc=new THREE.Raycaster(),p=new THREE.Vector3();rc.setFromCamera(m,c);return rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),p)?{x:p.x,y:.9,z:p.z}:null}
function beginPaint(e,r,c){if(!document.body.classList.contains("paint-active"))return false;last=ray(e,r,c);if(!last)return false;painting=true;return true}
function movePaint(e,r,c){if(!painting)return false;const now=performance.now();if(now-lastAt<32)return true;const p=ray(e,r,c);if(!p)return true;const me=B().getMe(),s={id:crypto.randomUUID(),owner:me.id,a:last,b:p,color:document.querySelector("#paintColor")?.value||"#ff4fc3",size:+document.querySelector("#paintSize")?.value||10};paint.push(s);if(paint.length>700)paint.shift();savePaint();B().getNet()?.send("paint_v92",{kind:"add",stroke:s});last=p;lastAt=now;return true}
function endPaint(){if(!painting)return false;painting=false;last=null;return true}
function renderPaint(g,a){for(const s of paint){const geo=new a.THREE.BufferGeometry().setFromPoints([new a.THREE.Vector3(s.a.x,s.a.y,s.a.z),new a.THREE.Vector3(s.b.x,s.b.y,s.b.z)]);g.add(new a.THREE.Line(geo,new a.THREE.LineBasicMaterial({color:s.color})))}}
function networkAvatar(p){const q=B().getPlayers()?.get?.(p.playerId);if(q){if(p.face)q.face=p.face;if(p.hat)q.hat=p.hat;if(p.color)q.color=p.color}}
function networkPaint(p){if(p.kind==="add"&&p.stroke&&!paint.some(s=>s.id===p.stroke.id)){paint.push(p.stroke);savePaint()}if(p.kind==="clear"){paint=paint.filter(s=>s.owner!==p.owner);savePaint()}}
function ui(){
 load();
 const update=()=>{const av=currentAvatar(),f=document.querySelector("#faceSelect"),h=document.querySelector("#hatSelect");if(f)f.value=av.face;if(h)h.value=av.hat};
 update();
 document.querySelector("#saveCosmeticBtn")?.addEventListener("click",()=>{const av=currentAvatar(),f=document.querySelector("#faceSelect"),h=document.querySelector("#hatSelect");if(f)av.face=f.value;if(h)av.hat=h.value;B().persistAvatar?.();B().syncCurrentAvatar?.();document.querySelector("#cosmeticStatus").textContent="Saved and synced!"});
 document.querySelector("#cosmeticMenuBtn")?.addEventListener("click",()=>{update();document.querySelector("#cosmeticPanel")?.classList.toggle("hidden")});
 document.querySelector("#paintMenuBtn")?.addEventListener("click",()=>document.querySelector("#paintPanel")?.classList.toggle("hidden"));
 document.querySelector("#paintToggleBtn")?.addEventListener("click",e=>{const on=document.body.classList.toggle("paint-active");e.target.textContent=`Painting: ${on?"ON":"OFF"}`});
 document.querySelector("#paintUndoBtn")?.addEventListener("click",()=>{const me=B().getMe();for(let i=paint.length-1;i>=0;i--)if(paint[i].owner===me.id){paint.splice(i,1);savePaint();break}});
 document.querySelector("#paintClearBtn")?.addEventListener("click",()=>{const me=B().getMe();paint=paint.filter(s=>s.owner!==me.id);savePaint();B().getNet()?.send("paint_v92",{kind:"clear",owner:me.id})})
}
window.DDG_AVATAR_PAINT={decoratePlayer,refreshPlayer,beginPaint,movePaint,endPaint,renderPaint,networkAvatar,networkPaint,getPaint:()=>paint};
addEventListener("DOMContentLoaded",ui);
})();