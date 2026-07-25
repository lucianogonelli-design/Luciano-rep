/* ══════════════════════════════════════════════════════════
   Letramento em IA para PMEs — interaction layer
   Lenis · GSAP/ScrollTrigger · SplitType · Canvas particles
   Progressive enhancement: content is visible without JS.
   ══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const doc = document.documentElement;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';

  // Gate hidden initial states behind .js so a CDN failure never blanks the page.
  doc.classList.add('js');

  /* ─────────────── Smooth scroll (Lenis) ─────────────── */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined' && !prefersReduced) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // Anchor links → Lenis (or native fallback)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.3 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ─────────────── Scroll progress + nav state ─────────────── */
  const progress = document.querySelector('[data-progress]');
  const nav = document.querySelector('[data-nav]');
  const onScroll = () => {
    const st = window.scrollY || doc.scrollTop;
    const h = doc.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('is-scrolled', st > 40);
  };
  (lenis ? lenis.on('scroll', onScroll) : window.addEventListener('scroll', onScroll, { passive: true }));
  onScroll();

  /* ─────────────── Custom cursor ─────────────── */
  if (!isTouch) {
    const cursor = document.querySelector('[data-cursor]');
    const ring = document.querySelector('[data-cursor-ring]');
    const dot = document.querySelector('[data-cursor-dot]');
    if (cursor && ring && dot) {
      let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
      window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
      const tick = () => {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
        ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
        requestAnimationFrame(tick);
      };
      tick();

      const hoverSel = 'a,button,[data-magnetic],[data-tilt-card]';
      document.querySelectorAll(hoverSel).forEach((el) => {
        el.addEventListener('mouseenter', () => {
          cursor.classList.add('is-hover');
          const label = el.getAttribute('data-cursor-label');
          if (label) ring.setAttribute('data-label', label);
        });
        el.addEventListener('mouseleave', () => {
          cursor.classList.remove('is-hover');
          ring.removeAttribute('data-label');
        });
      });
      document.querySelectorAll('[data-cursor-hide]').forEach((el) => {
        el.addEventListener('mouseenter', () => cursor.classList.add('is-hide'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-hide'));
      });
    }
  }

  /* ─────────────── Magnetic buttons ─────────────── */
  if (!isTouch && !prefersReduced) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 0.35;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ─────────────── Card glow follow + tilt ─────────────── */
  if (!isTouch) {
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });

    if (!prefersReduced) {
      document.querySelectorAll('[data-tilt-card]').forEach((el) => {
        el.style.transformStyle = 'preserve-3d';
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateZ(0)`;
        });
        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
      });
    }
  }

  /* ─────────────── Hero 3D tilt (whole scene follows mouse) ─────────────── */
  if (!isTouch && !prefersReduced) {
    const scene = document.querySelector('[data-parallax-scene]');
    const tiltInner = document.querySelector('[data-tilt]');
    const hero = document.querySelector('[data-hero]');
    if (hero && (scene || tiltInner)) {
      hero.addEventListener('mousemove', (e) => {
        const px = e.clientX / innerWidth - 0.5;
        const py = e.clientY / innerHeight - 0.5;
        if (tiltInner) tiltInner.style.transform =
          `perspective(1200px) rotateY(${px * 4}deg) rotateX(${-py * 4}deg)`;
        scene?.querySelectorAll('[data-depth]').forEach((layer) => {
          const d = parseFloat(layer.getAttribute('data-depth')) * 80;
          layer.style.transform = `translate(${px * d}px,${py * d}px)`;
        });
      });
      hero.addEventListener('mouseleave', () => {
        if (tiltInner) tiltInner.style.transform = '';
      });
    }
  }

  /* ─────────────── Hero particles (lightweight canvas) ─────────────── */
  (() => {
    const canvas = document.querySelector('[data-particles]');
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, particles = [], raf;
    const COUNT = window.innerWidth < 700 ? 26 : 54;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = canvas.offsetWidth * dpr;
      h = canvas.height = canvas.offsetHeight * dpr;
    };
    const seed = () => {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 1.6 + 0.4) * dpr,
        vx: (Math.random() - 0.5) * 0.12 * dpr,
        vy: (Math.random() - 0.5) * 0.12 * dpr,
        a: Math.random() * 0.5 + 0.15,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,190,255,${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    const start = () => { resize(); seed(); cancelAnimationFrame(raf); draw(); };
    window.addEventListener('resize', () => { resize(); seed(); }, { passive: true });
    start();
  })();

  /* ─────────────── Marquee (JS drift, pauses off-screen naturally) ─────────────── */
  if (hasGSAP && !prefersReduced) {
    const track = document.querySelector('[data-marquee]');
    if (track) {
      const row = track.querySelector('.marquee__row');
      const dist = row.getBoundingClientRect().width;
      gsap.to(track, { x: -dist, duration: 24, ease: 'none', repeat: -1 });
    }
  }

  /* ═══════════════ GSAP SCROLL ANIMATIONS ═══════════════ */
  if (hasGSAP && !prefersReduced) {

    /* Split headlines → word-by-word mask reveal */
    document.querySelectorAll('[data-split-lines]').forEach((el) => {
      let split;
      if (typeof window.SplitType !== 'undefined') {
        split = new window.SplitType(el, { types: 'lines,words' });
        el.querySelectorAll('.line').forEach((l) => l.classList.add('split-line'));
      }
      const words = el.querySelectorAll('.word');
      const targets = words.length ? words : [el];
      gsap.set(el, { opacity: 1 });
      gsap.from(targets, {
        yPercent: words.length ? 110 : 0,
        opacity: words.length ? 1 : 0,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    /* Generic reveal (fade + rise + deblur) */
    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    /* Hero intro timeline (letters already handled; sequence the rest) */
    const heroReveals = document.querySelectorAll('[data-hero] [data-reveal]');
    gsap.set(heroReveals, { opacity: 0, y: 24 });
    gsap.to(heroReveals, {
      opacity: 1, y: 0, filter: 'blur(0px)',
      duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.35,
    });

    /* Hero parallax on scroll */
    gsap.to('.hero__parallax', {
      yPercent: 22, ease: 'none',
      scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__inner', {
      yPercent: -8, opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
    });

    /* Ambient glows drift with scroll (depth) */
    gsap.to('.ambient__glow--1', { yPercent: 30, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 1.2 } });
    gsap.to('.ambient__glow--2', { yPercent: -24, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 1.4 } });

    /* Gap bars fill */
    document.querySelectorAll('.gap__bar-fill').forEach((bar) => {
      const pct = bar.getAttribute('data-bar');
      gsap.fromTo(bar, { width: '0%' }, {
        width: pct + '%', duration: 1.6, ease: 'power3.out',
        scrollTrigger: { trigger: bar, start: 'top 90%' },
      });
    });

    /* Number counters */
    const runCounter = (el) => {
      const end = parseFloat(el.getAttribute('data-count'));
      const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 1.8, ease: 'power2.out',
        onUpdate: () => {
          const val = decimals ? obj.v.toFixed(decimals).replace('.', ',') : Math.round(obj.v);
          el.textContent = val + suffix;
        },
      });
    };
    document.querySelectorAll('[data-count]').forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => runCounter(el) });
    });

    /* Learn cards stagger */
    gsap.from('.learn__card', {
      y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.learn__grid', start: 'top 80%' },
    });

    /* Agenda spine draws */
    const spine = document.querySelector('[data-spine]');
    if (spine) {
      gsap.fromTo(spine, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.agenda__timeline', start: 'top 70%', end: 'bottom 80%', scrub: true },
      });
    }

    /* Horizontal pinned scroll — agent levels */
    const track = document.querySelector('[data-levels-track]');
    const levels = document.querySelector('[data-levels]');
    if (track && levels && window.innerWidth > 720) {
      const getScroll = () => track.scrollWidth - window.innerWidth + 80;
      gsap.to(track, {
        x: () => -getScroll(),
        ease: 'none',
        scrollTrigger: {
          trigger: levels,
          start: 'top top',
          end: () => '+=' + getScroll(),
          pin: '[data-levels-pin]',
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    }

    /* Offer card scale-in */
    gsap.from('.offer__card', {
      scale: 0.94, opacity: 0, y: 40, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.offer__card', start: 'top 85%' },
    });

    // Recalculate once fonts + images settle
    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  } else {
    // No GSAP or reduced motion → make sure everything is visible.
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      el.style.opacity = 1; el.style.transform = 'none'; el.style.filter = 'none';
    });
  }
})();
