// Ortak panel kodu: ikon, yan menü kurulumu, küçük yardımcılar.
var Panel = (function () {
  var IC = "data:image/png;base64,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";
  var API = "https://axii-lisans.kamiltugceduran.workers.dev";
  var PANEL_URL = "https://axiisoftware.github.io/axii-panel/";
  function $(id) { return document.getElementById(id); }
  function yaz(e, m, c) { e.textContent = m; e.className = "msg " + (c || ""); }
  function el(tag, metin, sinif) { var e = document.createElement(tag); if (metin !== undefined) e.textContent = metin; if (sinif) e.className = sinif; return e; }

  // o.menu: [["id","Ad"],...]  o.alt: menü altına konacak HTML  o.ac: {id: görünüm açılınca çalışacak fonksiyon}
  function kur(o) {
    var ik = document.createElement("link"); ik.rel = "icon"; ik.href = IC; document.head.appendChild(ik);
    $("side").innerHTML = '<div class="brand"><img src="' + IC + '" alt="">AXII</div><nav>' +
      o.menu.map(function (m) { return '<a href="#' + m[0] + '" data-v="' + m[0] + '">' + m[1] + '</a>'; }).join("") +
      '</nav><div class="sp"></div><div class="alt">' + (o.alt || "") + '<div style="margin-top:8px"><a href="' + PANEL_URL + '" target="_blank" rel="noopener">axiisoftware.github.io/axii-panel</a></div></div>';
    function goster() {
      var v = location.hash.slice(1);
      if (!o.menu.some(function (m) { return m[0] === v; })) v = o.menu[0][0];
      document.querySelectorAll("#side nav a").forEach(function (a) { a.classList.toggle("on", a.dataset.v === v); });
      document.querySelectorAll("[data-s]").forEach(function (s) { s.hidden = s.dataset.s !== v; });
      if (o.ac && o.ac[v]) o.ac[v]();
    }
    window.addEventListener("hashchange", goster);
    goster();
  }
  // Oturum token'ı (üye paneli): localStorage. Lisans anahtarı tarayıcıda tutulmaz.
  var TK = "axii_oturum";
  // Tüm API çağrıları POST + Authorization header: anahtar/token URL'de gitmez. Sonuca _status eklenir.
  function api(yol, govde, token) {
    var t = token !== undefined ? token : (localStorage.getItem(TK) || "");
    var h = { "Content-Type": "application/json" };
    if (t) h["Authorization"] = "Bearer " + t;
    return fetch(API + yol, { method: "POST", headers: h, body: JSON.stringify(govde || {}) })
      .then(function (r) { return r.json().then(function (j) { j._status = r.status; return j; }); });
  }
  return { IC: IC, API: API, PANEL_URL: PANEL_URL, TK: TK, $: $, yaz: yaz, el: el, kur: kur, api: api };
})();
