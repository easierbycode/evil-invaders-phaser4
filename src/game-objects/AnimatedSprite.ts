export class AnimatedSprite extends Phaser.GameObjects.Sprite {
    #frameRate = null;
    #repeat = null;

    constructor(
        scene,
        frameKeys,
        texture?,
        addToScene = true,
        repeatNum = -1
    ) {
        if (frameKeys[0] == 'hit0.gif') repeatNum = 0;
        // DRJ::TODO - remove hack once fang bullet remove is implemented correctly
        if (frameKeys[0].includes('fang_tama')) repeatNum = 0;

        super(scene, 0, 0, frameKeys[0]);

        if (texture) this.setTexture(texture, frameKeys[0]);

        this.setOrigin(0);

        let frames = [
            ...frameKeys.map((k) => {
                return { key: k, frame: 0 };
            }),
        ];

        if (texture) {
            frames = [
                ...frameKeys.map((k) => {
                    return { key: texture, frame: k };
                }),
            ];
        }

        this.anims.create({
            key: "default",
            frames,
            frameRate: 9,
            repeat: repeatNum,
            hideOnComplete: true,
            showOnStart: true
        });

        if (addToScene) {
            scene.add.existing(this);
        }

        this.scene.time.addEvent({
            callback: () => { this.anims && this.play("default") },
        })
    }

    set loop(bool) {
        this.#repeat = bool;
    }

    set hitArea(rect) {
        this.scene.time.addEvent({
            callback: () => {
                this.body.setSize(rect.width, rect.height);
                this.body.setOffset(rect.x, rect.y);
            },
        });

        this.scene.physics.add.existing(this);
    }

    set animationSpeed(percentOfSixty) {
        this.#frameRate = 60 * percentOfSixty;
    }

    play(key = "default") {
        if (!this.anims) return;
        if (typeof key === "string") {
            if (this.#frameRate || this.#repeat !== null) {
                let animConfig = { key };
                if (this.#frameRate) animConfig.frameRate = this.#frameRate;
                if (this.#repeat !== null) animConfig.repeat = this.#repeat ? -1 : 0;

                super.play(animConfig);
            } else {
                super.play(key);
            }

            // DRJ::TODO - fix this (unreachable since key is set by default)
        } else {
            let animConfig = key;
            animConfig.key = "default";
            if (this.#frameRate) animConfig.frameRate = this.#frameRate;
            if (animConfig.repeat === undefined && this.#repeat !== null) {
                animConfig.repeat = this.#repeat ? -1 : 0;
            }
            super.play(animConfig);
        }
    }
}