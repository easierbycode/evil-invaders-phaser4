import { Player } from "./player";
import { Bullet } from "./bullet";
import MutoidScene from "../scenes/MutoidScene";
import PROPERTIES from "../properties";

// These constants define the positioning of the mutoid parts.
const MUTOID_HEIGHT = 94; // Reduced by 10px to fix tank positioning
const HEAD_OFFSET_FROM_TORSO_TOP = 8;
const HEAD_FRAME = "atlas_s0";
const TORSO_FRAME = "atlas_s0";
const TREAD_FRAME = "atlas_s0";
const TREAD_FPS = 4;

export class Mutoid extends Phaser.GameObjects.Container {
  declare public scene: MutoidScene;
  private player: Player | null = null;
  private secondLoop: boolean = false;
  private isMutoidReplacement: boolean = false;

  // Sprite parts
  public head?: Phaser.GameObjects.Sprite;
  public armLeft?: Phaser.GameObjects.Image;
  public armRight?: Phaser.GameObjects.Image;
  public torsoLeft?: Phaser.GameObjects.Sprite;
  public torsoRight?: Phaser.GameObjects.Sprite;
  public tankLeft?: Phaser.GameObjects.Image;
  public tankRight?: Phaser.GameObjects.Image;
  public treadFrontLeft?: Phaser.GameObjects.Sprite;
  public treadFrontRight?: Phaser.GameObjects.Sprite;

  // State & HP tracking. The initializers are the shipped defaults; the
  // constructor re-seeds them from recipe.data.mutoidData so a mod can retune
  // the fight without touching code.
  public armLeftHp: number = 15;
  public armRightHp: number = 15;
  public torsoHp: number = 25;
  public headHealth: number = 5;
  public isTorsoDestroying: boolean = false;

  // Tunables, all resolved from mutoidData with today's values as defaults.
  private mutoidHeight: number = MUTOID_HEIGHT;
  private treadFps: number = TREAD_FPS;
  private torsoDamagedAt: number = 15;
  private floatDuration: number = 2000;
  private floatDelay: number = 3500;
  private headForwardFps: number = 5;
  private headBackFps: number = 2;
  private tex!: {
    head: string; torso: string; arm: string;
    tank: string; tread: string; treadFront: string;
  };

  // Animations & tweens
  private floatTween: Phaser.Tweens.Tween | null = null;
  private treadLeft?: Phaser.GameObjects.Sprite;
  private treadRight?: Phaser.GameObjects.Sprite;

  // Physics groups and bullet pool (initialized in constructor)
  public parts!: Phaser.Physics.Arcade.Group;
  public solidParts!: Phaser.Physics.Arcade.Group;
  public bulletGroup!: Phaser.Physics.Arcade.Group;

  constructor(scene: MutoidScene, x: number, y: number, secondLoop: boolean = false) {
    super(scene, x, y);
    this.scene = scene;
    this.secondLoop = secondLoop;

    const params = new URLSearchParams(window.location.search);
    this.isMutoidReplacement = params.get("isMutoidReplacement") === "1";

    // Must run before setupAnimations()/createParts() below — they read every
    // field seeded here.
    this.applyMutoidData();

    scene.add.existing(this);

    // Initialize components in the correct order
    this.setupAnimations();
    this.createParts();
    this.setupPhysics();
    this.startTreadAnimations();
    this.animate();
  }

