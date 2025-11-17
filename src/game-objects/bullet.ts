import { Player } from "../game-objects/player";
import { Bullet } from "../game-objects/bullet";
import CONSTANTS from "./../constants";
import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite
{
    speed;
    id: number = 0;
    hp: number = 1;
    end_direction = new Phaser.Math.Vector2(0, 0);

    constructor(scene, x, y, textureKey = "game_asset", frame) {
        // Decide at runtime whether to pass a frame. Stand-alone images only
        // have one frame, so passing a frame name will throw an error.
        const tex = scene.textures.exists(textureKey) ? scene.textures.get(textureKey) : null;
        const hasMultipleFrames = tex ? tex.frameTotal > 1 : false;
        const initialFrame = typeof frame === 'object' && frame !== null && frame.texture ? frame.texture[0] : frame;
        const isValidFrame      = hasMultipleFrames && typeof tex.has === 'function' && tex.has(initialFrame);

        if (initialFrame !== undefined && isValidFrame) {
            super(scene, x, y, textureKey, initialFrame);
        } else {
            super(scene, x, y, textureKey);
        }
        
        this.speed = 450; // Store speed as a value, not a function
        
        // Only add bloom if postFX is available
        if (this.postFX) {
            this.postFX.addBloom(0xffffff, 1, 1, 2, 1.2);
        }

        if (typeof frame === 'object' && frame !== null && frame.texture) {
          this.anims.create({
            key: "default",
            frames: [
              ...frame.texture.map((k) => {
                return { key: textureKey, frame: k };
              })
            ],
            frameRate: frame.frameRate || 6,
            repeat: -1,
            hideOnComplete: true,
            showOnStart: true
          });

          this.play("default");
        }
        
        // Default bullet (player bullet)
        this.name = "bullet";
        // Enable physics for the bullet
        scene.physics.add.existing(this);
        this.body.allowGravity = false;
        
        // Set physics body to match display size
        this.body.setSize(8, 8);
    }

    fire (x, y, targetX = 1, targetY = 0, bullet_texture = "bullet")
    {
        // Change bullet texture
        this.setTexture(bullet_texture);

        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);

        // Always fire straight up for player bullets
        this.body.setVelocity(0, -this.speed);
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
