/**
 * Product guide
 *
 * Two small web components used by the "Guide hero" and "Guide content" sections:
 *
 *   <guide-search>   Live search across every article on the page.
 *   <product-guide>  Contents highlighting, copy-link buttons, mobile section
 *                    picker, back-to-top button and deep-link highlighting.
 *
 * Plain ES module, no dependencies. Loaded with type="module", so the browser
 * runs it once per page even though both sections include it. Because these
 * are custom elements, they initialise themselves when the theme editor
 * re-renders a section (connectedCallback / disconnectedCallback).
 */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');

const HIGHLIGHT_MS = 1800;
const BACK_TO_TOP_AFTER = 900; // px scrolled before the button appears

/** Lower-case and strip punctuation so "wifi" matches "Wi-Fi". */
const flatten = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/** Wrap the first occurrence of `query` in <mark>. */
function markMatch(text, query) {
  const at = text.toLowerCase().indexOf(query);
  if (at < 0) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, at)) +
    '<mark>' +
    escapeHtml(text.slice(at, at + query.length)) +
    '</mark>' +
    escapeHtml(text.slice(at + query.length))
  );
}

function snippetFor(text, query) {
  const at = text.toLowerCase().indexOf(query);
  if (at < 0) return escapeHtml(text.slice(0, 120));
  const start = Math.max(0, at - 46);
  const slice = (start > 0 ? '\u2026' : '') + text.slice(start, start + 150);
  return markMatch(slice, query) + (start + 150 < text.length ? '\u2026' : '');
}

/** Briefly outline an article so people can see where they landed. */
function flashTarget(element) {
  element.classList.add('is-target');
  window.setTimeout(() => element.classList.remove('is-target'), HIGHLIGHT_MS);
}

/** Scroll to an element, update the URL hash, highlight it and move focus there. */
function jumpTo(element) {
  element.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  if (element.id) history.replaceState(null, '', `#${element.id}`);
  flashTarget(element);
  if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll: true });
}

/* -------------------------------------------------------------------------- */
/* <guide-search>                                                             */
/* -------------------------------------------------------------------------- */

