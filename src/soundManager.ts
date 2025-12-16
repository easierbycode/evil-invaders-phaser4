
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
        if (sound) {
            try {
                sound.stop();
            } catch (e) {
                // Ignore errors from stopping a sound that isn't playing
            }
        }
    },

    stopBgm: function () {
        if (this.resource.bgm) {
            this.stop(this.resource.bgm);
            this.resource.bgm = null;
        }
    },

    bgmPlay: function (key, e, o) {
        this.stopBgm();

        const sound = this.resource[key];

        if (sound) {
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

            // Stop if already playing before starting
            if (sound.isPlaying) {
                try { sound.stop(); } catch (e) {}
            }
            sound.play("default");
        }
    },

    bgmPlayLoop: function (key, volume = 0.5) {
        if (this.resource.bgm === key) return; // Already playing this track

        // Stop current bgm
        this.stopBgm();

        const sound = this.resource[key];

        if (sound) {
            // Stop if somehow already playing, then restart
            if (sound.isPlaying) {
                try { sound.stop(); } catch (e) {}
            }
            this.resource.bgm = key;
            sound.play({ loop: true, volume: volume });
        }
    },
};  