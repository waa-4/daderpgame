(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
let mode="idle",selected=null,dragging=false,offset={x:0,y:0},snap=true;
function creator(){return B()?.getCreator?.()}
function find(x,y){return [...(creator()?.objects||[])].reverse().find(o=>x>=o.x-o.w/2&&x<=o.x+o.w/2&&y>=o.y-o.h/2&&y<=o.y+o.h/2)}
function updateInfo(){
 const e=document.querySelector("#createSelectedInfo");if(!e)return;
 if(!selected)e.textContent="Nothing selected";
 else e.textContent=`${selected.type} • ${Math.round(selected.w)}×${Math.round(selected.h)}`
}
function select(o){
 selected=o||null;updateInfo();
 if(o){document.querySelector("#createWidth").value=o.w;document.querySelector("#createHeight").value=o.h;document.querySelector("#createColor").value=o.color}
}
function setup(){
 document.querySelector("#createSelectBtn").onclick=()=>{mode="select";B().toast("Tap an object to select and drag")};
 document.querySelector("#createCloneBtn").onclick=()=>{if(!selected)return B().toast("Select something first");const c={...selected,id:crypto.randomUUID(),x:selected.x+40,y:selected.y+40};creator().objects.push(c);select(c);B().syncCreator()};
 document.querySelector("#createDeleteBtn").onclick=()=>{if(!selected)return;creator().objects=creator().objects.filter(o=>o.id!==selected.id);select(null);B().syncCreator()};
 document.querySelector("#createSnapBtn").onclick=e=>{snap=!snap;e.target.textContent=`Grid Snap: ${snap?"ON":"OFF"}`};
 for(const id of ["createWidth","createHeight","createColor"]){
  document.querySelector("#"+id).addEventListener("input",()=>{
   if(!selected)return;
   selected.w=+document.querySelector("#createWidth").value;
   selected.h=+document.querySelector("#createHeight").value;
   selected.color=document.querySelector("#createColor").value;
   updateInfo();B().syncCreator()
  })
 }
}
function pointerDown(game,e){
 if(game!=="create"||mode!=="select")return false;
 const p=B().screenToWorld(e.clientX,e.clientY),o=find(p.x,p.y);select(o);
 if(o){dragging=true;offset={x:p.x-o.x,y:p.y-o.y}}return true;
}
function pointerMove(game,e){
 if(game!=="create"||!dragging||!selected)return false;
 const p=B().screenToWorld(e.clientX,e.clientY),grid=snap?20:1;
 selected.x=Math.round((p.x-offset.x)/grid)*grid;selected.y=Math.round((p.y-offset.y)/grid)*grid;return true;
}
function pointerUp(){if(dragging){dragging=false;B().syncCreator()}}
function drawWorld(game,ctx){
 if(game!=="create"||!selected)return;
 ctx.strokeStyle="#fff";ctx.lineWidth=4;ctx.setLineDash([9,6]);ctx.strokeRect(selected.x-selected.w/2-5,selected.y-selected.h/2-5,selected.w+10,selected.h+10);ctx.setLineDash([])
}
window.DDG_CREATE66={pointerDown,pointerMove,pointerUp,drawWorld};
addEventListener("DOMContentLoaded",setup);
})();