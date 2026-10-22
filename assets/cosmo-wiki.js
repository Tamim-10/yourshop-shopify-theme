/* ==========================================================================
   JrTrack Wiki — assets/cosmo-wiki.js
   The wiki is made of several theme sections (top bar, hero, navigation, one
   section per topic, help, footnotes). This script treats them as one page:
   - builds the sidebar + mobile picker from every [data-cw-title] section and
     every .cw-art article, and a search index from their text
   - scroll-spy, anchor links, deep links, back-to-top
   - keeps sticky parts below the theme's sticky header (--cw-ho on :root)
   - optional FAQPage structured data built from the FAQ blocks
   - Theme Editor: rebuilds after any section/block change; opens a FAQ item
     when its block is selected
   Settings come from the Wiki top bar section ([data-cw-config]).
   ========================================================================== */
(function () {
  'use strict';
  if (window.CosmoWiki) { window.CosmoWiki.refresh(); return; }

  var slice = function (list) { return Array.prototype.slice.call(list); };
  var ac = null;

  function init() {
    if (!document.querySelector('.cw')) return;
    ac = new AbortController();
    var opt = { signal: ac.signal };
    var passive = { signal: ac.signal, passive: true };

    var cfgEl = document.querySelector('[data-cw-config]');
    var cfg = function (name, fallback) {
      var v = cfgEl ? cfgEl.getAttribute('data-' + name) : null;
      return v === null ? fallback : v;
    };
    var phone = cfg('help-phone', '');
    var slashEnabled = cfg('slash-shortcut', 'true') !== 'false';
    var faqSchema = cfg('faq-schema', 'true') !== 'false';
    var headerSelector = cfg('header-selector', '');

    /* ---------- Sticky offset: follow the theme's sticky header ---------- */
    var headerEls = [];
    if (headerSelector) {
      try {
        headerEls = slice(document.querySelectorAll(headerSelector)).filter(function (el) {
          return !el.closest('.cw') && !el.querySelector('.cw');
        });
      } catch (e) { headerEls = []; }
    }
    var offset = -1;
    function measureOffset() {
      var bottom = 0;
      headerEls.forEach(function (el) {
        var cs = getComputedStyle(el);
        if (cs.position !== 'sticky' && cs.position !== 'fixed') return;
        var r = el.getBoundingClientRect();
        if (!r.height) return;
        var b = Math.min(r.bottom, (parseFloat(cs.top) || 0) + r.height);
        if (b > bottom) bottom = b;
      });
      bottom = Math.max(0, Math.round(bottom));
      if (bottom !== offset) {
        offset = bottom;
        document.documentElement.style.setProperty('--cw-ho', offset + 'px');
      }
    }
    var topbar = document.querySelector('.cw .cw-top');
    var mobnav = document.querySelector('.cw .cw-mobnav');
    function topbarHeight() { return topbar ? topbar.offsetHeight : 0; }
    function mobnavHeight() { return mobnav ? mobnav.offsetHeight : 0; } /* 0 on desktop (hidden) */
    var mobH = -1;
    function measureMobnav() {
      var h = mobnavHeight();
      if (h !== mobH) { mobH = h; document.documentElement.style.setProperty('--cw-mobnav-h', h + 'px'); }
    }
    measureOffset();
    measureMobnav();

    /* ---------- Sidebar: stop at the end of the wiki ---------- */
    var side = document.querySelector('.cw-navpart .cw-side');
    var parts = slice(document.querySelectorAll('.cw .cw-main--part'));
    var shift = 0;
    function clampSidebar() {
      if (!side || !parts.length || !side.offsetParent) return;
      var r = side.getBoundingClientRect();
      var naturalBottom = r.bottom - shift;
      var end = parts[parts.length - 1].getBoundingClientRect().bottom;
      var next = Math.min(0, Math.round(end - naturalBottom));
      if (next !== shift) {
        shift = next;
        side.style.transform = shift ? 'translateY(' + shift + 'px)' : '';
      }
    }

    var sections = slice(document.querySelectorAll('.cw [data-cw-title]'));
    var arts = slice(document.querySelectorAll('.cw .cw-art'));

    /* ---------- Build sidebar (with nested article links) + mobile nav ---------- */
    var navUl = document.querySelector('.cw [data-cw-nav]');
    var mobSel = document.querySelector('.cw [data-cw-mobnav]');
    if (navUl) navUl.innerHTML = '';
    if (mobSel) mobSel.innerHTML = '';
    var navItems = {};
    sections.forEach(function (sec) {
      var title = sec.getAttribute('data-cw-title');
      if (navUl) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + sec.id; a.textContent = title; a.setAttribute('data-cw-link', sec.id);
        li.appendChild(a);
        var subs = slice(sec.querySelectorAll('.cw-art'));
        if (subs.length > 1) {
          var ul = document.createElement('ul');
          subs.forEach(function (art) {
            var h = art.querySelector('h3');
            if (!art.id || !h) return;
            var sli = document.createElement('li');
            var sa = document.createElement('a');
            sa.href = '#' + art.id; sa.textContent = h.textContent.trim(); sa.setAttribute('data-cw-sub', art.id);
            sli.appendChild(sa); ul.appendChild(sli);
          });
          li.appendChild(ul);
        }
        navUl.appendChild(li);
        navItems[sec.id] = li;
      }
      if (mobSel) {
        var op = document.createElement('option');
        op.value = sec.id; op.textContent = title; mobSel.appendChild(op);
      }
    });
    if (mobSel) {
      mobSel.addEventListener('change', function () {
        var el = document.getElementById(mobSel.value);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, opt);
    }

    /* ---------- Anchor links on every article ---------- */
    arts.forEach(function (art) {
      if (!art.id) return;
      var h = art.querySelector('.cw-art-h');
      if (!h || h.querySelector('.cw-anchor')) return;
      var a = document.createElement('a');
      a.className = 'cw-anchor';
      a.href = '#' + art.id;
      a.setAttribute('aria-label', 'Copy link to this section');
      a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7"/></svg>';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var url = location.href.split('#')[0] + '#' + art.id;
        history.replaceState(null, '', '#' + art.id);
        var done = function () {
          a.classList.add('is-copied');
          setTimeout(function () { a.classList.remove('is-copied'); }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, done);
        } else { done(); }
      }, opt);
      h.appendChild(a);
    });

    /* ---------- Stable ids on accordion rows ---------- */
    function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48); }
    var accRows = slice(document.querySelectorAll('.cw .cw-acc details'));
    accRows.forEach(function (d) {
      if (d.id) return;
      var s = d.querySelector('summary');
      if (s) d.id = 'q-' + slug(s.textContent.trim());
    });

    /* ---------- Search index: articles + accordion rows ---------- */
    var index = [];
    arts.forEach(function (art) {
      var sec = art.closest('[data-cw-title]');
      var titleEl = art.querySelector('h3');
      var body = art.querySelector('.cw-body') || art;
      var text = '';
      slice(body.childNodes).forEach(function (n) {
        if (n.nodeType === 1 && n.classList && n.classList.contains('cw-acc')) return;
        text += ' ' + (n.textContent || '');
      });
      text = text.replace(/\s+/g, ' ').trim();
      if (!art.id || !titleEl) return;
      index.push({ id: art.id, title: titleEl.textContent.trim(), crumb: sec ? sec.getAttribute('data-cw-title') : '', text: text });
    });
    accRows.forEach(function (d) {
      var sec = d.closest('[data-cw-title]');
      var s = d.querySelector('summary');
      var b = d.querySelector('.cw-acc-body');
      if (!s || !d.id) return;
      index.push({ id: d.id, title: s.textContent.trim(), crumb: sec ? sec.getAttribute('data-cw-title') : '', text: (b ? b.textContent : '').replace(/\s+/g, ' ').trim() });
    });
    function flatten(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ''); }
    index.forEach(function (r) {
      r.hay = (r.title + ' ' + r.crumb + ' ' + r.text).toLowerCase();
      r.flat = flatten(r.hay);
      r.flatTitle = flatten(r.title);
    });

    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function mark(str, q) {
      var i = str.toLowerCase().indexOf(q);
      if (i < 0) return esc(str);
      return esc(str.slice(0, i)) + '<mark>' + esc(str.slice(i, i + q.length)) + '</mark>' + esc(str.slice(i + q.length));
    }
    function snippet(text, q) {
      var i = text.toLowerCase().indexOf(q);
      if (i < 0) return esc(text.slice(0, 120));
      var start = Math.max(0, i - 46);
      var s = (start > 0 ? '…' : '') + text.slice(start, start + 150);
      return mark(s, q) + (start + 150 < text.length ? '…' : '');
    }

    function flashTarget(target, delay, duration) {
      var flash = target.closest('.cw-art') || target;
      setTimeout(function () {
        flash.classList.add('is-target');
        setTimeout(function () { flash.classList.remove('is-target'); }, duration);
      }, delay);
    }

    /* ---------- Wire each search box ---------- */
    var emptyHint = phone ? 'Try a different word, or call ' + esc(phone) : 'Try a different word';
    var boxes = slice(document.querySelectorAll('.cw [data-cw-search]'));
    boxes.forEach(function (box) {
      var input = box.querySelector('input');
      var panel = box.querySelector('.cw-results');
      if (!input || !panel) return;
      var cur = -1, rows = [];
      function close() { box.classList.remove('is-open'); cur = -1; }
      function run() {
        var q = input.value.trim().toLowerCase();
        if (q.length < 2) { close(); panel.innerHTML = ''; return; }
        var qf = flatten(q);
        var hits = [];
        for (var i = 0; i < index.length; i++) {
          var r = index[i];
          var pos = r.hay.indexOf(q);
          var fpos = (pos < 0 && qf) ? r.flat.indexOf(qf) : -1;
          if (pos < 0 && fpos < 0) continue;
          var t = r.title.toLowerCase();
          var score = (t.indexOf(q) === 0 || r.flatTitle.indexOf(qf) === 0) ? 0
                    : (t.indexOf(q) > -1 || r.flatTitle.indexOf(qf) > -1) ? 1
                    : (pos > -1) ? 2 : 3;
          hits.push({ r: r, score: score, pos: pos > -1 ? pos : fpos });
        }
        hits.sort(function (a, b) { return a.score - b.score || a.pos - b.pos; });
        hits = hits.slice(0, 8);
        if (!hits.length) {
          panel.innerHTML = '<div class="cw-res-empty"><b>No matches for &ldquo;' + esc(input.value.trim()) + '&rdquo;</b>' + emptyHint + '</div>';
        } else {
          panel.innerHTML = hits.map(function (h) {
            return '<a class="cw-res" href="#' + h.r.id + '" data-id="' + h.r.id + '">'
                 + '<div class="cw-res-crumb">' + esc(h.r.crumb) + '</div>'
                 + '<div class="cw-res-title">' + mark(h.r.title, q) + '</div>'
                 + '<div class="cw-res-snip">' + snippet(h.r.text, q) + '</div></a>';
          }).join('');
        }
        rows = slice(panel.querySelectorAll('.cw-res'));
        cur = -1;
        box.classList.add('is-open');
      }
      function go(el) {
        if (!el) return;
        var target = document.getElementById(el.getAttribute('data-id'));
        close(); input.blur();
        if (!target) return;
        if (target.tagName === 'DETAILS') target.open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + target.id);
        flashTarget(target, 0, 1800);
      }
      function highlight() {
        rows.forEach(function (r, i) { r.classList.toggle('is-active', i === cur); });
        if (rows[cur]) rows[cur].scrollIntoView({ block: 'nearest' });
      }
      input.addEventListener('input', run, opt);
      input.addEventListener('focus', function () { if (input.value.trim().length > 1) run(); }, opt);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { close(); input.blur(); return; }
        if (!rows.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); cur = (cur + 1) % rows.length; highlight(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); cur = (cur - 1 + rows.length) % rows.length; highlight(); }
        else if (e.key === 'Enter') { e.preventDefault(); go(rows[cur] || rows[0]); }
      }, opt);
      panel.addEventListener('click', function (e) {
        var a = e.target.closest('.cw-res');
        if (a) { e.preventDefault(); go(a); }
      }, opt);
      document.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); }, opt);
    });

    /* ---------- "/" focuses search ---------- */
    if (slashEnabled) {
      document.addEventListener('keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
        if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
          var vis = boxes.filter(function (b) { return b.offsetParent !== null; });
          if (vis[0]) { e.preventDefault(); vis[0].querySelector('input').focus(); }
        }
      }, opt);
    }

    /* ---------- Scroll spy: section + article ---------- */
    var links = {}, subLinks = {};
    slice(document.querySelectorAll('.cw [data-cw-link]')).forEach(function (a) { links[a.getAttribute('data-cw-link')] = a; });
    slice(document.querySelectorAll('.cw [data-cw-sub]')).forEach(function (a) { subLinks[a.getAttribute('data-cw-sub')] = a; });

    function spy() {
      /* Source used a fixed line of 150px; now header + wiki bar + 40px. */
      /* Same reading line as the original page (150px below a 64px bar), now below the theme header and picker too. */
      var line = offset + topbarHeight() + mobnavHeight() + 86, best = null, bestTop = -Infinity;
      sections.forEach(function (sec) {
        var t = sec.getBoundingClientRect().top;
        if (t <= line && t > bestTop) { bestTop = t; best = sec; }
      });
      if (!best && sections.length) best = sections[0];
      for (var k in links) links[k].classList.remove('is-active');
      for (var s in navItems) navItems[s].classList.remove('is-open');
      if (best && links[best.id]) links[best.id].classList.add('is-active');
      if (best && navItems[best.id]) navItems[best.id].classList.add('is-open');
      if (best && mobSel && mobSel.value !== best.id) mobSel.value = best.id;

      var bestArt = null, artTop = -Infinity;
      if (best) {
        slice(best.querySelectorAll('.cw-art')).forEach(function (art) {
          var t = art.getBoundingClientRect().top;
          if (t <= line + 40 && t > artTop) { artTop = t; bestArt = art; }
        });
      }
      for (var j in subLinks) subLinks[j].classList.remove('is-active');
      if (bestArt && subLinks[bestArt.id]) subLinks[bestArt.id].classList.add('is-active');
    }

    /* ---------- Back to top ---------- */
    var toTop = document.querySelector('.cw [data-cw-totop]');
    if (toTop) { toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); }, opt); }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        measureOffset();
        measureMobnav();
        clampSidebar();
        spy();
        if (toTop) toTop.classList.toggle('is-on', window.pageYOffset > 900);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, passive);
    window.addEventListener('resize', onScroll, passive);
    spy();


    clampSidebar();

    /* ---------- FAQPage structured data from the FAQ blocks ---------- */
    var old = document.getElementById('cw-faq-ld');
    if (old) old.remove();
    if (faqSchema && accRows.length) {
      var ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.id = 'cw-faq-ld';
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: accRows.map(function (d) {
          var b = d.querySelector('.cw-acc-body');
          return { '@type': 'Question', name: d.querySelector('summary').textContent.trim(),
                   acceptedAnswer: { '@type': 'Answer', text: (b ? b.textContent : '').replace(/\s+/g, ' ').trim() } };
        })
      });
      document.head.appendChild(ld);
    }

    return { flashTarget: flashTarget };
  }

  var api = null;
  function destroy() {
    if (ac) { ac.abort(); ac = null; }
    var side = document.querySelector('.cw-navpart .cw-side');
    if (side) side.style.transform = '';
  }
  function refresh() { destroy(); api = init(); }

  /* Debounced rebuild: the Theme Editor fires several events per change. */
  var pending = false;
  function scheduleRefresh() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; refresh(); });
  }

  function openDeepLink() {
    if (!location.hash) return;
    var t;
    try { t = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { t = null; }
    if (!t || !t.closest('.cw')) return;
    if (t.tagName === 'DETAILS') t.open = true;
    requestAnimationFrame(function () { t.scrollIntoView({ block: 'start' }); });
    if (api && t.closest('.cw-art')) api.flashTarget(t, 400, 2000);
  }

  function boot() { api = init(); openDeepLink(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ---------- Theme Editor ---------- */
  ['shopify:section:load', 'shopify:section:unload', 'shopify:section:reorder'].forEach(function (ev) {
    document.addEventListener(ev, scheduleRefresh);
  });
  document.addEventListener('shopify:block:select', function (e) {
    if (e.target && e.target.tagName === 'DETAILS') e.target.open = true;
  });
  document.addEventListener('shopify:block:deselect', function (e) {
    if (e.target && e.target.tagName === 'DETAILS') e.target.open = false;
  });

  window.CosmoWiki = { refresh: refresh, destroy: destroy };
})();
