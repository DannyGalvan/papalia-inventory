module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // w/e plugin you already have
    [
      'module-resolver',
      {
        alias: {
          'react-native-sqlite-storage': 'react-native-quick-sqlite',
        },
      },
    ],
    ['@babel/plugin-proposal-decorators', {legacy: true}],
  ],
};
