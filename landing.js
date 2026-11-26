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
  const progressFill = document.getElementById('timeline-progress-fill');

  if (!track) return;
  const cards = Array.from(track.querySelectorAll('.transmedia-card'));
  const total = cards.length;
  if (!total) return;

  let animFrameId = null;

  const getMaxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);

  const getStepWidth = () => {
    const firstCard = cards[0];
    if (!firstCard) return 320;
    const gap = parseFloat(getComputedStyle(track).gap || '20') || 20;
    return firstCard.getBoundingClientRect().width + gap;
  };

  const updateUI = () => {
    const maxScroll = getMaxScroll();
    const currentLeft = track.scrollLeft;
    if (prevBtn) prevBtn.disabled = currentLeft <= 2;
    if (nextBtn) nextBtn.disabled = maxScroll <= 2 || currentLeft >= maxScroll - 2;
    if (progressFill) {
      const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, currentLeft / maxScroll)) : 1;
      const pct = 12.5 + ratio * 87.5;
      progressFill.style.width = `${pct}%`;
    }
  };

  const smoothScrollTo = (targetLeft, duration = 560) => {
    const clampedTarget = Math.max(0, Math.min(getMaxScroll(), targetLeft));
    if (prefersReducedMotion()) {
      track.scrollLeft = clampedTarget;
      updateUI();
      return;
    }

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    const startLeft = track.scrollLeft;
    const delta = clampedTarget - startLeft;
    if (Math.abs(delta) < 1) {
      track.scrollLeft = clampedTarget;
      updateUI();
      return;
    }

    track.style.scrollSnapType = 'none';
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      track.scrollLeft = startLeft + delta * eased;
      updateUI();

      if (t < 1) {
        animFrameId = requestAnimationFrame(step);
      } else {
        track.scrollLeft = clampedTarget;
        track.style.scrollSnapType = '';
        animFrameId = null;
        updateUI();
      }
    };

    animFrameId = requestAnimationFrame(step);
  };

  prevBtn?.addEventListener('click', () => {
    smoothScrollTo(track.scrollLeft - getStepWidth());
  });

  nextBtn?.addEventListener('click', () => {
    smoothScrollTo(track.scrollLeft + getStepWidth());
  });

  track.addEventListener(
    'scroll',
    () => {
      if (!animFrameId) updateUI();
    },
    { passive: true }
  );

  window.addEventListener('resize', updateUI, { passive: true });
  updateUI();
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

const AUDIO_MUTED_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
const AUDIO_UNMUTED_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';

function syncAudioToggleButton(btn, video) {
  if (!btn || !video) return;
  const isUnmuted = !video.muted;
  btn.classList.toggle('is-unmuted', isUnmuted);
  btn.setAttribute('aria-pressed', String(isUnmuted));
  btn.setAttribute('aria-label', isUnmuted ? 'Desactivar audio' : 'Activar audio');
  btn.innerHTML = `${isUnmuted ? AUDIO_UNMUTED_ICON : AUDIO_MUTED_ICON}<span>${isUnmuted ? 'Con audio' : 'Sin audio'}</span>`;
}

