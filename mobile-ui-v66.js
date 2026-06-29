(() => {
"use strict";
function closeAll(){
 document.body.classList.remove("mobile-ui-open");
 document.querySelector("#mobileDrawer")?.classList.remove("open");
 document.querySelector("#mobileDrawer")?.setAttribute("aria-hidden","true");
 for(const id of ["chatPanel","roundPanel","createPanel","machinePanel","toolPanel"])document.querySelector("#"+id)?.classList.remove("mobile-active-panel");
}
function openDrawer(){
 closeAll();document.body.classList.add("mobile-ui-open");
 const d=document.querySelector("#mobileDrawer");d?.classList.add("open");d?.setAttribute("aria-hidden","false");
}
addEventListener("DOMContentLoaded",()=>{
 const menu=document.querySelector("#mobileHudBtn"),shade=document.querySelector("#mobileHudShade");
 menu.onclick=openDrawer;shade.onclick=closeAll;document.querySelector("#mobileCloseBtn").onclick=closeAll;
 document.querySelectorAll("[data-mobile-panel]").forEach(b=>b.onclick=()=>{
  const id=b.dataset.mobilePanel,p=document.querySelector("#"+id);
  if(!p||p.classList.contains("hidden"))return;
  document.querySelector("#mobileDrawer")?.classList.remove("open");
  p.classList.add("mobile-active-panel");
 });
 document.querySelector("#mobileChatOpenBtn")?.addEventListener("click",()=>{closeAll();window.DDG_CHAT?.open?.()});
 document.querySelector("#mobileSettingsBtn").onclick=()=>{closeAll();document.querySelector("#ddgMenuButton")?.click()};
 document.querySelector("#mobileFullscreenBtn").onclick=()=>document.querySelector("#fullscreenBtn")?.click();
});
})();