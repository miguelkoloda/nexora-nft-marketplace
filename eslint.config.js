import js from '@eslint/js'

export default [
  {
    ignores: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.json',
      '**/*.css',
      '**/*.md',
      '**/*.png',
      'public/mockServiceWorker.js',
      'dist/**',
      'node_modules/**',
      'playwright-report*/**',
      'test-results/**',
    ],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: {
        Buffer: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
]
