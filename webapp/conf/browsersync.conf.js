const conf = require('./gulp.conf');

module.exports = function() {
  return {
    port: 8080,
    server: {
      baseDir: [conf.paths.tmp, conf.paths.src]
    },
    open: false
  };
};
