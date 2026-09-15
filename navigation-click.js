(() => {
  const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  if (!['index', 'Home', 'Info', 'joy', 'anger', 'sorrow', 'pleasure', 'result'].includes(page)) return;
  const clickSound = new Audio('navigation-click.mp3');
  clickSound.preload = 'auto';
  function playClick() {
    let settings = { volume: .7, muted: false };
    try { settings = JSON.parse(sessionStorage.getItem('exhibition-sound')) || settings; } catch {}
    if (settings.muted) return;
    clickSound.volume = Math.max(0, Math.min(1, Number(settings.volume) || 0)) * .45;
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }
  document.addEventListener('click', event => {
    if (event.button > 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (!(event.target instanceof Element)) return;
    if (page === 'anger' && event.target.closest('#targetButton, .sentence-block, .anger-file, #shredder')) return;
    if (event.target.closest('#shutter-button, #instant-shutter-button, #breath-wrap, .sound-controls, [data-click-sound="off"]')) return;
    const control = event.target.closest('a[href],button,[role="button"]');
    if (control?.matches(':disabled,[aria-disabled="true"]')) return;
    if (page === 'index') {
      if (document.body.classList.contains('leaving')) return;
      if (matchMedia('(pointer: coarse)').matches && !document.body.classList.contains('touch-ready')) return;
      playClick();
    } else if (control) playClick();
  }, true);
  document.addEventListener('keydown', event => {
    if (page !== 'index' || event.repeat || !['Enter', 'Space'].includes(event.code)) return;
    if (!document.body.classList.contains('leaving')) playClick();
  }, true);
  addEventListener('pagehide', () => clickSound.pause());
})();
