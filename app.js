(()=>{"use strict";
const C=window.DADERP_CONFIG,$=id=>document.getElementById(id);
const SCREENS=["hubScreen","roomScreen","gameScreen"];
const MODES={
 og:{name:"OG Derp",desc:"Draw, chat, explore, and chill.",world:[2300,1500]},
 evil:{name:"Survive the Evil Boi",desc:"One player hunts everyone else before time runs out.",world:[2400,1600]},
 warfare:{name:"Cube Warfare",desc:"Red vs Blue team battles with three weapons.",world:[2600,1450]},
 freedraw:{name:"Free Drawing",desc:"Draw anywhere across a giant shared map.",world:[3200,2100]},
 create:{name:"Create Mode",desc:"Build, save, load, test, and share simple games.",world:[2600,1700]},
 machine:{name:"Machine Game",desc:"Build working machines with wires and logic blocks.",world:[3600,2200]},
 meat:{name:"MEAT",desc:"Survive three yellow triangle hunters inside a gigantic maze.",world:[5000,3200]},
 physics:{name:"Physics Things",desc:"Spawn, drag, throw, stack, and explode physics objects.",world:[3200,2200]},
 ycsn:{name:"You Can Stop Now",desc:"Drive endlessly, loot roadside areas, upgrade the car, and survive the night.",world:[2600,6000]}
};
const FACE_ITEMS=[
 ["none","None",0],["happy","Happy",0],["silly","Silly",0],["angry","Angry",0],["sleepy","Sleepy",0],["cool","Cool",0],
 ["shocked","Shocked",30],["wink","Wink",40],["evil","Evil Grin",55],["catface","Cat Face",60],["robot","Robot",75],["cyclops","Cyclops",90]
];
const HAT_ITEMS=[
 ["none","None",0],["cap","Derp Cap",0],["crown","Cardboard Crown",0],["cone","Traffic Cone",0],["cat","Cat Ears",0],["wizard","Wizard Hat",0],
 ["bucket","Rusty Bucket",45],["halo","Halo",60],["antenna","Antenna",70],["chef","Chef Hat",85],["party","Party Hat",100]
];
const censor=v=>window.DDG_SYSTEMS?.censor(v)??String(v||"").replace(/[<>]/g,"");
const uid=()=>crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now();
const makeCode=(n=6)=>{const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return Array.from({length:n},()=>a[Math.random()*a.length|0]).join("")};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const inside=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
function showScreen(id){
 if(id!=="gameScreen")window.DDG_CORE3D?.stop?.();
 for(const s of SCREENS)$(s).classList.toggle("active",s===id);
 document.body.classList.remove("mobile-ui-open");
 window.dispatchEvent(new CustomEvent("ddg-screen-change",{detail:{screen:id}}));
}

const DEFAULT_AVATAR={name:"Derp",color:"#46d7ff",face:"happy",hat:"none"};
const save=JSON.parse(localStorage.ddg_v5_save||"null")||{
 derpiness:0,activeSlot:0,slots:Array.from({length:5},()=>({...DEFAULT_AVATAR})),
 unlockedFaces:["none","happy","silly","angry","sleepy","cool"],
 unlockedHats:["none","cap","crown","cone","cat","wizard"],
 friendCode:makeCode(8),friends:[],creatorMaps:[]
};
while(save.slots.length<5)save.slots.push({...DEFAULT_AVATAR});
function persist(){localStorage.ddg_v5_save=JSON.stringify(save);updateCurrency()}
function avatar(){return save.slots[save.activeSlot]}
function earn(n,why=""){save.derpiness+=Math.max(0,Math.floor(n));persist();if(why)toast(`+${n} Derpiness — ${why}`)}
function spend(n){if(save.derpiness<n)return false;save.derpiness-=n;persist();return true}
function updateCurrency(){$("derpinessLabel").textContent=save.derpiness;$("gameDerpiness").textContent=save.derpiness}
persist();

function drawCube(ct,cx,cy,size,p){
 ct.save();ct.translate(cx,cy);ct.fillStyle=p.color;ct.fillRect(-size/2,-size/2,size,size);ct.strokeStyle="#0009";ct.lineWidth=Math.max(2,size*.07);ct.strokeRect(-size/2,-size/2,size,size);ct.fillStyle="#fff4";ct.fillRect(-size*.33,-size*.33,size*.25,size*.12);
 ct.strokeStyle="#111827";ct.fillStyle="#111827";ct.lineWidth=Math.max(2,size*.045);const ey=-size*.08;
 const dot=(x,y,r)=>{ct.beginPath();ct.arc(x,y,r,0,7);ct.fill()};
 if(["happy","silly","angry","shocked","wink","evil","catface"].includes(p.face)){if(p.face==="wink"){ct.beginPath();ct.moveTo(-size*.23,ey);ct.lineTo(-size*.08,ey);ct.stroke();dot(size*.16,ey,size*.045)}else{dot(-size*.16,ey,size*.045);dot(size*.16,ey,size*.045)}
  ct.beginPath();if(p.face==="shocked"){ct.arc(0,size*.14,size*.08,0,7);ct.stroke()}else if(p.face==="evil"){ct.arc(0,size*.06,size*.17,0,Math.PI);ct.stroke()}else if(p.face==="silly"){ct.arc(0,size*.12,size*.13,0,Math.PI);ct.stroke();ct.fillStyle="#ff6fa7";ct.fillRect(size*.02,size*.12,size*.09,size*.12)}else if(p.face==="catface"){ct.moveTo(-size*.08,size*.08);ct.lineTo(0,size*.14);ct.lineTo(size*.08,size*.08);ct.stroke();ct.beginPath();ct.moveTo(-size*.1,size*.17);ct.lineTo(-size*.23,size*.13);ct.moveTo(size*.1,size*.17);ct.lineTo(size*.23,size*.13);ct.stroke()}else{ct.arc(0,size*.12,size*.13,0,Math.PI);ct.stroke()}}
 else if(p.face==="sleepy"){ct.beginPath();ct.moveTo(-size*.23,ey);ct.lineTo(-size*.08,ey);ct.moveTo(size*.08,ey);ct.lineTo(size*.23,ey);ct.stroke();ct.beginPath();ct.arc(0,size*.13,size*.1,0,Math.PI);ct.stroke()}
 else if(p.face==="cool"){ct.fillRect(-size*.29,-size*.16,size*.23,size*.13);ct.fillRect(size*.06,-size*.16,size*.23,size*.13);ct.fillRect(-size*.06,-size*.12,size*.12,size*.04)}
 else if(p.face==="robot"){ct.strokeRect(-size*.26,-size*.18,size*.2,size*.15);ct.strokeRect(size*.06,-size*.18,size*.2,size*.15);ct.fillRect(-size*.14,size*.12,size*.28,size*.04)}
 else if(p.face==="cyclops"){dot(0,ey,size*.09);ct.beginPath();ct.arc(0,size*.14,size*.11,0,Math.PI);ct.stroke()}
 if(p.face==="angry"||p.face==="evil"){ct.beginPath();ct.moveTo(-size*.23,-size*.2);ct.lineTo(-size*.08,-size*.13);ct.moveTo(size*.23,-size*.2);ct.lineTo(size*.08,-size*.13);ct.stroke()}
 if(p.hat==="cap"){ct.fillStyle="#ff5b6e";ct.fillRect(-size*.3,-size*.63,size*.6,size*.2);ct.fillRect(size*.12,-size*.48,size*.3,size*.08)}
 if(p.hat==="crown"){ct.fillStyle="#ffd55f";ct.beginPath();ct.moveTo(-size*.34,-size*.48);ct.lineTo(-size*.27,-size*.75);ct.lineTo(-size*.08,-size*.58);ct.lineTo(size*.08,-size*.78);ct.lineTo(size*.25,-size*.58);ct.lineTo(size*.34,-size*.75);ct.lineTo(size*.34,-size*.46);ct.closePath();ct.fill()}
 if(p.hat==="cone"){ct.fillStyle="#ff8a3d";ct.beginPath();ct.moveTo(-size*.28,-size*.48);ct.lineTo(0,-size*.95);ct.lineTo(size*.28,-size*.48);ct.closePath();ct.fill();ct.fillRect(-size*.37,-size*.5,size*.74,size*.08)}
 if(p.hat==="cat"){ct.fillStyle=p.color;ct.beginPath();ct.moveTo(-size*.32,-size*.47);ct.lineTo(-size*.25,-size*.82);ct.lineTo(-size*.05,-size*.49);ct.moveTo(size*.32,-size*.47);ct.lineTo(size*.25,-size*.82);ct.lineTo(size*.05,-size*.49);ct.fill()}
 if(p.hat==="wizard"){ct.fillStyle="#7355d9";ct.beginPath();ct.moveTo(-size*.34,-size*.48);ct.lineTo(size*.08,-size*1.02);ct.lineTo(size*.3,-size*.48);ct.closePath();ct.fill();ct.fillRect(-size*.42,-size*.5,size*.84,size*.09)}
 if(p.hat==="bucket"){ct.fillStyle="#8b6f58";ct.fillRect(-size*.32,-size*.76,size*.64,size*.28);ct.strokeRect(-size*.32,-size*.76,size*.64,size*.28)}
 if(p.hat==="halo"){ct.strokeStyle="#ffe77a";ct.lineWidth=size*.08;ct.beginPath();ct.ellipse(0,-size*.72,size*.3,size*.09,0,0,7);ct.stroke()}
 if(p.hat==="antenna"){ct.strokeStyle="#c3d4e7";ct.beginPath();ct.moveTo(0,-size*.48);ct.lineTo(0,-size*.84);ct.stroke();ct.fillStyle="#ff5f7d";dot(0,-size*.88,size*.08)}
 if(p.hat==="chef"){ct.fillStyle="#fff";ct.beginPath();ct.arc(-size*.16,-size*.67,size*.18,0,7);ct.arc(size*.12,-size*.72,size*.2,0,7);ct.fill();ct.fillRect(-size*.31,-size*.62,size*.62,size*.2)}
 if(p.hat==="party"){ct.fillStyle="#ff63c7";ct.beginPath();ct.moveTo(-size*.25,-size*.48);ct.lineTo(0,-size*.98);ct.lineTo(size*.25,-size*.48);ct.closePath();ct.fill()}
 ct.restore();
}
function renderAvatarPreview(){for(const id of ["profilePreview","avatarPreview"]){const cv=$(id),ct=cv.getContext("2d");ct.clearRect(0,0,cv.width,cv.height);drawCube(ct,cv.width/2,cv.height/2+9,Math.min(cv.width,cv.height)*.58,avatar())}$("profilePreviewName").textContent=avatar().name;$("displayNameInput").value=avatar().name;$("activeSlotLabel").textContent=save.activeSlot+1}
renderAvatarPreview();

function drawAvatarEditorPreview(){
 const cv=$("avatarPreview"),ct=cv.getContext("2d");
 ct.clearRect(0,0,cv.width,cv.height);
 drawCube(ct,cv.width/2,cv.height/2+9,95,{
  ...avatar(),
  color:$("avatarColor").value,
  face:$("avatarFace").value,
  hat:$("avatarHat").value
 });
}
function populateAvatarUI(resetFields=true){
 $("avatarFace").innerHTML=FACE_ITEMS.map(([id,n,c])=>`<option value="${id}" ${!save.unlockedFaces.includes(id)&&c?"disabled":""}>${n}${!save.unlockedFaces.includes(id)?` — ${c} D`:""}</option>`).join("");
 $("avatarHat").innerHTML=HAT_ITEMS.map(([id,n,c])=>`<option value="${id}" ${!save.unlockedHats.includes(id)&&c?"disabled":""}>${n}${!save.unlockedHats.includes(id)?` — ${c} D`:""}</option>`).join("");
 if(resetFields){
  $("avatarColor").value=avatar().color;
  $("avatarFace").value=avatar().face;
  $("avatarHat").value=avatar().hat;
 }
 const sr=$("avatarSlots");sr.innerHTML="";
 for(let i=0;i<5;i++){
  const b=document.createElement("button");b.type="button";b.textContent=`Slot ${i+1}`;
  b.classList.toggle("active",i===save.activeSlot);
  b.onclick=()=>{save.activeSlot=i;persist();populateAvatarUI(true);renderAvatarPreview()};
  sr.append(b)
 }
 const shop=$("shopList");shop.innerHTML="";
 for(const [type,list,key] of [["Face",FACE_ITEMS,"unlockedFaces"],["Hat",HAT_ITEMS,"unlockedHats"]]){
  for(const [id,n,c] of list){
   if(!c||save[key].includes(id))continue;
   const d=document.createElement("div");d.className="shop-item";
   d.innerHTML=`<span>${type}: <b>${n}</b></span><button type="button">${c} D</button>`;
   d.querySelector("button").onclick=()=>{
    if(!spend(c))return toast("Not enough Derpiness");
    save[key].push(id);persist();populateAvatarUI(false);toast(`Unlocked ${n}`)
   };
   shop.append(d)
  }
 }
 drawAvatarEditorPreview();
}
$("avatarBtn").onclick=()=>{populateAvatarUI(true);$("avatarDialog").showModal()};
for(const id of ["avatarColor","avatarFace","avatarHat"]){
 $(id).oninput=drawAvatarEditorPreview;
}
$("saveAvatarBtn").onclick=()=>{
 Object.assign(avatar(),{
  color:$("avatarColor").value,
  face:$("avatarFace").value,
  hat:$("avatarHat").value
 });
 persist();renderAvatarPreview();$("avatarDialog").close();toast("Avatar slot saved")
};

$("friendsBtn").onclick=()=>{renderFriends();$("friendsDialog").showModal()};$("myFriendCode").textContent=save.friendCode;$("copyFriendBtn").onclick=()=>navigator.clipboard?.writeText(save.friendCode);$("addFriendBtn").onclick=()=>{const f=$("friendCodeInput").value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10);if(f.length<5||f===save.friendCode)return;if(!save.friends.includes(f))save.friends.push(f);$("friendCodeInput").value="";persist();renderFriends()};function renderFriends(){const d=$("friendsList");d.innerHTML=save.friends.length?"":'<p class="muted">No friends yet.</p>';for(const f of save.friends){const r=document.createElement("div");r.className="friend-item";r.innerHTML=`<b>${f}</b><span class="muted">saved friend</span><button type="button">Remove</button>`;r.querySelector("button").onclick=()=>{save.friends=save.friends.filter(x=>x!==f);persist();renderFriends()};d.append(r)}}

let selectedMode="og",selectedRender="3d";
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{
 selectedMode=b.dataset.mode;selectedRender="3d";
 $("roomModeTitle").textContent=`${MODES[selectedMode].name} — ${selectedRender.toUpperCase()}`;
 $("roomModeDescription").textContent=MODES[selectedMode].desc+(selectedRender==="3d"?" The same game rules rendered in 3D.":"");
 showScreen("roomScreen")
});document.querySelectorAll("[data-back-hub]").forEach(b=>b.onclick=()=>showScreen("hubScreen"));

