// Herziwil Motors - Visitor stats dashboard (password protected, client-side)
(function () {
  'use strict';

  var KEY = 'hm-vstats';
  var GEO_KEY = 'hm-vgeo';
  var PASS_HASH = 'f583d5fe4e6e645a54566f092018af060a558ac3e556d2de41d03ccf0c0f1215';
  var SESSION_KEY = 'hm-vauth';
  var LOCK_KEY = 'hm-vlock';
  var SESSION_MS = 4 * 60 * 60 * 1000;

  var $ = function (id) { return document.getElementById(id); };

  function read(name, fallback) {
    try { return JSON.parse(localStorage.getItem(name)) || fallback; }
    catch (e) { return fallback; }
  }
  function write(name, val) {
    try { localStorage.setItem(name, JSON.stringify(val)); } catch (e) {}
  }
  function clear(name) { try { localStorage.removeItem(name); } catch (e) {} }

  function sha256(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
      .then(function (buf) {
        var a = new Uint8Array(buf);
        var hex = '';
        for (var i = 0; i < a.length; i++) hex += (a[i] < 16 ? '0' : '') + a[i].toString(16);
        return hex;
      });
  }

  var state = { rows: [], sort: 'new' };
  var curMutation = null;

  // ---------- Auth ----------
  function sessionValid() {
    var t = sessionStorage.getItem(SESSION_KEY);
    return !!t && (Date.now() - Number(t)) < SESSION_MS;
  }

  function lockUntil() {
    var l = read(LOCK_KEY, { n: 0, until: 0 });
    return l.until && l.until > Date.now() ? l.until : 0;
  }

  function showAppState() {
    $('authScreen').classList.add('hidden');
    $('app').classList.remove('hidden');
  }

  function attemptLogin() {
    var wait = lockUntil();
    if (wait) {
      var mins = Math.ceil((wait - Date.now()) / 60000);
      $('authMsg').textContent = 'Zu viele Versuche. Warte ' + mins + ' min.';
      return;
    }
    var pw = $('passInput').value;
    if (!pw) { $('authMsg').textContent = 'Passwort eingeben.'; return; }
    sha256('hm-track:' + pw).then(function (hash) {
      if (hash !== PASS_HASH) {
        var l = read(LOCK_KEY, { n: 0, until: 0 });
        l.n = l.n + 1;
        if (l.n >= 6) { l.until = Date.now() + 5 * 60 * 1000; l.n = 0; }
        write(LOCK_KEY, l);
        $('authMsg').textContent = 'Falsches Passwort.';
        $('passInput').value = '';
        return;
      }
      clear(LOCK_KEY);
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));
      initDashboard();
    });
  }

  // ---------- Geo enrichment ----------
  function enrichGeo() {
    var rows = read(KEY, []);
    if (!rows.length) return;
    var last = rows[rows.length - 1];
    if (last.ip) return; // already enriched
    if (curMutation) return; // in flight

    curMutation = true;
    var geoMap = read(GEO_KEY, {});
    var accept = function (ip, info) {
      last.ip = String(ip || '').slice(0, 45);
      last.country = info.country || '';
      last.countryCode = info.countryCode || '';
      last.region = info.region || '';
      last.city = info.city || '';
      last.isp = info.isp || '';
      if (last.ip) geoMap[last.ip] = {
        country: last.country, countryCode: last.countryCode,
        region: last.region, city: last.city, isp: last.isp
      };
      write(GEO_KEY, geoMap);
      write(KEY, rows);
      curMutation = null;
      render();
    };

    fetch('https://ipwho.is/?fields=ip,success,country,country_code,region,city,isp', { signal: AbortSignal.timeout(7000) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.success) accept(d.ip, {
          country: d.country, countryCode: d.country_code,
          region: d.region, city: d.city, isp: d.isp
        });
        else return Promise.reject();
      })
      .catch(function () {
        return fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(7000) })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d && d.ip) accept(d.ip, {
              country: d.country_name, countryCode: d.country_code,
              region: d.region, city: d.city, isp: d.org
            });
          })
          .catch(function () { curMutation = null; });
      });
  }

  // ---------- Data helpers ----------
  function effectiveRows() {
    var rows = read(KEY, []);
    var geo = read(GEO_KEY, {});
    rows.forEach(function (r) {
      if (!r.country && r.ip && geo[r.ip]) {
        r.country = geo[r.ip].country; r.countryCode = geo[r.ip].countryCode;
        r.region = geo[r.ip].region; r.city = geo[r.ip].city; r.isp = geo[r.ip].isp;
      }
    });
    // cache country select needs countries even without enrichment
    return rows;
  }

  function ipCounts(rows) {
    var m = {};
    rows.forEach(function (r) { if (r.ip) m[r.ip] = (m[r.ip] || 0) + 1; });
    return m;
  }

  function filtered() {
    var rows = effectiveRows();
    var from = $('fFrom').value;
    var to = $('fTo').value;
    var country = $('fCountry').value;
    var device = $('fDevice').value;
    var browser = $('fBrowser').value;
    var page = $('fPage').value;
    var min = parseInt($('fMin').value, 10) || 0;
    var q = ($('fSearch').value || '').toLowerCase().trim();

    var out = rows.filter(function (r) {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      if (country && r.countryCode !== country) return false;
      if (device && r.device !== device) return false;
      if (browser && r.browser !== browser) return false;
      if (page && r.page !== page) return false;
      if (q) {
        var hay = [r.ip, r.country, r.city, r.region, r.isp, r.page, r.browser, r.os, r.device].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (min > 0) {
      var counts = ipCounts(out);
      out = out.filter(function (r) { return r.ip && counts[r.ip] >= min; });
    }

    var sort = $('selSort').value || state.sort;
    if (sort === 'old') out.sort(function (a, b) { return new Date(a.ts) - new Date(b.ts); });
    else if (sort === 'dur') out.sort(function (a, b) { return (b.duration || 0) - (a.duration || 0); });
    else if (sort === 'ip') out.sort(function (a, b) { return String(a.ip).localeCompare(String(b.ip)); });
    else out.sort(function (a, b) { return new Date(b.ts) - new Date(a.ts); });

    return out;
  }

  function group(list, field) {
    var m = {};
    list.forEach(function (r) { var k = String(r[field] || '(unbekannt)'); m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(function (k) { return { key: k, n: m[k] }; }).sort(function (a, b) { return b.n - a.n; });
  }

  // ---------- Rendering ----------
  function fillSelect(el, options, labeled) {
    var val = el.value;
    el.innerHTML = '<option value="">Alle</option>'; // country selects get placeholder
    options.forEach(function (k) {
      var o = document.createElement('option');
      o.value = labeled ? k.code : k;
      o.textContent = labeled ? k.label : k;
      el.appendChild(o);
    });
    try { el.value = val; } catch (e) {}
  }

  function renderFilters(rows) {
    fillSelect($('fCountry'), Array.from(new Set(rows.filter(function (r) { return r.countryCode; })
      .map(function (r) { return { code: r.countryCode, label: r.country }; }))).sort(function (a, b) { return a.label.localeCompare(b.label); }), true);
    fillSelect($('fDevice'), Array.from(new Set(rows.map(function (r) { return r.device; }))).sort());
    fillSelect($('fBrowser'), Array.from(new Set(rows.map(function (r) { return r.browser; }))).sort());
    fillSelect($('fPage'), Array.from(new Set(rows.map(function (r) { return r.page; }))).sort());
  }

  function renderTable(rows) {
    var counts = ipCounts(rows);
    var body = $('tbody');
    body.innerHTML = '';
    if (!rows.length) {
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 12;
      td.textContent = 'Keine Daten. Aufrufe erscheinen, sobald ein Browser die Website besucht und diese Seite geöffnet wird.';
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      var cells = [
        r.date + ' ' + r.time,
        r.page,
        r.ip || '—',
        r.country && r.countryCode ? r.country + ' (' + r.countryCode + ')' : (r.country || '—'),
        r.city ? r.city + (r.region ? ', ' + r.region : '') : (r.region || '—'),
        r.isp || '—',
        r.device || '—',
        r.browser + ' / ' + r.os,
        r.lang || '—',
        r.duration ? Math.round(r.duration / 60) + ' min' : '—',
        r.ref || '—',
        r.ip ? counts[r.ip] : '—'
      ];
      cells.forEach(function (c) {
        var t = document.createElement('td');
        t.textContent = c;
        tr.appendChild(t);
      });
      body.appendChild(tr);
    });
  }

  function aggList(el, list) {
    el.innerHTML = '';
    if (!list.length) {
      el.innerHTML = '<p class="muted">—</p>';
      return;
    }
    var max = list[0].n;
    list.slice(0, 8).forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'agg-row';
      var label = document.createElement('span');
      label.className = 'agg-label';
      label.title = it.key;
      label.textContent = it.key;
      var track = document.createElement('span');
      track.className = 'agg-track';
      var bar = document.createElement('span');
      bar.className = 'agg-bar';
      bar.style.width = Math.max(6, Math.round((it.n / max) * 100)) + '%';
      track.appendChild(bar);
      var n = document.createElement('span');
      n.className = 'agg-n';
      n.textContent = it.n;
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(n);
      el.appendChild(row);
    });
  }

  function renderKPIs(frows) {
    var ips = new Set(frows.map(function (r) { return r.ip; }).filter(Boolean));
    var countries = new Set(frows.map(function (r) { return r.countryCode; }).filter(Boolean));
    var pages = new Set(frows.map(function (r) { return r.page; }));
    $('kpiTotal').textContent = frows.length;
    $('kpiIps').textContent = ips.size;
    $('kpiCountries').textContent = countries.size;
    $('kpiPages').textContent = pages.size;
  }

  function render() {
    var all = effectiveRows();
    renderFilters(all);
    var rows = filtered();
    renderKPIs(rows);
    renderTable(rows);
    aggList($('aggCountries'), group(rows, 'country'));
    aggList($('aggDays'), group(rows, 'date'));
    aggList($('aggPages'), group(rows, 'page'));
    aggList($('aggDevices'), group(rows, 'device'));
    $('rowCount').textContent = rows.length + ' Einträge';
  }

  // ---------- CSV ----------
  function exportCsv() {
    var rows = filtered();
    var header = ['Datum', 'Zeit', 'Seite', 'IP', 'Land', 'Stadt/Region', 'ISP', 'Gerät', 'Browser', 'OS', 'Sprache', 'Dauer_sek', 'Dauer_min', 'Referrer'];
    var lines = [header.join(';')];
    rows.forEach(function (r) {
      var d = Math.round((r.duration || 0) / 60);
      lines.push([r.date, r.time, r.page, r.ip, r.country, r.city + (r.region ? ', ' + r.region : ''), r.isp,
        r.device, r.browser, r.os, r.lang, r.duration || 0, d, r.ref].join(';'));
    });
    var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'herziwil-visits-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- Init ----------
  function initDashboard() {
    showAppState();
    $('passInput').value = '';
    $('authMsg').textContent = '';
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
    else ready();
  }

  function ready() {
    $('btnFilter').addEventListener('click', render);
    $('btnReset').addEventListener('click', function () {
      ['fFrom', 'fTo', 'fMin', 'fSearch'].forEach(function (id) { $(id).value = ''; });
      ['fCountry', 'fDevice', 'fBrowser', 'fPage'].forEach(function (id) { $(id).innerHTML = '<option value="">Alle</option>'; });
      $('selSort').value = 'new';
      render();
    });
    $('selSort').addEventListener('change', render);
    $('btnCsv').addEventListener('click', exportCsv);
    $('btnRefresh').addEventListener('click', function () { enrichGeo(); render(); });
    $('btnClear').addEventListener('click', function () {
      if (confirm('Gesamtes Protokoll wirklich löschen?')) { clear(KEY); clear(GEO_KEY); render(); }
    });
    $('btnLogout').addEventListener('click', function () {
      sessionStorage.removeItem(SESSION_KEY);
      location.reload();
    });
    render();
    enrichGeo();
  }

  // Start
  document.addEventListener('DOMContentLoaded', function () {
    if (sessionValid()) {
      initDashboard();
      return;
    }
    var wait = lockUntil();
    if (wait) {
      $('lockMsg').textContent = 'Für einige Minuten gesperrt (zu viele Versuche).';
    }
    $('authBtn').addEventListener('click', function (e) { e.preventDefault(); attemptLogin(); });
    $('authForm').addEventListener('submit', function (e) { e.preventDefault(); attemptLogin(); });
    $('passInput').focus();
  });
})();