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

function createBandSpores(observeEl, canvasEl, options = {}) {
  if (!observeEl || !canvasEl) return null;
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return null;

  const sizeEl = options.sizeEl || observeEl;
  const autoStartOnIntersect = Boolean(options.autoStartOnIntersect);

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = null;
  let isRunning = false;
  let isInView = !autoStartOnIntersect;
  let hasStarted = false;
  let startTime = 0;
  let lastTime = 0;

  const palette = [
    [141, 224, 238], // cyan bioluminiscente
    [216, 206, 245], // lavanda suave
    [250, 249, 247], // perla
    [154, 178, 255]  // azul claro
  ];

  const rand = (min, max) => min + Math.random() * (max - min);

  const createParticle = (initialSpawn) => {
    const isSparkle = Math.random() >= 0.7;
    const color = palette[Math.floor(Math.random() * palette.length)];
    return {
      isSparkle,
      color,
      x: rand(0, width || 1),
      y: initialSpawn ? rand(height * 0.05, height * 1.05) : height + rand(10, 60),
      radius: isSparkle ? rand(1.6, 3.4) : rand(2.5, 8.5),
      vy: isSparkle ? rand(-9, -20) : rand(-6, -15),
      vxBase: rand(-3, 3),
      swayAmp: rand(4, 13),
      swayFreq: rand(0.25, 0.75),
      phase: rand(0, Math.PI * 2),
      pulseFreq: rand(0.55, 1.35),
      pulsePhase: rand(0, Math.PI * 2),
      maxAlpha: isSparkle ? rand(0.55, 0.92) : rand(0.32, 0.72),
      birthDelay: initialSpawn ? rand(0.1, 1.45) : 0,
      fadeInDuration: initialSpawn ? rand(0.85, 1.5) : 1.0,
      bornAt: null
    };
  };

  let particles = [];

  const resize = () => {
    const rect = sizeEl.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasEl.width = Math.round(width * dpr);
    canvasEl.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targetCount = window.innerWidth <= 640 ? 16 : 28;
    if (!particles.length) {
      particles = Array.from({ length: targetCount }, () => createParticle(true));
    } else if (particles.length !== targetCount) {
      if (particles.length < targetCount) {
        while (particles.length < targetCount) particles.push(createParticle(true));
      } else {
        particles.length = targetCount;
      }
      particles.forEach((p) => {
        if (p.x > width) p.x = rand(0, width);
        if (p.y > height + 40) p.y = rand(0, height);
      });
    }
  };

  const drawSpore = (p, alpha) => {
    const outerR = p.radius * 2.4;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, outerR);
    const [r, g, b] = p.color;
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${Math.min(1, alpha * 1.15).toFixed(3)})`);
    grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${(alpha * 0.55).toFixed(3)})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, outerR, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawSparkle = (p, alpha, pulse) => {
    const [r, g, b] = p.color;
    const arm = p.radius * (2.6 + pulse * 1.4);
    const coreR = p.radius * 1.7;

    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, coreR);
    grad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, alpha).toFixed(3)})`);
    grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${(alpha * 0.65).toFixed(3)})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, coreR, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 0.85).toFixed(3)})`;
    ctx.lineWidth = 0.95;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-arm, 0);
    ctx.lineTo(arm, 0);
    ctx.moveTo(0, -arm);
    ctx.lineTo(0, arm);
    ctx.stroke();
    ctx.restore();
  };

  const tick = (now) => {
    if (!isRunning) return;
    if (!lastTime) lastTime = now;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    const elapsed = (now - startTime) / 1000;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      if (p.bornAt === null) {
        if (elapsed < p.birthDelay) continue;
        p.bornAt = elapsed;
      }

      const age = elapsed - p.bornAt;
      const birthProgress = Math.min(1, age / p.fadeInDuration);
      const easeBirth = 1 - Math.pow(1 - birthProgress, 2);

      p.y += p.vy * dt;
      p.x += (p.vxBase + Math.sin(elapsed * p.swayFreq + p.phase) * p.swayAmp) * dt;

      if (p.y < -30) {
        const recycled = createParticle(false);
        recycled.bornAt = elapsed;
        particles[i] = recycled;
        continue;
      }
      if (p.x < -30) p.x = width + 20;
      if (p.x > width + 30) p.x = -20;

      const pulse = 0.5 + 0.5 * Math.sin(elapsed * p.pulseFreq + p.pulsePhase);
      const alpha = p.maxAlpha * easeBirth * (0.45 + 0.55 * pulse);
      if (alpha <= 0.01) continue;

      if (p.isSparkle) {
        drawSparkle(p, alpha, pulse);
      } else {
        drawSpore(p, alpha);
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    hasStarted = true;
    if (isRunning || !isInView) return;
    resize();
    isRunning = true;
    if (!startTime) startTime = performance.now();
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  };

  const pause = () => {
    isRunning = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  window.addEventListener('resize', resize, { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isInView = entry.isIntersecting;
          if (autoStartOnIntersect) {
            if (isInView) {
              start();
            } else {
              pause();
            }
            return;
          }
          if (!hasStarted) return;
          if (isInView) {
            start();
          } else {
            pause();
          }
        });
      },
      {
        rootMargin: autoStartOnIntersect ? '200px 0px 200px 0px' : '0px',
        threshold: 0.02
      }
    );
    observer.observe(observeEl);
  } else if (autoStartOnIntersect) {
    start();
  }

  return { start, pause };
}

function initHeroIntro() {
  const heroSection = document.getElementById('inicio');
  const sporesCanvas = document.getElementById('hero-spores-canvas');
  const hebraVideo = document.getElementById('hebra-bg-video');
  if (!heroSection) return;

  if (prefersReducedMotion() || !document.documentElement.classList.contains('hero-intro-init')) {
    return;
  }

  const spores = createBandSpores(heroSection, sporesCanvas);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroSection.classList.add('hero-phase-rise');
      spores?.start();
    });
  });

  setTimeout(() => {
    heroSection.classList.add('hero-phase-video');
    if (hebraVideo && hebraVideo.paused) {
      hebraVideo.play().catch(() => {});
    }
  }, 2050);

  setTimeout(() => {
    heroSection.classList.add('hero-phase-copy');
  }, 3350);

  setTimeout(() => {
    heroSection.classList.add('hero-intro-done');
  }, 5600);
}

function initKenosisSpores() {
  if (prefersReducedMotion()) return;
  const kenosisSection = document.getElementById('instalacion-final');
  const kenosisViewport = kenosisSection?.querySelector('.climax-bg-sticky-viewport');
  const kenosisCanvas = document.getElementById('kenosis-spores-canvas');
  if (!kenosisSection || !kenosisViewport || !kenosisCanvas) return;

  createBandSpores(kenosisSection, kenosisCanvas, {
    sizeEl: kenosisViewport,
    autoStartOnIntersect: true
  });
}

function initInteractiveWaveDividers() {
  if (prefersReducedMotion()) return;

  const wrappers = Array.from(document.querySelectorAll('.blob-mask, .blob-edge'));
  if (!wrappers.length) return;

  const NODE_COUNT = 28; // 29 nodos (0..28) de x = 0 a 1440
  const VIEWBOX_W = 1440;
  const VIEWBOX_H = 90;

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const evalCubic = (p0, p1, p2, p3, t) => {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  };

  const parseWavePath = (d) => {
    if (!d) return null;
    const baseMatch = d.match(/M\s*0\s*,\s*([0-9.-]+)\s+L\s*1440\s*,\s*[0-9.-]+\s+L\s*1440\s*,\s*([0-9.-]+)/i);
    if (!baseMatch) return null;

    const baseY = parseFloat(baseMatch[1]);
    let curX = 1440;
    let curY = parseFloat(baseMatch[2]);

    const segments = [];
    const cubicRegex = /C\s*([0-9.-]+)\s*,\s*([0-9.-]+)\s+([0-9.-]+)\s*,\s*([0-9.-]+)\s+([0-9.-]+)\s*,\s*([0-9.-]+)/gi;
    let match;
    while ((match = cubicRegex.exec(d)) !== null) {
      const seg = {
        x0: curX,
        y0: curY,
        x1: parseFloat(match[1]),
        y1: parseFloat(match[2]),
        x2: parseFloat(match[3]),
        y2: parseFloat(match[4]),
        x3: parseFloat(match[5]),
        y3: parseFloat(match[6])
      };
      segments.push(seg);
      curX = seg.x3;
      curY = seg.y3;
    }

    if (!segments.length) return null;

    const sampleYAtX = (targetX) => {
      const seg =
        segments.find((s) => targetX <= s.x0 + 0.01 && targetX >= s.x3 - 0.01) ||
        (targetX >= segments[0].x0 ? segments[0] : segments[segments.length - 1]);

      // Los segmentos van de x=1440 (t=0) hacia x=0 (t=1)
      let lo = 0;
      let hi = 1;
      for (let iter = 0; iter < 16; iter += 1) {
        const mid = (lo + hi) * 0.5;
        const xMid = evalCubic(seg.x0, seg.x1, seg.x2, seg.x3, mid);
        if (xMid > targetX) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      const t = (lo + hi) * 0.5;
      return evalCubic(seg.y0, seg.y1, seg.y2, seg.y3, t);
    };

    const nodes = [];
    for (let i = 0; i <= NODE_COUNT; i += 1) {
      const x = (i / NODE_COUNT) * VIEWBOX_W;
      nodes.push({
        x,
        restY: sampleYAtX(x),
        offset: 0,
        vel: 0
      });
    }

    return { baseY, nodes };
  };

  const buildWavePath = (wave) => {
    const { baseY, nodes } = wave;
    const pts = nodes.map((n) => ({
      x: n.x,
      y: clamp(n.restY + n.offset, 3, VIEWBOX_H - 3)
    }));

    let d = `M0,${baseY} L${pts[0].x.toFixed(1)},${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length - 1; i += 1) {
      const midX = (pts[i].x + pts[i + 1].x) * 0.5;
      const midY = (pts[i].y + pts[i + 1].y) * 0.5;
      d += ` Q${pts[i].x.toFixed(1)},${pts[i].y.toFixed(2)} ${midX.toFixed(1)},${midY.toFixed(2)}`;
    }
    const last = pts[pts.length - 1];
    d += ` Q${pts[pts.length - 2].x.toFixed(1)},${pts[pts.length - 2].y.toFixed(2)} ${last.x.toFixed(1)},${last.y.toFixed(2)}`;
    d += ` L${VIEWBOX_W},${baseY} Z`;
    return d;
  };

  const waves = wrappers
    .map((wrapper) => {
      const pathEl = wrapper.querySelector('svg path');
      if (!pathEl) return null;
      const originalD = pathEl.getAttribute('d');
      const parsed = parseWavePath(originalD);
      if (!parsed) return null;
      return {
        wrapper,
        pathEl,
        originalD,
        baseY: parsed.baseY,
        nodes: parsed.nodes,
        isActive: false
      };
    })
    .filter(Boolean);

  if (!waves.length) return;

  let rafId = null;
  let lastTime = 0;
  let prevClientX = null;
  let prevClientY = null;

  const ensureLoop = () => {
    if (rafId !== null) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(step);
  };

  const step = (now) => {
    const dt = Math.min(0.033, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    const stiffness = 115;
    const coupling = 240;
    const damping = 4.5;
    const dampFactor = Math.exp(-damping * dt);

    let anyActive = false;

    for (let w = 0; w < waves.length; w += 1) {
      const wave = waves[w];
      if (!wave.isActive) continue;

      const nodes = wave.nodes;
      const nLen = nodes.length;
      const forces = new Array(nLen);

      for (let i = 0; i < nLen; i += 1) {
        const cur = nodes[i].offset;
        const left = i > 0 ? nodes[i - 1].offset : cur;
        const right = i < nLen - 1 ? nodes[i + 1].offset : cur;
        const neighborAvg = (left + right) * 0.5;
        forces[i] = -stiffness * cur + coupling * (neighborAvg - cur);
      }

      let maxEnergy = 0;
      for (let i = 0; i < nLen; i += 1) {
        const node = nodes[i];
        node.vel = (node.vel + forces[i] * dt) * dampFactor;
        node.offset = clamp(node.offset + node.vel * dt, -28, 28);
        const energy = Math.abs(node.offset) + Math.abs(node.vel) * 0.08;
        if (energy > maxEnergy) maxEnergy = energy;
      }

      if (maxEnergy < 0.04) {
        for (let i = 0; i < nLen; i += 1) {
          nodes[i].offset = 0;
          nodes[i].vel = 0;
        }
        wave.pathEl.setAttribute('d', wave.originalD);
        wave.isActive = false;
      } else {
        wave.pathEl.setAttribute('d', buildWavePath(wave));
        anyActive = true;
      }
    }

    if (anyActive) {
      rafId = requestAnimationFrame(step);
    } else {
      rafId = null;
    }
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;

      const dx = prevClientX === null ? 0 : clamp(e.clientX - prevClientX, -42, 42);
      const dy = prevClientY === null ? 0 : clamp(e.clientY - prevClientY, -42, 42);
      prevClientX = e.clientX;
      prevClientY = e.clientY;

      const hitPadY = 52;
      const hitPadX = 24;
      const sigmaSq = 145 * 145;

      for (let w = 0; w < waves.length; w += 1) {
        const wave = waves[w];
        const rect = wave.wrapper.getBoundingClientRect();
        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          e.clientY < rect.top - hitPadY ||
          e.clientY > rect.bottom + hitPadY ||
          e.clientX < rect.left - hitPadX ||
          e.clientX > rect.right + hitPadX
        ) {
          continue;
        }

        const mx = ((e.clientX - rect.left) / rect.width) * VIEWBOX_W;
        const my = ((e.clientY - rect.top) / rect.height) * VIEWBOX_H;

        const nodes = wave.nodes;
        const nLen = nodes.length;
        let touched = false;

        for (let i = 0; i < nLen; i += 1) {
          const node = nodes[i];
          const distX = node.x - mx;
          const weight = Math.exp(-(distX * distX) / (2 * sigmaSq));
          if (weight < 0.02) continue;

          const edgeScale = i === 0 || i === nLen - 1 ? 0.35 : 1;
          const targetDelta = clamp(my - node.restY, -24, 24);
          const attractImpulse = (targetDelta - node.offset) * 1.35;
          const crossImpulse = dy * 2.1 + Math.sin(distX * 0.025) * dx * 0.45;

          node.vel = clamp(node.vel + (attractImpulse + crossImpulse) * weight * edgeScale, -220, 220);
          touched = true;
        }

        if (touched) {
          wave.isActive = true;
          ensureLoop();
        }
      }
    },
    { passive: true }
  );
}