class Network{
 constructor(){
  this.channel=null;this.bc=null;this.local=false;this.handlers={};this.player=null;
  this.room="";this.host=false;this.reconnecting=false;this.manualLeave=false;
  this.lastReceive=Date.now();this.watchdog=null;this.reconnectTimer=null;
  let clientRef=null;
  this.client=window.supabase?.createClient(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY,{
   realtime:{
    worker:true,
    heartbeatIntervalMs:15000,
    heartbeatCallback:(status)=>{
     this.emit("heartbeat",status);
     if(status==="ok")this.lastReceive=Date.now();
     if(status==="timeout"||status==="disconnected"){
      this.emit("connection","reconnecting");
      setTimeout(()=>clientRef?.realtime?.connect?.(),250);
      this.scheduleReconnect("heartbeat "+status);
     }
    }
   }
  })||null;
  clientRef=this.client;
  document.addEventListener("visibilitychange",()=>{
   if(!document.hidden&&!this.local&&this.room){
    if(!this.client?.realtime?.isConnected?.())this.client?.realtime?.connect?.();
    if(Date.now()-this.lastReceive>9000)this.scheduleReconnect("tab resumed");
   }
  });
  addEventListener("online",()=>{if(this.room&&!this.local)this.scheduleReconnect("network online")});
 }
 on(t,f){(this.handlers[t]??=[]).push(f)}
 emit(t,p){for(const f of this.handlers[t]||[])try{f(p)}catch(e){console.error(e)}}
 createChannel(){
  const topic="ddg-v6:"+this.room;
  this.channel=this.client.channel(topic,{config:{presence:{key:this.player.id},broadcast:{self:true,ack:false}}});
  this.channel
   .on("presence",{event:"sync"},()=>{
    this.lastReceive=Date.now();
    const a=[];for(const v of Object.values(this.channel.presenceState()))for(const p of v)a.push(p);
    this.emit("presence",a)
   })
   .on("broadcast",{event:"game"},({payload})=>{
    this.lastReceive=Date.now();
    this.emit(payload.type,payload)
   });
 }
 async subscribe(){
  return new Promise((res,rej)=>{
   const timeout=setTimeout(()=>rej(Error("Connection timed out")),14000);
   this.channel.subscribe(async(status,err)=>{
    if(status==="SUBSCRIBED"){
     clearTimeout(timeout);this.lastReceive=Date.now();this.reconnecting=false;
     await this.channel.track({...this.player,host:this.host});
     this.emit("connection","online");res();
    }else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"||status==="CLOSED"){
     this.emit("connection","reconnecting");
     if(!this.manualLeave)this.scheduleReconnect(status);
     if(status!=="CLOSED"){clearTimeout(timeout);rej(Error("Realtime "+status.toLowerCase()))}
    }
   })
  })
 }
 async join(room,player,local,host){
  await this.leave(false);
  this.manualLeave=false;this.player=player;this.local=local;this.room=room;this.host=host;
  if(local){
   this.bc=new BroadcastChannel("ddg-v6:"+room);
   this.bc.onmessage=e=>{this.lastReceive=Date.now();this.emit(e.data.type,e.data)};
   this.emit("connection","online");this.startWatchdog();this.send("hello",{player,host});return;
  }
  if(!this.client)throw Error("Supabase did not load");
  this.emit("connection","connecting");
  this.createChannel();
  await this.subscribe();
  this.startWatchdog();
 }
 startWatchdog(){
  clearInterval(this.watchdog);
  this.watchdog=setInterval(()=>{
   if(!this.room)return;
   if(this.local){this.send("net_ping",{nonce:Date.now()});return}
   const age=Date.now()-this.lastReceive;
   if(age>11000){this.emit("connection","reconnecting");this.scheduleReconnect("watchdog")}
   else this.send("net_ping",{nonce:Date.now()}).catch(()=>this.scheduleReconnect("ping failed"));
  },4000)
 }
 scheduleReconnect(reason){
  if(this.local||this.manualLeave||!this.room||this.reconnecting)return;
  this.reconnecting=true;
  clearTimeout(this.reconnectTimer);
  this.reconnectTimer=setTimeout(()=>this.reconnect(reason),600);
 }
 async reconnect(reason){
  if(this.local||this.manualLeave||!this.room)return;
  this.emit("connection","reconnecting");
  try{
   if(this.channel&&this.client)await this.client.removeChannel(this.channel).catch(()=>{});
   this.channel=null;
   this.client?.realtime?.connect?.();
   this.createChannel();
   await this.subscribe();
   await this.send("hello",{player:this.player,host:this.host,reconnected:true});
   await this.send("request_snapshot",{});
   this.lastReceive=Date.now();
   this.emit("reconnected",{reason});
  }catch(err){
   console.warn("Realtime reconnect failed:",err);
   this.reconnecting=false;
   clearTimeout(this.reconnectTimer);
   this.reconnectTimer=setTimeout(()=>this.scheduleReconnect("retry"),1800);
  }
 }
 async send(type,data={}){
  const p={...data,type,senderId:this.player?.id,sentAt:Date.now()};
  if(this.local){this.bc?.postMessage(p);this.emit(type,p);return}
  if(!this.channel){this.scheduleReconnect("send without channel");return}
  try{
   const result=await this.channel.send({type:"broadcast",event:"game",payload:p});
   if(result==="timed out"||result==="error")this.scheduleReconnect("send "+result);
   return result;
  }catch(err){this.scheduleReconnect("send exception");throw err}
 }
 async leave(manual=true){
  this.manualLeave=manual;
  clearInterval(this.watchdog);clearTimeout(this.reconnectTimer);
  this.watchdog=null;this.reconnectTimer=null;
  try{this.bc?.close()}catch{}this.bc=null;
  if(this.channel&&this.client)try{await this.client.removeChannel(this.channel)}catch{}
  this.channel=null;
  if(manual){this.room="";this.player=null}
  this.emit("connection","offline")
 }
}
const net=new Network();
const canvas=$("gameCanvas"),ctx=canvas.getContext("2d");
let state=null,me=null,toastTimer,lastEarn=0;
window.DDG_MUTED=new Set();
window.DDG_BRIDGE={
  net,
  getState:()=>state,
  getMode:()=>state?.mode,
  is3D:()=>!!state?.render3d,
  get3DData:()=>({
   mode:state?.mode,world:state?.world,strokes:state?.strokes||[],
   creator:state?.creator,round:state?.round,teamBase:state?.teamBase,
   teams:state?.teams,evilWalls:state?.mode==="evil"?(maps.evil[state.round.mapIndex]?.walls||[]):[],build3d:window.DDG_BUILD3D?.getData?.()
  }),
  getMe:()=>me,
  getKeys:()=>state?.keys,
  getJoy:()=>state?.joy,
  getWorld:()=>state?.world,
  getContext:()=>ctx,
  getWorld:()=>state?.world,
  getMode:()=>state?.mode,
  getPlayers:()=>state?.players,
  getHealth:()=>state?.health,
  getTeams:()=>state?.teams,
  getProjectiles:()=>state?.projectiles,
  getAvatar:()=>avatar(),
  syncCurrentAvatar:()=>{if(!me)return;Object.assign(me,avatar());net.send("avatar_v92",{playerId:me.id,face:me.face,hat:me.hat,color:me.color,name:me.name})},
  persistAvatar:()=>{persist();renderAvatarPreview()},
  getNet:()=>net,
  getCanvas:()=>canvas,
  earn:(n,why)=>earn(n,why),
  drawCube:(c,x,y,size,p)=>drawCube(c,x,y,size,p),
  uid,
  clamp,
  getCreator:()=>state?.creator,
  syncCreator:()=>net.send("creator_sync",{objects:state?.creator?.objects||[]}),
  addDrawingStroke:stroke=>{
   if(!state||!me||!stroke)return;
   state.strokes.push(stroke);state.mine.push(stroke.id);state.redo=[];
   net.send("draw",stroke);
  },
  screenToWorld:(x,y)=>({x:x+(state?.cam.x||0),y:y+(state?.cam.y||0)}),
  isHost:()=>!!state?.host,
  toast:t=>toast(t),
  sendChat:v=>sendChat(v),
  hostClearDrawings:()=>{if(!state?.host)return toast("Host only");state.strokes=[];net.send("clear",{})},
  hostKick:(target,ban=false)=>{if(!state?.host)return toast("Host only");net.send("host_kick",{target,ban})},
  leaveToHub:async()=>{try{await net.leave()}catch{}showScreen("hubScreen")},
  onPlayerHello:null
};
const maps={
 evil:[
  {name:"Dark Playground",bg:"#1a2034",walls:[{x:700,y:260,w:180,h:500},{x:1350,y:620,w:420,h:150},{x:1860,y:230,w:140,h:560}]},
  {name:"The Warehouse",bg:"#252323",walls:[{x:520,y:350,w:600,h:130},{x:1250,y:260,w:160,h:650},{x:1600,y:760,w:500,h:130}]},
  {name:"Purple Maze",bg:"#211832",walls:[{x:520,y:250,w:140,h:700},{x:980,y:600,w:700,h:120},{x:1900,y:240,w:130,h:760}]}
 ]
};
function newState(){const [w,h]=MODES[selectedMode].world;return{mode:selectedMode,render3d:true,world:{w,h},room:"",host:false,hostId:null,players:new Map(),targets:new Map(),keys:new Set(),joy:{x:0,y:0},cam:{x:0,y:0},strokes:[],mine:[],redo:[],draw:false,lastMove:0,lastDraw:0,lastFrame:performance.now(),afkSince:Date.now(),round:{phase:"lobby",time:15,number:0,evilId:null,mapIndex:0,alive:new Set(),winner:""},health:new Map(),teams:new Map(),teamBase:{red:500,blue:500},projectiles:[],cooldowns:{bat:0,laser:0,water:0},creator:{objects:[],placing:false,test:false},moduleData:{}}}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),1800)}
function resize(){const v=visualViewport||window,d=Math.min(devicePixelRatio||1,2),w=Math.round(v.width||innerWidth),h=Math.round(v.height||innerHeight);canvas.width=w*d;canvas.height=h*d;canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(d,0,0,d,0,0)}addEventListener("resize",resize);visualViewport?.addEventListener("resize",resize);resize();

