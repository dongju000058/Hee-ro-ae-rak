(() => {
  let context, bed, timer;
  const voices = new Set();
  function ready() {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }
  function tone(frequency, duration, volume, destination, delay = 0) {
    const c = ready(), start = c.currentTime + delay;
    const source = c.createOscillator(), gain = c.createGain();
    source.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + Math.min(.8, duration / 4));
    gain.gain.linearRampToValueAtTime(0, start + duration);
    source.connect(gain).connect(destination || c.destination);
    source.start(start); source.stop(start + duration);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
  }
  function noise(duration, frequency, volume, shutter = false) {
    const c = ready();
    const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      const t = i / c.sampleRate;
      const envelope = shutter ? Math.exp(-t * 65) + .65 * Math.exp(-Math.abs(t - .075) * 110) : Math.min(1, t * 25) * Math.min(1, (duration - t) * 10);
      samples[i] = (Math.random() * 2 - 1) * envelope * (shutter ? 1 : .65 + .35 * Math.sin(t * 2 * Math.PI * 47));
    }
    const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = frequency;
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(c.destination);
    voices.add(source);
    source.onended = () => { voices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start();
  }
  function impactSound(throwing = false, strength = 1) {
    const c = ready(), now = c.currentTime;
    const duration = throwing ? .32 : .48;
    const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate);
    const data = buffer.getChannelData(0);
    const level = Math.max(.25, Math.min(1, strength));
    for (let i = 0; i < data.length; i++) {
      const t = i / c.sampleRate;
      const envelope = throwing ? Math.sin(Math.PI * t / duration) ** 2 : Math.exp(-t * 13) * Math.min(1, t * 600);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    source.buffer = buffer; filter.type = throwing ? 'bandpass' : 'lowpass';
    filter.Q.value = .7;
    filter.frequency.setValueAtTime(throwing ? 2400 : 4200, now);
    filter.frequency.exponentialRampToValueAtTime(throwing ? 450 : 180, now + duration);
    gain.gain.value = (throwing ? .18 : .3) * level;
    source.connect(filter).connect(gain).connect(c.destination);
    voices.add(source);
    source.onended = () => { voices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start();
    if (!throwing) {
      const bass = c.createOscillator(), envelope = c.createGain();
      bass.frequency.setValueAtTime(125, now);
      bass.frequency.exponentialRampToValueAtTime(38, now + .22);
      envelope.gain.setValueAtTime(.0001, now);
      envelope.gain.linearRampToValueAtTime(.22 * level, now + .006);
      envelope.gain.exponentialRampToValueAtTime(.0001, now + .3);
      bass.connect(envelope).connect(c.destination);
      bass.start(); bass.stop(now + .31);
      bass.onended = () => { bass.disconnect(); envelope.disconnect(); };
    }
  }
  function stopBed() {
    clearInterval(timer); timer = null;
    if (!bed) return;
    const old = bed; bed = null;
    old.gain.cancelScheduledValues(context.currentTime);
    old.gain.setTargetAtTime(0, context.currentTime, .5);
    setTimeout(() => old.disconnect(), 3000);
  }
  function startBed() {
    if (bed || document.hidden) return;
    const c = ready(); bed = c.createGain(); bed.gain.value = .12; bed.connect(c.destination);
    let phrase = 0;
    const play = () => {
      const chords = [[130.81,196,261.63,329.63],[110,164.81,220,293.66],[87.31,130.81,174.61,261.63],[98,146.83,196,293.66]];
      chords[phrase++ % chords.length].forEach((f, i) => tone(f, 10, .14, bed, i * .45));
    };
    play(); timer = setInterval(play, 8000);
  }
  window.ExhibitionSound = {
    break() { try { impactSound(); } catch {} },
    throw(strength) { try { impactSound(true, strength); } catch {} },
    shutter() { try { noise(.18, 6500, .32, true); } catch {} },
    shred() { try { for (const voice of voices) voice.stop(); noise(.65, 2600, .2); } catch {} },
    meditation: startBed,
    stop: stopBed
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopBed(); context?.suspend(); } });
  addEventListener('pagehide', () => { stopBed(); context?.close().catch(() => {}); context = null; });
})();
