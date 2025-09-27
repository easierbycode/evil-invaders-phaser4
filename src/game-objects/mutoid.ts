import { Player } from "./player";
import { Bullet } from "./bullet";
import MutoidScene from "../scenes/MutoidScene";

// Constants
const MUTOID_HEIGHT = 104;
const HEAD_OFFSET_FROM_TORSO_TOP = 8;
const HEAD_FRAME = "atlas_s0";
const TORSO_FRAME = "atlas_s0";
const TREAD_FRAME = "atlas_s0";
const TREAD_FPS = 4;

export class Mutoid extends Phaser.GameObjects.Container {
  public scene: MutoidScene;
  private player: Player;
  private secondLoop: boolean;

  public parts!: Phaser.Physics.Arcade.Group;
  public solidParts!: Phaser.Physics.Arcade.Group;
  public bulletGroup!: Phaser.Physics.Arcade.Group;

  private armLeftHp = 15;
  private armRightHp = 15;
  private torsoHp = 25;
  private headHealth = 5;
  private isTorsoDestroying = false;

  private armLeft!: Phaser.GameObjects.Image;
  private armRight!: Phaser.GameObjects.Image;
  private torsoLeft!: Phaser.GameObjects.Image;
  private torsoRight!: Phaser.GameObjects.Image;
  private head: Phaser.GameObjects.Sprite | null = null;
  private floatTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: MutoidScene, x: number, y: number, player: Player, secondLoop: boolean) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;
    this.secondLoop = secondLoop;

    this.createParts();
    this.setupPhysics();
    this.setupAnimations();
    this.animate();

    scene.add.existing(this);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  private createParts() {
    this.torsoLeft = this.scene.add.sprite(0, 0, "mutoid-torso", TORSO_FRAME).setOrigin(0, 0);
    this.torsoRight = this.scene.add.sprite(0, 0, "mutoid-torso", TORSO_FRAME).setOrigin(0, 0).setFlipX(true);
    const tankLeft = this.scene.add.image(0, 0, "mutoid-tank").setOrigin(0, 1);
    const tankRight = this.scene.add.image(0, 0, "mutoid-tank").setOrigin(0, 1).setFlipX(true);
    const treadLeft = this.scene.add.sprite(0, 0, "mutoid-tank-tread", TREAD_FRAME).setOrigin(1, 1);
    const treadRight = this.scene.add.sprite(0, 0, "mutoid-tank-tread", TREAD_FRAME).setOrigin(0, 1).setFlipX(true);
    const treadFrontLeft = this.scene.add.sprite(0, 0, "mutoid-tank-tread-front", TREAD_FRAME).setOrigin(0, 0);
    const treadFrontRight = this.scene.add.sprite(0, 0, "mutoid-tank-tread-front", TREAD_FRAME).setOrigin(1, 0).setFlipX(true);
    const head = this.scene.add.sprite(0, 0, "mutoid-head", HEAD_FRAME).setOrigin(0.5, 0);
    this.head = head;
    head.on(Phaser.Animations.Events.ANIMATION_UPDATE, (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      this.handleFrameChange(frame);
    });
    this.armLeft = this.scene.add.image(0, 0, "mutoid-arm").setOrigin(1, 0);
    this.armRight = this.scene.add.image(0, 0, "mutoid-arm").setOrigin(1, 0).setFlipX(true);

    const tankScale = MUTOID_HEIGHT / tankLeft.displayHeight;
    [tankLeft, tankRight, treadLeft, treadRight, treadFrontLeft, treadFrontRight].forEach(part => part.setScale(tankScale));

    this.add([
      treadFrontLeft, treadFrontRight, treadLeft, treadRight,
      tankLeft, tankRight, this.torsoLeft, this.torsoRight,
      this.armLeft, this.armRight, head,
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
    head.setPosition(0, -HEAD_OFFSET_FROM_TORSO_TOP);

    const sprites = this.getAll() as Phaser.GameObjects.Sprite[];
    const leftmost = Math.min(...sprites.map(s => s.x - s.displayWidth * s.originX));
    const rightmost = Math.max(...sprites.map(s => s.x + s.displayWidth * (1 - s.originX)));
    const topmost = Math.min(...sprites.map(s => s.y - s.displayHeight * s.originY));
    const bottommost = Math.max(...sprites.map(s => s.y + s.displayHeight * (1 - s.originY)));
    this.setSize(rightmost - leftmost, bottommost - topmost);
  }

  private setupPhysics() {
    this.parts = this.scene.physics.add.group();
    this.solidParts = this.scene.physics.add.group();
    this.bulletGroup = this.scene.physics.add.group({
      classType: Bullet,
      maxSize: 30,
      runChildUpdate: true
    });

    const destructibleParts = [this.armLeft, this.armRight, this.torsoLeft, this.torsoRight, this.head];
    const solidPartsList = this.getAll().filter(part => !destructibleParts.includes(part as any) && part !== this.head);

    this.scene.physics.world.enable([...destructibleParts, ...solidPartsList]);

    this.parts.addMultiple(destructibleParts as any[]);
    this.solidParts.addMultiple(solidPartsList);

    this.parts.getChildren().forEach(part => (part.body as Phaser.Physics.Arcade.Body).setImmovable(true));
    this.solidParts.getChildren().forEach(part => (part.body as Phaser.Physics.Arcade.Body).setImmovable(true));
  }

  private setupAnimations() {
    this.scene.anims.create({
      key: 'head_explosion_anim',
      frames: this.scene.anims.generateFrameNames('mutoid-head', { prefix: 'atlas_s', start: 4, end: 6 }),
      frameRate: 10,
      repeat: -1
    });
    this.ensureExplicitAnimation("mutoid-head-forward", "mutoid-head", ["atlas_s5", "atlas_s0"], 5, -1);
    const headBackFrames = this.secondLoop ? ["atlas_s1", "atlas_s2", "atlas_s3"] : ["atlas_s1", "atlas_s2", "atlas_s3", "atlas_s3"];
    this.ensureExplicitAnimation("mutoid-head-back", "mutoid-head", headBackFrames, 2, 0);
    if (this.head) this.head.setFrame(HEAD_FRAME);
  }

  public update() {
    if (!this.active) return;
    this.parts.getChildren().forEach(part => {
      const p = part as Phaser.GameObjects.Image;
      const body = p.body as Phaser.Physics.Arcade.Body;
      const bounds = p.getBounds();
      body.center.x = bounds.centerX;
      body.center.y = bounds.centerY;
    });
  }

  private animate() {
    const ease = this.secondLoop ? "Elastic.easeInOut" : "Quad.easeInOut";
    this.stopFloatTween();
    this.floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y + (400 - this.height),
      duration: 2000,
      yoyo: true,
      hold: 0,
      repeatDelay: 3500,
      repeat: -1,
      delay: 3500,
      ease,
      onStart: () => this.playHeadForward(),
      onYoyo: () => this.playHeadBackward(),
      onRepeat: () => this.playHeadForward(),
      onComplete: () => this.playHeadIdle(),
      onStop: () => this.playHeadIdle(),
    });
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopFloatTween());
  }

  private stopFloatTween() {
    if (this.floatTween) {
      this.floatTween.stop();
      this.floatTween.remove();
      this.floatTween = null;
    }
  }

  private playHeadIdle() {
    if (this.head?.scene) {
      this.head.stop();
      this.head.setFrame(HEAD_FRAME);
    }
  }

  private playHeadForward() {
    if (this.head?.scene) {
      this.head.play({ key: "mutoid-head-forward", repeat: -1, frameRate: 5 });
    }
  }

  private playHeadBackward() {
    if (this.head?.scene) {
      this.head.play({ key: "mutoid-head-back", repeat: 0, frameRate: 2 });
      this.head.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "mutoid-head-back", () => this.playHeadIdle());
    }
  }

  public handleBulletCollision(bullet: Bullet, mutoidPart: Phaser.GameObjects.GameObject) {
    const part = mutoidPart as Phaser.GameObjects.Image;
    bullet.hp -= 1;

    if (this.armLeftHp > 0 || this.armRightHp > 0) {
      if (part === this.armLeft && this.armLeftHp > 0) {
        if (--this.armLeftHp <= 0) this.armLeft.destroy();
      } else if (part === this.armRight && this.armRightHp > 0) {
        if (--this.armRightHp <= 0) this.armRight.destroy();
      }
    } else if (this.torsoHp > 0) {
      if ((part === this.torsoLeft || part === this.torsoRight) && !this.isTorsoDestroying) {
        this.torsoHp--;
        if (this.torsoHp <= 15 && this.torsoLeft && this.torsoRight) {
          this.torsoLeft.setFrame("atlas_s1");
          this.torsoRight.setFrame("atlas_s1");
        }
        if (this.torsoHp <= 0) {
          this.isTorsoDestroying = true;
          this.scene.time.delayedCall(100, () => {
            this.torsoLeft.destroy();
            this.torsoRight.destroy();
          });
        }
      }
    } else if (this.head && part === this.head) {
      if (--this.headHealth <= 0) {
        const headWorldPos = this.head.getWorldTransformMatrix();
        const explosionX = headWorldPos.tx;
        const explosionY = headWorldPos.ty;
        this.stopFloatTween();
        this.head.destroy();
        this.head = null;
        if (this.active) this.destroy();

        const explosionGroup = this.scene.add.group();
        for (let i = 0; i < 50; i++) {
          const headPart = this.scene.physics.add.sprite(explosionX, explosionY, 'mutoid-head');
          explosionGroup.add(headPart);
          headPart.play('head_explosion_anim');
          const angle = Phaser.Math.Between(0, 360);
          const speed = Phaser.Math.Between(150, 250);
          this.scene.physics.velocityFromAngle(angle, speed, headPart.body.velocity);
          headPart.body.setGravityY(300);
        }
        this.scene.time.delayedCall(3000, () => {
          explosionGroup.destroy(true);
          this.scene.scene.restart({ secondLoop: true });
        });
      }
    }
    bullet.destroyBullet();
  }

  private ensureAnimation(key: string, textureKey: string, frames: string[] = ["atlas_s0", "atlas_s1", "atlas_s2"], fps: number = TREAD_FPS, repeat: number = -1) {
    if (!this.scene.anims.exists(key)) {
      this.scene.anims.create({ key, frames: frames.map(frame => ({ key: textureKey, frame })), frameRate: fps, repeat });
    }
  }

  private ensureExplicitAnimation(key: string, textureKey: string, frames: string[], fps: number, repeat: number) {
    if (!this.scene.anims.exists(key)) {
      this.scene.anims.create({ key, frames: frames.map(frame => ({ key: textureKey, frame })), frameRate: fps, repeat });
    }
  }

  private handleFrameChange(frame: Phaser.Animations.AnimationFrame) {
    if (!this.head || !this.player || !frame.textureFrame) return;
    const match = frame.textureFrame.match(/_s([0-3])$/);
    if (match) {
      const frameNumber = match[1];
      const bulletPrefix = (this.armLeftHp <= 0 && this.armRightHp <= 0) ? 'mutoid-phase2-bullet' : 'mutoid-bullet';
      const bulletTexture = `${bulletPrefix}_s${frameNumber}`;
      const headWorldPos = this.head.getWorldTransformMatrix();
      const headX = headWorldPos.tx;
      const headY = headWorldPos.ty + 10;
      const bullet = this.bulletGroup.get(headX, headY) as Bullet;
      if (bullet) {
        bullet.fire(headX, headY, 0, 0, bulletTexture);
        let fireAngle: number;
        let speed: number;
        if (frameNumber === '0') {
          fireAngle = Phaser.Math.Angle.Between(headX, headY, this.player.x, this.player.y);
          speed = 200;
          const rotationOffset = Phaser.Math.DegToRad(90);
          const phase2Flip = (this.armLeftHp <= 0 && this.armRightHp <= 0) ? Phaser.Math.DegToRad(180) : 0;
          bullet.rotation = fireAngle + rotationOffset + phase2Flip;
        } else {
          speed = 400;
          if (frameNumber === '1') {
            bullet.rotation = -0.8818719385800352;
            fireAngle = Math.abs(bullet.rotation) + Phaser.Math.DegToRad(90);
          } else if (frameNumber === '2') {
            bullet.rotation = -0.6949;
            fireAngle = Math.abs(bullet.rotation) + Phaser.Math.DegToRad(90);
          } else {
            bullet.rotation = -0.499;
            fireAngle = Math.abs(bullet.rotation) + Phaser.Math.DegToRad(90);
          }
        }
        if (bullet.body) {
          this.scene.physics.velocityFromRotation(fireAngle, speed, bullet.body.velocity);
        }
      }
    }
  }
}