export class Graphics extends Phaser.GameObjects.Graphics {
    constructor(scene) {
        super(scene);
    }
    fill(color, alpha) {
        super.fillStyle(color, alpha);
        return this;
    }
    fillRect(x, y, width, height) {
        this.rect = new Phaser.GameObjects.Rectangle(this.scene, x, y, width, height);
        super.fillRect(x, y, width, height);
        return this;
    }
    setInteractive(hitArea, callback, dropZone) {
        super.setInteractive(this.rect, Phaser.Geom.Rectangle.Contains, dropZone);
        return this;
    }
}