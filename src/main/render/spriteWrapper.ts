import * as PIXI from "pixi.js";

interface DisplayLayers<T> {
	main: T;
	unlit: T;
	brightnessMulti: T;
	lightFalloff: T;
}

interface DisplayObjLayers<T extends PIXI.DisplayObject> extends DisplayLayers<T> {}

const displayLayers: (keyof DisplayObjLayers<PIXI.DisplayObject>)[] = [
	"main",
	"unlit",
	"brightnessMulti",
	"lightFalloff"
];

class Transform extends PIXI.Transform {
	/**
	 * Jank system to override the parent transform. Will be injected between regular parent
	 * and this, so parent -> override -> child.
	 */
	overrideParent?: PIXI.Transform;
	constructor(overrideParent?: PIXI.Transform) {
		super();
		if (overrideParent) {
			this.overrideParent = overrideParent;
		}
	}

	updateTransform(parent: PIXI.Transform) {
		if (this.overrideParent) {
			this.overrideParent.updateTransform(parent);
			super.updateTransform(this.overrideParent);
		} else {
			super.updateTransform(parent);
		}
		// This doesn't look necessary but I don't want to touch it,
		// in case past me knew more than present me
		super.updateTransform(this.overrideParent ?? parent);
	}

	// onChange() {
	// 	super.onChange();
	// 	for (let listener of this.changeListeners) {
	// 		listener();
	// 	}
	// }
}

// class ParentTransform extends Transform {

// }

// class ChildTransform extends Transform {	
// 	constructor(public parent: ParentTransform = new ParentTransform(),
// 			public offset: ParentTransform = new ParentTransform()) {
// 		super();
// 	}
// }

export class DisplayObjectWrapper<T extends PIXI.DisplayObject> {
	parent?: ContainerWrapper;
	readonly layers: DisplayObjLayers<T>;
	private transform: PIXI.Transform;

	constructor(layers: DisplayObjLayers<T>, parent?: ContainerWrapper,
			shareTransformWithLayers: boolean = true) {
		this.transform = new PIXI.Transform();
		this.layers = layers;
		let obj: PIXI.DisplayObject;
		if (shareTransformWithLayers) {
			for (obj of Object.values(layers)) {
				obj.transform = this.transform;
				// let transform = this.transform;
				// // TODO is this bind necessary?
				// let origUpdateTransform = obj.updateTransform.bind(obj);

				// // obj.updateTransform = function(this: PIXI.DisplayObject) {
				// // 	this.transform.updateTransform(transform)
				// // 	// origUpdateTransform();
				// // }.bind(obj);
			}
		} else {
			for (obj of Object.values(layers)) {
				obj.transform = Object.assign(new Transform(this.transform), obj.transform);
			}
		}
		if (parent) {
			parent.addChild(this);
		}
	}

	get x() {
		return this.transform.position.x;
	}

	set x(x: number) {
		this.transform.position.x = x;
	}

	get y() {
		return this.transform.position.y;
	}

	set y(y: number) {
		this.transform.position.y = y;
	}

	get position() {
		return this.transform.position;
	}

	set position(pos: PIXI.IPoint) {
		this.transform.position.copyFrom(pos);
		// this.onTransformChange();
	}

	get scale() {
		return this.transform.scale;
	}

	destroy() {
		for (let obj of Object.values(this.layers)) {
			obj.destroy();
		}
		if (this.parent) {
			this.parent.removeChild(this);
		}
	}
}

export class ContainerWrapper extends DisplayObjectWrapper<PIXI.Container> {
	children: DisplayObjectWrapper<any>[];

	constructor(parent?: ContainerWrapper) {
		let layers: Partial<DisplayObjLayers<PIXI.Container>> = {};
		for (let layer of displayLayers) {
			layers[layer] = new PIXI.Container();
		}
		super(<any>layers, parent);
		this.children = [];
	}

	addChild(child: DisplayObjectWrapper<any>) {
		if (child.parent) {
			child.parent.removeChild(child);
		}
		child.parent = this;
		this.children.push(child);
		for (let layer of displayLayers) {
			this.layers[layer].addChild(child.layers[layer]);
		}
	}

	removeChild(child: DisplayObjectWrapper<any>) {
		const index = this.children.indexOf(child);
		if (index === -1) return;
		child.parent = undefined;
		this.children.splice(index, 1);
		for (let layer of displayLayers) {
			this.layers[layer].removeChild(child.layers[layer]);
		}
	}
}

type TextureOrSprite = PIXI.Texture | PIXI.Sprite | (()=>PIXI.Sprite);
interface SpriteWrapperTextures extends DisplayLayers<TextureOrSprite> {}

export class SpriteWrapper extends DisplayObjectWrapper<PIXI.Sprite> {
	private _anchor: PIXI.ObservablePoint;

	constructor(textures: SpriteWrapperTextures, parent?: ContainerWrapper) {
		let layers: Partial<DisplayObjLayers<PIXI.Sprite>> = {};
		for (let layer of displayLayers) {
			let texture = textures[layer];
			if (texture instanceof PIXI.Sprite) {
				layers[layer] = texture;
			} else if (texture instanceof Function) {
				layers[layer] = texture();
			} else {
				layers[layer] = new PIXI.Sprite(texture);
			}
			layers[layer]!.pluginName = "gamebatch";
		}

		super(<any>layers, parent, false);
		let mainSprite: PIXI.Sprite | undefined = this.layers.main;

		this._anchor = new PIXI.ObservablePoint(this.onAnchorUpdate, this, 
			mainSprite?.anchor.x ?? 0,
			mainSprite?.anchor.y ?? 0);
		// ensure that the anchor is initialized correctly
		this.onAnchorUpdate();
	}

	get anchor() {
		return this._anchor;
	}

	set anchor(point: PIXI.Point) {
		this._anchor.copyFrom(point);
	}

	private onAnchorUpdate() {
		for (let sprite of Object.values(this.layers)) {
			sprite.anchor = this._anchor;
		}
	}

	// destroy() {
	// 	super.destroy();
	// 	// this._anchor.
	// }
}