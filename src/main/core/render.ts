import * as PIXI from "pixi.js";
import { Game } from "./game";
import { SCREEN_TEXEL_WIDTH, SCREEN_TEXEL_HEIGHT, INV_ASPECT_RATIO, ASPECT_RATIO } from "src/main/constants";
import { Upscaler } from "src/main/shader/upscale";
import { ContainerWrapper } from "../render/spriteWrapper";

/**
 * Update global uniforms without calling filterSys.pop. Note that this assumes that
 * the input and output texture are the same size, and will break if this is not the case
 */
function updateUniforms(filterSys: PIXI.systems.FilterSystem,
		outputTexture: PIXI.RenderTexture) {
	const globalUniforms = filterSys.globalUniforms.uniforms;

	const inputSize = globalUniforms.inputSize;
	const inputPixel = globalUniforms.inputPixel;
	const inputClamp = globalUniforms.inputClamp;

	inputSize[0] = outputTexture.width;
	inputSize[1] = outputTexture.height;
	inputSize[2] = 1.0 / inputSize[0];
	inputSize[3] = 1.0 / inputSize[1];

	inputPixel[0] = inputSize[0] * outputTexture.resolution;
	inputPixel[1] = inputSize[1] * outputTexture.resolution;
	inputPixel[2] = 1.0 / inputPixel[0];
	inputPixel[3] = 1.0 / inputPixel[1];

	inputClamp[0] = 0.5 * inputPixel[2];
	inputClamp[1] = 0.5 * inputPixel[3];
	inputClamp[2] = (outputTexture.width * inputSize[2]) - (0.5 * inputPixel[2]);
	inputClamp[3] = (outputTexture.height * inputSize[3]) - (0.5 * inputPixel[3]);

	(<any>filterSys.globalUniforms).update();
}

export class GameRenderer {
	// textures: PIXI.ITextureDictionary;

	hdrTexture: PIXI.RenderTexture;
	hdrTexture2: PIXI.RenderTexture;
	hdrFilter: PIXI.Filter;
	ldrTexture: PIXI.RenderTexture;
	ldrSprite: PIXI.Sprite;
	upscaler: Upscaler;

	outputStage: PIXI.Container;

	stage: ContainerWrapper;

	guiStage: PIXI.Container;
	guiTexture: PIXI.RenderTexture;

	defaultShader: PIXI.Filter;

	main_PreShader: PIXI.Filter;
	unlit_PreShader: PIXI.Filter;
	lightFalloff_PreShader: PIXI.Filter;

	main_PreTexture: PIXI.RenderTexture;
	unlit_PreTexture: PIXI.RenderTexture;
	brightnessMulti_PreTexture: PIXI.RenderTexture;
	lightFalloff_PreTexture: PIXI.RenderTexture;

	gBufferTexture: PIXI.RenderTexture;
	gBuffer: PIXI.Framebuffer;
	main_Texture: PIXI.Texture;
	unlit_Texture: PIXI.Texture;
	lightFalloff_Texture: PIXI.Texture;

	debugLightShader: PIXI.Filter;

	bloomTexture1: PIXI.RenderTexture;
	bloomTexture2: PIXI.RenderTexture;

	bloomInputShader: PIXI.Filter;

	bloomShader: PIXI.Filter;

	// debugGridShader: PIXI.Filter;

	// motionBlurTexture: PIXI.RenderTexture;
	// motionBlurSprite: PIXI.Sprite;
	// motionBlurTexture2: PIXI.RenderTexture;
	// motionBlurSprite2: PIXI.Sprite;

	renderer: PIXI.Renderer;

	upscaledWidth: number;
	upscaledHeight: number;
	texelScaleX: number;
	texelScaleY: number;

	view: HTMLCanvasElement;

	constructor(public readonly game: Game,
			view: HTMLCanvasElement, renderer: PIXI.Renderer,
			viewportWidth: number, viewportHeight: number) {
		this.view = view;
		this.outputStage = new PIXI.Container();
		this.renderer = renderer;
		let viewSize = this.calcViewSize(viewportWidth, viewportHeight);
		this.resizeToResolution(viewSize[0], viewSize[1], false);
	}

