module.exports = (config) => {
  config.set({
    frameworks: ['jasmine'],
    files: [
      { pattern: 'test/**/*.js', watched: false }
    ],

    preprocessors: {
      'test/**/*.js': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool: 'inline-source-map',
      mode: 'development'
    },

    browsers: ['Chrome']
  })
}
