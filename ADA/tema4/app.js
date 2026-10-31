/* Lógica de la página: tarjetas con repaso, quiz, demo paso a paso y navegación. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  function load(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ================= TARJETAS ================= */
  (function () {
    var cards = window.CARDS, wrap = $('#cards');
    if (!cards || !wrap) return;
    var topic = 'Todos', status = 'all', known = load('tema4.known', {});
    var order = cards.map(function (_, i) { return i; });
    var topics = ['Todos'];
    cards.forEach(function (c) { if (topics.indexOf(c.t) < 0) topics.push(c.t); });

    var fbox = $('#topicFilters');
    topics.forEach(function (t) {
      var b = document.createElement('button');
      b.textContent = t; b.className = t === 'Todos' ? 'active' : '';
      b.onclick = function () {
        topic = t;
        fbox.querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); });
        render();
      };
      fbox.appendChild(b);
    });

    function progress() {
      var n = cards.filter(function (_, i) { return known[i]; }).length;
      $('#progText').textContent = n + ' de ' + cards.length + ' tarjetas dominadas';
      $('#progBar').style.width = (100 * n / cards.length) + '%';
    }

    function render() {
      wrap.innerHTML = '';
      var shown = order.filter(function (i) {
        return (topic === 'Todos' || cards[i].t === topic) &&
          (status === 'all' || (status === 'known' ? known[i] : !known[i]));
      });
      shown.forEach(function (i) {
        var c = cards[i], el = document.createElement('div');
        el.className = 'card' + (known[i] ? ' known' : '');
        el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-pressed', 'false');
        el.innerHTML =
          '<div class="card-inner">' +
          '<div class="face front"><span class="badge">' + c.t + '</span><p class="qtext">' + c.q + '</p>' +
          '<span class="hint">clic para ver la respuesta</span></div>' +
          '<div class="face back"><span class="badge">' + c.t + '</span><p class="atext">' + c.a + '</p>' +
          '<div class="mark"><button data-k="1">✓ Lo sé</button><button data-k="0">↻ Repasar</button></div></div></div>';
        function flip() { var f = el.classList.toggle('flipped'); el.setAttribute('aria-pressed', f); }
        el.addEventListener('click', flip);
        el.addEventListener('keydown', function (e) {
          if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); flip(); }
        });
        el.querySelectorAll('.mark button').forEach(function (b) {
          b.addEventListener('click', function (e) {
            e.stopPropagation();
            known[i] = b.dataset.k === '1';
            save('tema4.known', known);
            el.classList.toggle('known', known[i]);
            progress();
            if (status !== 'all') setTimeout(render, 350);
          });
        });
        wrap.appendChild(el);
      });
      $('#counter').textContent = 'Mostrando ' + shown.length + ' de ' + cards.length + ' tarjetas';
      progress();
    }

    $('#statusSel').onchange = function (e) { status = e.target.value; render(); };
    $('#shuffle').onclick = function () { shuffle(order); render(); };
    $('#flipall').onclick = function () {
      var all = wrap.querySelectorAll('.card'), anyOpen = wrap.querySelector('.card.flipped');
      all.forEach(function (c) { c.classList.toggle('flipped', !anyOpen); });
    };
    $('#reset').onclick = function () {
      if (!confirm('¿Borrar tu progreso de tarjetas?')) return;
      known = {}; save('tema4.known', known); render();
    };
    render();
  })();

  /* ================= QUIZ ================= */
  (function () {
    var Q = window.QUIZ, box = $('#quiz-box');
    if (!Q || !box) return;
    var idx = 0, score = 0, qs;
    function start() { qs = shuffle(Q.slice()); idx = 0; score = 0; show(); }
    function show() {
      if (idx >= qs.length) {
        box.innerHTML = '<h3>Resultado: ' + score + ' / ' + qs.length + '</h3><p>' +
          (score === qs.length ? '¡Perfecto! Ya dominas lo esencial.' : score >= qs.length * 0.7 ? 'Muy bien. Repasa las tarjetas que fallaste.' : 'Repasa el resumen y las tarjetas, luego reintenta.') +
          '</p><button class="btn" id="qretry">Reintentar</button>';
        $('#qretry').onclick = start; return;
      }
      var q = qs[idx];
      var opts = q.o.map(function (t, i) { return { t: t, ok: i === q.c }; });
      shuffle(opts);
      box.innerHTML = '<p class="small">Pregunta ' + (idx + 1) + ' de ' + qs.length + ' · aciertos: ' + score + '</p><h3>' + q.q + '</h3>' +
        '<div class="opts"></div><p class="explain" hidden></p><button class="btn" id="qnext" hidden>' +
        (idx === qs.length - 1 ? 'Ver resultado' : 'Siguiente') + '</button>';
      var holder = box.querySelector('.opts'), done = false;
      opts.forEach(function (o) {
        var b = document.createElement('button');
        b.className = 'opt'; b.textContent = o.t;
        b.onclick = function () {
          if (done) return; done = true;
          if (o.ok) score++;
          holder.querySelectorAll('.opt').forEach(function (x, k) {
            x.disabled = true; if (opts[k].ok) x.classList.add('good');
          });
          if (!o.ok) b.classList.add('bad');
          var ex = box.querySelector('.explain'); ex.textContent = (o.ok ? '✔ Correcto. ' : '✘ No. ') + q.e; ex.hidden = false;
          $('#qnext').hidden = false;
        };
        holder.appendChild(b);
      });
      $('#qnext').onclick = function () { idx++; show(); };
    }
    start();
  })();

  /* ================= DEMO PASO A PASO ================= */
  (function () {
    var svg = $('#demo-svg'); if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    var pos = { a: [210, 30], b: [120, 105], c: [45, 190], d: [315, 125], e: [200, 215], f: [320, 295], g: [110, 305] };
    var V = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    /* orientación y orden de empates elegidos para reproducir las tablas de las láminas */
    var E = [['a', 'd', 5], ['e', 'c', 5], ['f', 'd', 6], ['b', 'e', 7], ['a', 'b', 7], ['b', 'c', 8], ['e', 'f', 8], ['b', 'd', 9], ['g', 'e', 9], ['f', 'g', 11], ['d', 'e', 15]];
    function key(u, v) { return [u, v].sort().join(''); }
    function fmt(x) { return x === Infinity ? '∞' : x; }

    function prim(start, acc) {          /* Jarník (acc=false) o Dijkstra (acc=true) */
      var d = {}, p = {}, Q = V.slice(), steps = [];
      V.forEach(function (v) { d[v] = Infinity; }); d[start] = 0;
      function snap() { var o = {}; V.forEach(function (v) { o[v] = (Q.indexOf(v) < 0 ? '✓ ' : '') + 'd=' + fmt(d[v]) + (p[v] ? ' p=' + p[v] : ''); }); return o; }
      steps.push({ msg: 'Inicio en ' + start + ': d(' + start + ')=0 y d=∞ para el resto. Q = todos los vértices.', lab: snap() });
      while (Q.length) {
        var v = Q.reduce(function (m, x) { return d[x] < d[m] ? x : m; });
        Q.splice(Q.indexOf(v), 1);
        var step = { add: p[v] ? [p[v], v] : null, cur: p[v] ? key(p[v], v) : null }, ups = [];
        E.forEach(function (e) {
          var u = e[0] === v ? e[1] : e[1] === v ? e[0] : null;
          if (u && Q.indexOf(u) >= 0) {
            var nd = (acc ? d[v] : 0) + e[2];
            if (d[u] > nd) { d[u] = nd; p[u] = v; ups.push('d(' + u + ')=' + nd); }
          }
        });
        step.msg = 'Saco ' + v + ' de Q (d=' + d[v] + ')' + (p[v] ? ' y agrego el enlace (' + p[v] + ',' + v + ')' : '') +
          '. ' + (ups.length ? 'Actualizo: ' + ups.join(', ') + '.' : 'No actualiza a nadie.');
        step.lab = snap(); steps.push(step);
      }
      return steps;
    }

    function kruskal() {
      var r = {}, steps = [], acc = 0, sorted = E.slice().sort(function (x, y) { return x[2] - y[2]; });
      V.forEach(function (v) { r[v] = v; });
      function snap() { var o = {}; V.forEach(function (v) { o[v] = 'r=' + r[v]; }); return o; }
      steps.push({ msg: 'Ordeno los enlaces por costo y cada vértice es su propio árbol (r_v = v).', lab: snap() });
      sorted.forEach(function (e) {
        if (acc >= V.length - 1) return;
        var u = e[0], v = e[1], tag = '(' + u + ',' + v + ') costo ' + e[2];
        if (r[u] !== r[v]) {
          var old = r[u]; V.forEach(function (k) { if (r[k] === old) r[k] = r[v]; });
          acc++;
          steps.push({ add: [u, v], cur: key(u, v), msg: 'Considero ' + tag + ': r_u ≠ r_v → lo agrego y reetiqueto.', lab: snap() });
        } else {
          steps.push({ rej: true, cur: key(u, v), msg: 'Considero ' + tag + ': r_u = r_v → formaría un ciclo, lo descarto.', lab: snap() });
        }
      });
      return steps;
    }

    var algos = {
      jarnik: function () { return prim('d', false); },
      kruskal: kruskal,
      dijkstra: function () { return prim('a', true); }
    };
    var steps = [], i = 0;

    function el(n, attrs, parent) {
      var x = document.createElementNS(NS, n);
      for (var k in attrs) x.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(x); return x;
    }

    function draw() {
      var s = steps[i], tree = {}, inTree = {};
      for (var k = 0; k <= i; k++) if (steps[k].add) {
        tree[key(steps[k].add[0], steps[k].add[1])] = 1;
        inTree[steps[k].add[0]] = inTree[steps[k].add[1]] = 1;
      }
      var first = $('#algoSel').value !== 'kruskal' ? (steps[0].msg.match(/Inicio en (\w)/) || [])[1] : null;
      if (first) inTree[first] = 1;
      svg.innerHTML = '';
      E.forEach(function (e) {
        var a = pos[e[0]], b = pos[e[1]], kk = key(e[0], e[1]);
        var cls = 'e' + (tree[kk] ? ' tree' : '') + (s.cur === kk && s.rej ? ' rej' : '') + (s.cur === kk && !s.rej ? ' cur' : '');
        el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'class': cls }, svg);
        var t = el('text', { x: (a[0] + b[0]) / 2 + 6, y: (a[1] + b[1]) / 2 - 4, 'class': 'w' }, svg); t.textContent = e[2];
      });
      V.forEach(function (v) {
        var q = pos[v];
        el('circle', { cx: q[0], cy: q[1], r: 15, 'class': 'v' + (inTree[v] ? ' in' : '') }, svg);
        var t = el('text', { x: q[0], y: q[1] + 5, 'class': 'vl' }, svg); t.textContent = v;
        var l = el('text', { x: q[0], y: q[1] + 30, 'class': 'lab' }, svg); l.textContent = s.lab[v];
      });
      $('#demoMsg').textContent = 'Paso ' + i + ' de ' + (steps.length - 1) + ': ' + s.msg;
      $('#prevStep').disabled = i === 0; $('#nextStep').disabled = i === steps.length - 1;
    }
    function reset() { steps = algos[$('#algoSel').value](); i = 0; draw(); }
    $('#algoSel').onchange = reset;
    $('#resetStep').onclick = reset;
    $('#prevStep').onclick = function () { if (i > 0) { i--; draw(); } };
    $('#nextStep').onclick = function () { if (i < steps.length - 1) { i++; draw(); } };
    reset();
  })();

  /* ================= NAVEGACIÓN ACTIVA ================= */
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var links = {};
    document.querySelectorAll('.toc a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.toggle('current', k === en.target.id); });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  })();
})();