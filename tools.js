(() => {
"use strict";
const S=window.DDG_SYSTEMS;
const getBridge=()=>window.DDG_BRIDGE;
const toolDefs=[
  {id:"confetti",name:"Confetti Cannon",icon:"🎉",desc:"Shoots harmless confetti."},
  {id:"bubbles",name:"Bubble Wand",icon:"🫧",desc:"Creates floating bubbles."},
  {id:"dice",name:"Dice",icon:"🎲",desc:"Rolls a synced number."},
  {id:"coin",name:"Coin Flipper",icon:"🪙",desc:"Flips heads or tails."},
  {id:"ping",name:"Ping Marker",icon:"📍",desc:"Marks a place for the room."}
];
const particles=[];
let overlay,ctx,last=performance.now(),selectedTool="confetti";
const roomBans=new Set();

function ensureOverlay(){
  if(overlay)return;
  overlay=document.createElement("canvas");
  overlay.id="toolParticleCanvas";
  document.body.append(overlay);
  ctx=overlay.getContext("2d");
  const resize=()=>{const d=Math.min(devicePixelRatio||1,2);overlay.width=innerWidth*d;overlay.height=innerHeight*d;overlay.style.width=innerWidth+"px";overlay.style.height=innerHeight+"px";ctx.setTransform(d,0,0,d,0,0)};
  addEventListener("resize",resize);resize();requestAnimationFrame(tick);
}
function tick(now){
  const dt=Math.min(.04,(now-last)/1000);last=now;
  ctx.clearRect(0,0,innerWidth,innerHeight);
  for(const p of particles){
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.gravity||0)*dt;p.life-=dt;p.rot+=(p.spin||0)*dt;
    ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.maxLife);ctx.translate(p.x,p.y);ctx.rotate(p.rot||0);
    if(p.kind==="bubble"){ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.stroke()}
    else{ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.55)}
    ctx.restore();
  }
  for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0)particles.splice(i,1);
  requestAnimationFrame(tick);
}
function burst(kind="confetti"){
  ensureOverlay();
  const set=S.settings;
  if(!set.particles || (kind==="confetti"&&!set.confetti) || (kind==="bubble"&&!set.bubbles))return;
  const amount=set.lowPerformance?12:(kind==="bubble"?24:55);
  const colors=["#46d7ff","#ff4fc3","#ffd45f","#80ff98","#9a7bff","#ff6478"];
  for(let i=0;i<amount;i++){
    const life=1.6+Math.random()*1.8;
    particles.push({
      kind,x:innerWidth/2+(Math.random()-.5)*50,y:innerHeight/2+(Math.random()-.5)*35,
      vx:(Math.random()-.5)*(kind==="bubble"?130:460),vy:kind==="bubble"?-40-Math.random()*130:-180-Math.random()*360,
      gravity:kind==="bubble"?-8:420,size:kind==="bubble"?5+Math.random()*11:5+Math.random()*8,
      color:colors[Math.random()*colors.length|0],life,maxLife:life,rot:Math.random()*6.28,spin:(Math.random()-.5)*8
    });
  }
}
function useTool(id,remote=false){
  const bridge=getBridge();
  if(!bridge?.getState?.())return bridge?.toast?.("Join a game first");
  if(!S.settings.enabledTools.includes(id))return;
  if(id==="confetti")burst("confetti");
  if(id==="bubbles")burst("bubble");
  if(id==="dice"){const n=1+Math.floor(Math.random()*6);bridge.sendChat?.(`rolled a ${n} 🎲`)}
  if(id==="coin"){bridge.sendChat?.(Math.random()<.5?"flipped HEADS 🪙":"flipped TAILS 🪙")}
  if(id==="ping"){window.dispatchEvent(new CustomEvent("ddg-ping-mode"))}
  if(!remote)bridge.net?.send("tool_use",{tool:id});
}
function buildHotbar(){
  const bar=document.createElement("div");bar.id="ddgToolHotbar";
  for(const t of toolDefs){
    const b=document.createElement("button");b.dataset.tool=t.id;b.title=t.name;b.textContent=t.icon;
    b.onclick=()=>{selectedTool=t.id;useTool(t.id);bar.querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x===b))};
    bar.append(b);
  }
  document.body.append(bar);
  bar.querySelector("button")?.classList.add("selected");
}
function injectMenus(){
  const host=document.createElement("div");
  host.innerHTML=`
  <button id="ddgMenuButton">☰ Menu</button>
  <dialog id="ddgMenuDialog"><div class="ddg-menu-card">
    <div class="ddg-menu-head"><h2>DaDerpGame Menu</h2><button id="ddgMenuClose">✕</button></div>
    <div class="ddg-tabs"><button data-tab="settings">Settings</button><button data-tab="tools">Tools</button><button data-tab="players">Players</button><button data-tab="host">Host</button></div>
    <section data-panel="settings">
      <label><input id="setParticles" type="checkbox"> Particles</label>
      <label><input id="setConfetti" type="checkbox"> Confetti particles</label>
      <label><input id="setBubbles" type="checkbox"> Bubble particles</label>
      <label><input id="setNames" type="checkbox"> Player names</label>
      <label><input id="setChatBubbles" type="checkbox"> Chat bubbles</label>
      <label><input id="setLow" type="checkbox"> Low-performance mode</label>
      <label>Joystick size <input id="setJoystick" type="range" min=".75" max="1.45" step=".05"></label>
    </section>
    <section data-panel="tools"></section>
    <section data-panel="players"><div id="ddgPlayersMenu"></div></section>
    <section data-panel="host"><p>These controls appear when you are room host.</p><div id="ddgHostMenu"></div><button id="hostClearDrawings">Clear all drawings</button><button id="hostDisableTools">Toggle room tools</button></section>
  </div></dialog>`;
  document.body.append(...host.children);
  const d=document.querySelector("#ddgMenuDialog");
  document.querySelector("#ddgMenuButton").onclick=()=>{renderMenus();d.showModal()};
  document.querySelector("#ddgMenuClose").onclick=()=>d.close();
  document.querySelectorAll(".ddg-tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
  showTab("settings");
  const map={setParticles:"particles",setConfetti:"confetti",setBubbles:"bubbles",setNames:"showNames",setChatBubbles:"showChatBubbles",setLow:"lowPerformance"};
  for(const [id,key] of Object.entries(map))document.querySelector("#"+id).onchange=e=>{S.settings[key]=e.target.checked;S.saveSettings()};
  document.querySelector("#setJoystick").oninput=e=>{S.settings.joystickSize=+e.target.value;S.saveSettings()};
  document.querySelector("#hostClearDrawings").onclick=()=>getBridge()?.hostClearDrawings?.();
  document.querySelector("#hostDisableTools").onclick=()=>{const b=getBridge();if(!b?.isHost?.())return b?.toast?.("Host only");b.net.send("room_tools",{enabled:!window.DDG_ROOM_TOOLS_ENABLED});window.DDG_ROOM_TOOLS_ENABLED=!window.DDG_ROOM_TOOLS_ENABLED};
}
function showTab(id){document.querySelectorAll("[data-panel]").forEach(p=>p.hidden=p.dataset.panel!==id);document.querySelectorAll(".ddg-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===id))}
function renderMenus(){
  const set=S.settings;
  for(const [id,key] of Object.entries({setParticles:"particles",setConfetti:"confetti",setBubbles:"bubbles",setNames:"showNames",setChatBubbles:"showChatBubbles",setLow:"lowPerformance"}))document.querySelector("#"+id).checked=!!set[key];
  document.querySelector("#setJoystick").value=set.joystickSize;
  const toolPanel=document.querySelector('[data-panel="tools"]');toolPanel.innerHTML="";
  for(const t of toolDefs){const label=document.createElement("label");label.className="ddg-tool-toggle";label.innerHTML=`<span>${t.icon} <b>${t.name}</b><small>${t.desc}</small></span><input type="checkbox">`;const c=label.querySelector("input");c.checked=set.enabledTools.includes(t.id);c.onchange=()=>{set.enabledTools=c.checked?[...new Set([...set.enabledTools,t.id])]:set.enabledTools.filter(x=>x!==t.id);S.saveSettings();updateHotbar()};toolPanel.append(label)}
  renderPlayerControls();
}
function updateHotbar(){document.querySelectorAll("#ddgToolHotbar button").forEach(b=>b.hidden=!S.settings.enabledTools.includes(b.dataset.tool))}
function renderPlayerControls(){
  const bridge=getBridge(),state=bridge?.getState?.(),me=bridge?.getMe?.();
  const playerBox=document.querySelector("#ddgPlayersMenu"),hostBox=document.querySelector("#ddgHostMenu");
  playerBox.innerHTML="";hostBox.innerHTML="";
  if(!state){playerBox.textContent="Join a room to see players.";hostBox.textContent="Join a room first.";return}
  for(const p of state.players.values()){
    if(p.id===me?.id)continue;
    const row=document.createElement("div");row.className="ddg-player-control";row.innerHTML=`<span>${p.name}</span><button>Mute</button>`;
    row.querySelector("button").onclick=()=>{window.DDG_MUTED??=new Set();window.DDG_MUTED.add(p.id);bridge.toast?.(`Muted ${p.name}`)};
    playerBox.append(row);
    const hr=document.createElement("div");hr.className="ddg-player-control";hr.innerHTML=`<span>${p.name}</span><button data-kick>Kick</button><button data-ban>Ban</button>`;
    hr.querySelector("[data-kick]").onclick=()=>bridge.hostKick?.(p.id,false);
    hr.querySelector("[data-ban]").onclick=()=>{roomBans.add(p.id);bridge.hostKick?.(p.id,true)};
    hostBox.append(hr);
  }
  document.querySelector('[data-tab="host"]').hidden=!bridge?.isHost?.();
}
function wireBridge(){
  const b=getBridge();
  if(!b)return setTimeout(wireBridge,100);
  b.net.on("tool_use",p=>{if(p.senderId!==b.getMe()?.id)useTool(p.tool,true)});
  b.net.on("room_tools",p=>{window.DDG_ROOM_TOOLS_ENABLED=p.enabled;document.querySelector("#ddgToolHotbar").hidden=!p.enabled;b.toast?.(p.enabled?"Room tools enabled":"Room tools disabled")});
  b.net.on("host_kick",p=>{if(p.target!==b.getMe()?.id)return;alert(p.ban?"You were banned from this room.":"You were kicked from this room.");b.leaveToHub?.()});
  const originalHelloHandlers=b.onPlayerHello;
  window.DDG_ROOM_TOOLS_ENABLED=true;
}
addEventListener("DOMContentLoaded",()=>{ensureOverlay();buildHotbar();injectMenus();updateHotbar();wireBridge()});
})();