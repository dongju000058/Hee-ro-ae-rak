(() => {
  let dialog;
  let video;
  let result;
  let resultTimer;

  function showPageResult() {
    stopCamera();
    const intro = document.getElementById('joy-intro');
    intro.classList.add('is-hidden');
    intro.setAttribute('aria-hidden', 'true');
    intro.setAttribute('inert', '');
    const main = document.getElementById('experience-main');
    main.removeAttribute('inert');
    main.setAttribute('aria-hidden', 'false');
    for (const selector of ['.center-booth', '#panel', '#select-panel', '#main-frame']) {
      document.querySelector(selector).style.display = 'none';
    }
    const area = document.getElementById('qr-area');
    area.classList.add('is-visible');
    area.style.opacity = '1';
    updateJoyStage(4, '발표용 목업 · 기쁨의 기록', 100);
    document.getElementById('qr-status-msg').textContent = '발표용 결과를 준비하고 있습니다…';
    document.getElementById('home-return-btn').style.display = 'inline-block';
    clearTimeout(resultTimer);
    const deadline = Date.now() + 15000;
    const populate = () => {
      const source = result.contentDocument;
      const photo = source?.getElementById('demo-photo');
      const qr = source?.querySelector('#qr img');
      if (!photo?.src || !photo.complete || !qr?.src) {
        if (Date.now() < deadline) { resultTimer = setTimeout(populate, 150); return; }
        document.getElementById('qr-status-msg').textContent = '결과 준비가 지연되고 있습니다. A키로 영상을 다시 열어주세요.';
        return;
      }
      isFinished = true;
      if (finalFourcutUrl?.startsWith('blob:')) URL.revokeObjectURL(finalFourcutUrl);
      finalFourcutUrl = photo.src;
      finalGifUrl = '';
      const preview = document.getElementById('fourcut-preview');
      preview.src = finalFourcutUrl;
      preview.classList.add('is-ready');
      document.getElementById('print-image').src = finalFourcutUrl;
      document.getElementById('download-fourcut').disabled = false;
      document.getElementById('print-fourcut').disabled = false;
      document.getElementById('download-gif').style.display = 'none';
      const still = document.getElementById('gif-preview');
      still.src = new URL('assets/joy-demo-photo.png', document.baseURI).href;
      still.alt = '발표용 목업 사진';
      still.classList.add('is-ready');
      document.getElementById('gif-label').textContent = '발표용 목업 사진';
      const targetQr = document.getElementById('qr-image-holder');
      targetQr.src = qr.src;
      targetQr.alt = '발표용 네 컷 저장 화면 QR';
      targetQr.style.display = 'block';
      targetQr.closest('.qr-delivery').classList.add('has-qr');
      document.getElementById('qr-status-msg').textContent = '발표용 네 컷 · QR로 열어 저장하실 수 있습니다.';
      document.getElementById('download-fourcut').focus({preventScroll:true});
    };
    populate();
  }

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
        #joy-presentation video[hidden],#joy-presentation iframe[hidden]{display:none!important}
        #joy-presentation iframe{display:block;width:100%;height:calc(90dvh - 60px);border:0;background:#fff}
      `;
      document.head.append(style);
      dialog = document.createElement('dialog');
      dialog.id = 'joy-presentation';
      dialog.setAttribute('aria-label', '희 체험 발표 영상');
      dialog.innerHTML = '<header><span>희 · 체험 영상</span><button type="button" aria-label="영상 닫기">×</button></header><video controls playsinline preload="none" aria-label="15초 목업 체험 영상"></video>';
      video = dialog.querySelector('video');
      video.src = new URL('assets/joy-demo.mp4', document.baseURI).href;
      result = document.createElement('iframe');
      result.title = '발표용 네 컷 결과와 QR';
      result.hidden = true;
      dialog.append(result);
      result.addEventListener('load', () => {
        result.contentWindow?.addEventListener('keydown', event => {
          if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
        });
      });
      video.addEventListener('ended', () => dialog.close());
      dialog.querySelector('button').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => {
        video.pause();
        showPageResult();
      });
      document.body.append(dialog);
    }
    dialog.showModal();
    result.hidden = true;
    video.hidden = false;
    dialog.querySelector('header span').textContent = '희 · 체험 영상';
    if (!result.getAttribute('src')) result.src = new URL('joy-demo-result.html', document.baseURI).href;
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
  window.addEventListener('pagehide', () => { video?.pause(); clearTimeout(resultTimer); });
})();
