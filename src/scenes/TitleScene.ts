
// You can write more code here
import { GAME_HEIGHT, GAME_WIDTH } from "../constants";

/* START OF COMPILED CODE */

export default class TitleScene extends Phaser.Scene {
  #startBtn!: Phaser.GameObjects.Sprite;

  constructor() {
    super("TitleScene");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {

    // bg
    const bg = this.add.tileSprite(0, 0, 360, 640, "stars-bg");
    bg.setOrigin(0, 0);

    // titleG
    const titleG = this.add.sprite(360, 100, "flirty-girls-whitehouse", "0");
    titleG.setOrigin(0, 0);

    this.bg = bg;
    this.titleG = titleG;

    this.events.emit("scene-awake");
  }

  private bg!: Phaser.GameObjects.TileSprite;
  private titleG!: Phaser.GameObjects.Sprite;

  /* START-USER-CODE */

  // Write your code here

  create() {

    this.editorCreate();

    const animations = this.anims.createFromAseprite("flirty-girls-whitehouse");
    const animKeys = animations.map((anim) => anim.key);
    const defaultAnim = animKeys[0];

  	var e = new TimelineMax({
      onComplete: () => this.titleG.play({ key: defaultAnim, repeat: -1 })
    });
	  
    e.to(
      this.titleG,
      2,
      {
        x: GAME_WIDTH / 2 - this.titleG.width / 2 + 5,
        y: 20,
        ease: Quint.easeOut,
      },
      "+=0.0"
    );
	  
	this.#startBtn = this.physics
      .add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 170, 'game_ui', 'titleStartText.png')
      .setInteractive();

    this.#startBtn.on('pointerup', () => {
      this.scene.start("GameScene");
    });
  }

  update() {
    this.bg.tilePositionX += 0.5;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