	// separated from constructor so it can be called once resource loading is done
	initMembers() {
		console.log("Renderer init");

		// this.textures = this.game.resources.get("textures/sheet1").textures!;

		this.defaultShader = new PIXI.Filter(undefined, undefined);

		this.hdrTexture = PIXI.RenderTexture.create(<any>{
			width: SCREEN_TEXEL_WIDTH,
			height: SCREEN_TEXEL_HEIGHT,
			format: PIXI.FORMATS.RGBA,
			type: PIXI.TYPES.HALF_FLOAT
		});
		this.hdrTexture2 = PIXI.RenderTexture.create(<any>{
			width: SCREEN_TEXEL_WIDTH,
			height: SCREEN_TEXEL_HEIGHT,
			format: PIXI.FORMATS.RGBA,
			type: PIXI.TYPES.HALF_FLOAT
		});
		this.hdrFilter = new PIXI.Filter(undefined, this.game.resources.get("shaders/fromHDR").data);

		// TODO merge HDR->RGBA8 step and upscale step, for efficiency?
		// might be slower due to operating on larger area. idk
		this.ldrTexture = PIXI.RenderTexture.create(<any>{
			width: SCREEN_TEXEL_WIDTH,
			height: SCREEN_TEXEL_HEIGHT,
			format: PIXI.FORMATS.RGBA,
			type: PIXI.TYPES.HALF_FLOAT
		});
		this.ldrSprite = new PIXI.Sprite(this.ldrTexture);
		this.upscaler = new Upscaler(this.game.resources.get("shaders/upscaleShader").data,
			this.texelScaleX, this.texelScaleY, false, true);
		this.ldrSprite.filters = [this.upscaler.filter];
		
		this.outputStage.addChild(this.ldrSprite);

		this.stage = new ContainerWrapper();

		this.guiStage = new PIXI.Container();
		this.guiTexture = PIXI.RenderTexture.create({
			width: SCREEN_TEXEL_WIDTH,
			height: SCREEN_TEXEL_HEIGHT
		});

		let preTextureOpts = {
			width: SCREEN_TEXEL_WIDTH,
			height: SCREEN_TEXEL_HEIGHT
		};
	
		this.main_PreTexture = PIXI.RenderTexture.create(preTextureOpts);
		this.unlit_PreTexture = PIXI.RenderTexture.create(preTextureOpts);
		this.brightnessMulti_PreTexture = PIXI.RenderTexture.create(preTextureOpts);
		this.lightFalloff_PreTexture = PIXI.RenderTexture.create(preTextureOpts);

		this.main_PreShader = new PIXI.Filter(
			this.game.resources.get("shaders/default/es3vert").data,
			this.game.resources.get("shaders/pre/main").data,
			{uSampler2: this.brightnessMulti_PreTexture});
		this.main_PreShader.blendMode = PIXI.BLEND_MODES.ADD;
		
		this.unlit_PreShader = new PIXI.Filter(
			this.game.resources.get("shaders/default/es3vert").data,
			this.game.resources.get("shaders/pre/unlit").data,
			{uSampler2: this.brightnessMulti_PreTexture});
		this.unlit_PreShader.blendMode = PIXI.BLEND_MODES.ADD;

		this.lightFalloff_PreShader = new PIXI.Filter(
			this.game.resources.get("shaders/default/es3vert").data,
			this.game.resources.get("shaders/pre/falloff").data,
			{uSampler2: this.brightnessMulti_PreTexture});
		this.lightFalloff_PreShader.blendMode = PIXI.BLEND_MODES.ADD;

		let hdrTextureOpts = {
			width: SCREEN_TEXEL_WIDTH,
			height: SCREEN_TEXEL_HEIGHT,
			format: PIXI.FORMATS.RGBA,
			type: PIXI.TYPES.HALF_FLOAT
		};

		this.gBufferTexture = PIXI.RenderTexture.create(hdrTextureOpts); // mainSprite_Texture
		this.gBuffer = <PIXI.Framebuffer> (<any>this.gBufferTexture.baseTexture).framebuffer;
		let gBuffer = <PIXI.Framebuffer & {colorTextures: PIXI.BaseTexture[]}> this.gBuffer;
		this.main_Texture = new PIXI.Texture(gBuffer.colorTextures[0]);
		gBuffer.addColorTexture(1, <any>new PIXI.BaseTexture(undefined, hdrTextureOpts));
		this.unlit_Texture = new PIXI.Texture(gBuffer.colorTextures[1]);
		gBuffer.addColorTexture(2, <any>new PIXI.BaseTexture(undefined, preTextureOpts)); // no HDR here
		this.lightFalloff_Texture = new PIXI.Texture(gBuffer.colorTextures[2]);

		this.debugLightShader = new PIXI.Filter(
			this.game.resources.get("shaders/default/es3vert").data,
			this.game.resources.get("shaders/debugLighting").data,
			{uSampler2: this.unlit_Texture,
				brightness: 0.5});

		this.bloomTexture1 = PIXI.RenderTexture.create(hdrTextureOpts);
		this.bloomTexture1.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
		this.bloomTexture2 = PIXI.RenderTexture.create(hdrTextureOpts);
		this.bloomTexture2.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;

		this.bloomInputShader = new PIXI.Filter(
			this.game.resources.get("shaders/default/es3vert").data,
			this.game.resources.get("shaders/bloominput").data);
		
		this.bloomShader = new PIXI.Filter(
			this.game.resources.get("shaders/default/es3vert").data,
			this.game.resources.get("shaders/blur").data,
			{direction: [1, 0]});
		// for the final output. doesn't matter otherwise since we clear before render anyway
		this.bloomShader.blendMode = PIXI.BLEND_MODES.ADD;

		// this.debugGridShader = new PIXI.Filter(
		// 	this.game.resources.get("shaders/default/es3vert").data,
		// 	this.game.resources.get("shaders/debug/grid").data);

		// this.motionBlurTexture = PIXI.RenderTexture.create(hdrTextureOpts);
		// this.motionBlurSprite = new PIXI.Sprite(this.motionBlurTexture);
		// this.motionBlurSprite.alpha = 0.25;
		// this.motionBlurTexture2 = PIXI.RenderTexture.create(hdrTextureOpts);
		// this.motionBlurSprite2 = new PIXI.Sprite(this.motionBlurTexture2);
		// this.motionBlurSprite2.alpha = 0.25;

		// Call resize again now that members are initialized
		// Maybe not necessary, but helps avoid initialization bugs
		this.resizeToResolution(this.upscaledWidth, this.upscaledHeight);
	}