  /**
   * Seed the tunables from `recipe.data.mutoidData`. Every field falls back to
   * the value the boss shipped with, so an absent or partial block behaves
   * exactly as before. `??` (not `||`) throughout: 0 is a legitimate value for
   * several of these.
   */
  private applyMutoidData() {
    const md = (PROPERTIES as any).resource?.recipe?.data?.mutoidData ?? {};
    const num = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isFinite(v) ? v : fallback;

    this.mutoidHeight = num(md.height, MUTOID_HEIGHT);
    this.treadFps = num(md.treadFps, TREAD_FPS);
    this.torsoDamagedAt = num(md.torsoDamagedAt, 15);
    this.floatDuration = num(md.floatDuration, 2000);
    this.floatDelay = num(md.floatDelay, 3500);
    this.headForwardFps = num(md.headForwardFps, 5);
    this.headBackFps = num(md.headBackFps, 2);

    this.armLeftHp = this.armRightHp = num(md.armHp, 15);
    this.torsoHp = num(md.torsoHp, 25);
    this.headHealth = num(md.headHp, 5);

    // Phase 3 keeps its own sprite set; a mod retunes the base fight.
    const p3 = this.isMutoidReplacement;
    const t = (md.textures ?? {}) as Record<string, unknown>;
    const pick = (name: string, base: string) =>
      p3 ? base : (typeof t[name] === "string" && t[name] ? String(t[name]) : base);
    this.tex = {
      head: p3 ? "mutoid-phase3-head" : pick("head", "mutoid-head"),
      torso: p3 ? "mutoid-phase3-torso" : pick("torso", "mutoid-torso"),
      arm: p3 ? "mutoid-phase3-arm" : pick("arm", "mutoid-arm"),
      tank: pick("tank", "mutoid-tank"),
      tread: pick("tread", "mutoid-tank-tread"),
      treadFront: pick("treadFront", "mutoid-tank-tread-front"),
    };
  }

  private setupAnimations() {
    const headTexture = this.tex.head;
    // Only create animations if they don't exist
    if (!this.scene.anims.exists('head_explosion_anim')) {
      this.scene.anims.create({
        key: 'head_explosion_anim',
        frames: this.scene.anims.generateFrameNames(headTexture, { prefix: 'atlas_s', start: 4, end: 6 }),
        frameRate: 10,
        repeat: -1
      });
    }

    this.ensureAnimation("mutoid-tank-tread-spin", this.tex.tread);
    this.ensureAnimation("mutoid-tank-tread-front-spin", this.tex.treadFront);

    this.ensureExplicitAnimation("mutoid-head-forward", headTexture, ["atlas_s5", "atlas_s0"], this.headForwardFps, -1);
    const headBackFrames = this.secondLoop
      ? ["atlas_s1", "atlas_s2", "atlas_s3"]
      : ["atlas_s2", "atlas_s3", "atlas_s3"];
    this.ensureExplicitAnimation("mutoid-head-back", headTexture, headBackFrames, this.headBackFps, 0);
  }

  private createParts() {
    this.createAllSprites();
    this.positionAllParts();
    this.addPartsToContainer();
  }

  private createAllSprites() {
    const headTexture = this.tex.head;
    const torsoTexture = this.tex.torso;
    const armTexture = this.tex.arm;
    // First create head at top
    this.head = this.scene.add.sprite(0, -HEAD_OFFSET_FROM_TORSO_TOP, headTexture, HEAD_FRAME)
      .setOrigin(0.5, 0);
    if (this.head) {
      this.head.on(Phaser.Animations.Events.ANIMATION_UPDATE, 
        (_: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
          this.handleFrameChange(frame);
      });
    }

    // Create body parts from top to bottom
    this.torsoLeft = this.scene.add.sprite(0, 0, torsoTexture, TORSO_FRAME).setOrigin(0, 0);
    this.torsoRight = this.scene.add.sprite(0, 0, torsoTexture, TORSO_FRAME).setOrigin(0, 0).setFlipX(true);

    // Create arms
    this.armLeft = this.scene.add.image(0, 2, armTexture).setOrigin(1, 0);
    this.armRight = this.scene.add.image(0, 2, armTexture).setOrigin(1, 0).setFlipX(true);

    // Create tank parts
    this.tankLeft = this.scene.add.image(0, this.mutoidHeight, this.tex.tank).setOrigin(0, 1);
    this.tankRight = this.scene.add.image(0, this.mutoidHeight, this.tex.tank).setOrigin(0, 1).setFlipX(true);

    // Create treads
    this.treadLeft = this.scene.add.sprite(0, this.mutoidHeight, this.tex.tread, TREAD_FRAME).setOrigin(1, 1);
    this.treadRight = this.scene.add.sprite(0, this.mutoidHeight, this.tex.tread, TREAD_FRAME).setOrigin(0, 1).setFlipX(true);

    this.treadFrontLeft = this.scene.add.sprite(0, this.mutoidHeight - 1, this.tex.treadFront, TREAD_FRAME).setOrigin(0, 0);
    this.treadFrontRight = this.scene.add.sprite(0, this.mutoidHeight - 1, this.tex.treadFront, TREAD_FRAME).setOrigin(1, 0).setFlipX(true);
  }

