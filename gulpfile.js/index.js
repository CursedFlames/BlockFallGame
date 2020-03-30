const { series, parallel, src, dest } = require("gulp");
const typescript = require("gulp-typescript");
const glsl = require("./glsl");
const alias = require("gulp-ts-alias");
const run = require("gulp-run-command").default;

const project = typescript.createProject("tsconfig.json");

const clean = () => {return run("rm -rf build")()};

const makeOutputDirs = () => {
	return run("mkdir -p build/assets/shaders build/assets/fonts")()
};
// const texturePacker = () => {
// 	return run("free-tex-packer-cli \
// --project ./src/assets/spritesheet.ftpp \
// --output ./build/assets/textures")()
// };
const buildShaders = () => {
	return src("./src/assets/main/shaders/main/**/*.glsl")
		.pipe(glsl())
		.pipe(dest("build/assets/shaders/"))
};
const copyFonts = () => {
	return run("cp -r src/assets/main/fonts/. build/assets/fonts")();
};
const assets = series(makeOutputDirs, parallel(/*texturePacker, */buildShaders, copyFonts));

const ttsc = () => {return run("ttsc")()};
// const tsc = () => {
// 	// This has almost twice the runtime, due to not correctly using `--incremental`
// 	return src("./src/main/**/*.ts")
// 		.pipe(alias({configuration: project.config}))
// 		.pipe(project())
// 		.pipe(dest("build/src/"));
// };
const webpack = () => {return run("webpack")()};
const compile = series(ttsc, webpack);

const defaultTask = parallel(compile, assets);

exports.clean = clean;

// exports.textures = series(makeOutputDirs, texturePacker);
exports.shaders = series(makeOutputDirs, buildShaders);
exports.assets = assets;

exports.ttsc = ttsc;
// exports.tsc = tsc;
exports.compile = compile;
exports.default = defaultTask;