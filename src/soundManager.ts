
export default {
    resource: {
        // key of currently playing bgm
        bgm: null,
    },

    play: function (key) {
        const sound = this.resource[key];
        if (sound && !sound.isPlaying) sound.play();
    },

    stop: function (key) {
        const sound = this.resource[key];
        if (sound && sound.isPlaying) sound.stop();
    },

    bgmPlay: function (key, e, o) {
        if (this.resource.bgm) this.stop(this.resource.bgm);

        const sound = this.resource[key];

        if (sound && !sound.isPlaying) {
            this.resource.bgm = key;

            const soundConfig = {
                loop: true,
            };

            sound.addMarker({
                name: "default",
                start: e / 48e3,
                duration: o / 48e3 - e / 48e3,
                config: soundConfig,
            });

            sound.play("default");
        }
    },

    bgmPlayLoop: function (key, volume = 0.5) {
        if (this.resource.bgm === key) return; // Already playing
        if (this.resource.bgm) this.stop(this.resource.bgm);

        const sound = this.resource[key];

        if (sound && !sound.isPlaying) {
            this.resource.bgm = key;
            sound.play({ loop: true, volume: volume });
        }
    },
};  