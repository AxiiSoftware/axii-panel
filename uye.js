// Kullanıcı paneli: giriş/kayıt, Canlı Takip, uzaktan kontrol, destek.
var P = Panel, $ = P.$;
var gZam = null, gBitis = 0, gCihaz = null, profil = null, mZor = false;
var kartlar = {};   // cihaz kimliği -> kart öğeleri

function oturum() { return P.depoOku(P.TK); }
function sure(sn) { var sa = Math.floor(sn / 3600), dk = Math.floor(sn % 3600 / 60); return (sa > 0 ? sa + " sa " : "") + dk + " dk"; }
function gizle(id, g) { $(id).classList.toggle("gizli", !!g); }

// ---- Sistem bildirimi (bakım) ----
fetch(P.url("/v1/genel")).then(function (r) { return r.json(); }).then(function (j) {
  if (j && j.bakim) { $("bakimBilgi").textContent = j.bakim; gizle("bakimBilgi", false); }
}).catch(function () {});

// ---- Ana sayfa: otomasyon seçici ----
document.querySelectorAll("#otoChips button").forEach(function (b) {
  b.onclick = function () {
    document.querySelectorAll("#otoChips button").forEach(function (x) { x.classList.toggle("on", x === b); });
    document.querySelectorAll(".ozel").forEach(function (p) { p.classList.toggle("gizli", p.dataset.k !== b.dataset.k); });
  };
});

// ---- Hesap: açılır pencereler ----
var MODALLAR = ["giris", "kayit", "unuttum", "sifre", "anahtar", "cihaz"];
var ILK_ALAN = { giris: "mgEp", kayit: "mkEp", unuttum: "muEp", sifre: "msEski", anahtar: "maKey", cihaz: "mcAd" };
function modalAc(v, zor) {
  mZor = !!zor; gizle("modal", false); gizle("hAcilir", true);
  MODALLAR.forEach(function (x) { document.querySelector('[data-m="' + x + '"]').classList.toggle("gizli", x !== v); });
  gizle("mKapat", mZor); gizle("msZor", !mZor);
  ["mgMsg", "mkMsg", "muMsg", "msMsg", "maMsg", "mcMsg"].forEach(function (i) { P.yaz($(i), "", ""); });
  setTimeout(function () { $(ILK_ALAN[v]).focus(); }, 30);
}
function modalKapat() { if (!mZor) gizle("modal", true); }
$("mKapat").onclick = modalKapat;
$("modal").onclick = function (e) { if (e.target === this) modalKapat(); };
document.addEventListener("keydown", function (e) { if (e.key === "Escape") { modalKapat(); gizle("hAcilir", true); } });
document.addEventListener("click", function (e) { if (!$("hMenu").contains(e.target)) gizle("hAcilir", true); });
$("hGiris").onclick = function () { modalAc("giris"); };
$("hKayit").onclick = function () { modalAc("kayit"); };
$("mgKayit").onclick = function () { modalAc("kayit"); };
$("mgUnuttum").onclick = function () { modalAc("unuttum"); };
$("mkGiris").onclick = function () { modalAc("giris"); };
$("muGiris").onclick = function () { modalAc("giris"); };
$("hKim").onclick = function () { $("hAcilir").classList.toggle("gizli"); };
$("sifreLink").onclick = function () { modalAc("sifre", false); };

