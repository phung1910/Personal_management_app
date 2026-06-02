import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.personal.app',
  appName: 'Personal App',
  webDir: 'dist',
  server: {
    // Xóa dòng url dưới và thay bằng đường link trang web Vercel thực tế của bạn
    url: 'https://personal-management-app-lqep.vercel.app', 
    cleartext: true
  }
};

export default config;
