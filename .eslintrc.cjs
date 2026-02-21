module.exports = {
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  plugins: ['react', 'react-hooks', 'unused-imports'],
  extends: ['plugin:react/recommended'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unknown-property': [
      'error',
      { ignore: ['cmdk-input-wrapper', 'toast-close'] },
    ],
    'react-hooks/rules-of-hooks': 'error',
  },
};
