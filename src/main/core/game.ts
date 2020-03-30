import { Player } from "./player";
import { KeyboardState, IKeyboardState } from "src/main/util/keyboard";
import { GameRenderer } from "./render";
import { ResourceManager } from "src/main/util/resourcemanager";
import { SCREEN_TEXEL_WIDTH, SCREEN_TEXEL_HEIGHT, BOX_TYPE } from "src/main/constants";
import * as PIXI from "pixi.js";
import { SpriteWrapper, ContainerWrapper, DisplayObjectWrapper } from "../render/spriteWrapper";
import { TextureUtil } from "src/main/util/texture";
import { Box, Entity } from "./entity";

class GameLoop {
	delta = 0;
	tickCount = 0;

	constructor(public tick: (tickCount: number)=>void,
			public drawFrame: (tickCount: number, delta: number)=>void) {}

	step(delta: number) {
		this.delta += delta;

		// console.log(this.delta);
		if (this.delta > 2) {
			this.delta = 2;
		}

		while(this.delta >= 1) {
			this.delta--;
			this.tickCount++;
			this.tick(this.tickCount);
		}
		
		this.drawFrame(this.tickCount, this.delta);
	}
}

const SPAWN_RATE_C = 1/30;
const SPAWN_RATE_B = 1/(28800);
const SPAWN_RATE_A = -1/(64*3600*3600);

export class Game {
	tickCount = 0;
	tickFreezeCount = 0;
	time = 0;
	partialBoxes = 1;
	maxVX = 2.5;
	partialHealBoxes = 0;
	hp = 8;
	started = false;
	lost = false;

	static Instance: Game;

	renderer: GameRenderer;
	loop: GameLoop;

	keyboardState: IKeyboardState;

	ticker: PIXI.Ticker;

	blockContainer: ContainerWrapper;
	playerContainer: ContainerWrapper;
	overlayContainer: ContainerWrapper;

	player: Player;
	healthbar: Entity;
	boxes: Box[];
	statusText: PIXI.BitmapText;


	constructor(public resources: ResourceManager,
			view: HTMLCanvasElement, renderer: PIXI.Renderer,
			ticker: PIXI.Ticker, keyboardState: KeyboardState,
			viewportWidth: number, viewportHeight: number) {
		Game.Instance = this;
		this.ticker = ticker;
		this.keyboardState = keyboardState;
		this.renderer = new GameRenderer(this, view, renderer, viewportWidth, viewportHeight);
		this.loop = new GameLoop(
				()=>this.tick(keyboardState),
				(tickCount, delta)=>this.renderer.drawFrame(tickCount, delta));
		resources.loadAll(()=>this.init());
	}

	spawnBlock(type: BOX_TYPE) {
		let width = 8;
		let height = 8;
		let vx = Math.random()*(this.maxVX-2)+2;
		let vy;
		if (type == BOX_TYPE.HEAL) {
			vx /= 2;
			vy = 0;
		} else {
			vy = Math.random()-0.5;
			if (vx > 4) {
				vy *= vx/4;
			}
		}
		let x = Math.floor(325+Math.random()*160);
		let y = Math.floor(Math.random()*(180-height));
		let box = new Box(new PIXI.Point(width, height), vx, vy, new PIXI.Point(x, y), type);
		this.boxes.push(box);
		this.blockContainer.addChild(box.display);
	}

