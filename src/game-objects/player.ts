import { Bullet } from './bullet';
import CONSTANTS from "https://codepen.io/CodeMonkeyGames/pen/MWMxmOq.js";
import {
  Graphics
} from "https://codepen.io/CodeMonkeyGames/pen/MWRrLqy.js";


export class Character extends Phaser.GameObjects.Sprite {
  #frameRate = null;
  #repeat = null;

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

    if (void 0 !== opts.explosionTextures) {
      this.explosion = new Character(opts.explosionTextures, {
        autoPlay: false,
        physics: false
      });

      var n = this.height / this.explosion.height;
      n >= 1 && (n = 1),
        this.explosion.setScale(n + 0.2),
        (this.explosion.animationSpeed = 0.4),
        (this.explosion.loop = !1);
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
    o.barrierEffect = new Character([t.barrierEffectTexture], {
      autoPlay: false,
      physics: false
    });
    this.scene.time.addEvent({
      callback: () => {
        // o.body.setSize(o.width - 14, o.height - 40),
        o.body.setSize(o.height - 40, o.width - 14),
          // o.body.setOffset(7 + o.width / 2, 20 + o.height / 2),
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
        CONSTANTS.GAME_WIDTH,
        CONSTANTS.GAME_HEIGHT
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
      (o.bulletList = []),
      (o.bulletFrameCnt = 0),
      (o.bulletIdCnt = 0),
      (o.shootSpeed = 0),
      (o.shootInterval = 0),
      (o.shootData = {}),
      o.shootMode,
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
    (this.unitX = localX), (this.screenDragFlg = 1);
  }
  onScreenDragMove(pointer, localX, localY, event) {
    if (this.screenDragFlg) {
      this.unitX = localX;
      this.unitX = Phaser.Math.Clamp(
        this.unitX,
        this.body.width / 2,
        CONSTANTS.GAME_WIDTH - this.body.width / 2
      );
    }
  }
  onScreenDragEnd(t) {
    this.screenDragFlg = 0;
  }
  onKeyDown(t) {
    // TV remote - channel up/down to move, 0 for special
    switch (t.key) {
      case "0":
        return window.gameScene.hud.spFire();
      case "PageUp":
        this.unitX -= 6;
        break;
      case "PageDown":
        this.unitX += 6;
        break;
    }
    (this.keyDownFlg = 1), (this.keyDownCode = t.keyCode), t.preventDefault();
  }
  onKeyUp(t) {
    (this.keyDownFlg = 0), t.preventDefault();
  }
  update() {
    if (this.keyDownFlg) {
      switch (this.keyDownCode) {
        case 37:
          this.unitX -= 6;
          break;
        case 39:
          this.unitX += 6;
      }
      this.unitX <= this.body.width / 2 && (this.unitX = this.body.width / 2),
        this.unitX >= CONSTANTS.GAME_WIDTH - this.body.width / 2 &&
        (this.unitX = CONSTANTS.GAME_WIDTH - this.body.width / 2);
    }
    (this.x += 0.09 * (this.unitX - (this.x + this.body.width / 2))),
      (this.y += 0.09 * (this.unitY - this.y)),
      (this.barrier.x = this.x),
      (this.barrier.y = this.y),
      this.bulletFrameCnt++,
      this.shootOn &&
      this.bulletFrameCnt % (this.shootInterval - this.shootSpeed) == 0 &&
      this.shoot();
    for (var t = 0; t < this.bulletList.length; t++) {
      var e = this.bulletList[t];
      (e.x += 3.5 * Math.cos(e.rotation)),
        (e.y += 3.5 * Math.sin(e.rotation)),
        (e.y <= 40 || e.x <= -e.width || e.x >= CONSTANTS.GAME_WIDTH) &&
        (this.bulletRemove(e), this.bulletRemoveComplete(e));
    }
  }
  shoot() {
    this.fireBullet();
  }
  bulletRemove(t) {
    for (var e = 0; e < this.bulletList.length; e++)
      t.id == this.bulletList[e].id && this.bulletList.splice(e, 1);
  }
  bulletRemoveComplete(t) {
    t.off(Character.CUSTOM_EVENT_DEAD, this.bulletRemove.bind(this, t)),
      t.off(
        Character.CUSTOM_EVENT_DEAD_COMPLETE,
        this.bulletRemoveComplete.bind(this, t)
      );
    t.dead();
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
      this.barrierEffect.setScale(0.5),
      TweenMax.to(this.barrierEffect, 0.4, {
        scaleX: 1,
        scaleY: 1,
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
      let weakMagnitude = this.x / CONSTANTS.GAME_WIDTH;
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
    if (gamepad.buttons.some(button => button.pressed)) {
      this.fireBullet();
    }
  }

  fireBullet() {
    const bullet = new Bullet(this.scene, this.x, this.y, 'bullet');
    this.bulletList.push(bullet);
    this.scene.add.existing(bullet);
  }

  caFire() { }
  onDamage(t) {
    if (this.barrierFlg);
    else if (!0 !== this.damageAnimationFlg) {
      let weakMagnitude = this.x / CONSTANTS.GAME_WIDTH;
      let strongMagnitude = 1 - weakMagnitude;
      if (
        ((this.hp -= t),
          this.hp <= 0 && (this.hp = 0),
          (this._percent = this.hp / this.maxHp),
          this.hp <= 0)
      )
        if (this.gamepadVibration) {
          this.gamepadVibration.playEffect("dual-rumble", {
            startDelay: 0,
            duration: 777,
            weakMagnitude,
            strongMagnitude
          });
          this.dead();
        } else {
          if (window.cordova && cordova.plugins && cordova.plugins.vibration) {
            cordova.plugins.vibration.vibrate(777);
          } else {
            navigator.vibrate?.(777);
          }
          this.dead();
        }
      else {
        if (this.gamepadVibration) {
          this.gamepadVibration.playEffect("dual-rumble", {
            startDelay: 0,
            duration: 150,
            weakMagnitude,
            strongMagnitude
          });
        } else {
          if (window.cordova && cordova.plugins && cordova.plugins.vibration) {
            cordova.plugins.vibration.vibrate(150);
          } else {
            navigator.vibrate?.(150);
          }
        }
        var e = new TimelineMax({
          onComplete: function () {
            this.damageAnimationFlg = !1;
          }.bind(this)
        });
        e.to(this, 0.15, {
          delay: 0,
          y: this.y + 2,
          tint: 16711680,
          alpha: 0.2
        }),
          e.to(this, 0.15, {
            delay: 0,
            y: this.y - 2,
            tint: 16777215,
            alpha: 1
          }),
          e.to(this, 0.15, {
            delay: 0.05,
            y: this.y + 2,
            tint: 16711680,
            alpha: 0.2
          }),
          e.to(this, 0.15, {
            delay: 0,
            y: this.y - 2,
            tint: 16777215,
            alpha: 1
          }),
          e.to(this, 0.15, {
            delay: 0.05,
            y: this.y + 2,
            tint: 16711680,
            alpha: 0.2
          }),
          e.to(this, 0.15, {
            delay: 0,
            y: this.y + 0,
            tint: 16777215,
            alpha: 1
          }),
          e.to(this, 0.15, {
            delay: 0.05,
            y: this.y + 2,
            tint: 16711680,
            alpha: 0.2
          }),
          e.to(this, 0.15, {
            delay: 0,
            y: this.y + 0,
            tint: 16777215,
            alpha: 1
          });
      }
      this.damageAnimationFlg = !0;
    }
  }
  dead() {
    this.emit(Character.CUSTOM_EVENT_DEAD),
      this.shootStop(),
      this.explosion.on("animationcomplete", this.explosionComplete.bind(this)),
      (this.explosion.x = this.x),
      (this.explosion.y = this.y),
      this.explosion.play();
    for (var t = 0; t < this.bulletList.length; t++) {
      var e = this.bulletList[t];
      e.destroy();
    }
  }
  explosionComplete() {
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
  get percent() {
    return this._percent;
  }
  set percent(t) {
    this._percent = t;
  }
}