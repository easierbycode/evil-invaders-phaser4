
import { Player } from "../game-objects/player";

// You can write more code here

/* START OF COMPILED CODE */

class GameScene extends Phaser.Scene {

	private player: Player;

	constructor() {
		super("GameScene");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */

	// Write your code here

	create() {
		this.player = new Player({ scene: this, texture: 'player' });

		this.input.on('pointerdown', () => {
			this.player.fireBullet();
		});

		window.gameScene = this;

		this.editorCreate();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
