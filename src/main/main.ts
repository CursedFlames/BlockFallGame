import * as PIXI from "pixi.js";
import { KeyboardState } from "./util/keyboard";
import { Game } from "./core/game";
import { ResourceManager } from "./util/resourcemanager";
import { GameBatchPluginFactory } from "src/main/render/gameBatchRenderer";

const gamebatch = GameBatchPluginFactory.create({});
PIXI.Renderer.registerPlugin('gamebatch', <any>gamebatch);

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

const loader = new PIXI.Loader("build/assets");

const rendererOpts = {
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: 0x070707
};

const renderer = PIXI.autoDetectRenderer(rendererOpts);


// not sure if doing this is necessary or has any effect
// but hey, probably doesn't hurt :shrug:
renderer.gl.getExtension("OES_texture_float");
renderer.gl.getExtension("EXT_color_buffer_float");

document.body.appendChild(renderer.view);

let keyboardState = new KeyboardState();
// TODO find set of keys that are safe to preventDefault() for
// - don't want to block F12, etc
window.addEventListener("keydown", event=>{
	// event.preventDefault();
	if (!event.repeat)
		keyboardState.onKeyDown(event.code);
});
window.addEventListener("keyup", event=>{
	// event.preventDefault();
	if (!event.repeat)
		keyboardState.onKeyUp(event.code);
});
window.addEventListener("blur", event=>{
	keyboardState.onBlur();
	// TODO pause on lost focus
});


let game = new Game(new ResourceManager(loader), renderer.view, renderer, new PIXI.Ticker(), keyboardState,
	window.innerWidth, window.innerHeight);

window.addEventListener("resize", ()=>game.renderer.resize(window.innerWidth, window.innerHeight));
