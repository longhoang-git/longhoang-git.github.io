/* ---------------------------------------------------------------
   Personal website — Long Hoang
   All page behaviour. No dependencies; everything is read from the
   markup in index.html, so editing the HTML is enough.
   --------------------------------------------------------------- */

(function () {
  'use strict';

  function $(sel, root)  { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function make(tag, cls, content) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (content) el.textContent = content;
    return el;
  }
  // Lower-case and strip accents, so "viet" finds "Việt"; dashes count as spaces,
  // so "power system" finds "power-system".
  function fold(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
      .replace(/[‐-―-]/g, ' ');
  }

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- toast ---------- */

  var toastEl = $('.toast');
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* ---------- panels ----------
     The top bar swaps which section is shown, it does not scroll the page.
     The hash keeps deep links and back/forward working; "#projects/cables"
     opens a panel with a sub-route that the panel handles itself. */

  var panels = $$('main section[data-panel]');
  // The brand switches panels too, but only the menu items show as selected.
  var tabs = $$('.topbar ul [data-nav]');
  var ids = panels.map(function (p) { return p.dataset.panel; });
  var current = null;
  var onShow = {};  // panel id -> function (sub), for panels with a sub-route

  // The browser would otherwise restore a scroll offset when stepping back
  // through panels, which reads as a half-scrolled page.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function show(id, sub) {
    if (ids.indexOf(id) === -1) id = ids[0];
    panels.forEach(function (p) { p.classList.toggle('active', p.dataset.panel === id); });
    tabs.forEach(function (a) {
      var on = a.dataset.nav === id;
      a.classList.toggle('current', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    current = id;
    centreTab();
    if (onShow[id]) onShow[id](sub || '');
    window.scrollTo(0, 0);
  }

  // On a phone the menu scrolls sideways; keep the selected item in view.
  function centreTab() {
    var a = $('.topbar ul a.current');
    if (!a) return;
    var menu = a.closest('ul');
    if (menu.scrollWidth > menu.clientWidth) {
      menu.scrollLeft = a.offsetLeft - menu.offsetLeft - (menu.clientWidth - a.offsetWidth) / 2;
    }
  }
  // The web font widens the menu items when it arrives, so centre again then.
  if (document.fonts) document.fonts.ready.then(centreTab);

  function go(id, sub) {
    var hash = '#' + id + (sub ? '/' + sub : '');
    if (location.hash !== hash) history.pushState(null, '', hash);
    show(id, sub);
  }

  function route() {
    var parts = location.hash.slice(1).split('/');
    show(parts[0], parts[1]);
  }

  $$('[data-nav]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      go(a.dataset.nav, a.dataset.sub);
    });
  });
  window.addEventListener('popstate', route);

  // Open the panel holding `el`, bring it into view and flash it.
  var filterResets = [];  // each panel with filters registers how to clear them
  function reveal(el) {
    var panel = el.closest('[data-panel]');
    if (panel && panel.dataset.panel !== current) go(panel.dataset.panel);
    if (el.closest('[hidden]')) filterResets.forEach(function (f) { f(); });
    requestAnimationFrame(function () {
      el.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      el.classList.remove('flash');
      void el.offsetWidth;  // restart the animation if it is already running
      el.classList.add('flash');
    });
  }
  document.addEventListener('animationend', function (e) {
    if (e.animationName === 'flash') e.target.classList.remove('flash');
  });

  /* ---------- theme ----------
     Light by default; the toggle opts in to dark and is remembered. The
     saved choice is applied by a one-line script in <head>, before paint. */

  var themeBtn = $('[data-action="theme"]');
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    themeBtn.setAttribute('aria-pressed', String(t === 'dark'));
    try { localStorage.setItem('theme', t); } catch (e) {}
  }
  function toggleTheme() { setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }
  themeBtn.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark'));
  themeBtn.addEventListener('click', toggleTheme);

  /* ---------- contact ---------- */

  var mailLink = $('.links a[href^="mailto:"]');
  var email = mailLink.getAttribute('href').slice('mailto:'.length);
  var cvHref = $('[data-link="cv"]').getAttribute('href');
  var linkedinHref = $('[data-link="linkedin"]').getAttribute('href');

  function copyEmail() {
    function done() { toast('Copied ' + email); }
    function fallback() {
      var ta = make('textarea');
      ta.value = email;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      if (ok) done(); else toast(email);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(email).then(done, fallback);
    else fallback();
  }
  $$('[data-action="copy-email"]').forEach(function (b) { b.addEventListener('click', copyEmail); });

  /* ---------- experience: span chart ----------
     One row per .entry, drawn from data-from / data-to (years; "present" is
     this year) and coloured by data-kind. Clicking a row jumps to the entry. */

  (function () {
    var panel = $('[data-panel="experience"]');
    var chart = panel && $('.span-chart', panel);
    if (!chart) return;
    var entries = $$('.entry[data-from]', panel);
    if (!entries.length) { chart.remove(); return; }

    var now = new Date().getFullYear();
    function year(v) { return v === 'present' ? now : parseInt(v, 10); }
    var first = Math.min.apply(null, entries.map(function (e) { return year(e.dataset.from); }));
    var last = Math.max.apply(null, entries.map(function (e) { return year(e.dataset.to || e.dataset.from); }));
    chart.style.setProperty('--years', last - first + 1);

    var axis = make('div', 'span-row span-axis');
    axis.setAttribute('aria-hidden', 'true');
    axis.appendChild(make('span', 'span-label'));
    for (var y = first; y <= last; y++) axis.appendChild(make('span', 'span-year', String(y)));
    chart.appendChild(axis);

    entries.forEach(function (e) {
      var from = year(e.dataset.from);
      var to = year(e.dataset.to || e.dataset.from);
      var kind = e.dataset.kind || 'industry';
      var label = e.dataset.short || text($('.what', e));
      var row = make('button', 'span-row');
      row.type = 'button';
      row.setAttribute('aria-label', label + ', ' + text($('.date', e)) + ', ' + kind);
      row.appendChild(make('span', 'span-label', label));
      row.appendChild(make('span', 'span-track'));
      var bar = make('span', 'span-bar ' + kind);
      bar.style.gridColumn = (from - first + 2) + ' / ' + (to - first + 3);
      row.appendChild(bar);
      row.addEventListener('click', function () { reveal(e); });
      chart.appendChild(row);
    });

    var legend = make('div', 'span-legend');
    legend.setAttribute('aria-hidden', 'true');
    ['industry', 'research'].forEach(function (k) {
      var item = make('span', 'kind ' + k, k.charAt(0).toUpperCase() + k.slice(1));
      legend.appendChild(item);
    });
    legend.appendChild(make('span', 'span-total', first + '–present'));
    chart.appendChild(legend);
  })();

  /* ---------- projects: filters ---------- */

  (function () {
    var panel = $('[data-panel="projects"]');
    if (!panel) return;
    var cards = $$('.card', panel);
    var chips = $$('.chip', panel);
    var input = $('.filter-search input', panel);
    var count = $('.filter-count', panel);
    var empty = $('.filter-empty', panel);
    var topic = 'all';

    function topicsOf(c) { return (c.dataset.topics || '').split(/\s+/); }
    cards.forEach(function (c) { c.dataset.search = fold(text(c)); });

    chips.forEach(function (c) {
      var t = c.dataset.topic;
      var n = t === 'all' ? cards.length
            : cards.filter(function (p) { return topicsOf(p).indexOf(t) !== -1; }).length;
      c.appendChild(make('span', 'chip-n', String(n)));
      c.addEventListener('click', function () {
        setTopic(t);
        history.replaceState(null, '', '#projects' + (topic === 'all' ? '' : '/' + topic));
      });
    });

    function setTopic(t) {
      if (!chips.some(function (c) { return c.dataset.topic === t; })) t = 'all';
      topic = t;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.topic === t)); });
      apply();
    }

    function apply() {
      var terms = fold(input.value).split(/\s+/).filter(Boolean);
      var shown = 0;
      cards.forEach(function (c) {
        var ok = (topic === 'all' || topicsOf(c).indexOf(topic) !== -1) &&
                 terms.every(function (w) { return c.dataset.search.indexOf(w) !== -1; });
        c.hidden = !ok;
        if (ok) shown++;
      });
      count.textContent = shown === cards.length
        ? cards.length + ' projects'
        : 'Showing ' + shown + ' of ' + cards.length + ' projects';
      empty.hidden = shown > 0;
    }

    input.addEventListener('input', apply);
    onShow.projects = setTopic;
    filterResets.push(function () { input.value = ''; setTopic('all'); });
    apply();
  })();

  /* ---------- search palette ----------
     Ctrl/⌘ K or "/" opens it. The index is built from the page itself the
     first time it opens, so anything added to the HTML is searchable. */

  var dlg = $('#palette');
  var palInput = $('input', dlg);
  var palList = $('.palette-list', dlg);
  var index = null;
  var results = [];
  var active = 0;

  if (/Mac|iPhone|iPad/.test(navigator.platform)) {
    $$('.shortcut').forEach(function (k) { k.textContent = '⌘K'; });
  }

  function buildIndex() {
    var items = [];
    function add(label, kind, run, extra) {
      if (label) items.push({ label: label, kind: kind, run: run, key: fold(label + ' ' + kind + ' ' + (extra || '')) });
    }

    tabs.forEach(function (a, i) {
      add(text(a), 'Section · ' + (i + 1), function () { go(a.dataset.nav); });
    });
    add('Copy email address', 'Action', copyEmail, email);
    add('Write an email', 'Action', function () { location.href = 'mailto:' + email; }, 'contact mail');
    add('Open CV (PDF)', 'Action', function () { window.open(cvHref, '_blank', 'noopener'); }, 'curriculum vitae resume download');
    add('Open LinkedIn', 'Action', function () { window.open(linkedinHref, '_blank', 'noopener'); }, 'profile');
    add('Toggle dark mode', 'Action', toggleTheme, 'theme light night');
    $$('.chip').forEach(function (c) {
      if (c.dataset.topic !== 'all') {
        add('Projects: ' + c.firstChild.textContent, 'Filter', function () { go('projects', c.dataset.topic); });
      }
    });

    panels.forEach(function (p) {
      var name = text($('h2', p));
      $$('.card', p).forEach(function (el) {
        add(text($('.card-title', el)), 'Project · ' + text($('.status', el)), function () { reveal(el); }, text(el));
      });
      $$('.paper', p).forEach(function (el) {
        var group = el.closest('.group');
        add(text($('.paper-title', el)), group ? text($('.group-label', group)) : name,
            function () { reveal(el); }, text(el));
      });
      $$('.entry', p).forEach(function (el) {
        add(text($('.what', el)), name + ' · ' + text($('.date', el)), function () { reveal(el); },
            text($('.where', el)) + ' ' + text($('.kind', el)) + ' ' + text($('.detail', el)));
      });
      $$('.facts li', p).forEach(function (el) {
        var head = el.parentNode.previousElementSibling;
        var where = head && head.classList.contains('subhead') ? text(head) : name;
        add(text($('.v', el)), where + ' · ' + text($('.k', el)), function () { reveal(el); });
      });
    });
    return items;
  }

  function search(q) {
    var terms = fold(q).split(/\s+/).filter(Boolean);
    if (!terms.length) {
      return index.filter(function (it) { return it.kind === 'Action' || it.kind.indexOf('Section') === 0; });
    }
    var scored = [];
    index.forEach(function (it) {
      var s = 0;
      for (var i = 0; i < terms.length; i++) {
        var at = it.key.indexOf(terms[i]);
        if (at === -1) return;
        s += at === 0 ? 3 : /\W/.test(it.key.charAt(at - 1)) ? 2 : 1;
      }
      scored.push({ it: it, s: s });
    });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.map(function (x) { return x.it; });
  }

  function render() {
    results = search(palInput.value).slice(0, 40);
    palList.textContent = '';
    if (!results.length) {
      palList.appendChild(make('li', 'palette-empty', 'Nothing matches “' + palInput.value.trim() + '”.'));
      palInput.removeAttribute('aria-activedescendant');
      return;
    }
    results.forEach(function (r, i) {
      var li = make('li');
      li.id = 'pal-' + i;
      li.setAttribute('role', 'option');
      li.appendChild(make('span', 'label', r.label));
      li.appendChild(make('span', 'kind', r.kind));
      li.addEventListener('mousemove', function () { if (active !== i) setActive(i); });
      li.addEventListener('click', function () { choose(i); });
      palList.appendChild(li);
    });
    setActive(0);
  }

  function setActive(i) {
    var opts = $$('[role="option"]', palList);
    if (!opts.length) return;
    active = (i + opts.length) % opts.length;
    opts.forEach(function (o, j) { o.setAttribute('aria-selected', String(j === active)); });
    palInput.setAttribute('aria-activedescendant', opts[active].id);
    opts[active].scrollIntoView({ block: 'nearest' });
  }

  function choose(i) {
    var r = results[i];
    if (!r) return;
    dlg.close();
    r.run();
  }

  function openPalette() {
    if (dlg.open) return;
    index = index || buildIndex();
    palInput.value = '';
    dlg.showModal();
    render();
    palInput.focus();
  }

  palInput.addEventListener('input', render);
  palInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown')    { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter')   { e.preventDefault(); choose(active); }
  });
  // A click on the dimmed backdrop lands on the <dialog> itself.
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  $$('[data-action="palette"]').forEach(function (b) { b.addEventListener('click', openPalette); });

  /* ---------- keyboard ---------- */

  document.addEventListener('keydown', function (e) {
    var key = e.key || '';
    if ((e.ctrlKey || e.metaKey) && !e.altKey && key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dlg.open) dlg.close(); else openPalette();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || dlg.open) return;
    var t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;

    var i = ids.indexOf(current);
    if (key === '/') { e.preventDefault(); openPalette(); }
    else if (key === 'ArrowRight') go(ids[(i + 1) % ids.length]);
    else if (key === 'ArrowLeft') go(ids[(i - 1 + ids.length) % ids.length]);
    else if (/^[1-9]$/.test(key) && +key <= ids.length) go(ids[+key - 1]);
  });

  route();
})();
