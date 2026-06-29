(() => {
"use strict";
let unread=0,open=false;
function panel(){return document.querySelector("#chatPanel")}
function badge(){return document.querySelector("#gameChatBadge")}
function sync(){
 const p=panel(),b=badge();if(!p)return;
 p.classList.toggle("chat-window-open",open);
 p.classList.toggle("chat-window-closed",!open);
 if(b){b.hidden=unread===0;b.textContent=unread>99?"99+":String(unread)}
 document.querySelector("#gameChatButton")?.classList.toggle("active",open)
}
function openChat(){
 open=true;unread=0;sync();
 setTimeout(()=>document.querySelector("#chatInput")?.focus(),50)
}
function closeChat(){open=false;sync()}
function toggle(){open?closeChat():openChat()}
addEventListener("DOMContentLoaded",()=>{
 const button=document.querySelector("#gameChatButton"),close=document.querySelector("#gameChatClose");
 button?.addEventListener("click",toggle);close?.addEventListener("click",closeChat);
 const messages=document.querySelector("#chatMessages");
 if(messages)new MutationObserver(m=>{
  if(open)return;let added=0;for(const x of m)added+=x.addedNodes.length;
  if(added){unread+=added;sync()}
 }).observe(messages,{childList:true});
 document.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&document.querySelector("#gameScreen")?.classList.contains("active")&&document.activeElement?.tagName!=="INPUT"){
   e.preventDefault();openChat()
  }
  if(e.key==="Escape"&&open)closeChat()
 });
 document.addEventListener("pointerdown",e=>{
  if(!open)return;const p=panel(),b=button;
  if(p&&!p.contains(e.target)&&b&&!b.contains(e.target)&&!e.target.closest("#mobileDrawer"))closeChat()
 },true);
 sync()
});
window.DDG_CHAT={open:openChat,close:closeChat,toggle};
})();