function girisGonder() {
  var e = $("mgEp").value.trim(), p = $("mgSf").value;
  if (!e || !p) { P.yaz($("mgMsg"), "E-posta ve şifreyi gir.", "bad"); return; }
  $("mgBtn").disabled = true; P.yaz($("mgMsg"), "Giriş yapılıyor...", "soft");
  P.api("/v1/uye/giris", { eposta: e, sifre: p }, "").then(function (j) {
    $("mgBtn").disabled = false;
    if (!j.ok) { P.yaz($("mgMsg"), P.hataMetni(j), "bad"); return; }
    $("mgSf").value = ""; P.depoYaz(P.TK, j.token);
    mZor = false; gizle("modal", true); acik();
  }).catch(function () { $("mgBtn").disabled = false; P.yaz($("mgMsg"), "Sunucuya ulaşılamadı.", "bad"); });
}
function kayitGonder() {
  var e = $("mkEp").value.trim(), p = $("mkSf").value, k = $("mkKey").value.trim().toUpperCase();
  if (!e || !p || !k) { P.yaz($("mkMsg"), "Tüm alanları doldur.", "bad"); return; }
  if (!$("mkRiza").checked) { P.yaz($("mkMsg"), P.HATA.consent_required, "bad"); return; }
  $("mkBtn").disabled = true; P.yaz($("mkMsg"), "Gönderiliyor...", "soft");
  P.api("/v1/uye/kayit", { eposta: e, sifre: p, key: k, riza: true }, "").then(function (j) {
    $("mkBtn").disabled = false;
    if (!j.ok) { P.yaz($("mkMsg"), P.hataMetni(j), "bad"); return; }
    $("mkSf").value = ""; $("mkKey").value = ""; $("mkRiza").checked = false;
    modalAc("giris"); $("mgEp").value = e; P.yaz($("mgMsg"), "Kayıt alındı. Yönetici onayından sonra giriş yapabilirsin.", "ok");
  }).catch(function () { $("mkBtn").disabled = false; P.yaz($("mkMsg"), "Sunucuya ulaşılamadı.", "bad"); });
}
function sifirlaGonder() {
  var e = $("muEp").value.trim(), k = $("muKey").value.trim().toUpperCase(), y = $("muSf").value;
  if (!e || !k || !y) { P.yaz($("muMsg"), "Tüm alanları doldur.", "bad"); return; }
  $("muBtn").disabled = true; P.yaz($("muMsg"), "Kontrol ediliyor...", "soft");
  P.api("/v1/uye/sifre-sifirla", { eposta: e, key: k, yeni: y }, "").then(function (j) {
    $("muBtn").disabled = false;
    if (!j.ok) { P.yaz($("muMsg"), P.hataMetni(j), "bad"); return; }
    $("muSf").value = ""; $("muKey").value = "";
    modalAc("giris"); $("mgEp").value = e; P.yaz($("mgMsg"), "Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.", "ok");
  }).catch(function () { $("muBtn").disabled = false; P.yaz($("muMsg"), "Sunucuya ulaşılamadı.", "bad"); });
}
function sifreKaydet() {
  P.yaz($("msMsg"), "Kaydediliyor...", "soft");
  P.api("/v1/uye/sifre", { eski: $("msEski").value, yeni: $("msYeni").value }).then(function (j) {
    if (!j.ok) { P.yaz($("msMsg"), j.code === "bad_credentials" ? "Mevcut şifre yanlış." : P.hataMetni(j), "bad"); return; }
    $("msEski").value = ""; $("msYeni").value = ""; mZor = false; gizle("modal", true);
    if (profil) profil.degistir = false; sorgula(true);
  });
}
var keyGorunur = false;
function keyGuncelle() {
  var k = (profil && profil.anahtar) || "";
  $("keyMetin").textContent = !k ? "—" : (keyGorunur ? k : k.slice(0, 5) + "••••••••" + k.slice(-4));
  $("keyGoster").textContent = keyGorunur ? "Gizle" : "Göster";
}
$("keyGoster").onclick = function () { keyGorunur = !keyGorunur; keyGuncelle(); };
$("keyDegis").onclick = function () { modalAc("anahtar"); };
function anahtarDegistir() {
  var k = $("maKey").value.trim().toUpperCase();
  if (!k) { P.yaz($("maMsg"), "Yeni anahtarı gir.", "bad"); return; }
  $("maBtn").disabled = true; P.yaz($("maMsg"), "Kontrol ediliyor...", "soft");
  P.api("/v1/uye/anahtar", { key: k }).then(function (j) {
    $("maBtn").disabled = false;
    if (!j.ok) { P.yaz($("maMsg"), P.hataMetni(j), "bad"); return; }
    $("maKey").value = ""; mZor = false; gizle("modal", true);
    kartlar = {}; $("cihazlar").textContent = ""; acik();
  }).catch(function () { $("maBtn").disabled = false; P.yaz($("maMsg"), "Sunucuya ulaşılamadı.", "bad"); });
}
$("maBtn").onclick = anahtarDegistir; $("maKey").onkeydown = function (e) { if (e.key === "Enter") anahtarDegistir(); };
$("mgBtn").onclick = girisGonder; $("mkBtn").onclick = kayitGonder; $("msBtn").onclick = sifreKaydet; $("muBtn").onclick = sifirlaGonder;
[["mgEp", girisGonder], ["mgSf", girisGonder], ["mkEp", kayitGonder], ["mkSf", kayitGonder], ["mkKey", kayitGonder],
 ["muEp", sifirlaGonder], ["muKey", sifirlaGonder], ["muSf", sifirlaGonder], ["msEski", sifreKaydet], ["msYeni", sifreKaydet]].forEach(function (x) {
  $(x[0]).onkeydown = function (e) { if (e.key === "Enter") x[1](); };
});

