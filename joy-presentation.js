(() => {
  let dialog;
  let video;
  let previousFocus;

  function openPresentation() {
    if (!dialog) {
      const style = document.createElement('style');
      style.textContent = `
        #joy-presentation{padding:0;border:0;background:#111;color:#fff;width:min(1200px,94vw);max-width:94vw;max-height:94dvh;overflow:auto;cursor:auto!important}
        #joy-presentation::backdrop{background:rgba(0,0,0,.85)}
        #joy-presentation *{cursor:auto!important}
        #joy-presentation header{all:initial;box-sizing:border-box;display:flex;position:static;align-items:center;justify-content:space-between;min-height:60px;padding:8px 16px;font:14px sans-serif;color:#fff;background:#111}
        #joy-presentation button{min-width:44px;min-height:44px;border:0;color:#fff;background:none;font-size:24px;cursor:pointer!important}
        #joy-presentation video{position:static!important;display:block;width:100%!important;height:auto!important;max-height:calc(94dvh - 60px);object-fit:contain;transform:none!important;background:#111}
      `;
      document.head.append(style);
      dialog = document.createElement('dialog');
      dialog.id = 'joy-presentation';
      dialog.setAttribute('aria-label', '희 체험 발표 영상');
      dialog.innerHTML = '<header><span>희 · 체험 영상</span><button type="button" aria-label="영상 닫기">×</button></header><video controls playsinline preload="none" aria-label="15초 목업 체험 영상"></video>';
      video = dialog.querySelector('video');
      video.src = new URL('assets/joy-demo.mp4', document.baseURI).href;
      dialog.querySelector('button').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => {
        video.pause();
        previousFocus?.focus({ preventScroll: true });
      });
      document.body.append(dialog);
    }
    previousFocus = document.activeElement;
    dialog.showModal();
    video.currentTime = 0;
    video.play().catch(() => { /* Native controls remain available. */ });
  }

  window.addEventListener('keydown', event => {
    if (dialog?.open) {
      event.stopImmediatePropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        dialog.close();
      }
      return;
    }
    if (event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    if (event.code !== 'KeyA') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openPresentation();
  }, true);
  window.addEventListener('pagehide', () => video?.pause());
})();
