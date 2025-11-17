import { Bullet } from './bullet';
import CONSTANTS from "./../constants";
const { GAME_WIDTH, GAME_HEIGHT } = CONSTANTS;
import {
  Graphics
} from "https://codepen.io/CodeMonkeyGames/pen/MWRrLqy.js";


export class Character extends Phaser.GameObjects.Sprite {
  #frameRate = null;
  #repeat = null;
  // Optional explosion Character used for death effects
  explosion?: Character | null;
  private _explosionCompleteHandler?: () => void;

  constructor(
    characterTextures,
    opts = {
      autoPlay: true,
      physics: true
    }
  ) {
    super(
      opts.scene || window.gameScene,
      0,
      0,
      opts.textureKey || "game_asset",
      characterTextures[0]
    );

    this.speed = 0;
    this.deadFlg = 0;

    // if 2nd param is Array convert it
    if (Array.isArray(opts)) {
      opts = {
        explosionTextures: opts,
        autoPlay: true,
        physics: true
      };
    }

    if (void 0 !== opts.originX) {
      this.setOrigin(opts.originX, opts.originY || 0);
    }

    if (void 0 !== opts.explosionTextures) {
      this.explosion = new Character(opts.explosionTextures, {
        autoPlay: false,
        physics: false
      });

      var n = this.height / this.explosion.height;
      if (n >= 1) n = 1;
      this.explosion.setScale(n + 0.2);
      this.explosion.animationSpeed = 0.4;
      this.explosion.loop = false;

      // Keep the explosion hidden and inactive until used
      try {
        this.explosion.setVisible(false);
        this.explosion.setActive(false);
        this.explosion.setPosition(-9999, -9999);
      } catch (e) {
        // ignore if the explosion GameObject isn't fully available yet
      }
    }

    this.anims.create({
      key: "default",
      frames: [
        ...characterTextures.map((k) => {
          return { key: opts.textureKey || "game_asset", frame: k };
        })
      ],
      frameRate: opts.frameRate || 6,
      repeat: -1,
      hideOnComplete: true,
      showOnStart: true
    });

    if (opts.autoPlay) {
      this.on("addedtoscene", (gameObject) => {
        this.scene.time.addEvent({
          callback: () => {
            this.castAdded(gameObject);
          }
        });
      });
    }

    if (opts.physics) this.scene.physics.add.existing(this);

    this.scene.add.existing(this);
  }

  static CUSTOM_EVENT_DEAD = "customEventdead";
  static CUSTOM_EVENT_DEAD_COMPLETE = "customEventdeadComplete";
  static CUSTOM_EVENT_PROJECTILE_ADD = "customEventprojectileadd";

  castAdded() {
    this.play();
  }

  set animationSpeed(percentOfSixty) {
    this.frameRate = 60 * percentOfSixty;
  }
  set loop(bool) {
    this.repeat = Boolean(bool);
  }
  play(key = "default") {
    if (!this.anims) return;

    if (this.frameRate != null || this.repeat != null) {
      let animConfig = { key };

      if (this.frameRate != null) animConfig.frameRate = this.frameRate;
      if (this.repeat != null) animConfig.repeat = this.repeat ? -1 : 0;

      super.play(animConfig);
    } else {
      super.play(key);
    }
  }
}

export class Player extends Character {
  public bulletGroup: Phaser.Physics.Arcade.Group;

