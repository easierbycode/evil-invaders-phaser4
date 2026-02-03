
// You can write more code here
import CONSTANTS from "./../constants";
const { GAME_WIDTH, GAME_HEIGHT } = CONSTANTS;
import Sound from './../soundManager';

/* START OF COMPILED CODE */

export default class TitleScene extends Phaser.Scene {

  constructor() {
    super("TitleScene");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {

    // bg
    const bg = this.add.tileSprite(0, 0, 256, 480, "stars-bg");
    bg.setOrigin(0, 0);

    // titleG
    const titleG = this.add.sprite(256, 100, "flirty-girls-whitehouse", "0");
    titleG.setOrigin(0, 0);

    // logo
    const logo = this.add.image(116, -82, "logo");
    logo.scaleX = 2;
    logo.scaleY = 2;

    // subTitle
    const subTitle = this.add.image(127, -82, "subTitleEn");
    subTitle.scaleX = 3;
    subTitle.scaleY = 3;

    this.bg = bg;
    this.titleG = titleG;
    this.logo = logo;
    this.subTitle = subTitle;

    this.events.emit("scene-awake");
  }

  private bg!: Phaser.GameObjects.TileSprite;
  private titleG!: Phaser.GameObjects.Sprite;
  private logo!: Phaser.GameObjects.Image;
  private subTitle!: Phaser.GameObjects.Image;

  /* START-USER-CODE */

  private startBtn!: Phaser.GameObjects.Sprite;
  private highScoreBtn!: Phaser.GameObjects.Text;
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;
  private prevSelectState: boolean = false;
  private prevDpadUpState: boolean = false;

  // Write your code here

  create() {

    this.editorCreate();

    // Play title background music
    Sound.bgmPlayLoop("title_bgm", 0.4);

    this.startBtn = this.physics
      .add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 150, 'game_ui', 'titleStartText.png')
      .setAlpha(0);

    this.startBtn.on('pointerup', () => {
      this.scene.start("GameScene");
    });

    // High Score button
    this.highScoreBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, "HIGH SCORES", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#ffff00"
    }).setOrigin(0.5).setAlpha(0).setInteractive();

    this.highScoreBtn.on('pointerup', () => {
      this.scene.start("HighScoreScene");
    });

    this.highScoreBtn.on('pointerover', () => {
      this.highScoreBtn.setColor("#ffffff");
    });

    this.highScoreBtn.on('pointerout', () => {
      this.highScoreBtn.setColor("#ffff00");
    });

    // Setup gamepad for SELECT + D-PAD UP combo
    this.setupGamepad();

    const animations = this.anims.createFromAseprite("flirty-girls-whitehouse");
    const animKeys = animations.map((anim) => anim.key);
    const defaultAnim = animKeys[0];

    var e = new TimelineMax({
      onComplete: () => this.titleG.play({ key: defaultAnim, repeat: -1 }),
      onCompleteScope: this
    });

    e.to(
      this.titleG,
      2,
      {
        x: GAME_WIDTH / 2 - this.titleG.width / 2 + 5,
        y: 113,
        ease: Quint.easeOut,
      },
      "+=0.0"
    ),

      e.addCallback(function () { }, "-=0.1", null, this),

      e.to(this.logo, .9, {
        y: 75,
        ease: Quint.easeIn
      }, "-=0.8"),

      e.to(this.logo, .9, {
        scaleX: 1,
        scaleY: 1,
        ease: Quint.easeIn
      }, "-=0.9"),

      e.to(this.subTitle, .9, {
        y: 130,
        ease: Quint.easeIn
      }, "-=0.82"),

      e.to(this.subTitle, .9, {
        scaleX: 1,
        scaleY: 1,
        ease: Quint.easeIn
      }, "-=0.9"),

      e.addCallback(function () {
        Sound.play("voice_titlecall")
      }, "-=0.5", null, this),




      e.to(this.startBtn, .1, {
        alpha: 1
      }),

      e.to(this.highScoreBtn, .1, {
        alpha: 1
      }, "-=0.1"),

      e.addCallback(() => {
        this.startBtn.setInteractive(); //,
        // this.startBtn.onFlash.bind(this.startBtn)()

        this.tl = new TimelineMax({
          repeat: -1,
          yoyo: !0
        });

        this.tl
          .to(this.startBtn, .3, {
            delay: .1,
            alpha: 0
          })
          .to(this.startBtn, .8, {
            alpha: 1
          });

      }, "+=0.3", null, this);
  }

  setupGamepad() {
    // Get connected gamepad
    const pads = this.input.gamepad.gamepads;
    if (pads && pads.length > 0) {
      this.gamepad = pads.find(p => p?.connected) || null;
    }

    // Listen for gamepad connection
    this.input.gamepad.on("connected", (pad: Phaser.Input.Gamepad.Gamepad) => {
      this.gamepad = pad;
    });
  }

  update() {
    this.bg.tilePositionX -= 0.5;

    // Check for SELECT + D-PAD UP gamepad combo
    this.checkHighScoreCombo();
  }

  checkHighScoreCombo() {
    if (!this.gamepad) return;

    const BUTTON_SELECT = 8;
    const AXIS_LEFT_Y = 1;

    const selectPressed = this.gamepad.buttons[BUTTON_SELECT]?.pressed || false;
    const leftY = this.gamepad.axes.length > AXIS_LEFT_Y ? this.gamepad.axes[AXIS_LEFT_Y].getValue() : 0;
    const dpadUp = this.gamepad.buttons[12]?.pressed || leftY < -0.5;

    // Edge detection - trigger only on press, not hold
    const comboPressed = selectPressed && dpadUp;
    const wasComboPressed = this.prevSelectState && this.prevDpadUpState;

    if (comboPressed && !wasComboPressed) {
      this.scene.start("HighScoreScene");
    }

    this.prevSelectState = selectPressed;
    this.prevDpadUpState = dpadUp;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
