
// You can write more code here

import { Player } from "../game-objects/player";
import { WeaponPlugin } from 'https://esm.sh/phaser3-weapon-plugin@2.2.1';
import CONSTANTS from "./../constants";
const { GAME_WIDTH, GAME_HEIGHT } = CONSTANTS;
import PROPERTIES from "../properties";
import { requestFullscreen } from "../utils/fullscreen";

// These constants define the size and positioning of the mutoid parts.
const MUTOID_HEIGHT = 104;
const HEAD_OFFSET_FROM_TORSO_TOP = 8;
const HEAD_FRAME = "atlas_s0";
const TREAD_FRAME = "atlas_s0";
const TREAD_FPS = 4;


/* START OF COMPILED CODE */

export default class MutoidScene extends Phaser.Scene {

  constructor() {
    super("MutoidScene");

    /* START-USER-CTR-CODE */
    // Write your code here.
    this.secondLoop = Number(new URL(window.location.href).searchParams.get("secondLoop")) === 1;
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {

    // mutoidContainer
    const mutoidContainer = this.add.container(128, 80);

    this.mutoidContainer = mutoidContainer;

    this.events.emit("scene-awake");
  }

  private mutoidContainer!: Phaser.GameObjects.Container;
  private secondLoop!: boolean;
  #startBtn!: Phaser.GameObjects.Sprite;
  playerWeapon: any;

  private mutoidArmsHp = 10;
  private mutoidTorsoHp = 20;
  private isTorsoDestroying = false;
  private armLeft!: Phaser.GameObjects.Image;
  private armRight!: Phaser.GameObjects.Image;
  private torsoLeft!: Phaser.GameObjects.Image;
  private torsoRight!: Phaser.GameObjects.Image;
  private head!: Phaser.GameObjects.Sprite;

  /* START-USER-CODE */
  // Write your code here

  create() {
    this.plugins.installScenePlugin(
        'WeaponPlugin',
        WeaponPlugin,
        'weapons',
        this
    );

    this.editorCreate();

    this.playerWeapon = this.weapons.add(30, 'bullet');

    this.mutoidContainer.removeAll(true);

    this.torsoLeft = this.add.image(0, 0, "mutoid-torso").setOrigin(0, 0);
    this.torsoRight = this.add.image(0, 0, "mutoid-torso").setOrigin(0, 0).setFlipX(true);
    const tankLeft = this.add.image(0, 0, "mutoid-tank").setOrigin(0, 1);
    const tankRight = this.add.image(0, 0, "mutoid-tank").setOrigin(0, 1).setFlipX(true);
    const treadLeft = this.add.sprite(0, 0, "mutoid-tank-tread", TREAD_FRAME).setOrigin(1, 1);
    const treadRight = this.add.sprite(0, 0, "mutoid-tank-tread", TREAD_FRAME).setOrigin(0, 1).setFlipX(true);
    const treadFrontLeft = this.add.sprite(0, 0, "mutoid-tank-tread-front", TREAD_FRAME).setOrigin(0, 0);
    const treadFrontRight = this.add.sprite(0, 0, "mutoid-tank-tread-front", TREAD_FRAME).setOrigin(1, 0).setFlipX(true);
    this.head = this.add.sprite(0, 0, "mutoid-head", HEAD_FRAME).setOrigin(0.5, 0);
    this.armLeft = this.add.image(0, 0, "mutoid-arm").setOrigin(1, 0);
    this.armRight = this.add.image(0, 0, "mutoid-arm").setOrigin(1, 0).setFlipX(true);

    const tankScale = MUTOID_HEIGHT / tankLeft.displayHeight;
    tankLeft.setScale(tankScale);
    tankRight.setScale(tankScale);
    treadLeft.setScale(tankScale);
    treadRight.setScale(tankScale);
    treadFrontLeft.setScale(tankScale);
    treadFrontRight.setScale(tankScale);

    this.mutoidContainer.add([
      treadFrontLeft,
      treadFrontRight,
      treadLeft,
      treadRight,
      tankLeft,
      tankRight,
      torsoLeft,
      torsoRight,
      armLeft,
      armRight,
      head,
    ]);

    this.ensureAnimation("mutoid-tank-tread-spin", "mutoid-tank-tread");
    this.ensureAnimation("mutoid-tank-tread-front-spin", "mutoid-tank-tread-front");

    treadLeft.play({ key: "mutoid-tank-tread-spin" });
    treadRight.play({ key: "mutoid-tank-tread-spin" });
    treadFrontLeft.play({ key: "mutoid-tank-tread-front-spin" });
    treadFrontRight.play({ key: "mutoid-tank-tread-front-spin" });

    const tankWidth = tankLeft.displayWidth;
    const torsoWidth = torsoLeft.displayWidth;
    const armWidth = armLeft.displayWidth;

    tankLeft.setPosition(-tankWidth, MUTOID_HEIGHT);
    tankRight.setPosition(0, MUTOID_HEIGHT);

    treadLeft.setPosition(-tankWidth, MUTOID_HEIGHT);
    treadRight.setPosition(tankWidth, MUTOID_HEIGHT);

    const treadLeftLeftEdge = treadLeft.x - treadLeft.displayWidth;
    const treadRightRightEdge = treadRight.x + treadRight.displayWidth;

    treadFrontLeft.setPosition(treadLeftLeftEdge + 1, treadLeft.y - 1);

    treadFrontRight.setPosition(treadRightRightEdge - 1, treadRight.y - 1);

    torsoLeft.setPosition(-torsoWidth, 0);
    torsoRight.setPosition(0, 0);

    armLeft.setPosition(-torsoWidth + 15, 2);
    armRight.setPosition(armWidth + torsoWidth - 15, 2);

    head.setPosition(0, -HEAD_OFFSET_FROM_TORSO_TOP);

    const sprites = [
      torsoLeft,
      torsoRight,
      tankLeft,
      tankRight,
      treadLeft,
      treadRight,
      treadFrontLeft,
      treadFrontRight,
      armLeft,
      armRight,
      head,
    ];

    const leftmost = Math.min(
      ...sprites.map((sprite) => sprite.x - sprite.displayWidth * sprite.originX)
    );
    const rightmost = Math.max(
      ...sprites.map((sprite) => sprite.x + sprite.displayWidth * (1 - sprite.originX))
    );
    const topmost = Math.min(
      ...sprites.map((sprite) => sprite.y - sprite.displayHeight * sprite.originY)
    );
    const bottommost = Math.max(
      ...sprites.map((sprite) => sprite.y + sprite.displayHeight * (1 - sprite.originY))
    );

    this.mutoidContainer.setSize(rightmost - leftmost, bottommost - topmost);

    this.ensureExplicitAnimation("mutoid-head-forward", "mutoid-head", ["atlas_s5", "atlas_s0"], 5, -1);
    const headBackFrames = this.secondLoop
      ? ["atlas_s1", "atlas_s2", "atlas_s3"]
      : ["atlas_s1", "atlas_s2", "atlas_s3", "atlas_s3"];
    this.ensureExplicitAnimation("mutoid-head-back", "mutoid-head", headBackFrames, 2, 0);

    head.setFrame(HEAD_FRAME);

    this.animateMutoid(head);

    // @ts-ignore
    window.gameScene = this;

    this.#startBtn = this.physics
      .add.sprite(GAME_WIDTH / 2, 330, 'game_ui', 'titleStartText.png')
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

      this.player = new Player(d, this.playerWeapon);
      this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 48);
      this.player.unitX = GAME_WIDTH / 2;
      this.player.unitY = GAME_HEIGHT - 48;
      this.player.gamepad = gamepad ?? null;
      this.player.gamepadIndex = gamepad ? gamepad.index : -1;
      this.player.gamepadVibration = gamepad?.vibrationActuator ?? null;
      this.player.speed = 150;

      const mutoidParts = this.physics.add.group([this.armLeft, this.armRight, this.torsoLeft, this.torsoRight, this.head]);
      this.physics.add.collider(this.playerWeapon.bullets, mutoidParts, this.handleBulletMutoidCollision, null, this);
    };

