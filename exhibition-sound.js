(() => {
  let context, bed, timer;
  let controlsVisible = false;
  let volume = .7, muted = false;
  const outputs = new Map();
  try { const saved = JSON.parse(sessionStorage.getItem('exhibition-sound') || 'null'); if (saved) { volume = Math.max(0, Math.min(1, Number(saved.volume) || 0)); muted = !!saved.muted; } } catch {}
  function output(c) {
    if (!outputs.has(c)) { const gain = c.createGain(); gain.gain.value = muted ? 0 : volume; gain.connect(c.destination); outputs.set(c, gain); }
    return outputs.get(c);
  }
  function applyVolume() {
    for (const [c, gain] of outputs) if (c.state !== 'closed') gain.gain.setTargetAtTime(muted ? 0 : volume, c.currentTime, .03);
    document.querySelectorAll('audio').forEach(audio => { audio.muted = muted; audio.volume = volume * Number(audio.dataset.soundLevel || 1); });
    try { sessionStorage.setItem('exhibition-sound', JSON.stringify({volume, muted})); } catch {}
  }
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
    source.connect(gain).connect(destination || output(c));
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
    source.connect(filter).connect(gain).connect(output(c));
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
    source.connect(filter).connect(gain).connect(output(c));
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
      bass.connect(envelope).connect(output(c));
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
    const c = ready(); bed = c.createGain(); bed.gain.value = .12; bed.connect(output(c));
    let phrase = 0;
    const play = () => {
      if (document.hidden) return;
      const chords = [[130.81,196,261.63,329.63],[110,164.81,220,293.66],[87.31,130.81,174.61,261.63],[98,146.83,196,293.66]];
      chords[phrase++ % chords.length].forEach((f, i) => tone(f, 10, .14, bed, i * .45));
    };
    play(); timer = setInterval(play, 8000);
  }
  window.ExhibitionSound = {
    show(visible = true) { controlsVisible = visible; const controls = document.querySelector('.sound-controls'); if (controls) controls.hidden = !visible; },
    output,
    media(audio, level) { audio.dataset.soundLevel = String(level); audio.muted = muted; audio.volume = volume * level; },
    break() { try { impactSound(); } catch {} },
    throw(strength) { try { impactSound(true, strength); } catch {} },
    shutter() { try { noise(.18, 6500, .32, true); } catch {} },
    shred() { try { for (const voice of voices) voice.stop(); noise(.65, 2600, .2); } catch {} },
    meditation: startBed,
    stop: stopBed
  };
  document.addEventListener('visibilitychange', () => {
    if (!context || context.state === 'closed') return;
    if (document.hidden) context.suspend().catch(() => {});
    else if (bed) context.resume().catch(() => {});
  });
  document.addEventListener('pointerdown', () => { if (bed && !document.hidden) ready(); }, {passive:true});
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '.sound-controls{position:fixed;right:max(20px,env(safe-area-inset-right));top:94px;z-index:250;color:#333;display:flex;align-items:center;gap:4px;padding:0;background:none;border:0}.sound-controls[hidden]{display:none}.sound-controls button{display:grid;place-items:center;color:inherit;background:none;border:0;padding:0;width:44px;height:44px;cursor:pointer}.sound-controls svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.sound-controls input{width:76px;min-height:44px;margin:0;accent-color:#333}.sound-controls button:focus-visible,.sound-controls input:focus-visible{outline:2px solid #222;outline-offset:2px}@media(max-width:600px){.sound-controls{top:76px;right:16px}.sound-controls input{width:64px}}@media print{.sound-controls{display:none}}';
    style.textContent += `
      .sound-controls{color:#555;gap:2px}
      .sound-controls svg{width:18px;height:18px;stroke-width:1.35}
      .sound-controls input{appearance:none;-webkit-appearance:none;width:72px;height:44px;min-height:44px;border:0;border-radius:0;box-shadow:none;outline:none;padding:0;background:transparent;cursor:pointer}
      .sound-controls input::-webkit-slider-runnable-track{height:1px;border:0;border-radius:0;background:linear-gradient(to right,#555 var(--sound-fill,70%),#ccc var(--sound-fill,70%));box-shadow:none}
      .sound-controls input::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:7px;height:7px;border:0;border-radius:50%;background:#555;box-shadow:none;margin-top:-3px}
      .sound-controls input::-moz-range-track{height:1px;border:0;background:#ccc}
      .sound-controls input::-moz-range-progress{height:1px;background:#555}
      .sound-controls input::-moz-range-thumb{width:7px;height:7px;border:0;border-radius:50%;background:#555;box-shadow:none}
      .sound-controls button:hover{color:#111}
      .sound-controls button:focus-visible,.sound-controls input:focus-visible{outline:1px solid #777;outline-offset:2px}
    `;
    document.head.append(style);
    const controls = document.createElement('div'); controls.className = 'sound-controls'; controls.setAttribute('role','group'); controls.setAttribute('aria-label','소리 설정');
    const toggle = document.createElement('button'); toggle.type = 'button';
    const slider = document.createElement('input'); slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.value = String(Math.round(volume * 100)); slider.setAttribute('aria-label','음량');
    controls.hidden = !controlsVisible;
    const render = () => { toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 6 6.5 9H4v6h2.5l4.5 3Z"/>' + (muted ? '<path d="m16 10 4 4m0-4-4 4"/>' : '<path d="M15 9a4.5 4.5 0 0 1 0 6m3-9a8.5 8.5 0 0 1 0 12"/>') + '</svg>'; toggle.setAttribute('aria-label',muted ? '소리 켜기' : '소리 끄기'); toggle.setAttribute('aria-pressed',String(muted)); slider.style.setProperty('--sound-fill',Math.round(volume*100)+'%'); slider.setAttribute('aria-valuetext',Math.round(volume*100)+'%'); applyVolume(); };
    toggle.onclick = () => { muted = !muted; if (!muted && volume === 0) { volume = .7; slider.value = '70'; } render(); };
    slider.oninput = () => { volume = Number(slider.value)/100; muted = volume === 0; render(); };
    controls.append(toggle, slider); document.body.append(controls); render();
  });
  addEventListener('pagehide', event => { if (event.persisted) { context?.suspend().catch(() => {}); return; } stopBed(); context?.close().catch(() => {}); context = null; outputs.clear(); });
  addEventListener('pageshow', () => { if (bed && !document.hidden) context?.resume().catch(() => {}); });
})();