async function enterRoom(room,local,host){avatar().name=censor($("displayNameInput").value||"Derp").slice(0,18)||"Derp";persist();renderAvatarPreview();state=newState();state.room=room;state.host=host;
 try{
  const cached=JSON.parse(localStorage.getItem("ddg_room_drawings_"+room)||"[]");
  if(Array.isArray(cached))state.strokes=cached.slice(-1500);
 }catch{}me={id:uid(),...avatar(),x:400+Math.random()*70,y:400+Math.random()*70,size:38,msg:"",msgUntil:0,alive:true};if(host)state.hostId=me.id;$("roomStatus").textContent="Connecting...";
 try{await net.join(room,{...me},local,host);state.players.set(me.id,me);$("roomLabel").textContent=room;$("modeLabel").textContent=(MODES[selectedMode].name+(state.render3d?" 3D":" 2D")).toUpperCase();showScreen("gameScreen");setupModeUI();renderPlayers();net.send("hello",{player:me,host,mode:selectedMode});net.send("request_snapshot",{target:me.id});toast("Connected")}catch(e){$("roomStatus").textContent=e.message}}
$("createOnlineBtn").onclick=()=>enterRoom(makeCode(),false,true);$("joinOnlineBtn").onclick=()=>{const r=$("roomCodeInput").value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8);if(r.length<4)return;enterRoom(r,false,false)};$("createLocalBtn").onclick=()=>enterRoom(makeCode(),true,true);$("copyRoomBtn").onclick=()=>navigator.clipboard?.writeText(state?.room||"");$("hubBtn").onclick=async()=>{if(state)await net.send("leave",{id:me.id});await net.leave();showScreen("hubScreen")};
$("fullscreenBtn").onclick=async()=>{
 try{
  if(!document.fullscreenElement){
   await document.documentElement.requestFullscreen?.();
   $("fullscreenBtn").textContent="Exit Fullscreen";
  }else{
   await document.exitFullscreen?.();
  }
 }catch{toast("Fullscreen is not available here")}
};
$("cameraModeBtn").onclick=()=>{const m=window.DDG_CORE3D?.cycleCamera?.()||"third";$("cameraModeBtn").textContent=`Camera: ${m==="first"?"First":"Third"}`};
document.addEventListener("fullscreenchange",()=>{
 $("fullscreenBtn").textContent=document.fullscreenElement?"Exit Fullscreen":"Fullscreen";
});
$("mobileHudBtn").onclick=()=>document.body.classList.toggle("mobile-ui-open");
$("mobileHudShade").onclick=()=>document.body.classList.remove("mobile-ui-open");

