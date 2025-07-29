import Phaser from 'phaser';

export class Character extends Phaser.GameObjects.Sprite {
  #frameRate = null;
  #repeat = null;
  speed = 0;
  deadFlg = 0;
  explosion?: Character;
  tl?: any;

  constructor(
    characterTextures: string[],
    opts: any = {
      autoPlay: true,
      physics: true
    }
  ) {
    super(
      opts.scene || (window as any).gameScene,
      0,
      0,
      opts.textureKey || "game_asset",
      characterTextures[0]
    );

    // Ensure pixel-perfect rendering
    this.setTexture(opts.textureKey || "game_asset", characterTextures[0]);
    
    // If 2nd param is Array convert it
    if (Array.isArray(opts)) {
      opts = {
        explosionTextures: opts,
        autoPlay: true,
        physics: true
      };
    }

    if (opts.originX !== undefined) {
      this.setOrigin(opts.originX, opts.originY || 0);
    }

    if (opts.explosionTextures !== undefined) {
      this.explosion = new Character(opts.explosionTextures, {
        autoPlay: false,
        physics: false
      });

      // Use integer scaling only
      const scale = Math.max(1, Math.floor(this.height / this.explosion.height));
      this.explosion.setScale(scale);
      this.explosion.animationSpeed = 0.4;
      this.explosion.loop = false;
    }

    this.anims.create({
      key: "default",
      frames: characterTextures.map((k) => {
        return { key: opts.textureKey || "game_asset", frame: k };
      }),
      frameRate: opts.frameRate || 6,
      repeat: -1,
      hideOnComplete: true,
      showOnStart: true
    });

    if (opts.autoPlay) {
      this.on("addedtoscene", (gameObject: Phaser.GameObjects.GameObject) => {
        this.scene.time.addEvent({
          callback: () => {
            this.castAdded(gameObject);
          }
        });
      });
    }

    if (opts.physics) {
      this.scene.physics.add.existing(this);
    }

    this.scene.add.existing(this);
  }

  static CUSTOM_EVENT_DEAD = "customEventdead";
  static CUSTOM_EVENT_DEAD_COMPLETE = "customEventdeadComplete";
  static CUSTOM_EVENT_PROJECTILE_ADD = "customEventprojectileadd";

  castAdded(gameObject: Phaser.GameObjects.GameObject) {
    this.play();
  }

  set animationSpeed(percentOfSixty: number) {
    this.frameRate = 60 * percentOfSixty;
  }

  get frameRate() {
    return this.#frameRate;
  }

  set frameRate(value: number | null) {
    this.#frameRate = value;
  }

  set loop(bool: boolean) {
    this.repeat = Boolean(bool);
  }

  get repeat() {
    return this.#repeat;
  }

  set repeat(value: boolean | null) {
    this.#repeat = value;
  }

  play(key = "default") {
    if (!this.anims) return;

    if (this.frameRate != null || this.repeat != null) {
      let animConfig: any = { key };

      if (this.frameRate != null) animConfig.frameRate = this.frameRate;
      if (this.repeat != null) animConfig.repeat = this.repeat ? -1 : 0;

      super.play(animConfig);
    } else {
      super.play(key);
    }
  }

  dead() {
    // Override in subclasses
  }
}