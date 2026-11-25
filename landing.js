/**
 * landing.js — Dinamismo editorial e interactividad para la Bitácora Hebra / KENOSIS
 * (Progreso de lectura, navegación activa, parallax sutil, carrusel con flechas y barra única
 * para las 8 transmedias, revelación escalonada y lightbox navegable).
 */

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initMobileMenu() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initScrollProgress() {
  const bar = document.getElementById('scroll-progress-bar');
  if (!bar) return;

  let ticking = false;
  const update = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    bar.style.transform = `scaleX(${ratio})`;
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
  update();
}

function initActiveNavHighlight() {
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!navLinks.length || !('IntersectionObserver' in window)) return;

  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const hash = `#${entry.target.id}`;
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === hash);
        });
      });
    },
    { rootMargin: '-38% 0px -52% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

function initSubtleParallax() {
  if (prefersReducedMotion()) return;
  const targets = Array.from(document.querySelectorAll('[data-parallax]'));
  if (!targets.length) return;

  let ticking = false;
  const update = () => {
    if (window.innerWidth < 860) {
      targets.forEach((el) => {
        el.style.transform = '';
      });
      ticking = false;
      return;
    }

    const viewportCenter = window.innerHeight * 0.5;
    targets.forEach((el) => {
      const speed = parseFloat(el.getAttribute('data-parallax') || '0.06');
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height * 0.5;
      const offset = Math.max(-24, Math.min(24, (viewportCenter - elCenter) * speed));
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
  window.addEventListener('resize', update, { passive: true });
}

function initTransmediaTimeline() {
  const track = document.getElementById('transmedia-track');
  const prevBtn = document.getElementById('btn-transmedia-prev');
  const nextBtn = document.getElementById('btn-transmedia-next');
  const counterEl = document.getElementById('transmedia-counter');
  const progressFill = document.getElementById('timeline-progress-fill');

  if (!track) return;
  const cards = Array.from(track.querySelectorAll('.transmedia-card'));
  const total = cards.length;
  if (!total) return;

  let currentStep = 0;

  const updateUI = (step) => {
    currentStep = Math.max(0, Math.min(total - 1, step));
    const padded = String(currentStep + 1).padStart(2, '0');
    if (counterEl) counterEl.textContent = `${padded} / ${String(total).padStart(2, '0')}`;
    if (prevBtn) prevBtn.disabled = currentStep === 0;
    if (nextBtn) nextBtn.disabled = currentStep === total - 1;
    if (progressFill) {
      progressFill.style.width = `${((currentStep + 1) / total) * 100}%`;
    }
  };

  const scrollToStep = (step) => {
    const idx = Math.max(0, Math.min(total - 1, step));
    const card = cards[idx];
    if (!card) return;

    track.scrollTo({
      left: card.offsetLeft - track.offsetLeft,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
    updateUI(idx);
  };

  prevBtn?.addEventListener('click', () => scrollToStep(currentStep - 1));
  nextBtn?.addEventListener('click', () => scrollToStep(currentStep + 1));

  let scrollTimer = null;
  track.addEventListener(
    'scroll',
    () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const trackLeft = track.scrollLeft;
        let closestIdx = 0;
        let minDiff = Infinity;
        cards.forEach((card, idx) => {
          const diff = Math.abs(card.offsetLeft - track.offsetLeft - trackLeft);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });
        updateUI(closestIdx);
      }, 60);
    },
    { passive: true }
  );

  updateUI(0);
}

function initScrollReveal() {
  const elements = Array.from(document.querySelectorAll('.reveal-on-scroll'));
  if (!elements.length) return;

  const parentGroups = new Map();
  elements.forEach((el) => {
    const parent = el.parentElement;
    const idx = parentGroups.get(parent) || 0;
    el.style.setProperty('--reveal-delay', `${Math.min(idx, 5) * 65}ms`);
    parentGroups.set(parent, idx + 1);
  });

  if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
  );

  elements.forEach((el) => revealObserver.observe(el));
}

function initLightbox() {
  const modal = document.getElementById('landing-lightbox');
  const backdrop = document.getElementById('lightbox-backdrop');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const imgEl = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');
  const counterEl = document.getElementById('lightbox-counter');
  if (!modal || !imgEl) return;

  let galleryItems = [];
  let currentIndex = 0;

  const collectGalleryImages = () =>
    Array.from(document.querySelectorAll('.media-slot img, [data-lightbox]')).filter(
      (img) => Boolean(img.getAttribute('src'))
    );

  const showAt = (index) => {
    if (!galleryItems.length) return;
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const targetImg = galleryItems[currentIndex];
    const figure = targetImg.closest('figure, article');
    const caption = figure?.querySelector('figcaption')?.textContent?.trim() || targetImg.alt || '';

    imgEl.src = targetImg.src;
    imgEl.alt = targetImg.alt || 'Registro Hebra';
    if (captionEl) captionEl.textContent = caption;
    if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
    const hasMultiple = galleryItems.length > 1;
    if (prevBtn) prevBtn.style.display = hasMultiple ? '' : 'none';
    if (nextBtn) nextBtn.style.display = hasMultiple ? '' : 'none';
  };

  const close = () => {
    modal.classList.add('hidden');
    imgEl.src = '';
  };

  document.addEventListener('click', (e) => {
    const targetImg = e.target.closest('.media-slot img, [data-lightbox]');
    if (!targetImg || !targetImg.getAttribute('src')) return;

    galleryItems = collectGalleryImages();
    const idx = galleryItems.indexOf(targetImg);
    showAt(idx >= 0 ? idx : 0);
    modal.classList.remove('hidden');
  });

  prevBtn?.addEventListener('click', () => showAt(currentIndex - 1));
  nextBtn?.addEventListener('click', () => showAt(currentIndex + 1));
  backdrop?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') showAt(currentIndex - 1);
    if (e.key === 'ArrowRight') showAt(currentIndex + 1);
  });
}

function initBackToTop() {
  const backToTopLinks = Array.from(document.querySelectorAll('a[href="#top"]'));
  if (!backToTopLinks.length) return;

  backToTopLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      window.scrollTo({ top: 0, left: 0, behavior });
      if (document.scrollingElement) {
        document.scrollingElement.scrollTo({ top: 0, left: 0, behavior });
      }
      if (window.location.hash === '#top' && window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });
  });
}

function setupLoopBgVideo(videoEl, sectionEl, reducedMotion) {
  if (!videoEl) return;

  const markReady = () => {
    videoEl.classList.add('is-ready');
    if (reducedMotion) {
      videoEl.pause();
    }
  };

  if (videoEl.readyState >= 2) {
    markReady();
  } else {
    videoEl.addEventListener('loadeddata', markReady, { once: true });
    videoEl.addEventListener('canplay', markReady, { once: true });
    videoEl.addEventListener('playing', markReady, { once: true });
  }

  if (!reducedMotion && sectionEl && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoEl.play().catch(() => {});
          } else {
            videoEl.pause();
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(sectionEl);
  }
}

function initBackgroundVideos() {
  const reducedMotion = prefersReducedMotion();
  setupLoopBgVideo(document.getElementById('hebra-bg-video'), document.getElementById('inicio'), reducedMotion);
  setupLoopBgVideo(
    document.getElementById('kenosis-bg-video'),
    document.getElementById('instalacion-final'),
    reducedMotion
  );
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initMobileMenu();
  initBackToTop();
  initScrollProgress();
  initActiveNavHighlight();
  initSubtleParallax();
  initTransmediaTimeline();
  initLightbox();
  try {
    initBackgroundVideos();
  } catch (err) {
    console.warn('Background video init error:', err);
  }
});
