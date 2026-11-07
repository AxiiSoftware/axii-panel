// Ortak panel kodu: yan menü, API çağrısı, küçük yardımcılar. Panel ve API aynı adresten (aynı Worker) sunulur.
(function () {
  if (window.top === window.self) return;   // çerçeve içinde açıldıysa (CSP frame-ancestors yedeği) en üste çık
  document.documentElement.style.display = "none";
  try { window.top.location = window.self.location.href; } catch (e) {}
})();
var Panel = (function () {
  var API = (window.AXII_API || "").replace(/\/+$/, "");   // boşsa aynı kaynak (göreli yol)
  var TK = "axii_oturum";
  function $(id) { return document.getElementById(id); }
  function yaz(e, m, c) { e.textContent = m; e.className = "msg " + (c || ""); }
  function el(tag, metin, sinif) { var e = document.createElement(tag); if (metin !== undefined) e.textContent = metin; if (sinif) e.className = sinif; return e; }
  function depoOku(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function depoYaz(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function oturumOku(k) { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function oturumYaz(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
  function tarih(sn) { return sn ? new Date(sn * 1000).toLocaleString("tr-TR") : "—"; }
  function gec(sn) {
    if (sn == null) return "—";
    var f = Math.floor(Date.now() / 1000) - sn;
    if (f < 5) return "az önce";
    if (f < 60) return f + " saniye önce";
    if (f < 3600) return Math.floor(f / 60) + " dakika önce";
    if (f < 86400) return Math.floor(f / 3600) + " saat önce";
    return Math.floor(f / 86400) + " gün önce";
  }
  // o.menu: [["id","Ad"],...]; o.alt: [["Ad","href"],...]; o.ac: {id: görünüm açılınca çalışacak fonksiyon}
  function kur(o) {
    var yan = $("side");
    yan.textContent = "";
    var marka = el("div", "", "marka"), im = el("img"); im.src = "logo.png"; im.alt = "";
    marka.appendChild(im); marka.appendChild(document.createTextNode(o.baslik || "Axii"));
    var nav = el("nav");
    o.menu.forEach(function (m) { var a = el("a", m[1]); a.href = "#" + m[0]; a.dataset.v = m[0]; nav.appendChild(a); });
    yan.appendChild(marka); yan.appendChild(nav); yan.appendChild(el("div", "", "sp"));
    var alt = el("div", "", "alt");
    (o.alt || []).forEach(function (x) { var a = el("a", x[0]); if (x[1]) a.href = x[1]; if (x[2]) a.id = x[2]; alt.appendChild(a); });
    yan.appendChild(alt);
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
  // Tüm çağrılar POST + Authorization başlığı: anahtar/token URL'de gitmez. Yanıta _status eklenir.
  function api(yol, govde, token) {
    var t = token !== undefined ? token : depoOku(TK);
    var h = { "Content-Type": "application/json" };
    if (t) h["Authorization"] = "Bearer " + t;
    return fetch(API + yol, { method: "POST", headers: h, body: JSON.stringify(govde || {}) })
      .then(function (r) {
        return r.text().then(function (m) {
          var j; try { j = JSON.parse(m); } catch (e) { j = { ok: false, code: "bad_response" }; }
          j._status = r.status; return j;
        });
      });
  }
  var HATA = {
    bad_credentials: "E-posta ya da şifre hatalı.", pending: "Hesabın yönetici onayı bekliyor. Onaylanınca giriş yapabilirsin.",
    rate_limited: "Çok fazla deneme yapıldı, biraz bekle.", bad_email: "E-posta adresi geçersiz.",
    online: "Bu client’ın uygulaması açık görünüyor. Önce uygulamayı kapat.", weak_password: "Şifre en az 10 karakter olmalı.",
    delete_limit: "Bu lisansta 30 gün içinde en çok 3 client silinebilir. Daha fazlası için bizimle iletişime geç.",
    invalid_key: "Geçersiz lisans anahtarı.", inactive: "Bu lisans devre dışı.", expired: "Lisans süresi dolmuş.", suspended: "Bu lisans askıya alınmış. Destek ile iletişime geç.",
    key_taken: "Bu lisans anahtarı başka bir hesaba bağlı.", email_taken: "Bu e-posta ile zaten bir hesap var.",
    bad_request: "Girdiğin bilgileri kontrol et.", no_key: "Hesabına bağlı bir lisans anahtarı yok.",
    consent_required: "Devam etmek için aydınlatma metnini ve kullanım şartlarını kabul etmelisin.",
    totp_required: "Doğrulama kodunu gir.", bad_totp: "Doğrulama kodu hatalı.", unauthorized: "Oturum geçersiz, tekrar giriş yap.",
    bad_response: "Sunucudan beklenmeyen bir yanıt geldi.", maintenance: "Sistem bakımda."
  };
  function hataMetni(j) { return HATA[j.code] || ("Hata: " + (j.code || j._status)); }
  function url(y) { return API + y; }
  return { url: url, TK: TK, $: $, yaz: yaz, el: el, kur: kur, api: api, tarih: tarih, gec: gec, depoOku: depoOku, depoYaz: depoYaz, oturumOku: oturumOku, oturumYaz: oturumYaz, HATA: HATA, hataMetni: hataMetni };
})();