	// parts of next two methods from here:
	// https://medium.com/@michelfariarj/scale-a-pixi-js-game-to-fit-the-screen-1a32f8730e9c
	// thanks, dude that wrote it
	private calcViewSize(vpw: number, vph: number): [number, number] {
		let nvw; // New game width
		let nvh; // New game height

		// The aspect ratio is the ratio of the screen's sizes in different dimensions.
		// The height-to-width aspect ratio of the game is HEIGHT / WIDTH.

		if (vph / vpw < INV_ASPECT_RATIO) {
			// If height-to-width ratio of the viewport is less than the height-to-width ratio
			// of the game, then the height will be equal to the height of the viewport, and
			// the width will be scaled.
			nvh = vph;
			nvw = nvh * ASPECT_RATIO;
		} else {
			// In the else case, the opposite is happening.
			nvw = vpw;
			nvh = nvw * INV_ASPECT_RATIO;
		}

		let pixelScaleX = /*Math.floor(*/nvw/SCREEN_TEXEL_WIDTH//);
		let pixelScaleY = /*Math.floor(*/nvh/SCREEN_TEXEL_HEIGHT//);

		// let innerWidth = pixelScaleX*SCREEN_TEXEL_WIDTH;
		// let innerHeight = pixelScaleY*SCREEN_TEXEL_HEIGHT;

		// let bufferX = Math.floor((nvw - innerWidth)/2);
		// let bufferY = Math.floor((nvh - innerHeight)/2);

		return [nvw, nvh]; //[innerWidth, innerHeight];
	}