function setupModeUI(){
 $("roundPanel").classList.toggle("hidden",!["evil","warfare"].includes(state.mode));
 $("weaponSelect").classList.toggle("hidden",state.mode!=="warfare");
 $("createPanel").classList.toggle("hidden",state.mode!=="create");
 $("machinePanel")?.classList.toggle("hidden",state.mode!=="machine");
 $("physicsPanel")?.classList.toggle("hidden",state.mode!=="physics");
 $("ycsnPanel")?.classList.toggle("hidden",state.mode!=="ycsn");
 $("build3dPanel")?.classList.toggle("hidden",state.mode!=="build3d");
 $("drawBtn")?.classList.toggle("hidden",!["og","freedraw"].includes(state.mode));
 $("undoBtn")?.classList.toggle("hidden",!["og","freedraw"].includes(state.mode));
 $("redoBtn")?.classList.toggle("hidden",!["og","freedraw"].includes(state.mode));
 $("clearBtn")?.classList.toggle("hidden",!["og","freedraw"].includes(state.mode));
 if(state.mode==="freedraw")state.draw=true;
 if(state.mode==="warfare"){assignTeam(me.id);state.health.set(me.id,100)}
 if(state.mode==="create")loadCreatorLocal();
 window.DDG_GAMES66?.setup?.(state.mode);
 window.DDG_GAMES3D?.setup?.(state.mode);
 window.DDG_PHYSICS95?.setup?.(state.mode);
 window.DDG_YCSN95?.setup?.(state.mode);
 window.DDG_CREATE95?.setup?.(state.mode);
 window.DDG_CORE3D?.setup?.(state.mode);
}
function assignTeam(id){const red=[...state.teams.values()].filter(x=>x==="red").length,blue=[...state.teams.values()].filter(x=>x==="blue").length;state.teams.set(id,red<=blue?"red":"blue")}
net.on("connection",s=>{$("connectionLabel").className="pill "+s;$("connectionLabel").textContent=s});
net.on("reconnected",()=>{
 toast("Online connection restored");
 if(me)net.send("hello",{player:me,host:state?.host,mode:state?.mode,reconnected:true});
});
net.on("heartbeat",status=>{
 if(status==="timeout"||status==="disconnected")console.warn("Realtime heartbeat:",status);
});
net.on("presence",a=>{for(const p of a){if(p.host)state.hostId=p.id;if(p.id!==me.id&&!state.players.has(p.id)){state.players.set(p.id,{...p,size:38,alive:true});if(state.mode==="warfare"){assignTeam(p.id);state.health.set(p.id,100)}}}renderPlayers()});
net.on("hello",p=>{if(!p.player)return;window.DDG_GAMES66?.onPlayerHello?.(p.player);if(p.player.id===me?.id)state.players.set(me.id,me);else{state.players.set(p.player.id,{...p.player,size:38,alive:true});if(state.mode==="warfare"){assignTeam(p.player.id);state.health.set(p.player.id,100)}}if(p.host)state.hostId=p.player.id;renderPlayers()});
net.on("move",p=>{if(p.id!==me.id){if(!state.players.has(p.id))state.players.set(p.id,{id:p.id,name:"Cube",color:"#fff",face:"none",hat:"none",x:p.x,y:p.y,rot:p.rot||0,size:38,alive:true});state.targets.set(p.id,{x:p.x,y:p.y,rot:Number.isFinite(p.rot)?p.rot:0,jumpY:Number.isFinite(p.jumpY)?p.jumpY:0});const q=state.players.get(p.id);if(q){if(p.face)q.face=p.face;if(p.hat)q.hat=p.hat}}});
net.on("chat",p=>{if(window.DDG_MUTED?.has(p.senderId))return;addMessage(censor(p.name),censor(p.text),p.color);const q=state.players.get(p.senderId);if(q){q.msg=censor(p.text);q.msgUntil=Date.now()+3500}});
net.on("draw",p=>{if(p.senderId!==me.id)state.strokes.push(p);window.DDG_GAMES66?.network?.("draw",p)});net.on("undo",p=>state.strokes=state.strokes.filter(s=>s.id!==p.strokeId));net.on("redo",p=>{if(p.stroke)state.strokes.push(p.stroke)});net.on("clear",()=>state.strokes=[]);net.on("afk",p=>{const q=state.players.get(p.id);if(q)q.afk=!!p.afk});net.on("ping_marker",p=>window.dispatchEvent(new CustomEvent("ddg-ping-received",{detail:p})));net.on("leave",p=>{state.players.delete(p.id);window.DDG_GAMES66?.network?.("leave",p);renderPlayers()});
net.on("round_state",p=>{if(!state.host)Object.assign(state.round,p.round)});net.on("caught",p=>{const q=state.players.get(p.id);if(q)q.alive=false;if(p.id===me.id)me.alive=false});
net.on("war_hit",p=>applyDamage(p.target,p.damage,p.attacker,p.weapon));net.on("projectile",p=>state.projectiles.push(p.projectile));net.on("base_damage",p=>state.teamBase[p.team]=Math.max(0,p.hp));
net.on("creator_sync",p=>{if(!state.host)state.creator.objects=p.objects||[]});
net.on("machine_sync",p=>window.DDG_MACHINE?.network?.("machine_sync",p));
net.on("machine_event",p=>window.DDG_MACHINE?.network?.("machine_event",p));
net.on("v91_event",p=>window.DDG_GAMES3D?.network?.(p));
net.on("avatar_v92",p=>window.DDG_AVATAR_PAINT?.networkAvatar?.(p));
net.on("paint_v92",p=>window.DDG_AVATAR_PAINT?.networkPaint?.(p));
net.on("physics95",p=>window.DDG_PHYSICS95?.network?.(p));
net.on("ycsn95",p=>window.DDG_YCSN95?.network?.(p));
net.on("build3d_sync",p=>window.DDG_BUILD3D?.network?.(p));
net.on("request_snapshot",p=>{
 if(!state?.host)return;
 net.send("drawing_snapshot",{target:p.senderId,strokes:state.strokes.slice(-5000)});
 window.DDG_GAMES66?.sendSnapshot?.(p.senderId);
});
net.on("drawing_snapshot",p=>{
 if(p.target&&p.target!==me?.id)return;
 if(Array.isArray(p.strokes)&&p.strokes.length)state.strokes=p.strokes.slice(-5000);
});
net.on("draw",p=>{
 try{localStorage.setItem("ddg_room_drawings_"+state.room,JSON.stringify(state.strokes.slice(-1500)))}catch{}
});

