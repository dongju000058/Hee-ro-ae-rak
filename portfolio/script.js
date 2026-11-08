const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const topbar = document.querySelector('.topbar');
const homeHero = document.querySelector('.home-hero');

const headerObserver = new IntersectionObserver(([entry]) => {
  topbar.classList.toggle('is-over-home', entry.isIntersecting && entry.intersectionRatio > 0.72);
}, { threshold: [0.72] });
headerObserver.observe(homeHero);

const homePreview = document.querySelector('.home-preview');
if (homePreview) {
  homePreview.addEventListener('load', () => {
    const previewDocument = homePreview.contentDocument;
    if (!previewDocument) return;

    const previewStyle = previewDocument.createElement('style');
    previewStyle.textContent = `
      .topbar,
      .selection-copy,
      .home-message-link,
      .experience-preview,
      .site-copyright,
      .exhibition-sound-control,
      [aria-label="소리 설정"] { display: none !important; }
      .stage.has-active .portal:not(.is-active),
      .stage.has-active .title-word { opacity: 1 !important; filter: none !important; }
      .stage { min-height: 100svh !important; }
      .trace-composition { pointer-events: auto !important; }
    `;
    previewDocument.head.appendChild(previewStyle);

    previewDocument.addEventListener('click', (event) => {
      if (!event.target.closest('a')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    previewDocument.querySelectorAll('a').forEach((link) => {
      link.removeAttribute('href');
      link.setAttribute('role', 'img');
    });
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    entry.target.querySelectorAll('video').forEach((video) => video.play().catch(() => {}));
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

document.querySelectorAll('video').forEach((video) => {
  const mediaObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) video.play().catch(() => {});
    else video.pause();
  }, { threshold: 0.2 });
  mediaObserver.observe(video);
});

if (!reducedMotion && !document.querySelector('.home-preview')) {
  const hero = document.querySelector('.hero');
  const orbits = [...document.querySelectorAll('.hero-orbit')];
  hero.addEventListener('pointermove', (event) => {
    const x = event.clientX / innerWidth - 0.5;
    const y = event.clientY / innerHeight - 0.5;
    orbits.forEach((orbit, index) => {
      const force = 10 + index * 3;
      orbit.style.translate = `${x * force}px ${y * force}px`;
    });
  });
  hero.addEventListener('pointerleave', () => orbits.forEach((orbit) => { orbit.style.translate = ''; }));
}
