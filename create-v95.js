(() => {
"use strict";
const B=()=>window.DDG_BRIDGE;
let active=false,playtest=false;
function setup(mode){
 active=mode==="create";if(!active)return;
 const btn=document.querySelector("#createTestBtn");
 if(btn){btn.textContent="Mode: CREATE";btn.onclick=()=>{playtest=!playtest;const c=B().getCreator();c.test=playtest;btn.textContent=`Mode: ${playtest?"PLAYTEST":"CREATE"}`;document.body.classList.toggle("creator-playtest",playtest);B().toast(playtest?"Playtest started":"Returned to editor")}}
 const panel=document.querySelector("#createPanel");panel?.classList.remove("hidden")
}
window.DDG_CREATE95={setup,getPlaytest:()=>playtest};
})();