module.exports = (config) => {
  config.set({
    frameworks: ['jasmine'],
    files: [
      { pattern: 'test/*_test.js', watched: false },
      { pattern: 'test/**/*_test.js', watched: false }
    ],

    preprocessors: {
      'test/*_test.js': [ 'webpack' ],
      'test/**/*_test.js': [ 'webpack' ]
    },

    webpack: {
    },

    webpackMiddleware: {
      stats: 'errors-only'
    },

    browsers: ['Chrome'],

    customLaunchers: {
      Chrome_without_security: {
        base: 'Chrome',
        flags: ['--disable-web-security']
      }
    }
  })
}
