/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{js,jsx,cjs,mjs,ts,tsx,html,vue,css,scss,json}': ['prettier --write', 'eslint --fix'],
  '*.md': ['prettier --write'],
}
