
// You can write more code here
import CONSTANTS from "./../constants";
import PROPERTIES from "../properties";
const { GAME_CENTER } = CONSTANTS;

const MUTOID_HEIGHT = 104;
const HEAD_OFFSET_FROM_TORSO_TOP = 8;
const HEAD_FRAME = "atlas_s0";

/* START OF COMPILED CODE */

export default class MutoidScene extends Phaser.Scene {

  constructor() {
    super("MutoidScene");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {

    // mutoidContainer
    const mutoidContainer = this.add.container(128, 240);

    this.mutoidContainer = mutoidContainer;

    this.events.emit("scene-awake");
  }

  private mutoidContainer!: Phaser.GameObjects.Container;

  /* START-USER-CODE */

  preload() {
    const base = PROPERTIES.baseUrl || "/"; // '/', '/evil-invaders-phaser4/', or './'
    const packUrl = (base.endsWith("/") ? base : base + "/") + "assets/asset-pack.json";

    // Don’t prefix with setPath('assets') or similar; that can double the path.
    this.load.setPath("");
    this.load.pack("pack", packUrl);
  }

  // Write your code here

  create() {

    this.editorCreate();

    this.mutoidContainer.removeAll(true);

    const torsoLeft = this.add.image(0, 0, "mutoid-torso").setOrigin(0, 0);
    const torsoRight = this.add.image(0, 0, "mutoid-torso").setOrigin(0, 0).setFlipX(true);
    const tankLeft = this.add.image(0, 0, "mutoid-tank").setOrigin(0, 1);
    const tankRight = this.add.image(0, 0, "mutoid-tank").setOrigin(0, 1).setFlipX(true);
    const head = this.add.image(0, 0, "mutoid-head", HEAD_FRAME).setOrigin(0.5, 0);
    const armLeft = this.add.image(0, 0, "mutoid-arm").setOrigin(1, 0);
    const armRight = this.add.image(0, 0, "mutoid-arm").setOrigin(1, 0).setFlipX(true);

    const tankScale = MUTOID_HEIGHT / tankLeft.displayHeight;
    tankLeft.setScale(tankScale);
    tankRight.setScale(tankScale);

    this.mutoidContainer.add([tankLeft, tankRight, torsoLeft, torsoRight, armLeft, armRight, head]);

    const tankWidth = tankLeft.displayWidth;
    const torsoWidth = torsoLeft.displayWidth;
    const armWidth = armLeft.displayWidth;
    const headHeight = head.displayHeight;
    const containerWidth = torsoWidth * 2;
    const containerHeight = MUTOID_HEIGHT + HEAD_OFFSET_FROM_TORSO_TOP + headHeight;

    // this.mutoidContainer.setPosition(GAME_CENTER, 0);
    this.mutoidContainer.setSize(containerWidth, containerHeight);

    tankLeft.setPosition(-tankWidth, MUTOID_HEIGHT);
    tankRight.setPosition(0, MUTOID_HEIGHT);

    torsoLeft.setPosition(-torsoWidth, 0);
    torsoRight.setPosition(0, 0);

    armLeft.setPosition(-torsoWidth + 15, 2);
    armRight.setPosition(armWidth + torsoWidth - 15, 2);

    head.setPosition(0, -HEAD_OFFSET_FROM_TORSO_TOP);

    // Force Arcade Physics debug overlays to render for easier alignment work.
    if (this.physics && this.physics.world) {
      const debugGraphic = this.physics.world.createDebugGraphic();
      this.physics.world.drawDebug = true;
      this.physics.world.debugGraphic.visible = true;
      debugGraphic.setDepth(1000);

      this.events.once("shutdown", () => debugGraphic.destroy());
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
