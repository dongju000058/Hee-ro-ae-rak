(() => {
  const joy = !!document.querySelector('.joy-intro-inner');
  const host = document.querySelector(joy ? '.joy-intro-inner' : '.music-copy');
  if (!host) return;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'preview-trigger';
  trigger.textContent = '▷ 체험 미리보기 · 약 20초';
  host.append(trigger);
  let dialog, video, status;
  trigger.addEventListener('click', () => {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'experience-preview';
      dialog.setAttribute('aria-label', '체험 미리보기');
      dialog.innerHTML = '<header><strong>체험 미리보기 · 약 20초</strong><button type="button" aria-label="미리보기 닫기">×</button></header><video controls playsinline preload="none"></video><p role="status">예시 이미지로 구성한 안내입니다. 닫으면 직접 체험할 수 있어요.</p>';
      video = dialog.querySelector('video');
      status = dialog.querySelector('p');
      video.src = `assets/${joy ? 'joy' : 'pleasure'}-demo.mp4`;
      video.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(video.duration) && video.duration > 0) video.playbackRate = video.duration / 20;
      });
      video.addEventListener('error', () => { status.textContent = '영상을 불러오지 못했습니다. 닫고 다시 시도하거나 직접 체험해주세요.'; });
      video.addEventListener('ended', () => { status.textContent = '이제 직접 체험해보세요. 닫아도 입력한 내용은 유지됩니다.'; });
      dialog.querySelector('button').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => { video.pause(); trigger.focus({preventScroll:true}); });
      document.body.append(dialog);
    }
    if (video.error) video.load();
    if (!joy) window.dispatchEvent(new Event('pleasure-presentation-open'));
    dialog.showModal();
    video.currentTime = 0;
    video.play().catch(() => { status.textContent = '재생 버튼을 눌러 미리보기를 시작해주세요.'; });
  });
  window.addEventListener('keydown', event => {
    if (!dialog?.open) return;
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) video?.pause(); });
  window.addEventListener('pagehide', () => video?.pause());
})();
