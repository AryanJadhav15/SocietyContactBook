import globals from 'globals';

export default [
  {
    files: ['src/**/*.js', 'tests/**/*.js', 'prisma/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.vitest }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
];