	private resizeToResolution(nvw: number, nvh: number, initialized = true) {

		// Set the game screen size to the new values.
		// This command only makes the screen bigger --- it does not scale the contents of the game.
		// There will be a lot of extra room --- or missing room --- if we don't scale the stage.
		// TODO always take up the full screen, in case we want to render some guis regardless of aspect ratio?
		this.renderer.resize(nvw, nvh);

		let pixelScaleX = nvw/SCREEN_TEXEL_WIDTH;
		let pixelScaleY = nvh/SCREEN_TEXEL_HEIGHT;
		
		// masked area was for when we didn't allow non-integer scaling.
		// will want to reintroduce if we add an option to force integer scaling but allow gui outside it

		// maskedArea.x = bufferX;
		// maskedArea.y = bufferY;

		// maskedAreaMask.clear();
		// maskedAreaMask.beginFill(0xFFFFFF);
		// maskedAreaMask.drawRect(/*bufferX, bufferY,*/ 0, 0, innerWidth, innerHeight);
		// maskedAreaMask.endFill();

		// scaledArea.scale.set(pixelScaleX, pixelScaleY);

		// OUTPUT_WIDTH = innerWidth;
		// OUTPUT_HEIGHT = innerHeight;
		if (initialized) {
			this.upscaler.resize(pixelScaleX, pixelScaleY);

			this.ldrSprite.filterArea = new PIXI.Rectangle(0, 0, nvw, nvh);
			// this.postUpscaleTexture.resize(nvw, nvh);
			// this.postUpscaleSprite.filterArea = new PIXI.Rectangle(0, 0, nvw, nvh);
			this.outputStage.filterArea = new PIXI.Rectangle(0, 0, nvw, nvh);
		}

		this.upscaledWidth = nvw;
		this.upscaledHeight = nvh;
		this.texelScaleX = pixelScaleX;
		this.texelScaleY = pixelScaleY;
	}

	resize(vpw: number, vph: number) {
		this.resizeToResolution(...this.calcViewSize(vpw, vph));
	}

	drawFrame(tickCount: number, delta: number) {
		this.debugLightShader.uniforms.brightness = Math.sin((tickCount+delta)/120)*0.2+0.8;

		// If we had functional batched MRT this would be one draw call :V
		this.renderer.render(this.stage.layers.main, this.main_PreTexture);
		this.renderer.render(this.stage.layers.unlit, this.unlit_PreTexture);
		this.renderer.render(this.stage.layers.brightnessMulti, this.brightnessMulti_PreTexture);
		this.renderer.render(this.stage.layers.lightFalloff, this.lightFalloff_PreTexture);

		// TODO we might be able to modify these shader calls to only draw to a single texture?
		// see glDrawBuffers()
		// Since we're dealing with textures of the same size we only need updateUniforms once
		updateUniforms(this.renderer.filter, this.gBufferTexture);
		this.main_PreShader.apply(this.renderer.filter, this.main_PreTexture, this.gBufferTexture, true);

		this.unlit_PreShader.apply(this.renderer.filter, this.unlit_PreTexture, this.gBufferTexture, false);

		this.lightFalloff_PreShader.apply(
			this.renderer.filter, this.lightFalloff_PreTexture, this.gBufferTexture, false);
		
		this.debugLightShader.apply(
			this.renderer.filter, <any>this.main_Texture, this.hdrTexture, true);
		
		// this.defaultShader.apply(this.renderer.filter, this.hdrTexture, this.motionBlurTexture, true);
		// this.renderer.render(this.motionBlurSprite2, this.hdrTexture, true);
		// this.defaultShader.apply(this.renderer.filter, this.motionBlurTexture, this.hdrTexture, false);
		// [this.motionBlurSprite, this.motionBlurSprite2] = [this.motionBlurSprite2, this.motionBlurSprite];
		// [this.motionBlurTexture, this.motionBlurTexture2] = [this.motionBlurTexture2, this.motionBlurTexture];
		
		this.bloomInputShader.apply(
			this.renderer.filter, this.hdrTexture, this.bloomTexture1, true);

		let bloomIterations = 4;
		for (let i = 0; i < bloomIterations-1; i++) {
			this.bloomShader.uniforms.direction = i%2===0 ? [0.5, 0] : [0, 0.5];
			this.bloomShader.apply(
				this.renderer.filter, this.bloomTexture1, this.bloomTexture2, true);
			[this.bloomTexture1, this.bloomTexture2] = [this.bloomTexture2, this.bloomTexture1];
		}
		this.bloomShader.uniforms.direction = (bloomIterations-1)%2===0 ? [0.5, 0] : [0, 0.5];
		this.bloomShader.apply(
			this.renderer.filter, this.bloomTexture1, this.hdrTexture, false);

		updateUniforms(this.renderer.filter, this.ldrTexture);
		this.hdrFilter.apply(this.renderer.filter, this.hdrTexture, this.ldrTexture, true);

		this.renderer.render(this.guiStage, this.ldrTexture, false);

		// TODO just use upscale shader directly instead of doing this?
		// will need to handle uniforms in a different way,
		// since updateUniforms assumes same input and output size
		this.renderer.render(this.ldrSprite);
	}
}