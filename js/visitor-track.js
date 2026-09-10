// Herziwil Motors - Visitor tracking (local, client-side only)
// Records visits of THIS browser on this domain into localStorage.
// Static hosting provides no server logs, so this is the only place
// visitor data can live.

(function () {
  'use strict';

  if (window.__hmTrackStarted) return;
  window.__hmTrackStarted = true;

  var KEY = 'hm-vstats';
  var MAX = 5000;
  var DEDUPE_MS = 45000;

  function detect(ua) {
    var d = 'Desktop';
    var b = 'Unbekannt';
    var os = 'Unbekannt';
    var s = String(ua);

    if (/Mobi|Android|iPhone|iPad|iPod/i.test(s)) d = 'Mobil';
    if (/Tablet|iPad/i.test(s)) d = 'Tablet';
    if (/FBAN|FBAV|Instagram/i.test(s)) { b = 'In-App'; os = 'In-App'; }

    if (/Edg\//i.test(s)) b = 'Edge';
    else if (/OPR|Opera/i.test(s)) b = 'Opera';
    else if (/Chrome\//i.test(s)) b = 'Chrome';
    else if (/Safari\//i.test(s)) b = 'Safari';
    else if (/Firefox\//i.test(s)) b = 'Firefox';
    else if (/MSIE|Trident/i.test(s)) b = 'IE';

    if (/Windows/i.test(s)) os = 'Windows';
    else if (/Android/i.test(s)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(s)) os = 'iOS';
    else if (/Mac OS X/i.test(s)) os = 'macOS';
    else if (/Linux/i.test(s)) os = 'Linux';

    return { device: d, browser: b, os: os };
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function build() {
    var now = new Date();
    var info = detect(navigator.userAgent);
    return {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      ts: now.toISOString(),
      date: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()),
      time: pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds()),
      page: location.pathname + location.search,
      ua: String(navigator.userAgent).slice(0, 180),
      device: info.device,
      browser: info.browser,
      os: info.os,
      lang: navigator.language || '',
      ref: document.referrer ? document.referrer.slice(0, 200) : '',
      screen: (window.screen && window.screen.width) + 'x' + (window.screen && window.screen.height),
      ip: '',
      country: '',
      countryCode: '',
      region: '',
      city: '',
      isp: '',
      duration: 0
    };
  }

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }

  function write(list) {
    try {
      if (list.length > MAX) list = list.slice(list.length - MAX);
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) { /* storage full or blocked */ }
  }

  function record() {
    var list = read();
    var entry = build();
    var last = list[list.length - 1];
    if (last &&
      last.page === entry.page &&
      Date.now() - new Date(last.ts).getTime() < DEDUPE_MS) {
      return; // avoid double-log on immediate reloads
    }
    list.push(entry);
    write(list);
  }

  // Track on-duration of the last recorded visit.
  function logDuration() {
    var list = read();
    if (!list.length) return;
    var last = list[list.length - 1];
    if (last.duration) return;
    last.duration = Math.round((Date.now() - new Date(last.ts).getTime()) / 1000);
    write(list);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', record);
  } else {
    record();
  }

  window.addEventListener('pagehide', logDuration);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') logDuration();
  });
})();