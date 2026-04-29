import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'ONYX',
  slug: 'onyx',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'onyx',
  userInterfaceStyle: 'dark',
  ios: { bundleIdentifier: 'ai.onyx.app', supportsTablet: true },
  android: { package: 'ai.onyx.app', adaptiveIcon: { foregroundImage: './assets/icon.png', backgroundColor: '#0d0d1f' } },
  extra: { nerveUrl: process.env.ONYX_NERVE_URL ?? 'http://localhost:3001' },
};

export default config;