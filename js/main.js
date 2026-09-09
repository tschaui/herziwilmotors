// Herziwil Motors - Main JS

const DEFAULT_LANG = 'de';

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
});