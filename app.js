(()=>{"use strict";
const C=window.DADERP_CONFIG,$=id=>document.getElementById(id);
const screens=["hubScreen","roomScreen","gameScreen"];
function showScreen(id){for(const s of screens)$(s).classList.toggle("active",s===id)}
const BLOCKED=["fuck","shit","bitch","asshole","cunt","nigger","nigga","faggot","retard","kys"];
function censor(v){let s=String(v||"");for(const w of BLOCKED)s=s.replace(new RegExp("\\b"+w+"\\b","gi"),m=>"*".repeat(m.length));return s.replace(/[<>]/g,"")}
function uid(){return crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now()}
function code(n=6){const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return Array.from({length:n},()=>a[Math.random()*a.length|0]).join("")}
const profile=JSON.parse(localStorage.ddg_profile||"null")||{name:"Derp",color:"#46d7ff",face:"happy",hat:"none",friendCode:code(8),friends:[]};
function saveProfile(){localStorage.ddg_profile=JSON.stringify(profile)}
saveProfile();

function drawCube(ctx,cx,cy,size,p=profile){
 ctx.save();ctx.translate(cx,cy);
 ctx.fillStyle=p.color;ctx.fillRect(-size/2,-size/2,size,size);
 ctx.strokeStyle="#0009";ctx.lineWidth=Math.max(2,size*.07);ctx.strokeRect(-size/2,-size/2,size,size);
 ctx.fillStyle="#ffffff44";ctx.fillRect(-size*.32,-size*.32,size*.25,size*.12);
 ctx.strokeStyle="#101522";ctx.fillStyle="#101522";ctx.lineWidth=Math.max(2,size*.045);
 const eyeY=-size*.08;
 if(p.face==="happy"||p.face==="silly"||p.face==="angry"||p.face==="sleepy"){
   if(p.face==="sleepy"){ctx.beginPath();ctx.moveTo(-size*.23,eyeY);ctx.lineTo(-size*.08,eyeY);ctx.moveTo(size*.08,eyeY);ctx.lineTo(size*.23,eyeY);ctx.stroke()}
   else{ctx.beginPath();ctx.arc(-size*.16,eyeY,size*.045,0,7);ctx.arc(size*.16,eyeY,size*.045,0,7);ctx.fill()}
   ctx.beginPath();
   if(p.face==="angry"){ctx.moveTo(-size*.2,-size*.2);ctx.lineTo(-size*.08,-size*.14);ctx.moveTo(size*.2,-size*.2);ctx.lineTo(size*.08,-size*.14);ctx.stroke()}
   if(p.face==="silly"){ctx.arc(0,size*.13,size*.12,0,Math.PI);ctx.stroke();ctx.fillStyle="#ff6fa7";ctx.fillRect(size*.02,size*.12,size*.09,size*.12)}
   else{ctx.arc(0,size*.12,size*.13,0,Math.PI);ctx.stroke()}
 }else if(p.face==="cool"){
   ctx.fillRect(-size*.29,-size*.16,size*.23,size*.13);ctx.fillRect(size*.06,-size*.16,size*.23,size*.13);ctx.fillRect(-size*.06,-size*.12,size*.12,size*.04);
 }
 ctx.fillStyle="#1b2230";ctx.strokeStyle="#0009";
 if(p.hat==="cap"){ctx.fillStyle="#ff5b6e";ctx.fillRect(-size*.3,-size*.63,size*.6,size*.2);ctx.fillRect(size*.12,-size*.48,size*.3,size*.08)}
 if(p.hat==="crown"){ctx.fillStyle="#ffd55f";ctx.beginPath();ctx.moveTo(-size*.34,-size*.48);ctx.lineTo(-size*.27,-size*.75);ctx.lineTo(-size*.08,-size*.58);ctx.lineTo(size*.08,-size*.78);ctx.lineTo(size*.25,-size*.58);ctx.lineTo(size*.34,-size*.75);ctx.lineTo(size*.34,-size*.46);ctx.closePath();ctx.fill()}
 if(p.hat==="cone"){ctx.fillStyle="#ff8a3d";ctx.beginPath();ctx.moveTo(-size*.28,-size*.48);ctx.lineTo(0,-size*.95);ctx.lineTo(size*.28,-size*.48);ctx.closePath();ctx.fill();ctx.fillRect(-size*.37,-size*.5,size*.74,size*.08)}
 if(p.hat==="cat"){ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(-size*.32,-size*.47);ctx.lineTo(-size*.25,-size*.82);ctx.lineTo(-size*.05,-size*.49);ctx.moveTo(size*.32,-size*.47);ctx.lineTo(size*.25,-size*.82);ctx.lineTo(size*.05,-size*.49);ctx.fill()}
 if(p.hat==="wizard"){ctx.fillStyle="#7355d9";ctx.beginPath();ctx.moveTo(-size*.34,-size*.48);ctx.lineTo(size*.08,-size*1.02);ctx.lineTo(size*.3,-size*.48);ctx.closePath();ctx.fill();ctx.fillRect(-size*.42,-size*.5,size*.84,size*.09)}
 ctx.restore();
}
function renderProfilePreviews(){for(const id of ["profilePreview","customizePreview"]){const cv=$(id),ct=cv.getContext("2d");ct.clearRect(0,0,cv.width,cv.height);drawCube(ct,cv.width/2,cv.height/2+8,Math.min(cv.width,cv.height)*.58)}$("profilePreviewName").textContent=profile.name;$("displayNameInput").value=profile.name}
renderProfilePreviews();

$("profileBtn").onclick=()=>{$("cubeColorInput").value=profile.color;$("faceSelect").value=profile.face;$("hatSelect").value=profile.hat;renderProfilePreviews();$("profileDialog").showModal()};
for(const id of ["cubeColorInput","faceSelect","hatSelect"])$(id).oninput=()=>{profile.color=$("cubeColorInput").value;profile.face=$("faceSelect").value;profile.hat=$("hatSelect").value;renderProfilePreviews()};
$("saveProfileBtn").onclick=e=>{e.preventDefault();profile.color=$("cubeColorInput").value;profile.face=$("faceSelect").value;profile.hat=$("hatSelect").value;saveProfile();renderProfilePreviews();$("profileDialog").close()};

$("friendsBtn").onclick=()=>{renderFriends();$("friendsDialog").showModal()};
$("myFriendCode").textContent=profile.friendCode;
$("copyFriendCodeBtn").onclick=()=>navigator.clipboard?.writeText(profile.friendCode);
$("addFriendBtn").onclick=()=>{const v=$("friendCodeInput").value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10);if(v.length<5||v===profile.friendCode)return;if(!profile.friends.includes(v))profile.friends.push(v);$("friendCodeInput").value="";saveProfile();renderFriends()};
function renderFriends(){const d=$("friendsList");d.innerHTML="";if(!profile.friends.length)d.innerHTML='<p class="muted">No friends added yet.</p>';for(const f of profile.friends){const r=document.createElement("div");r.className="friend-item";r.innerHTML=`<b>${f}</b><span class="muted">saved friend</span><button type="button">Remove</button>`;r.querySelector("button").onclick=()=>{profile.friends=profile.friends.filter(x=>x!==f);saveProfile();renderFriends()};d.append(r)}}

const modeInfo={
 og:["OG Derp","Draw, chat, explore, and chill."],
 evil:["Survive the Evil Boi","Prototype: one player becomes Evil Boi and hunts the others."],
 create:["Create Mode","Prototype editor: place simple blocks, hazards, goals, and spawn areas."],
 platform:["Platformer Chaos","Prototype: jump and build in a side-view map."]
};
let selectedMode="og";
document.querySelectorAll("[data-open-mode]").forEach(b=>b.onclick=()=>{selectedMode=b.dataset.openMode;const m=modeInfo[selectedMode];$("roomModeTitle").textContent=m[0];$("roomModeDescription").textContent=m[1];showScreen("roomScreen")});
document.querySelectorAll("[data-back-hub]").forEach(b=>b.onclick=()=>showScreen("hubScreen"));

class Network{
 constructor(){this.client=window.supabase?.createClient(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY)||null;this.channel=null;this.bc=null;this.local=false;this.handlers={};this.player=null}
 on(t,f){(this.handlers[t]??=[]).push(f)}emit(t,p){for(const f of this.handlers[t]||[])f(p)}
 async join(room,player,local,host){await this.leave();this.player=player;this.local=local;if(local){this.bc=new BroadcastChannel(C.ROOM_PREFIX+":"+room);this.bc.onmessage=e=>this.emit(e.data.type,e.data);this.emit("connection","online");this.send("hello",{player,host});return}
  if(!this.client)throw Error("Supabase did not load");
  this.emit("connection","connecting");this.channel=this.client.channel(C.ROOM_PREFIX+":"+room,{config:{presence:{key:player.id},broadcast:{self:true}}});
  this.channel.on("presence",{event:"sync"},()=>{const a=[];for(const v of Object.values(this.channel.presenceState()))for(const p of v)a.push(p);this.emit("presence",a)}).on("broadcast",{event:"game"},({payload})=>this.emit(payload.type,payload));
  await new Promise((res,rej)=>{const t=setTimeout(()=>rej(Error("Connection timed out")),12000);this.channel.subscribe(async s=>{if(s==="SUBSCRIBED"){clearTimeout(t);await this.channel.track({...player,host});this.emit("connection","online");res()}else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT"){clearTimeout(t);rej(Error("Realtime failed"))}})})
 }
 async send(type,data={}){const p={...data,type,senderId:this.player?.id,sentAt:Date.now()};if(this.local){this.bc?.postMessage(p);this.emit(type,p)}else if(this.channel)await this.channel.send({type:"broadcast",event:"game",payload:p})}
 async leave(){try{this.bc?.close()}catch{}this.bc=null;if(this.channel&&this.client)try{await this.client.removeChannel(this.channel)}catch{}this.channel=null}
}
const net=new Network();

const canvas=$("gameCanvas"),ctx=canvas.getContext("2d"),WORLD={w:2300,h:1500},DRAW={x:1050,y:170,w:960,h:850};
let state=null;
function newState(){return{room:"",local:false,host:false,hostId:null,players:new Map(),targets:new Map(),strokes:[],mine:[],keys:new Set(),joy:{x:0,y:0},cam:{x:0,y:0},draw:false,lastMove:0,lastDraw:0,lastFrame:performance.now(),mode:selectedMode}}
let me=null,toastTimer;
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),1800)}
function resize(){const v=visualViewport||window,d=Math.min(devicePixelRatio||1,2),w=Math.round(v.width||innerWidth),h=Math.round(v.height||innerHeight);canvas.width=w*d;canvas.height=h*d;canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(d,0,0,d,0,0)}
addEventListener("resize",resize);visualViewport?.addEventListener("resize",resize);resize();

async function enterRoom(room,local,host){
 profile.name=censor($("displayNameInput").value||"Derp").slice(0,18)||"Derp";saveProfile();renderProfilePreviews();
 state=newState();state.room=room;state.local=local;state.host=host;state.hostId=host?uid():null;
 me={id:uid(),name:profile.name,color:profile.color,face:profile.face,hat:profile.hat,x:400+Math.random()*60,y:400+Math.random()*60,size:38,msg:"",msgUntil:0};
 if(host)state.hostId=me.id;
 $("roomStatus").textContent="Connecting...";
 try{await net.join(room,{...me},local,host);state.players.set(me.id,me);$("roomLabel").textContent=room;$("modeLabel").textContent=modeInfo[selectedMode][0].toUpperCase();showScreen("gameScreen");renderPlayers();net.send("hello",{player:me,host,mode:selectedMode});toast("Connected")}catch(e){$("roomStatus").textContent=e.message}
}
$("createOnlineBtn").onclick=()=>enterRoom(code(),false,true);
$("joinOnlineBtn").onclick=()=>{const r=$("roomCodeInput").value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8);if(r.length<4)return;$("roomCodeInput").value=r;enterRoom(r,false,false)};
$("createLocalBtn").onclick=()=>enterRoom(code(),true,true);
$("copyRoomBtn").onclick=()=>navigator.clipboard?.writeText(state?.room||"");
$("gameHubBtn").onclick=async()=>{if(state)await net.send("leave",{id:me.id});await net.leave();showScreen("hubScreen")};

net.on("connection",s=>{$("connectionLabel").className="pill "+s;$("connectionLabel").textContent=s});
net.on("presence",a=>{for(const p of a){if(p.host)state.hostId=p.id;if(p.id!==me.id&&!state.players.has(p.id))state.players.set(p.id,{...p,size:38})}renderPlayers()});
net.on("hello",p=>{
 if(!p.player)return;
 if(p.player.id===me?.id){
   state.players.set(me.id,me);
 }else{
   state.players.set(p.player.id,{...p.player,size:38});
 }
 if(p.host)state.hostId=p.player.id;
 renderPlayers()
});
net.on("move",p=>{if(p.id!==me.id){if(!state.players.has(p.id))state.players.set(p.id,{id:p.id,name:"Cube",color:"#fff",face:"none",hat:"none",x:p.x,y:p.y,size:38});state.targets.set(p.id,{x:p.x,y:p.y})}});
net.on("chat",p=>{addMessage(censor(p.name),censor(p.text),p.color);const q=state.players.get(p.senderId);if(q){q.msg=censor(p.text);q.msgUntil=Date.now()+3500}});
net.on("draw",p=>{if(p.senderId!==me.id)state.strokes.push(p)});
net.on("undo",p=>state.strokes=state.strokes.filter(s=>s.id!==p.strokeId));
net.on("clear",()=>state.strokes=[]);
net.on("leave",p=>{state.players.delete(p.id);renderPlayers()});

function renderPlayers(){if(!state)return;const d=$("playersList");d.innerHTML="";for(const p of state.players.values()){const r=document.createElement("div");r.className="player-row";r.innerHTML=`<i class="swatch"></i><span></span>${p.id===state.hostId?'<b class="host-tag">HOST</b>':''}`;r.querySelector("i").style.background=p.color;r.querySelector("span").textContent=p.name;d.append(r)}}
function addMessage(name,text,color){const d=document.createElement("div");d.className="message";const b=document.createElement("b");b.textContent=name+": ";b.style.color=color||"#7bdcff";d.append(b,document.createTextNode(text));$("chatMessages").append(d);$("chatMessages").scrollTop=1e9}
function sendChat(v){v=censor(v).trim().slice(0,160);if(!v)return;net.send("chat",{name:me.name,text:v,color:me.color});$("chatInput").value=""}
$("sendChatBtn").onclick=()=>sendChat($("chatInput").value);$("chatInput").onkeydown=e=>{if(e.key==="Enter"){e.stopPropagation();sendChat(e.target.value)}};document.querySelectorAll("[data-quick]").forEach(b=>b.onclick=()=>sendChat(b.dataset.quick));

addEventListener("keydown",e=>{if(document.activeElement===$("chatInput")||!state)return;const k=e.key.toLowerCase();if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k)){state.keys.add(k);e.preventDefault()}});
addEventListener("keyup",e=>state?.keys.delete(e.key.toLowerCase()));addEventListener("blur",()=>state?.keys.clear());

