(() => {
  const button = document.getElementById('print-fourcut');
  const image = document.getElementById('print-image');
  let busy = false;
  const requestedResults = new Set();
  const load = src => new Promise((resolve,reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
    img.src = src;
  });
  button.addEventListener('click', async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    if (busy) return;
    if (!finalFourcutUrl) return;
    const resultUrl = finalFourcutUrl;
    if (requestedResults.has(resultUrl)) return;
    if (!confirm('인쇄는 결과물당 1회만 가능합니다.\n\n주의: 다음 인쇄 창을 열면 1회 사용으로 처리됩니다. 인쇄 창에서 취소해도 다시 인쇄할 수 없습니다. 프린터 연결과 용지를 먼저 확인해주세요.\n\n4×6인치 인화지 한 장에 같은 네 컷 사진 두 장이 나란히 출력됩니다. QR은 화면에서 이용해주세요.\n\n인쇄 창에서 매수 1장, Canon CP1500, 4×6 용지, 여백 없음, 배율 100%를 선택하고 머리글·바닥글을 꺼주세요.\n\n계속하시겠습니까? (이 안내창에서 취소하면 횟수는 차감되지 않습니다.)')) return;
    busy = true; button.disabled = true;
    try {
      const photo = await load(resultUrl);
      const sheet = document.createElement('canvas');
      sheet.width=1200; sheet.height=1800;
      const ctx=sheet.getContext('2d');
      // Two edge-to-edge 600 × 1800 strips at 300 dpi. Extend the selected
      // frame colour around the artwork, not a separate white mat.
      ctx.fillStyle=currentFrameBg;ctx.fillRect(0,0,1200,1800);
      for(let strip=0;strip<2;strip++) {
        const left=strip*600;
        // Preserve photo and sticker proportions; the remaining inset is frame colour.
        const scale=Math.min(600/photo.width,1800/photo.height);
        const w=photo.width*scale,h=photo.height*scale;
        ctx.drawImage(photo,left+(600-w)/2,(1800-h)/2,w,h);
      }
      image.src=sheet.toDataURL('image/png');
      await image.decode();
      // Count opening the system dialog, not a physical print: browsers cannot
      // distinguish cancellation from successful printing.
      requestedResults.add(resultUrl);
      button.textContent = '인쇄 요청 완료 · 재인쇄 불가';
      window.print();
    } catch(error) {
      console.error('Print preparation failed',error);
      alert(requestedResults.has(resultUrl)
        ? '인쇄 요청이 처리되었습니다. 중복 출력을 막기 위해 다시 인쇄할 수 없습니다. 문제가 있다면 운영자에게 문의해주세요.'
        : '인쇄용 사진을 준비하지 못했습니다. 인쇄 횟수는 사용되지 않았으니 다시 눌러주세요.');
    } finally {busy=false;button.disabled=requestedResults.has(finalFourcutUrl);}
  },true);
})();
