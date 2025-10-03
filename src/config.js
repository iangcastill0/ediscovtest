export const FIREBASE_API = {
  apiKey: "AIzaSyBdlJHkMBzIeSiddipmlVngkO_l5QAisbk",
  authDomain: "ediscoverylive.firebaseapp.com",
  projectId: "ediscoverylive",
  storageBucket: "ediscoverylive.firebasestorage.app",
  messagingSenderId: "707739264786",
  appId: "1:707739264786:web:cf9261687d35d68ee035cb",
  measurementId: "G-QMJBZ6VMXG"
};

// basename: only at build time to set, and Don't add '/' at end off BASENAME for breadcrumbs, also Don't put only '/' use blank('') instead,
// like '/berry-material-react/react/default'
export const BASE_PATH = '';

export const DASHBOARD_PATH = '/dashboard';

const config = {
    serverName: process.env.REACT_APP_SERVER_NAME || 'https://ediscovtest.com',
    fontFamily: `'Roboto', sans-serif`,
    borderRadius: 8,
    outlinedFilled: true,
    navType: 'light', // light, dark
    presetColor: 'default', // default, theme1, theme2, theme3, theme4, theme5, theme6
    locale: 'en', // 'en' - English, 'fr' - French, 'ro' - Romanian, 'zh' - Chinese
    rtlLayout: false,
    container: false
};

export default config;