function girisGoster(ipucu) {
  profil = null; keyGorunur = false; gKapatYerel(); kartlar = {};
  gizle("sonuc", true); gizle("gKart", true);
  $("cihazlar").textContent = ""; P.yaz($("gMsg"), "", "");
  gizle("hGiris", false); gizle("hKayit", false); gizle("hMenu", true); gizle("hAcilir", true); gizle("yonLink", true);
  gizle("girisIpucu", false); $("girisIpucu").textContent = ipucu || "Canlı Takip için sağ üstten giriş yap.";
  gizle("dGiris", false); gizle("dGovde", true);
}
function cikis() {
  var t = oturum(); P.depoYaz(P.TK, null);
  if (t) P.api("/v1/uye/cikis", {}, t).catch(function () {});
  girisGoster("Çıkış yapıldı."); location.hash = "#ana";
}
$("cikis").onclick = cikis;

function acik() {
  if (!oturum()) { girisGoster(); return; }
  P.api("/v1/uye/ben").then(function (j) {
    if (!j.ok) { P.depoYaz(P.TK, null); girisGoster(j.code === "unauthorized" ? "Oturum süresi doldu, tekrar giriş yap." : ""); return; }
    profil = j; keyGuncelle();
    gizle("hGiris", true); gizle("hKayit", true); gizle("hMenu", false);
    $("hKim").textContent = j.eposta; $("hKim").title = j.eposta; gizle("yonLink", j.rol !== "admin");
    gizle("girisIpucu", true); gizle("dGiris", true); gizle("dGovde", false);
    if (j.degistir) { modalAc("sifre", true); return; }
    sorgula(true);
    if (location.hash === "#destek") destekListele();
  }).catch(function () { P.yaz($("gMsg"), "Sunucuya ulaşılamadı.", "bad"); });
}

// ---- Durum ----
function sorgula(ilk) {
  if (!oturum()) return;
  if (ilk) P.yaz($("gMsg"), "", "");
  P.api("/v1/uye/durum").then(function (j) {
    if (j._status === 401) { P.depoYaz(P.TK, null); girisGoster("Oturum süresi doldu, tekrar giriş yap."); return; }
    if (!j.ok) {
      P.yaz($("gMsg"), P.hataMetni(j), "bad"); gizle("sonuc", true); $("cihazlar").textContent = ""; kartlar = {}; return;
    }
    gizle("sonuc", false);
    var dolmus = j.bitis && j.bitis < new Date((j.simdi + 3 * 3600) * 1000).toISOString().slice(0, 10);
    $("lic").textContent = !j.aktif ? "İptal edilmiş" : (j.askida ? "Askıda" : (dolmus ? "Süresi dolmuş" : "Aktif"));
    $("lic").className = (!j.aktif || dolmus || j.askida) ? "bad" : "ok";
    $("bitis").textContent = j.bitis || "—";
    var n = j.cihazlar.length, kapali = j.cihazlar.filter(function (c) { return clientKapali(c, j.simdi); }).length, cd = $("cliDurum");
    cd.textContent = !n ? "—" : (kapali === 0 ? "Açık" : (kapali === n ? "Client kapalı" : kapali + " / " + n + " bilgisayarda client kapalı"));
    cd.className = !n ? "" : (kapali === 0 ? "ok" : "bad");
    cihazlariCiz(j.cihazlar, j.simdi);
  }).catch(function () { P.yaz($("gMsg"), "Sunucuya ulaşılamadı.", "bad"); });
}
function kapaliMi(c, simdi) { return c.guncelleme == null || (simdi - c.guncelleme) > 180; }
function clientKapali(c, simdi) { return kapaliMi(c, simdi) || !!(c.kontrol && !c.kontrol.client); }