  private positionAllParts() {
    if (!this.tankLeft || !this.torsoLeft || !this.armLeft) return;

    const tankWidth = this.tankLeft.displayWidth;
    const torsoWidth = this.torsoLeft.displayWidth;
    const armWidth = this.armLeft.displayWidth;

    // Position torso first (central reference point)
    this.torsoLeft?.setPosition(-torsoWidth, 0);
    this.torsoRight?.setPosition(0, 0);

    // Position arms relative to torso
    this.armLeft?.setPosition(-torsoWidth + 15, 2);
    this.armRight?.setPosition(armWidth + torsoWidth - 15, 2);

    // Position tank parts
    this.tankLeft.setPosition(-tankWidth, this.mutoidHeight);
    this.tankRight?.setPosition(0, this.mutoidHeight);

    // Position treads
    this.treadLeft?.setPosition(-tankWidth, this.mutoidHeight);
    this.treadRight?.setPosition(tankWidth, this.mutoidHeight);

    if (this.treadLeft && this.treadRight) {
      const treadLeftX = this.treadLeft.x - this.treadLeft.displayWidth;
      const treadRightX = this.treadRight.x + this.treadRight.displayWidth;

      this.treadFrontLeft?.setPosition(treadLeftX + 1, this.treadLeft.y - 1);
      this.treadFrontRight?.setPosition(treadRightX - 1, this.treadRight.y - 1);
    }

    this.updateContainerBounds();
  }

  private updateContainerBounds() {
    const parts = [
      this.torsoLeft, this.torsoRight,
      this.tankLeft, this.tankRight, 
      this.treadLeft, this.treadRight,
      this.treadFrontLeft, this.treadFrontRight, 
      this.armLeft, this.armRight,
      this.head
    ].filter((part): part is Phaser.GameObjects.Sprite | Phaser.GameObjects.Image => part !== undefined);

    if (parts.length > 0) {
      const minX = Math.min(...parts.map(p => p.x - p.displayWidth * p.originX));
      const maxX = Math.max(...parts.map(p => p.x + p.displayWidth * (1 - p.originX)));
      const minY = Math.min(...parts.map(p => p.y - p.displayHeight * p.originY));
      const maxY = Math.max(...parts.map(p => p.y + p.displayHeight * (1 - p.originY)));

      this.setSize(maxX - minX, maxY - minY);
    }
  }

  private addPartsToContainer() {
    const allParts = [
      this.treadFrontLeft, this.treadFrontRight,
      this.treadLeft, this.treadRight,
      this.tankLeft, this.tankRight,
      this.torsoLeft, this.torsoRight,
      this.armLeft, this.armRight,
      this.head
    ].filter((part): part is Phaser.GameObjects.Sprite | Phaser.GameObjects.Image => part !== undefined);

    this.add(allParts);
  }

  private startTreadAnimations() {
    if (this.treadLeft) this.treadLeft.play({ key: "mutoid-tank-tread-spin" });
    if (this.treadRight) this.treadRight.play({ key: "mutoid-tank-tread-spin" });
    if (this.treadFrontLeft) this.treadFrontLeft.play({ key: "mutoid-tank-tread-front-spin" });
    if (this.treadFrontRight) this.treadFrontRight.play({ key: "mutoid-tank-tread-front-spin" });
  }

