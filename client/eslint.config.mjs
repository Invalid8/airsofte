import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginSvelte from 'eslint-plugin-svelte'

export default [
  // Ignore patterns
  {
    ignores: ['**/node_modules', '**/dist', '**/out']
  },

  // TypeScript recommended configs
  ...tseslint.configs.recommended.map((conf) => ({
    ...conf,
    files: ['**/*.{ts,tsx}']
  })),

  // Svelte recommended config
  {
    ...eslintPluginSvelte.configs['flat/recommended'],
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },

  // Custom rules for tsx, svelte, ts files
  {
    files: ['**/*.{tsx,svelte,ts}'],
    rules: {
      'svelte/no-unused-svelte-ignore': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  },

  // Prettier config
  eslintConfigPrettier
]
