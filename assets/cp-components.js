import { Component } from '@theme/component';

/**
 * Simple main-image + thumbnail gallery used by custom-product-hero.
 * Markup contract:
 *   ref="slides[]"  on each main slide
 *   ref="thumbs[]"  on each thumbnail button (on:click="/select/{index}")
 */
class CpGalleryComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.select(0);
  }

  select(index) {
    const i = Number(index) || 0;
    const slides = this.refs.slides || [];
    const thumbs = this.refs.thumbs || [];

    slides.forEach((slide, slideIndex) => slide.toggleAttribute('hidden', slideIndex !== i));
    thumbs.forEach((thumb, thumbIndex) => thumb.classList.toggle('is-active', thumbIndex === i));
  }
}

if (!customElements.get('cp-gallery-component')) {
  customElements.define('cp-gallery-component', CpGalleryComponent);
}

/**
 * Generic scroll-snap carousel used by the families, mission, adventure and
 * testimonials sections.
 * Markup contract:
 *   ref="track"     scrollable flex/grid container
 *   ref="slides[]"  each slide inside the track
 *   ref="dots[]"    optional pagination buttons (on:click="/goToDot/{index}")
 * Attributes:
 *   data-autoplay="4000"  autoplay interval in ms (omit/0 to disable)
 *   data-loop="false"     disable wrap-around on next/prev (default: loop)
 */
class CpCarouselComponent extends Component {
  index = 0;
  #autoplayTimer;
  #scrollTimer;

  connectedCallback() {
    super.connectedCallback();
    this.autoplayMs = Number(this.dataset.autoplay || 0);
    this.loop = this.dataset.loop !== 'false';

    this.refs.track?.addEventListener('scroll', () => this.#onScroll(), { passive: true });
    this.#setActiveDot(0);

    if (this.autoplayMs > 0) this.#startAutoplay();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.#autoplayTimer);
    clearTimeout(this.#scrollTimer);
  }

  next() {
    this.goTo(this.index + 1);
  }

  prev() {
    this.goTo(this.index - 1);
  }

  goToDot(index) {
    clearInterval(this.#autoplayTimer);
    this.goTo(index);
    if (this.autoplayMs > 0) this.#startAutoplay();
  }

  goTo(index) {
    const track = this.refs.track;
    const slides = this.refs.slides || [];
    if (!track || !slides.length) return;

    let target = Number(index) || 0;
    target = this.loop ? (target + slides.length) % slides.length : Math.max(0, Math.min(target, slides.length - 1));

    this.index = target;

    // Scroll only the track's own horizontal position. Element.scrollIntoView()
    // walks every scrollable ancestor, including the page itself, which caused
    // the whole page to jump vertically whenever autoplay advanced a slide.
    const trackRect = track.getBoundingClientRect();
    const slideRect = slides[target].getBoundingClientRect();
    track.scrollTo({ left: track.scrollLeft + (slideRect.left - trackRect.left), behavior: 'smooth' });

    this.#setActiveDot(target);
  }

  #onScroll() {
    clearTimeout(this.#scrollTimer);
    this.#scrollTimer = setTimeout(() => {
      const track = this.refs.track;
      const slides = this.refs.slides || [];
      if (!track || !slides.length) return;

      let closestIndex = 0;
      let closestDistance = Infinity;

      slides.forEach((slide, slideIndex) => {
        const distance = Math.abs(slide.offsetLeft - track.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = slideIndex;
        }
      });

      this.index = closestIndex;
      this.#setActiveDot(closestIndex);
    }, 100);
  }

  #setActiveDot(index) {
    (this.refs.dots || []).forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === index));
  }

  #startAutoplay() {
    clearInterval(this.#autoplayTimer);
    this.#autoplayTimer = setInterval(() => this.next(), this.autoplayMs);
  }
}

if (!customElements.get('cp-carousel-component')) {
  customElements.define('cp-carousel-component', CpCarouselComponent);
}

/**
 * Accessible tabs used by custom-product-comparison.
 * Markup contract:
 *   ref="tabButtons[]"  on:click="/selectTab/{index}"
 *   ref="tabPanels[]"
 *   ref="mobileSelect"  optional <select> on:change="/selectTabFromSelect"
 */
class CpTabsComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.selectTab(0);
  }

  selectTab(index) {
    const i = Number(index) || 0;
    const buttons = this.refs.tabButtons || [];
    const panels = this.refs.tabPanels || [];

    buttons.forEach((button, buttonIndex) => {
      const active = buttonIndex === i;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    panels.forEach((panel, panelIndex) => panel.toggleAttribute('hidden', panelIndex !== i));

    if (this.refs.mobileSelect) this.refs.mobileSelect.value = String(i);
  }

  selectTabFromSelect(event) {
    this.selectTab(event.target.value);
  }
}

if (!customElements.get('cp-tabs-component')) {
  customElements.define('cp-tabs-component', CpTabsComponent);
}
