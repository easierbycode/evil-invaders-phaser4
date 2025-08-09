
import PROPERTIES from "../properties";
import { getDB, ref, get } from '../utils/firebase-config';


export class OverloadScene extends Phaser.Scene {
    constructor() {
        super("title-scene");
    }

    preload() {
        this.load.json(
            'game.json',
            'https://evil-invaders-default-rtdb.firebaseio.com/game.json'
        );

        this.load.once(Phaser.Loader.Events.COMPLETE, () => {
            const data = this.cache.json.get("game.json");
            if (!PROPERTIES.resource) (PROPERTIES as any).resource = {};
            PROPERTIES.resource.recipe = { data };
        });
    }

    // Helper method to create and load an image from base64 data
    createImageFromBase64(base64Data) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = `data:image/png;base64,${base64Data}`;
        });
    }

    async create() {
        const db = getDB();

        try {
            // Fetch character data and atlas simultaneously
            const [enemySnapshot, playerSnapshot] = await Promise.all([
                get(ref(db, "characters/enemyR")),
                get(ref(db, "characters/dukeNukem")),
            ]);

            if (enemySnapshot.exists()) {
                PROPERTIES.resource.recipe.data.enemyData.enemyR = enemySnapshot.val();

                const enemyChar = enemySnapshot.val();
                if (enemyChar.textureKey) {
                    const enemyAtlas = await get(ref(db, `atlases/${enemyChar.textureKey}`));
                    if (enemyAtlas.exists()) {
                        const atlasData = enemyAtlas.val();
                        try {
                            const jsonData = JSON.parse(atlasData.json);
                            const imageObj = await this.createImageFromBase64(atlasData.png);
                            this.textures.addAtlas(enemyChar.textureKey, imageObj as HTMLImageElement, jsonData);
                            console.log(`${enemyChar.textureKey} atlas loaded successfully!`);
                        } catch (err) {
                            console.error(`Error loading ${enemyChar.textureKey} atlas:`, err);
                        }
                    }
                }
            } else {
                console.log("Enemy character data not found");
            }

            if (playerSnapshot.exists()) {
                PROPERTIES.resource.recipe.data.playerData = playerSnapshot.val();

                const playerChar = playerSnapshot.val();
                if (playerChar.textureKey) {
                    const playerAtlas = await get(ref(db, `atlases/${playerChar.textureKey}`));
                    if (playerAtlas.exists()) {
                        const atlasData = playerAtlas.val();
                        try {
                            const jsonData = JSON.parse(atlasData.json);
                            const imageObj = await this.createImageFromBase64(atlasData.png);
                            this.textures.addAtlas(playerChar.textureKey, imageObj as HTMLImageElement, jsonData);
                            console.log(`${playerChar.textureKey} atlas loaded successfully!`);
                        } catch (err) {
                            console.error(`Error loading ${playerChar.textureKey} atlas:`, err);
                        }
                    }
                }
            } else {
                console.log("Player character data not found");
            }

        } catch (error) {
            console.error("Error fetching data from Firebase:", error);
        }

        // After Firebase data is loaded, switch to GameScene (temporarily "title-scene")
        this.scene.start("game-scene");
    }
}
