/* Herramientas interactivas del Tema 5: diligencia paso a paso, calculadora de mochila y contador de llamadas de Fibonacci.
   Todo se calcula con el mismo método de las láminas (tablas de decisión, f* y x*). */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(n, attrs, parent) {
    var x = document.createElementNS(NS, n);
    for (var k in attrs) x.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(x); return x;
  }

  /* ============ 1. PROBLEMA DE LA DILIGENCIA ============ */
  (function () {
    var svg = $('#dil-svg'); if (!svg) return;
    var stages = [['A'], ['B', 'C', 'D'], ['E', 'F', 'G'], ['H', 'I'], ['J']];
    var cost = {
      A: { B: 2, C: 4, D: 3 }, B: { E: 7, F: 4, G: 6 }, C: { E: 3, F: 2, G: 4 }, D: { E: 4, F: 1, G: 5 },
      E: { H: 1, I: 4 }, F: { H: 6, I: 3 }, G: { H: 3, I: 3 }, H: { J: 3 }, I: { J: 4 }, J: {}
    };
    var pos = { A: [30, 150], B: [125, 45], C: [125, 150], D: [125, 255], E: [235, 45], F: [235, 150], G: [235, 255], H: [340, 100], I: [340, 205], J: [435, 150] };
    var f = { J: 0 }, xs = { J: [] };
    for (var si = 3; si >= 0; si--) stages[si].forEach(function (s) {
      var best = Infinity, arg = [];
      Object.keys(cost[s]).forEach(function (x) {
        var v = cost[s][x] + f[x];
        if (v < best) { best = v; arg = [x]; } else if (v === best) arg.push(x);
      });
      f[s] = best; xs[s] = arg;
    });
    function routes(s) {
      if (s === 'J') return ['J'];
      var out = [];
      xs[s].forEach(function (x) { routes(x).forEach(function (r) { out.push(s + '-' + r); }); });
      return out;
    }
    var step = 0; /* 0 intro, 1..5 etapas 5..1, 6 rutas */

    function draw() {
      var curIdx = step >= 1 && step <= 5 ? 5 - step : -1, solved = {}, opt = {};
      for (var k = 1; k <= Math.min(step, 5); k++) stages[5 - k].forEach(function (s) { solved[s] = 1; });
      var rs = step === 6 ? routes('A') : [];
      var onRoute = {};
      rs.forEach(function (r) { var p = r.split('-'); for (var i = 0; i < p.length - 1; i++) onRoute[p[i] + p[i + 1]] = 1; });
      svg.innerHTML = '';
      Object.keys(cost).forEach(function (a) {
        Object.keys(cost[a]).forEach(function (b) {
          var isOpt = step === 6 ? onRoute[a + b] : (solved[a] && xs[a].indexOf(b) >= 0);
          svgEl('line', { x1: pos[a][0], y1: pos[a][1], x2: pos[b][0], y2: pos[b][1], 'class': 'e' + (isOpt ? ' tree' : '') }, svg);
          var t = svgEl('text', { x: (pos[a][0] * 0.62 + pos[b][0] * 0.38), y: (pos[a][1] * 0.62 + pos[b][1] * 0.38) - 4, 'class': 'w' }, svg);
          t.textContent = cost[a][b];
        });
      });
      Object.keys(pos).forEach(function (v) {
        var cur = curIdx >= 0 && stages[curIdx].indexOf(v) >= 0;
        svgEl('circle', { cx: pos[v][0], cy: pos[v][1], r: 15, 'class': 'v' + (solved[v] ? ' in' : '') + (cur ? ' curv' : '') }, svg);
        svgEl('text', { x: pos[v][0], y: pos[v][1] + 5, 'class': 'vl' }, svg).textContent = v;
        if (solved[v]) svgEl('text', { x: pos[v][0], y: pos[v][1] + 31, 'class': 'lab' }, svg).textContent = 'f*=' + f[v];
      });
      [1, 2, 3, 4, 5].forEach(function (n, i) {
        svgEl('text', { x: pos[stages[i][0]][0], y: 14, 'class': 'lab' }, svg).textContent = 'Etapa ' + n;
      });
      var msg = '', tbl = '';
      if (step === 0) msg = 'Pulsa “Siguiente etapa”: se resuelve de atrás hacia adelante, empezando por la etapa 5 (el destino J).';
      else if (step === 1) { msg = 'Etapa 5 resuelta: f*₅(J) = 0 (ya estás en el destino).'; }
      else if (step <= 5) {
        var n = 6 - step, rows = stages[n - 1], cols = stages[n];
        msg = 'Etapa ' + n + ': para cada estado, f_n(s,x) = costo del tramo + f* del estado siguiente; se toma el mínimo.';
        tbl = '<table class="tbl"><tr><th>s<sub>' + n + '</sub></th>' + cols.map(function (c) { return '<th>x = ' + c + '</th>'; }).join('') + '<th>f*<sub>' + n + '</sub>(s)</th><th>x*<sub>' + n + '</sub></th></tr>';
        rows.forEach(function (s) {
          tbl += '<tr><td><b>' + s + '</b></td>' + cols.map(function (c) {
            if (cost[s][c] === undefined) return '<td>–</td>';
            var best = xs[s].indexOf(c) >= 0;
            return '<td' + (best ? ' class="best"' : '') + '>' + cost[s][c] + '+' + f[c] + '</td>';
          }).join('') + '<td><b>' + f[s] + '</b></td><td>' + xs[s].join(' o ') + '</td></tr>';
        });
        tbl += '</table>';
      } else {
        msg = 'Listo: costo mínimo f*₁(A) = ' + f.A + '. Hay ' + rs.length + ' rutas óptimas (las 18 posibles se evitaron revisar una por una).';
        tbl = '<p><b>Rutas óptimas:</b> ' + rs.join(' · ') + '</p>';
      }
      $('#dilMsg').textContent = msg; $('#dilTbl').innerHTML = tbl;
      $('#dilPrev').disabled = step === 0; $('#dilNext').disabled = step === 6;
    }
    $('#dilPrev').onclick = function () { if (step > 0) { step--; draw(); } };
    $('#dilNext').onclick = function () { if (step < 6) { step++; draw(); } };
    $('#dilReset').onclick = function () { step = 0; draw(); };
    draw();
  })();

  /* ============ 2. CALCULADORA DE MOCHILA ============ */
  (function () {
    var body = $('#ks-items'); if (!body) return;
    var defaults = [['Ajedrez', 5, 3], ['Barco', 7, 3], ['Campana', 9, 2], ['Jarrón', 14, 5]];
    defaults.forEach(function (d) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td><input type="text" maxlength="14" value="' + esc(d[0]) + '" aria-label="Nombre"></td>' +
        '<td><input type="number" min="0" max="99" value="' + d[1] + '" aria-label="Costo"></td>' +
        '<td><input type="number" min="1" max="20" value="' + d[2] + '" aria-label="Peso"></td>';
      body.appendChild(tr);
    });
    var step = 0, model = null;

    function read() {
      var items = [];
      body.querySelectorAll('tr').forEach(function (tr) {
        var i = tr.querySelectorAll('input');
        items.push({
          name: i[0].value || 'objeto',
          c: Math.max(0, Math.min(99, parseInt(i[1].value, 10) || 0)),
          w: Math.max(1, Math.min(20, parseInt(i[2].value, 10) || 1))
        });
      });
      var wl = Math.max(1, Math.min(20, parseInt($('#ks-wl').value, 10) || 1));
      return { items: items, wl: wl, unl: $('#ks-mode').value === 'unl' };
    }
    function solve(p) {
      var N = p.items.length, F = [], X = [], cells = [];
      F[N + 1] = []; for (var s = 0; s <= p.wl; s++) F[N + 1][s] = 0;
      for (var n = N; n >= 1; n--) {
        var it = p.items[n - 1], xmax = p.unl ? Math.floor(p.wl / it.w) : 1;
        F[n] = []; X[n] = []; cells[n] = { xmax: xmax, rows: [] };
        for (s = 0; s <= p.wl; s++) {
          var best = -1, bx = 0, row = [];
          for (var x = 0; x <= xmax; x++) {
            if (x * it.w <= s) {
              var a = it.c * x, b = F[n + 1][s - it.w * x];
              row.push([a, b]);
              if (a + b > best) { best = a + b; bx = x; }
            } else row.push(null);
          }
          F[n][s] = best; X[n][s] = bx; cells[n].rows.push(row);
        }
      }
      return { N: N, F: F, X: X, cells: cells };
    }
    function recompute() { var p = read(); model = { p: p, s: solve(p) }; step = 0; draw(); }

    function draw() {
      var p = model.p, S = model.s, N = S.N, html = '', msg = '';
      var kind = p.unl ? 'ilimitada (x ∈ ℤ≥0)' : '0/1 (x ∈ {0,1})';
      if (step === 0) {
        msg = 'Mochila ' + kind + ', límite wl = ' + p.wl + '. Etapas = objetos, de ' + N + ' a 1. Estado s = capacidad restante. Cada celda es c·x + f*ₙ₊₁(s − w·x). Pulsa “Siguiente etapa”.';
      } else if (step <= N) {
        var n = N - step + 1, it = p.items[n - 1], cs = S.cells[n];
        msg = 'Etapa ' + n + ': ' + it.name + ' (costo ' + it.c + ', peso ' + it.w + '). “–” = no cabe. En verde, la decisión óptima (si hay empate, la de menor x).';
        html = '<table class="tbl"><tr><th>s<sub>' + n + '</sub></th>';
        for (var x = 0; x <= cs.xmax; x++) html += '<th>x = ' + x + '</th>';
        html += '<th>f*<sub>' + n + '</sub>(s)</th><th>x*<sub>' + n + '</sub></th></tr>';
        for (var s = 0; s <= p.wl; s++) {
          html += '<tr><td><b>' + s + '</b></td>';
          cs.rows[s].forEach(function (c, xi) {
            html += c ? '<td' + (xi === S.X[n][s] ? ' class="best"' : '') + '>' + c[0] + '+' + c[1] + '</td>' : '<td>–</td>';
          });
          html += '<td><b>' + S.F[n][s] + '</b></td><td>' + S.X[n][s] + '</td></tr>';
        }
        html += '</table>';
      } else {
        msg = 'Todas las etapas resueltas. Se reconstruye la solución desde la etapa 1 con s = wl, siguiendo x* hacia adelante.';
        html = '<table class="tbl"><tr><th>s</th>';
        for (var m = N; m >= 1; m--) html += '<th>f*<sub>' + m + '</sub></th><th>x*<sub>' + m + '</sub></th>';
        html += '</tr>';
        for (s = 0; s <= p.wl; s++) {
          html += '<tr><td><b>' + s + '</b></td>';
          for (m = N; m >= 1; m--) html += (m === 1 && s !== p.wl) ? '<td></td><td></td>' : '<td>' + S.F[m][s] + '</td><td>' + S.X[m][s] + '</td>';
          html += '</tr>';
        }
        html += '</table>';
        var cur = p.wl, tot = 0, wt = 0, taken = [], path = [];
        for (m = 1; m <= N; m++) {
          var xx = S.X[m][cur], itm = p.items[m - 1];
          path.push('x*<sub>' + m + '</sub>=' + xx + ' (s=' + cur + ')');
          if (xx > 0) { taken.push(xx + '× ' + esc(itm.name)); tot += xx * itm.c; wt += xx * itm.w; }
          cur -= xx * itm.w;
        }
        html += '<p><b>Camino de decisiones:</b> ' + path.join(' → ') + '</p>' +
          '<p><b>Solución:</b> ' + (taken.length ? taken.join(' + ') : 'no llevar nada') + ' — valor <b>' + tot + '</b>, peso ' + wt + ' de ' + p.wl + '. (f*₁(' + p.wl + ') = ' + S.F[1][p.wl] + ')</p>';
      }
      $('#ksMsg').textContent = msg; $('#ksTbl').innerHTML = html;
      $('#ksPrev').disabled = step === 0; $('#ksNext').disabled = step === N + 1;
    }
    $('#ksPrev').onclick = function () { if (step > 0) { step--; draw(); } };
    $('#ksNext').onclick = function () { if (step <= model.s.N) { step++; draw(); } };
    $('#ksAll').onclick = function () { step = model.s.N + 1; draw(); };
    $('#ks-mode').onchange = recompute; $('#ks-wl').onchange = recompute;
    body.addEventListener('change', recompute);
    $('#ksPreset01').onclick = function () { $('#ks-mode').value = '01'; $('#ks-wl').value = 5; recompute(); };
    $('#ksPresetUnl').onclick = function () { $('#ks-mode').value = 'unl'; $('#ks-wl').value = 7; recompute(); };
    recompute();
  })();

  /* ============ 3. FIBONACCI: CONTADOR DE LLAMADAS ============ */
  (function () {
    var r = $('#fib-n'); if (!r || typeof BigInt === 'undefined') return;
    function fmt(b) { return b.toLocaleString('es'); }
    function update() {
      var n = parseInt(r.value, 10), F = [0n, 1n];
      for (var i = 2; i <= n + 1; i++) F.push(F[i - 1] + F[i - 2]);
      var naive = 2n * F[n + 1] - 1n;           /* nº de llamadas de F(n) sin memo */
      var memo = {}, calls = 0n;
      (function FM(k) { calls++; if (k <= 1) return BigInt(k); if (memo[k] === undefined) memo[k] = FM(k - 1) + FM(k - 2); return memo[k]; })(n);
      var note = F[n] > 9223372036854775807n ? 'No cabe en int64 con signo.' : F[n] > 2147483647n ? 'No cabe en int32 (sí en int64).' : 'Cabe en int32.';
      $('#fibN').textContent = n;
      $('#fibOut').innerHTML =
        '<tr><th>f(' + n + ')</th><td>' + fmt(F[n]) + '</td><td class="small">' + note + '</td></tr>' +
        '<tr><th>Llamadas sin memoización</th><td>' + fmt(naive) + '</td><td class="small">Θ(φⁿ)</td></tr>' +
        '<tr><th>Llamadas con memoización</th><td>' + fmt(calls) + '</td><td class="small">Θ(n) (aquí 2n−1)</td></tr>';
    }
    r.oninput = update; update();
  })();
})();