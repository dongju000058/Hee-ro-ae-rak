(() => {
  let dialog, video, previousFocus;
  function open() {
    if (!dialog) {
      const style = document.createElement('style');
      style.textContent = `
        #pleasure-presentation{padding:0;border:0;background:#111;color:#fff;width:min(1440px,94vw);max-width:94vw;max-height:94dvh;overflow:auto;cursor:auto!important}
        #pleasure-presentation::backdrop{background:rgba(0,0,0,.85)}
        #pleasure-presentation *{cursor:auto!important}
        #pleasure-presentation header{all:initial;box-sizing:border-box;display:flex;position:static;align-items:center;justify-content:space-between;min-height:54px;padding:8px 16px;font:14px sans-serif;color:#fff;background:#111}
        #pleasure-presentation button{min-width:44px;min-height:44px;border:0;color:#fff;background:none;font-size:24px;cursor:pointer!important}
        #pleasure-presentation video{position:static!important;display:block;width:100%!important;height:auto!important;max-height:calc(94dvh - 54px);object-fit:contain;transform:none!important;background:#111}
      `;
      document.head.append(style);
      dialog = document.createElement('dialog');
      dialog.id = 'pleasure-presentation';
      dialog.setAttribute('aria-label', '락 체험 발표용 목업 영상');
      dialog.innerHTML = '<header><span>락 · 18초 발표용 목업</span><button type="button" aria-label="영상 닫기">×</button></header><video controls playsinline preload="none" aria-label="락 체험 영상"></video>';
      video = dialog.querySelector('video');
      video.src = new URL('assets/pleasure-demo.mp4', document.baseURI).href;
      dialog.querySelector('button').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => {
        video.pause();
        window.dispatchEvent(new Event('pleasure-presentation-close'));
        previousFocus?.focus({ preventScroll: true });
      });
      document.body.append(dialog);
    }
    previousFocus = document.activeElement;
    window.dispatchEvent(new Event('pleasure-presentation-open'));
    dialog.showModal();
    video.currentTime = 0;
    video.play().catch(() => {});
  }
  window.addEventListener('keydown', event => {
    if (dialog?.open) {
      event.stopImmediatePropagation();
      if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
      return;
    }
    if (event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) return;
    if (event.code !== 'KeyA') return;
    if (document.querySelector('#live-screen.is-active')) return;
    event.preventDefault(); event.stopImmediatePropagation(); open();
  }, true);
  window.addEventListener('pagehide', () => video?.pause());
})();
