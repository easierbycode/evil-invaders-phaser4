import PROPERTIES from "https://codepen.io/CodeMonkeyGames/pen/rNERbzw.js";
import { getDB, ref, get } from '../utils/firebase-config';


export class OverloadScene extends Phaser.Scene {
    constructor() {
        super("title-scene");
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
