(() => {
  const config = {
    apiKey: 'AIzaSyAE_4vKghoE1D1uM829KfYG0B7Ofbz_RdA',
    authDomain: 'joyy-2c74e.firebaseapp.com',
    projectId: 'joyy-2c74e',
    appId: '1:128086377057:web:31f4b86f0bd0373335e020'
  };
  const vendor = 'vendor/firebase/';
  let ready;
  function load(name, available) {
    if (available()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => { script.remove(); reject(new Error('library-timeout')); }, 12000);
      script.src = vendor + name;
      script.onload = () => { clearTimeout(timer); available() ? resolve() : reject(new Error('library-missing')); };
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('library-unavailable')); };
      document.head.append(script);
    });
  }
  async function auth() {
    if (!ready) ready = (async () => {
      await load('firebase-app-8.10.1.js', () => !!window.firebase);
      await load('firebase-auth-8.10.1.js', () => !!window.firebase?.auth);
      const app = firebase.apps.find(app => app.name === 'exhibition-messages') || firebase.initializeApp(config, 'exhibition-messages');
      const client = app.auth();
      await client.setPersistence(firebase.auth.Auth.Persistence.NONE);
      return client;
    })().catch(error => { ready = null; throw error; });
    const client = await ready;
    return client.currentUser || (await client.signInAnonymously()).user;
  }
  async function save({ id, text, emotion }) {
    if (!/^[a-f0-9]{32}$/.test(id) || !text.trim() || text.length > 80 || !['joy','anger','sorrow','pleasure'].includes(emotion)) throw new Error('invalid-message');
    if (!window.MessageModeration || MessageModeration.blocked(text)) throw new Error('blocked-message');
    const user = await auth();
    const token = await user.getIdToken();
    const database = 'projects/' + config.projectId + '/databases/(default)';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('https://firestore.googleapis.com/v1/' + database + '/documents:commit', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ writes: [{
          update: { name: database + '/documents/exhibitionMessages/' + id,
            fields: { text: { stringValue: text }, emotion: { stringValue: emotion }, owner: { stringValue: user.uid } } },
          updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
          currentDocument: { exists: false }
        }] })
      });
      if (!response.ok) throw new Error('cloud-save-' + response.status);
      const result = await response.json();
      if (!result.commitTime) throw new Error('cloud-save-unconfirmed');
      return { id, savedAt: result.commitTime };
    } finally { clearTimeout(timer); }
  }
  window.MessageCloud = { save };
})();