class GuideSearch extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    this.panel = this.querySelector('.pg-results');
    this.status = this.querySelector('[data-pg-status]');
    if (!this.input || !this.panel) return;

    this.index = [];
    this.options = [];
    this.active = -1;

    this.onInput = () => this.run();
    this.onFocus = () => {
      this.buildIndex();
      if (this.input.value.trim().length > 1) this.run();
    };
    this.onKeydown = (event) => this.handleKey(event);
    this.onPanelClick = (event) => {
      const option = event.target.closest('.pg-res');
      if (option) {
        event.preventDefault();
        this.choose(option);
      }
    };
    this.onDocumentClick = (event) => {
      if (!this.contains(event.target)) this.close();
    };
    this.onSlash = (event) => this.handleSlash(event);

    this.input.addEventListener('input', this.onInput);
    this.input.addEventListener('focus', this.onFocus);
    this.input.addEventListener('keydown', this.onKeydown);
    this.panel.addEventListener('click', this.onPanelClick);
    document.addEventListener('click', this.onDocumentClick);
    document.addEventListener('keydown', this.onSlash);
  }

  disconnectedCallback() {
    if (!this.input) return;
    this.input.removeEventListener('input', this.onInput);
    this.input.removeEventListener('focus', this.onFocus);
    this.input.removeEventListener('keydown', this.onKeydown);
    this.panel.removeEventListener('click', this.onPanelClick);
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keydown', this.onSlash);
  }

  /** Read every article currently on the page. Cheap, and done on focus so edits show up. */
  buildIndex() {
    this.index = Array.from(document.querySelectorAll('[data-pg-article]'))
      .map((article) => {
        const heading = article.querySelector('h3');
        const body = article.querySelector('.pg-body') || article;
        const chapter = article.closest('[data-pg-chapter]');
        const title = heading ? heading.textContent.trim() : '';
        const crumb = chapter ? chapter.dataset.title || '' : '';
        const text = (body.textContent || '').replace(/\s+/g, ' ').trim();
        const haystack = `${title} ${crumb} ${text}`.toLowerCase();
        return {
          id: article.id,
          title,
          crumb,
          text,
          haystack,
          flat: flatten(haystack),
          flatTitle: flatten(title),
        };
      })
      .filter((entry) => entry.id && entry.title);
  }

  run() {
    const raw = this.input.value.trim();
    const query = raw.toLowerCase();
    if (query.length < 2) {
      this.panel.innerHTML = '';
      this.close();
      return;
    }
    if (!this.index.length) this.buildIndex();

    const flatQuery = flatten(query);
    const hits = [];
    for (const entry of this.index) {
      const position = entry.haystack.indexOf(query);
      const flatPosition = position < 0 && flatQuery ? entry.flat.indexOf(flatQuery) : -1;
      if (position < 0 && flatPosition < 0) continue;

      const title = entry.title.toLowerCase();
      let score = 3;
      if (title.indexOf(query) === 0 || (flatQuery && entry.flatTitle.indexOf(flatQuery) === 0)) score = 0;
      else if (title.indexOf(query) > -1 || (flatQuery && entry.flatTitle.indexOf(flatQuery) > -1)) score = 1;
      else if (position > -1) score = 2;
      hits.push({ entry, score, position: position > -1 ? position : flatPosition });
    }
    hits.sort((a, b) => a.score - b.score || a.position - b.position);
    const top = hits.slice(0, 8);

    if (!top.length) {
      const title = this.dataset.emptyTitle || 'No matches for';
      const text = this.dataset.emptyText || '';
      this.panel.innerHTML =
        `<div class="pg-res-empty"><b>${escapeHtml(title)} \u201c${escapeHtml(raw)}\u201d</b>${escapeHtml(text)}</div>`;
      this.announce(`${title} \u201c${raw}\u201d`);
    } else {
      const baseId = this.panel.id || 'pg-results';
      this.panel.innerHTML = top
        .map(
          ({ entry }, i) =>
            `<a class="pg-res" role="option" id="${baseId}-opt-${i}" aria-selected="false" href="#${entry.id}" data-id="${entry.id}">` +
            `<div class="pg-res-crumb">${escapeHtml(entry.crumb)}</div>` +
            `<div class="pg-res-title">${markMatch(entry.title, query)}</div>` +
            `<div class="pg-res-snip">${snippetFor(entry.text, query)}</div></a>`
        )
        .join('');
      this.announce(`${top.length} ${this.dataset.resultsLabel || 'results'}`);
    }

    this.options = Array.from(this.panel.querySelectorAll('.pg-res'));
    this.setActive(-1);
    this.open();
  }

  open() {
    this.classList.add('is-open');
    this.panel.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');
  }

  close() {
    this.classList.remove('is-open');
    this.panel.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
    this.active = -1;
  }

  announce(message) {
    if (this.status) this.status.textContent = message;
  }

  setActive(index) {
    this.active = index;
    this.options.forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    const current = this.options[index];
    if (current) {
      this.input.setAttribute('aria-activedescendant', current.id);
      current.scrollIntoView({ block: 'nearest' });
    } else {
      this.input.removeAttribute('aria-activedescendant');
    }
  }

  choose(option) {
    const target = document.getElementById(option.dataset.id);
    this.close();
    this.input.blur();
    if (target) jumpTo(target);
  }

  handleKey(event) {
    if (event.key === 'Escape') {
      this.close();
      this.input.blur();
      return;
    }
    if (!this.options.length || this.panel.hidden) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setActive((this.active + 1) % this.options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setActive((this.active - 1 + this.options.length) % this.options.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.choose(this.options[this.active] || this.options[0]);
    }
  }

  /** Pressing "/" focuses the search box that is on screen (or the sticky one). */
  handleSlash(event) {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = (event.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || event.target.isContentEditable) return;

    const boxes = Array.from(document.querySelectorAll('guide-search')).filter((box) => box.offsetParent !== null);
    const inView = boxes.find((box) => {
      const rect = box.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
    const winner = inView || boxes[boxes.length - 1];
    if (winner === this) {
      event.preventDefault();
      this.input.focus();
    }
  }
}

/* -------------------------------------------------------------------------- */
/* <product-guide>                                                            */
/* -------------------------------------------------------------------------- */

class ProductGuide extends HTMLElement {
  connectedCallback() {
    this.chapters = Array.from(this.querySelectorAll('[data-pg-chapter]'));
    this.nav = this.querySelector('[data-pg-nav]');
    this.select = this.querySelector('[data-pg-mobnav]');
    this.toTop = this.querySelector('[data-pg-totop]');
    this.live = this.querySelector('[data-pg-live]');
    this.copiedTimer = 0;

    this.ensureNavigation();
    this.initCopyLinks();
    this.initScrollSpy();
    this.initBackToTop();
    this.initMobileNav();
    this.initDeepLinks();
  }

  disconnectedCallback() {
    if (this.spy) this.spy.disconnect();
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('hashchange', this.onHashChange);
    window.clearTimeout(this.copiedTimer);
  }

  /**
   * The contents list is rendered by Liquid. If it ever comes through empty
   * (for example a customised section), build it from the chapters instead.
   */
  ensureNavigation() {
    if (this.nav && !this.nav.children.length) {
      for (const chapter of this.chapters) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${chapter.id}`;
        link.textContent = chapter.dataset.title || '';
        link.dataset.pgNavLink = chapter.id;
        item.appendChild(link);
        this.nav.appendChild(item);
      }
    }
    if (this.select && !this.select.options.length) {
      for (const chapter of this.chapters) {
        this.select.add(new Option(chapter.dataset.title || '', chapter.id));
      }
    }
  }

  /** Copy-link buttons that sit next to each article heading. */
  initCopyLinks() {
    const label = this.dataset.copyLabel;
    this.querySelectorAll('.pg-anchor').forEach((link) => {
      if (label) link.setAttribute('aria-label', label);
    });

    this.addEventListener('click', (event) => {
      const link = event.target.closest('.pg-anchor');
      if (!link) return;
      event.preventDefault();

      const id = link.getAttribute('href').slice(1);
      const url = `${location.href.split('#')[0]}#${id}`;
      history.replaceState(null, '', `#${id}`);

      const done = () => {
        link.classList.add('is-copied');
        if (this.live) this.live.textContent = this.dataset.copiedLabel || '';
        window.clearTimeout(this.copiedTimer);
        this.copiedTimer = window.setTimeout(() => {
          link.classList.remove('is-copied');
          if (this.live) this.live.textContent = '';
        }, 1400);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, done);
      } else {
        done();
      }
    });
  }

  /** Highlight the contents entry for the chapter currently in view. */
  initScrollSpy() {
    if (!this.chapters.length || !('IntersectionObserver' in window)) return;

    const links = new Map();
    this.querySelectorAll('[data-pg-nav-link]').forEach((link) => links.set(link.dataset.pgNavLink, link));

    const inBand = new Set();
    const setCurrent = (id) => {
      links.forEach((link, key) => {
        if (key === id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      if (this.select && this.select.value !== id) this.select.value = id;
    };

    // Watch a thin band a third of the way down the viewport.
    this.spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target);
          else inBand.delete(entry.target);
        }
        const current = [...this.chapters].reverse().find((chapter) => inBand.has(chapter));
        if (current) setCurrent(current.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    this.chapters.forEach((chapter) => this.spy.observe(chapter));
    setCurrent(this.chapters[0].id);
  }

  /**
   * Show the back-to-top button once the page has scrolled down a little.
   * A passive, rAF-throttled scroll listener is used because an
   * IntersectionObserver would miss jumps (anchor links, search results) that skip
   * straight past the trigger point.
   */
  initBackToTop() {
    if (!this.toTop) return;
    this.toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: scrollBehavior() }));

    let queued = false;
    this.onScroll = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        this.toTop.classList.toggle('is-on', window.scrollY > BACK_TO_TOP_AFTER);
      });
    };
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  }

  initMobileNav() {
    if (!this.select) return;
    this.select.addEventListener('change', () => {
      const target = document.getElementById(this.select.value);
      if (target) jumpTo(target);
    });
  }

  /** Highlight an article when someone arrives with, or clicks, a #link to it. */
  initDeepLinks() {
    const highlightHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = id && document.getElementById(id);
      if (target && target.matches('[data-pg-article]')) flashTarget(target);
    };
    this.onHashChange = highlightHash;
    window.addEventListener('hashchange', this.onHashChange);
    if (location.hash) window.setTimeout(highlightHash, 400);
  }
}

if (!customElements.get('guide-search')) customElements.define('guide-search', GuideSearch);
if (!customElements.get('product-guide')) customElements.define('product-guide', ProductGuide);
