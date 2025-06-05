import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  formatters: true,
  ignores: ['**/*.md'],
  stylistic: {
    overrides: {
      'antfu/if-newline': 'off',
      'style/operator-linebreak': [
        'error',
        'after',
        { overrides: { '?': 'before', ':': 'before', '=': 'ignore' } },
      ],
    },
  },
})
