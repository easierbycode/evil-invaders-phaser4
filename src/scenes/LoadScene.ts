import PROPERTIES from "https://codepen.io/CodeMonkeyGames/pen/rNERbzw.js";
import { getDB, ref, get } from "../utils/firebase-config";

export class LoadScene extends Phaser.Scene {

    constructor() {
        super("load-scene");
    }

    async preload() {
        const db = getDB();

        /* ---------------- 1️⃣  Try Firebase first ---------------- */
        let gameData: any = null;
        try {
            const snap = await get(ref(db, "game"));
            gameData = snap.val();
        } catch (err) {
            console.error("Failed to fetch game.json from Firebase:", err);
        }

        if (gameData) {
            // Directly add to cache & PROPERTIES then jump to next scene
            this.cache.json.add("game.json", gameData);
            if (!PROPERTIES.resource) (PROPERTIES as any).resource = {};
            PROPERTIES.resource.recipe = { data: gameData };

            this.scene.start("title-scene");
            return;
        }

        /* ---------------- 2️⃣  Remote fallback ---------------- */
        this.load.json(
            "game.json",
            "https://assets.codepen.io/11817390/evil_invaders.json"
        );

        // Once remote file finishes, cache → PROPERTIES → next scene
        this.load.once(Phaser.Loader.Events.COMPLETE, () => {
            const fallbackData = this.cache.json.get("game.json");
            if (!PROPERTIES.resource) (PROPERTIES as any).resource = {};
            PROPERTIES.resource.recipe = { data: fallbackData };

            this.scene.start("title-scene");
        });
    }
}