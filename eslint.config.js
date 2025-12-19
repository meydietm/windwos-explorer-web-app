import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.output/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.vite/**',
    ],
  },

  js.configs.recommended,

  // TypeScript (syntax + basic rules, not type-aware yet)
  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ['**/*.ts', '**/*.tsx'],
  })),

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // keep rules practical for take-home tests
      'no-console': 'off',
    },
  },

  // Vue (applies only when we add *.vue in Sprint 1/2)
  ...vue.configs['flat/recommended'].map((cfg) => ({
    ...cfg,
    files: ['**/*.vue'],
  })),

  // Prettier must come last to turn off conflicting rules
  prettier,
];
