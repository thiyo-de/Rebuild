import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rebuild.app',
  appName: 'REBUILD',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#090D16',
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#090D16',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#6366F1',
    },
  },
};

export default config;