function initLightbox() {
  const modal = document.getElementById('landing-lightbox');
  const backdrop = document.getElementById('lightbox-backdrop');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const imgEl = document.getElementById('lightbox-img');
  const videoWrap = document.getElementById('lightbox-video-wrap');
  const videoEl = document.getElementById('lightbox-video');
  const videoAudioBtn = document.getElementById('lightbox-audio-toggle');
  const counterEl = document.getElementById('lightbox-counter');
  if (!modal || !imgEl) return;

  let galleryItems = [];
  let currentIndex = 0;

  const getMediaSrc = (el) => {
    if (!el) return '';
    if (el.tagName === 'VIDEO') {
      return el.currentSrc || el.getAttribute('src') || el.querySelector('source')?.getAttribute('src') || '';
    }
    return el.getAttribute('src') || '';
  };

  const collectGalleryMedia = () =>
    Array.from(document.querySelectorAll('.media-slot--filled img, .media-slot--filled video.loop-content-video')).filter(
      (el) => !el.closest('.glyphs-showcase-plate, .media-slot--app-cover') && Boolean(getMediaSrc(el))
    );

  const resetLightboxVideo = () => {
    if (!videoEl) return;
    videoEl.pause();
    videoEl.muted = true;
    videoEl.removeAttribute('src');
    videoEl.load();
    syncAudioToggleButton(videoAudioBtn, videoEl);
  };

  const warmMediaItem = (el) => {
    if (!el) return;
    if (el.tagName === 'VIDEO') {
      if (el.preload !== 'auto') {
        el.preload = 'auto';
        if (el.readyState < 2) el.load();
      }
      return;
    }
    const src = el.getAttribute('src');
    if (!src) return;
    const preImg = new Image();
    preImg.decoding = 'async';
    preImg.src = src;
    preImg.decode?.().catch(() => {});
  };

  const showAt = (index) => {
    if (!galleryItems.length) return;
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const targetEl = galleryItems[currentIndex];

    if (galleryItems.length > 1) {
      warmMediaItem(galleryItems[(currentIndex + 1) % galleryItems.length]);
      warmMediaItem(galleryItems[(currentIndex - 1 + galleryItems.length) % galleryItems.length]);
    }

    if (targetEl.tagName === 'VIDEO' && videoEl && videoWrap) {
      const wasMuted = targetEl.muted;
      const resumeTime = targetEl.currentTime || 0;
      document.querySelectorAll('video.loop-content-video').forEach((v) => {
        v.muted = true;
      });

      imgEl.classList.add('hidden');
      imgEl.src = '';
      videoWrap.classList.remove('hidden');

      videoEl.src = targetEl.currentSrc || targetEl.querySelector('source')?.src || getMediaSrc(targetEl);
      videoEl.loop = true;
      videoEl.muted = wasMuted;
      videoEl.playsInline = true;

      if (resumeTime > 0) {
        videoEl.addEventListener(
          'loadedmetadata',
          () => {
            try {
              videoEl.currentTime = resumeTime;
            } catch (_) {}
          },
          { once: true }
        );
      }

      syncAudioToggleButton(videoAudioBtn, videoEl);
      videoEl.play().catch(() => {});
    } else {
      resetLightboxVideo();
      if (videoWrap) videoWrap.classList.add('hidden');
      imgEl.classList.remove('hidden');
      imgEl.src = targetEl.src;
      imgEl.alt = targetEl.alt || 'Registro Hebra';
    }

    if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
    const hasMultiple = galleryItems.length > 1;
    if (prevBtn) prevBtn.style.display = hasMultiple ? '' : 'none';
    if (nextBtn) nextBtn.style.display = hasMultiple ? '' : 'none';
  };

  const close = () => {
    modal.classList.add('hidden');
    resetLightboxVideo();
    if (videoWrap) videoWrap.classList.add('hidden');
    imgEl.classList.remove('hidden');
    imgEl.src = '';
  };

  videoAudioBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
    if (!videoEl.muted && videoEl.paused) {
      videoEl.play().catch(() => {});
    }
    syncAudioToggleButton(videoAudioBtn, videoEl);
  });

  videoEl?.addEventListener('volumechange', () => syncAudioToggleButton(videoAudioBtn, videoEl));

  document.addEventListener('click', (e) => {
    if (e.target.closest('.video-audio-toggle, button, a')) return;
    const targetEl = e.target.closest('.media-slot--filled img, .media-slot--filled video.loop-content-video');
    if (!targetEl || targetEl.closest('.glyphs-showcase-plate, .media-slot--app-cover')) return;
    if (!getMediaSrc(targetEl)) return;

    galleryItems = collectGalleryMedia();
    const idx = galleryItems.indexOf(targetEl);
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

function initMediaSwitchers() {
  const galleries = Array.from(document.querySelectorAll('[data-media-gallery]'));
  if (!galleries.length) return;

  galleries.forEach((gallery) => {
    const slides = Array.from(gallery.querySelectorAll('.card-media-slide'));
    if (!slides.length) return;

    const prevBtn = gallery.querySelector('[data-media-prev]');
    const nextBtn = gallery.querySelector('[data-media-next]');
    const counterEl = gallery.querySelector('[data-media-counter]');
    const labelEl = gallery.querySelector('[data-media-label]');
    const tabs = Array.from(gallery.querySelectorAll('[data-media-tab]'));

    let activeIndex = Math.max(
      0,
      slides.findIndex((slide) => slide.classList.contains('is-active'))
    );

    const warmSlideVideo = (slide) => {
      slide?.querySelectorAll('video.loop-content-video').forEach((video) => {
        if (video.preload !== 'auto') {
          video.preload = 'auto';
          if (video.readyState < 2) video.load();
        }
      });
    };

    const showSlide = (idx) => {
      const nextIdx = ((idx % slides.length) + slides.length) % slides.length;
      const reducedMotion = prefersReducedMotion();
      slides.forEach((slide, slideIdx) => {
        const isCurrent = slideIdx === nextIdx;
        slide.classList.toggle('is-active', isCurrent);
        if (!isCurrent) {
          slide.querySelectorAll('video').forEach((video) => {
            video.pause();
            video.muted = true;
          });
        } else if (!reducedMotion) {
          slide.querySelectorAll('video.loop-content-video').forEach((video) => {
            if (video.preload !== 'auto') video.preload = 'auto';
            video.play().catch(() => {});
          });
        }
      });

      if (slides.length > 1) {
        warmSlideVideo(slides[(nextIdx + 1) % slides.length]);
      }

      tabs.forEach((tab) => {
        const tabIdx = parseInt(tab.getAttribute('data-media-tab') || '-1', 10);
        const isCurrent = tabIdx === nextIdx;
        tab.classList.toggle('is-active', isCurrent);
        tab.setAttribute('aria-pressed', String(isCurrent));
      });

      activeIndex = nextIdx;
      if (counterEl) counterEl.textContent = `${activeIndex + 1} / ${slides.length}`;
      if (labelEl) labelEl.textContent = slides[activeIndex].dataset.label || '';
    };

    prevBtn?.addEventListener('click', () => showSlide(activeIndex - 1));
    nextBtn?.addEventListener('click', () => showSlide(activeIndex + 1));
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabIdx = parseInt(tab.getAttribute('data-media-tab') || '0', 10);
        if (!Number.isNaN(tabIdx)) showSlide(tabIdx);
      });
    });

    showSlide(activeIndex);
  });
}

