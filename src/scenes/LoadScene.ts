import PROPERTIES from "https://codepen.io/CodeMonkeyGames/pen/rNERbzw.js";
import { getDB, ref, get } from "../utils/firebase-config";

export class LoadScene extends Phaser.Scene {

    constructor() {
        super("load-scene");
    }

    async preload() {
        const db = getDB();

        /* ---------------- 1️⃣  Try loading game_asset atlas from Firebase ---------------- */
        let atlasTextureData: string | null = null;
        let atlasJsonData: any = null;
        let atlasLoadedFromFirebase = false;
        
        try {
            // Fetch the base64 PNG data
            const pngResponse = await fetch('https://evil-invaders-default-rtdb.firebaseio.com/atlases/game_asset/png.json');
            const base64Data = await pngResponse.json();
            
            // Prepend the data URI prefix
            atlasTextureData = 'data:image/png;base64,' + base64Data;
            
            // Fetch the atlas JSON data
            const jsonResponse = await fetch('https://evil-invaders-default-rtdb.firebaseio.com/atlases/game_asset/json.json');
            atlasJsonData = await jsonResponse.json();
            
            if (atlasTextureData && atlasJsonData) {
                console.log("Successfully fetched game_asset atlas from Firebase");
                
                // Load the atlas using the base64 data URI
                this.load.atlas('game_asset', atlasTextureData, atlasJsonData);
                atlasLoadedFromFirebase = true;
                
                // Start the loader to process the queued atlas
                this.load.start();
                
                // Wait for the atlas to fully load
                await new Promise<void>((resolve) => {
                    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
                        console.log("game_asset atlas loaded into Phaser");
                        resolve();
                    });
                });
            }
        } catch (err) {
            console.error("Failed to fetch game_asset atlas from Firebase:", err);
        }
        
        // If Firebase failed, load from remote URLs
        if (!atlasLoadedFromFirebase) {
            console.log("Falling back to remote URLs for game_asset atlas");
            this.load.atlas(
                'game_asset',
                'https://assets.codepen.io/11817390/evil_invaders_asset.png',
                'https://assets.codepen.io/11817390/evil_invaders_asset.json'
            );
        }

        /* ---------------- 2️⃣  Try Firebase for game.json ---------------- */
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

        /* ---------------- 3️⃣  Remote fallback for game.json ---------------- */
        this.load.json(
            "game.json",
            "https://assets.codepen.io/11817390/evil_invaders.json"
        );

        // Once all loading finishes, cache → PROPERTIES → next scene
        this.load.once(Phaser.Loader.Events.COMPLETE, () => {
            const fallbackData = this.cache.json.get("game.json");
            if (!PROPERTIES.resource) (PROPERTIES as any).resource = {};
            PROPERTIES.resource.recipe = { data: fallbackData };

            this.scene.start("game-scene");
        });
        
        // If we loaded the atlas from Firebase, the loader was already started
        // If not, we need to start it now for the fallback assets
        if (!atlasLoadedFromFirebase) {
            this.load.start();
        }
    }
}