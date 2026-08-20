/**
 * Citra NET — Landing Page
 * GSAP animations, smooth scroll, nav behavior, mobile menu.
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Utilities
  ------------------------------------------------------------------ */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
     GSAP Animations
  ------------------------------------------------------------------ */
  function initGSAPAnimations() {
    if (typeof gsap === 'undefined') return false;

    gsap.registerPlugin(ScrollTrigger);

    if (prefersReducedMotion) return true;

    /* Hero — staggered entrance */
    var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl
      .from('#heroTitle', {
        opacity: 0,
        y: 40,
        duration: 1,
        delay: 0.2
      })
      .from('#heroSubtitle', {
        opacity: 0,
        y: 30,
        duration: 0.8
      }, '-=0.5')
      .from('#heroCtas', {
        opacity: 0,
        y: 24,
        duration: 0.8
      }, '-=0.4')
      .from('.hero__scroll-hint', {
        opacity: 0,
        duration: 0.6
      }, '-=0.2');

    /* Package cards — stagger on scroll */
    gsap.from('[data-animate="card"]', {
      scrollTrigger: {
        trigger: '.packages__grid',
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 50,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    });

    /* Features — alternate left/right */
    gsap.utils.toArray('[data-animate="feature-left"]').forEach(function (el) {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        opacity: 0,
        x: -40,
        duration: 0.8,
        ease: 'power3.out'
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
        x: 40,
        duration: 0.8,
        ease: 'power3.out'
      });
    });

    /* Features image */
    gsap.from('[data-animate="feature-image"]', {
      scrollTrigger: {
        trigger: '[data-animate="feature-image"]',
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      scale: 0.95,
      duration: 1,
      ease: 'power3.out'
    });

    /* Coverage stats */
    gsap.from('.coverage__inner', {
      scrollTrigger: {
        trigger: '.coverage__inner',
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 40,
      duration: 0.9,
      ease: 'power3.out'
    });

    /* CTA — scale up */
    gsap.from('[data-animate="cta"]', {
      scrollTrigger: {
        trigger: '[data-animate="cta"]',
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      scale: 0.92,
      duration: 0.9,
      ease: 'power3.out'
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
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
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
