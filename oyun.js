const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1549084209312698398/3hs3SNGi2LUaBjrAdVAm-l2uljyc47R356NcqhLuqQkHkGlN0f5ES3vWCRNTDBfepErF';

app.use(express.json({ limit: '1mb' }));

// ===== KALICI DEPOLAMA =====
const DATA_DIR = path.join(__dirname, 'data');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch(e){}

function loadJSON(file, fallback){
  try {
    if (fs.existsSync(file)){
      var raw = fs.readFileSync(file, 'utf8');
      if (raw && raw.trim()) return JSON.parse(raw);
    }
  } catch(e){}
  return fallback;
}
function saveJSONSync(file, data){
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); return true; }
  catch(e){ return false; }
}

let MESSAGES = loadJSON(MESSAGES_FILE, []);
let MSG_ID = MESSAGES.length ? Math.max.apply(null, MESSAGES.map(function(m){ return m.id||0; })) : 0;
let SCORES = loadJSON(SCORES_FILE, []);

setInterval(function(){
  saveJSONSync(SCORES_FILE, SCORES);
  saveJSONSync(MESSAGES_FILE, MESSAGES);
}, 30000);

process.on('SIGTERM', function(){ saveJSONSync(SCORES_FILE, SCORES); saveJSONSync(MESSAGES_FILE, MESSAGES); process.exit(0); });
process.on('SIGINT', function(){ saveJSONSync(SCORES_FILE, SCORES); saveJSONSync(MESSAGES_FILE, MESSAGES); process.exit(0); });

// ===== SERVICE WORKER =====
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

