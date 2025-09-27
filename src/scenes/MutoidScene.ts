import { Player } from "../game-objects/player";
import { Bullet } from "../game-objects/bullet";
import CONSTANTS from "./../constants";
const { GAME_WIDTH, GAME_HEIGHT } = CONSTANTS;
import PROPERTIES from "../properties";
import { requestFullscreen } from "../utils/fullscreen";
import { Mutoid } from "../game-objects/mutoid";

/* START OF COMPILED CODE */

export default class MutoidScene extends Phaser.Scene {

  constructor() {
    super("MutoidScene");
    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    this.events.emit("scene-awake");
  }

  private secondLoop!: boolean;
  #startBtn!: Phaser.GameObjects.Sprite;

  private player!: Player;
  private mutoid!: Mutoid;

  /* START-USER-CODE */
  // Write your code here

  explosionTextures: string[] = [];
  playerData: any = null;


  init(data: { secondLoop?: boolean }) {
    this.secondLoop = data.secondLoop || false;
    this.playerData = PROPERTIES.resource.recipe.data.playerData;
    this.explosionTextures = Array.from({ length: 7 }, (_, s) => `explosion0${s}.png`);
    this.playerData.explosionTextures = this.explosionTextures;
  }

  create() {
    this.editorCreate();

    this.mutoid = new Mutoid(this, 128, 80, this.secondLoop);

    // @ts-ignore
    window.gameScene = this;

    this.#startBtn = this.physics.add.sprite(GAME_WIDTH / 2, 330, 'game_ui', 'titleStartText.png').setInteractive();

    this.#startBtn.on('pointerup', () => {
      requestFullscreen(this.game.canvas);
      const pads = this.input.gamepad.gamepads;
      this.createPlayer(pads[0] || null);
    });

    // Existing game-pad hookup
    this.input.gamepad.once('connected', pad => this.createPlayer(pad));
  }

  private createPlayer(gamepad: Phaser.Input.Gamepad.Gamepad | null) {
    if (this.player && this.player.active) {
      return;
    }

    if (this.#startBtn.active) {
      this.#startBtn.destroy();
    }

    // Only hide the page-level gamepad alert when running as Cordova (APK)
    if (window.cordova) {
      const alert = document.getElementById('gamepadAlert');
      if (alert) alert.style.display = 'none';
    }

    this.player = new Player(this.playerData);
    this.player.setUp(this.playerData.maxHp, this.playerData.defaultShootName, this.playerData.defaultShootSpeed);
    this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 48);
    this.player.unitX = GAME_WIDTH / 2;
    this.player.unitY = GAME_HEIGHT - 48;
    this.player.gamepad = gamepad ?? null;
    this.player.gamepadIndex = gamepad ? gamepad.index : -1;
    this.player.gamepadVibration = gamepad?.vibrationActuator ?? null;
    this.player.speed = 150;

    this.mutoid.setPlayer(this.player);

    // Bullets should only collide with destructible parts
    this.physics.add.collider(this.player.bulletGroup, this.mutoid.parts, this.handleBulletMutoidCollision as any, undefined, this);

    // Player should collide with both destructible and solid parts and take damage
    this.physics.add.collider(this.player, this.mutoid.parts, this.handlePlayerMutoidCollision, undefined, this);
    this.physics.add.collider(this.player, this.mutoid.solidParts, this.handlePlayerMutoidCollision, undefined, this);
    // Player takes damage from mutoid bullets
    this.physics.add.collider(this.player, this.mutoid.bulletGroup, this.handlePlayerMutoidBulletCollision, undefined, this);

    this.player.on((Player as any).CUSTOM_EVENT_DEAD_COMPLETE, () => {
      this.time.delayedCall(1000, () => {
        this.scene.restart({ secondLoop: this.secondLoop });
      });
    });
  }

  update() {
    if (this.player && this.player.active) this.player.update();
  }

  private handleBulletMutoidCollision(bullet: any, mutoidPart: any) {
    this.mutoid.handleBulletCollision(bullet as Bullet, mutoidPart as Phaser.GameObjects.GameObject);
  }

  private handlePlayerMutoidCollision(player: any, mutoidPart: any) {
    (player as Player).onDamage(1);
  }

  private handlePlayerMutoidBulletCollision(player: any, bullet: any) {
    const bulletInstance = bullet as Bullet;
    (player as Player).onDamage(1);
    bulletInstance.destroyBullet();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here