function renderPlayers(){if(!state)return;const d=$("playersList");d.innerHTML="";for(const p of state.players.values()){const r=document.createElement("div");r.className="player-row";let extra="";if(state.mode==="warfare")extra=`<b style="color:${state.teams.get(p.id)==="red"?"#ff6b78":"#65a0ff"}">${state.teams.get(p.id)||"?"}</b>`;if(state.mode==="evil"&&p.id===state.round.evilId)extra='<b style="color:#ff6076">EVIL</b>';r.innerHTML=`<i class="swatch"></i><span></span>${extra}${p.id===state.hostId?'<b class="host-tag">HOST</b>':''}`;r.querySelector("i").style.background=p.color;r.querySelector("span").textContent=p.name;d.append(r)}}
function addMessage(name,text,color){const d=document.createElement("div");d.className="message";const b=document.createElement("b");b.textContent=name+": ";b.style.color=color||"#7bdcff";d.append(b,document.createTextNode(text));$("chatMessages").append(d);$("chatMessages").scrollTop=1e9}
function sendChat(v){v=censor(v).trim().slice(0,160);if(!v)return;if(me){me.msg=v;me.msgUntil=Date.now()+3500}net.send("chat",{name:me.name,text:v,color:me.color});$("chatInput").value=""}$("sendChatBtn").onclick=()=>sendChat($("chatInput").value);$("chatInput").onkeydown=e=>{if(e.key==="Enter"){e.stopPropagation();sendChat(e.target.value)}};document.querySelectorAll("[data-quick]").forEach(b=>b.onclick=()=>sendChat(b.dataset.quick));

