var through = require('through2');
var path = require('path');

/**
 * For every file to be bundled, scan and replace any imports from
 * 'short-circuit' with src folder paths.
 *
 * @param {Stream} file
 * @returns {Stream}
 */
module.exports = function (file) {
    return through(function (buf, enc, next) {
        var dirname = path.dirname(file);
        var resolved = path.resolve(__dirname + '/src/');
        var relative = path.relative(dirname, resolved) || './';
        this.push(buf.toString('utf8').replace(/from\s'short-circuit/g, 'from \'' + relative));
        next();
    });
};
