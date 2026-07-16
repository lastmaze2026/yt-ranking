/* VLOG TOP 30 — Service Worker
   앱 셸(HTML/매니페스트/아이콘)만 캐싱합니다.
   같은 폴더의 다른 대시보드(kfood-*)와 YouTube API 요청은 건드리지 않고 그대로 통과시킵니다. */
"use strict";

var CACHE = "vlg-shell-v1";
var ASSETS = [
  "vlog-ranking.html",
  "vlog-manifest.json",
  "vlog-icon-192.png",
  "vlog-icon-512.png",
  "vlog-icon-512-maskable.png",
  "vlog-icon-180.png"
];

function isShellRequest(url) {
  if (url.origin !== self.location.origin) return false;
  var path = url.pathname;
  for (var i = 0; i < ASSETS.length; i++) {
    if (path.slice(-ASSETS[i].length) === ASSETS[i]) return true;
  }
  return false;
}

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf("vlg-shell") === 0 && k !== CACHE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET" || !isShellRequest(url)) return; // API·타 페이지는 통과

  // 네트워크 우선(항상 최신 버전), 실패 시(오프라인) 캐시로 대체
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
