/* eslint-disable no-template-curly-in-string */
import type { Config } from 'release-it'

export default {
  git: {
    tagName: 'v${version}',
    commitMessage: 'release: v${version}',
  },
  npm: {
    publish: true,
  },
  github: {
    release: false,
    releaseName: 'release v${version}',
  },
  hooks: {
    'before:init': ['npm run build'],
    'after:release': ['echo Successfully released ${name} v${version} to ${repo.repository}.'],
  },
  plugins: {
    '@release-it/conventional-changelog': {
      infile: 'CHANGELOG.md',
      ignoreRecommendedBump: true,
      strictSemVer: true,
      preset: {
        name: 'conventionalcommits',
        types: [
          {
            type: 'feat',
            section: 'Features',
          },
          {
            type: 'fix',
            section: 'Bug Fixes',
          },
          {
            type: 'chore',
            section: 'Chores',
          },
          {
            type: 'refactor',
            section: 'Refactors',
          },
          {
            type: 'docs',
            section: 'Docs',
          },
          {
            type: 'style',
            section: 'Styles',
          },
          {
            type: 'perf',
            section: 'Performances',
          },
        ],
      },
    },
  },
} as Config
