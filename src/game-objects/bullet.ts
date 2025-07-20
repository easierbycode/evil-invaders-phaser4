import Phaser from 'phaser';

export class Bullet extends Phaser.GameObjects.Sprite {
  private speed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.speed = 400;
    this.anims.create({
      key: 'bullet-anim',
      frames: this.anims.generateFrameNumbers(texture, {}),
      frameRate: 20,
      repeat: -1,
    });
    this.anims.play('bullet-anim');
    scene.physics.world.enable(this);
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(-this.speed);
  }

  update() {
    if (this.y < 0) {
      this.destroy();
    }
  }
}
