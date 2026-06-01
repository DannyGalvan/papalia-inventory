module.exports = {
  preset: 'react-native',
  // exceljs (and its nested `uuid` dependency) ships ES module syntax that
  // Jest does not transform by default because it lives under node_modules.
  // Extend the react-native preset's ignore pattern so these packages are
  // transpiled, allowing the genuine workbook serialize/parse round-trip to
  // run in the Jest environment.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|exceljs|uuid)/)',
  ],
};
