(() => {
  const music = document.createElement('audio');
  music.src = 'home-easy-lemon.mp3';
  music.preload = 'none';
  music.loop = true;
  document.body.append(music);
  ExhibitionSound.media(music, .22);
  ExhibitionSound.show();

  let leaving = false;
  let pending = false;
  let clickContext;
  document.addEventListener('click', event => {
    const target = event.target.closest('.portal, .experience-enter');
    if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (target.matches('.portal') && matchMedia('(pointer: coarse)').matches) return;
    leaving = true;
    music.pause();
    try {
      clickContext ||= new (window.AudioContext || window.webkitAudioContext)();
      clickContext.resume().catch(() => {});
      const tone = clickContext.createOscillator();
      const envelope = clickContext.createGain();
      const now = clickContext.currentTime;
      tone.frequency.setValueAtTime(900, now);
      tone.frequency.exponentialRampToValueAtTime(350, now + .045);
      envelope.gain.setValueAtTime(.08, now);
      envelope.gain.exponentialRampToValueAtTime(.001, now + .065);
      tone.connect(envelope).connect(ExhibitionSound.output(clickContext));
      tone.onended = () => { tone.disconnect(); envelope.disconnect(); };
      tone.start();
      tone.stop(now + .07);
    } catch {}
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
})();
