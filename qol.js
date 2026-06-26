(() => {
"use strict";
const S=window.DDG_SYSTEMS;
let unread=0,pingMode=false,lastActivity=Date.now(),lastAfk=false;
const pings=[];
let minimap,miniCtx;

function bridge(){return window.DDG_BRIDGE}
function createUI(){
  const chat=document.querySelector("#chatPanel");
  if(chat){
    const btn=document.createElement("button");
    btn.id="chatHideBtn";btn.textContent=S.settings.chatHidden?"Show Chat":"Hide Chat";
    btn.onclick=()=>{S.settings.chatHidden=!S.settings.chatHidden;S.saveSettings();applyChat()};
    chat.append(btn);
    const badge=document.createElement("button");badge.id="chatUnreadBadge";badge.hidden=true;
    badge.onclick=()=>{S.settings.chatHidden=false;S.saveSettings();applyChat()};
    document.body.append(badge);
    new MutationObserver(muts=>{
      if(!S.settings.chatHidden)return;
      let count=0;for(const m of muts)count+=m.addedNodes.length;
      if(count){unread+=count;updateUnread()}
    }).observe(document.querySelector("#chatMessages"),{childList:true});
    applyChat();
  }
  minimap=document.createElement("canvas");minimap.id="ddgMinimap";minimap.width=180;minimap.height=120;document.body.append(minimap);miniCtx=minimap.getContext("2d");
  minimap.onclick=()=>{S.settings.minimap=!S.settings.minimap;S.saveSettings()};
  addSettings();
  addActivityListeners();
  requestAnimationFrame(loop);
}
function applyChat(){
  const chat=document.querySelector("#chatPanel"),btn=document.querySelector("#chatHideBtn");
  chat?.classList.toggle("chat-collapsed",!!S.settings.chatHidden);
  if(btn)btn.textContent=S.settings.chatHidden?"Show Chat":"Hide Chat";
  if(!S.settings.chatHidden){unread=0;updateUnread()}
}
function updateUnread(){const b=document.querySelector("#chatUnreadBadge");if(!b)return;b.hidden=!S.settings.chatHidden;b.textContent=unread?`Chat (${unread})`:"Show Chat"}
function addSettings(){
  const panel=document.querySelector('[data-panel="settings"]');if(!panel)return;
  panel.insertAdjacentHTML("beforeend",`
   <label><input id="setHideChat" type="checkbox"> Hide chat panel</label>
   <label><input id="setMinimap" type="checkbox"> Minimap</label>
   <label>UI scale <input id="setUiScale" type="range" min=".75" max="1.35" step=".05"></label>
   <label>Master volume <input id="setMasterVolume" type="range" min="0" max="1" step=".05"></label>
   <label>Music volume <input id="setMusicVolume" type="range" min="0" max="1" step=".05"></label>
   <label>Effects volume <input id="setEffectsVolume" type="range" min="0" max="1" step=".05"></label>
   <button id="manualAfkBtn">Toggle AFK</button>`);
  const sync=()=>{
    document.querySelector("#setHideChat").checked=!!S.settings.chatHidden;
    document.querySelector("#setMinimap").checked=S.settings.minimap!==false;
    document.querySelector("#setUiScale").value=S.settings.uiScale||1;
    document.querySelector("#setMasterVolume").value=S.settings.masterVolume??1;
    document.querySelector("#setMusicVolume").value=S.settings.musicVolume??.7;
    document.querySelector("#setEffectsVolume").value=S.settings.effectsVolume??.9;
  };
  sync();
  document.querySelector("#setHideChat").onchange=e=>{S.settings.chatHidden=e.target.checked;S.saveSettings();applyChat()};
  document.querySelector("#setMinimap").onchange=e=>{S.settings.minimap=e.target.checked;S.saveSettings()};
  for(const [id,key] of [["setUiScale","uiScale"],["setMasterVolume","masterVolume"],["setMusicVolume","musicVolume"],["setEffectsVolume","effectsVolume"]]){
    document.querySelector("#"+id).oninput=e=>{S.settings[key]=+e.target.value;S.saveSettings()}
  }
  document.querySelector("#manualAfkBtn").onclick=()=>setAfk(!lastAfk,true);
  addEventListener("ddg-settings-changed",sync);
}
function addActivityListeners(){
  const active=()=>{lastActivity=Date.now();if(lastAfk)setAfk(false)};
  ["keydown","pointerdown","touchstart"].forEach(type=>addEventListener(type,active,{passive:true}));
  setInterval(()=>{const b=bridge(),st=b?.getState?.();if(!st)return;const afk=Date.now()-lastActivity>60000;if(afk!==lastAfk)setAfk(afk)},5000);
}
function setAfk(value,manual=false){
  const b=bridge(),me=b?.getMe?.();if(!b||!me)return;
  lastAfk=value;me.afk=value;b.net.send("afk",{id:me.id,afk:value});
  b.toast?.(value?"AFK enabled":"AFK disabled");
  if(!value&&!manual)lastActivity=Date.now();
}
function drawMinimap(){
  if(!miniCtx||S.settings.minimap===false){minimap.hidden=true;return}
  const b=bridge(),st=b?.getState?.(),me=b?.getMe?.(),world=b?.getWorld?.();
  if(!st||!me||!world||!document.querySelector("#gameScreen")?.classList.contains("active")){minimap.hidden=true;return}
  minimap.hidden=false;const w=minimap.width,h=minimap.height;
  miniCtx.clearRect(0,0,w,h);miniCtx.fillStyle="#07111fe8";miniCtx.fillRect(0,0,w,h);miniCtx.strokeStyle="#45617f";miniCtx.strokeRect(1,1,w-2,h-2);
  const sx=w/world.w,sy=h/world.h;
  for(const p of st.players.values()){
    miniCtx.fillStyle=p.id===me.id?"#fff":(p.color||"#46d7ff");
    miniCtx.fillRect(p.x*sx-2,p.y*sy-2,p.id===me.id?6:4,p.id===me.id?6:4);
  }
  for(const p of pings){miniCtx.strokeStyle=p.color||"#ffd45f";miniCtx.beginPath();miniCtx.arc(p.x*sx,p.y*sy,5,0,7);miniCtx.stroke()}
}
function loop(now){
  for(let i=pings.length-1;i>=0;i--)if(now-pings[i].created>6000)pings.splice(i,1);
  drawMinimap();requestAnimationFrame(loop);
}
addEventListener("ddg-ping-mode",()=>{pingMode=true;bridge()?.toast?.("Tap the world to place a ping")});
addEventListener("ddg-ping-received",e=>{pings.push({...e.detail,created:performance.now()})});
addEventListener("DOMContentLoaded",()=>{
  createUI();
  const canvas=document.querySelector("#gameCanvas");
  canvas?.addEventListener("pointerdown",e=>{
    if(!pingMode)return;
    pingMode=false;
    const b=bridge(),p=b?.screenToWorld?.(e.clientX,e.clientY),me=b?.getMe?.();
    if(!p||!me)return;
    const marker={x:p.x,y:p.y,color:me.color,name:me.name,created:performance.now()};
    pings.push(marker);b.net.send("ping_marker",marker);b.sendChat?.("placed a ping 📍");
    e.stopImmediatePropagation();e.preventDefault();
  },true);
});
})();