  constructor(t) {
    super(
      t.texture,
      {
        ...t,
        autoPlay: true,
        physics: true
      }
    );
    var o = this;
    (t.barrierEffectTexture = "shieldEffect.png"),
      (t.hit = ["hit0.gif", "hit1.gif", "hit2.gif", "hit3.gif", "hit4.gif"]),
      (t.guard = [
        "guard0.gif",
        "guard1.gif",
        "guard2.gif",
        "guard3.gif",
        "guard4.gif"
      ]);
    o.barrier = new Character(t.barrier.texture);
    o.barrier.animationSpeed = 0.25;
    o.barrier.setScale(Math.round(o.barrier.scale * 100) / 100);
    o.barrierEffect = new Character([t.barrierEffectTexture], {
      autoPlay: false,
      physics: false
    });
    this.scene.time.addEvent({
      callback: () => {
        o.body.setSize(o.width - 14, o.height - 40),
          o.body.setOffset(7, 20),
          (o.barrier.visible = false);
        o.barrierEffect.visible = false;
      }
    });
    (o.dragAreaRect = new Graphics(window.gameScene)),
      o.dragAreaRect.clear(),
      o.dragAreaRect.fill(0xffffff, 0),
      o.dragAreaRect.fillRect(
        0,
        0,
        GAME_WIDTH,
        GAME_HEIGHT
      ),
      o.dragAreaRect.setInteractive({
        useHandCursor: false,
        draggable: true
      });
    window.gameScene.add.existing(o.dragAreaRect);
    return (
      (o.name = t.name),
      (o.hp = t.hp),
      (o.maxHp = t.maxHp),
      (o.shootNormalData = t.shootNormal),
      (o.shootNormalData.explosion = t.hit),
      (o.shootNormalData.guard = t.guard),
      (o.shootBigData = t.shootBig),
      (o.shootBigData.explosion = t.hit),
      (o.shootBigData.guard = t.guard),
      (o.shootBigData.postFX = t.shootBig.postFX),
      (o.shoot3wayData = t.shoot3way),
      (o.shoot3wayData.explosion = t.hit),
      (o.shoot3wayData.guard = t.guard),
      (o.shootOn = 0),
      (o.bulletGroup = o.scene.physics.add.group({ classType: Bullet, runChildUpdate: true })),
      (o.bulletFrameCnt = 0),
      (o.bulletIdCnt = 0),
      (o.shootSpeed = 0),
      (o.shootInterval = 0),
      (o.shootData = {}),
      // Initialize with default shooting mode
      (o.shootMode = t.defaultShootName || Player.SHOOT_NAME_NORMAL),
      (o.shootData = o.shootNormalData),
      (o.shootInterval = o.shootNormalData.interval),
      (o._percent = 0),
      (o.unitX = 0),
      (o.unitY = 0),
      (o.animationSpeed = 0.35),
      (o.damageAnimationFlg = 0),
      (o.barrierFlg = 0),
      (o.screenDragFlg = 0),
      (o.beforeX = 0),
      (o.beforeY = 0),
      (o.keyDownFlg = 0),
      (o.keyDownCode = ""),
    (o.theWorldFlg = false),
    (o.gamepad = null),
    (o.gamepadIndex = -1),
    o
  );
}
  static SHOOT_NAME_NORMAL = "normal";
  static SHOOT_NAME_BIG = "big";
  static SHOOT_NAME_3WAY = "3way";
  static SHOOT_SPEED_NORMAL = "speed_normal";
  static SHOOT_SPEED_HIGH = "speed_high";
  static BARRIER = "barrier";
  onScreenDragStart(pointer, localX, localY, event) {
    (this.unitX = localX - this.displayWidth / 2), (this.screenDragFlg = 1);
    this.shootStart();
  }
  onScreenDragMove(pointer, localX, localY, event) {
    if (this.screenDragFlg) {
      this.unitX = localX - this.displayWidth / 2;
    }
  }
  onScreenDragEnd(t) {
    this.screenDragFlg = 0;
    this.shootStop();
  }
  onKeyDown(t) {
    // TV remote - channel up/down to move, 0 for special
    switch (t.key) {
      case "0":
        return window.gameScene.hud.spFire();
      case "ArrowLeft":
      case "PageUp":
        this.unitX -= 6, this.shootOn = 1;
        break;
      case "ArrowRight":
      case "PageDown":
        this.unitX += 6, this.shootOn = 1;
        break;
    }
    (this.keyDownFlg = 1), (this.keyDownCode = t.keyCode), t.preventDefault();
  }
  onKeyUp(t) {
    (this.keyDownFlg = 0), (this.shootOn = 1), t.preventDefault();
  }
  update() {
    // Keyboard input is now handled by gamepad emulation or separate handlers
    // When origin is (0,0), this.x already represents the left edge
    (this.x = Math.round(this.x + 0.09 * (this.unitX - this.x))),
      (this.y = Math.round(this.y + 0.09 * (this.unitY - this.y))),
      (this.barrier.x = this.x),
      (this.barrier.y = this.y),
      this.bulletFrameCnt++,
      this.shootOn &&
      !this.theWorldFlg &&
      this.bulletFrameCnt % (this.shootInterval - this.shootSpeed) == 0 &&
      this.shoot();

    this.bulletGroup.getChildren().forEach((bullet: Bullet) => {
      if (bullet.y < -50 || bullet.x < -50 || bullet.x > GAME_WIDTH + 200) {
        bullet.destroy();
      }
    });
  }
  shoot() {
    this.fireBullet();
  }
  shootModeChange(t) {
    switch (((this.shootMode = t), this.shootMode)) {
      case Player.SHOOT_NAME_NORMAL:
        (this.shootData = this.shootNormalData),
          (this.shootInterval = this.shootData.interval);
        break;
      case Player.SHOOT_NAME_BIG:
        (this.shootData = this.shootBigData),
          (this.shootInterval = this.shootData.interval);
        break;
      case Player.SHOOT_NAME_3WAY:
        (this.shootData = this.shoot3wayData),
          (this.shootInterval = this.shootData.interval);
    }
  }
  shootSpeedChange(t) {
    switch (t) {
      case Player.SHOOT_SPEED_NORMAL:
        this.shootSpeed = 0;
        break;
      case Player.SHOOT_SPEED_HIGH:
        this.shootSpeed = 15;
    }
  }
  setUp(t, o, i) {
    let controllerIds = window.controllers ?
      Object.keys(window.controllers) : [];
    if (controllerIds.length) {
      this.gamepad = window.controllers[controllerIds[0]];
      this.gamepadVibration = this.gamepad?.vibrationActuator;
    }
    switch (
    ((this.hp = t),
      (this._percent = this.hp / this.maxHp),
      (this.shootMode = o),
      this.shootMode)
    ) {
      case Player.SHOOT_NAME_NORMAL:
        (this.shootData = this.shootNormalData),
          (this.shootInterval = this.shootData.interval);
        break;
      case Player.SHOOT_NAME_BIG:
        (this.shootData = this.shootBigData),
          (this.shootInterval = this.shootData.interval);
        break;
      case Player.SHOOT_NAME_3WAY:
        (this.shootData = this.shoot3wayData),
          (this.shootInterval = this.shootData.interval);
    }
    switch (i) {
      case Player.SHOOT_SPEED_NORMAL:
        this.shootSpeed = 0;
        break;
      case Player.SHOOT_SPEED_HIGH:
        this.shootSpeed = 15;
    }
  }
  shootStop() {
    this.shootOn = 0;
  }
  shootStart() {
    this.shootOn = 1;
  }
  barrierStart() {
    (this.barrierFlg = 1),
      (this.barrier.alpha = 0),
      (this.barrier.visible = true),
      (this.barrierEffect.x = this.x),
      (this.barrierEffect.y = this.y),
      (this.barrierEffect.alpha = 1),
      (this.barrierEffect.visible = true),
      this.barrierEffect.setScale(1),
      TweenMax.to(this.barrierEffect, 0.4, {
        scaleX: 2,
        scaleY: 2,
        ease: Quint.easeOut
      }),
      TweenMax.to(this.barrierEffect, 0.5, {
        alpha: 0
      }),
      this.tl && (this.tl.kill(), (this.tl = null)),
      (this.tl = new TimelineMax({
        onComplete: function () {
          (this.barrier.visible = !1),
            (this.barrierFlg = !1),
            (this.barrierEffect.visible = !1);
        },
        onCompleteScope: this
      })),
      this.tl
        .to(
          this.barrier,
          0.3, {
          alpha: 1
        },
          "+=0"
        )
        .call(
          function () {
            this.barrier.alpha = 0;
          },
          null,
          this,
          "+=4.0"
        )
        .to(
          this.barrier,
          1, {
          alpha: 1
        },
          "+=0"
        )
        .call(
          function () {
            this.barrier.alpha = 0;
          },
          null,
          this,
          "+=1"
        )
        .to(
          this.barrier,
          1, {
          alpha: 1
        },
          "+=0"
        )
        .call(
          function () {
            this.barrier.alpha = 0;
          },
          null,
          this,
          "+=0.5"
        )
        .to(
          this.barrier,
          0.5, {
          alpha: 1
        },
          "+=0"
        )
        .call(
          function () {
            this.barrier.alpha = 0;
          },
          null,
          this,
          "+=0.5"
        )
        .to(
          this.barrier,
          0.5, {
          alpha: 1
        },
          "+=0"
        )
        .call(
          function () {
            this.barrier.alpha = 0;
          },
          null,
          this,
          "+=0.1"
        )
        .call(
          function () {
            this.barrier.alpha = 1;
          },
          null,
          this,
          "+=0.1"
        )
        .call(
          function () {
            this.barrier.alpha = 0;
          },
          null,
          this,
          "+=0.1"
        )
        .call(
          function () {
            this.barrier.alpha = 1;
          },
          null,
          this,
          "+=0.1"
        );
  }
  barrierHitEffect() {
    if (this.gamepadVibration) {
      let weakMagnitude = this.x / GAME_WIDTH;
      let strongMagnitude = 1 - weakMagnitude;
      this.gamepadVibration.playEffect("dual-rumble", {
        startDelay: 0,
        duration: 40,
        weakMagnitude,
        strongMagnitude
      });
    } else {
      if (window.cordova && cordova.plugins && cordova.plugins.vibration) {
        cordova.plugins.vibration.vibrate(30);
      } else {
        navigator.vibrate?.(30);
      }
    }
    (this.barrier.tint = 16711680),
      TweenMax.to(this.barrier, 0.2, {
        tint: 16777215
      });
  }
  handleGamepadInput(gamepad: Phaser.Input.Gamepad.Gamepad) {
    const shootButton = gamepad.buttons.some((button, index) => button.pressed && index < 4);
    if (shootButton && !this.shootOn) {
      this.shootStart();
    } else if (!shootButton && this.shootOn) {
      this.shootStop();
    }
  }

