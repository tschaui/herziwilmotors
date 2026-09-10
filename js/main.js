// Herziwil Motors - Main JS

const DEFAULT_LANG = 'de';

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const langToggle = document.getElementById('langToggle');

  const savedLang = localStorage.getItem('hm-lang');

  const applyLang = (lang) => {
    html.lang = lang;
    html.setAttribute('data-lang', lang);
    localStorage.setItem('hm-lang', lang);
  };

  const currentLang = savedLang === 'en' || savedLang === 'de' ? savedLang : DEFAULT_LANG;
  applyLang(currentLang);

  langToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-lang') === 'de' ? 'en' : 'de';
    applyLang(next);
  });

  // Mobile navigation toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navLinks');

  const closeMenu = () => {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Highlight active nav link on scroll
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('nav ul li a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  });

  // Scroll-reveal animations
  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      revealEls.forEach(el => revealObserver.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('is-visible'));
    }
  }

  // Lightbox
  const galleryImages = Array.from(document.querySelectorAll('.gallery-item img'));
  const lightbox = document.getElementById('lightbox');
  const lbImage = document.getElementById('lbImage');
  const lbCaption = document.getElementById('lbCaption');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');

  let lbIndex = 0;
  let lbReturnFocus = null;

  const updateLightbox = () => {
    const img = galleryImages[lbIndex];
    lbImage.src = img.currentSrc || img.src;
    lbImage.alt = img.alt;
    lbCaption.textContent = img.alt;
  };

  const openLightbox = (index) => {
    lbIndex = index;
    lbReturnFocus = document.activeElement;
    updateLightbox();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    lbClose.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    if (lbReturnFocus) lbReturnFocus.focus();
  };

  const showNav = (dir) => {
    const n = galleryImages.length;
    lbIndex = (lbIndex + dir + n) % n;
    updateLightbox();
  };

  if (lightbox) {
    galleryImages.forEach((img, i) => img.addEventListener('click', () => openLightbox(i)));

    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', () => showNav(-1));
    lbNext.addEventListener('click', () => showNav(1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showNav(-1);
      if (e.key === 'ArrowRight') showNav(1);
    });
  }
});