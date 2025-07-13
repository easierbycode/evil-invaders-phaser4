import Phaser from "phaser";
import PROPERTIES from "https://codepen.io/CodeMonkeyGames/pen/rNERbzw.js";
import { LoadScene } from "https://codepen.io/CodeMonkeyGames/pen/LYKayQE.js";
import { WIDTH, HEIGHT } from "./constants";
import { Player } from "./game-objects/player";

class GameScene extends Phaser.Scene {
  player!: Player;

  constructor() {
    super('title-scene');
  }

  create() {
    // @ts-ignore
    window.gameScene = this;

    /**
     * Instantiate the player once we detect a game-pad.
     */
    const createPlayer = (gamepad: Phaser.Input.Gamepad.Gamepad) => {
      if (this.player) return;

      var d = PROPERTIES.resource.recipe.data.playerData;

      this.player = new Player(d);
      this.player.setPosition(WIDTH / 2, HEIGHT - 48);
      this.player.gamepad = gamepad;
      this.player.speed = 150;

      // --- Custom player update ---
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
  scene: [LoadScene, GameScene],
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
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});