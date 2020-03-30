const path = require("path");
const glsl = require("glslify");
const PluginError = require("plugin-error");
const through = require('through2');

// using this instead of gulp-glslify because that outputs `.js` files for whatever reason
const glslify = (options = {}) => {
	let stream = through.obj(function(file, encoding, cb) {
		if (file.isDirectory() || file.isNull() || file.isStream()) {
            return cb(null, file);
		}
		if (file.isStream()) {
			this.emit("error", new PluginError("gulp-glslify-cf", "Streams are unsupported"));
			return cb();
		}
		if (file.isBuffer()) {
			// auto-set basedir if it's not configured
			options.basedir = options.basedir || path.dirname(file.path);

			var content = String(file.contents);
			content = glsl(content, options);
			file.contents = Buffer.from(content);
			this.push(file);
			return cb();
		}
	});
	return stream;
};

module.exports = glslify;