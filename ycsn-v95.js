(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
let active=false,run=null,lastSync=0;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function setup(mode){
 active=mode==="ycsn";if(!active)return;
 const st=B().getState(),me=B().getMe();st.world={w:2600,h:12000};me.x=1300;me.y=5600;
 try{run=JSON.parse(localStorage.ddg_ycsn_checkpoint||"null")}catch{}
 run=run||{distance:0,fuel:100,scrap:0,hp:100,engine:1,time:0,carX:1300,carZ:5600,chunks:[],triangles:[],pickups:[],checkpoint:0};
 ensureChunks();wireUI();updateHud()
}
function wireUI(){
 document.querySelector("#ycsnPanel")?.classList.remove("hidden");
 const b=document.querySelector("#ycsnUpgradeBtn");if(b)b.onclick=()=>{if(run.scrap<10)return B().toast("Need 10 scrap");run.scrap-=10;run.engine++;B().toast(`Engine level ${run.engine}`);updateHud()}
}
function ensureChunks(){
 const center=Math.floor(run.carZ/700);
 for(let n=center-5;n<=center+6;n++)if(!run.chunks.some(c=>c.n===n)){
  const z=n*700,kind=Math.random()<.3?"town":Math.random()<.55?"houses":"road",checkpoint=Math.random()<.035;
  run.chunks.push({n,z,kind,checkpoint});
  if(kind!=="road")for(let i=0;i<(kind==="town"?4:2);i++)run.pickups.push({id:crypto.randomUUID(),x:750+Math.random()*1100,z:z+120+Math.random()*460,type:Math.random()<.25?"fuel":"scrap"});
  if(checkpoint)run.pickups.push({id:crypto.randomUUID(),x:1300,z:z+350,type:"checkpoint"})
 }
 run.chunks=run.chunks.filter(c=>Math.abs(c.n-center)<10);
 run.pickups=run.pickups.filter(p=>Math.abs(p.z-run.carZ)<7000)
}
function input(){
 const k=B().getKeys(),j=B().getJoy();let steer=0,gas=0;
 if(k.has("a")||k.has("arrowleft"))steer--;if(k.has("d")||k.has("arrowright"))steer++;
 if(k.has("w")||k.has("arrowup"))gas++;if(k.has("s")||k.has("arrowdown"))gas--;
 return{steer:clamp(steer+j.x,-1,1),gas:clamp(gas-j.y,-1,1)}
}
function update(mode,dt){
 if(mode!=="ycsn")return false;
 const me=B().getMe(),i=input(),speed=(160+run.engine*28)*(run.fuel>0?1:.25);
 run.carZ-=i.gas*speed*dt;run.carX=clamp(run.carX+i.steer*(190+run.engine*12)*dt,520,2080);run.fuel=clamp(run.fuel-Math.abs(i.gas)*dt*.65,0,100);
 run.distance=Math.max(run.distance,Math.floor((5600-run.carZ)/5));run.time=(run.time+dt)%120;
 me.x=run.carX;me.y=run.carZ;ensureChunks();
 for(const p of [...run.pickups])if(Math.hypot(p.x-run.carX,p.z-run.carZ)<75){
  if(p.type==="fuel"){run.fuel=clamp(run.fuel+25,0,100);B().toast("Fuel +25")}
  if(p.type==="scrap"){run.scrap+=3;B().toast("Scrap +3")}
  if(p.type==="checkpoint"){run.checkpoint=run.distance;localStorage.ddg_ycsn_checkpoint=JSON.stringify(run);B().toast("RARE CHECKPOINT SAVED")}
  run.pickups=run.pickups.filter(q=>q.id!==p.id)
 }
 const night=run.time>65;
 if(night&&run.triangles.length<8&&Math.random()<dt*.8)run.triangles.push({id:crypto.randomUUID(),x:run.carX+(Math.random()-.5)*1000,z:run.carZ-700-Math.random()*500});
 for(const t of run.triangles){
  const dx=run.carX-t.x,dz=run.carZ-t.z,d=Math.hypot(dx,dz)||1;t.x+=dx/d*115*dt;t.z+=dz/d*115*dt;
  if(d<60){run.hp-=22*dt}
 }
 run.triangles=run.triangles.filter(t=>Math.abs(t.z-run.carZ)<2500);
 if(run.hp<=0){B().toast("The triangles wrecked the car!");run.hp=100;run.fuel=100;run.carX=1300;run.carZ=5600-run.checkpoint*5;run.triangles=[]}
 updateHud();
 if(performance.now()-lastSync>500){B().getNet()?.send("ycsn95",{kind:"state",run});lastSync=performance.now()}
 return true
}
function updateHud(){
 const set=(id,v)=>{const e=document.querySelector(id);if(e)e.textContent=v};
 set("#ycsnDistance",run?.distance||0);set("#ycsnFuel",Math.floor(run?.fuel||0));set("#ycsnScrap",run?.scrap||0);set("#ycsnHp",Math.floor(run?.hp||0));
 set("#ycsnTime",run?.time>65?"NIGHT — TRIANGLES ACTIVE":"DAY — LOOT AND DRIVE")
}
function render(group,fx,api){
 if(!active||!run)return;const T=api.THREE,night=run.time>65;
 for(const c of run.chunks){
  api.box(group,1030,c.z,540,700,6,0x33363b);
  api.box(group,500,c.z,500,700,5,0x6d8c58);api.box(group,1600,c.z,500,700,5,0x6d8c58);
  if(c.kind!=="road")for(let i=0;i<(c.kind==="town"?4:2);i++){const side=i%2?1680:720,z=c.z+100+(i*135)%500;api.box(group,side,z,180,120,115,c.kind==="town"?0xb1a17c:0x8c6d58)}
  if(c.checkpoint){api.box(group,1060,c.z+320,480,35,150,0x52e0ff,.6)}
 }
 // Car body and wheels.
 api.box(group,run.carX-42,run.carZ-68,84,136,36,0x46d7ff);
 for(const x of [-50,50])for(const z of [-45,45]){const w=new T.Mesh(new T.CylinderGeometry(13,13,12,10),api.mat(0x202329));w.rotation.z=Math.PI/2;w.position.set(run.carX+x,17,run.carZ+z);group.add(w)}
 for(const p of run.pickups){const color=p.type==="fuel"?0xffd85a:p.type==="checkpoint"?0x52e0ff:0xb6c0c8;api.box(group,p.x-18,p.z-18,36,36,p.type==="checkpoint"?70:35,color)}
 for(const t of run.triangles){const m=new T.Mesh(new T.ConeGeometry(28,70,3),api.mat(0xffe11f));m.position.set(t.x,35,t.z);group.add(m)}
}
function action(mode){if(mode!=="ycsn")return false;run.fuel=clamp(run.fuel+2,0,100);return true}
function network(p){/* Prototype runs are intentionally local-first. */}
window.DDG_YCSN95={setup,update,render,action,network};
})();