  private setupPhysics() {
    // Create physics groups
    this.parts = this.scene.physics.add.group();
    this.solidParts = this.scene.physics.add.group();
    this.bulletGroup = this.scene.physics.add.group({ 
      classType: Bullet,
      maxSize: 30,
      runChildUpdate: true
    });

    // Helper type predicate
    const isGameObject = (obj: any): obj is Phaser.GameObjects.GameObject & 
      (Phaser.GameObjects.Sprite | Phaser.GameObjects.Image) => {
      return obj instanceof Phaser.GameObjects.Sprite || obj instanceof Phaser.GameObjects.Image;
    };

    // Filter and enable physics for parts
    const destructibleParts = [
      this.armLeft, this.armRight,
      this.torsoLeft, this.torsoRight,
      this.head
    ].filter(isGameObject);

    const solidPartsList = [
      this.tankLeft, this.tankRight,
      this.treadFrontLeft, this.treadFrontRight
    ].filter(isGameObject);

    if (destructibleParts.length > 0) {
      this.scene.physics.world.enable(destructibleParts);
      this.parts.addMultiple(destructibleParts);
    }

    if (solidPartsList.length > 0) {
      this.scene.physics.world.enable(solidPartsList);
      this.solidParts.addMultiple(solidPartsList);
    }

    // Configure physics bodies
    const configureBody = (part: Phaser.GameObjects.GameObject) => {
      const body = part.body as Phaser.Physics.Arcade.Body;
      if (!body) return;
      body.setImmovable(true);
      body.setAllowGravity(false);
      body.setVelocity(0, 0);
    };

    this.parts.getChildren().forEach(configureBody);
    this.solidParts.getChildren().forEach(configureBody);
  }



  preUpdate() {
    if (!this.active) return;

    this.list.forEach((part: any) => {
      if (part.body) {
        const body = part.body as Phaser.Physics.Arcade.Body;
        const p = part as Phaser.GameObjects.Sprite;
        const [worldX, worldY] = this.getWorldCoords(p.x, p.y);
        body.position.x = worldX - p.displayOriginX;
        body.position.y = worldY - p.displayOriginY;
      }
    });
  }