function setupJoystick(){const base=$("mobileJoystick"),stick=$("mobileStick");let id=null;const reset=()=>{id=null;if(state){state.joy.x=0;state.joy.y=0}stick.style.transform=""};function move(x,y){if(!state)return;const r=base.getBoundingClientRect(),m=r.width*.29;let dx=x-r.left-r.width/2,dy=y-r.top-r.height/2,l=Math.hypot(dx,dy)||1;if(l>m){dx=dx/l*m;dy=dy/l*m}state.joy.x=dx/m;state.joy.y=dy/m;stick.style.transform=`translate(${dx}px,${dy}px)`}
 base.onpointerdown=e=>{e.preventDefault();id=e.pointerId;base.setPointerCapture?.(id);move(e.clientX,e.clientY)};base.onpointermove=e=>{if(e.pointerId===id){e.preventDefault();move(e.clientX,e.clientY)}};base.onpointerup=base.onpointercancel=reset}
setupJoystick();

function toggleDraw(){if(!state)return;state.draw=!state.draw;$("drawModeBtn").textContent="Draw: "+(state.draw?"ON":"OFF");$("mobileDrawBtn").textContent=state.draw?"MOVE":"DRAW"}
$("drawModeBtn").onclick=$("mobileDrawBtn").onclick=toggleDraw;
$("undoDrawBtn").onclick=()=>{const id=state?.mine.pop();if(!id)return;state.strokes=state.strokes.filter(s=>s.id!==id);net.send("undo",{strokeId:id})};
$("clearDrawBtn").onclick=()=>{if(!state?.host)return toast("Host only");state.strokes=[];net.send("clear",{})};
$("interactBtn").onclick=$("mobileUseBtn").onclick=()=>{if(!me)return;me.msg="uses invisible object";me.msgUntil=Date.now()+2500;net.send("chat",{name:me.name,text:"uses invisible object",color:me.color})};

