(() => {
  const assets = new URL('./', document.currentScript.src);
  const music = new Audio(new URL('home-easy-lemon.mp3', assets).href);
  const click = new Audio(new URL('navigation-click.mp3', assets).href);
  music.loop = true;
  music.preload = 'metadata';
  click.preload = 'auto';
  document.body.append(music, click);
  ExhibitionSound.media(music, .22);
  ExhibitionSound.media(click, .45);
  ExhibitionSound.show();
  document.addEventListener('DOMContentLoaded', () => {
    const controls = document.querySelector('.sound-controls');
    const actions = document.querySelector('.header-actions');
    if (controls && actions) actions.prepend(controls);
  });
  let pending = false;
  let leaving = false;
  async function playMusic() {
    if (pending || leaving || document.hidden || !music.paused) return;
    pending = true;
    try {
      await music.play();
      if (leaving || document.hidden) music.pause();
    } catch {} finally { pending = false; }
  }
  document.addEventListener('click', event => {
    playMusic();
    if (!(event.target instanceof Element) || event.button > 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const control = event.target.closest('button, a[href], [role="button"]');
    if (!control || control.matches(':disabled, [aria-disabled="true"]') || control.closest('.sound-controls')) return;
    click.currentTime = 0;
    click.play().catch(() => {});
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') playMusic();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { music.pause(); click.pause(); }
    else playMusic();
  });
  addEventListener('pagehide', () => { leaving = true; music.pause(); click.pause(); });
  addEventListener('pageshow', () => { leaving = false; playMusic(); });
  playMusic();
})();
