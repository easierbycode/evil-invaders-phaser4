
// You can write more code here
import CONSTANTS from "./../constants";
const { GAME_WIDTH, GAME_HEIGHT } = CONSTANTS;
import Sound from './../soundManager';
import { setupSecretTouchHandler } from "./../utils/helper-checkForSecretTouch";
import { requestFullscreen } from "./../utils/fullscreen";

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
  private storyOverlay: HTMLDivElement | null = null;
  private storyCloseHandler: (() => void) | null = null;
  private storyShown = false;

  // Write your code here

  create() {

    this.editorCreate();

    // Secret touch: first time → show story, second time → skip to GameScene
    setupSecretTouchHandler(this, GAME_WIDTH, GAME_HEIGHT, () => this.handleSecretTouch());

    // Play title background music
    Sound.bgmPlayLoop("title_bgm", 0.4);

    this.startBtn = this.physics
      .add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 150, 'game_ui', 'titleStartText.png')
      .setAlpha(0);

    this.startBtn.on('pointerup', () => {
      Sound.bgmPlayLoop("main_bgm", 0.4);
      this.scene.start("GameScene");
    });

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

  update() {
    this.bg.tilePositionX -= 0.5;
    this.pollStoryCloseGamepad();
  }

  private handleSecretTouch() {
    if (this.storyShown) {
      this.closeStoryOverlay();
      Sound.bgmPlayLoop("main_bgm", 0.4);
      this.scene.start("GameScene");
      return;
    }
    this.showStoryOverlay();
  }

  private showStoryOverlay() {
    if (this.storyOverlay) return;
    this.storyShown = true;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;background:#000;';

    const iframe = document.createElement('iframe');
    iframe.src = 'assets/story.html';
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    iframe.allowFullscreen = true;
    overlay.appendChild(iframe);

    document.body.appendChild(overlay);
    this.storyOverlay = overlay;

    requestFullscreen(overlay);

    // Close on Escape key
    this.storyCloseHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.closeStoryOverlay();
    };
    document.addEventListener('keydown', this.storyCloseHandler as EventListener);
  }

  private closeStoryOverlay() {
    if (!this.storyOverlay) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    this.storyOverlay.remove();
    this.storyOverlay = null;

    if (this.storyCloseHandler) {
      document.removeEventListener('keydown', this.storyCloseHandler as EventListener);
      this.storyCloseHandler = null;
    }
  }

  private pollStoryCloseGamepad() {
    if (!this.storyOverlay) return;

    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp) continue;
      // Right face button (B / Circle / O) = button index 1
      if (gp.buttons[1]?.pressed) {
        this.closeStoryOverlay();
        return;
      }
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
