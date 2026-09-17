(() => {
  const loadImage = async src => {
    const image = new Image();
    image.src = src;
    await image.decode();
    return image;
  };
  async function prepare() {
    const [photo, heart, decorations] = await Promise.all([
      loadImage('assets/joy-demo-photo.png'),
      loadImage('assets/joy-art/heart.webp'),
      JoyArtwork.prepareTheme('joy')
    ]);
    const canvas = document.createElement('canvas');
    canvas.width = 920;
    canvas.height = 2440;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#f6c62f';
    ctx.fillRect(0, 0, 920, 2440);
    const sw = Math.min(photo.naturalWidth, photo.naturalHeight * 1.5);
    const sh = sw / 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.drawImage(photo, (photo.naturalWidth - sw) / 2, (photo.naturalHeight - sh) / 2,
        sw, sh, 60, 50 + i * 560, 800, 533);
    }
    JoyArtwork.drawTheme(ctx, decorations);
    ctx.drawImage(heart, 440, 865, 320, 320);
    ctx.fillStyle = '#252321';
    ctx.font = '38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('함께 웃던 날', 460, 2365);
    const url = canvas.toDataURL('image/png');
    document.getElementById('demo-photo').src = url;
    const save = document.getElementById('save');
    save.href = url;
    save.hidden = false;
    document.getElementById('print').disabled = false;
    document.getElementById('status').textContent = '발표용 네 컷 · 저장과 인쇄를 직접 해보실 수 있습니다.';
    try {
      new QRCode(document.getElementById('qr'), {
        text: 'https://heeroaerak.com/joy-demo-result.html',
        width: 192, height: 192, correctLevel: QRCode.CorrectLevel.M
      });
    } catch {
      document.getElementById('status').textContent = 'QR을 불러오지 못했습니다. 네 컷 저장 버튼은 사용할 수 있습니다.';
    }
  }
  document.getElementById('print').addEventListener('click', () => window.print());
  prepare().catch(() => {
    document.getElementById('status').textContent = '목업 사진을 불러오지 못했습니다. 새로고침해 주세요.';
  });
})();
