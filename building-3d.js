(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
let data={blocks:[],mode:"place",size:80,color:"#46d7ff"};
const snap=(n,s)=>Math.round(n/s)*s;
function status(t){const e=document.querySelector("#build3dStatus");if(e)e.textContent=t}
function sync(){B()?.net?.send("build3d_sync",{blocks:data.blocks})}
function save(){localStorage.ddg_build3d_v82=JSON.stringify(data.blocks);status("Build saved")}
function load(){
 try{
  const b=JSON.parse(localStorage.ddg_build3d_v82||"[]");
  data.blocks=Array.isArray(b)?b:[];
  sync();status(`Loaded ${data.blocks.length} blocks`)
 }catch{status("Build could not load")}
}
function setupUI(){
 const color=document.querySelector("#build3dColor"),size=document.querySelector("#build3dSize");
 if(!color||!size)return;
 color.oninput=e=>data.color=e.target.value;
 size.onchange=e=>data.size=+e.target.value;
 document.querySelector("#build3dPlaceBtn").onclick=()=>{data.mode="place";status("Place mode")};
 document.querySelector("#build3dRemoveBtn").onclick=()=>{data.mode="remove";status("Remove mode")};
 document.querySelector("#build3dSaveBtn").onclick=save;
 document.querySelector("#build3dLoadBtn").onclick=load;
 document.querySelector("#build3dClearBtn").onclick=()=>{
  data.blocks=[];sync();status("Build cleared")
 };
}
function pointerDown(mode,e){
 if(mode!=="build3d")return false;
 const b=B();if(!b)return true;
 const world=b.getWorld?.()||{w:3200,h:2200};
 const p=b.screenToWorld?.(e.clientX,e.clientY);
 if(!p)return true;
 const size=data.size, x=snap(Math.max(size/2,Math.min(world.w-size/2,p.x)),size), z=snap(Math.max(size/2,Math.min(world.h-size/2,p.y)),size);
 if(data.mode==="place"){
  const exists=data.blocks.some(q=>q.x===x&&q.z===z&&q.size===size);
  if(!exists){
   data.blocks.push({id:crypto.randomUUID(),x,z,size,color:data.color});
   sync();status(`Placed block • ${data.blocks.length} total`)
  }
 }else{
  let nearest=null,dist=Infinity;
  for(const q of data.blocks){
   const d=Math.hypot(q.x-p.x,q.z-p.y);
   if(d<dist){dist=d;nearest=q}
  }
  if(nearest&&dist<nearest.size*.9){
   data.blocks=data.blocks.filter(q=>q.id!==nearest.id);
   sync();status(`Removed block • ${data.blocks.length} left`)
  }else status("No block nearby")
 }
 return true;
}
function network(p){
 if(p.senderId===B()?.getMe?.()?.id)return;
 if(Array.isArray(p.blocks))data.blocks=p.blocks
}
function setupMode(mode){
 if(mode!=="build3d")return;
 const st=B().getState(),me=B().getMe();
 st.world={w:3200,h:2200};me.x=320;me.y=320;
 document.querySelector("#build3dPanel")?.classList.remove("hidden");
 load()
}
function wire(){
 const games=window.DDG_GAMES66;
 if(!games)return setTimeout(wire,50);
 const old=games.setup?.bind(games);
 games.setup=mode=>{old?.(mode);setupMode(mode)}
}
window.DDG_BUILD3D={pointerDown,network,getData:()=>data};
addEventListener("DOMContentLoaded",()=>{setupUI();wire()});
})();