  fireBullet() {
    const bulletTexture = 'bullet'; // Always use the bullet.png from asset-pack.json

    let actuator: any = null; // Use 'any' to avoid type conflicts between specs
    if (navigator.getGamepads && this.gamepadIndex > -1) {
        const pad = navigator.getGamepads()[this.gamepadIndex];

        if (pad && pad.connected) {
            // Modern spec
            if (pad.vibrationActuator) {
                actuator = pad.vibrationActuator;
            }
            // Older spec
            else if (pad.hapticActuators && pad.hapticActuators.length > 0) {
                actuator = pad.hapticActuators[0];
            }
        }
    }

    // Spawn bullet ------------------------------------------
    // Use full sprite width for consistent bullet spawn position
    const bulletX = this.x + this.width - 5;  // Spawn from visual right edge
    const bulletY = this.y;                   // Spawn from top edge (no offset)

    const bullet = new Bullet(this.scene, bulletX, bulletY, bulletTexture);
    bullet.id = ++this.bulletIdCnt;
    bullet.rotation = -Math.PI / 2; // Point upward
    this.bulletGroup.add(bullet);
    this.scene.add.existing(bullet);

    // Create bullet animation from shootNormal texture array
    if (this.shootData?.texture && Array.isArray(this.shootData.texture) && this.shootData.texture.length > 0) {
      const animKey = `bullet_anim_${this.bulletIdCnt}`;
      const frameRate = this.shootData.frameRate ?? 12;
      const textureKey = this.shootData.textureKey || 'game_asset';

      // Create animation frames from shootNormal textures
      const frames = this.shootData.texture.map((frameName: string) => {
        return { key: textureKey, frame: frameName };
      });

      // Create the animation
      bullet.anims.create({
        key: animKey,
        frames: frames,
        frameRate: frameRate,
        repeat: -1
      });

      // Play the animation
      bullet.play(animKey);
    }

    const damage = this.shootData?.damage ?? 1;
    const durationBase = 25;                     // ms
    const duration = durationBase + (damage - 1) * 10;

    // Gamepad haptic feedback
    if (actuator) {
      const magnitudeBase = 0.4;                  // normal shot
      let strongMagnitude = Math.min(1, magnitudeBase + (damage - 1) * 0.45);
      let weakMagnitude   = strongMagnitude * 0.35;

      // Slight positional flavour (more rumble the further from centre)
      const edgeFactor = Math.abs(this.x - GAME_WIDTH / 2) / (GAME_WIDTH / 2);
      weakMagnitude = Math.min(1, weakMagnitude + edgeFactor * 0.2);

      if (typeof (actuator as any).playEffect === 'function') {
        (actuator as any)
          .playEffect('dual-rumble', {
            startDelay: 0,
            duration,
            strongMagnitude,
            weakMagnitude
          })
          .catch(() => {}); // ignore unsupported devices
      } else if (typeof (actuator as any).pulse === 'function') {
        (actuator as any).pulse(strongMagnitude, duration);
      }
    }

    // Mobile device vibration (in sync with gamepad haptics)
    if (window.cordova && cordova.plugins && cordova.plugins.vibration) {
      cordova.plugins.vibration.vibrate(duration);
    } else if (navigator.vibrate) {
      navigator.vibrate(duration);
    }

    // Fire the bullet straight upward
    if (bullet.body) {
      bullet.body.setVelocity(0, -(this.shootData?.speed ?? 450));
    }
  }

