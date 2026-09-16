(() => {
  'use strict';
  const scriptURL = document.currentScript.src;
  const sample = document.createElement('canvas');
  const mask = document.createElement('canvas');
  const layer = document.createElement('canvas');
  const sc = sample.getContext('2d');
  const mc = mask.getContext('2d');
  const lc = layer.getContext('2d');
  let worker, ready = false, failed = false, busy = false, timer;
  let maskTime = 0, lastSent = 0, epoch = 0, aspect = 0, slow = 0;
  function disable() {
    clearTimeout(timer);
    worker?.terminate(); worker = null; ready = false; busy = false; failed = true;
    maskTime = 0;
  }
  function prepare() {
    if (worker || failed) return;
    if (!window.Worker || !window.OffscreenCanvas || !window.createImageBitmap || location.protocol === 'file:') return;
    try {
      worker = new Worker(new URL('pleasure-wave-worker.js', scriptURL));
      timer = setTimeout(disable, 30000);
      worker.onerror = disable;
      worker.onmessage = ({ data }) => {
        clearTimeout(timer);
        if (data.type === 'ready') { ready = true; return; }
        if (data.type !== 'mask') { disable(); return; }
        busy = false;
        if (data.epoch !== epoch) return;
        slow = data.cost > 120 ? slow + 1 : Math.max(0, slow - 1);
        if (slow >= 4) { disable(); return; }
        mask.width = data.width; mask.height = data.height;
        mc.putImageData(new ImageData(new Uint8ClampedArray(data.alpha), data.width, data.height), 0, 0);
        maskTime = data.time;
      };
      worker.postMessage({ type: 'prepare' });
    } catch (_) { disable(); }
  }
  function reset() { epoch++; maskTime = 0; lastSent = 0; }
  function draw(ctx, video, width, height, now, energy) {
    if (!ready || document.hidden || video.readyState < 2 || !video.videoWidth || width <= 0 || height <= 0) return;
    if (Math.abs(aspect - width / height) > .001) { aspect = width / height; reset(); }
    if (!busy && now - lastSent >= 100) {
      lastSent = now; busy = true;
      const ticket = epoch;
      const ratio = Math.min(256 / width, 256 / height);
      sample.width = Math.max(1, Math.round(width * ratio));
      sample.height = Math.max(1, Math.round(height * ratio));
      const scale = Math.max(sample.width / video.videoWidth, sample.height / video.videoHeight);
      const vw = video.videoWidth * scale, vh = video.videoHeight * scale;
      sc.setTransform(-1, 0, 0, 1, sample.width, 0);
      sc.drawImage(video, (sample.width - vw) / 2, (sample.height - vh) / 2, vw, vh);
      createImageBitmap(sample).then(image => {
        if (!worker || ticket !== epoch) { image.close(); busy = false; return; }
        timer = setTimeout(disable, 1500);
        worker.postMessage({ type: 'frame', image, time: now, epoch: ticket }, [image]);
      }).catch(disable);
    }
    if (!maskTime || now - maskTime > 250) return;
    const w = Math.min(1280, Math.round(width));
    const h = Math.round(w / aspect);
    if (layer.width !== w || layer.height !== h) { layer.width = w; layer.height = h; }
    lc.clearRect(0, 0, w, h);
    const n = 39, pitch = w * .92 / n, bar = Math.max(3, pitch * .43);
    lc.fillStyle = '#4ba86a';
    for (let i = 0; i < n; i++) {
      const envelope = .2 + .8 * Math.sin(Math.PI * (i + 1) / (n + 1));
      const rhythm = .35 + .65 * Math.abs(Math.sin(now * .005 + i * 1.37));
      const length = h * (.025 + .24 * Math.min(1, energy) * rhythm) * envelope;
      lc.fillRect(w * .04 + i * pitch, h * .65 - length / 2, bar, length);
    }
    lc.globalCompositeOperation = 'destination-out';
    lc.filter = 'blur(3px)';
    lc.drawImage(mask, 0, 0, w, h);
    lc.filter = 'none';
    lc.drawImage(mask, 0, 0, w, h);
    lc.globalCompositeOperation = 'source-over';
    ctx.drawImage(layer, 0, 0, width, height);
  }
  window.PleasureWave = { prepare, draw, reset };
  document.addEventListener('visibilitychange', reset);
  window.addEventListener('pagehide', disable);
  window.addEventListener('pageshow', event => { if (event.persisted) { failed = false; prepare(); } });
  if ('requestIdleCallback' in window) requestIdleCallback(prepare, { timeout: 1500 });
  else setTimeout(prepare, 600);
})();
