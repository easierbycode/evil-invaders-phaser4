import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite
{
    speed;
    flame;
    end_direction = new Phaser.Math.Vector2(0, 0);

    constructor(scene, x, y, texture = "bullet") {
        super(scene, x, y, texture);
        this.speed = 450; // Store speed as a value, not a function
        
        // Only add bloom if postFX is available
        if (this.postFX) {
            this.postFX.addBloom(0xffffff, 1, 1, 2, 1.2);
        }
        
        // Default bullet (player bullet)
        this.name = "bullet";
        // Enable physics for the bullet
        scene.physics.add.existing(this);
        this.body.allowGravity = false;
    }

    fire (x, y, targetX = 1, targetY = 0, bullet_texture = "bullet")
    {
        // Change bullet texture
        this.setTexture(bullet_texture);

        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);

        // Calculate direction towards target
        if (targetX === 1 && targetY === 0) {
            this.body.setVelocity(this.speed, 0);
        } else {
            this.end_direction.setTo(targetX - x, targetY - y).normalize();
            this.body.setVelocity(this.end_direction.x * this.speed, this.end_direction.y * this.speed);
        }
    }

    destroyBullet ()
    {
        if (this.flame === undefined) {
            // Create particles for flame
            this.flame = this.scene.add.particles(this.x, this.y, 'flares',
                {
                    lifespan: 250,
                    scale: { start: 1.5, end: 0, ease: 'sine.out' },
                    speed: 200,
                    advance: 500,
                    frequency: 20,
                    blendMode: 'ADD',
                    duration: 100,
                });
                this.flame.setDepth(1);
            // When particles are complete, destroy them
            this.flame.once("complete", () => {
                this.flame.destroy();
            })
        }

        // Destroy bullets
        this.setActive(false);
        this.setVisible(false);
        this.destroy();
    }

        // Update bullet position
        update (time, delta)
        {
            // No need to update position manually, physics engine does it
        }
}
    
