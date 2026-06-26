(() => {
"use strict";
const BLOCKED = [
  "fuck","shit","bitch","asshole","cunt","nigger","nigga","faggot","retard","kys",
  "porn","sex","rape","rapist","nazi"
];
const SUBS = {"0":"o","1":"i","!":"i","3":"e","4":"a","@":"a","5":"s","$":"s","7":"t","+":"t","8":"b","9":"g"};
const normalize = value => String(value||"")
  .toLowerCase()
  .split("").map(ch => SUBS[ch] || ch).join("")
  .replace(/[^a-z]/g,"")
  .replace(/(.)\1{2,}/g,"$1$1");
const skeleton = value => normalize(value).replace(/[aeiouy]/g,"");
function distance(a,b){
  const dp=Array.from({length:a.length+1},(_,i)=>[i]);
  for(let j=1;j<=b.length;j++)dp[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
    dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  }
  return dp[a.length][b.length];
}
function suspicious(token){
  const n=normalize(token);
  if(!n)return false;
  const sk=skeleton(token);
  return BLOCKED.some(word=>{
    const w=normalize(word), wsk=skeleton(word);
    if(n===w || n.includes(w) || (w.length>=4 && n.length>=4 && distance(n,w)<=1))return true;
    if(wsk.length>=3 && sk===wsk)return true;
    if(w.length>=4 && n.length>=4 && Math.abs(n.length-w.length)<=1 && distance(n,w)<=2 && n[0]===w[0] && n.at(-1)===w.at(-1))return true;
    return false;
  });
}
function censor(value){
  return String(value||"")
    .replace(/[<>]/g,"")
    .split(/(\s+)/)
    .map(part => /\s+/.test(part) ? part : (suspicious(part) ? "*".repeat(Math.max(3,part.length)) : part))
    .join("");
}
const defaults={
  particles:true,confetti:true,bubbles:true,showNames:true,showChatBubbles:true,
  lowPerformance:false,joystickSize:1,uiScale:1,masterVolume:1,musicVolume:.7,effectsVolume:.9,toolSounds:true,chatHidden:false,minimap:true,enabledTools:["confetti","bubbles","dice","coin","ping"]
};
let settings={...defaults,...JSON.parse(localStorage.ddg_settings||"{}")};
function saveSettings(){localStorage.ddg_settings=JSON.stringify(settings);applySettings()}
function applySettings(){
  document.documentElement.style.setProperty("--joystick-scale",String(settings.joystickSize));
  document.documentElement.style.setProperty("--ui-scale",String(settings.uiScale||1));
  document.body.classList.toggle("hide-player-names",!settings.showNames);
  document.body.classList.toggle("hide-chat-bubbles",!settings.showChatBubbles);
  document.body.classList.toggle("low-performance",!!settings.lowPerformance);
  window.dispatchEvent(new CustomEvent("ddg-settings-changed",{detail:{...settings}}));
}
window.DDG_SYSTEMS={censor,normalize,suspicious,settings,saveSettings,applySettings,defaults};
addEventListener("DOMContentLoaded",applySettings);
})();