
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
            const [enemySnapshot, playerSnapshot, enemyAtlasSnapshot, dukeAtlasSnapshot] = await Promise.all([
                get(ref(db, "characters/enemyR")),
                get(ref(db, "characters/dukeNukem")),
                get(ref(db, "atlases/enemyr_atlas")),
                get(ref(db, "atlases/axe-murderer"))
            ]);

            if (enemySnapshot.exists()) {
                PROPERTIES.resource.recipe.data.enemyData.enemyR = enemySnapshot.val();
            } else {
                console.log("Enemy character data not found");
            }

            if (playerSnapshot.exists()) {
                PROPERTIES.resource.recipe.data.playerData = playerSnapshot.val();
            } else {
                console.log("Player character data not found");
            }

            if (enemyAtlasSnapshot.exists()) {
                const enemyAtlasData = enemyAtlasSnapshot.val();
                try {
                    const enemyJsonData = JSON.parse(enemyAtlasData.json);
                    const enemyImageObj = await this.createImageFromBase64(enemyAtlasData.png);
                    this.textures.addAtlas("enemyr_atlas", enemyImageObj as HTMLImageElement, enemyJsonData);
                    console.log("enemyr_atlas loaded successfully!");
                } catch (imgErr) {
                    console.error("Error loading enemyr_atlas image:", imgErr);
                }
            } else {
                console.log("enemyr_atlas data not found");
            }

            if (dukeAtlasSnapshot.exists()) {
                const dukeAtlasData = dukeAtlasSnapshot.val();
                try {
                    const dukeJsonData = JSON.parse(dukeAtlasData.json);
                    const dukeImageObj = await this.createImageFromBase64(dukeAtlasData.png);
                    this.textures.addAtlas("duke_atlas", dukeImageObj as HTMLImageElement, dukeJsonData);
                    console.log("duke_atlas loaded successfully!");
                } catch (imgErr) {
                    console.error("Error loading duke_atlas image:", imgErr);
                }
            } else {
                console.log("duke_atlas data not found");
            }
        } catch (error) {
            console.error("Error fetching data from Firebase:", error);
        }

        // After Firebase data is loaded, switch to GameScene (temporarily "title-scene")
        this.scene.start("game-scene");
    }
}
