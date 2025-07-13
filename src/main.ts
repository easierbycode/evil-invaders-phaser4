import Phaser from "phaser";
import { Player } from "https://codepen.io/CodeMonkeyGames/pen/MWRrLqy.js";
import { WIDTH, HEIGHT } from "./constants";
import { WeaponPlugin } from "./weapons/weapon-plugin/index";

class GameScene extends Phaser.Scene {
  player!: Player;

  preload() {
    this.load.setBaseURL("https://assets.codepen.io/11817390/");
    this.load.atlas("atlas", "atlas.png", "atlas.json");
  }

  create() {
    // Expose handy refs for debugging
    // (optional: remove in production)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.gameScene = this;
    window.gameScene.GAME_WIDTH = WIDTH;
    window.gameScene.GAME_HEIGHT = HEIGHT;

    // Install the WeaponPlugin once per scene
    if (!this.weapons) {
      this.plugins.installScenePlugin(
        "WeaponPlugin",
        WeaponPlugin,
        "weapons",
        this
      );
    }

    /**
     * Instantiate the player once we detect a game-pad.
     */
    const createPlayer = (gamepad: Phaser.Input.Gamepad.Gamepad) => {
      if (this.player) return;

      this.player = new Player(this);
      this.player.setPosition(WIDTH / 2, HEIGHT - 48);
      this.player.gamepad = gamepad;
      this.player.speed = 150;

      // --- Custom player update (no more body.stop) ---
      this.player.update = () => {
        const pad = this.player.gamepad;
        if (!pad) return;

        const DEAD_ZONE = 0.1;
        const left =
          pad.left || pad.leftStick.x < -DEAD_ZONE;
        const right =
          pad.right || pad.leftStick.x > DEAD_ZONE;

        if (left) {
          this.player.body.setVelocityX(-this.player.speed);
        } else if (right) {
          this.player.body.setVelocityX(this.player.speed);
        } else {
          // Smoothly come to rest when no input present
          this.player.body.setVelocityX(0);
        }
      };
    };

    // Use an already-connected pad if present
    const firstPad = this.input.gamepad.gamepads.find((p) => p?.connected);
    if (firstPad) createPlayer(firstPad);

    // Otherwise wait for the first connection
    this.input.gamepad.once("connected", (pad) => createPlayer(pad));
  }

  update() {
    if (this.player) {
      this.player.update();
    }
  }
}

// ---------------------------------------------------------------------------

new Phaser.Game({
  width: WIDTH,
  height: HEIGHT,
  physics: {
    default: "arcade",
    arcade: {
      debug:
        Number(new URL(window.location.href).searchParams.get("debug")) === 1,
      gravity: { x: 0, y: 0 },
    },
  },
  parent: "game",
  scene: [GameScene],
  input: {
    gamepad: true,
    touch: true,
  },
  render: {
    pixelArt: true,
  },
  autoRound: true,
  roundPixels: true,
  disableContextMenu: true,
  plugins: {
    scene: [
      { key: "WeaponPlugin", plugin: WeaponPlugin, mapping: "weapons" },
    ],
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});