  spFire() { }

  onDamage(t) {
    if (this.barrierFlg);
    else if (!0 !== this.damageAnimationFlg) {
      this.hp -= t;
      if (this.hp <= 0) this.hp = 0;
      this._percent = this.hp / this.maxHp;
      
      const weakMagnitude = this.x / GAME_WIDTH;
      const strongMagnitude = 1 - weakMagnitude;
      
      if (this.hp <= 0) {
        // Death vibration - long duration
        const deathDuration = 777;
        
        // Gamepad vibration
        if (this.gamepadVibration) {
          this.gamepadVibration.playEffect("dual-rumble", {
            startDelay: 0,
            duration: deathDuration,
            weakMagnitude,
            strongMagnitude
          });
        }
        
        // Mobile vibration (runs simultaneously)
        if (window.cordova && cordova.plugins && cordova.plugins.vibration) {
          cordova.plugins.vibration.vibrate(deathDuration);
        } else if (navigator.vibrate) {
          navigator.vibrate(deathDuration);
        }
        
        this.dead();
      } else {
        // Damage vibration - short duration
        const damageDuration = 150;
        
        // Gamepad vibration
        if (this.gamepadVibration) {
          this.gamepadVibration.playEffect("dual-rumble", {
            startDelay: 0,
            duration: damageDuration,
            weakMagnitude,
            strongMagnitude
          });
        }
        
        // Mobile vibration (runs simultaneously)
        if (window.cordova && cordova.plugins && cordova.plugins.vibration) {
          cordova.plugins.vibration.vibrate(damageDuration);
        } else if (navigator.vibrate) {
          navigator.vibrate(damageDuration);
        }

        this.damageAnimationFlg = !0;
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 100,
            ease: 'Linear',
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.alpha = 1;
                this.damageAnimationFlg = !1;
            }
        });
      }
    }
  }
  dead() {
    // Emit death, stop shooting, and play the explosion animation (if available)
    this.emit(Character.CUSTOM_EVENT_DEAD);
    this.shootStop();

    if (this.explosion) {
      // Bind a stable handler so we can remove it later
      this._explosionCompleteHandler = this.explosionComplete.bind(this);
      this.explosion.on("animationcomplete", this._explosionCompleteHandler);

      // Position and show the explosion, then play
      this.explosion.setPosition(this.x, this.y);
      this.explosion.setVisible(true);
      this.explosion.setActive(true);
      this.explosion.play();
    }

    this.bulletGroup.clear(true, true);
  }
  explosionComplete() {
    // Hide explosion after animation and move offscreen so its first frame isn't visible
    if (this.explosion) {
      try {
        // Remove the specific handler we attached earlier
        if (this._explosionCompleteHandler) {
          this.explosion.off("animationcomplete", this._explosionCompleteHandler);
          this._explosionCompleteHandler = undefined;
        }

        this.explosion.setVisible(false);
        this.explosion.setActive(false);
        this.explosion.setPosition(-9999, -9999);
      } catch (e) {
        // ignore
      }
    }

    this.emit(Character.CUSTOM_EVENT_DEAD_COMPLETE);
  }
  castAdded(gameObject) {
    super.castAdded();
    gameObject.dragAreaRect.on(
      "pointerdown",
      gameObject.onScreenDragStart.bind(gameObject)
    ),
      gameObject.dragAreaRect.on(
        "pointerup",
        gameObject.onScreenDragEnd.bind(gameObject)
      ),
      gameObject.dragAreaRect.on(
        "pointerupoutside",
        gameObject.onScreenDragEnd.bind(gameObject)
      ),
      gameObject.dragAreaRect.on(
        "pointermove",
        gameObject.onScreenDragMove.bind(gameObject)
      );
    (gameObject.keyDownListener = gameObject.onKeyDown.bind(this)),
      (gameObject.keyUpListener = gameObject.onKeyUp.bind(this)),
      document.addEventListener("keydown", gameObject.keyDownListener),
      document.addEventListener("keyup", gameObject.keyUpListener),
      (gameObject.damageAnimationFlg = 0);
  }
  removedFromScene(gameObject, scene) {
    console.log("[Player] removedFromScene", gameObject);
    document.removeEventListener("keydown", this.keyDownListener),
      document.removeEventListener("keyup", this.keyUpListener),
      (this.keyDownListener = null),
      (this.keyUpListener = null);
  }
  destroy() {
    // Clean up event listeners
    if (this.keyDownListener) {
      document.removeEventListener("keydown", this.keyDownListener);
      this.keyDownListener = null;
    }
    if (this.keyUpListener) {
      document.removeEventListener("keyup", this.keyUpListener);
      this.keyUpListener = null;
    }
    
    // Clean up drag area
    if (this.dragAreaRect) {
      this.dragAreaRect.destroy();
      this.dragAreaRect = null;
    }
    
    // Clean up barrier and effects
    if (this.barrier) {
      this.barrier.destroy();
      this.barrier = null;
    }
    if (this.barrierEffect) {
      this.barrierEffect.destroy();
      this.barrierEffect = null;
    }
    
    // Clean up bullets
    if (this.bulletGroup) {
      this.bulletGroup.destroy(true);
      this.bulletGroup = null;
    }
    
    // Clean up timeline
    if (this.tl) {
      this.tl.kill();
      this.tl = null;
    }
    
    // Call parent destroy
    super.destroy();
  }
  
  get percent() {
    return this._percent;
  }
  set percent(t) {
    this._percent = t;
  }
}
