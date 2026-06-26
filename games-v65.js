(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rectHit=(x,y,r,pad=18)=>x+pad>r.x&&x-pad<r.x+r.w&&y+pad>r.y&&y-pad<r.y+r.h;
let data={mode:null};

function makeMaze(){
 const walls=[];
 const cell=260,cols=18,rows=12,thick=42;
 for(let x=0;x<=cols;x++)for(let y=0;y<rows;y++){
  if(x===0||x===cols||Math.random()<.24)walls.push({x:x*cell,y:y*cell,w:thick,h:cell+thick});
 }
 for(let y=0;y<=rows;y++)for(let x=0;x<cols;x++){
  if(y===0||y===rows||Math.random()<.24)walls.push({x:x*cell,y:y*cell,w:cell+thick,h:thick});
 }
 // open generous passages near spawn
 return walls.filter(w=>!(w.x<700&&w.y<700));
}
function setup(mode){
 data={mode};
 const st=B()?.getState?.(),me=B()?.getMe?.();
 if(!st||!me)return;
 const btn=document.querySelector("#modeExtraBtn");
 btn.classList.toggle("hidden",!["meat","platform"].includes(mode));
 if(mode==="meat"){
  st.world={w:5200,h:3600};me.x=340;me.y=340;
  data.walls=makeMaze();
  data.triangles=Array.from({length:10},(_,i)=>({
   id:"tri"+i,x:rand(1800,4900),y:rand(700,3300),type:i<4?"path":i<7?"block":"step",
   cooldown:rand(.2,2),speed:i<4?150:i<7?115:0
  }));
  data.loot=[
   ...Array.from({length:18},()=>({id:crypto.randomUUID(),type:"crate",x:rand(500,4800),y:rand(400,3300),hp:90,max:90,carriedBy:null})),
   ...Array.from({length:8},()=>({id:crypto.randomUUID(),type:"metal",x:rand(500,4800),y:rand(400,3300),hp:180,max:180,carriedBy:null}))
  ];
  data.survival=0;data.dead=false;data.lastSync=0;data.teleportIndex=0;
  document.querySelector("#roundPanel").classList.remove("hidden");
  btn.textContent="Teleport to Player";
  btn.onclick=teleportToPlayer;
 }else if(mode==="platform"){
  st.world={w:4200,h:1500};me.x=220;me.y=1050;
  data.vy=0;data.onGround=false;data.buildMode=false;
  data.platforms=[
   {x:0,y:1220,w:4200,h:280},
   {x:500,y:1030,w:320,h:35},{x:1030,y:900,w:340,h:35},{x:1550,y:1060,w:400,h:35},
   {x:2180,y:840,w:330,h:35},{x:2750,y:990,w:420,h:35},{x:3440,y:780,w:430,h:35}
  ];
  data.userPlatforms=[];
  document.querySelector("#roundPanel").classList.remove("hidden");
  btn.textContent="Build Platform: OFF";
  btn.onclick=()=>{data.buildMode=!data.buildMode;btn.textContent=`Build Platform: ${data.buildMode?"ON":"OFF"}`;B().toast(data.buildMode?"Tap to place platforms":"Build mode off")};
 }
}
function onPlayerHello(){}

function nearestPlayer(){
 const st=B().getState(),me=B().getMe();
 return [...st.players.values()].filter(p=>p.id!==me.id).sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y))[0];
}
function teleportToPlayer(){
 const st=B().getState(),me=B().getMe(),others=[...st.players.values()].filter(p=>p.id!==me.id);
 if(!others.length)return B().toast("No other players are here");
 data.teleportIndex=(data.teleportIndex||0)%others.length;
 const p=others[data.teleportIndex++];me.x=p.x+55;me.y=p.y;B().toast(`Teleported to ${p.name}`);
}
function moveTopDown(dt,speed=250){
 const st=B().getState(),me=B().getMe(),keys=B().getKeys(),joy=B().getJoy();
 let dx=0,dy=0;if(keys.has("a")||keys.has("arrowleft"))dx--;if(keys.has("d")||keys.has("arrowright"))dx++;
 if(keys.has("w")||keys.has("arrowup"))dy--;if(keys.has("s")||keys.has("arrowdown"))dy++;dx+=joy.x;dy+=joy.y;
 const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
 const nx=clamp(me.x+dx*speed*dt,25,st.world.w-25),ny=clamp(me.y+dy*speed*dt,25,st.world.h-25);
 if(!data.walls?.some(w=>rectHit(nx,me.y,w)))me.x=nx;
 if(!data.walls?.some(w=>rectHit(me.x,ny,w)))me.y=ny;
}
function updateMeat(dt){
 const st=B().getState(),me=B().getMe();
 if(!data.dead){moveTopDown(dt,270);data.survival+=dt}
 const targetPlayers=[...st.players.values()].filter(p=>p.alive!==false);
 if(st.host){
  for(const t of data.triangles){
   t.cooldown-=dt;
   let target=targetPlayers.sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y))[0]||me;
   let dx=target.x-t.x,dy=target.y-t.y,l=Math.hypot(dx,dy)||1;
   if(t.type==="block"){
    // aim ahead of player to cut paths off
    dx=(target.x+(target.vx||0)*180)-t.x;dy=(target.y+(target.vy||0)*180)-t.y;l=Math.hypot(dx,dy)||1;
   }
   if(t.type==="step"){
    if(t.cooldown<=0){t.x+=dx/l*260;t.y+=dy/l*260;t.cooldown=2.2}
   }else{
    const nx=t.x+dx/l*t.speed*dt,ny=t.y+dy/l*t.speed*dt;
    if(!data.walls.some(w=>rectHit(nx,t.y,w,20)))t.x=nx;
    if(!data.walls.some(w=>rectHit(t.x,ny,w,20)))t.y=ny;
   }
   for(const loot of data.loot){
    if(loot.carriedBy||loot.hp<=0)continue;
    if(Math.hypot(t.x-loot.x,t.y-loot.y)<46){loot.hp-=dt*(t.type==="step"?55:32)}
   }
  }
  data.loot=data.loot.filter(x=>x.hp>0);
  if(performance.now()-data.lastSync>180){B().net.send("meat_state",{triangles:data.triangles,loot:data.loot});data.lastSync=performance.now()}
 }
 for(const t of data.triangles){
  if(!data.dead&&Math.hypot(t.x-me.x,t.y-me.y)<34){
   data.dead=true;me.alive=false;B().toast(`You survived ${Math.floor(data.survival)} seconds`);
   B().earn(Math.max(2,Math.floor(data.survival/15)),"MEAT survival");
   setTimeout(()=>{data.dead=false;data.survival=0;me.alive=true;me.x=340;me.y=340},3500);
  }
 }
 const held=data.loot.find(x=>x.carriedBy===me.id);if(held){held.x=me.x+40;held.y=me.y}
 document.querySelector("#roundTitle").textContent=data.dead?"CAUGHT":"MEAT";
 document.querySelector("#roundTimer").textContent=Math.floor(data.survival)+"s";
 document.querySelector("#roundInfo").textContent=`Triangles: 10 • Barricades: ${data.loot.length}`;
 return true;
}
function updatePlatform(dt){
 const st=B().getState(),me=B().getMe(),keys=B().getKeys(),joy=B().getJoy();
 let dx=0;if(keys.has("a")||keys.has("arrowleft"))dx--;if(keys.has("d")||keys.has("arrowright"))dx++;dx+=joy.x;
 me.x=clamp(me.x+dx*290*dt,20,st.world.w-20);
 data.vy+=1100*dt;
 let nextY=me.y+data.vy*dt;data.onGround=false;
 const all=[...data.platforms,...data.userPlatforms];
 for(const p of all){
  if(me.x+18>p.x&&me.x-18<p.x+p.w&&me.y+20<=p.y+8&&nextY+20>=p.y&&data.vy>=0){
   nextY=p.y-20;data.vy=0;data.onGround=true;
  }
 }
 me.y=nextY;
 if(me.y>st.world.h+100){me.x=220;me.y=1050;data.vy=0}
 document.querySelector("#roundTitle").textContent="PLATFORMER CHAOS";
 document.querySelector("#roundTimer").textContent=data.onGround?"READY":"AIR";
 document.querySelector("#roundInfo").textContent=`Platforms built: ${data.userPlatforms.length}`;
 return true;
}
function update(mode,dt){
 if(mode==="meat")return updateMeat(dt);
 if(mode==="platform")return updatePlatform(dt);
 return false;
}
function action(mode){
 if(mode==="meat"){
  const me=B().getMe();
  const held=data.loot.find(x=>x.carriedBy===me.id);
  if(held){held.carriedBy=null;held.x=me.x+45;held.y=me.y;B().net.send("meat_loot",{loot:held});B().toast("Barricade placed");return true}
  const near=data.loot.find(x=>!x.carriedBy&&Math.hypot(x.x-me.x,x.y-me.y)<65);
  if(near){near.carriedBy=me.id;B().net.send("meat_loot",{loot:near});B().toast(`Picked up ${near.type}`)}else B().toast("Nothing nearby");
  return true;
 }
 if(mode==="platform"){
  if(data.onGround){data.vy=-520;data.onGround=false}return true;
 }
 return false;
}
function pointerDown(mode,e){
 if(mode==="platform"&&data.buildMode){
  const p=B().screenToWorld(e.clientX,e.clientY);
  const plat={id:crypto.randomUUID(),x:Math.round(p.x/40)*40-70,y:Math.round(p.y/40)*40,w:140,h:24};
  data.userPlatforms.push(plat);B().net.send("platform_add",{platform:plat});return true;
 }
 return false;
}
function collision(){return null}
function drawBackground(mode,ctx){
 const st=B().getState();
 if(mode==="meat"){
  ctx.fillStyle="#1c1712";ctx.fillRect(0,0,st.world.w,st.world.h);
  ctx.fillStyle="#34291c";for(let x=0;x<st.world.w;x+=180)for(let y=0;y<st.world.h;y+=180)ctx.fillRect(x+30,y+30,12,12);
  return true;
 }
 if(mode==="platform"){
  const g=ctx.createLinearGradient(0,0,0,st.world.h);g.addColorStop(0,"#22365f");g.addColorStop(1,"#111826");ctx.fillStyle=g;ctx.fillRect(0,0,st.world.w,st.world.h);return true;
 }
 return false;
}
function drawWorld(mode,ctx){
 if(mode==="meat"){
  ctx.fillStyle="#5d4933";for(const w of data.walls||[])ctx.fillRect(w.x,w.y,w.w,w.h);
  for(const l of data.loot||[]){
   ctx.fillStyle=l.type==="metal"?"#78848b":"#8e6039";ctx.fillRect(l.x-22,l.y-22,44,44);
   ctx.fillStyle="#161616";ctx.fillRect(l.x-22,l.y+26,44,5);
   ctx.fillStyle=l.type==="metal"?"#bdd0d8":"#d9a26b";ctx.fillRect(l.x-22,l.y+26,44*(l.hp/l.max),5);
  }
  for(const t of data.triangles||[]){
   ctx.fillStyle="#ffe21f";ctx.beginPath();ctx.moveTo(t.x,t.y-24);ctx.lineTo(t.x-22,t.y+20);ctx.lineTo(t.x+22,t.y+20);ctx.closePath();ctx.fill();
   ctx.fillStyle="#111";ctx.beginPath();ctx.arc(t.x-6,t.y,3,0,7);ctx.arc(t.x+6,t.y,3,0,7);ctx.fill();
  }
 }
 if(mode==="platform"){
  ctx.fillStyle="#344766";for(const p of data.platforms||[])ctx.fillRect(p.x,p.y,p.w,p.h);
  ctx.fillStyle="#4fd0c8";for(const p of data.userPlatforms||[])ctx.fillRect(p.x,p.y,p.w,p.h);
 }
}
function drawForeground(){}
function network(type,p){
 if(type==="meat_state"&&data.mode==="meat"&&!B().getState().host){data.triangles=p.triangles||data.triangles;data.loot=p.loot||data.loot}
}
function sendSnapshot(target){
 if(data.mode==="meat")B().net.send("meat_snapshot",{target,triangles:data.triangles,loot:data.loot});
 if(data.mode==="platform")B().net.send("platform_snapshot",{target,platforms:data.userPlatforms});
}
function wire(){
 const b=B();if(!b)return setTimeout(wire,100);
 b.net.on("meat_state",p=>network("meat_state",p));
 b.net.on("meat_loot",p=>{if(data.mode!=="meat")return;const i=data.loot.findIndex(x=>x.id===p.loot.id);if(i>=0)data.loot[i]=p.loot});
 b.net.on("meat_snapshot",p=>{if(p.target&&p.target!==b.getMe()?.id)return;if(data.mode==="meat"){data.triangles=p.triangles||[];data.loot=p.loot||[]}});
 b.net.on("platform_add",p=>{if(data.mode==="platform"&&!data.userPlatforms.some(x=>x.id===p.platform.id))data.userPlatforms.push(p.platform)});
 b.net.on("platform_snapshot",p=>{if(p.target&&p.target!==b.getMe()?.id)return;if(data.mode==="platform")data.userPlatforms=p.platforms||[]});
}
window.DDG_GAMES65={setup,update,action,pointerDown,collision,drawBackground,drawWorld,drawForeground,network,sendSnapshot,onPlayerHello};
wire();
})();