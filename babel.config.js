module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // w/e plugin you already have
    [
      'module-resolver',
      {
        alias: {
          'react-native-sqlite-storage': 'react-native-nitro-sqlite',
        },
      },
    ],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    // Must be listed last (required by react-native-reanimated 4).
    'react-native-worklets/plugin',
  ],
};
