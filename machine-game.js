(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
const PARTS=[
 ["switch","Toggle Switch"],["button","Momentary Button"],["lamp","Lamp"],["display","Color Display"],
 ["wire_node","Wire Node"],["not","NOT Gate"],["and","AND Gate"],["or","OR Gate"],["xor","XOR Gate"],
 ["timer","Timer"],["pulse","Pulse Generator"],["counter","Counter"],["random","Randomizer"],
 ["sensor","Player Sensor"],["pressure","Pressure Plate"],["relay","Relay"],["memory","Memory Cell"],
 ["speaker","Speaker"],["mover","Mover"],["rotator","Rotator"],["door","Door"],["teleporter","Teleporter"],
 ["colorizer","Colorizer"],["spawn","Spawn Marker"],["block","Solid Block"]
];
let data={parts:[],wires:[],mode:"idle",selected:null,wireStart:null,lastTick:0};
const hit=(p,x,y)=>Math.abs(p.x-x)<p.w/2&&Math.abs(p.y-y)<p.h/2;
function setup(){
 const sel=document.querySelector("#machinePart");if(!sel)return;
 sel.innerHTML=PARTS.map(([id,n])=>`<option value="${id}">${n}</option>`).join("");
 document.querySelector("#machinePlaceBtn").onclick=()=>setMode("place");
 document.querySelector("#machineWireBtn").onclick=()=>setMode("wire");
 document.querySelector("#machineDeleteBtn").onclick=()=>setMode("delete");
 document.querySelector("#machineInteractBtn").onclick=()=>setMode("interact");
 document.querySelector("#machineSaveBtn").onclick=save;
 document.querySelector("#machineLoadBtn").onclick=load;
 document.querySelector("#machineClearBtn").onclick=()=>{data.parts=[];data.wires=[];sync();status("Cleared")};
}
function setMode(m){data.mode=m;data.wireStart=null;status(m[0].toUpperCase()+m.slice(1)+" mode")}
function status(t){const e=document.querySelector("#machineStatus");if(e)e.textContent=t}
function sync(){B()?.net?.send("machine_sync",{parts:data.parts,wires:data.wires})}
function pointerDown(mode,e){
 if(mode!=="machine")return false;
 const p=B().screenToWorld(e.clientX,e.clientY),found=[...data.parts].reverse().find(x=>hit(x,p.x,p.y));
 if(data.mode==="place"){
  const type=document.querySelector("#machinePart").value,color=document.querySelector("#machineColor").value;
  data.parts.push({id:crypto.randomUUID(),type,x:Math.round(p.x/40)*40,y:Math.round(p.y/40)*40,w:type==="block"||type==="door"?100:64,h:64,color,on:false,value:0,phase:0});
  sync();return true;
 }
 if(data.mode==="delete"){
  if(found){data.parts=data.parts.filter(x=>x.id!==found.id);data.wires=data.wires.filter(w=>w.a!==found.id&&w.b!==found.id);sync()}return true;
 }
 if(data.mode==="wire"){
  if(!found)return true;
  if(!data.wireStart){data.wireStart=found.id;status("Select the second part")}
  else if(data.wireStart!==found.id){data.wires.push({id:crypto.randomUUID(),a:data.wireStart,b:found.id});data.wireStart=null;sync();status("Wire created")}
  return true;
 }
 if(data.mode==="interact"&&found){
  if(["switch","button","memory"].includes(found.type)){found.on=!found.on;found.value=found.on?1:0;sync()}
  if(found.type==="teleporter"){const pair=data.parts.find(x=>x.type==="teleporter"&&x.id!==found.id);if(pair){const me=B().getMe();me.x=pair.x;me.y=pair.y}}
  return true;
 }
 return true;
}
function inputValues(part){
 return data.wires.filter(w=>w.b===part.id).map(w=>data.parts.find(p=>p.id===w.a)?.value||0);
}
function simulate(now){
 if(now-data.lastTick<100)return;data.lastTick=now;
 const me=B()?.getMe?.();
 for(const p of data.parts){
  const ins=inputValues(p),a=ins[0]||0,b=ins[1]||0;
  if(p.type==="switch"||p.type==="button"||p.type==="memory"){}
  else if(p.type==="not")p.value=a?0:1;
  else if(p.type==="and")p.value=a&&b?1:0;
  else if(p.type==="or")p.value=a||b?1:0;
  else if(p.type==="xor")p.value=!!a!==!!b?1:0;
  else if(["relay","wire_node"].includes(p.type))p.value=a;
  else if(p.type==="timer"){p.phase=(p.phase||0)+.1;p.value=a&&p.phase%2<1?1:0}
  else if(p.type==="pulse"){p.phase=(p.phase||0)+.1;p.value=p.phase%2<.18?1:0}
  else if(p.type==="random")p.value=Math.random()<.18?1:0;
  else if(p.type==="sensor"&&me)p.value=Math.hypot(me.x-p.x,me.y-p.y)<180?1:0;
  else if(p.type==="pressure"&&me)p.value=Math.hypot(me.x-p.x,me.y-p.y)<48?1:0;
  else if(p.type==="counter"&&a&&!p.prev){p.count=(p.count||0)+1;p.value=p.count%2} 
  else if(["lamp","display","speaker","mover","rotator","door","colorizer"].includes(p.type))p.value=a;
  p.prev=a;
 }
}
function drawWorld(mode,ctx){
 if(mode!=="machine")return;
 simulate(performance.now());
 ctx.strokeStyle="#8fdcff";ctx.lineWidth=5;
 for(const w of data.wires){
  const a=data.parts.find(p=>p.id===w.a),b=data.parts.find(p=>p.id===w.b);if(!a||!b)continue;
  ctx.strokeStyle=a.value?"#ffe45e":"#4f6f88";ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()
 }
 for(const p of data.parts){
  ctx.save();ctx.translate(p.x,p.y);
  let color=p.color;
  if(p.type==="lamp"||p.type==="display")color=p.value?p.color:"#1a2630";
  if(p.type==="door"&&p.value){ctx.globalAlpha=.25}
  ctx.fillStyle=color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
  ctx.strokeStyle=data.wireStart===p.id?"#fff":"#09111a";ctx.lineWidth=4;ctx.strokeRect(-p.w/2,-p.h/2,p.w,p.h);
  ctx.fillStyle="#fff";ctx.font="bold 11px Arial";ctx.textAlign="center";ctx.fillText(p.type.toUpperCase(),0,4);
  if(p.type==="counter")ctx.fillText(String(p.count||0),0,20);
  ctx.restore()
 }
}
function drawForeground(){}
function save(){localStorage.ddg_machine_v66=JSON.stringify({parts:data.parts,wires:data.wires});status("Machine saved")}
function load(){try{const x=JSON.parse(localStorage.ddg_machine_v66||"{}");data.parts=x.parts||[];data.wires=x.wires||[];sync();status("Machine loaded")}catch{status("Save could not load")}}
function network(type,p){if(type==="machine_sync"&&!B().getState().host){data.parts=p.parts||[];data.wires=p.wires||[]}}
function setupMode(mode){if(mode==="machine"){B().getState().world={w:3600,h:2200};const me=B().getMe();me.x=300;me.y=300;document.querySelector("#machinePanel")?.classList.remove("hidden");load()}}
function wireBridge(){const b=B();if(!b)return setTimeout(wireBridge,100);const old=window.DDG_GAMES66?.setup;window.DDG_GAMES66.setup=(mode)=>{old?.(mode);setupMode(mode)}}
window.DDG_MACHINE={pointerDown,drawWorld,drawForeground,network};
addEventListener("DOMContentLoaded",()=>{setup();wireBridge()});
})();