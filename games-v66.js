(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hit=(x,y,r,p=20)=>x+p>r.x&&x-p<r.x+r.w&&y+p>r.y&&y-p<r.y+r.h;
let data={mode:null};

function buildSafeMaze(){
 const cell=300,cols=16,rows=10,t=44,walls=[];
 for(let x=0;x<=cols;x++)for(let y=0;y<rows;y++){
  if(x===0||x===cols||Math.random()<.18)walls.push({x:x*cell,y:y*cell,w:t,h:cell+t});
 }
 for(let y=0;y<=rows;y++)for(let x=0;x<cols;x++){
  if(y===0||y===rows||Math.random()<.18)walls.push({x:x*cell,y:y*cell,w:cell+t,h:t});
 }
 const safeZones=[{x:0,y:0,w:950,h:850},{x:3900,y:2200,w:900,h:800}];
 return walls.filter(w=>!safeZones.some(s=>w.x<s.x+s.w&&w.x+w.w>s.x&&w.y<s.y+s.h&&w.y+w.h>s.y));
}
function clearSpawn(x,y,walls){
 return !walls.some(r=>hit(x,y,r,70));
}
function farSpawn(walls,fromX,fromY){
 for(let i=0;i<100;i++){
  const x=3200+Math.random()*1450,y=1200+Math.random()*1500;
  if(Math.hypot(x-fromX,y-fromY)>1800&&clearSpawn(x,y,walls))return{x,y};
 }
 return{x:4400,y:2600};
}
function setup(mode){
 data={mode};
 const st=B()?.getState?.(),me=B()?.getMe?.();if(!st||!me)return;
 if(mode==="meat"){
  st.world={w:5000,h:3200};me.x=360;me.y=360;
  data.walls=buildSafeMaze();
  data.triangles=Array.from({length:3},(_,i)=>{const p=farSpawn(data.walls,me.x,me.y);return{id:"tri"+i,x:p.x+i*90,y:p.y+i*70,speed:82,sprint:210,attackCooldown:0}});
  data.loot=[
   ...Array.from({length:14},()=>({id:crypto.randomUUID(),type:"crate",x:700+Math.random()*3900,y:500+Math.random()*2450,hp:110,max:110,carriedBy:null})),
   ...Array.from({length:7},()=>({id:crypto.randomUUID(),type:"metal",x:700+Math.random()*3900,y:500+Math.random()*2450,hp:240,max:240,carriedBy:null}))
  ].filter(l=>clearSpawn(l.x,l.y,data.walls));
  data.survival=0;data.dead=false;data.lastSync=0;data.lastDir={x:1,y:0};
  document.querySelector("#roundPanel")?.classList.remove("hidden");
  const btn=document.querySelector("#modeExtraBtn");btn.classList.remove("hidden");btn.textContent="Teleport to Player";btn.onclick=teleport;
 }
 if(mode==="platform"){
  st.world={w:4200,h:1500};me.x=220;me.y=1050;data.vy=0;data.onGround=false;data.buildMode=false;
  data.platforms=[{x:0,y:1220,w:4200,h:280},{x:500,y:1030,w:320,h:35},{x:1030,y:900,w:340,h:35},{x:1550,y:1060,w:400,h:35},{x:2180,y:840,w:330,h:35},{x:2750,y:990,w:420,h:35},{x:3440,y:780,w:430,h:35}];
  data.userPlatforms=[];
  const btn=document.querySelector("#modeExtraBtn");btn.classList.remove("hidden");btn.textContent="Build Platform: OFF";btn.onclick=()=>{data.buildMode=!data.buildMode;btn.textContent=`Build Platform: ${data.buildMode?"ON":"OFF"}`};
 }
}
function teleport(){
 const st=B().getState(),me=B().getMe(),others=[...st.players.values()].filter(p=>p.id!==me.id);
 if(!others.length)return B().toast("No other players are here");
 const p=others[Math.floor(Math.random()*others.length)];me.x=p.x+60;me.y=p.y;B().toast(`Teleported to ${p.name}`);
}
function axisMove(obj,dx,dy,walls,pad=20){
 let nx=obj.x+dx,ny=obj.y;
 if(!walls.some(r=>hit(nx,ny,r,pad)))obj.x=nx;
 nx=obj.x;ny=obj.y+dy;
 if(!walls.some(r=>hit(nx,ny,r,pad)))obj.y=ny;
}
function getInput(){
 const k=B().getKeys(),j=B().getJoy();let x=0,y=0;
 if(k.has("a")||k.has("arrowleft"))x--;if(k.has("d")||k.has("arrowright"))x++;
 if(k.has("w")||k.has("arrowup"))y--;if(k.has("s")||k.has("arrowdown"))y++;
 x+=j.x;y+=j.y;if(B().is3D?.()){const v=window.DDG_CORE3D?.transformInput?.(x,y);if(v){x=v.x;y=v.y}}
 const l=Math.hypot(x,y)||1;return{x:x/l,y:y/l,active:Math.abs(x)+Math.abs(y)>.08};
}
function barricadeRect(l){return{x:l.x-25,y:l.y-25,w:50,h:50}}
function updateMeat(dt){
 const st=B().getState(),me=B().getMe(),input=getInput();
 if(input.active)data.lastDir={x:input.x,y:input.y};
 if(!data.dead){
  const solids=[...(data.walls||[]),...(data.loot||[]).filter(l=>!l.carriedBy&&l.hp>0).map(barricadeRect)];
  // Move one axis at a time so corners do not tunnel through walls.
  axisMove(me,input.x*275*dt,input.y*275*dt,solids,21);
  // Emergency de-penetration for old/random maze overlaps.
  for(const r of solids)if(hit(me.x,me.y,r,21)){me.x=360;me.y=360;break}
 }
 const held=data.loot.find(l=>l.carriedBy===me.id);
 if(held){
  held.x=me.x+data.lastDir.x*58;held.y=me.y+data.lastDir.y*58;
 }
 if(st.host){
  for(const t of data.triangles){
   let target=[...st.players.values()].filter(p=>p.alive!==false).sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y))[0]||me;
   let dx=target.x-t.x,dy=target.y-t.y,dist=Math.hypot(dx,dy)||1;
   const speed=dist<440?t.sprint:t.speed;
   const step=Math.min(speed*dt,dist);
   const before={x:t.x,y:t.y};
   axisMove(t,dx/dist*step,dy/dist*step,data.walls,22);
   // Barricades are solid and take continuous damage while the triangle pushes.
   for(const l of data.loot){
    if(l.carriedBy||l.hp<=0)continue;
    const r=barricadeRect(l);
    if(hit(t.x,t.y,r,22)){
      t.x=before.x;t.y=before.y;
      l.hp-=dt*(l.type==="metal"?20:38);
    }
   }
  }
  data.loot=data.loot.filter(l=>l.hp>0);
  if(performance.now()-data.lastSync>160){B().net.send("meat_state",{triangles:data.triangles,loot:data.loot});data.lastSync=performance.now()}
 }
 for(const t of data.triangles){
  if(!data.dead&&Math.hypot(t.x-me.x,t.y-me.y)<36){
   data.dead=true;me.alive=false;B().toast(`You survived ${Math.floor(data.survival)} seconds`);
   B().earn(Math.max(2,Math.floor(data.survival/15)),"MEAT survival");
   setTimeout(()=>{data.dead=false;data.survival=0;me.alive=true;me.x=360;me.y=360},3200);
  }
 }
 if(!data.dead)data.survival+=dt;
 document.querySelector("#roundTitle").textContent=data.dead?"CAUGHT":"MEAT";
 document.querySelector("#roundTimer").textContent=Math.floor(data.survival)+"s";
 document.querySelector("#roundInfo").textContent=`3 hunters • ${data.loot.length} barricades`;
 return true;
}
function updatePlatform(dt){
 const st=B().getState(),me=B().getMe(),input=getInput();
 me.x=clamp(me.x+input.x*295*dt,20,st.world.w-20);data.vy+=1100*dt;
 let ny=me.y+data.vy*dt;data.onGround=false;
 for(const p of [...data.platforms,...data.userPlatforms]){
  if(me.x+18>p.x&&me.x-18<p.x+p.w&&me.y+20<=p.y+8&&ny+20>=p.y&&data.vy>=0){ny=p.y-20;data.vy=0;data.onGround=true}
 }
 me.y=ny;if(me.y>st.world.h+100){me.x=220;me.y=1050;data.vy=0}
 document.querySelector("#roundTitle").textContent="PLATFORMER CHAOS";
 document.querySelector("#roundTimer").textContent=data.onGround?"READY":"AIR";
 document.querySelector("#roundInfo").textContent=`Built: ${data.userPlatforms.length}`;
 return true;
}
function update(mode,dt){if(mode==="meat")return updateMeat(dt);return false}
function action(mode){
 if(mode==="meat"){
  const me=B().getMe(),held=data.loot.find(l=>l.carriedBy===me.id);
  if(held){held.carriedBy=null;held.x=me.x+data.lastDir.x*66;held.y=me.y+data.lastDir.y*66;B().net.send("meat_loot",{loot:held});B().toast("Barricade placed");return true}
  const near=data.loot.find(l=>!l.carriedBy&&Math.hypot(l.x-me.x,l.y-me.y)<68);
  if(near){near.carriedBy=me.id;B().net.send("meat_loot",{loot:near});B().toast(`Picked up ${near.type}`)}else B().toast("Nothing nearby");
  return true;
 }
 return false;
}
function placePlatformAt(x,y){
 if(data.mode!=="platform"||!data.buildMode)return false;
 const plat={id:crypto.randomUUID(),x:Math.round(x/40)*40-70,y:Math.round(y/40)*40,w:140,h:24};
 data.userPlatforms.push(plat);B().net.send("platform_add",{platform:plat});return true
}
function pointerDown(mode,e){
 if(mode==="platform"){
  const p=B().screenToWorld(e.clientX,e.clientY);
  return placePlatformAt(p.x,p.y)
 }
 return false;
}
function drawBackground(mode,ctx){
 const st=B().getState();
 if(mode==="meat"){ctx.fillStyle="#1b1711";ctx.fillRect(0,0,st.world.w,st.world.h);return true}
 if(mode==="platform"){const g=ctx.createLinearGradient(0,0,0,st.world.h);g.addColorStop(0,"#243d6a");g.addColorStop(1,"#101824");ctx.fillStyle=g;ctx.fillRect(0,0,st.world.w,st.world.h);return true}
 return false;
}
function drawWorld(mode,ctx){
 if(mode==="meat"){
  ctx.fillStyle="#604a34";for(const w of data.walls||[])ctx.fillRect(w.x,w.y,w.w,w.h);
  for(const l of data.loot||[]){
   ctx.fillStyle=l.type==="metal"?"#7e8b91":"#95643d";ctx.fillRect(l.x-25,l.y-25,50,50);
   ctx.fillStyle="#111";ctx.fillRect(l.x-25,l.y+30,50,5);ctx.fillStyle=l.type==="metal"?"#c3d4db":"#efb274";ctx.fillRect(l.x-25,l.y+30,50*(l.hp/l.max),5)
  }
  for(const t of data.triangles||[]){ctx.fillStyle="#ffe11f";ctx.beginPath();ctx.moveTo(t.x,t.y-25);ctx.lineTo(t.x-23,t.y+21);ctx.lineTo(t.x+23,t.y+21);ctx.closePath();ctx.fill()}
 }
 if(mode==="platform"){
  ctx.fillStyle="#354a6a";for(const p of data.platforms||[])ctx.fillRect(p.x,p.y,p.w,p.h);
  ctx.fillStyle="#50d4c9";for(const p of data.userPlatforms||[])ctx.fillRect(p.x,p.y,p.w,p.h)
 }
}
function drawForeground(){}
function collision(mode,nx,ny){
 if(mode!=="meat")return null;
 const me=B().getMe();const blocked=data.walls?.some(r=>hit(nx,ny,r,21))||data.loot?.some(l=>!l.carriedBy&&hit(nx,ny,barricadeRect(l),21));
 return blocked?{x:me.x,y:me.y}:{x:nx,y:ny};
}
function solidRects(mode){if(mode==="meat")return[...(data.walls||[]),...(data.loot||[]).filter(l=>!l.carriedBy&&l.hp>0).map(barricadeRect)];return[]}
function network(type,p){if(type==="meat_state"&&data.mode==="meat"&&!B().getState().host){data.triangles=p.triangles||[];data.loot=p.loot||[]}}
function sendSnapshot(target){if(data.mode==="meat")B().net.send("meat_snapshot",{target,triangles:data.triangles,loot:data.loot});if(data.mode==="platform")B().net.send("platform_snapshot",{target,platforms:data.userPlatforms})}
function wire(){
 const b=B();if(!b)return setTimeout(wire,100);
 b.net.on("meat_state",p=>network("meat_state",p));
 b.net.on("meat_loot",p=>{if(data.mode!=="meat")return;const i=data.loot.findIndex(l=>l.id===p.loot.id);if(i>=0)data.loot[i]=p.loot});
 b.net.on("meat_snapshot",p=>{if(p.target&&p.target!==b.getMe()?.id)return;if(data.mode==="meat"){data.triangles=p.triangles||[];data.loot=p.loot||[]}});
 b.net.on("platform_add",p=>{if(data.mode==="platform"&&!data.userPlatforms.some(x=>x.id===p.platform.id))data.userPlatforms.push(p.platform)});
 b.net.on("platform_snapshot",p=>{if(p.target&&p.target!==b.getMe()?.id)return;if(data.mode==="platform")data.userPlatforms=p.platforms||[]})
}
window.DDG_GAMES66={setup,update,action,pointerDown,placePlatformAt,collision,drawBackground,drawWorld,drawForeground,network,sendSnapshot,solidRects,getRenderData:()=>data,onPlayerHello:()=>{}};
wire();
})();