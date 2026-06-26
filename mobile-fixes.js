(() => {
"use strict";
function sync(e){
  const screen=e?.detail?.screen || (document.querySelector("#gameScreen")?.classList.contains("active")?"gameScreen":"hubScreen");
  document.body.classList.toggle("game-running",screen==="gameScreen");
  if(screen!=="gameScreen")document.body.classList.remove("mobile-ui-open");
}
addEventListener("ddg-screen-change",sync);
addEventListener("DOMContentLoaded",()=>sync());
})();