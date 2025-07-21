import Phaser from "phaser";
import { WIDTH, HEIGHT } from "../constants";

const NEON_COLORS = [0xff00ff, 0x00ffff, 0x00ff00, 0xffff00];

export class Starfield extends Phaser.GameObjects.Particles.ParticleEmitterManager {
    constructor(scene: Phaser.Scene) {
        super(scene, 'white-dot');

        this.createEmitter({
            x: { min: 0, max: WIDTH },
            y: { min: 0, max: HEIGHT },
            lifespan: { min: 5000, max: 10000 },
            speed: { min: 1, max: 5 },
            scale: { start: 0.1, end: 0.2 },
            blendMode: 'ADD',
            quantity: 2,
            tint: (particle) => {
                if (Math.random() < 0.1) {
                    return NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
                }
                return 0xffffff;
            }
        });

        scene.add.existing(this);

        this.scene.tweens.add({
            targets: this.getEmitters()[0].scale,
            props: {
                start: { value: 0.1, duration: 2000, ease: 'Sine.easeInOut' },
                end: { value: 0.2, duration: 2000, ease: 'Sine.easeInOut' },
            },
            yoyo: true,
            repeat: -1
        });
    }

    update() {
        this.getEmitters()[0].forEachParticle((particle) => {
            if (particle.y > HEIGHT + 50) {
                particle.y = -50;
            }
        });
    }
}