addEventListener("keydown",e=>{
 if(document.activeElement===$("chatInput")||!state)return;
 const k=e.key.toLowerCase();
 if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k)){
  state.keys.add(k);state.afkSince=Date.now();e.preventDefault()
 }
 if(k===" "){if(window.DDG_CORE3D?.jump?.()!==true)doAction();e.preventDefault()}
});
addEventListener("keyup",e=>state?.keys.delete(e.key.toLowerCase()));
const clearHeldInput=()=>{
 if(!state)return;
 state.keys.clear();
 state.joy.x=0;state.joy.y=0;
};
addEventListener("blur",clearHeldInput);
addEventListener("pointercancel",clearHeldInput);
addEventListener("contextmenu",e=>{
 if(document.querySelector("#gameScreen")?.classList.contains("active"))e.preventDefault();
});
document.addEventListener("visibilitychange",()=>{if(document.hidden)clearHeldInput()});
function setupJoystick(){const base=$("mobileJoystick"),stick=$("mobileStick");let id=null;const reset=()=>{id=null;if(state){state.joy.x=0;state.joy.y=0}stick.style.transform=""};function mv(x,y){if(!state)return;const r=base.getBoundingClientRect(),m=r.width*.29;let dx=x-r.left-r.width/2,dy=y-r.top-r.height/2,l=Math.hypot(dx,dy)||1;if(l>m){dx=dx/l*m;dy=dy/l*m}state.joy.x=dx/m;state.joy.y=dy/m;stick.style.transform=`translate(${dx}px,${dy}px)`}base.onpointerdown=e=>{e.preventDefault();if(state)state.afkSince=Date.now();id=e.pointerId;base.setPointerCapture?.(id);mv(e.clientX,e.clientY)};base.onpointermove=e=>{if(e.pointerId===id){e.preventDefault();mv(e.clientX,e.clientY)}};base.onpointerup=base.onpointercancel=reset}setupJoystick();

function toggleDraw(){
 if(!state)return;
 state.draw=!state.draw;
 const drawButton=$("drawBtn");
 if(drawButton)drawButton.textContent="Draw: "+(state.draw?"ON":"OFF");
 $("mobileAltBtn").textContent=state.draw?"MOVE":"DRAW"
}
const drawButton=$("drawBtn");
if(drawButton)drawButton.onclick=()=>{if(["og","freedraw"].includes(state?.mode))toggleDraw();else if(state?.mode==="warfare")cycleWeapon()};
$("mobileAltBtn").onclick=()=>{if(["og","freedraw"].includes(state?.mode))toggleDraw();else if(state?.mode==="warfare")cycleWeapon()};
const undoButton=$("undoBtn");
if(undoButton)undoButton.onclick=()=>{const id=state?.mine.pop();if(!id)return toast("Nothing to undo");const stroke=state.strokes.find(s=>s.id===id);if(stroke)state.redo.push(stroke);state.strokes=state.strokes.filter(s=>s.id!==id);net.send("undo",{strokeId:id})};
const redoButton=$("redoBtn");
if(redoButton)redoButton.onclick=()=>{const stroke=state?.redo.pop();if(!stroke)return toast("Nothing to redo");state.strokes.push(stroke);state.mine.push(stroke.id);net.send("redo",{stroke})};
const clearButton=$("clearBtn");
if(clearButton)clearButton.onclick=()=>{if(!state?.host)return toast("Host only");state.strokes=[];net.send("clear",{})};
$("actionBtn").onclick=$("mobileActionBtn").onclick=doAction;
$("mobileJumpBtn").onclick=()=>{if(window.DDG_CORE3D?.jump?.()!==true)doAction()};
function cycleWeapon(){const s=$("weaponSelect"),i=(s.selectedIndex+1)%s.options.length;s.selectedIndex=i;toast(s.options[i].text)}
function doAction(){
 if(!state||!me)return;
 if(window.DDG_YCSN95?.action?.(state.mode)||window.DDG_PHYSICS95?.action?.(state.mode)||window.DDG_GAMES3D?.action?.(state.mode))return;
 if(window.DDG_GAMES66?.action?.(state.mode))return;
 if(state.mode==="warfare")fireWeapon();
 else if(state.mode==="create")state.creator.placing=!state.creator.placing;
 else{me.msg="uses invisible object";me.msgUntil=Date.now()+2500}
}

let drawing=false,lastPoint=null;
canvas.onpointerdown=e=>{if(state)state.afkSince=Date.now();if(window.DDG_BUILD3D?.pointerDown?.(state?.mode,e))return;if(window.DDG_MACHINE?.pointerDown?.(state?.mode,e))return;if(window.DDG_CREATE66?.pointerDown?.(state?.mode,e))return;if(window.DDG_GAMES66?.pointerDown?.(state?.mode,e))return;if(state?.mode==="create"&&state.creator.placing){placeCreatorObject(e);return}if(!state?.draw)return;const p=screenToWorld(e.clientX,e.clientY);if(state.mode==="og"&&!inside(p,{x:1050,y:170,w:960,h:850}))return toast("Draw inside the pink zone");drawing=true;lastPoint=p};
canvas.onpointermove=e=>{if(window.DDG_CREATE66?.pointerMove?.(state?.mode,e))return;if(!drawing||!state?.draw)return;const now=performance.now();if(now-state.lastDraw<28)return;const p=screenToWorld(e.clientX,e.clientY),s={id:uid(),owner:me.id,x1:lastPoint.x,y1:lastPoint.y,x2:p.x,y2:p.y,color:$("brushColor").value,size:7};state.strokes.push(s);state.mine.push(s.id);state.redo=[];net.send("draw",s);lastPoint=p;state.lastDraw=now};canvas.onpointerup=canvas.onpointercancel=()=>{window.DDG_CREATE66?.pointerUp?.();drawing=false;lastPoint=null};

