module.exports = {
  root: true,
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier',
    '@react-native',
    'plugin:prettier/recommended',
  ],
  plugins: ['react', 'react-hooks', '@typescript-eslint', 'prettier'],
  settings: {
    // react-native ships Flow sources that eslint-plugin-import cannot parse.
    'import/ignore': ['node_modules/react-native/'],
  },
  rules: {
    'prettier/prettier': ['error'],
    'spaced-comment': ['error', 'always', { markers: ['/'] }],
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-expressions': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // TypeScript already validates imports, namespaces and component props.
    'import/namespace': 'off',
    'import/no-named-as-default-member': 'off',
    'react/prop-types': 'off',
    // React Native loads static images and lazy native modules via require().
    '@typescript-eslint/no-require-imports': 'off',
    // Legacy code still relies on `any`; surface it without failing lint.
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
