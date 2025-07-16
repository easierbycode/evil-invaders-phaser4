import Phaser from "phaser";
import PROPERTIES from "https://codepen.io/CodeMonkeyGames/pen/rNERbzw.js";
import { LoadScene } from "https://codepen.io/CodeMonkeyGames/pen/LYKayQE.js";
import { OverloadScene } from "./scenes/OverloadScene";
import { EditorScene } from './scenes/EditorScene';
import { WIDTH, HEIGHT } from "./constants";
import { Player } from "./game-objects/player";
import { requestFullscreen } from "./utils/fullscreen";
import { applyAtlasOverrides } from './utils/helper-applyAtlasOverrides';

export class GameScene extends Phaser.Scene
{
  #startBtn!: Phaser.GameObjects.Sprite;
  player!: Player;

  constructor() { super('game-scene'); }

  async create()
  {
    // 1️⃣  Apply any local overrides before we use the atlas.
    await applyAtlasOverrides(this);

    // ⬇️ existing title‑screen logic (unchanged apart from this one line)
    // @ts-ignore
    window.gameScene = this;

    this.#startBtn = this.physics
      .add.sprite(WIDTH / 2, 330, 'game_ui', 'titleStartText.gif')
      .setInteractive();

    this.#startBtn.on('pointerup', () => {
      requestFullscreen(this.game.canvas);
      const pads = this.input.gamepad.gamepads;
      createPlayer(pads[0] || null);
    });

    const createPlayer = (gamepad: Phaser.Input.Gamepad.Gamepad) => {
      if (this.player) return;

      if (this.#startBtn) this.#startBtn.destroy();
      const alert = document.getElementById('gamepadAlert');
      if (alert) alert.style.display = 'none';

      const d = PROPERTIES.resource.recipe.data.playerData;

      this.player = new Player(d);
      this.player.setPosition(WIDTH / 2, HEIGHT - 48);
      this.player.gamepad = gamepad;
      this.player.speed = 150;

      this.player.update = () => {
        const pad = this.player.gamepad;
        if (!pad) return;
        const DEAD_ZONE = 0.1;
        const left  = pad.left  || pad.leftStick.x < -DEAD_ZONE;
        const right = pad.right || pad.leftStick.x > DEAD_ZONE;

        if (left)       this.player.body.setVelocityX(-this.player.speed);
        else if (right) this.player.body.setVelocityX(this.player.speed);
        else            this.player.body.setVelocityX(0);
      };
    };

    // Existing game‑pad hookup
    const firstPad = this.input.gamepad.gamepads.find(p => p?.connected);
    if (firstPad) createPlayer(firstPad);
    this.input.gamepad.once('connected', pad => createPlayer(pad));

    // 2️⃣  Hot‑key to open the atlas editor.
    this.input.keyboard.on('keydown-E', () => {
      this.scene.pause();              // freeze gameplay
      this.scene.launch('editor-scene');
    });
  }

  update() { if (this.player) this.player.update(); }
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
  scene: [LoadScene, OverloadScene, GameScene, EditorScene],
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