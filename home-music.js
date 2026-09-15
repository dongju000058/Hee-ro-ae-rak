(() => {
  const music = document.createElement('audio');
  music.src = 'home-easy-lemon.mp3';
  music.preload = 'auto';
  music.loop = true;
  document.body.append(music);
  ExhibitionSound.media(music, .22);
  music.autoplay = true;
  ExhibitionSound.show();

  let leaving = false;
  let pending = false;
  document.addEventListener('click', event => {
    const target = event.target.closest('.portal, .experience-enter');
    if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (target.matches('.portal') && matchMedia('(pointer: coarse)').matches) return;
    leaving = true;
    music.pause();
  }, true);
  async function play() {
    if (leaving || document.hidden || pending || !music.paused) return;
    pending = true;
    try {
      await music.play();
      if (leaving || document.hidden) music.pause();
    } catch {
      // Browsers may require a click before allowing audible playback.
    } finally {
      pending = false;
    }
  }
  document.addEventListener('click', play);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') play();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) music.pause();
    else play();
  });
  new MutationObserver(() => {
    if (document.body.classList.contains('leaving')) {
      leaving = true;
      music.pause();
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  addEventListener('pagehide', () => { leaving = true; music.pause(); });
  addEventListener('pageshow', () => { leaving = false; play(); });
  play();
})();