// ===== HTML =====
const HTML = String.raw`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,viewport-fit=cover">
<title>Oyun Merkezi</title>
<meta name="theme-color" content="#0a0e1a">
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
:root{--bg:#0a0e1a;--bg2:#131a2e;--pri:#4a6cf7;--acc:#8b5cf6;--warn:#f59e0b;--mut:#94a3b8}
html,body{font-family:-apple-system,BlinkMacSystemFont,system-ui,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:#fff;-webkit-font-smoothing:antialiased}
body{padding-bottom:20px;overflow-x:hidden}
header{background:linear-gradient(180deg,var(--bg2),var(--bg));padding:16px;position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(255,255,255,.05)}
.logo{font-size:24px;font-weight:800;background:linear-gradient(90deg,#6cf,#c6f,#f6c);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-align:center}
.arama{margin-top:12px;width:100%;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:11px 14px;color:#fff;font-size:15px;font-family:inherit;outline:none}
.arama:focus{border-color:var(--pri);box-shadow:0 0 0 3px rgba(74,108,247,.15)}
.kats{display:flex;gap:8px;overflow-x:auto;padding:12px 16px;scrollbar-width:none}
.kats::-webkit-scrollbar{display:none}
.kat{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit}
.kat.aktif{background:linear-gradient(90deg,var(--pri),var(--acc));border-color:transparent;box-shadow:0 4px 14px rgba(74,108,247,.4)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding:8px 16px 24px}
.kart{background:linear-gradient(160deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px;cursor:pointer;transition:.2s;position:relative}
.kart:hover{transform:translateY(-3px);border-color:rgba(74,108,247,.5);box-shadow:0 12px 30px rgba(74,108,247,.2)}
.kart:active{transform:scale(.97)}
.kart .emoji{font-size:36px;display:block;margin-bottom:8px}
.kart .ad{font-size:15px;font-weight:700;margin-bottom:4px}
.kart .ack{font-size:11px;color:var(--mut);line-height:1.4;height:28px;overflow:hidden}
.kart .skor{position:absolute;top:10px;right:10px;font-size:10px;background:rgba(0,0,0,.5);padding:3px 7px;border-radius:8px;color:var(--warn);font-weight:700}
.kart .fav{position:absolute;bottom:10px;right:10px;font-size:16px;opacity:.4;cursor:pointer}
.kart .fav.aktif{opacity:1}
.bos{grid-column:1/-1;text-align:center;color:var(--mut);padding:40px;font-size:14px}
#gorunum{position:fixed;inset:0;background:var(--bg);z-index:1000;display:none;flex-direction:column}
#gorunum.aktif{display:flex}
.ghead{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.05);background:var(--bg2);gap:8px}
.geri{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;padding:8px 14px;border-radius:20px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
.gadi{font-size:15px;font-weight:800;flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gskor{font-size:13px;color:var(--warn);font-weight:700;background:rgba(245,158,11,.15);padding:6px 12px;border-radius:20px;white-space:nowrap}
#oyunRoot{flex:1;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;position:relative;flex-direction:column}
.btn{background:linear-gradient(90deg,var(--pri),var(--acc));border:none;color:#fff;padding:12px 24px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 6px 18px rgba(74,108,247,.35)}
.btn:active{transform:scale(.96)}
.btn.sec{background:linear-gradient(90deg,#64748b,#475569);box-shadow:none}
.hint{color:var(--mut);font-size:13px;text-align:center;line-height:1.6}
.gbitti{position:fixed;inset:0;background:rgba(10,12,25,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;z-index:2000;padding:24px;text-align:center}
.gbitti h2{font-size:24px}
.gbitti .skor{font-size:42px;font-weight:900;color:#6cf}
</style>
</head>
<body>

<header>
  <h1 class="logo">🎮 Oyun Merkezi</h1>
  <input id="arama" class="arama" placeholder="🔍 Oyun ara..." autocomplete="off">
</header>

<div id="kats" class="kats"></div>
<div id="grid" class="grid"></div>

<div id="gorunum">
  <div class="ghead">
    <button class="geri" id="geriBtn">← Geri</button>
    <div class="gadi" id="gAd"></div>
    <div class="gskor" id="gSkor">🏆 0</div>
  </div>
  <div id="oyunRoot"></div>
</div>

<script>
(function(){
'use strict';

var OYUNLAR = [];
function oyunEkle(id, ad, kat, emoji, aciklama, baslat){
  OYUNLAR.push({ id:id, ad:ad, kat:kat, emoji:emoji, aciklama:aciklama, baslat:baslat });
}

var Skor = {
  al: function(id){ return parseInt(localStorage.getItem('skor_' + id) || '0', 10); },
  kaydet: function(id, s){
    var m = this.al(id);
    if (s > m){ localStorage.setItem('skor_' + id, s); return true; }
    return false;
  }
};

var Fav = {
  list: function(){ try { return JSON.parse(localStorage.getItem('favs') || '[]'); } catch(e){ return []; } },
  toggle: function(id){
    var l = this.list();
    var i = l.indexOf(id);
    if (i > -1) l.splice(i,1); else l.push(id);
    localStorage.setItem('favs', JSON.stringify(l));
    return l.indexOf(id) > -1;
  },
  var: function(id){ return this.list().indexOf(id) > -1; }
};

var aktifTemizlik = [];
var aktifOyun = null;

function apiOlustur(){
  return {
    interval: function(fn, ms){ var id = setInterval(fn, ms); aktifTemizlik.push(function(){ clearInterval(id); }); return id; },
    timeout: function(fn, ms){ var id = setTimeout(fn, ms); aktifTemizlik.push(function(){ clearTimeout(id); }); return id; },
    on: function(el, ev, fn, opt){ el.addEventListener(ev, fn, opt); aktifTemizlik.push(function(){ el.removeEventListener(ev, fn, opt); }); },
    temizle: function(){ aktifTemizlik.forEach(function(f){ try{f();}catch(e){} }); aktifTemizlik = []; },
    skorKaydet: function(s){ return Skor.kaydet(aktifOyun.id, s); },
    bitti: function(skor, mesaj){
      var kayit = Skor.kaydet(aktifOyun.id, skor);
      var div = document.createElement('div');
      div.className = 'gbitti';
      var icerik = '<h2>' + (mesaj || 'Oyun Bitti!') + '</h2>';
      icerik += '<div class="skor">' + skor + '</div>';
      if (kayit) icerik += '<div style="color:#22c55e;font-weight:700">🏆 Yeni Rekor!</div>';
      else icerik += '<div style="color:#94a3b8;font-size:13px">Rekor: ' + Skor.al(aktifOyun.id) + '</div>';
      icerik += '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px">';
      icerik += '<button class="btn" id="gTekrar">🔄 Tekrar</button>';
      icerik += '<button class="btn sec" id="gKapat">← Menü</button>';
      icerik += '</div>';
      div.innerHTML = icerik;
      document.getElementById('oyunRoot').appendChild(div);
      document.getElementById('gTekrar').addEventListener('click', function(){ div.remove(); oyunAc(aktifOyun.id); });
      document.getElementById('gKapat').addEventListener('click', function(){ div.remove(); oyunKapat(); });
      guncelleSkorGoster();
    }
  };
}

// ===== MENÜ =====
var aktifKat = 'tumu';
var aramaMetni = '';

function kategoriAd(k){
  var m = { arcade:'🕹️ Arcade', puzzle:'🧩 Puzzle', kart:'🃏 Kart', refleks:'⚡ Refleks', sayi:'🔢 Sayı', kelime:'📝 Kelime', muzik:'🎵 Müzik', klasik:'👾 Klasik', uzay:'🚀 Uzay' };
  return m[k] || k;
}

function katListesi(){
  var set = { tumu: 1 };
  OYUNLAR.forEach(function(o){ set[o.kat] = 1; });
  return Object.keys(set);
}

function menuRender(){
  var katsEl = document.getElementById('kats');
  var gridEl = document.getElementById('grid');

  var katHtml = '';
  katListesi().forEach(function(k){
    var ad = k === 'tumu' ? '🎯 Tümü (' + OYUNLAR.length + ')' : kategoriAd(k);
    var aktif = k === aktifKat ? ' aktif' : '';
    katHtml += '<button class="kat' + aktif + '" data-kat="' + k + '">' + ad + '</button>';
  });
  katsEl.innerHTML = katHtml;
  Array.prototype.forEach.call(katsEl.querySelectorAll('.kat'), function(b){
    b.addEventListener('click', function(){
      aktifKat = b.getAttribute('data-kat');
      menuRender();
    });
  });

  var arama = aramaMetni.toLowerCase();
  var liste = OYUNLAR.filter(function(o){
    if (aktifKat !== 'tumu' && o.kat !== aktifKat) return false;
    if (arama && o.ad.toLowerCase().indexOf(arama) < 0 && o.aciklama.toLowerCase().indexOf(arama) < 0) return false;
    return true;
  });

  if (liste.length === 0){
    gridEl.innerHTML = '<div class="bos">😕 Oyun bulunamadı</div>';
    return;
  }

  var html = '';
  liste.forEach(function(o){
    var s = Skor.al(o.id);
    var fav = Fav.var(o.id) ? ' aktif' : '';
    html += '<div class="kart" data-id="' + o.id + '">'
      + '<div class="skor">🏆 ' + s + '</div>'
      + '<div class="emoji">' + o.emoji + '</div>'
      + '<div class="ad">' + o.ad + '</div>'
      + '<div class="ack">' + o.aciklama + '</div>'
      + '<div class="fav' + fav + '" data-fav="' + o.id + '">⭐</div>'
      + '</div>';
  });
  gridEl.innerHTML = html;

  Array.prototype.forEach.call(gridEl.querySelectorAll('.kart'), function(el){
    el.addEventListener('click', function(e){
      if (e.target.classList && e.target.classList.contains('fav')) return;
      oyunAc(el.getAttribute('data-id'));
    });
  });
  Array.prototype.forEach.call(gridEl.querySelectorAll('.fav'), function(el){
    el.addEventListener('click', function(e){
      e.stopPropagation();
      var id = el.getAttribute('data-fav');
      var aktif = Fav.toggle(id);
      el.classList.toggle('aktif', aktif);
    });
  });
}

function oyunAc(id){
  var o = null;
  for (var i=0;i<OYUNLAR.length;i++) if (OYUNLAR[i].id === id){ o = OYUNLAR[i]; break; }
  if (!o) return;

  aktifOyun = o;
  document.getElementById('gAd').textContent = o.emoji + ' ' + o.ad;
  guncelleSkorGoster();

  var root = document.getElementById('oyunRoot');
  root.innerHTML = '';
  document.getElementById('gorunum').classList.add('aktif');

  aktifTemizlik = [];
  try {
    o.baslat(root, apiOlustur());
  } catch(e){
    root.innerHTML = '<div class="hint">Hata: ' + e.message + '</div>';
    console.error(e);
  }
}

function guncelleSkorGoster(){
  if (!aktifOyun) return;
  document.getElementById('gSkor').textContent = '🏆 ' + Skor.al(aktifOyun.id);
}

function oyunKapat(){
  aktifTemizlik.forEach(function(f){ try{f();}catch(e){} });
  aktifTemizlik = [];
  document.getElementById('oyunRoot').innerHTML = '';
  document.getElementById('gorunum').classList.remove('aktif');
  aktifOyun = null;
  menuRender();
}

document.getElementById('geriBtn').addEventListener('click', oyunKapat);
document.getElementById('arama').addEventListener('input', function(e){
  aramaMetni = e.target.value;
  menuRender();
});

// ==================== 1. YILAN ====================
oyunEkle('snake','Yılan','arcade','🐍','Elmayı ye, kendine çarpma', function(root, api){
  var cv = document.createElement('canvas');
  cv.width = 400; cv.height = 400;
  cv.style.cssText = 'background:#111;border-radius:12px;max-width:90vw;max-height:70vh';
  root.appendChild(cv);
  var ctx = cv.getContext('2d');
  var S = 20, N = 20;
  var snake = [{x:10,y:10}], dir = {x:1,y:0}, food = rnd(), skor = 0, dead = false;

  function rnd(){
    while(true){
      var f = { x: Math.floor(Math.random()*N), y: Math.floor(Math.random()*N) };
      var cak = false;
      for (var i=0;i<snake.length;i++) if (snake[i].x === f.x && snake[i].y === f.y){ cak = true; break; }
      if (!cak) return f;
    }
  }
  function draw(){
    ctx.fillStyle = '#111'; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(food.x*S+2, food.y*S+2, S-4, S-4);
    ctx.fillStyle = '#22c55e';
    snake.forEach(function(s){ ctx.fillRect(s.x*S+2, s.y*S+2, S-4, S-4); });
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Skor: ' + skor, 12, 24);
  }
  api.interval(function(){
    if (dead) return;
    var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    var carpti = h.x < 0 || h.x >= N || h.y < 0 || h.y >= N;
    if (!carpti) for (var i=0;i<snake.length;i++) if (snake[i].x === h.x && snake[i].y === h.y){ carpti = true; break; }
    if (carpti){ dead = true; api.bitti(skor); return; }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y){ skor += 10; food = rnd(); } else snake.pop();
    draw();
  }, 110);
  api.on(document, 'keydown', function(e){
    if ((e.key === 'ArrowLeft' || e.key === 'a') && dir.x !== 1) dir = {x:-1,y:0};
    else if ((e.key === 'ArrowRight' || e.key === 'd') && dir.x !== -1) dir = {x:1,y:0};
    else if ((e.key === 'ArrowUp' || e.key === 'w') && dir.y !== 1) dir = {x:0,y:-1};
    else if ((e.key === 'ArrowDown' || e.key === 's') && dir.y !== -1) dir = {x:0,y:1};
    if (e.key.indexOf('Arrow') === 0) e.preventDefault();
  });
  var sx = 0, sy = 0;
  api.on(cv, 'touchstart', function(e){ sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  api.on(cv, 'touchend', function(e){
    var dx = e.changedTouches[0].clientX - sx;
    var dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > Math.abs(dy)){
      if (dx > 20 && dir.x !== -1) dir = {x:1,y:0};
      else if (dx < -20 && dir.x !== 1) dir = {x:-1,y:0};
    } else {
      if (dy > 20 && dir.y !== -1) dir = {x:0,y:1};
      else if (dy < -20 && dir.y !== 1) dir = {x:0,y:-1};
    }
  }, { passive: true });
  draw();
});

// ==================== 2. 2048 ====================
oyunEkle('2048','2048','puzzle','🔢','Birleştir, 2048 yap', function(root, api){
  var grid = document.createElement('div');
  grid.style.cssText = 'background:#1a1a2e;padding:10px;border-radius:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:min(88vw,380px);touch-action:none';
  root.appendChild(grid);
  var board = [], skor = 0, gameOver = false;

  function init(){
    board = [];
    for (var i=0;i<16;i++) board.push(0);
    ekle(); ekle();
    render();
  }
  function ekle(){
    var bos = [];
    for (var i=0;i<16;i++) if (board[i] === 0) bos.push(i);
    if (!bos.length) return;
    var idx = bos[Math.floor(Math.random()*bos.length)];
    board[idx] = Math.random() < 0.9 ? 2 : 4;
  }
  function renk(v){
    var r = {0:'#1a1a2e',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};
    return r[v] || '#3c3a32';
  }
  function yaziRenk(v){ return v <= 4 ? '#776e65' : '#fff'; }
  function render(){
    grid.innerHTML = '';
    board.forEach(function(v){
      var d = document.createElement('div');
      d.style.cssText = 'aspect-ratio:1;background:' + renk(v) + ';border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:' + (v>=1000?'6vw':'7vw') + ';color:' + yaziRenk(v);
      d.textContent = v || '';
      grid.appendChild(d);
    });
  }
  function kaydir(yon){
    if (gameOver) return;
    var old = board.join();
    for (var i=0;i<4;i++){
      var line = [];
      for (var j=0;j<4;j++){
        var idx = (yon === 'sol' || yon === 'sag') ? i*4+j : j*4+i;
        if (board[idx]) line.push(board[idx]);
      }
      if (yon === 'sag' || yon === 'asagi') line.reverse();
      var yeni = [];
      for (var k=0;k<line.length;k++){
        if (line[k] === line[k+1]){ yeni.push(line[k]*2); skor += line[k]*2; k++; }
        else yeni.push(line[k]);
      }
      while (yeni.length < 4) yeni.push(0);
      if (yon === 'sag' || yon === 'asagi') yeni.reverse();
      for (var j2=0;j2<4;j2++){
        var idx2 = (yon === 'sol' || yon === 'sag') ? i*4+j2 : j2*4+i;
        board[idx2] = yeni[j2];
      }
    }
    if (old !== board.join()){ ekle(); render(); kontrol(); }
  }
  function kontrol(){
    for (var i=0;i<16;i++) if (board[i] === 2048){ gameOver = true; api.bitti(skor, '🎉 2048!'); return; }
    for (var j=0;j<16;j++) if (board[j] === 0) return;
    for (var a=0;a<4;a++) for (var b=0;b<4;b++){
      var v = board[a*4+b];
      if (a<3 && v === board[(a+1)*4+b]) return;
      if (b<3 && v === board[a*4+b+1]) return;
    }
    gameOver = true;
    api.bitti(skor);
  }
  api.on(document, 'keydown', function(e){
    var m = {ArrowLeft:'sol',ArrowRight:'sag',ArrowUp:'yukari',ArrowDown:'asagi'};
    if (m[e.key]){ e.preventDefault(); kaydir(m[e.key]); }
  });
  var sx = 0, sy = 0;
  api.on(grid, 'touchstart', function(e){ sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  api.on(grid, 'touchend', function(e){
    var dx = e.changedTouches[0].clientX - sx;
    var dy = e.changedTouches[0].clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
    if (Math.abs(dx) > Math.abs(dy)) kaydir(dx > 0 ? 'sag' : 'sol');
    else kaydir(dy > 0 ? 'asagi' : 'yukari');
  }, { passive: true });
  init();
});

// ==================== 3. FLAPPY ====================
oyunEkle('flappy','Flappy','arcade','🐦','Boşluklardan geç', function(root, api){
  var cv = document.createElement('canvas');
  cv.width = 400; cv.height = 550;
  cv.style.cssText = 'background:linear-gradient(180deg,#4a90e2,#87ceeb);border-radius:12px;max-width:90vw;max-height:70vh';
  root.appendChild(cv);
  var ctx = cv.getContext('2d');
  var y = 250, vy = 0, borular = [], skor = 0, dead = false, frame = 0;
  var G = 0.45, Z = -8, BW = 65, GAP = 170;

  api.interval(function(){
    if (dead) return;
    frame++;
    vy += G; y += vy;
    if (frame % 90 === 0){
      var ust = 60 + Math.random() * (550 - GAP - 120);
      borular.push({ x: 400, ust: ust, gecti: false });
    }
    borular.forEach(function(b){ b.x -= 2.6; });
    borular = borular.filter(function(b){ return b.x > -80; });
    borular.forEach(function(b){
      if (!b.gecti && b.x + BW < 60){ b.gecti = true; skor++; }
    });
    if (y > 550 - 14 || y < 14){ dead = true; api.bitti(skor); return; }
    for (var i=0;i<borular.length;i++){
      var b = borular[i];
      if (74 > b.x && 46 < b.x + BW){
        if (y - 14 < b.ust || y + 14 > b.ust + GAP){ dead = true; api.bitti(skor); return; }
      }
    }
    draw();
  }, 16);

  function draw(){
    ctx.clearRect(0,0,400,550);
    ctx.fillStyle = '#5cb85c'; ctx.fillRect(0, 520, 400, 30);
    borular.forEach(function(b){
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(b.x, 0, BW, b.ust);
      ctx.fillRect(b.x, b.ust + GAP, BW, 550 - b.ust - GAP);
      ctx.fillStyle = '#388e3c';
      ctx.fillRect(b.x - 4, b.ust - 22, BW + 8, 22);
      ctx.fillRect(b.x - 4, b.ust + GAP, BW + 8, 22);
    });
    ctx.save();
    ctx.translate(60, y);
    ctx.rotate(Math.max(-0.5, Math.min(1.2, vy * 0.08)));
    ctx.fillStyle = '#fdd835'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(5, -4, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(6, -4, 2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff6f00'; ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(20,2); ctx.lineTo(12,5); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.strokeText(skor, 200, 60); ctx.fillText(skor, 200, 60);
  }

  function zipla(){ if (!dead) vy = Z; }
  api.on(document, 'keydown', function(e){ if (e.code === 'Space' || e.key === 'ArrowUp'){ e.preventDefault(); zipla(); } });
  api.on(cv, 'touchstart', function(e){ e.preventDefault(); zipla(); }, { passive: false });
  api.on(cv, 'mousedown', zipla);
  draw();
});

// ==================== 4. BREAKOUT ====================
oyunEkle('breakout','Breakout','klasik','🧱','Tuğlaları kır', function(root, api){
  var cv = document.createElement('canvas');
  cv.width = 400; cv.height = 500;
  cv.style.cssText = 'background:#111;border-radius:12px;max-width:90vw;max-height:70vh;touch-action:none';
  root.appendChild(cv);
  var ctx = cv.getContext('2d');
  var raket = { x:160, w:80, h:12 };
  var top = { x:200, y:400, dx:4, dy:-4, r:8 };
  var tugs = [], skor = 0, dead = false;
  var RENKLER = ['#ef4444','#f59e0b','#eab308','#22c55e','#3b82f6'];

  for (var s=0;s<5;s++) for (var j=0;j<8;j++){
    tugs.push({ x: j*49 + 8, y: s*24 + 40, w: 45, h: 20, c: RENKLER[s], v: (5-s)*10 });
  }
  function draw(){
    ctx.fillStyle = '#111'; ctx.fillRect(0,0,400,500);
    tugs.forEach(function(t){ ctx.fillStyle = t.c; ctx.fillRect(t.x, t.y, t.w, t.h); });
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(top.x, top.y, top.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#4a6cf7';
    ctx.fillRect(raket.x, 470, raket.w, raket.h);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Skor: ' + skor, 12, 24);
  }
  api.interval(function(){
    if (dead) return;
    top.x += top.dx; top.y += top.dy;
    if (top.x < top.r || top.x > 400-top.r) top.dx *= -1;
    if (top.y < top.r) top.dy *= -1;
    if (top.y > 470 - top.r && top.y < 480 && top.x > raket.x && top.x < raket.x + raket.w){
      top.dy = -Math.abs(top.dy);
      var vur = (top.x - (raket.x + raket.w/2)) / (raket.w/2);
      top.dx = vur * 4;
    }
    if (top.y > 510){ dead = true; api.bitti(skor); return; }
    for (var i=tugs.length-1;i>=0;i--){
      var t = tugs[i];
      if (top.x > t.x - top.r && top.x < t.x + t.w + top.r && top.y > t.y - top.r && top.y < t.y + t.h + top.r){
        var cx = Math.max(t.x, Math.min(top.x, t.x + t.w));
        var cy = Math.max(t.y, Math.min(top.y, t.y + t.h));
        var dx = top.x - cx, dy = top.y - cy;
        if (Math.abs(dx) > Math.abs(dy)) top.dx *= -1; else top.dy *= -1;
        skor += t.v;
        tugs.splice(i,1);
        break;
      }
    }
    if (tugs.length === 0){ dead = true; api.bitti(skor, '🎉 Kazandın!'); return; }
    draw();
  }, 16);
  function hareket(cx){
    var r = cv.getBoundingClientRect();
    var x = (cx - r.left) * (400 / r.width) - raket.w/2;
    raket.x = Math.max(0, Math.min(400 - raket.w, x));
  }
  api.on(cv, 'mousemove', function(e){ hareket(e.clientX); });
  api.on(cv, 'touchmove', function(e){ e.preventDefault(); hareket(e.touches[0].clientX); }, { passive: false });
  draw();
});

// ==================== 5. XOX ====================
oyunEkle('xox','XOX','klasik','⭕','Yapay zekaya karşı', function(root, api){
  var tahta = ['','','','','','','','',''];
  var sira = 'X', bitti = false;
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px';
  wrap.innerHTML = '<div class="hint" id="bilgi" style="font-size:16px;color:#6cf;font-weight:700;min-height:24px">Sıra: X</div>'
    + '<div id="tab" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:min(88vw,320px)"></div>'
    + '<button class="btn sec" id="yeni">Yeni Oyun</button>';
  root.appendChild(wrap);
  var tab = wrap.querySelector('#tab');
  var bilgi = wrap.querySelector('#bilgi');

  function render(){
    tab.innerHTML = '';
    tahta.forEach(function(v,i){
      var c = document.createElement('div');
      c.style.cssText = 'aspect-ratio:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:900;cursor:pointer;color:' + (v==='X'?'#6cf':'#f59e0b');
      c.textContent = v;
      c.addEventListener('click', function(){ tikla(i); });
      tab.appendChild(c);
    });
  }
  function tikla(i){
    if (bitti || tahta[i] || sira !== 'X') return;
    tahta[i] = 'X'; render();
    if (kazan('X')) return bitir('X');
    if (tahta.every(function(v){ return v; })) return bitir('B');
    sira = 'O'; bilgi.textContent = 'Sıra: O';
    api.timeout(aiHamle, 400);
  }
  function aiHamle(){
    if (bitti) return;
    var hamle = enIyi();
    if (hamle === -1) return;
    tahta[hamle] = 'O'; render();
    if (kazan('O')) return bitir('O');
    if (tahta.every(function(v){ return v; })) return bitir('B');
    sira = 'X'; bilgi.textContent = 'Sıra: X';
  }
  function enIyi(){
    for (var i=0;i<9;i++) if (!tahta[i]){ tahta[i]='O'; if (kazan('O')){ tahta[i]=''; return i; } tahta[i]=''; }
    for (var j=0;j<9;j++) if (!tahta[j]){ tahta[j]='X'; if (kazan('X')){ tahta[j]=''; return j; } tahta[j]=''; }
    if (!tahta[4]) return 4;
    var kose = [0,2,6,8].filter(function(i){ return !tahta[i]; });
    if (kose.length) return kose[Math.floor(Math.random()*kose.length)];
    var bos = [];
    for (var k=0;k<9;k++) if (!tahta[k]) bos.push(k);
    return bos.length ? bos[Math.floor(Math.random()*bos.length)] : -1;
  }
  function kazan(p){
    var k = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return k.some(function(c){ return tahta[c[0]] === p && tahta[c[1]] === p && tahta[c[2]] === p; });
  }
  function bitir(kim){
    bitti = true;
    if (kim === 'X'){ bilgi.textContent = '🎉 Kazandın!'; api.bitti(100, '🎉 Kazandın!'); }
    else if (kim === 'O'){ bilgi.textContent = '😢 Kaybettin'; api.bitti(0, '😢 Kaybettin'); }
    else { bilgi.textContent = '🤝 Berabere'; api.bitti(50, '🤝 Berabere'); }
  }
  wrap.querySelector('#yeni').addEventListener('click', function(){
    tahta = ['','','','','','','','','']; sira = 'X'; bitti = false;
    bilgi.textContent = 'Sıra: X'; render();
  });
  render();
});

// ==================== 6. HAFIZA ====================
oyunEkle('memory','Hafıza','kart','🧠','Kartları eşleştir', function(root, api){
  var emojiler = ['🍎','🍌','🍇','🍓','🍒','🥝','🍑','🍍'];
  var kartlar = emojiler.concat(emojiler).sort(function(){ return Math.random() - 0.5; });
  var acik = [], bulunan = 0, hamle = 0, kilit = false;
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:min(92vw,400px)';
  root.appendChild(wrap);
  var bilgi = document.createElement('div');
  bilgi.className = 'hint';
  bilgi.style.cssText = 'margin-top:12px;font-size:15px;font-weight:700;color:#6cf';
  bilgi.textContent = 'Hamle: 0';
  root.appendChild(bilgi);

  kartlar.forEach(function(e){
    var k = document.createElement('div');
    k.style.cssText = 'aspect-ratio:1;background:linear-gradient(135deg,#4a6cf7,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:36px;cursor:pointer;user-select:none';
    k.textContent = '?';
    k.dataset.e = e; k.dataset.acik = '0';
    k.addEventListener('click', function(){ cevir(k); });
    wrap.appendChild(k);
  });
  function cevir(k){
    if (kilit || k.dataset.acik === '1') return;
    k.textContent = k.dataset.e;
    k.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
    k.dataset.acik = '1';
    acik.push(k);
    if (acik.length === 2){
      hamle++; bilgi.textContent = 'Hamle: ' + hamle;
      kilit = true;
      if (acik[0].dataset.e === acik[1].dataset.e){
        bulunan += 1;
        api.timeout(function(){
          acik[0].style.opacity = '0.5'; acik[1].style.opacity = '0.5';
          acik = []; kilit = false;
          if (bulunan === emojiler.length){
            var puan = Math.max(100, 1000 - hamle * 20);
            api.bitti(puan, '🎉 Tamamladın!');
          }
        }, 500);
      } else {
        api.timeout(function(){
          acik.forEach(function(x){
            x.textContent = '?'; x.dataset.acik = '0';
            x.style.background = 'linear-gradient(135deg,#4a6cf7,#8b5cf6)';
          });
          acik = []; kilit = false;
        }, 800);
      }
    }
  }
});

// ==================== 7. SİMON ====================
oyunEkle('simon','Simon','muzik','🎵','Renk sırasını hatırla', function(root, api){
  var renkler = [
    { bg:'#ef4444', lit:'#fca5a5', tone:261 },
    { bg:'#22c55e', lit:'#86efac', tone:329 },
    { bg:'#3b82f6', lit:'#93c5fd', tone:392 },
    { bg:'#f59e0b', lit:'#fcd34d', tone:523 }
  ];
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;width:min(88vw,360px)';
  root.appendChild(wrap);
  var bilgi = document.createElement('div');
  bilgi.className = 'hint'; bilgi.style.cssText = 'margin-top:12px;font-size:16px;color:#6cf;font-weight:700';
  bilgi.textContent = 'İzle...';
  root.appendChild(bilgi);

  var sira = [], oyuncuSira = [], oynaniyor = false, skor = 0;
  var els = renkler.map(function(r, i){
    var d = document.createElement('div');
    d.style.cssText = 'aspect-ratio:1;background:' + r.bg + ';border-radius:16px;cursor:pointer';
    d.addEventListener('click', function(){ tikla(i); });
    wrap.appendChild(d);
    return d;
  });

  function ses(freq, sure){
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      var ac = new AC();
      var o = ac.createOscillator(); var g = ac.createGain();
      o.frequency.value = freq; o.type = 'sine';
      o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0.15, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + sure/1000);
      o.start(); o.stop(ac.currentTime + sure/1000);
    } catch(e){}
  }
  function yan(i, sure){
    var r = renkler[i];
    els[i].style.background = r.lit;
    ses(r.tone, sure);
    setTimeout(function(){ els[i].style.background = r.bg; }, sure);
  }
  function yeni(){
    sira.push(Math.floor(Math.random() * 4));
    oynaniyor = true;
    bilgi.textContent = 'İzle... (Seviye ' + sira.length + ')';
    var i = 0;
    var int = setInterval(function(){
      if (i >= sira.length){ clearInterval(int); oynaniyor = false; bilgi.textContent = 'Sen oyna!'; oyuncuSira = []; return; }
      yan(sira[i], 400); i++;
    }, 650);
  }
  function tikla(i){
    if (oynaniyor) return;
    yan(i, 200);
    oyuncuSira.push(i);
    var idx = oyuncuSira.length - 1;
    if (oyuncuSira[idx] !== sira[idx]){
      api.bitti(skor, '😢 Yanlış!');
      return;
    }
    if (oyuncuSira.length === sira.length){
      skor = sira.length * 10;
      bilgi.textContent = '✅ Doğru!';
      setTimeout(yeni, 800);
    }
  }
  yeni();
});

// ==================== 8. REFLEKS ====================
oyunEkle('refleks','Refleks','refleks','⚡','Yeşile dönünce tıkla', function(root, api){
  var wrap = document.createElement('div');
  wrap.style.cssText = 'width:min(90vw,420px);height:min(60vh,340px);border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer;user-select:none;padding:20px';
  wrap.style.background = 'linear-gradient(135deg,#ef4444,#b91c1c)';
  wrap.innerHTML = '<div style="font-size:40px;font-weight:900" id="buyuk">Bekle...</div><div class="hint" style="margin-top:12px" id="alt">Yeşile dönünce tıkla</div>';
  root.appendChild(wrap);

  var durum = 'bekle', t0 = 0, enIyi = 99999;
  var timeoutId;
  function yeniDeneme(){
    durum = 'hazir';
    wrap.style.background = 'linear-gradient(135deg,#ef4444,#b91c1c)';
    wrap.querySelector('#buyuk').textContent = 'Bekle...';
    var gecikme = 1500 + Math.random() * 3500;
    timeoutId = api.timeout(function(){
      durum = 'hazir2';
      t0 = performance.now();
      wrap.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
      wrap.querySelector('#buyuk').textContent = 'TIKLA!';
    }, gecikme);
  }
  api.on(wrap, 'click', function(){
    if (durum === 'bekle') return;
    if (durum === 'hazir'){
      clearTimeout(timeoutId);
      wrap.querySelector('#buyuk').textContent = 'Çok erken!';
      durum = 'bekle';
      setTimeout(yeniDeneme, 1000);
      return;
    }
    if (durum === 'hazir2'){
      var sure = Math.round(performance.now() - t0);
      if (sure < enIyi) enIyi = sure;
      var puan = Math.max(1, 500 - sure);
      api.bitti(puan, '⚡ ' + sure + ' ms');
      durum = 'bekle';
    }
  });
  yeniDeneme();
});

// ==================== 9. KÖSTEBEK ====================
oyunEkle('whack','Köstebek','refleks','🐹','Köstebekleri vur', function(root, api){
  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:min(88vw,380px)';
  root.appendChild(grid);
  var bilgi = document.createElement('div');
  bilgi.className = 'hint';
  bilgi.style.cssText = 'margin-top:12px;font-size:16px;color:#6cf;font-weight:700';
  bilgi.textContent = 'Skor: 0 | Süre: 30';
  root.appendChild(bilgi);

  var delikler = [], skor = 0, sure = 30, aktif = -1;
  for (var i=0;i<9;i++){
    (function(){
      var d = document.createElement('div');
      d.style.cssText = 'aspect-ratio:1;background:radial-gradient(circle at center,#3a2418 30%,#5a3820 100%);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:44px;cursor:pointer;user-select:none';
      var idx = i;
      d.addEventListener('click', function(){
        if (idx === aktif){
          skor += 10; bilgi.textContent = 'Skor: ' + skor + ' | Süre: ' + sure;
          d.textContent = '💥';
          aktif = -1;
          api.timeout(function(){ d.textContent = ''; }, 200);
        }
      });
      grid.appendChild(d);
      delikler.push(d);
    })();
  }
  api.interval(function(){
    if (sure <= 0){ api.bitti(skor); return; }
    sure--; bilgi.textContent = 'Skor: ' + skor + ' | Süre: ' + sure;
  }, 1000);
  function cikar(){
    if (sure <= 0) return;
    if (aktif > -1) delikler[aktif].textContent = '';
    aktif = Math.floor(Math.random() * 9);
    delikler[aktif].textContent = '🐹';
    api.timeout(cikar, Math.max(400, 900 - skor * 5));
  }
  api.timeout(cikar, 600);
});

// ==================== 10. RENK EŞLEŞTİRME ====================
oyunEkle('renk','Renk Eşleş','puzzle','🎨','Farklı renkli kutuyu bul', function(root, api){
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:14px';
  var bilgi = document.createElement('div');
  bilgi.className = 'hint'; bilgi.style.cssText = 'font-size:16px;color:#6cf;font-weight:700';
  bilgi.textContent = 'Seviye 1';
  wrap.appendChild(bilgi);
  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;gap:6px';
  wrap.appendChild(grid);
  root.appendChild(wrap);

  var seviye = 1, skor = 0;
  function yeni(){
    var boyut = Math.min(6, 1 + Math.floor(seviye / 2));
    var toplam = boyut * boyut;
    var hue = Math.floor(Math.random() * 360);
    var sat = 60 + Math.random() * 20;
    var acik = 45 + Math.random() * 15;
    var base = 'hsl(' + hue + ',' + sat + '%,' + acik + '%)';
    var diff = Math.max(5, 25 - seviye);
    var ozel = 'hsl(' + hue + ',' + sat + '%,' + (acik - diff) + '%)';
    var ozelIdx = Math.floor(Math.random() * toplam);
    grid.style.gridTemplateColumns = 'repeat(' + boyut + ',1fr)';
    grid.style.width = 'min(88vw,' + (boyut * 60) + 'px)';
    grid.innerHTML = '';
    for (var i=0;i<toplam;i++){
      (function(idx){
        var k = document.createElement('div');
        k.style.cssText = 'aspect-ratio:1;background:' + (idx === ozelIdx ? ozel : base) + ';border-radius:8px;cursor:pointer';
        k.addEventListener('click', function(){
          if (idx === ozelIdx){
            seviye++; skor += 10;
            bilgi.textContent = 'Seviye ' + seviye + ' — Skor ' + skor;
            yeni();
          } else {
            api.bitti(skor, '😢 Yanlış!');
          }
        });
        grid.appendChild(k);
      })(i);
    }
  }
  yeni();
});

// ==================== 11. MATEMATİK ====================
oyunEkle('matematik','Matematik','sayi','🔢','Hızlıca hesapla', function(root, api){
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:18px;width:min(90vw,400px)';
  var sorusu = document.createElement('div');
  sorusu.style.cssText = 'font-size:40px;font-weight:900;color:#6cf;text-align:center';
  var input = document.createElement('input');
  input.type = 'number'; input.inputMode = 'numeric';
  input.style.cssText = 'width:100%;background:rgba(0,0,0,.4);border:2px solid rgba(74,108,247,.4);border-radius:14px;padding:16px;color:#fff;font-size:28px;text-align:center;outline:none;font-family:inherit';
  var bilgi = document.createElement('div');
  bilgi.className = 'hint'; bilgi.style.cssText = 'font-size:16px;font-weight:700;color:#6cf';
  bilgi.textContent = 'Skor: 0 | Süre: 60';
  wrap.appendChild(bilgi); wrap.appendChild(sorusu); wrap.appendChild(input);
  root.appendChild(wrap);

  var a, b, op, cevap, skor = 0, sure = 60;
  function yeni(){
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    var ops = ['+','-','*'];
    op = ops[Math.floor(Math.random() * 3)];
    if (op === '+') cevap = a + b;
    else if (op === '-') cevap = a - b;
    else cevap = a * b;
    sorusu.textContent = a + ' ' + op + ' ' + b + ' = ?';
    input.value = '';
  }
  api.on(input, 'keydown', function(e){
    if (e.key === 'Enter'){
      e.preventDefault();
      if (parseInt(input.value, 10) === cevap){
        skor += 10;
        bilgi.textContent = 'Skor: ' + skor + ' | Süre: ' + sure;
        yeni();
      } else {
        input.style.borderColor = '#ef4444';
        setTimeout(function(){ input.style.borderColor = 'rgba(74,108,247,.4)'; }, 300);
      }
    }
  });
  api.interval(function(){
    if (sure <= 0){ api.bitti(skor); return; }
    sure--; bilgi.textContent = 'Skor: ' + skor + ' | Süre: ' + sure;
  }, 1000);
  input.focus();
  yeni();
});

// ==================== 12. YAZMA HIZI ====================
oyunEkle('yazi','Yazma Hızı','kelime','⌨️','Kelimeyi hızlı yaz', function(root, api){
  var kelimeler = ['araba','deniz','bulut','kalem','kitap','masa','bilgisayar','telefon','bahce','kopek','kedi','kus','yildiz','gunes','orman','dag','nehir','cicek','agac','sehir','turkiye','istanbul','ankara','izmir','bursa','yazilim','kod','oyun','tus','fare'];
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:20px;width:min(90vw,420px)';
  var bilgi = document.createElement('div');
  bilgi.className = 'hint'; bilgi.style.cssText = 'font-size:16px;font-weight:700;color:#6cf';
  bilgi.textContent = 'Skor: 0 | Süre: 60';
  var hedef = document.createElement('div');
  hedef.style.cssText = 'font-size:32px;font-weight:900;color:#f59e0b;letter-spacing:2px;text-align:center;word-break:break-word';
  var input = document.createElement('input');
  input.type = 'text'; input.autocomplete = 'off';
  input.style.cssText = 'width:100%;background:rgba(0,0,0,.4);border:2px solid rgba(74,108,247,.4);border-radius:14px;padding:14px;color:#fff;font-size:22px;text-align:center;outline:none;font-family:inherit';
  wrap.appendChild(bilgi); wrap.appendChild(hedef); wrap.appendChild(input);
  root.appendChild(wrap);

  var skor = 0, sure = 60, aktif = '';
  function yeni(){
    aktif = kelimeler[Math.floor(Math.random() * kelimeler.length)];
    hedef.textContent = aktif;
    input.value = '';
  }
  api.on(input, 'input', function(){
    if (input.value.toLowerCase() === aktif){
      skor += 10;
      bilgi.textContent = 'Skor: ' + skor + ' | Süre: ' + sure;
      yeni();
    }
  });
  api.interval(function(){
    if (sure <= 0){ api.bitti(skor); return; }
    sure--; bilgi.textContent = 'Skor: ' + skor + ' | Süre: ' + sure;
  }, 1000);
  input.focus(); yeni();
});

// ==================== 13. PİYANO ====================
oyunEkle('piano','Piyano','muzik','🎹','Karolara zamanında bas', function(root, api){
  var cv = document.createElement('canvas');
  cv.width = 320; cv.height = 500;
  cv.style.cssText = 'background:#111;border-radius:12px;max-width:90vw;max-height:70vh;touch-action:none';
  root.appendChild(cv);
  var ctx = cv.getContext('2d');
  var SIRA = 4, S = 80;
  var sira = [], skor = 0, dead = false, hiz = 4, sonEkle = 0, kare = 0;

  function draw(){
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 320, 500);
    for (var i=0;i<SIRA;i++){
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(i*S, 0, S-2, 500);
    }
    ctx.fillStyle = '#222';
    for (var j=0;j<SIRA;j++) ctx.fillRect(j*S, 460, S-2, 40);
    for (var k=0;k<sira.length;k++){
      var t = sira[k];
      for (var m=0;m<t.cols.length;m++){
        ctx.fillStyle = '#4a6cf7';
        ctx.fillRect(t.cols[m]*S+4, t.y, S-10, 70);
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(t.cols[m]*S+4, t.y+60, S-10, 10);
      }
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Skor: ' + skor, 12, 26);
  }
  function tikla(cx){
    if (dead) return;
    var r = cv.getBoundingClientRect();
    var x = (cx - r.left) * (320 / r.width);
    var col = Math.floor(x / S);
    var hit = false;
    for (var i=sira.length-1;i>=0;i--){
      var t = sira[i];
      for (var j=0;j<t.cols.length;j++){
        if (t.cols[j] === col && t.y > 380 && t.y < 480){
          sira.splice(i, 1); skor += 10; hit = true; break;
        }
      }
      if (hit) break;
    }
    if (!hit){ dead = true; api.bitti(skor, '😢 Boşa bastın!'); }
  }
  api.interval(function(){
    if (dead) return;
    kare++;
    for (var i=0;i<sira.length;i++) sira[i].y += hiz;
    for (var j=sira.length-1;j>=0;j--){
      if (sira[j].y > 540){ dead = true; api.bitti(skor, '😢 Kaçırdın!'); return; }
    }
    if (kare - sonEkle > Math.max(20, 60 - skor/10)){
      sira.push({ cols: [Math.floor(Math.random()*SIRA)], y: -70 });
      sonEkle = kare;
    }
    if (skor > 0 && skor % 100 === 0) hiz = Math.min(10, 4 + skor/100);
    draw();
  }, 16);
  api.on(cv, 'mousedown', function(e){ tikla(e.clientX); });
  api.on(cv, 'touchstart', function(e){ e.preventDefault(); tikla(e.touches[0].clientX); }, { passive: false });
  draw();
});

// ==================== 14. YÜKSEK-DÜŞÜK ====================
oyunEkle('yuksel','Yüksek-Düşük','sayi','🎲','Kart yüksek mi düşük mü', function(root, api){
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:20px';
  var bilgi = document.createElement('div');
  bilgi.className = 'hint'; bilgi.style.cssText = 'font-size:16px;font-weight:700;color:#6cf';
  bilgi.textContent = 'Seri: 0';
  var kart = document.createElement('div');
  kart.style.cssText = 'font-size:80px;font-weight:900;background:linear-gradient(135deg,#4a6cf7,#8b5cf6);width:180px;height:240px;border-radius:20px;display:flex;align-items:center;justify-content:center;color:#fff';
  var btnler = document.createElement('div');
  btnler.style.cssText = 'display:flex;gap:12px';
  btnler.innerHTML = '<button class="btn" id="yuksek">⬆️ Yüksek</button><button class="btn sec" id="dusuk">⬇️ Düşük</button>';
  wrap.appendChild(bilgi); wrap.appendChild(kart); wrap.appendChild(btnler);
  root.appendChild(wrap);

  var suanki, seri = 0;
  function yeniKart(){ return Math.floor(Math.random() * 13) + 1; }
  function goster(v){
    var s = ['','A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    kart.textContent = s[v];
  }
  function tahmin(yon){
    var yeni = yeniKart();
    var kazandi = (yon === 'yuksek' && yeni > suanki) || (yon === 'dusuk' && yeni < suanki);
    if (yeni === suanki) kazandi = false;
    if (kazandi){
      seri += 1;
      bilgi.textContent = 'Seri: ' + seri;
      suanki = yeni; goster(yeni);
    } else {
      api.bitti(seri * 10, '😢 Yanlış!');
    }
  }
  btnler.querySelector('#yuksek').addEventListener('click', function(){ tahmin('yuksek'); });
  btnler.querySelector('#dusuk').addEventListener('click', function(){ tahmin('dusuk'); });
  suanki = yeniKart(); goster(suanki);
});

// ==================== 15. UZAY KAÇIŞI ====================
oyunEkle('uzay','Uzay Kaçışı','uzay','🚀','Engellerden kaç', function(root, api){
  var cv = document.createElement('canvas');
  cv.width = 360; cv.height = 540;
  cv.style.cssText = 'background:linear-gradient(180deg,#1a1f3a,#0d1024);border-radius:12px;max-width:90vw;max-height:70vh;touch-action:none';
  root.appendChild(cv);
  var ctx = cv.getContext('2d');
  var W = 360, H = 540;
  var px = 180, hiz = 4, skor = 0, engeller = [], yildizlar = [], dead = false;
  for (var i=0;i<60;i++) yildizlar.push({ x:Math.random()*W, y:Math.random()*H, s:Math.random()*1.5+0.5, v:Math.random()*1.5+0.5 });
  var frame = 0;
  function draw(){
    ctx.clearRect(0, 0, W, H);
    yildizlar.forEach(function(s){
      s.y += s.v; if (s.y > H){ s.y = -2; s.x = Math.random()*W; }
      ctx.globalAlpha = s.s/2; ctx.fillStyle = '#cfe4ff';
      ctx.fillRect(s.x, s.y, s.s, s.s);
    });
    ctx.globalAlpha = 1;
    engeller.forEach(function(o){
      ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 12;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(o.x, o.y, o.w, o.h, 8);
      else ctx.rect(o.x, o.y, o.w, o.h);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.save(); ctx.shadowColor = '#6cf'; ctx.shadowBlur = 20;
    var g = ctx.createRadialGradient(px-6, H-76, 2, px, H-70, 16);
    g.addColorStop(0, '#bfe4ff'); g.addColorStop(1, '#4a9eff');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, H-70, 16, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Skor: ' + skor, 12, 24);
  }
  api.interval(function(){
    if (dead) return;
    frame++;
    if (frame % 30 === 0){
      var w = 40 + Math.random()*60;
      engeller.push({ x:Math.random()*(W-w), y:-20, w: w, h:18 });
    }
    engeller.forEach(function(o){ o.y += hiz; });
    engeller = engeller.filter(function(o){
      if (o.y > H){ skor += 2; return false; }
      return true;
    });
    hiz = Math.min(12, 4 + skor/20);
    for (var i=0;i<engeller.length;i++){
      var o = engeller[i];
      var cx = Math.max(o.x, Math.min(px, o.x+o.w));
      var cy = Math.max(o.y, Math.min(H-70, o.y+o.h));
      var dx = px-cx, dy = (H-70)-cy;
      if (dx*dx + dy*dy < 256){ dead = true; api.bitti(skor); return; }
    }
    draw();
  }, 16);
  function hareket(cx){
    var r = cv.getBoundingClientRect();
    px = Math.max(16, Math.min(W-16, (cx - r.left) * (W / r.width)));
  }
  api.on(cv, 'mousemove', function(e){ hareket(e.clientX); });
  api.on(cv, 'touchmove', function(e){ e.preventDefault(); hareket(e.touches[0].clientX); }, { passive: false });
  draw();
});

// ==================== 16. MAYIN ====================
oyunEkle('mayin','Mayın','puzzle','💣','Mayınlara basmadan aç', function(root, api){
  var N = 9, MAYIN = 10;
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;width:min(92vw,400px)';
  var bilgi = document.createElement('div');
  bilgi.className = 'hint'; bilgi.style.cssText = 'font-size:15px;font-weight:700;color:#6cf';
  bilgi.textContent = 'Tıkla: aç | Uzun bas: bayrak';
  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(' + N + ',1fr);gap:3px;width:100%';
  wrap.appendChild(bilgi); wrap.appendChild(grid);
  root.appendChild(wrap);

  var tahta = [], acilan = 0, bitti = false;
  for (var i=0;i<N*N;i++) tahta.push({ mayin:false, acik:false, bayrak:false, komsu:0 });
  var konan = 0;
  while (konan < MAYIN){
    var r = Math.floor(Math.random() * N * N);
    if (!tahta[r].mayin){ tahta[r].mayin = true; konan++; }
  }
  for (var a=0;a<N*N;a++){
    if (tahta[a].mayin) continue;
    var c = 0;
    var x = a % N, y = Math.floor(a / N);
    for (var dx=-1;dx<=1;dx++) for (var dy=-1;dy<=1;dy++){
      if (!dx && !dy) continue;
      var nx = x+dx, ny = y+dy;
      if (nx<0||nx>=N||ny<0||ny>=N) continue;
      if (tahta[ny*N+nx].mayin) c++;
    }
    tahta[a].komsu = c;
  }
  function ac(i){
    if (tahta[i].mayin){ bitti = true; tahta.forEach(function(t){ if (t.mayin) t.acik = true; }); render(); api.bitti(0, '💥 Mayına bastın!'); return; }
    var stack = [i];
    while (stack.length){
      var k = stack.pop();
      if (tahta[k].acik || tahta[k].bayrak) continue;
      tahta[k].acik = true; acilan++;
      if (tahta[k].komsu === 0){
        var x = k % N, y = Math.floor(k / N);
        for (var dx=-1;dx<=1;dx++) for (var dy=-1;dy<=1;dy++){
          if (!dx && !dy) continue;
          var nx = x+dx, ny = y+dy;
          if (nx<0||nx>=N||ny<0||ny>=N) continue;
          stack.push(ny*N+nx);
        }
      }
    }
    render();
    if (acilan === N*N - MAYIN){ bitti = true; api.bitti(1000, '🎉 Kazandın!'); }
  }
  function render(){
    grid.innerHTML = '';
    var renkler = ['','#6cf','#22c55e','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#78350f','#000'];
    tahta.forEach(function(t, i){
      (function(idx, tt){
        var d = document.createElement('div');
        d.style.cssText = 'aspect-ratio:1;border-radius:5px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;cursor:pointer;user-select:none';
        if (tt.acik){
          d.style.background = tt.mayin ? '#7f1d1d' : 'rgba(255,255,255,.05)';
          d.textContent = tt.mayin ? '💣' : (tt.komsu || '');
          if (tt.komsu) d.style.color = renkler[tt.komsu];
        } else {
          d.style.background = 'linear-gradient(135deg,#334155,#1e293b)';
          d.textContent = tt.bayrak ? '🚩' : '';
          d.style.color = '#fff';
        }
        d.addEventListener('click', function(){ if (!bitti && !tt.acik && !tt.bayrak) ac(idx); });
        var tapTimer;
        d.addEventListener('touchstart', function(){ tapTimer = setTimeout(function(){ if (!bitti && !tt.acik){ tt.bayrak = !tt.bayrak; render(); } }, 500); });
        d.addEventListener('touchend', function(){ clearTimeout(tapTimer); });
        d.addEventListener('contextmenu', function(e){ e.preventDefault(); if (!bitti && !tt.acik){ tt.bayrak = !tt.bayrak; render(); } });
        grid.appendChild(d);
      })(i, t);
    });
  }
  render();
});

// ==================== 17. KULE ====================
oyunEkle('kule','Kule','arcade','🏗️','Blokları üst üste koy', function(root, api){
  var cv = document.createElement('canvas');
  cv.width = 320; cv.height = 500;
  cv.style.cssText = 'background:linear-gradient(180deg,#1a1f3a,#0d1024);border-radius:12px;max-width:90vw;max-height:70vh;touch-action:none';
  root.appendChild(cv);
  var ctx = cv.getContext('2d');
  var bloklar = [{ x:80, y:460, w:160, h:30 }];
  var suan = { x:0, y:460, w:160, h:30, yon:1, hiz:3 };
  var skor = 0, dead = false;

  function yeniBlok(){
    suan.y = 460 - bloklar.length * 30;
    suan.x = Math.random() < 0.5 ? -160 : 320;
    suan.w = bloklar[bloklar.length-1].w;
    suan.yon = suan.x < 0 ? 1 : -1;
    suan.hiz = 3 + skor / 50;
  }
  function draw(){
    ctx.clearRect(0, 0, 320, 500);
    for (var i=0;i<bloklar.length;i++){
      var b = bloklar[i];
      if (b.y < -60) continue;
      var t = i / bloklar.length;
      ctx.fillStyle = 'hsl(' + (200 + t*80) + ',70%,55%)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    if (!dead){
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(suan.x, suan.y, suan.w, suan.h);
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Skor: ' + skor, 12, 26);
  }
  api.interval(function(){
    if (dead) return;
    suan.x += suan.hiz * suan.yon;
    if (suan.x < 0){ suan.x = 0; suan.yon = 1; }
    if (suan.x + suan.w > 320){ suan.x = 320 - suan.w; suan.yon = -1; }
    draw();
  }, 16);
  function tikla(){
    if (dead) return;
    var son = bloklar[bloklar.length-1];
    var sol = Math.max(suan.x, son.x);
    var sag = Math.min(suan.x + suan.w, son.x + son.w);
    var yeniW = sag - sol;
    if (yeniW <= 0){ dead = true; api.bitti(skor); return; }
    bloklar.push({ x:sol, y:suan.y, w:yeniW, h:30 });
    skor += 10;
    if (son.y - 30 < -60) bloklar.forEach(function(b){ b.y += 30; });
    yeniBlok(); draw();
  }
  api.on(cv, 'mousedown', tikla);
  api.on(cv, 'touchstart', function(e){ e.preventDefault(); tikla(); }, { passive: false });
  api.on(document, 'keydown', function(e){ if (e.code === 'Space'){ e.preventDefault(); tikla(); } });
  yeniBlok(); draw();
});

// ==================== 18. DOODLE JUMP ====================
oyunEkle('doodle','Doodle Jump','arcade','🦘','Zıpla, yüksel', function(root, api){
  var cv = document.createElement('canvas');
  cv.width = 360; cv.height = 540;
  cv.style.cssText = 'background:linear-gradient(180deg,#87ceeb,#e0f2fe);border-radius:12px;max-width:90vw;max-height:70vh;touch-action:none';
  root.appendChild(cv);
  var ctx = cv.getContext('2d');
  var W = 360, H = 540;
  var px = 180, py = 400, vy = -10, vx = 0, skor = 0, dead = false;
  var platformlar = [], kamera = 0;
  for (var i=0;i<10;i++) platformlar.push({ x:Math.random()*280, y:H - i*60, w:80, h:14 });
  function draw(){
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.beginPath(); ctx.arc(80, 80, 30, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(100, 80, 30, 0, Math.PI*2); ctx.fill();
    platformlar.forEach(function(p){
      var y = p.y - kamera;
      if (y < -20 || y > H+20) return;
      ctx.fillStyle = '#22c55e'; ctx.fillRect(p.x, y, p.w, p.h);
      ctx.fillStyle = '#15803d'; ctx.fillRect(p.x, y + p.h - 4, p.w, 4);
    });
    var dy = py - kamera;
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(px, dy, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px-5, dy-4, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+5, dy-4, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px-5, dy-4, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+5, dy-4, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Skor: ' + skor, 12, 26);
  }
  api.interval(function(){
    if (dead) return;
    vy += 0.5;
    py += vy; px += vx;
    if (px < 16) px = 16;
    if (px > W - 16) px = W - 16;
    vx *= 0.9;
    if (py - kamera < 200){ kamera = py - 200; skor = Math.max(skor, Math.floor((400 - py) / 10)); }
    var dy = py - kamera;
    for (var i=0;i<platformlar.length;i++){
      var p = platformlar[i];
      if (vy > 0 && dy+16 > p.y && dy+16 < p.y + 20 && px > p.x - 10 && px < p.x + p.w + 10){
        vy = -12;
        if (p.x < px) vx = -2; else vx = 2;
      }
    }
    if (dy > H + 40){ dead = true; api.bitti(skor); return; }
    if (platformlar[0].y - kamera > -20){
      platformlar.shift();
      var ust = platformlar[platformlar.length-1];
      platformlar.push({ x:Math.random()*(W-80), y: ust.y - (60 + Math.random()*40), w:80, h:14 });
    }
    draw();
  }, 16);
  function hareket(cx){
    var r = cv.getBoundingClientRect();
    var hedef = (cx - r.left) * (W / r.width);
    vx = (hedef - px) * 0.15;
    if (vx > 5) vx = 5; if (vx < -5) vx = -5;
  }
  api.on(cv, 'mousemove', function(e){ hareket(e.clientX); });
  api.on(cv, 'touchmove', function(e){ e.preventDefault(); hareket(e.touches[0].clientX); }, { passive: false });
  api.on(document, 'keydown', function(e){
    if (e.key === 'ArrowLeft') vx = -6;
    if (e.key === 'ArrowRight') vx = 6;
  });
  draw();
});

// ==================== 19. CONNECT 4 ====================
oyunEkle('connect4','Connect 4','klasik','🔵','4 lü sıra yap', function(root, api){
  var S = 6, K = 7;
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px';
  var bilgi = document.createElement('div');
  bilgi.className = 'hint'; bilgi.style.cssText = 'font-size:16px;font-weight:700;color:#6cf';
  bilgi.textContent = 'Sıra: Sen 🔴';
  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(' + K + ',1fr);gap:6px;background:#1e3a8a;padding:10px;border-radius:14px;width:min(92vw,420px)';
  var btn = document.createElement('button');
  btn.className = 'btn sec'; btn.textContent = 'Yeni Oyun';
  wrap.appendChild(bilgi); wrap.appendChild(grid); wrap.appendChild(btn);
  root.appendChild(wrap);

  var board = [];
  function init(){
    board = [];
    for (var i=0;i<S*K;i++) board.push(0);
    bilgi.textContent = 'Sıra: Sen 🔴';
    render();
  }
  function drop(k, p){
    for (var i=S-1;i>=0;i--) if (!board[i*K+k]){ board[i*K+k] = p; return true; }
    return false;
  }
  function kazanan(p){
    for (var i=0;i<S;i++) for (var j=0;j<K;j++){
      var idx = i*K+j;
      if (board[idx] !== p) continue;
      if (j+3<K && board[idx+1] === p && board[idx+2] === p && board[idx+3] === p) return true;
      if (i+3<S && board[idx+K] === p && board[idx+2*K] === p && board[idx+3*K] === p) return true;
      if (i+3<S && j+3<K && board[idx+K+1] === p && board[idx+2*K+2] === p && board[idx+3*K+3] === p) return true;
      if (i+3<S && j-3>=0 && board[idx+K-1] === p && board[idx+2*K-2] === p && board[idx+3*K-3] === p) return true;
    }
    return false;
  }
  function bittiKontrol(){
    if (kazanan(1)){ api.bitti(100, '🎉 Kazandın!'); return true; }
    if (kazanan(2)){ api.bitti(0, '😢 Kaybettin!'); return true; }
    var dolu = true;
    for (var i=0;i<board.length;i++) if (!board[i]){ dolu = false; break; }
    if (dolu){ api.bitti(50, '🤝 Berabere!'); return true; }
    return false;
  }
  function render(){
    grid.innerHTML = '';
    board.forEach(function(v, i){
      (function(idx, vv){
        var d = document.createElement('div');
        var bg = vv === 1 ? '#ef4444' : vv === 2 ? '#fbbf24' : 'rgba(0,0,0,.4)';
        d.style.cssText = 'aspect-ratio:1;border-radius:50%;background:' + bg + ';cursor:pointer;transition:.2s';
        d.addEventListener('click', function(){
          var k = idx % K;
          if (drop(k, 1)){
            render();
            if (!bittiKontrol()){
              bilgi.textContent = 'Sıra: Bot 🟡';
              api.timeout(aiHamle, 500);
            }
          }
        });
        grid.appendChild(d);
      })(i, v);
    });
  }
  function test(k, p){
    var yedek = board.slice();
    for (var i=S-1;i>=0;i--) if (!board[i*K+k]){ board[i*K+k] = p; break; }
    var kz = kazanan(p);
    board = yedek;
    return kz;
  }
  function aiHamle(){
    var hamle = -1;
    for (var k=0;k<K;k++){ if (test(k, 2)){ hamle = k; break; } }
    if (hamle < 0) for (var k2=0;k2<K;k2++){ if (test(k2, 1)){ hamle = k2; break; } }
    if (hamle < 0 && !board[3]) hamle = 3;
    if (hamle < 0){
      var bos = [];
      for (var k3=0;k3<K;k3++) if (!board[k3]) bos.push(k3);
      if (bos.length) hamle = bos[Math.floor(Math.random()*bos.length)];
    }
    if (hamle > -1){ drop(hamle, 2); render(); if (!bittiKontrol()) bilgi.textContent = 'Sıra: Sen 🔴'; }
  }
  btn.addEventListener('click', init);
  init();
});

// ==================== 20. TAŞ-KAĞIT-MAKAS ====================
oyunEkle('tkm','Taş-Kağıt-Makas','klasik','✊','Bilgisayara karşı', function(root, api){
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:18px';
  var bilgi = document.createElement('div');
  bilgi.className = 'hint'; bilgi.style.cssText = 'font-size:16px;font-weight:700;color:#6cf';
  bilgi.textContent = 'Seri: 0';
  var ekran = document.createElement('div');
  ekran.style.cssText = 'font-size:50px;text-align:center;min-height:120px;display:flex;flex-direction:column;gap:10px';
  ekran.innerHTML = '<div id="sen">❔</div><div style="font-size:20px;color:#94a3b8">vs</div><div id="bot">❔</div>';
  var btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center';
  btns.innerHTML = '<button class="btn" data-h="tas">✊ Taş</button><button class="btn" data-h="kagit">✋ Kağıt</button><button class="btn" data-h="makas">✌️ Makas</button>';
  wrap.appendChild(bilgi); wrap.appendChild(ekran); wrap.appendChild(btns);
  root.appendChild(wrap);

  var seri = 0;
  Array.prototype.forEach.call(btns.querySelectorAll('button'), function(b){
    b.addEventListener('click', function(){
      var sen = b.getAttribute('data-h');
      var ops = ['tas','kagit','makas'];
      var bot = ops[Math.floor(Math.random() * 3)];
      var semb = { tas:'✊', kagit:'✋', makas:'✌️' };
      ekran.querySelector('#sen').textContent = 'Sen: ' + semb[sen];
      ekran.querySelector('#bot').textContent = 'Bot: ' + semb[bot];
      var kazandi = (sen === 'tas' && bot === 'makas') || (sen === 'kagit' && bot === 'tas') || (sen === 'makas' && bot === 'kagit');
      if (sen === bot){ bilgi.textContent = '🤝 Berabere | Seri: ' + seri; return; }
      if (kazandi){ seri++; bilgi.textContent = '🎉 Kazandın! | Seri: ' + seri; }
      else { api.bitti(seri * 10, '😢 Kaybettin!'); }
    });
  });
});

// ==================== MENÜ BAŞLAT ====================
menuRender();

document.addEventListener('keydown', function(e){
  if (e.key === 'Escape' && aktifOyun) oyunKapat();
});

})();
</script>
</body>
</html>`;

