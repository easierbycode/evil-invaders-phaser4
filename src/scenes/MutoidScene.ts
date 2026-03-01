import { Player } from "../game-objects/player";
import { Bullet } from "../game-objects/bullet";
import CONSTANTS from "./../constants";
const { GAME_WIDTH, GAME_HEIGHT } = CONSTANTS;
import PROPERTIES from "../properties";
import { requestFullscreen } from "../utils/fullscreen";
import { Mutoid } from "../game-objects/mutoid";
import Sound from './../soundManager';

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

    // Create bullet explosion animation using individual image frames
    this.anims.create({
      key: 'mutoid-bullet-explosion',
      frames: [
        { key: 'mutoid-bullet_s0' },
        { key: 'mutoid-bullet_s1' },
        { key: 'mutoid-bullet_s2' },
        { key: 'mutoid-bullet_s3' }
      ],
      frameRate: 20,
      repeat: 0
    });
  }

  create() {
    this.editorCreate();

    // Play background music
    Sound.bgmPlayLoop("mutoid_bgm", 0.4);

    this.mutoid = new Mutoid(this, 128, 80, this.secondLoop);

    // @ts-ignore
    window.gameScene = this;

    this.#startBtn = this.physics.add.sprite(GAME_WIDTH / 2, 330, 'game_ui', 'titleStartText.png').setInteractive();

    this.#startBtn.on('pointerup', () => {
      this.startGame();
    });

    // Existing game-pad hookup
    this.input.gamepad.once('connected', () => this.startGame());
  }

  private startGame() {
    void requestFullscreen(this.game.canvas);
    Sound.bgmPlayLoop("main_bgm", 0.4);
    const pads = this.input.gamepad.gamepads;
    this.createPlayer(pads[0] || null);
  }

  private createPlayer(gamepad: Phaser.Input.Gamepad.Gamepad | null) {
    if (this.player && this.player.active) {
      return;
    }

    if (this.#startBtn && this.#startBtn.active) {
      this.#startBtn.destroy();
    }

    // Only hide the page-level gamepad alert when running as Cordova (APK)
    if (window.cordova) {
      const alert = document.getElementById('gamepadAlert');
      if (alert) alert.style.display = 'none';
    }

    this.player = new Player(this.playerData);
    this.player.setUp(this.playerData.maxHp, this.playerData.defaultShootName, Player.SHOOT_SPEED_HIGH);
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
    const p = player as Player;
    const startY = p.y;
    p.onDamage(1);
    // Knockback player in opposite direction of collision
    const knockbackSpeed = 300;
    const knockbackX = p.x < mutoidPart.x ? -knockbackSpeed : knockbackSpeed;
    if (p.body instanceof Phaser.Physics.Arcade.Body) {
      p.body.velocity.x = knockbackX;
    }
    // Constrain Y position
    p.y = startY;
  }

  private handlePlayerMutoidBulletCollision(player: any, bullet: any) {
    const p = player as Player;
    const bulletInstance = bullet as Bullet;
    p.onDamage(1);
    
    // Create explosion effect at bullet's position
    const explosion = this.add.sprite(bulletInstance.x, bulletInstance.y, 'mutoid-bullet-explosion');
    explosion.on('animationcomplete', () => explosion.destroy());
    explosion.play('mutoid-bullet-explosion');
    
    bulletInstance.destroyBullet();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
