import * as admin from 'firebase-admin';
import firebaseConfig from '../firebase-applet-config.json';

// Make sure we only initialize if admin.apps exists and is empty to avoid the TypeError
if (admin.apps && admin.apps.length === 0) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export { admin };
