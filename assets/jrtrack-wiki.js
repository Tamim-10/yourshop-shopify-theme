(function () { 
    'use strict';
    var root = document.getElementById('cw-wiki');
    if (!root || root.dataset.cwReady) return;
    root.dataset.cwReady = '1';
    var sections = Array.prototype.slice.call(root.querySelectorAll('[data-cw-title]'));
    var arts = Array.prototype.slice.call(root.querySelectorAll('.cw-art'));
    var navUl = root.querySelector('[data-cw-nav]');
    var mobSel = root.querySelector('[data-cw-mobnav]');
    var navItems = {};
    sections.forEach(function (sec) {
        var title = sec.getAttribute('data-cw-title');
        if (navUl) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + sec.id; a.textContent = title; a.setAttribute('data-cw-link', sec.id);
            li.appendChild(a);
            var subs = Array.prototype.slice.call(sec.querySelectorAll('.cw-art'));
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
        });
    }
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
        });
        h.appendChild(a);
    });
    function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48); }
    var accRows = Array.prototype.slice.call(root.querySelectorAll('.cw-acc details'));
    accRows.forEach(function (d) {
        if (d.id) return;
        var s = d.querySelector('summary');
        if (s) d.id = 'q-' + slug(s.textContent.trim());
    });
    var index = [];
    arts.forEach(function (art) {
        var sec = art.closest('[data-cw-title]');
        var titleEl = art.querySelector('h3');
        var body = art.querySelector('.cw-body') || art;
        var text = '';
        Array.prototype.slice.call(body.childNodes).forEach(function (n) {
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
    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function mark(str, q) {
        var i = str.toLowerCase().indexOf(q);
        if (i < 0) return esc(str);
        return esc(str.slice(0, i)) + '<mark>' + esc(str.slice(i, i + q.length)) + '</mark>' + esc(str.slice(i + q.length));
    }
    function snippet(text, q) {
        var i = text.toLowerCase().indexOf(q);
        if (i < 0) return esc(text.slice(0, 120));
        var start = Math.max(0, i - 46);
        var s = (start > 0 ? '&#8230;' : '') + text.slice(start, start + 150);
        return mark(s, q) + (start + 150 < text.length ? '&#8230;' : '');
    }
    var boxes = Array.prototype.slice.call(root.querySelectorAll('[data-cw-search]'));
    boxes.forEach(function (box) {
        var input = box.querySelector('input');
        var panel = box.querySelector('.cw-results');
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
                panel.innerHTML = '<div class="cw-res-empty"><b>No matches for &ldquo;' + esc(input.value.trim()) + '&rdquo;</b>Try a different word, or call 877-215-4741</div>';
            } else {
                panel.innerHTML = hits.map(function (h) {
                    return '<a class="cw-res" href="#' + h.r.id + '" data-id="' + h.r.id + '">'
                        + '<div class="cw-res-crumb">' + esc(h.r.crumb) + '</div>'
                        + '<div class="cw-res-title">' + mark(h.r.title, q) + '</div>'
                        + '<div class="cw-res-snip">' + snippet(h.r.text, q) + '</div></a>';
                }).join('');
            }
            rows = Array.prototype.slice.call(panel.querySelectorAll('.cw-res'));
            cur = -1;
            box.classList.add('is-open');
        }
        function go(el) {
            if (!el) return;
            var target = document.getElementById(el.getAttribute('data-id'));
            close(); input.blur();
            if (!target) return;
            if (target.tagName === 'DETAILS') target.open = true;
            var flash = target.closest('.cw-art') || target;
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', '#' + target.id);
            flash.classList.add('is-target');
            setTimeout(function () { flash.classList.remove('is-target'); }, 1800);
        }
        function highlight() {
            rows.forEach(function (r, i) { r.classList.toggle('is-active', i === cur); });
            if (rows[cur]) rows[cur].scrollIntoView({ block: 'nearest' });
        }
        input.addEventListener('input', run);
        input.addEventListener('focus', function () { if (input.value.trim().length > 1) run(); });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { close(); input.blur(); return; }
            if (!rows.length) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); cur = (cur + 1) % rows.length; highlight(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); cur = (cur - 1 + rows.length) % rows.length; highlight(); }
            else if (e.key === 'Enter') { e.preventDefault(); go(rows[cur] || rows[0]); }
        });
        panel.addEventListener('click', function (e) {
            var a = e.target.closest('.cw-res');
            if (a) { e.preventDefault(); go(a); }
        });
        document.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
    });
    document.addEventListener('keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
        if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
            var vis = boxes.filter(function (b) { return b.offsetParent !== null; });
            if (vis[0]) { e.preventDefault(); vis[0].querySelector('input').focus(); }
        }
    });
    var links = {}, subLinks = {};
    Array.prototype.slice.call(root.querySelectorAll('[data-cw-link]')).forEach(function (a) { links[a.getAttribute('data-cw-link')] = a; });
    Array.prototype.slice.call(root.querySelectorAll('[data-cw-sub]')).forEach(function (a) { subLinks[a.getAttribute('data-cw-sub')] = a; });
    function spy() {
        var line = 150, best = null, bestTop = -Infinity;
        sections.forEach(function (sec) {
            var top = sec.getBoundingClientRect().top;
            if (top <= line && top > bestTop) { bestTop = top; best = sec; }
        });
        if (!best && sections.length) best = sections[0];
        for (var k in links) links[k].classList.remove('is-active');
        for (var s in navItems) navItems[s].classList.remove('is-open');
        if (best && links[best.id]) { links[best.id].classList.add('is-active'); }
        if (best && navItems[best.id]) { navItems[best.id].classList.add('is-open'); }
        if (best && mobSel && mobSel.value !== best.id) mobSel.value = best.id;
        var bestArt = null, artTop = -Infinity;
        if (best) {
            Array.prototype.slice.call(best.querySelectorAll('.cw-art')).forEach(function (art) {
                var top = art.getBoundingClientRect().top;
                if (top <= line + 40 && top > artTop) { artTop = top; bestArt = art; }
            });
        }
        for (var j in subLinks) subLinks[j].classList.remove('is-active');
        if (bestArt && subLinks[bestArt.id]) subLinks[bestArt.id].classList.add('is-active');
    }
    var toTop = root.querySelector('[data-cw-totop]');
    if (toTop) { toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); }); }
    var ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            spy();
            if (toTop) toTop.classList.toggle('is-on', window.pageYOffset > 900);
            ticking = false;
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    spy();
    if (location.hash) {
        var t = document.getElementById(location.hash.slice(1));
        if (t) {
            if (t.tagName === 'DETAILS') { t.open = true; }
            var f = t.closest('.cw-art');
            if (f) {
                setTimeout(function () {
                    f.classList.add('is-target');
                    setTimeout(function () { f.classList.remove('is-target'); }, 2000);
                }, 400);
            }
        }
    }
})();