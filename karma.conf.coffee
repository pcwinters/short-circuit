module.exports = (config)->
  config.set
    browsers: ['PhantomJS']
    frameworks: ['mocha', 'browserify']
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'test/helper.js'
      'test/**/*.js'
    ]
    reporters: ['mocha']
    preprocessors:
      'test/helper.js': ['browserify']
      'test/**/*.js': ['browserify']
    client:
      mocha:
        reporter: 'html'
    browserify:
      watch: true
      debug: true
      configure: (bundle)->
        # https://github.com/glenjamin/skin-deep#errors-when-bundling
        bundle.exclude('react/lib/ReactContext')
        
    mochaReporter:
      output: 'autowatch'
    phantomjsLauncher:
      exitOnResourceError: true