// ==================== DISCORD LOG ====================
function getGeo(ip){
  if (!ip || ip === '::1' || ip.indexOf('127.') === 0 || ip.indexOf('::ffff:127') === 0){
    return Promise.resolve(null);
  }
  return fetch('https://ipapi.co/' + ip + '/json/', { headers: { 'User-Agent': 'oyun-merkezi/1.0' } })
    .then(function(r){ return r.ok ? r.json() : null; })
    .catch(function(){ return null; });
}

function buildEmbed(info, geo, ip, event){
  var country = (geo && geo.country_name) || '?';
  var city = (geo && geo.city) || '?';
  var region = (geo && geo.region) || '?';
  var org = (geo && geo.org) || '?';
  var titles = { visit: '👤 Site Ziyareti', notify_granted: '🔔 İzin Verildi', notify_denied: '🔕 İzin Reddedildi' };
  var colors = { visit: 0x3b82f6, notify_granted: 0x22c55e, notify_denied: 0xef4444 };

  var desc = '**' + (info.browser || '?') + ' ' + (info.browserVer || '') + '** • '
    + (info.os || '?') + ' ' + (info.osVer || '') + '\n'
    + '📍 **' + city + '**, ' + region + ' — ' + country + '\n'
    + '🌐 \`' + ip + '\`';

  var fields = [
    { name: '💻 Tarayici', value: (info.browser || '?') + ' ' + (info.browserVer || ''), inline: true },
    { name: '🖥️ OS', value: (info.os || '?') + ' ' + (info.osVer || ''), inline: true },
    { name: '📱 Cihaz', value: info.device || '?', inline: true },
    { name: '📺 Ekran', value: info.screenRes || '?', inline: true },
    { name: '🗣️ Dil', value: info.language || '?', inline: true },
    { name: '🕒 TZ', value: info.timezone || '?', inline: true },
    { name: '📶 Baglanti', value: info.connection || '?', inline: true },
    { name: '🏢 ISP', value: org, inline: false },
    { name: '🔔 Izin', value: info.notifPerm || '?', inline: true },
    { name: '🆔 Session', value: '`' + (info.sid || '?') + '`', inline: true }
  ];

  return {
    title: titles[event] || '👤 Site Ziyareti',
    description: desc,
    color: colors[event] || 0x3b82f6,
    timestamp: new Date().toISOString(),
    fields: fields,
    footer: { text: 'Oyun Log • ' + new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) }
  };
}