	init() {
		this.renderer.initMembers();

		this.playerContainer = new ContainerWrapper();
		this.blockContainer = new ContainerWrapper();
		this.overlayContainer = new ContainerWrapper();

		this.renderer.stage.addChild(this.playerContainer);
		this.renderer.stage.addChild(this.blockContainer);
		this.renderer.stage.addChild(this.overlayContainer);

		this.statusText = new PIXI.BitmapText(
			`Press any key to start.`,
			{font: {name: "m5x7", size: 16}});
		this.statusText.position.set(100, 8);
		this.renderer.guiStage.addChild(this.statusText);

		for (let i = 0; i < 2; i++) {
			let main = TextureUtil.solidColorSprite("white", 1, 180);
			let brightnessMulti = TextureUtil.solidColorSprite("white", 1, 180);
			brightnessMulti.tint = 0x181818;
			let barrier = new SpriteWrapper({
				main: main,
				unlit: TextureUtil.solidColorSprite("black", 1, 180),
				brightnessMulti: brightnessMulti,
				lightFalloff: PIXI.Texture.EMPTY
			});
			barrier.position.x = (i === 0 ? 31 : 80);
			this.playerContainer.addChild(barrier);
		}
		
		this.player = new Player();
		this.playerContainer.addChild(this.player.display);

		this.healthbar = {
			position: new PIXI.Point(8, 8),
			display: new SpriteWrapper({
				main: TextureUtil.solidColorSprite("white", 8, 8),
				unlit: TextureUtil.solidColorSprite("black", 8, 8),
				brightnessMulti: TextureUtil.solidColorSprite("black", 8, 8),
				lightFalloff: PIXI.Texture.EMPTY
			})
		};
		this.healthbar.display!.position.set(8, 8);
		this.healthbar.display!.scale.y = this.hp;
		(<PIXI.Sprite>this.healthbar.display!.layers.main).tint = 0x00FF00;
		(<PIXI.Sprite>this.healthbar.display!.layers.brightnessMulti).tint = 0x404040;

		this.overlayContainer.addChild(this.healthbar.display!);

		this.boxes = [];

		console.log("Initialization complete");

		this.ticker.add((delta)=>this.loop.step(delta));
		this.ticker.start();
	}

	tick(keyboardState: KeyboardState) {
		if (this.tickFreezeCount > 0) {
			this.tickFreezeCount--;
			return;
		}

		if (this.lost) {
			this.lost = false;
			this.statusText.text += "\nPress any key to restart.";
		}

		if (!this.started) {
			if (keyboardState.keyDowns.size) {
				this.started = true;
				this.healthbar.display!.position.set(8, 8);
				for (let i = this.boxes.length-1; i >= 0; i--) {
					this.boxes[i].destroy();
				}
				this.boxes = [];
			} else {
				return;
			}
		}

		this.time++;
		this.statusText.text = `Time: ${Math.floor(this.time/60)}.${Math.floor(this.time*100/60)%100}s`;

		if (this.maxVX < 6) {
			this.maxVX += 1/(3*3600);
			if (this.maxVX > 6) {
				this.maxVX = 6;
			}
		}

		let incr = this.time >= 14400 ? 17/60 :
				(SPAWN_RATE_A*this.time*this.time + SPAWN_RATE_B*this.time + SPAWN_RATE_C);
		this.partialBoxes += incr;

		let healIncr = Math.min((0.005/3600)*this.time, 10/(this.time+100));
		this.partialHealBoxes += healIncr;

		while (this.partialBoxes >= 1) {
			this.spawnBlock(BOX_TYPE.DAMAGE);
			this.partialBoxes--;
		}
		if (this.partialHealBoxes >= 1 && Math.random() < 0.1) {
			this.spawnBlock(BOX_TYPE.HEAL);
			this.partialHealBoxes--;
		}
		
		this.player.onTick(keyboardState);

		for (let i = this.boxes.length-1; i >= 0; i--) {
			let box = this.boxes[i];
			box.onTick(keyboardState);

			if (box.position.x < -100) {
				this.boxes.splice(i, 1);
				box.destroy();
				continue;
			}

			if (box.position.x < this.player.position.x+8
					&& box.position.y < this.player.position.y+8
					&& box.position.x + box.size.x - 1 >= this.player.position.x
					&& box.position.y + box.size.y - 1 >= this.player.position.y) {
				this.boxes.splice(i, 1);
				box.destroy();
				if (box.type === BOX_TYPE.HEAL) {
					this.hp++;
				} else {
					this.hp--;
				}
				if (this.hp <= 0) {
					this.lose();
				} else {
					this.updateHealthBar();
				}
			}
		}
	
		keyboardState.onPostTick();
		this.tickCount++;
	}

	lose() {
		this.tickCount = 0;
		this.tickFreezeCount = 90;
		this.time = 0;
		this.partialBoxes = 1;
		this.maxVX = 2.5;
		this.partialHealBoxes = 0;
		this.hp = 8;
		this.started = false;
		this.lost = true;
		// just put it offscreen to hide it. kinda jank but whatever
		this.healthbar.display!.position.set(-100, 8);
		this.updateHealthBar();
	}

	updateHealthBar() {
		this.healthbar.display!.scale.y = this.hp;
	}
}