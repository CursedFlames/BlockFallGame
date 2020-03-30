import * as PIXI from "pixi.js";

// TODO make an actual resource manager
export class ResourceManager {
	// resourceCache: Map<string, any> = new Map();

	constructor(public loader: PIXI.Loader) {
		// loader.use(PIXI.BitmapFontLoader.use);
	}

	loadAll(onComplete: ()=>void) {
		// TODO handle failed loading gracefully
		this.loader.reset();
		this.loader.onError.add((a: any)=>console.log(a))
		this.loader
			// .use(PIXI.BitmapFontLoader.use)
			.add("shaders/default/es3vert", "shaders/default/es3vert.glsl")
			.add("shaders/default/es3frag", "shaders/default/es3frag.glsl")
			.add("shaders/pre/main", "shaders/pre/main.glsl")
			.add("shaders/pre/unlit", "shaders/pre/unlit.glsl")
			.add("shaders/pre/falloff", "shaders/pre/falloff.glsl")
			.add("shaders/toHDR", "shaders/preprocess.glsl")
			.add("shaders/fromHDR", "shaders/postlighting.glsl")
			.add("shaders/upscaleShader", "shaders/upscale.glsl")
			.add("shaders/debugLighting", "shaders/debuglighting.glsl")
			.add("shaders/bloominput", "shaders/bloomsplit.glsl")
			.add("shaders/blur", "shaders/blur.glsl")
			// .add("shaders/debug/grid", "shaders/grid.glsl")
			.add("fonts/m5x7_16", "fonts/m5x7_medium_16.xml");
		console.log("all resources queued");
		this.loader.load(()=>{
			console.log("loading complete");
			console.log(this.loader.resources);
			onComplete();
		});
	}

	get(loc: string) {
		return this.loader.resources[loc];
	}
}