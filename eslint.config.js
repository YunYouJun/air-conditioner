import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'apps/macos/.build',
    'apps/macos/build',
  ],
  rules: {
    'no-use-before-define': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/display-name': 'off',
  },
})
