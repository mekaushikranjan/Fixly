const path = require('node:path');
const { getEnvFiles, parseEnvFiles } = require('@expo/env');

module.exports = function (api) {
  api.cache(true);
  const envFiles = getEnvFiles({
    mode: process.env.NODE_ENV || 'development',
    silent: true,
  }).map((file) => path.resolve(__dirname, file));
  const fileEnv = parseEnvFiles(envFiles, { systemEnv: process.env }).env;

  for (const [key, value] of Object.entries(fileEnv)) {
    if (
      key.startsWith('EXPO_PUBLIC_')
      && (!process.env[key]?.trim() || /your|placeholder|replace-with/i.test(process.env[key]))
    ) {
      process.env[key] = value;
    }
  }

  return {
    presets: ['babel-preset-expo'],
  };
};