  private getWorldCoords(x: number, y: number): [number, number] {
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
      duration: this.floatDuration,
      yoyo: true,
      hold: 0,
      repeatDelay: this.floatDelay,
      repeat: -1,
      delay: this.floatDelay,
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
      this.head.play({ key: "mutoid-head-forward", repeat: -1, frameRate: this.headForwardFps });
    }
  }

  private playHeadBackward() {
    if (this.head?.scene && this.player) {
      const mutoidCenterX = this.x + this.displayWidth / 2;
      this.head.setFlipX(this.player.x > mutoidCenterX);

      this.head.play({ key: "mutoid-head-back", repeat: 0, frameRate: this.headBackFps });

      this.head.off(Phaser.Animations.Events.ANIMATION_UPDATE);
      this.head.on(Phaser.Animations.Events.ANIMATION_UPDATE, 
        (_: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
          this.handleFrameChange(frame);
      });

      this.head.once(
        Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "mutoid-head-back",
        () => {
          this.playHeadIdle();
          this.head?.setFlipX(false);
        }
      );
    }
  }

  public handleBulletCollision(bullet: Bullet, mutoidPart: Phaser.GameObjects.GameObject) {
    const part = mutoidPart as Phaser.GameObjects.Image;
    const damageDealt = 1;

    bullet.hp -= 1;

    // Target: Arms
    if (this.armLeftHp > 0 || this.armRightHp > 0) {
      if (part === this.armLeft && this.armLeftHp > 0) {
        this.armLeftHp -= damageDealt;
        if (this.armLeftHp <= 0 && this.armLeft) {
          this.remove(this.armLeft);
          this.parts.remove(this.armLeft);
          this.armLeft.destroy();
          this.armLeft = undefined;
        }
      } else if (part === this.armRight && this.armRightHp > 0) {
        this.armRightHp -= damageDealt;
        if (this.armRightHp <= 0 && this.armRight) {
          this.remove(this.armRight);
          this.parts.remove(this.armRight);
          this.armRight.destroy();
          this.armRight = undefined;
        }
      }
    }
    // Target: Torso
    else if (this.torsoHp > 0) {
      if ((part === this.torsoLeft || part === this.torsoRight) && !this.isTorsoDestroying) {
        this.torsoHp -= damageDealt;

        if (this.torsoHp <= this.torsoDamagedAt && this.torsoLeft && this.torsoRight) {
          this.torsoLeft.setFrame("atlas_s1");
          this.torsoRight.setFrame("atlas_s1");
        }

        if (this.torsoHp <= 0) {
          this.isTorsoDestroying = true;
          this.scene.time.delayedCall(100, () => {
            if (this.torsoLeft) {
              this.remove(this.torsoLeft);
              this.parts.remove(this.torsoLeft);
              this.torsoLeft.destroy();
              this.torsoLeft = undefined;
            }
            if (this.torsoRight) {
              this.remove(this.torsoRight);
              this.parts.remove(this.torsoRight);
              this.torsoRight.destroy();
              this.torsoRight = undefined;
            }
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
          
          this.list.forEach(part => {
            if (part && part.scene) {
              this.remove(part);
              if (part instanceof Phaser.GameObjects.Sprite || part instanceof Phaser.GameObjects.Image) {
                part.destroy();
              }
            }
          });

          // Clear references
          this.head = undefined;
          this.armLeft = undefined;
          this.armRight = undefined;
          this.torsoLeft = undefined;
          this.torsoRight = undefined;
          this.tankLeft = undefined;
          this.tankRight = undefined;
          this.treadFrontLeft = undefined;
          this.treadFrontRight = undefined;

          const explosionGroup = scene.add.group();
          const headTextureKey = head.texture.key;
          for (let i = 0; i < 50; i++) {
            const headPart = scene.physics.add.sprite(explosionX, explosionY, headTextureKey);
            explosionGroup.add(headPart);
            headPart.play('head_explosion_anim');
            const angle = Phaser.Math.Between(0, 360);
            const speed = Phaser.Math.Between(150, 250);
            scene.physics.velocityFromAngle(angle, speed, headPart.body.velocity);
            headPart.body.setGravityY(300);
          }

          scene.time.delayedCall(3000, () => {
            explosionGroup.destroy(true);
            if (this.secondLoop) {
              const url = new URL(window.location.href);
              url.searchParams.set("isMutoidReplacement", "1");
              window.location.href = url.href;
            } else {
              scene.scene.restart({ secondLoop: true });
            }
          });

          if (this.active) {
            this.destroy();
          }
        }
      }
    }

    bullet.destroyBullet();
  }

  private ensureAnimation(
    key: string,
    textureKey: string,
    frames: string[] = ["atlas_s0", "atlas_s1", "atlas_s2"],
    fps: number = this.treadFps,
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

  public setPlayer(player: Player) {
    this.player = player;
  }

  private handleFrameChange(frame: Phaser.Animations.AnimationFrame) {
    if (!this.head || !this.player || !frame.textureFrame) return;

    const frameName = String(frame.textureFrame);
    const suffixMatch = frameName.match(/atlas_s([0-3])$/);
    if (!suffixMatch) return;
    const frameNum = parseInt(suffixMatch[1]);

    // Use phase-2 bullets if both arms are gone
    const bulletPrefix = this.armLeftHp <= 0 && this.armRightHp <= 0
      ? "mutoid-phase2-bullet"
      : "mutoid-bullet";

    const mutoidCenterX = this.x + this.displayWidth / 2;
    const playerIsRight = this.player.x > mutoidCenterX;

    const isBackAnim = this.head.anims.currentAnim?.key === "mutoid-head-back";
    if (!isBackAnim || frameNum === 0) return;

    // Get head world position and create bullet
    const headWorldPos = this.head.getWorldTransformMatrix();
    const headX = headWorldPos.tx;
    const headY = headWorldPos.ty + 10;

    const bullet = this.bulletGroup.get(headX, headY) as Bullet;
    if (bullet) {
      // Configure bullet
      bullet.hp = 1;
      const bulletTexture = `${bulletPrefix}_s${frameNum}`;
      bullet.setTexture(bulletTexture);
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setPosition(headX, headY);
      bullet.setFlipX(playerIsRight);

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);

      // Set bullet direction
      if (frameNum === 3) {
        const toPlayer = new Phaser.Math.Vector2(
          this.player.x - headX,
          this.player.y - headY
        ).normalize();
        body.setVelocity(toPlayer.x * bullet.speed, toPlayer.y * bullet.speed);
      } else {
        const baseAngles = {
          1: -60,  // upward diagonal
          2: -30,  // less upward
          3: 0     // straight
        };
        let angle = baseAngles[frameNum as 1 | 2 | 3];
        if (!playerIsRight) {
          angle = 180 - angle;
        }
        this.scene.physics.velocityFromAngle(angle, bullet.speed, body.velocity);
      }
    }
  }
}