
// You can write more code here

import { Player } from "../game-objects/player";
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

  private player!: Player;
  private mutoidParts!: Phaser.Physics.Arcade.Group;
  private mutoidArmsHp = 10;
  private mutoidTorsoHp = 20;
  private mutoidHeadHealth = 1; // Assuming head is destroyed in one hit after shields are down.
  private isTorsoDestroying = false;
  private armLeft!: Phaser.GameObjects.Image;
  private armRight!: Phaser.GameObjects.Image;
  private torsoLeft!: Phaser.GameObjects.Image;
  private torsoRight!: Phaser.GameObjects.Image;
  private head!: Phaser.GameObjects.Sprite;

  /* START-USER-CODE */
  // Write your code here

  create() {

    this.editorCreate();

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
      this.torsoLeft,
      this.torsoRight,
      this.armLeft,
      this.armRight,
      this.head,
    ]);

    this.ensureAnimation("mutoid-tank-tread-spin", "mutoid-tank-tread");
    this.ensureAnimation("mutoid-tank-tread-front-spin", "mutoid-tank-tread-front");

    treadLeft.play({ key: "mutoid-tank-tread-spin" });
    treadRight.play({ key: "mutoid-tank-tread-spin" });
    treadFrontLeft.play({ key: "mutoid-tank-tread-front-spin" });
    treadFrontRight.play({ key: "mutoid-tank-tread-front-spin" });

    const tankWidth = tankLeft.displayWidth;
    const torsoWidth = this.torsoLeft.displayWidth;
    const armWidth = this.armLeft.displayWidth;

    tankLeft.setPosition(-tankWidth, MUTOID_HEIGHT);
    tankRight.setPosition(0, MUTOID_HEIGHT);

    treadLeft.setPosition(-tankWidth, MUTOID_HEIGHT);
    treadRight.setPosition(tankWidth, MUTOID_HEIGHT);

    const treadLeftLeftEdge = treadLeft.x - treadLeft.displayWidth;
    const treadRightRightEdge = treadRight.x + treadRight.displayWidth;

    treadFrontLeft.setPosition(treadLeftLeftEdge + 1, treadLeft.y - 1);

    treadFrontRight.setPosition(treadRightRightEdge - 1, treadRight.y - 1);

    this.torsoLeft.setPosition(-torsoWidth, 0);
    this.torsoRight.setPosition(0, 0);

    this.armLeft.setPosition(-torsoWidth + 15, 2);
    this.armRight.setPosition(armWidth + torsoWidth - 15, 2);

    this.head.setPosition(0, -HEAD_OFFSET_FROM_TORSO_TOP);

    const sprites = [
      this.torsoLeft,
      this.torsoRight,
      tankLeft,
      tankRight,
      treadLeft,
      treadRight,
      treadFrontLeft,
      treadFrontRight,
      this.armLeft,
      this.armRight,
      this.head,
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

    this.mutoidParts = this.physics.add.group();
    this.physics.world.enable([this.armLeft, this.armRight, this.torsoLeft, this.torsoRight, this.head]);
    this.mutoidParts.addMultiple([this.armLeft, this.armRight, this.torsoLeft, this.torsoRight, this.head]);

    this.anims.create({
        key: 'head_explosion_anim',
        frames: this.anims.generateFrameNames('mutoid-head', { prefix: 'atlas_s', start: 4, end: 6 }),
        frameRate: 10,
        repeat: -1
    });

    this.ensureExplicitAnimation("mutoid-head-forward", "mutoid-head", ["atlas_s5", "atlas_s0"], 5, -1);
    const headBackFrames = this.secondLoop
      ? ["atlas_s1", "atlas_s2", "atlas_s3"]
      : ["atlas_s1", "atlas_s2", "atlas_s3", "atlas_s3"];
    this.ensureExplicitAnimation("mutoid-head-back", "mutoid-head", headBackFrames, 2, 0);

    this.head.setFrame(HEAD_FRAME);

    this.animateMutoid(this.head);

    // @ts-ignore
    window.gameScene = this;

    this.#startBtn = this.physics
      .add.sprite(GAME_WIDTH / 2, 330, 'game_ui', 'titleStartText.png')
      .setInteractive();

    this.#startBtn.on('pointerup', () => {
      requestFullscreen(this.game.canvas);
      const pads = this.input.gamepad.gamepads;
      this.createPlayer(pads[0] || null);
    });

    // Existing game‑pad hookup
    const firstPad = this.input.gamepad.gamepads.find(p => p?.connected);
    if (firstPad) this.createPlayer(firstPad);
    this.input.gamepad.once('connected', pad => this.createPlayer(pad));
  }

  private createPlayer(gamepad: Phaser.Input.Gamepad.Gamepad | null) {
    if (this.player) return;

    if (this.#startBtn) this.#startBtn.destroy();
    const alert = document.getElementById('gamepadAlert');
    if (alert) alert.style.display = 'none';

    const d = PROPERTIES.resource.recipe.data.playerData;

    this.player = new Player(d);
    this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 48);
    this.player.unitX = GAME_WIDTH / 2;
    this.player.unitY = GAME_HEIGHT - 48;
    this.player.gamepad = gamepad ?? null;
    this.player.gamepadIndex = gamepad ? gamepad.index : -1;
    this.player.gamepadVibration = gamepad?.vibrationActuator ?? null;
    this.player.speed = 150;

    this.physics.add.collider(this.player.bulletGroup, this.mutoidParts, this.handleBulletMutoidCollision, undefined, this);
  }

  update() {
    if (this.player && this.player.active) this.player.update();

    if (this.mutoidParts) {
        this.mutoidParts.getChildren().forEach(part => {
            const p = part as Phaser.GameObjects.Image;
            const body = p.body as Phaser.Physics.Arcade.Body;

            const bounds = p.getBounds();

            body.center.x = bounds.centerX;
            body.center.y = bounds.centerY;
        });
    }
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
    const bulletInstance = bullet as import("../game-objects/bullet").Bullet;
    const part = mutoidPart as Phaser.GameObjects.Image;
    const damageDealt = 1; // Assuming player bullets deal 1 damage

    // A collision always damages the bullet
    bulletInstance.hp -= 1;

    // --- Damage applies to the mutoid part only if it's the current target ---

    // Target: Arms
    if (this.mutoidArmsHp > 0) {
      if (part === this.armLeft || part === this.armRight) {
        this.mutoidArmsHp -= damageDealt;
        if (this.mutoidArmsHp <= 0) {
          this.armLeft.destroy();
          this.armRight.destroy();
        }
      }
    }
    // Target: Torso
    else if (this.mutoidTorsoHp > 0) {
      if ((part === this.torsoLeft || part === this.torsoRight) && !this.isTorsoDestroying) {
        this.mutoidTorsoHp -= damageDealt;
        if (this.mutoidTorsoHp <= 0) {
          this.isTorsoDestroying = true;
          // As per user request, set to 2nd frame. Assumes this frame exists on the 'mutoid-torso' texture atlas.
          this.torsoLeft.setFrame("atlas_s1");
          this.torsoRight.setFrame("atlas_s1");
          this.time.delayedCall(100, () => {
            this.torsoLeft.destroy();
            this.torsoRight.destroy();
          });
        }
      }
    }
    // Target: Head
    else {
      if (part === this.head) {
          this.mutoidHeadHealth -= damageDealt;
          if (this.mutoidHeadHealth <= 0) {
              const headWorldPos = this.head.getWorldTransformMatrix();
              const explosionX = headWorldPos.tx;
              const explosionY = headWorldPos.ty;

              this.head.destroy();
              this.mutoidContainer.destroy(); // Or trigger a bigger explosion

              const explosionGroup = this.add.group();
              for (let i = 0; i < 50; i++) {
                  const headPart = this.physics.add.sprite(explosionX, explosionY, 'mutoid-head');
                  explosionGroup.add(headPart);
                  headPart.play('head_explosion_anim');
                  const angle = Phaser.Math.Between(0, 360);
                  const speed = Phaser.Math.Between(150, 250);
                  this.physics.velocityFromAngle(angle, speed, headPart.body.velocity);
                  headPart.body.setGravityY(300);
              }

              this.time.delayedCall(3000, () => {
                  explosionGroup.destroy(true);
              });
          }
      }
    }

    // Destroy the bullet if its HP is depleted
    if (bulletInstance.hp <= 0) {
      bulletInstance.destroy();
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