// ---- İstatistik (uygulamadaki Seçenekler > İstatistik ile aynı sistemler) ----
var IST = [
  ["MC", "Görev Kitabı", ["Tamamlanan görev", "İptal", "Bağlantı kopması"]],
  ["OTO", "Enerji Parçası Üretim", ["Başarılı işlem", "Yakalanan efsun", "Bağlantı kopması"]],
  ["ML", "Enerji Kristali Üretim", ["Üretilen kristal"]],
  ["MR", "Okey Kart Seti Üretim", ["Tamamlanan oyun"]],
  ["LN", "Lonca Puan Üretim", ["Tamamlanan karakter"]],
  ["YN", "Yutnori", ["Tamamlanan oyun", "Kazanılan", "Kaybedilen"]]
];
var DONEM = ["Son 24 saat", "Son 1 hafta", "Son 1 ay"];
function istCiz(k) {
  var kap = k.ist; kap.textContent = "";
  var bar = P.el("div", "", "row");
  DONEM.forEach(function (ad, i) {
    var b = P.el("button", ad, "o k" + (i === k.donem ? " on" : ""));
    b.onclick = function () { k.donem = i; istCiz(k); };
    bar.appendChild(b);
  });
  kap.appendChild(bar);
  if (!k.veri) { kap.appendChild(P.el("div", "Bu bilgisayardan henüz istatistik gelmedi.", "msg soft")); return; }
  var tb = P.el("tbody"), sat = 0;
  IST.forEach(function (s) {
    var d = k.veri[s[0]] && k.veri[s[0]][k.donem];
    if (!d || !d[0]) return;
    sat++;
    var tr = P.el("tr"), parca = s[2].map(function (ad, i) { return ad + ": " + d[2 + i]; });
    if (d[1] >= 60) parca.push("saatte ort. " + (d[2] / (d[1] / 3600)).toFixed(1));
    tr.appendChild(P.el("td", s[1])); tr.appendChild(P.el("td", String(d[0]))); tr.appendChild(P.el("td", sure(d[1]))); tr.appendChild(P.el("td", parca.join(" · ")));
    tb.appendChild(tr);
  });
  if (!sat) { kap.appendChild(P.el("div", DONEM[k.donem] + " içinde kayıtlı oturum yok.", "msg soft")); return; }
  var tbl = P.el("table", "", "it"), th = P.el("thead"), hr = P.el("tr");
  ["Sistem", "Oturum", "Süre", "Sonuçlar"].forEach(function (h) { hr.appendChild(P.el("th", h)); });
  th.appendChild(hr); tbl.appendChild(th); tbl.appendChild(tb);
  var w = P.el("div", "", "tw"); w.appendChild(tbl); kap.appendChild(w);
}

var MODAD = { MC: "Görev Kitabı", OTO: "Enerji Parçası Üretim", MR: "Okey Kart Seti Üretim", LN: "Lonca Puan Üretim", YN: "Yutnori", HOME: "Otomasyon seçili değil" };

