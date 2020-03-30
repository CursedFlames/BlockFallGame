const path = require('path');

module.exports = {
	entry: {
		"main": "./build/src/main.js"
	},
	output: {
		path: __dirname + "/build",
		filename: "bundle.[name].js"
	},
	mode: "production",
	optimization: {
		minimize: false,
		namedModules: true,
		namedChunks: true
	},
	performance: { // really large to make webpack *shut up*
		maxEntrypointSize: 4000000,
		maxAssetSize: 4000000
	},
	resolve: {
		modules: [
			path.resolve("./build"),
			path.resolve("./node_modules")
		],
	},
	plugins: [
	],
	module: {
		rules: [
		]
	}
};