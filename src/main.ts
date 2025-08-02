import Phaser from "phaser";
import PROPERTIES from "https://codepen.io/CodeMonkeyGames/pen/rNERbzw.js";
// import { LoadScene } from "https://codepen.io/CodeMonkeyGames/pen/LYKayQE.js";
import { LoadScene } from "./scenes/LoadScene";
import { OverloadScene } from "./scenes/OverloadScene";
import { EditorScene } from './scenes/EditorScene';
import { WIDTH, HEIGHT } from "./constants";
import { Player } from "./game-objects/player";
import { requestFullscreen } from "./utils/fullscreen";
import { applyAtlasOverrides } from './utils/helper-applyAtlasOverrides';
import { setupSecretTouchHandler } from "./utils/helper-checkForSecretTouch";
import { PackerScene } from "./scenes/PackerScene";

export class GameScene extends Phaser.Scene
{
  #startBtn!: Phaser.GameObjects.Sprite;
  player!: Player;
  waveInterval = 80;
  frameCnt = 0;
  waveCount = 0;
  backgroundDeepest!: Phaser.GameObjects.TileSprite;
  backgroundMiddle!: Phaser.GameObjects.TileSprite;
  prevCameraY = 0;
  

  constructor() { super('game-scene'); }

  preload() {
    const baseUrl = import.meta.env.BASE_URL || '/';
    this.load.pack("pack", `${baseUrl}assets/asset-pack.json`);
    
    // Load space background images - these need to be in your assets folder
    // You'll need to copy these from stg-game-engine/images/background/
    this.load.image('stars-bg', `${baseUrl}assets/background/stars.png`);
    this.load.image('corridor-bg', `${baseUrl}assets/background/corridor.png`);

    this.load.json(
      'game.json',
      'https://assets.codepen.io/11817390/evil_invaders.json'
    );

    this.load.atlas(
      'game_ui',
      'https://assets.codepen.io/11817390/game_ui.png',
      'https://assets.codepen.io/11817390/game_ui.json'
    );
    
    // Add error handling for missing assets
    this.load.on('loaderror', (file) => {
      console.warn(`Failed to load: ${file.key} from ${file.url}`);
    });
  }

  async create()
  {
    // 0️⃣  Secret touch to launch editor.
    setupSecretTouchHandler(this, WIDTH, HEIGHT, this.launchEditor.bind(this));
    
    // Create background layers only if textures are loaded
    if (this.textures.exists('stars-bg')) {
      this.backgroundDeepest = this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'stars-bg');
      this.backgroundDeepest.setOrigin(0, 0);
      this.backgroundDeepest.setScrollFactor(0);
      this.backgroundDeepest.setDepth(-2); // Ensure it's behind everything
    } else {
      console.warn('Stars background not found - using solid color fallback');
      this.cameras.main.setBackgroundColor('#000033');
    }
    
