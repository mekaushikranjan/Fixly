importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js');

const config = new URL(self.location.href).searchParams;
firebase.initializeApp({
  apiKey: config.get('apiKey'),
  authDomain: config.get('authDomain'),
  projectId: config.get('projectId'),
  storageBucket: config.get('storageBucket'),
  messagingSenderId: config.get('messagingSenderId'),
  appId: config.get('appId'),
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;
  const title = payload.data?.title || 'Fixly';
  const body = payload.data?.body || '';
  return self.registration.showNotification(title, { body, data: payload.data });
});
