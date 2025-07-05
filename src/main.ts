import Phaser from "phaser";
import {
  Player
} from "https://codepen.io/CodeMonkeyGames/pen/MWRrLqy.js";
import { WIDTH, HEIGHT } from './constants';
import { WeaponPlugin } from './weapons/weapon-plugin/index';

class GameScene extends Phaser.Scene {
  [x: string]: any
  preload() {
    // this.load.pack("pack", "assets/asset-pack.json"); // ← created in the IDE
    this.load.setBaseURL("https://assets.codepen.io/11817390/");
    this.load.atlas("atlas", "atlas.png", "atlas.json");
  }
  create() {

    window.gameScene = this;
    window.gameScene.GAME_WIDTH = WIDTH;
    window.gameScene.GAME_HEIGHT = HEIGHT;

    // Initialize plugins
    if (!this.weapons) {
      this.plugins.installScenePlugin('WeaponPlugin', WeaponPlugin, 'weapons', this);
    }

    // Create game groups
    this.baddies = this.add.group();
    this.players = this.physics.add.group();

    this.setupGamepadListeners();
  }

  setupGamepadListeners() {
    const x = Number(this.game.config.width) / 2;

    this.input.gamepad?.on('connected', (gamepad: Phaser.Input.Gamepad.Gamepad) => {
      // Create a new player for this gamepad
      const playerIndex = this.players.getLength();

      const newPlayer = new Player(this);

      this.players.add(newPlayer);

      // If this is the first player, start the game
      if (playerIndex === 0) {
        // this.player = newPlayer;
        this.startGame();
      }
    });
  }

  startGame() {
    // // Load the first level
    // const level1 = {
    //   enemyList: [
    //     // Wave 1 - 10 basic enemies
    //     Array(10).fill().map(() => ({
    //       type: 'zombie',
    //       x: Phaser.Math.Between(100, WIDTH - 100),
    //       y: Phaser.Math.Between(100, HEIGHT - 100),
    //       health: 100
    //     })),

    //     // Wave 2 - 15 enemies, mix of basic and fast
    //     Array(15).fill().map((_, i) => ({
    //       type: i % 3 === 0 ? 'alien' : 'zombie',
    //       x: Phaser.Math.Between(100, WIDTH - 100),
    //       y: Phaser.Math.Between(100, HEIGHT - 100),
    //       health: 100,
    //       speed: i % 3 === 0 ? 200 : 100
    //     })),

    //     // Wave 3 - 20 enemies, harder mix
    //     Array(20).fill().map((_, i) => ({
    //       type: i % 2 === 0 ? 'alien' : 'zombie',
    //       x: Phaser.Math.Between(100, WIDTH - 100),
    //       y: Phaser.Math.Between(100, HEIGHT - 100),
    //       health: 150,
    //       speed: i % 2 === 0 ? 220 : 120
    //     }))
    //   ]
    // };

    // this.waveManager.loadLevel(level1);
  }
}

new Phaser.Game({
  width: WIDTH,
  height: HEIGHT,
  physics: {
    default: "arcade",
    arcade: {
      debug: Number(new URL(window.location.href).searchParams.get('debug')) == 1,
      gravity: { x: 0, y: 0 }
    }
  },
  parent: "game",
  scene: [GameScene],
  input: {
    gamepad: true,
    touch: true
  },
  render: {
    pixelArt: true
  },
  plugins: {
    scene: [
      { key: 'WeaponPlugin', plugin: WeaponPlugin, mapping: 'weapons' }
    ]
  },
  scale: {
    mode: Phaser.Scale.ENVELOP
  }
});
