/**
 * Citra NET — Landing Page
 * GSAP animations (quiet editorial motion), smooth scroll, nav behavior, mobile menu.
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Utilities
  ------------------------------------------------------------------ */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Motion tokens — quiet, editorial */
  var EASE = 'expo.out'; /* cubic-bezier(0.16, 1, 0.3, 1) */
  var DURATION = 0.6;
  var TRAVEL_Y = 12;
  var TRAVEL_X = 12;
  var STAGGER = 0.08;

  /* ------------------------------------------------------------------
     Navigation — scroll behavior
  ------------------------------------------------------------------ */
  var nav = document.getElementById('nav');

  function handleNavScroll() {
    if (window.scrollY > 100) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* ------------------------------------------------------------------
     Mobile menu toggle
  ------------------------------------------------------------------ */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  var mobileLinks = mobileMenu.querySelectorAll('.mobile-menu__link');

  function toggleMenu() {
    var isOpen = mobileMenu.classList.contains('mobile-menu--open');

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu() {
    mobileMenu.classList.add('mobile-menu--open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburger.classList.add('nav__hamburger--active');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Tutup menu navigasi');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('mobile-menu--open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger.classList.remove('nav__hamburger--active');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Buka menu navigasi');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', toggleMenu);

  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('mobile-menu--open')) {
      closeMenu();
      hamburger.focus();
    }
  });

  /* ------------------------------------------------------------------
     Smooth scroll for anchor links
  ------------------------------------------------------------------ */
  var anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      var navHeight = nav.offsetHeight;
      var targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  });

  /* ------------------------------------------------------------------
     GSAP Animations — quiet scroll entries, transform + opacity only
  ------------------------------------------------------------------ */
  function initGSAPAnimations() {
    if (typeof gsap === 'undefined') return false;

    gsap.registerPlugin(ScrollTrigger);

    if (prefersReducedMotion) return true;

    /* Hero — staggered entrance (title → subtitle → CTAs) */
    var heroTl = gsap.timeline({ defaults: { ease: EASE, duration: DURATION } });

    heroTl
      .from('#heroTitle', {
        opacity: 0,
        y: TRAVEL_Y,
        delay: 0.15
      })
      .from('#heroSubtitle', {
        opacity: 0,
        y: TRAVEL_Y
      }, '-=0.4')
      .from('#heroCtas', {
        opacity: 0,
        y: TRAVEL_Y
      }, '-=0.35')
      .from('.hero__scroll-hint', {
        opacity: 0,
        duration: 0.5
      }, '-=0.2');

    /* Package cards — stagger reveal on scroll, 80ms cascade */
    gsap.from('[data-animate="card"]', {
      scrollTrigger: {
        trigger: '.packages__grid',
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: TRAVEL_Y,
      duration: DURATION,
      stagger: STAGGER,
      ease: EASE
    });

    /* Features — alternate left/right, subtle travel */
    gsap.utils.toArray('[data-animate="feature-left"]').forEach(function (el) {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        opacity: 0,
        x: -TRAVEL_X,
        duration: DURATION,
        ease: EASE
      });
    });

    gsap.utils.toArray('[data-animate="feature-right"]').forEach(function (el) {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        opacity: 0,
        x: TRAVEL_X,
        duration: DURATION,
        ease: EASE
      });
    });

    /* Features image — gentle fade + rise */
    gsap.from('[data-animate="feature-image"]', {
      scrollTrigger: {
        trigger: '[data-animate="feature-image"]',
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: TRAVEL_Y,
      duration: DURATION,
      ease: EASE
    });

    /* Coverage */
    gsap.from('.coverage__inner', {
      scrollTrigger: {
        trigger: '.coverage__inner',
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: TRAVEL_Y,
      duration: DURATION,
      ease: EASE
    });

    /* CTA — subtle scale-up reveal */
    gsap.from('[data-animate="cta"]', {
      scrollTrigger: {
        trigger: '[data-animate="cta"]',
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      scale: 0.98,
      duration: DURATION,
      ease: EASE
    });

    return true;
  }

  /* ------------------------------------------------------------------
     IntersectionObserver fallback (if GSAP fails to load)
  ------------------------------------------------------------------ */
  function initFallbackAnimations() {
    if (prefersReducedMotion) return;

    var animatedElements = document.querySelectorAll(
      '[data-animate="card"], [data-animate="feature-left"], [data-animate="feature-right"], [data-animate="feature-image"], [data-animate="cta"], .coverage__inner'
    );

    /* Set initial hidden state via inline styles */
    animatedElements.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     Init
  ------------------------------------------------------------------ */
  function init() {
    var gsapLoaded = initGSAPAnimations();

    if (!gsapLoaded) {
      initFallbackAnimations();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