function initInteractiveCardBlobs() {
  if (prefersReducedMotion()) return;

  const defsEl = document.querySelector('.svg-clip-defs defs');
  const cards = Array.from(
    document.querySelectorAll('.media-card, .editorial-card, .transmedia-card, .platform-card, .team-card')
  );
  if (!defsEl || !cards.length) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const evalCubic = (p0, p1, p2, p3, t) => {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  };

  const parseClosedBlobTemplate = (pathSelector) => {
    const pathEl = document.querySelector(pathSelector);
    const d = pathEl?.getAttribute('d');
    if (!d) return null;

    const startMatch = d.match(/M\s*([0-9.-]+)\s*,\s*([0-9.-]+)/i);
    if (!startMatch) return null;

    let curX = parseFloat(startMatch[1]);
    let curY = parseFloat(startMatch[2]);

    const segments = [];
    const cubicRegex = /C\s*([0-9.-]+)\s*,\s*([0-9.-]+)\s+([0-9.-]+)\s*,\s*([0-9.-]+)\s+([0-9.-]+)\s*,\s*([0-9.-]+)/gi;
    let match;
    while ((match = cubicRegex.exec(d)) !== null) {
      const seg = {
        x0: curX,
        y0: curY,
        x1: parseFloat(match[1]),
        y1: parseFloat(match[2]),
        x2: parseFloat(match[3]),
        y2: parseFloat(match[4]),
        x3: parseFloat(match[5]),
        y3: parseFloat(match[6])
      };
      segments.push(seg);
      curX = seg.x3;
      curY = seg.y3;
    }

    if (segments.length !== 12) return null;

    const cornerIndices = new Set([2, 5, 8, 11]);
    const rawNodes = [];

    segments.forEach((seg, segIdx) => {
      const isCorner = cornerIndices.has(segIdx);
      const tList = isCorner ? [0.5] : [0.125, 0.375, 0.625, 0.875];
      tList.forEach((t) => {
        rawNodes.push({
          bx: evalCubic(seg.x0, seg.x1, seg.x2, seg.x3, t),
          by: evalCubic(seg.y0, seg.y1, seg.y2, seg.y3, t),
          cornerFactor: isCorner ? 0.55 : 1
        });
      });
    });

    const nLen = rawNodes.length;
    return rawNodes.map((node, i) => {
      const prev = rawNodes[(i - 1 + nLen) % nLen];
      const next = rawNodes[(i + 1) % nLen];
      const tx = next.bx - prev.bx;
      const ty = next.by - prev.by;
      const len = Math.hypot(tx, ty) || 1;
      let nx = ty / len;
      let ny = -tx / len;

      // Garantiza normal saliente respecto al centro del rectángulo (0.5, 0.5)
      if (nx * (node.bx - 0.5) + ny * (node.by - 0.5) < 0) {
        nx = -nx;
        ny = -ny;
      }

      return {
        bx: node.bx,
        by: node.by,
        nx,
        ny,
        cornerFactor: node.cornerFactor
      };
    });
  };

  const templates = {
    a: parseClosedBlobTemplate('#blob-card-a path'),
    b: parseClosedBlobTemplate('#blob-card-b path'),
    c: parseClosedBlobTemplate('#blob-card-c path')
  };

  if (!templates.a) return;

  const slotPool = [];
  let nextSlotId = 0;

  const acquireSlot = () => {
    const free = slotPool.find((slot) => !slot.inUse);
    if (free) {
      free.inUse = true;
      return free;
    }

    const id = `blob-card-live-${nextSlotId++}`;
    const clipEl = document.createElementNS(SVG_NS, 'clipPath');
    clipEl.setAttribute('id', id);
    clipEl.setAttribute('clipPathUnits', 'objectBoundingBox');

    const pathEl = document.createElementNS(SVG_NS, 'path');
    clipEl.appendChild(pathEl);
    defsEl.appendChild(clipEl);

    const slot = { id, clipEl, pathEl, inUse: true };
    slotPool.push(slot);
    return slot;
  };

  const releaseSlot = (slot) => {
    if (!slot) return;
    slot.inUse = false;
  };

  const detectTemplateKey = (card) => {
    const rawClip = getComputedStyle(card, '::before').clipPath || '';
    if (rawClip.includes('blob-card-b') && templates.b) return 'b';
    if (rawClip.includes('blob-card-c') && templates.c) return 'c';
    return 'a';
  };

  const buildClosedBlobPath = (state) => {
    const width = Math.max(1, state.width);
    const height = Math.max(1, state.height);
    const nodes = state.nodes;
    const nLen = nodes.length;

    const pts = new Array(nLen);
    for (let i = 0; i < nLen; i += 1) {
      const node = nodes[i];
      const dx = (node.nx * node.offset) / width;
      const dy = (node.ny * node.offset) / height;
      pts[i] = {
        x: clamp(node.bx + dx, 0.001, 0.999),
        y: clamp(node.by + dy, 0.001, 0.999)
      };
    }

    const startMidX = (pts[nLen - 1].x + pts[0].x) * 0.5;
    const startMidY = (pts[nLen - 1].y + pts[0].y) * 0.5;
    let d = `M ${startMidX.toFixed(4)},${startMidY.toFixed(4)}`;

    for (let i = 0; i < nLen; i += 1) {
      const cur = pts[i];
      const next = pts[(i + 1) % nLen];
      const midX = (cur.x + next.x) * 0.5;
      const midY = (cur.y + next.y) * 0.5;
      d += ` Q ${cur.x.toFixed(4)},${cur.y.toFixed(4)} ${midX.toFixed(4)},${midY.toFixed(4)}`;
    }

    d += ' Z';
    return d;
  };

  const activeStates = new Set();
  let rafId = null;
  let lastTime = 0;

  const ensureLoop = () => {
    if (rafId !== null) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(step);
  };

  const deactivateState = (state) => {
    for (let i = 0; i < state.nodes.length; i += 1) {
      state.nodes[i].offset = 0;
      state.nodes[i].vel = 0;
    }
    state.card.classList.remove('has-live-blob');
    state.card.style.removeProperty('--card-live-clip');
    releaseSlot(state.slot);
    state.slot = null;
    state.isActive = false;
    activeStates.delete(state);
  };

  const activateState = (state) => {
    if (!state.nodes) {
      const key = detectTemplateKey(state.card);
      const tpl = templates[key] || templates.a;
      state.nodes = tpl.map((n) => ({
        bx: n.bx,
        by: n.by,
        nx: n.nx,
        ny: n.ny,
        cornerFactor: n.cornerFactor,
        offset: 0,
        vel: 0
      }));
    }

    const rect = state.card.getBoundingClientRect();
    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);

    if (!state.slot) {
      state.slot = acquireSlot();
      state.slot.pathEl.setAttribute('d', buildClosedBlobPath(state));
      state.card.style.setProperty('--card-live-clip', `url(#${state.slot.id})`);
      state.card.classList.add('has-live-blob');
    }

    state.isActive = true;
    activeStates.add(state);
    ensureLoop();
  };

  const step = (now) => {
    const dt = Math.min(0.033, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    const stiffness = 145;
    const coupling = 260;
    const damping = 5.2;
    const dampFactor = Math.exp(-damping * dt);

    const toDeactivate = [];

    activeStates.forEach((state) => {
      const nodes = state.nodes;
      const nLen = nodes.length;
      const forces = new Array(nLen);

      for (let i = 0; i < nLen; i += 1) {
        const cur = nodes[i].offset;
        const left = nodes[(i - 1 + nLen) % nLen].offset;
        const right = nodes[(i + 1) % nLen].offset;
        const neighborAvg = (left + right) * 0.5;
        forces[i] = -stiffness * cur + coupling * (neighborAvg - cur);
      }

      let maxEnergy = 0;
      for (let i = 0; i < nLen; i += 1) {
        const node = nodes[i];
        node.vel = (node.vel + forces[i] * dt) * dampFactor;
        node.offset = clamp(node.offset + node.vel * dt, -8, 6);
        const energy = Math.abs(node.offset) + Math.abs(node.vel) * 0.08;
        if (energy > maxEnergy) maxEnergy = energy;
      }

      if (maxEnergy < 0.03 && !state.isHovered) {
        toDeactivate.push(state);
      } else if (maxEnergy < 0.03 && state.isHovered) {
        // Mantiene el slot limpio si el mouse está quieto dentro de la card
        for (let i = 0; i < nLen; i += 1) {
          nodes[i].offset = 0;
          nodes[i].vel = 0;
        }
        toDeactivate.push(state);
      } else if (state.slot) {
        state.slot.pathEl.setAttribute('d', buildClosedBlobPath(state));
      }
    });

    for (let i = 0; i < toDeactivate.length; i += 1) {
      deactivateState(toDeactivate[i]);
    }

    if (activeStates.size > 0) {
      rafId = requestAnimationFrame(step);
    } else {
      rafId = null;
    }
  };

  const applyImpulse = (state, clientX, clientY, dx, dy, radialPulse) => {
    const rect = state.card.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    state.width = rect.width;
    state.height = rect.height;

    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const sigmaPx = clamp(Math.min(rect.width, rect.height) * 0.34, 65, 130);
    const twoSigmaSq = 2 * sigmaPx * sigmaPx;

    const nodes = state.nodes;
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const px = node.bx * rect.width;
      const py = node.by * rect.height;
      const distX = px - localX;
      const distY = py - localY;
      const distSq = distX * distX + distY * distY;
      const weight = Math.exp(-distSq / twoSigmaSq);
      if (weight < 0.02) continue;

      const normalMove = (dx * node.nx + dy * node.ny) * 0.55;
      const impulse = (normalMove + radialPulse) * weight * node.cornerFactor;
      node.vel = clamp(node.vel + impulse, -95, 95);
    }
  };

  cards.forEach((card) => {
    const state = {
      card,
      nodes: null,
      slot: null,
      width: 1,
      height: 1,
      isHovered: false,
      isActive: false,
      prevX: null,
      prevY: null
    };

    card.addEventListener(
      'pointerenter',
      (e) => {
        if (e.pointerType === 'touch') return;
        state.isHovered = true;
        state.prevX = e.clientX;
        state.prevY = e.clientY;
        activateState(state);
        applyImpulse(state, e.clientX, e.clientY, 0, 0, -52);
      },
      { passive: true }
    );

    card.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType === 'touch') return;
        const dx = state.prevX === null ? 0 : clamp(e.clientX - state.prevX, -32, 32);
        const dy = state.prevY === null ? 0 : clamp(e.clientY - state.prevY, -32, 32);
        state.prevX = e.clientX;
        state.prevY = e.clientY;
        if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) return;

        state.isHovered = true;
        if (!state.isActive) activateState(state);
        applyImpulse(state, e.clientX, e.clientY, dx, dy, 0);
      },
      { passive: true }
    );

    card.addEventListener(
      'pointerleave',
      (e) => {
        if (e.pointerType === 'touch') return;
        state.isHovered = false;
        const dx = state.prevX === null ? 0 : clamp(e.clientX - state.prevX, -32, 32);
        const dy = state.prevY === null ? 0 : clamp(e.clientY - state.prevY, -32, 32);
        state.prevX = null;
        state.prevY = null;
        if (!state.isActive) activateState(state);
        applyImpulse(state, e.clientX, e.clientY, dx, dy, 28);
      },
      { passive: true }
    );
  });
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
  try {
    initHeroIntro();
  } catch (err) {
    console.warn('Hero intro init error:', err);
  }
  try {
    initKenosisSpores();
  } catch (err) {
    console.warn('Kenosis spores init error:', err);
  }
  try {
    initInteractiveWaveDividers();
  } catch (err) {
    console.warn('Wave dividers init error:', err);
  }
  try {
    initInteractiveCardBlobs();
  } catch (err) {
    console.warn('Card blobs init error:', err);
  }
});
