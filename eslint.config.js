import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Build output and the vendored, minified Stockfish engine are not our code.
  globalIgnores(['dist', 'public/stockfish.js']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // The react-hooks v7 plugin ships several stricter, opinion-based rules
      // (reading refs during render, setState-in-effect, etc.). They flag
      // working, intentional patterns throughout the app, so we surface them
      // as warnings rather than failing the build on a style preference.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
  // Node-side tooling: build/validation scripts and unit tests.
  {
    files: ['scripts/**/*.{js,mjs}', '**/*.test.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
])