// Uzaktan komut: panel komutu bırakır, uygulama kısa sürede alır ve sonucu bildirir.
function komut(k, id, ad, arg) {
  if (k.mesgul || !oturum()) return;
  k.mesgul = true; kontrolCiz(k);
  P.yaz(k.kmsg, ad === "client_ac" ? "Client açılıyor, bu işlem 1-2 dakika sürebilir..." : "Komut gönderildi...", "soft");
  function bitti(m, ok) {
    k.mesgul = false; P.yaz(k.kmsg, m, ok ? "ok" : "bad");
    if (ok && k.sonC && k.sonC.kontrol) {
      var kt = k.sonC.kontrol;
      if (ad === "toplama") kt.toplama = Number(arg);
      else if (ad === "bag") kt.bag = arg;
      else if (ad === "baslat") kt.calisiyor = 1;
      else if (ad === "durdur") kt.calisiyor = 0;
      else if (ad === "client_ac") kt.client = 1;
    }
    kontrolCiz(k); sorgula(false);
  }
  P.api("/v1/uye/komut", { cihaz: id, ad: ad, arg: arg || "" }).then(function (j) {
    if (!j.ok) { bitti(j.code === "busy" ? "Bu bilgisayarda başka bir komut işleniyor." : P.hataMetni(j), false); return; }
    var bas = Date.now(), sn = ad === "client_ac" ? 235000 : 40000;
    var t = setInterval(function () {
      P.api("/v1/uye/komut-sorgula", { cihaz: id }).then(function (r) {
        if (!r.ok) return;
        if (r.durum === "bekliyor") {
          if (Date.now() - bas > sn) { clearInterval(t); bitti("Bilgisayardan yanıt gelmedi. Uygulama kapalı ya da güncel olmayan bir sürüm olabilir.", false); }
          return;
        }
        clearInterval(t);
        if (r.durum === "tamam") bitti(r.mesaj || "Tamam.", true);
        else if (r.durum === "hata") bitti(r.mesaj || "Komut başarısız.", false);
        else bitti("Bilgisayardan yanıt gelmedi.", false);
      }).catch(function () {});
    }, 2000);
  }).catch(function () { bitti("Sunucuya ulaşılamadı.", false); });
}

function kontrolCiz(k) {
  var c = k.sonC, kt = c && c.kontrol, kilit = k.mesgul || k.kapali;
  gizle2(k.kp, !kt);
  gizle2(k.kontYok, !!kt && !k.kapali);
  k.kontYok.textContent = k.kapali ? "Uygulama kapalı olduğu için uzaktan kontrol kullanılamıyor." : "Uzaktan kontrol için uygulamanın güncel sürümü gerekir.";
  k.btn.disabled = !!gZam || k.kapali;
  if (!kt) return;
  var ad = kt.ml ? "Enerji Kristali Üretim" : (MODAD[kt.mod] || kt.mod);
  k.oto.textContent = (kt.calisiyor ? "Çalışıyor" : "Durdu") + " · " + ad;
  k.oto.className = "dr " + (kt.calisiyor ? "ok" : "soft");
  k.bsBtn.textContent = kt.calisiyor ? "Durdur" : "Başlat"; k.bsBtn.className = kt.calisiyor ? "dur" : ""; k.bsBtn.disabled = kilit;
  k.cliDr.textContent = k.kapali ? "Bilinmiyor" : (kt.client ? "Açık" : "Kapalı"); k.cliDr.className = "dr " + (k.kapali ? "soft" : (kt.client ? "ok" : "bad"));
  k.acBtn.disabled = kilit; k.acBtn.textContent = kt.client ? "Clienti Yeniden Başlat" : "Clienti Yeniden Aç";
  function sw(o, acik, kilitli) { o.giris.checked = acik; o.giris.disabled = kilitli; o.kok.classList.toggle("kapali", kilitli); }
  sw(k.tTop, !!kt.toplama, kilit); sw(k.tBag, kt.bag === "baglan", kilit || !!kt.calisiyor); sw(k.tAv, kt.bag === "baglan_av", kilit || !!kt.calisiyor);
  k.tBag.kok.title = k.tAv.kok.title = kt.calisiyor ? "Otomasyon çalışırken değiştirilemez, önce durdur." : "";
}
function gizle2(e, g) { e.classList.toggle("gizli", !!g); }

function anahtarKur(ad) {
  var l = P.el("label", "", "sw"), i = P.el("input"), kn = P.el("span", "", "sw-k");
  i.type = "checkbox"; l.appendChild(i); l.appendChild(kn); l.appendChild(P.el("span", ad));
  return { kok: l, giris: i };
}
function blok(baslik) { var d = P.el("div", "", "kb"); d.appendChild(P.el("h4", baslik)); return d; }

