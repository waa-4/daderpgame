(() => {
"use strict";
const $=s=>document.querySelector(s);
const hints={
 og:"WASD Move · Drag Look · Space Jump · E Use · Paint from Menu",
 evil:"WASD Move · Drag Look · Space Jump · Survive until time ends",
 warfare:"WASD Move · E Attack · Change weapon at bottom",
 freedraw:"Open Menu → Paint · Turn Painting ON · Drag on ground",
 create:"Click world to place · Use left editor · Toggle Create/Playtest",
 meat:"WASD Move · E Interact · Avoid yellow triangles",
 machine:"Choose part · Place it · Wire parts · Toggle switches",
 physics:"Spawn an object · Drag it · Release to throw",
 ycsn:"W/S Drive · A/D Steer · Collect fuel and scrap"
};
function showWelcome(){const o=$("#welcomeOverlay");if(o)o.classList.remove("hidden")}
function hideWelcome(){const o=$("#welcomeOverlay");if(o)o.classList.add("hidden");localStorage.ddg_seen_welcome="1"}
function showHelp(){showWelcome()}
addEventListener("DOMContentLoaded",()=>{
 if(!localStorage.ddg_seen_welcome)setTimeout(showWelcome,250);
 $("#welcomeStartBtn")?.addEventListener("click",hideWelcome);
 $("#helpBtn")?.addEventListener("click",showHelp);
 $("#gameHelpBtn")?.addEventListener("click",showHelp);
 $("#gameMenuBtn")?.addEventListener("click",()=>$("#gameQuickMenu")?.classList.toggle("hidden"));
 document.addEventListener("click",e=>{const q=$("#gameQuickMenu");if(q&&!q.classList.contains("hidden")&&!e.target.closest("#gameQuickMenu")&&!e.target.closest("#gameMenuBtn"))q.classList.add("hidden")});
 document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{
  const h=$("#controlHint");if(h)h.textContent=hints[b.dataset.mode]||"WASD Move · Drag Look · Space Jump · E Use"
 }));
});
})();