// ==================== ROUTES ====================
app.get('/', function(req, res){
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.send(HTML);
});

app.get('/sw.js', function(req, res){
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Service-Worker-Allowed', '/');
  res.send(SW_CODE);
});

app.post('/api/broadcast', function(req, res){
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
  MESSAGES = MESSAGES.filter(function(m){ return m.ts > cutoff; });
  if (MESSAGES.length > 50) MESSAGES = MESSAGES.slice(-50);
  saveJSONSync(MESSAGES_FILE, MESSAGES);
  res.json({ ok: true, id: msg.id, total: MESSAGES.length });
});

app.get('/api/messages', function(req, res){
  var since = parseInt(req.query.since || '0', 10);
  var list = MESSAGES.filter(function(m){ return m.id > since; });
  res.set('Cache-Control', 'no-store');
  res.json({ messages: list, latest: MSG_ID });
});

app.post('/api/score', function(req, res){
  var body = req.body || {};
  var name = String(body.name || 'Anonim').trim().slice(0, 20);
  var sc = parseInt(body.score, 10);
  if (isNaN(sc) || sc < 0) sc = 0;
  SCORES.push({ name: name, score: sc, ts: Date.now() });
  SCORES.sort(function(a, b){ return b.score - a.score; });
  if (SCORES.length > 100) SCORES = SCORES.slice(0, 100);
  saveJSONSync(SCORES_FILE, SCORES);
  res.json({ ok: true, total: SCORES.length });
});

