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

    const createPlayer = () => {
      if (this.player) return;
      this.player = new Player(this, WIDTH / 2, HEIGHT - 48);
      this.add.existing(this.player);
    }

    // If a gamepad is already connected, let the player use it
    const firstPad = this.input.gamepad.gamepads.find(p => p?.connected);
    if (firstPad) {
      createPlayer();
      // The Player class from CodePen auto‑detects the pad when constructed,
      // but if you expose a setter like `setPad` you could call it here.
      // (Remove this block if your Player handles input internally.)
      // this.player.setPad(firstPad);
    }

    // Listen for the first pad to connect afterwards
    this.input.gamepad.once('connected', pad => {
      createPlayer();
      // this.player.setPad(pad);
    });
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
