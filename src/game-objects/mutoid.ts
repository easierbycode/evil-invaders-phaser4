import { Player } from "./player";
import { Bullet } from "./bullet";
import MutoidScene from "../scenes/MutoidScene";

// These constants define the size and positioning of the mutoid parts.
const MUTOID_HEIGHT = 104;
const HEAD_OFFSET_FROM_TORSO_TOP = 8;
const HEAD_FRAME = "atlas_s0";
const TORSO_FRAME = "atlas_s0";
const TREAD_FRAME = "atlas_s0";
const TREAD_FPS = 4;

export class Mutoid extends Phaser.GameObjects.Container {
  public scene: MutoidScene;
  private player: Player | null = null;
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
  private tankLeft!: Phaser.GameObjects.Image;
  private tankRight!: Phaser.GameObjects.Image;
  private treadLeft!: Phaser.GameObjects.Sprite;
  private treadRight!: Phaser.GameObjects.Sprite;
  private treadFrontLeft!: Phaser.GameObjects.Sprite;
  private treadFrontRight!: Phaser.GameObjects.Sprite;


  constructor(scene: MutoidScene, x: number, y: number, secondLoop: boolean) {
    super(scene, x, y);
    this.scene = scene;
    this.secondLoop = secondLoop;

    this.createParts();
    this.setupPhysics();
    this.setupAnimations();
    this.animate();

    scene.add.existing(this);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  setPlayer(player: Player) {
    this.player = player;
  }

  private createParts() {
    this.torsoLeft = this.scene.add.sprite(0, 0, "mutoid-torso", TORSO_FRAME).setOrigin(0, 0);
    this.torsoRight = this.scene.add.sprite(0, 0, "mutoid-torso", TORSO_FRAME).setOrigin(0, 0).setFlipX(true);
    this.tankLeft = this.scene.add.image(0, 0, "mutoid-tank").setOrigin(0, 1);
    this.tankRight = this.scene.add.image(0, 0, "mutoid-tank").setOrigin(0, 1).setFlipX(true);
    this.treadLeft = this.scene.add.sprite(0, 0, "mutoid-tank-tread", TREAD_FRAME).setOrigin(1, 1);
    this.treadRight = this.scene.add.sprite(0, 0, "mutoid-tank-tread", TREAD_FRAME).setOrigin(0, 1).setFlipX(true);
    this.treadFrontLeft = this.scene.add.sprite(0, 0, "mutoid-tank-tread-front", TREAD_FRAME).setOrigin(0, 0);
    this.treadFrontRight = this.scene.add.sprite(0, 0, "mutoid-tank-tread-front", TREAD_FRAME).setOrigin(1, 0).setFlipX(true);
    const head = this.scene.add.sprite(0, 0, "mutoid-head", HEAD_FRAME).setOrigin(0.5, 0);
    this.head = head;
    head.on(Phaser.Animations.Events.ANIMATION_UPDATE, (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      this.handleFrameChange(frame);
    });
    this.armLeft = this.scene.add.image(0, 0, "mutoid-arm").setOrigin(1, 0);
    this.armRight = this.scene.add.image(0, 0, "mutoid-arm").setOrigin(1, 0).setFlipX(true);

    const tankScale = MUTOID_HEIGHT / this.tankLeft.displayHeight;
    this.tankLeft.setScale(tankScale);
    this.tankRight.setScale(tankScale);
    this.treadLeft.setScale(tankScale);
    this.treadRight.setScale(tankScale);
    this.treadFrontLeft.setScale(tankScale);
    this.treadFrontRight.setScale(tankScale);

    this.add([
      this.treadFrontLeft,
      this.treadFrontRight,
      this.treadLeft,
      this.treadRight,
      this.tankLeft,
      this.tankRight,
      this.torsoLeft,
      this.torsoRight,
      this.armLeft,
      this.armRight,
      head,
    ]);

    this.ensureAnimation("mutoid-tank-tread-spin", "mutoid-tank-tread");
    this.ensureAnimation("mutoid-tank-tread-front-spin", "mutoid-tank-tread-front");

    this.treadLeft.play({ key: "mutoid-tank-tread-spin" });
    this.treadRight.play({ key: "mutoid-tank-tread-spin" });
    this.treadFrontLeft.play({ key: "mutoid-tank-tread-front-spin" });
    this.treadFrontRight.play({ key: "mutoid-tank-tread-front-spin" });

    const tankWidth = this.tankLeft.displayWidth;
    const torsoWidth = this.torsoLeft.displayWidth;
    const armWidth = this.armLeft.displayWidth;

    this.tankLeft.setPosition(-tankWidth, MUTOID_HEIGHT);
    this.tankRight.setPosition(0, MUTOID_HEIGHT);

    this.treadLeft.setPosition(-tankWidth, MUTOID_HEIGHT);
    this.treadRight.setPosition(tankWidth, MUTOID_HEIGHT);

    const treadLeftLeftEdge = this.treadLeft.x - this.treadLeft.displayWidth;
    const treadRightRightEdge = this.treadRight.x + this.treadRight.displayWidth;

    this.treadFrontLeft.setPosition(treadLeftLeftEdge + 1, this.treadLeft.y - 1);

    this.treadFrontRight.setPosition(treadRightRightEdge - 1, this.treadRight.y - 1);

    this.torsoLeft.setPosition(-torsoWidth, 0);
    this.torsoRight.setPosition(0, 0);

    this.armLeft.setPosition(-torsoWidth + 15, 2);
    this.armRight.setPosition(armWidth + torsoWidth - 15, 2);

    head.setPosition(0, -HEAD_OFFSET_FROM_TORSO_TOP);

    const sprites = this.getAll() as Phaser.GameObjects.Sprite[];
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
    const solidPartsList = [this.tankLeft, this.tankRight, this.treadFrontLeft, this.treadFrontRight];

    // @ts-ignore
    this.scene.physics.world.enable(this.getAll());

    this.parts.addMultiple(destructibleParts as any[]);
    this.solidParts.addMultiple(solidPartsList as any[]);

    this.parts.getChildren().forEach(part => {
      (part.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    });

    this.solidParts.getChildren().forEach(part => {
      (part.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    });
  }

  private setupAnimations() {
    this.scene.anims.create({
      key: 'head_explosion_anim',
      frames: this.scene.anims.generateFrameNames('mutoid-head', { prefix: 'atlas_s', start: 4, end: 6 }),
      frameRate: 10,
      repeat: -1
    });

    this.ensureAnimation("mutoid-tank-tread-spin", "mutoid-tank-tread");
    this.ensureAnimation("mutoid-tank-tread-front-spin", "mutoid-tank-tread-front");

    this.ensureExplicitAnimation("mutoid-head-forward", "mutoid-head", ["atlas_s5", "atlas_s0"], 5, -1);
    const headBackFrames = this.secondLoop
      ? ["atlas_s1", "atlas_s2", "atlas_s3"]
      : ["atlas_s1", "atlas_s2", "atlas_s3", "atlas_s3"];
    this.ensureExplicitAnimation("mutoid-head-back", "mutoid-head", headBackFrames, 2, 0);
    if (this.head) this.head.setFrame(HEAD_FRAME);
  }

  update(...args: any[]) {
      if (!this.active) return;
      this.list.forEach((part: any) => {
        if (part.body) {
          const body = part.body as Phaser.Physics.Arcade.Body;
          const p = part as Phaser.GameObjects.Sprite;
          const [worldX, worldY] = this.getWorldCoors(p.x, p.y);
          body.x = worldX - p.displayOriginX;
          body.y = worldY - p.displayOriginY;
        }
      });
  }

  getWorldCoors(x: number, y: number): [number, number] {
    const mat = this.getWorldTransformMatrix();
    return [
      x * mat.a + y * mat.c + mat.tx,
      x * mat.b + y * mat.d + mat.ty
    ];
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
      this.head.once(
        Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "mutoid-head-back",
        () => this.playHeadIdle()
      );
    }
  }

  public handleBulletCollision(bullet: Bullet, mutoidPart: Phaser.GameObjects.GameObject) {
    const part = mutoidPart as Phaser.GameObjects.Image;
    const damageDealt = 1; // Assuming player bullets deal 1 damage

    // A collision always damages the bullet
    bullet.hp -= 1;

    // --- Damage applies to the mutoid part only if it's the current target ---

    // Target: Arms
    if (this.armLeftHp > 0 || this.armRightHp > 0) {
      if (part === this.armLeft && this.armLeftHp > 0) {
        this.armLeftHp -= damageDealt;
        if (this.armLeftHp <= 0) {
          this.armLeft.destroy();
        }
      } else if (part === this.armRight && this.armRightHp > 0) {
        this.armRightHp -= damageDealt;
        if (this.armRightHp <= 0) {
          this.armRight.destroy();
        }
      }
    }
    // Target: Torso
    else if (this.torsoHp > 0) {
      if ((part === this.torsoLeft || part === this.torsoRight) && !this.isTorsoDestroying) {
        this.torsoHp -= damageDealt;

        // When torso HP drops to 15 or below, change both torso sprites to the damaged frame.
        if (this.torsoHp <= 15 && this.torsoLeft && this.torsoRight) {
          this.torsoLeft.setFrame("atlas_s1");
          this.torsoRight.setFrame("atlas_s1");
        }

        // When torso HP reaches zero or less, destroy the torso parts.
        if (this.torsoHp <= 0) {
          this.isTorsoDestroying = true;
          this.scene.time.delayedCall(100, () => {
            if (this.torsoLeft) this.torsoLeft.destroy();
            if (this.torsoRight) this.torsoRight.destroy();
          });
        }
      }
    }
    // Target: Head
    else {
      if (this.head && part === this.head) {
        this.headHealth -= damageDealt;
        if (this.headHealth <= 0 && this.head) {
          const head = this.head;
          const headWorldPos = head.getWorldTransformMatrix();
          const explosionX = headWorldPos.tx;
          const explosionY = headWorldPos.ty;
          const scene = this.scene;

          this.stopFloatTween();

          head.destroy();
          this.head = null;

          if (this.active) {
            this.destroy(); // Or trigger a bigger explosion
          }

          const explosionGroup = scene.add.group();
          for (let i = 0; i < 50; i++) {
            const headPart = scene.physics.add.sprite(explosionX, explosionY, 'mutoid-head');
            explosionGroup.add(headPart);
            headPart.play('head_explosion_anim');
            const angle = Phaser.Math.Between(0, 360);
            const speed = Phaser.Math.Between(150, 250);
            scene.physics.velocityFromAngle(angle, speed, headPart.body.velocity);
            headPart.body.setGravityY(300);
          }

          scene.time.delayedCall(3000, () => {
            explosionGroup.destroy(true);
            scene.scene.restart({ secondLoop: true });
          });
        }
      }
    }

    bullet.destroyBullet();
  }

  private ensureAnimation(
    key: string,
    textureKey: string,
    frames: string[] = ["atlas_s0", "atlas_s1", "atlas_s2"],
    fps: number = TREAD_FPS,
    repeat: number = -1
  ) {
    if (!this.scene.anims.exists(key)) {
      this.scene.anims.create({
        key,
        frames: this.scene.anims.generateFrameNames(textureKey, {
          start: 0,
          end: 2,
          prefix: "atlas_s",
        }),
        frameRate: fps,
        repeat,
      });
    }
  }

  private ensureExplicitAnimation(
    key: string,
    textureKey: string,
    frames: string[],
    fps: number,
    repeat: number
  ) {
    if (this.scene.anims.exists(key)) return;

    this.scene.anims.create({
      key,
      frames: frames.map((frame) => ({ key: textureKey, frame })),
      frameRate: fps,
      repeat,
    });
  }

  private handleFrameChange(frame: Phaser.Animations.AnimationFrame) {
    if (!this.head || !this.player || !frame.textureFrame) return;

    const frameName = frame.textureFrame;
    // Check if frame ends with _s0, _s1, _s2, or _s3
    const match = frameName.match(/_s([0-3])$/);
    if (match) {
      const frameNumber = match[1];
      // Use phase2 bullets if arms are destroyed
      const bulletPrefix = (this.armLeftHp <= 0 && this.armRightHp <= 0) ? 'mutoid-phase2-bullet' : 'mutoid-bullet';
      const bulletTexture = `${bulletPrefix}_s${frameNumber}`;

      // Get head world position
      const headWorldPos = this.head.getWorldTransformMatrix();
      const headX = headWorldPos.tx;
      const headY = headWorldPos.ty + 10; // Offset slightly below head

      // Create bullet
      const bullet = this.bulletGroup.get(headX, headY) as Bullet;
      if (bullet) {
        bullet.fire(headX, headY, 0, 0, bulletTexture);

        let fireAngle: number;
        let speed: number;

        if (frameNumber === '0') {
          // _s0: fire toward player
          fireAngle = Phaser.Math.Angle.Between(headX, headY, this.player.x, this.player.y);
          speed = 200;
          // Set rotation to match velocity direction (with 90° offset for sprite orientation)
          const rotationOffset = Phaser.Math.DegToRad(90);
          // Add extra 180 degrees for phase2 bullets to fix upside down orientation
          const phase2Flip = (this.armLeftHp <= 0 && this.armRightHp <= 0) ? Phaser.Math.DegToRad(180) : 0;
          bullet.rotation = fireAngle + rotationOffset + phase2Flip;
        } else {
          // _s1, _s2, _s3: use fixed angles
          speed = 400;

          if (frameNumber === '1') {
            bullet.rotation = -0.8818719385800352; // -50.53 degrees visual rotation
            // Fire angle: flip to positive for downward direction
            fireAngle = Math.abs(bullet.rotation) + Phaser.Math.DegToRad(90); // Fire down-right
          } else if (frameNumber === '2') {
            bullet.rotation = -0.6949; // -39.81 degrees visual rotation
            // Fire angle: flip to positive for downward direction
            fireAngle = Math.abs(bullet.rotation) + Phaser.Math.DegToRad(90); // Fire down-right (less angle)
          } else { // frameNumber === '3'
            bullet.rotation = -0.499; // -28.6 degrees visual rotation
            // Fire angle: flip to positive for downward direction
            fireAngle = Math.abs(bullet.rotation) + Phaser.Math.DegToRad(90); // Fire down-right (even less angle)
          }
        }

        // Set velocity based on the fire angle
        if (bullet.body) {
          this.scene.physics.velocityFromRotation(fireAngle, speed, bullet.body.velocity);
        }
      }
    }
  }
}