app.get('/api/scores', function(req, res){
  res.set('Cache-Control', 'no-store');
  res.json({ scores: SCORES.slice(0, 20) });
});

app.delete('/api/scores', function(req, res){
  SCORES = [];
  saveJSONSync(SCORES_FILE, SCORES);
  res.json({ ok: true });
});

app.post('/log', function(req, res){
  var fwd = req.headers['x-forwarded-for'] || '';
  var ip = (fwd.split(',')[0] || '').trim() || req.socket.remoteAddress || '?';
  var info = (req.body && req.body.info) || {};
  var event = (req.body && req.body.event) || 'visit';

  getGeo(ip).then(function(geo){
    var embed = buildEmbed(info, geo, ip, event);
    return fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Oyun Log', embeds: [embed] })
    }).then(function(r){
      if (!r.ok){
        return r.text().then(function(t){
          console.error('Discord hata:', r.status, t);
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

app.get('/test', function(req, res){
  fetch(WEBHOOK_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '✅ Test - Render calisiyor!' })
  })
  .then(function(r){ res.send('Test gonderildi: ' + r.status); })
  .catch(function(e){ res.status(500).send('Hata: ' + e.message); });
});

app.listen(PORT, function(){
  console.log('✅ Sunucu ' + PORT + ' portunda calisiyor');
  console.log('📁 Skor dosyasi: ' + SCORES_FILE);
  console.log('📊 Yuklenen skor: ' + SCORES.length);
});