function cihazAyar(k, id) {
  modalAc("cihaz");
  $("mcAd").value = k.ad.textContent; $("mcSil").disabled = !k.kapali;
  $("mcSil").title = k.kapali ? "" : "Uygulaması açıkken silinemez";
  $("mcKaydet").onclick = function () {
    P.api("/v1/uye/cihaz-ad", { cihaz: id, ad: $("mcAd").value }).then(function (j) {
      if (!j.ok) { P.yaz($("mcMsg"), P.hataMetni(j), "bad"); return; }
      gizle("modal", true); sorgula(true);
    });
  };
  $("mcSil").onclick = function () {
    if (!confirm(k.ad.textContent + " silinsin mi? Bu işlem geri alınamaz.")) return;
    P.api("/v1/uye/cihaz-sil", { cihaz: id }).then(function (j) {
      if (!j.ok) { P.yaz($("mcMsg"), P.hataMetni(j), "bad"); return; }
      gizle("modal", true);
      if (kartlar[id]) { kartlar[id].kok.remove(); delete kartlar[id]; }
      sorgula(true);
    });
  };
}

function cihazlariCiz(liste, simdi) {
  var kap = $("cihazlar");
  if (!liste.length) {
    kap.textContent = ""; kartlar = {};
    kap.appendChild(P.el("div", "Bu lisansla henüz bir client kaydedilmemiş.", "msg soft"));
    return;
  }
  Array.prototype.forEach.call(kap.querySelectorAll(":scope > .msg"), function (n) { n.remove(); });
  var gelen = {};
  liste.forEach(function (c) {
    gelen[c.id] = true;
    var k = kartlar[c.id];
    if (!k) {
      k = { kok: P.el("div", "", "card"), ust: P.el("div", "", "row ara"), nokta: P.el("span", "", "durum-nokta"), ad: P.el("strong"), rozet: P.el("span", "", "rozet k gizli"),
            metin: P.el("div", "", "m-satir"), zaman: P.el("div", "", "soft"), istBtn: P.el("button", "İstatistik", "o"), ayarBtn: P.el("button", "Ayarlar", "o"),
            ist: P.el("div", "", "gizli"), donem: 0, veri: null, mesgul: false, kapali: false, sonC: null,
            kp: P.el("div", "", "kp"), kontYok: P.el("div", "", "msg soft gizli"), kmsg: P.el("div", "", "msg"),
            oto: P.el("div", "", "dr"), bsBtn: P.el("button", "Başlat"), cliDr: P.el("div", "", "dr"), acBtn: P.el("button", "Clienti Yeniden Aç", "o"),
            btn: P.el("button", "Ekran görüntüsü al", "o"), tTop: anahtarKur("Otomatik Toplama"), tBag: anahtarKur("Otomatik Yeniden Bağlan"), tAv: anahtarKur("Yeniden Bağlan + Oto Av") };
      var sol = P.el("div"), sag = P.el("div", "", "row");
      sol.appendChild(k.nokta); sol.appendChild(k.ad); sol.appendChild(k.rozet);
      sag.appendChild(k.istBtn); sag.appendChild(k.ayarBtn);
      k.ust.appendChild(sol); k.ust.appendChild(sag);
      var b1 = blok("Otomasyon"); b1.appendChild(k.oto); b1.appendChild(k.bsBtn);
      var b2 = blok("Client"); b2.appendChild(k.cliDr); b2.appendChild(k.acBtn); b2.appendChild(k.btn);
      var b3 = blok("Seçenekler"); b3.appendChild(k.tTop.kok); b3.appendChild(k.tBag.kok); b3.appendChild(k.tAv.kok);
      k.kp.appendChild(b1); k.kp.appendChild(b2); k.kp.appendChild(b3);
      k.kok.appendChild(k.ust); k.kok.appendChild(k.metin); k.kok.appendChild(k.zaman); k.kok.appendChild(k.kp); k.kok.appendChild(k.kontYok); k.kok.appendChild(k.kmsg); k.kok.appendChild(k.ist);
      k.btn.onclick = function () { gGetir(c.id, k.ad.textContent); };
      k.istBtn.onclick = function () {
        var ac = k.ist.classList.contains("gizli"); k.ist.classList.toggle("gizli", !ac); k.istBtn.classList.toggle("on", ac);
        if (ac) istCiz(k);
      };
      k.ayarBtn.onclick = function () { cihazAyar(k, c.id); };
      k.acBtn.onclick = function () { komut(k, c.id, "client_ac", "baslat"); };
      k.bsBtn.onclick = function () { komut(k, c.id, k.sonC.kontrol.calisiyor ? "durdur" : "baslat", ""); };
      k.tTop.giris.onchange = function () { komut(k, c.id, "toplama", this.checked ? "1" : "0"); };
      k.tBag.giris.onchange = function () { komut(k, c.id, "bag", this.checked ? "baglan" : "yok"); };
      k.tAv.giris.onchange = function () { komut(k, c.id, "bag", this.checked ? "baglan_av" : "yok"); };
      kartlar[c.id] = k; kap.appendChild(k.kok);
    }
    var uygKapali = kapaliMi(c, simdi), kapali = clientKapali(c, simdi);
    k.sonC = c; k.kapali = uygKapali;
    k.nokta.className = "durum-nokta " + (uygKapali ? "" : "acik");
    k.rozet.textContent = uygKapali ? "Uygulama kapalı" : "Client kapalı";
    k.rozet.classList.toggle("gizli", !kapali);
    k.ad.textContent = c.ad;
    k.metin.textContent = c.metin ? (kapali ? "Son bildirilen durum: " + c.metin : c.metin) : "Henüz durum bildirilmedi.";
    k.zaman.textContent = "Son güncelleme: " + P.gec(c.guncelleme);
    k.veri = c.ist || null;
    if (!k.ist.classList.contains("gizli")) istCiz(k);
    kontrolCiz(k);
  });
  Object.keys(kartlar).forEach(function (id) {
    if (!gelen[id]) { kartlar[id].kok.remove(); delete kartlar[id]; }
  });
}

