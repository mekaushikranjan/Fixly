const fs = require('node:fs');
const path = require('node:path');
const { withAndroidManifest } = require('expo/config-plugins');
const { getEnvFiles, parseEnvFiles } = require('@expo/env');

module.exports = ({ config }) => {
  const envFiles = getEnvFiles({
    mode: process.env.NODE_ENV || 'development',
    silent: true,
  }).map((file) => path.resolve(__dirname, file));
  const fileEnv = parseEnvFiles(envFiles, { systemEnv: process.env }).env;
  const apiUrl = (process.env.EXPO_PUBLIC_API_URL || fileEnv.EXPO_PUBLIC_API_URL)?.trim();
  const apiUsesHttp = apiUrl?.startsWith('http://') ?? false;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const hasGoogleIosClientId = Boolean(iosClientId && !/your|placeholder|replace-with/i.test(iosClientId));
  const iosUrlScheme = hasGoogleIosClientId
    ? `com.googleusercontent.apps.${iosClientId.replace(/\.apps\.googleusercontent\.com$/, '')}`
    : undefined;
  const googleServicesFile = path.join(__dirname, 'google-services.json');
  const iosFirebaseConfigFile = path.join(__dirname, 'GoogleService-Info.plist');

  let nextConfig = {
    ...config,
    android: {
      ...config.android,
      ...(fs.existsSync(googleServicesFile) ? { googleServicesFile: './google-services.json' } : {}),
    },
    ios: {
      ...config.ios,
      ...(fs.existsSync(iosFirebaseConfigFile) ? { googleServicesFile: './GoogleService-Info.plist' } : {}),
    },
    plugins: [
      ...(config.plugins || []).filter((plugin) => {
        const [name] = Array.isArray(plugin) ? plugin : [plugin, {}];
        return name !== '@react-native-google-signin/google-signin';
      }),
      ...(iosUrlScheme
        ? [['@react-native-google-signin/google-signin', { iosUrlScheme }]]
        : []),
    ],
  };

  nextConfig = withAndroidManifest(nextConfig, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error('Android manifest is missing its application element.');
    }
    application.$['android:usesCleartextTraffic'] = String(apiUsesHttp);
    return config;
  });

  return nextConfig;
};
