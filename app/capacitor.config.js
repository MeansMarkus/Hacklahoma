import { defineConfig } from '@capacitor/cli';

export default defineConfig({
  appId: 'com.lifeasamountain.app',
  appName: 'Life as a Mountain',
  webDir: 'dist',
  server: {
    // Uncomment to use the dev server on a device:
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true,
  },
});
