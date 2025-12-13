const eslint = require('@eslint/js');
const eslintConfigPrettier = require('eslint-config-prettier');
const typescriptEslint = require('typescript-eslint');

module.exports = typescriptEslint.config(
  {
    ignores: [
      'node_modules/*',
      'lib/*',
      'logs/*',
      '.vscode',
      '.git',
      '.eslintrc.js',
    ],
  },
  {
    extends: [eslint.configs.recommended, typescriptEslint.configs.recommended, eslintConfigPrettier],
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        parser: typescriptEslint.parser,
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
      },
    },

    // add your custom rules here
    rules: {
      'no-prototype-builtins': 'warn',
      'no-useless-catch': 'off',

      '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: false }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      // '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
    },
  },
);