function updateEvil(dt){
 const r=state.round;if(state.host){r.time-=dt;if(r.phase==="lobby"&&r.time<=0){r.phase="round";r.time=90;r.number++;r.mapIndex=(r.number-1)%maps.evil.length;const ids=[...state.players.keys()];r.evilId=ids[Math.floor(Math.random()*ids.length)]||me.id;r.alive=new Set(ids.filter(id=>id!==r.evilId));for(const p of state.players.values())p.alive=true;net.send("round_state",{round:{...r,alive:[...r.alive]}});earn(2,"round started")}
  else if(r.phase==="round"){const evil=state.players.get(r.evilId);if(evil){for(const [id,p] of state.players){if(id===r.evilId||!p.alive)continue;if(Math.hypot(evil.x-p.x,evil.y-p.y)<52){p.alive=false;r.alive.delete(id);net.send("caught",{id})}}}if(r.time<=0||r.alive.size===0){r.phase="results";r.time=8;r.winner=r.alive.size?"SURVIVORS":"EVIL BOI";net.send("round_state",{round:{...r,alive:[...r.alive]}});earn(r.winner==="SURVIVORS"&&me.id!==r.evilId?15:8,"round reward")}}
  else if(r.phase==="results"&&r.time<=0){r.phase="lobby";r.time=15;r.evilId=null;r.winner="";net.send("round_state",{round:{...r,alive:[]}})}
 }
 $("roundTitle").textContent=r.phase==="lobby"?"Next round":r.phase==="round"?(me.id===r.evilId?"YOU ARE EVIL BOI":"SURVIVE!"):`${r.winner} WIN`;
 $("roundTimer").textContent=Math.max(0,Math.ceil(r.time));$("roundInfo").textContent=r.phase==="round"?maps.evil[r.mapIndex].name:"Waiting for next round";
}
function updateWarfare(dt){
 $("roundTitle").textContent="CUBE WARFARE";$("roundTimer").textContent=`${state.teamBase.red} | ${state.teamBase.blue}`;$("roundInfo").textContent=`Your team: ${state.teams.get(me.id)||"?"}`;
 for(const k in state.cooldowns)state.cooldowns[k]=Math.max(0,state.cooldowns[k]-dt);
 for(const pr of state.projectiles){pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.life-=dt;if(pr.sender!==me.id){for(const [id,p] of state.players){if(state.teams.get(id)===pr.team||!p.alive)continue;if(Math.hypot(pr.x-p.x,pr.y-p.y)<pr.radius+20){applyDamage(id,pr.damage,pr.sender,pr.weapon);pr.life=0;break}}}}
 state.projectiles=state.projectiles.filter(p=>p.life>0);
 if(state.host&&(state.teamBase.red<=0||state.teamBase.blue<=0)){const win=state.teamBase.red<=0?"BLUE":"RED";$("roundTitle").textContent=`${win} WINS`;earn(state.teams.get(me.id)===win.toLowerCase()?20:5,"warfare result");state.teamBase={red:500,blue:500}}
}
function fireWeapon(){const w=$("weaponSelect").value;if(state.cooldowns[w]>0)return toast("Recharging");const team=state.teams.get(me.id),enemies=[...state.players.values()].filter(p=>state.teams.get(p.id)!==team&&p.alive).sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y));const target=enemies[0];if(!target)return;
 if(w==="bat"){if(Math.hypot(target.x-me.x,target.y-me.y)>85)return toast("Too far away");state.cooldowns.bat=.55;net.send("war_hit",{target:target.id,damage:35,attacker:me.id,weapon:"bat"});applyDamage(target.id,35,me.id,"bat")}
 else{const cfg=w==="laser"?{speed:260,damage:55,radius:54,cool:4}:{speed:600,damage:12,radius:16,cool:.45};state.cooldowns[w]=cfg.cool;const dx=target.x-me.x,dy=target.y-me.y,l=Math.hypot(dx,dy)||1,pr={id:uid(),x:me.x,y:me.y,vx:dx/l*cfg.speed,vy:dy/l*cfg.speed,damage:cfg.damage,radius:cfg.radius,life:4,team,sender:me.id,weapon:w};state.projectiles.push(pr);net.send("projectile",{projectile:pr})}}
function applyDamage(id,dmg,attacker,weapon){const hp=Math.max(0,(state.health.get(id)||100)-dmg);state.health.set(id,hp);if(id===me.id&&hp<=0){me.alive=false;setTimeout(()=>{me.alive=true;state.health.set(me.id,100);const team=state.teams.get(me.id);me.x=team==="red"?260:state.world.w-260;me.y=state.world.h/2},2500)}if(hp<=0&&attacker===me.id)earn(3,`${weapon} knockout`)}

function placeCreatorObject(e){const p=screenToWorld(e.clientX,e.clientY),o={id:uid(),type:$("createObjectType").value,x:p.x,y:p.y,w:+$("createWidth").value,h:+$("createHeight").value,color:$("createColor").value};state.creator.objects.push(o);state.creator.placing=false;net.send("creator_sync",{objects:state.creator.objects})}
function saveCreatorLocal(){save.creatorMaps[0]=state.creator.objects;persist();toast("Creator map saved")}
function loadCreatorLocal(){state.creator.objects=JSON.parse(JSON.stringify(save.creatorMaps[0]||[]))}
$("createPlaceBtn").onclick=()=>{state.creator.placing=!state.creator.placing;toast(state.creator.placing?"Click the map to place":"Placement off")};$("createTestBtn").onclick=()=>{state.creator.test=!state.creator.test;$("createTestBtn").textContent=`Test: ${state.creator.test?"ON":"OFF"}`};$("createSaveBtn").onclick=saveCreatorLocal;$("createLoadBtn").onclick=()=>{loadCreatorLocal();toast("Loaded")};$("createClearBtn").onclick=()=>{state.creator.objects=[];toast("Cleared")};$("createShareBtn").onclick=()=>{const data=btoa(unescape(encodeURIComponent(JSON.stringify(state.creator.objects))));const url=location.origin+location.pathname+"?map="+encodeURIComponent(data);navigator.clipboard?.writeText(url);toast("Share link copied")};
try{const q=new URLSearchParams(location.search).get("map");if(q){save.creatorMaps[0]=JSON.parse(decodeURIComponent(escape(atob(q))));persist()}}catch{}


