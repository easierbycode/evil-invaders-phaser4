import Phaser from "phaser";
import { Player } from "https://codepen.io/CodeMonkeyGames/pen/MWRrLqy.js";
import { WIDTH, HEIGHT } from './constants';
import { WeaponPlugin } from './weapons/weapon-plugin/index';

class GameScene extends Phaser.Scene {
  player!: Player;

  preload() {
    this.load.setBaseURL("https://assets.codepen.io/11817390/");
    this.load.atlas("atlas", "atlas.png", "atlas.json");
  }

  create() {
    window.gameScene = this;
    window.gameScene.GAME_WIDTH = WIDTH;
    window.gameScene.GAME_HEIGHT = HEIGHT;

    // Initialize plugins (once per scene)
    if (!this.weapons) {
      this.plugins.installScenePlugin('WeaponPlugin', WeaponPlugin, 'weapons', this);
    }

    const createPlayer = (gamepad: Phaser.Input.Gamepad.Gamepad) => {
      if (this.player) return;
      this.player = new Player(this, WIDTH / 2, HEIGHT - 48);
      this.player.gamepad = gamepad;
    }

    // If a gamepad is already connected, let the player use it
    const firstPad = this.input.gamepad.gamepads.find(p => p?.connected);
    if (firstPad)  createPlayer(firstPad);

    // Listen for the first pad to connect afterwards
    this.input.gamepad.once('connected', pad => createPlayer(pad));
  }
}

// ---------------------------------------------------------------------------
new Phaser.Game({
  width: WIDTH,
  height: HEIGHT,
  physics: {
    default: "arcade",
    arcade: {
      debug: Number(new URL(window.location.href).searchParams.get('debug')) === 1,
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
  autoRound: true,
  disableContextMenu: true,
  plugins: {
    scene: [
      { key: 'WeaponPlugin', plugin: WeaponPlugin, mapping: 'weapons' }
    ]
  },
  scale: {
    mode: Phaser.Scale.FIT,   // safer than ENVELOP
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});
