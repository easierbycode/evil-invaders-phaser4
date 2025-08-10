
// You can write more code here

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
    const bg = this.add.tileSprite(0, 0, 360, 640, "stars-bg");
    bg.setOrigin(0, 0);

    this.bg = bg;

    this.events.emit("scene-awake");
  }

  private bg!: Phaser.GameObjects.TileSprite;

  /* START-USER-CODE */

  // Write your code here

  create() {

    this.editorCreate();
  }

  update() {
    this.bg.tilePositionX += 0.5;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
