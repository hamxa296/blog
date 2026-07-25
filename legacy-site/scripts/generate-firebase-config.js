const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', 'firebase-config-vercel.js');

const env = process.env;

const config = {
  apiKey: env.FIREBASE_API_KEY || '',
  authDomain: env.FIREBASE_AUTH_DOMAIN || '',
  projectId: env.FIREBASE_PROJECT_ID || '',
  storageBucket: env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.FIREBASE_APP_ID || ''
};

const content = `// Generated file - DO NOT COMMIT THIS WITH REAL KEYS
// This file is generated at build time from environment variables.
const firebaseConfigData = ${JSON.stringify(config, null, 4)};

if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfigData;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfigData;
}
`;

fs.writeFileSync(outPath, content, { encoding: 'utf8' });
console.log('Wrote firebase-config-vercel.js from environment variables');
// Fail the build if the API key is missing to prevent accidental deploys without keys
if (!config.apiKey) {
    console.error('ERROR: FIREBASE_API_KEY is not set. Aborting build to avoid deploying an empty firebase config.');
    process.exit(1);
}
