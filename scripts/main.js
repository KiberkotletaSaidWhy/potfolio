(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var all = [], shown = [], current = 0, activeTag = 'all';

  // ---------- Load data ----------
  function getJSON(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error(path);
      return r.json();
    });
  }

  Promise.all([getJSON('data/site.json'), getJSON('data/artworks.json')])
    .then(function (res) { fillSite(res[0]); all = res[1]; buildFilters(); renderGallery(); })
    .catch(function () {
      $('gallery').innerHTML = '<p class="empty">Не удалось загрузить данные. Откройте сайт через ' +
        'start.bat (Windows) или start.command (Mac/Linux), а не двойным кликом по index.html. ' +
        'Также проверьте, что в data/*.json нет опечаток.</p>';
    });

  // ---------- Site info and contacts ----------
  function fillSite(s) {
    document.title = s.title || s.name || document.title;
    $('logo').textContent = s.name || '';
    $('name').textContent = s.name || '';
    $('tagline').textContent = s.tagline || '';
    $('contactTitle').textContent = s.contactTitle || 'Контакты';
    $('contactText').textContent = s.contactText || '';
    $('copy').textContent = '© ' + new Date().getFullYear() + ' ' + (s.name || '');
    var ul = $('contacts');
    if (s.email) addLink(ul, s.email, 'mailto:' + s.email);
    (s.links || []).forEach(function (l) { addLink(ul, l.label, l.url); });
  }
  function addLink(ul, text, href) {
    var li = document.createElement('li'), a = document.createElement('a');
    a.textContent = text; a.href = href;
    if (href.indexOf('http') === 0) { a.target = '_blank'; a.rel = 'noopener'; }
    li.appendChild(a); ul.appendChild(li);
  }

  // ---------- Filters ----------
  function buildFilters() {
    var tags = [];
    all.forEach(function (a) {
      (a.tags || []).forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); });
    });
    var box = $('filters');
    box.innerHTML = '';
    if (!tags.length) return;
    ['all'].concat(tags).forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = t === 'all' ? 'Все' : t;
      b.setAttribute('aria-pressed', t === activeTag);
      b.onclick = function () {
        activeTag = t;
        Array.prototype.forEach.call(box.children, function (x) { x.setAttribute('aria-pressed', x === b); });
        renderGallery();
      };
      box.appendChild(b);
    });
  }

  // ---------- Gallery ----------
  function renderGallery() {
    shown = all.filter(function (a) { return activeTag === 'all' || (a.tags || []).indexOf(activeTag) >= 0; });
    var g = $('gallery');
    g.innerHTML = '';
    if (!shown.length) { g.innerHTML = '<p class="empty">Пока нет работ.</p>'; return; }
    shown.forEach(function (a, i) { g.appendChild(makeItem(a, i)); });
  }

  function makeItem(a, i) {
    var fig = document.createElement('figure'), frame = document.createElement('div'),
        img = document.createElement('img'), cap = document.createElement('figcaption');
    fig.className = 'item'; frame.className = 'frame';
    img.loading = 'lazy'; img.decoding = 'async'; img.alt = a.title || '';
    img.onload = function () { fig.classList.add('ready'); };
    // Show a placeholder if the file is missing
    img.onerror = function () { fig.classList.add('broken'); frame.textContent = 'Изображение не найдено'; };
    img.src = a.image;
    frame.appendChild(img);
    var t = document.createElement('strong'), y = document.createElement('span');
    t.textContent = a.title || ''; t.style.fontWeight = '400';
    y.textContent = a.year || '';
    cap.appendChild(t); cap.appendChild(y);
    fig.appendChild(frame); fig.appendChild(cap);
    fig.tabIndex = 0;
    fig.onclick = function () { openLB(i); };
    fig.onkeydown = function (e) { if (e.key === 'Enter') openLB(i); };
    return fig;
  }

  // ---------- Lightbox ----------
  function openLB(i) {
    current = i; showLB();
    $('lb').hidden = false;
    document.body.style.overflow = 'hidden';
    $('lbClose').focus();
  }
  function closeLB() { $('lb').hidden = true; document.body.style.overflow = ''; }
  function step(d) { current = (current + d + shown.length) % shown.length; showLB(); }
  function showLB() {
    var a = shown[current], img = $('lbImg');
    img.alt = a.title || '';
    img.src = a.image;
    $('lbTitle').textContent = a.title || '';
    var meta = [a.year].concat(a.tags || []).filter(Boolean).join(', ');
    $('lbMeta').textContent = meta;
    $('lbDesc').textContent = a.description || '';
  }

  $('lbClose').onclick = closeLB;
  $('lbPrev').onclick = function () { step(-1); };
  $('lbNext').onclick = function () { step(1); };
  // Click outside the image and text closes the viewer
  $('lb').onclick = function (e) { if (e.target === $('lb') || e.target === $('lbFig')) closeLB(); };
  document.addEventListener('keydown', function (e) {
    if ($('lb').hidden) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  // Simple swipe for touch screens
  var x0 = null;
  $('lb').addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  $('lb').addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });

  // ---------- Theme ----------
  $('theme').onclick = function () {
    var t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
  };
})();
