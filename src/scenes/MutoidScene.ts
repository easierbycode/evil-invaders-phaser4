
// You can write more code here

const MUTOID_HEIGHT = 104;
const HEAD_OFFSET_FROM_TORSO_TOP = 8;
const HEAD_FRAME = "atlas_s0";
const TREAD_FRAME = "atlas_s0";
const TREAD_FPS = 4;


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
  // Write your code here

  create() {

    this.editorCreate();

    this.mutoidContainer.removeAll(true);

    const torsoLeft = this.add.image(0, 0, "mutoid-torso").setOrigin(0, 0);
    const torsoRight = this.add.image(0, 0, "mutoid-torso").setOrigin(0, 0).setFlipX(true);
    const tankLeft = this.add.image(0, 0, "mutoid-tank").setOrigin(0, 1);
    const tankRight = this.add.image(0, 0, "mutoid-tank").setOrigin(0, 1).setFlipX(true);
    const treadLeft = this.add.sprite(0, 0, "mutoid-tank-tread", TREAD_FRAME).setOrigin(1, 1);
    const treadRight = this.add.sprite(0, 0, "mutoid-tank-tread", TREAD_FRAME).setOrigin(0, 1).setFlipX(true);
    const treadFrontLeft = this.add.sprite(0, 0, "mutoid-tank-tread-front", TREAD_FRAME).setOrigin(0, 0);
    const treadFrontRight = this.add.sprite(0, 0, "mutoid-tank-tread-front", TREAD_FRAME).setOrigin(1, 0).setFlipX(true);
    const head = this.add.sprite(0, 0, "mutoid-head", HEAD_FRAME).setOrigin(0.5, 0);
    const armLeft = this.add.image(0, 0, "mutoid-arm").setOrigin(1, 0);
    const armRight = this.add.image(0, 0, "mutoid-arm").setOrigin(1, 0).setFlipX(true);

    const tankScale = MUTOID_HEIGHT / tankLeft.displayHeight;
    tankLeft.setScale(tankScale);
    tankRight.setScale(tankScale);
    treadLeft.setScale(tankScale);
    treadRight.setScale(tankScale);
    treadFrontLeft.setScale(tankScale);
    treadFrontRight.setScale(tankScale);

    this.mutoidContainer.add([
      treadFrontLeft,
      treadFrontRight,
      treadLeft,
      treadRight,
      tankLeft,
      tankRight,
      torsoLeft,
      torsoRight,
      armLeft,
      armRight,
      head,
    ]);

    this.ensureAnimation("mutoid-tank-tread-spin", "mutoid-tank-tread");
    this.ensureAnimation("mutoid-tank-tread-front-spin", "mutoid-tank-tread-front");

    treadLeft.play({ key: "mutoid-tank-tread-spin" });
    treadRight.play({ key: "mutoid-tank-tread-spin" });
    treadFrontLeft.play({ key: "mutoid-tank-tread-front-spin" });
    treadFrontRight.play({ key: "mutoid-tank-tread-front-spin" });

    const tankWidth = tankLeft.displayWidth;
    const torsoWidth = torsoLeft.displayWidth;
    const armWidth = armLeft.displayWidth;

    tankLeft.setPosition(-tankWidth, MUTOID_HEIGHT);
    tankRight.setPosition(0, MUTOID_HEIGHT);

    treadLeft.setPosition(-tankWidth, MUTOID_HEIGHT);
    treadRight.setPosition(tankWidth, MUTOID_HEIGHT);

    const treadLeftLeftEdge = treadLeft.x - treadLeft.displayWidth;
    const treadRightRightEdge = treadRight.x + treadRight.displayWidth;

    treadFrontLeft.setPosition(treadLeftLeftEdge + 1, treadLeft.y - 1);

    treadFrontRight.setPosition(treadRightRightEdge - 1, treadRight.y - 1);

    torsoLeft.setPosition(-torsoWidth, 0);
    torsoRight.setPosition(0, 0);

    armLeft.setPosition(-torsoWidth + 15, 2);
    armRight.setPosition(armWidth + torsoWidth - 15, 2);

    head.setPosition(0, -HEAD_OFFSET_FROM_TORSO_TOP);

    const sprites = [
      torsoLeft,
      torsoRight,
      tankLeft,
      tankRight,
      treadLeft,
      treadRight,
      treadFrontLeft,
      treadFrontRight,
      armLeft,
      armRight,
      head,
    ];

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

    this.mutoidContainer.setSize(rightmost - leftmost, bottommost - topmost);

    this.ensureExplicitAnimation("mutoid-head-forward", "mutoid-head", ["atlas_s0", "atlas_s5"], 5, -1);
    this.ensureExplicitAnimation("mutoid-head-back", "mutoid-head", ["atlas_s1", "atlas_s2", "atlas_s3", "atlas_s3"], 2, 0);

    head.setFrame(HEAD_FRAME);

    this.animateMutoid(head);
  }

  private animateMutoid(head: Phaser.GameObjects.Sprite) {
    const tween = this.tweens.add({
      targets: this.mutoidContainer,
      y: this.mutoidContainer.y + 112,
      duration: 2000,
      yoyo: true,
      hold: 0,
      repeatDelay: 3500,
      repeat: -1,
      onStart: () => this.playHeadForward(head),
      onYoyo: () => this.playHeadBackward(head),
      onRepeat: () => this.playHeadForward(head),
      onComplete: () => this.playHeadIdle(head),
      onStop: () => this.playHeadIdle(head),
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => tween.stop());
  }

  private playHeadIdle(head: Phaser.GameObjects.Sprite) {
    head.stop();
    head.setFrame(HEAD_FRAME);
  }

  private playHeadForward(head: Phaser.GameObjects.Sprite) {
    head.play({ key: "mutoid-head-forward", repeat: -1, frameRate: 5 });
  }

  private playHeadBackward(head: Phaser.GameObjects.Sprite) {
    head.play({ key: "mutoid-head-back", repeat: 0, frameRate: 2 });
    head.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "mutoid-head-back",
      () => this.playHeadIdle(head)
    );
  }

  private ensureAnimation(
    key: string,
    textureKey: string,
    frames: string[] = ["atlas_s0", "atlas_s1", "atlas_s2"],
    fps: number = TREAD_FPS,
    repeat: number = -1
  ) {
    if (this.anims.exists(key)) return;

    this.anims.create({
      key,
      frames: frames.map((frame) => ({ key: textureKey, frame })),
      frameRate: fps,
      repeat,
    });
  }

  private ensureExplicitAnimation(
    key: string,
    textureKey: string,
    frames: string[],
    fps: number,
    repeat: number
  ) {
    if (this.anims.exists(key)) return;

    this.anims.create({
      key,
      frames: frames.map((frame) => ({ key: textureKey, frame })),
      frameRate: fps,
      repeat,
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
