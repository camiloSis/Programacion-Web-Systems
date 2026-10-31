/* Lógica de la página: tarjetas con repaso, quiz y navegación. */
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
    var topic = 'Todos', status = 'all', known = load('tema5.known', {});
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
            save('tema5.known', known);
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
      known = {}; save('tema5.known', known); render();
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