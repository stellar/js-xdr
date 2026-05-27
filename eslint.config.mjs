import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', 'lib/**', 'generated/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // TypeScript's own checker covers undefined identifiers/globals, and the
      // rule otherwise flags platform globals (TextEncoder, DataView, …).
      'no-undef': 'off',
      // `{}` is used intentionally in the union type algebra to mean "adds no
      // properties" (the void-arm branch of a conditional type).
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },
  prettier
);