let drawing=false,lastPoint=null;
canvas.onpointerdown=e=>{if(!state?.draw)return;const p=screenToWorld(e.clientX,e.clientY);if(!inside(p,DRAW))return toast("Draw inside the pink zone");drawing=true;lastPoint=p};
canvas.onpointermove=e=>{if(!drawing||!state?.draw)return;const now=performance.now();if(now-state.lastDraw<C.DRAW_INTERVAL)return;const p=screenToWorld(e.clientX,e.clientY);if(!inside(p,DRAW))return;const s={id:uid(),owner:me.id,x1:lastPoint.x,y1:lastPoint.y,x2:p.x,y2:p.y,color:$("brushColorInput").value,size:7};state.strokes.push(s);state.mine.push(s.id);net.send("draw",s);lastPoint=p;state.lastDraw=now};
canvas.onpointerup=canvas.onpointercancel=()=>{drawing=false;lastPoint=null};

function update(dt){if(!state||!me)return;state.players.set(me.id,me);let dx=0,dy=0;if(!state.draw){if(state.keys.has("a")||state.keys.has("arrowleft"))dx--;if(state.keys.has("d")||state.keys.has("arrowright"))dx++;if(state.keys.has("w")||state.keys.has("arrowup"))dy--;if(state.keys.has("s")||state.keys.has("arrowdown"))dy++;dx+=state.joy.x;dy+=state.joy.y}const l=Math.hypot(dx,dy);if(l){dx/=l;dy/=l}me.x=clamp(me.x+dx*280*dt,20,WORLD.w-20);me.y=clamp(me.y+dy*280*dt,20,WORLD.h-20);for(const[id,t]of state.targets){const p=state.players.get(id);if(p){p.x+=(t.x-p.x)*Math.min(1,dt*12);p.y+=(t.y-p.y)*Math.min(1,dt*12)}}if(performance.now()-state.lastMove>C.MOVE_INTERVAL){net.send("move",{id:me.id,x:me.x,y:me.y});state.lastMove=performance.now()}const vw=visualViewport?.width||innerWidth,vh=visualViewport?.height||innerHeight;
state.cam.x=me.x-vw/2;
state.cam.y=me.y-vh/2}
function draw(){const vw=visualViewport?.width||innerWidth,vh=visualViewport?.height||innerHeight;
ctx.clearRect(0,0,vw,vh);
ctx.fillStyle="#080e19";ctx.fillRect(0,0,vw,vh);
if(!state)return;ctx.save();ctx.translate(-state.cam.x,-state.cam.y);ctx.fillStyle="#17263d";ctx.fillRect(0,0,WORLD.w,WORLD.h);ctx.strokeStyle="#ffffff0b";for(let x=0;x<WORLD.w;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,WORLD.h);ctx.stroke()}for(let y=0;y<WORLD.h;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WORLD.w,y);ctx.stroke()}ctx.fillStyle="#271a39";ctx.fillRect(DRAW.x,DRAW.y,DRAW.w,DRAW.h);ctx.strokeStyle="#ff4fc3";ctx.lineWidth=5;ctx.setLineDash([18,12]);ctx.strokeRect(DRAW.x,DRAW.y,DRAW.w,DRAW.h);ctx.setLineDash([]);ctx.fillStyle="#ffc7ee";ctx.font="bold 24px Arial";ctx.fillText("DRAWING ZONE",DRAW.x+20,DRAW.y+38);for(const s of state.strokes){ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.strokeStyle=s.color;ctx.lineWidth=s.size;ctx.lineCap="round";ctx.stroke()}for(const p of state.players.values()){
 if(p.id!==me?.id)drawWorldPlayer(p);
}
if(me)drawWorldPlayer(me);
ctx.strokeStyle="#4a607d";ctx.lineWidth=8;ctx.strokeRect(0,0,WORLD.w,WORLD.h);ctx.restore()}
function drawWorldPlayer(p){drawCube(ctx,p.x,p.y,p.size||38,p);ctx.fillStyle="#fff";ctx.font="bold 14px Arial";ctx.textAlign="center";ctx.fillText(p.name||"Cube",p.x,p.y-(p.size||38)*.8);if(p.msg&&p.msgUntil>Date.now()){ctx.fillStyle="#07111fee";ctx.fillRect(p.x-70,p.y-88,140,28);ctx.fillStyle="#fff";ctx.fillText(p.msg,p.x,p.y-69)}ctx.textAlign="left"}
function frame(t){const dt=Math.min(.04,(t-(state?.lastFrame||t))/1000);if(state)state.lastFrame=t;if($("gameScreen").classList.contains("active"))update(dt);draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
function screenToWorld(x,y){return{x:x+(state?.cam.x||0),y:y+(state?.cam.y||0)}}function inside(p,r){return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h}function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
})();