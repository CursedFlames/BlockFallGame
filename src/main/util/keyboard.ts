

export interface IKeyboardState {
	readonly pressed: {[key: string]: boolean};
	readonly keyDowns: Set<string>;
	readonly keyUps: Set<string>;
}
export class KeyboardState implements IKeyboardState {
	enabled = true;
	pressed: {[key: string]: boolean} = {};
	keyDowns: Set<string> = new Set();
	keyUps: Set<string> = new Set();
	// /** this should only be used for debugging, when it's annoying to get the keyboard state elsewhere */
	// static INSTANCE: KeyboardState;

	constructor() {
		// KeyboardState.INSTANCE = this;
	}

	/**
	 * Should be called whenever there is a `keydown` event
	 * @param code event.code
	 */
	onKeyDown(code: string) {
		if (!this.enabled) return;
		// prevent keyDown unless not pressed, so we don't get repeated keyDowns from holding a key
		// probably not needed now that we check `event.repeat` first?
		if (!this.pressed[code]) {
			this.pressed[code] = true;
			this.keyDowns.add(code);
		}
	}
	/**
	 * Should be called whenever there is a `keyup` event
	 * @param code event.code
	 */
	onKeyUp(code: string) {
		if (!this.enabled) return;
		this.pressed[code] = false;
		this.keyUps.add(code);
	}
	/**
	 * Should be called whenever there is a `blur` event
	 */
	onBlur() {
		if (!this.enabled) return;
		for (let code in this.pressed) {
			this.pressed[code] = false;
		}
	}
	/**
	 * Should be called after each tick is executed, to reset keyDowns and keyUps.
	 */
	onPostTick() {
		if (!this.enabled) return;
		this.keyDowns.clear();
		this.keyUps.clear();
	}
}