    // Existing game‑pad hookup
    const firstPad = this.input.gamepad.gamepads.find(p => p?.connected);
    if (firstPad) createPlayer(firstPad);
    this.input.gamepad.once('connected', pad => createPlayer(pad));
  }

  update() {
    if (this.player && this.player.active) this.player.update();
  }

  private animateMutoid(head: Phaser.GameObjects.Sprite) {

    const ease = this.secondLoop ? "Elastic.easeInOut" : "Quad.easeInOut";

    // Float the mutoid up and down, while animating the head
    // to look forward when going down, and look back when going up.
    // Pause at the top and bottom of the movement.
    // Repeat forever.

    const tween = this.tweens.add({
      targets: this.mutoidContainer,
      y: this.mutoidContainer.y + (400 - this.mutoidContainer.height),
      duration: 2000,
      yoyo: true,
      hold: 0,
      repeatDelay: 3500,
      repeat: -1,
      delay: 3500,
      // ease: "Quad.easeInOut",
      // ease: "Elastic.easeInOut",
      ease,
      onStart: () => this.playHeadForward(head),
      onYoyo: () => this.playHeadBackward(head),
      onRepeat: () => this.playHeadForward(head),
      onComplete: () => this.playHeadIdle(head),
      onStop: () => this.playHeadIdle(head),
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => tween.stop());
  }

  private playHeadIdle(head: Phaser.GameObjects.Sprite) {
    head.stop();
    head.setFrame(HEAD_FRAME);
  }

  private playHeadForward(head: Phaser.GameObjects.Sprite) {
    head.play({ key: "mutoid-head-forward", repeat: -1, frameRate: 5 });
  }

  private playHeadBackward(head: Phaser.GameObjects.Sprite) {
    head.play({ key: "mutoid-head-back", repeat: 0, frameRate: 2 });
    head.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "mutoid-head-back",
      () => this.playHeadIdle(head)
    );
  }

  private handleBulletMutoidCollision(bullet: any, mutoidPart: any) {
    if (this.mutoidArmsHp > 0) {
      if (mutoidPart === this.armLeft || mutoidPart === this.armRight) {
        this.mutoidArmsHp -= bullet.hp;
        if (this.mutoidArmsHp <= 0) {
          this.armLeft.destroy();
          this.armRight.destroy();
        }
        bullet.hp -= 1;
        if (bullet.hp <= 0) {
            bullet.kill();
        }
      }
    } else if (this.mutoidTorsoHp > 0) {
      if (mutoidPart === this.torsoLeft || mutoidPart === this.torsoRight) {
        this.mutoidTorsoHp -= bullet.hp;
        if (this.mutoidTorsoHp <= 0) {
          this.torsoLeft.setTexture('mutoid-head', 'atlas_s1');
          this.torsoRight.setTexture('mutoid-head', 'atlas_s1');
        }
        bullet.hp -= 1;
        if (bullet.hp <= 0) {
            bullet.kill();
        }
      }
    } else {
      if (mutoidPart === this.head) {
        this.head.destroy();
        this.mutoidContainer.destroy();

        const emitter = this.add.particles(this.head.x, this.head.y, 'mutoid-head', {
            frame: "atlas_s4",
            lifespan: 4000,
            speed: { min: 150, max: 250 },
            scale: { start: 1, end: 0 },
            gravityY: 300,
            blendMode: 'ADD',
            emitting: false
        });
        emitter.explode(400);
        bullet.kill();
      }
    }
  }

  private ensureAnimation(
    key: string,
    textureKey: string,
    frames: string[] = ["atlas_s0", "atlas_s1", "atlas_s2"],
    fps: number = TREAD_FPS,
    repeat: number = -1
  ) {
    if (this.anims.exists(key)) return;

    this.anims.create({
      key,
      frames: frames.map((frame) => ({ key: textureKey, frame })),
      frameRate: fps,
      repeat,
    });
  }

  private ensureExplicitAnimation(
    key: string,
    textureKey: string,
    frames: string[],
    fps: number,
    repeat: number
  ) {
    if (this.anims.exists(key)) return;

    this.anims.create({
      key,
      frames: frames.map((frame) => ({ key: textureKey, frame })),
      frameRate: fps,
      repeat,
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
