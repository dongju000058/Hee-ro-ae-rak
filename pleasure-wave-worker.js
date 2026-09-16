let segmenter;
async function prepare() {
  const { ImageSegmenter, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
  const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
  segmenter = await ImageSegmenter.createFromOptions(files, {
    canvas: new OffscreenCanvas(256, 144),
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite',
      delegate: 'CPU'
    },
    runningMode: 'VIDEO', outputCategoryMask: false, outputConfidenceMasks: true
  });
  const warmup = new OffscreenCanvas(256, 144);
  warmup.getContext('2d').fillRect(0, 0, 256, 144);
  segmenter.segmentForVideo(warmup, 0, () => {});
  postMessage({ type: 'ready' });
}
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'prepare') { await prepare(); return; }
    if (data.type !== 'frame') return;
    const started = performance.now();
    try {
      segmenter.segmentForVideo(data.image, data.time, result => {
        const source = result.confidenceMasks[0];
        const values = source.getAsFloat32Array();
        const alpha = new Uint8ClampedArray(values.length * 4);
        for (let i = 0; i < values.length; i++) alpha[i * 4 + 3] = Math.min(255, values[i] * 850);
        postMessage({ type: 'mask', alpha: alpha.buffer, width: source.width, height: source.height,
          time: data.time, epoch: data.epoch, cost: performance.now() - started }, [alpha.buffer]);
      });
    } finally { data.image.close(); }
  } catch (error) {
    postMessage({ type: 'failed' });
    segmenter?.close();
    self.close();
  }
};
