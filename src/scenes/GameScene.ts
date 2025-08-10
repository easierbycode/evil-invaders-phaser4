import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export class GameScene extends Phaser.Scene {
	player: any;
	enemyGroup: any;
	stageEnemyPositionList: any;
	
	constructor() {
	super({ key: 'GameScene' });
	}

	preload() {
	this.load.pack("pack", "assets/asset-pack.json");
	}

	async create() {
	// Set pixel-perfect camera settings
	this.cameras.main.setRoundPixels(true);
	
	// Calculate and apply integer scaling
	this.setupIntegerScaling();
	
	// Listen for resize events
	this.scale.on('resize', this.setupIntegerScaling, this);
	}
	
	setupIntegerScaling() {
	const { width, height } = this.scale.gameSize;
	const { width: parentWidth, height: parentHeight } = this.scale.parentSize;
	
	// Calculate the maximum integer scale that fits
	const scaleX = Math.floor(parentWidth / GAME_WIDTH);
	const scaleY = Math.floor(parentHeight / GAME_HEIGHT);
	const scale = Math.max(1, Math.min(scaleX, scaleY));
	
	// Apply integer zoom to camera
	this.cameras.main.setZoom(scale);
	
	// Center the camera
	const scaledWidth = GAME_WIDTH * scale;
	const scaledHeight = GAME_HEIGHT * scale;
	const offsetX = (parentWidth - scaledWidth) / 2;
	const offsetY = (parentHeight - scaledHeight) / 2;
	
	// Adjust camera viewport to center the game
	this.cameras.main.setViewport(
		offsetX,
		offsetY,
		scaledWidth,
		scaledHeight
	);
	}
	
	update() {
	// Update logic handled in main.ts
	}
}