function initLoopContentVideos() {
  const videos = Array.from(document.querySelectorAll('video.loop-content-video'));
  if (!videos.length) return;

  const reducedMotion = prefersReducedMotion();

  videos.forEach((video) => {
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    const host = video.closest('.card-media-slide') || video.parentElement;
    if (!host) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'video-audio-toggle';

    const sync = () => syncAudioToggleButton(btn, video);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const willUnmute = video.muted;
      if (willUnmute) {
        videos.forEach((other) => {
          if (other !== video) other.muted = true;
        });
        video.muted = false;
        video.play().catch(() => {});
      } else {
        video.muted = true;
      }
      sync();
    });

    video.addEventListener('volumechange', sync);
    sync();
    host.appendChild(btn);
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const slide = video.closest('.card-media-slide');
          const slideActive = !slide || slide.classList.contains('is-active');

          if (entry.isIntersecting && slideActive) {
            if (!reducedMotion) video.play().catch(() => {});
          } else {
            video.pause();
            video.muted = true;
          }
        });
      },
      { threshold: 0.15 }
    );

    videos.forEach((video) => observer.observe(video));
  }
}

function initMediaPreloader() {
  const imageUrls = new Set();
  document
    .querySelectorAll('.media-slot--filled img, .team-avatar img, .glyphs-showcase-plate img')
    .forEach((img) => {
      const src = img.getAttribute('src');
      if (src) imageUrls.add(src);
    });

  imageUrls.forEach((src) => {
    const preImg = new Image();
    preImg.decoding = 'async';
    preImg.src = src;
    preImg.decode?.().catch(() => {});
  });

  const videos = Array.from(document.querySelectorAll('video.loop-content-video'));
  if (!videos.length) return;

  const ensureVideoPreload = (video) => {
    if (!video || video.preload === 'auto') return Promise.resolve();
    video.preload = 'auto';
    if (video.readyState >= 2) return Promise.resolve();

    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      video.addEventListener('canplay', done, { once: true });
      video.addEventListener('error', done, { once: true });
      setTimeout(done, 2500);
      video.load();
    });
  };

  if ('IntersectionObserver' in window) {
    const proximityObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            ensureVideoPreload(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '1100px 0px 1100px 0px' }
    );
    videos.forEach((video) => proximityObserver.observe(video));
  }

  const startSequentialWarmup = async () => {
    for (const video of videos) {
      await ensureVideoPreload(video);
    }
  };

  if (document.readyState === 'complete') {
    setTimeout(startSequentialWarmup, 400);
  } else {
    window.addEventListener('load', () => setTimeout(startSequentialWarmup, 400), { once: true });
  }
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
  initMediaSwitchers();
  initLoopContentVideos();
  initLightbox();
  initMediaPreloader();
  try {
    initBackgroundVideos();
  } catch (err) {
    console.warn('Background video init error:', err);
  }
});