// ---- Client görüntüsü (cihaz bazlı) ----
function butonlar(kilit) { Object.keys(kartlar).forEach(function (id) { kartlar[id].btn.disabled = kilit || kartlar[id].kapali; }); }
function gDurdur() { if (gZam) { clearInterval(gZam); gZam = null; } butonlar(false); }
function gKapatYerel() { gDurdur(); $("gImg").removeAttribute("src"); gizle("gKart", true); }
function gKapat() {
  var c = gCihaz; gKapatYerel();
  if (oturum()) P.api("/v1/uye/goruntu-sil", c ? { cihaz: c } : {}).catch(function () {});
  P.yaz($("gMsg"), "Görüntü silindi.", "soft");
}
function gGetir(id, ad) {
  if (!oturum()) return;
  gKapatYerel(); gCihaz = id; $("gBaslik").textContent = "Client görüntüsü: " + ad;
  butonlar(true);
  P.yaz($("gMsg"), ad + " bilgisayarından görüntü isteniyor...", "soft");
  P.api("/v1/uye/goruntu-iste", { cihaz: id }).then(function (j) {
    if (!j.ok) { P.yaz($("gMsg"), P.hataMetni(j), "bad"); gDurdur(); return; }
    gBitis = Date.now() + 45000;
    gZam = setInterval(function () { gSor(id); }, 3000);
  }).catch(function () { P.yaz($("gMsg"), "Sunucuya ulaşılamadı.", "bad"); gDurdur(); });
}
function gSor(id) {
  if (Date.now() > gBitis) { gDurdur(); P.yaz($("gMsg"), "Bilgisayardan yanıt gelmedi. Uygulama kapalı ya da güncel olmayan bir sürüm olabilir.", "bad"); return; }
  P.api("/v1/uye/goruntu-sorgula", { cihaz: id }).then(function (j) {
    if (!j.ok) { gDurdur(); P.yaz($("gMsg"), P.hataMetni(j), "bad"); return; }
    if (j.durum === "hazir") {
      gDurdur(); $("gImg").src = "data:image/jpeg;base64," + j.img;
      gizle("gKart", false);
      P.yaz($("gMsg"), "Görüntü alındı. Sunucudaki kopya silindi.", "ok");
    } else if (j.durum === "hata") { gDurdur(); P.yaz($("gMsg"), "Görüntü alınamadı: " + j.hata, "bad"); }
    else if (j.durum !== "bekliyor") { gDurdur(); P.yaz($("gMsg"), "Bilgisayardan yanıt gelmedi.", "bad"); }
  }).catch(function () {});
}
$("gKapat").onclick = gKapat;