function pushOutsideRect(x,y,r,pad=24){
 const left=Math.abs((x+pad)-r.x),right=Math.abs((r.x+r.w)-(x-pad));
 const top=Math.abs((y+pad)-r.y),bottom=Math.abs((r.y+r.h)-(y-pad));
 const m=Math.min(left,right,top,bottom);
 if(m===left)return{x:r.x-pad-2,y};
 if(m===right)return{x:r.x+r.w+pad+2,y};
 if(m===top)return{x,y:r.y-pad-2};
 return{x,y:r.y+r.h+pad+2};
}
function depenetratePlayer(){
 if(!state||!me)return;
 const custom=window.DDG_GAMES66?.solidRects?.(state.mode)||[];
 const creator=state.mode==="create"?(state.creator?.objects||[]).filter(o=>o.type==="block").map(o=>({x:o.x-o.w/2,y:o.y-o.h/2,w:o.w,h:o.h})):[];
 for(const r of [...custom,...creator]){
  if(me.x+22>r.x&&me.x-22<r.x+r.w&&me.y+22>r.y&&me.y-22<r.y+r.h){
   const p=pushOutsideRect(me.x,me.y,r,22);me.x=clamp(p.x,24,state.world.w-24);me.y=clamp(p.y,24,state.world.h-24);
  }
 }
}
function collisionMove(nx,ny){
 const threeResult=window.DDG_CORE3D?.collision?.(state?.mode,nx,ny);
 if(threeResult)return threeResult;
 const moduleResult=window.DDG_GAMES66?.collision?.(state?.mode,nx,ny);
 if(moduleResult)return moduleResult;
 const p={x:nx,y:ny};let blocked=false;
 if(state.mode==="evil"){for(const w of maps.evil[state.round.mapIndex]?.walls||[])if(nx+20>w.x&&nx-20<w.x+w.w&&ny+20>w.y&&ny-20<w.y+w.h)blocked=true}
 if(state.mode==="create"&&state.creator.test){for(const o of state.creator.objects)if(o.type==="block"&&nx+20>o.x-o.w/2&&nx-20<o.x+o.w/2&&ny+20>o.y-o.h/2&&ny-20<o.y+o.h/2)blocked=true}
 return blocked?{x:me.x,y:me.y}:{x:nx,y:ny}
}
function update(dt){
 if(!state||!me)return;state.players.set(me.id,me);if(performance.now()-lastEarn>30000){lastEarn=performance.now();earn(1,"playing")}
 depenetratePlayer();
 const handled=window.DDG_PHYSICS95?.update?.(state.mode,dt)===true||window.DDG_YCSN95?.update?.(state.mode,dt)===true||window.DDG_GAMES3D?.update?.(state.mode,dt)===true||window.DDG_GAMES66?.update?.(state.mode,dt)===true;
 if(!handled){
  let dx=0,dy=0;if(!state.draw&&me.alive){if(state.keys.has("a")||state.keys.has("arrowleft"))dx--;if(state.keys.has("d")||state.keys.has("arrowright"))dx++;if(state.keys.has("w")||state.keys.has("arrowup"))dy--;if(state.keys.has("s")||state.keys.has("arrowdown"))dy++;dx+=state.joy.x;dy+=state.joy.y}
 if(state.render3d){const v=window.DDG_CORE3D?.transformInput?.(dx,dy);if(v){dx=v.x;dy=v.y}}
 const l=Math.hypot(dx,dy);if(l){dx/=l;dy/=l}let speed=280*(state.speedBoost||1);if(state.mode==="evil"&&me.id===state.round.evilId)speed=340;const n=collisionMove(clamp(me.x+dx*speed*dt,20,state.world.w-20),clamp(me.y+dy*speed*dt,20,state.world.h-20));me.x=n.x;me.y=n.y;
 }
 for(const[id,t]of state.targets){const p=state.players.get(id);if(p){
  const a=Math.min(1,dt*12);p.x+=(t.x-p.x)*a;p.y+=(t.y-p.y)*a;
  if(Number.isFinite(t.rot)){let d=((t.rot-(p.rot||0)+Math.PI)%(Math.PI*2))-Math.PI;p.rot=(p.rot||0)+d*a} p.jumpY+=(Number(t.jumpY||0)-Number(p.jumpY||0))*Math.min(1,dt*15)
 }}if(performance.now()-state.lastMove>(C.MOVE_INTERVAL||90)){net.send("move",{id:me.id,x:me.x,y:me.y,rot:window.DDG_CORE3D?.getYaw?.()||me.rot||0,jumpY:window.DDG_CORE3D?.getJumpY?.()||0,face:me.face,hat:me.hat});state.lastMove=performance.now()}
 const vw=visualViewport?.width||innerWidth,vh=visualViewport?.height||innerHeight;state.cam.x=me.x-vw/2;state.cam.y=me.y-vh/2;
 if(state.mode==="evil")updateEvil(dt);if(state.mode==="warfare")updateWarfare(dt);
}
function draw(){
 const vw=visualViewport?.width||innerWidth,vh=visualViewport?.height||innerHeight;ctx.clearRect(0,0,vw,vh);ctx.fillStyle="#080e19";ctx.fillRect(0,0,vw,vh);if(!state)return;ctx.save();ctx.translate(-state.cam.x,-state.cam.y);
 if(window.DDG_GAMES66?.drawBackground?.(state.mode,ctx)){ /* module drew background */ } else {
 let bg="#17263d";if(state.mode==="evil")bg=maps.evil[state.round.mapIndex]?.bg||bg;if(state.mode==="warfare")bg="#19233a";if(state.mode==="freedraw")bg="#f2ead7";if(state.mode==="create")bg="#172a25";ctx.fillStyle=bg;ctx.fillRect(0,0,state.world.w,state.world.h);
 }
 ctx.strokeStyle=state.mode==="freedraw"?"#00000010":"#ffffff0b";for(let x=0;x<state.world.w;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,state.world.h);ctx.stroke()}for(let y=0;y<state.world.h;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(state.world.w,y);ctx.stroke()}
 if(state.mode==="og"){ctx.fillStyle="#271a39";ctx.fillRect(1050,170,960,850);ctx.strokeStyle="#ff4fc3";ctx.lineWidth=5;ctx.setLineDash([18,12]);ctx.strokeRect(1050,170,960,850);ctx.setLineDash([])}
 if(state.mode==="evil"){ctx.fillStyle="#10141f";for(const w of maps.evil[state.round.mapIndex]?.walls||[])ctx.fillRect(w.x,w.y,w.w,w.h)}
 if(state.mode==="warfare"){ctx.fillStyle="#8a2734";ctx.fillRect(80,state.world.h/2-180,170,360);ctx.fillStyle="#27568a";ctx.fillRect(state.world.w-250,state.world.h/2-180,170,360);ctx.fillStyle="#fff";ctx.font="bold 24px Arial";ctx.fillText(state.teamBase.red,120,state.world.h/2);ctx.fillText(state.teamBase.blue,state.world.w-210,state.world.h/2)}
 if(state.mode==="create"){for(const o of state.creator.objects){ctx.globalAlpha=o.type==="spawn"?.45:1;ctx.fillStyle=o.color;ctx.fillRect(o.x-o.w/2,o.y-o.h/2,o.w,o.h);ctx.globalAlpha=1;ctx.fillStyle="#fff";ctx.font="12px Arial";ctx.fillText(o.type,o.x-o.w/2+5,o.y-o.h/2+16)}}
 window.DDG_GAMES66?.drawWorld?.(state.mode,ctx);window.DDG_MACHINE?.drawWorld?.(state.mode,ctx);window.DDG_CREATE66?.drawWorld?.(state.mode,ctx);
 for(const s of state.strokes){ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.strokeStyle=s.color;ctx.lineWidth=s.size;ctx.lineCap="round";ctx.stroke()}
 for(const pr of state.projectiles){ctx.beginPath();ctx.arc(pr.x,pr.y,pr.radius*(pr.weapon==="laser"?.5:.7),0,7);ctx.fillStyle=pr.weapon==="laser"?"#ffdc5f":"#65c8ff";ctx.fill()}
 for(const p of state.players.values())if(p.id!==me.id)drawPlayer(p);drawPlayer(me);window.DDG_GAMES66?.drawForeground?.(state.mode,ctx);window.DDG_MACHINE?.drawForeground?.(state.mode,ctx);
 ctx.strokeStyle="#4a607d";ctx.lineWidth=8;ctx.strokeRect(0,0,state.world.w,state.world.h);ctx.restore()
}
function drawPlayer(p){if(!p)return;ctx.globalAlpha=p.alive===false?.35:1;drawCube(ctx,p.x,p.y,p.size||38,p);ctx.globalAlpha=1;ctx.fillStyle="#fff";ctx.font="bold 14px Arial";ctx.textAlign="center";if(window.DDG_SYSTEMS?.settings.showNames!==false)ctx.fillText(p.name||"Cube",p.x,p.y-(p.size||38)*.8);if(p.afk){ctx.fillStyle="#ffd86b";ctx.font="bold 11px Arial";ctx.fillText("AFK",p.x,p.y-(p.size||38)*1.18);ctx.fillStyle="#fff";ctx.font="bold 14px Arial"}if(p.msg&&p.msgUntil>Date.now()&&window.DDG_SYSTEMS?.settings.showChatBubbles!==false){
  const tw=Math.max(80,ctx.measureText(p.msg).width+18);
  ctx.fillStyle="#07111fee";ctx.fillRect(p.x-tw/2,p.y-88,tw,27);ctx.fillStyle="#fff";ctx.fillText(p.msg,p.x,p.y-69);
}
if(state.mode==="warfare"){ctx.fillStyle="#111";ctx.fillRect(p.x-24,p.y+29,48,6);ctx.fillStyle=(state.teams.get(p.id)==="red"?"#ff6076":"#5d9cff");ctx.fillRect(p.x-24,p.y+29,48*((state.health.get(p.id)||100)/100),6)}ctx.textAlign="left"}
function frame(t){const dt=Math.min(.04,(t-(state?.lastFrame||t))/1000);if(state)state.lastFrame=t;if($("gameScreen").classList.contains("active"))update(dt);draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
function screenToWorld(x,y){return{x:x+(state?.cam.x||0),y:y+(state?.cam.y||0)}}
})();