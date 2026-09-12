(() => {
  'use strict';
  const MEASUREMENT_ID = 'G-GSC6R449KQ';
  const START = Date.parse('2026-10-26T17:30:00+09:00');
  const END = Date.parse('2026-11-01T12:30:00+09:00');
  const EXHIBITION = 'heerorak_2026';
  const emotion = location.pathname.match(/\/(joy|anger|sorrow|pleasure)(?:\.html)?$/)?.[1] || 'navigation';
  const testing = new URLSearchParams(location.search).get('analytics_test') === '1';
  const allowed = new Set(['emotion_select','experience_start','stage_view','experience_complete','experience_exit','save_click','qr_success','qr_failure','feature_use','media_success','media_failure']);
  let loaded = false, started = 0, lastStage = '', completed = false;
  function mode(now) { return testing ? 'test' : now >= START && now < END ? 'exhibition' : null; }
  function track(name, params = {}) {
    const now = Date.now(), collection = mode(now);
    if (!collection || !allowed.has(name)) return;
    const clean = { exhibition_id: EXHIBITION, collection_mode: collection, emotion,
      event_time_utc: new Date(now).toISOString(), exhibition_elapsed_s: Math.floor((now - START) / 1000) };
    for (const key of ['stage','action','selected_emotion','duration_s']) {
      const value = params[key];
      if (typeof value === 'number' && Number.isFinite(value)) clean[key] = value;
      else if (typeof value === 'string' && /^[a-z0-9_]{1,40}$/.test(value)) clean[key] = value;
    }
    if (testing) console.info('[exhibition analytics]', name, clean);
    if (!/^G-[A-Z0-9]+$/.test(MEASUREMENT_ID) || !/^https?:$/.test(location.protocol)) return;
    if (!loaded) {
      loaded = true;
      window.dataLayer ||= [];
      window.gtag ||= function () { window.dataLayer.push(arguments); };
      gtag('js', new Date());
      gtag('config', MEASUREMENT_ID, {send_page_view:false, allow_google_signals:false,
        allow_ad_personalization_signals:false, page_location:location.origin + location.pathname,
        page_referrer:'', page_title:'exhibition_' + emotion});
      const script = document.createElement('script'); script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
      document.head.append(script);
    }
    gtag('event', name, {...clean, send_to:MEASUREMENT_ID, debug_mode:collection === 'test',
      page_location:location.origin + location.pathname, page_referrer:'', page_title:'exhibition_' + emotion});
  }
  window.ExhibitionAnalytics = {
    track,
    action(action) { track('feature_use', {action}); },
    stage(value) {
      const stage = String(value);
      if (completed) { started = 0; completed = false; lastStage = ''; }
      if (stage === lastStage) return;
      if (!started) { started = performance.now() || .001; track('experience_start'); }
      lastStage = stage; track('stage_view', {stage});
    },
    complete() {
      if (!started || completed) return;
      completed = true;
      track('experience_complete', {stage:lastStage, duration_s:Math.round((performance.now()-started)/1000)});
    }
  };
  document.addEventListener('click', event => {
    const node = event.target.closest('a,button'); if (!node || node.disabled) return;
    const choice = node.getAttribute('href')?.match(/^(?:\.\/)?(joy|anger|sorrow|pleasure)\.html(?:[?#]|$)/)?.[1];
    if (choice) track('emotion_select', {selected_emotion:choice});
    const saves = {'download-fourcut':'fourcut','download-gif':'gif','print-fourcut':'print'};
    if (saves[node.id]) track('save_click', {action:saves[node.id]});
    const actions = {'drawing-undo':'drawing_undo','drawing-redo':'drawing_redo',
      'draw-toggle-btn':'drawing_toggle','qr-retry-button':'qr_retry','keyword-back':'keyword_back',
      'again':'restart','restartButton':'restart','again-button':'restart',
      'change-music-button':'music_change','live-reset':'live_reset','guide-back':'guide_back'};
    if (actions[node.id]) track('feature_use', {action:actions[node.id]});
    if (node.closest('.sound-controls')) track('feature_use', {action:'sound_toggle'});
    if (node.closest('#keyword-list')) track('feature_use', {action:'keyword_select'});
    if (/^editor-tab-(frame|sticker|caption|filter|draw)$/.test(node.id))
      track('feature_use', {action:node.id.replace('editor-tab-', 'editor_')});
  });
  document.addEventListener('change', event => {
    const action = {'caption-editor':'caption_edit','pen-color':'drawing_color',
      'pen-brightness':'drawing_brightness','brush-size':'drawing_size'}[event.target.id];
    if (action) track('feature_use', {action});
    if (event.target.matches('.sound-controls input')) track('feature_use', {action:'sound_volume'});
  });
  addEventListener('pagehide', () => {
    if (started && !completed) track('experience_exit', {stage:lastStage,duration_s:Math.round((performance.now()-started)/1000)});
  });
})();