// ---- Destek ----
var DESTEK_DURUM = { acik: "Açık", yanitlandi: "Yanıtlandı", kapali: "Kapalı" };
function destekListele() {
  if (!oturum()) return;
  P.api("/v1/uye/destek-liste").then(function (j) {
    var kap = $("dListe"); kap.textContent = "";
    if (!j.ok) { kap.appendChild(P.el("div", P.hataMetni(j), "msg bad")); return; }
    if (!j.items.length) { kap.appendChild(P.el("div", "Henüz talebin yok.", "msg soft")); return; }
    j.items.forEach(function (x) {
      var c = P.el("div", "", "card"), u = P.el("div", "", "row ara");
      var sol = P.el("strong", x.konu), r = P.el("span", DESTEK_DURUM[x.durum] || x.durum, "rozet " + (x.durum === "yanitlandi" ? "y" : (x.durum === "acik" ? "mavi" : "")));
      var s = P.el("div"); s.appendChild(sol); s.appendChild(r);
      u.appendChild(s); u.appendChild(P.el("span", P.tarih(x.zaman), "soft"));
      c.appendChild(u);
      var m = P.el("p", x.mesaj); m.className = "pre-satir"; c.appendChild(m);
      if (x.yanit) { var y = P.el("div", "", "ozel"); y.appendChild(P.el("b", "Yanıt")); var yp = P.el("p", x.yanit); yp.className = "pre-satir"; y.appendChild(yp); c.appendChild(y); }
      kap.appendChild(c);
    });
  });
}
$("dGonder").onclick = function () {
  var konu = $("dKonu").value.trim(), mesaj = $("dMesaj").value.trim();
  if (!konu || !mesaj) { P.yaz($("dMsg"), "Konu ve mesajı yaz.", "bad"); return; }
  $("dGonder").disabled = true; P.yaz($("dMsg"), "Gönderiliyor...", "soft");
  P.api("/v1/uye/destek-yaz", { konu: konu, mesaj: mesaj }).then(function (j) {
    $("dGonder").disabled = false;
    if (!j.ok) { P.yaz($("dMsg"), j.code === "rate_limited" ? "Saatte en fazla 5 talep açabilirsin." : P.hataMetni(j), "bad"); return; }
    $("dKonu").value = ""; $("dMesaj").value = ""; P.yaz($("dMsg"), "Talebin alındı.", "ok"); destekListele();
  }).catch(function () { $("dGonder").disabled = false; P.yaz($("dMsg"), "Sunucuya ulaşılamadı.", "bad"); });
};

P.kur({
  menu: [["ana", "Ana sayfa"], ["durum", "Canlı Takip"], ["destek", "Destek"]],
  alt: [["Gizlilik", "gizlilik.html"], ["Kullanım şartları", "sartlar.html"], ["Sistem durumu", "durum.html"]],
  ac: {
    durum: function () { if (oturum() && profil) sorgula(false); },
    destek: function () { if (oturum() && profil) destekListele(); }
  }
});
if (oturum()) acik(); else girisGoster();
// Canlı Takip açıkken ve sekme görünürken 15 sn'de bir yenile (görünmeyen sekme istek harcamaz)
setInterval(function () {
  if (document.hidden || location.hash !== "#durum" || !oturum() || $("sonuc").classList.contains("gizli")) return;
  sorgula(false);
}, 15000);
