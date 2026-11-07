var P = Panel, $ = P.$;
function s(id, m, c) { $(id).textContent = m; $(id).className = c || "soft"; }
var t0 = Date.now();
fetch(P.url("/v1/genel"), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
  s("dApi", "Çalışıyor · " + (Date.now() - t0) + " ms", "ok");
  s("dDb", j.db ? "Çalışıyor" : "Sorun var", j.db ? "ok" : "bad");
  s("dSurum", j.surum || "—");
  s("dBakim", j.bakim || "Yok", j.bakim ? "bad" : "ok");
}).catch(function () { s("dApi", "Ulaşılamıyor", "bad"); });