    if (this.textures.exists('corridor-bg')) {
      this.backgroundMiddle = this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'corridor-bg');
      this.backgroundMiddle.setOrigin(0, 0);
      this.backgroundMiddle.setScrollFactor(0);
      this.backgroundMiddle.setAlpha(0.6); // Make middle layer semi-transparent
      this.backgroundMiddle.setDepth(-1); // Above deepest but behind game objects
    }

    // 1️⃣  Hot‑key to launch editor.
    this.input.keyboard.on('keydown-E', () => this.launchEditor());
    
    // 2️⃣  Apply overrides before we use the atlas.
    await applyAtlasOverrides(this);

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
      this.player.unitX = WIDTH / 2;
      this.player.unitY = HEIGHT - 48;
      this.player.gamepad = gamepad ?? null;
      this.player.gamepadIndex = gamepad ? gamepad.index : -1;
      this.player.gamepadVibration = gamepad?.vibrationActuator ?? null;
      this.player.speed = 150;

  this.player.body.setCollideWorldBounds(true);

  const originalUpdate = this.player.update.bind(this.player);
  this.player.update = () => {
    if (!this.player || !this.player.body) return;
    
    const pad = this.player.gamepad;
    if (!pad) return;
    
    // Handle gamepad input for shooting
    this.player.handleGamepadInput(pad);
    
    const DEAD_ZONE = 0.1;
    const left  = pad.left  || pad.leftStick.x < -DEAD_ZONE;
    const right = pad.right || pad.leftStick.x > DEAD_ZONE;

    const moveSpeed = 6; // pixels per frame
    if (left) {
      this.player.unitX -= moveSpeed;
    } else if (right) {
      this.player.unitX += moveSpeed;
    }
    
    // Clamp unitX to screen bounds accounting for player width
    // When origin is (0,0): ensure the full sprite stays on screen
    this.player.unitX = Phaser.Math.Clamp(
      this.player.unitX,
      0,
      WIDTH - this.player.width
    );

    // Call original update to handle movement lerp and shooting logic
    originalUpdate();
  };
};

    // Existing game‑pad hookup
    const firstPad = this.input.gamepad.gamepads.find(p => p?.connected);
    if (firstPad) createPlayer(firstPad);
    this.input.gamepad.once('connected', pad => createPlayer(pad));


    this.enemyGroup = this.physics.add.group();

    this.stageEnemyPositionList = PROPERTIES.resource.recipe.data[
      "stage" + PROPERTIES.stageId
    ].enemylist
      .slice()
      .reverse();
  }

  update() {
    this.frameCnt++;

    if (this.player && this.player.active) this.player.update();
    
    // Parallax scrolling effect - only if backgrounds exist
    if (this.backgroundDeepest || this.backgroundMiddle) {
      // Continuously scroll backgrounds downward at different speeds
      if (this.backgroundDeepest) {
        this.backgroundDeepest.tilePositionY -= 0.5;  // Slowest layer (furthest back)
      }
      if (this.backgroundMiddle) {
        this.backgroundMiddle.tilePositionY -= 1.5;   // Faster layer (closer)
      }
    }

    // launch enemyWave() every 80 frames
    if (this.frameCnt % this.waveInterval === 0)  this.enemyWave();
  }

  enemyWave() {
    if (this.waveCount >= this.stageEnemyPositionList.length) {
      console.log("All waves completed");
      return;
    }

    const wave = this.stageEnemyPositionList[this.waveCount];
    wave.forEach((enemyCode, positionIndex) => {
      if (enemyCode !== "00") {
        const enemyType = String(enemyCode).substr(0, 1);
        const itemType = String(enemyCode).substr(1, 2);

        const enemyData = PROPERTIES.resource.recipe.data.enemyData[
          `enemy${enemyType}`
        ];
        if (!enemyData) {
          console.warn(`Enemy type ${enemyType} not found.`);
          return;
        }

        console.log({enemyData});

        // const enemy = new Enemy({
        //   name: enemyData.name,
        //   interval: enemyData.interval,
        //   score: enemyData.score,
        //   hp: enemyData.hp,
        //   speed: enemyData.speed,
        //   cagage: enemyData.cagage,
        //   texture: enemyData.texture,
        //   explosion: enemyData.explosionTextures,
        //   projectileData: enemyData.projectileData,
        //   physics: enemyData.physics,
        //   autoPlay: enemyData.autoPlay,
        //   itemName: itemType,
        //   itemTexture: enemyData.itemTexture || null
        // });

        // enemy.x = enemy.width / 2 + 32 * positionIndex;
        // enemy.y = -32;

        // this.enemyGroup.add(enemy);
        // enemy.on(Enemy.CUSTOM_EVENT_PROJECTILE_ADD, () => {
        //   console.log(`Projectile added by ${enemy.name}`);
        // });
        // enemy.on(Enemy.CUSTOM_EVENT_DEAD_COMPLETE, () => {
        //   console.log(`${enemy.name} is completely destroyed.`);
        // });
      }
    });

    this.waveCount++;
  }

  async launchEditor() {
    // Flash screen red and shake to indicate secret found
    this.cameras.main.flash(500, 255, 0, 0);
    this.cameras.main.shake(500, 0.02);
    
    // Wait for effects to complete before showing editor
    await new Promise(resolve => this.time.delayedCall(600, resolve));
    
    this.scene.pause();              // freeze gameplay
    // this.scene.launch('editor-scene');
    this.scene.launch('packer-scene');

    // Re-enable input when editor scene stops
    // this.scene.get('editor-scene').events.once('shutdown', () => {
    this.scene.get('packer-scene').events.once('shutdown', () => {
      if (this.#startBtn) {
        this.#startBtn.setInteractive();
      }
    });
  }

  shutdown() {
    // Clean up player when scene shuts down
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
  }
}

// ---------------------------------------------------------------------------

function onDeviceReady() {
  const appElement = document.getElementsByClassName("app")[0];
  if (appElement) {
    appElement.setAttribute("style", "display:none");
  }

  globalThis.__PHASER_GAME__ = new Phaser.Game({
  parent: "game",
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
  scene: [LoadScene, OverloadScene, GameScene, EditorScene, PackerScene],
  input: {
    gamepad: true,
    /*
     * Pointer 0 is always reserved for the mouse.
     * We want two fingers at the same time, so we need
     * mouse (0) + finger‑1 + finger‑2  → 3 total.
     * On mobile the "mouse" pointer never fires, but
     * it still counts toward the total.
     */
    activePointers: 3,

    // Optional but useful: stop the page scrolling
    touch: { capture: true }
  },
  render: {
    pixelArt: true,
    antialias: false,
    antialiasGL: false,
    mipmapFilter: 'NEAREST',
    roundPixels: true
  },
  autoRound: true,
  roundPixels: true,
  disableContextMenu: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game',
    width: WIDTH,
    height: HEIGHT
  },
})};

document.addEventListener('deviceready', onDeviceReady, false);

if (!window.cordova) {
  setTimeout(() => {
    const event = new Event('deviceready');
    document.dispatchEvent(event);
  }, 50);
}