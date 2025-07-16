
import PROPERTIES from "https://codepen.io/CodeMonkeyGames/pen/rNERbzw.js";
import { LoadScene } from "https://codepen.io/CodeMonkeyGames/pen/LYKayQE.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
const firebaseConfig = {
  apiKey: "AIzaSyAOWwht5ieLYlbgk_pOYdEQeEAscAxXmeY",
  authDomain: "spritehub-c3a33.firebaseapp.com",
  projectId: "spritehub-c3a33",
  storageBucket: "spritehub-c3a33.firebasestorage.app",
  messagingSenderId: "957606226872",
  appId: "1:957606226872:web:d5244182e4d6a66090bd4d",
};


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
        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);

        try {
            // First, fetch the character data
                const characterRef = ref(db, "characters/enemyR");
                const characterSnapshot = await get(characterRef);

                if (characterSnapshot.exists()) {
                    // Assign the character data to enemyR
                    PROPERTIES.resource.recipe.data.enemyData.enemyR = characterSnapshot.val();
                } else {
                    console.log("Character data not found");
                }

                // Second, fetch the enemy atlas
                const atlasRef = ref(db, "atlases/enemyr_atlas");
                const atlasSnapshot = await get(atlasRef);

                if (atlasSnapshot.exists()) {
                    const atlasData = atlasSnapshot.val();

                    try {
                        // Create and load the image properly before using it
                        const jsonData = JSON.parse(atlasData.json);
                        const imageObj = await this.createImageFromBase64(atlasData.png);

                        // Now that the image is loaded, add it to the texture manager
                        this.textures.addAtlas("enemyr_atlas", imageObj, jsonData);
                        console.log("enemyr_atlas loaded successfully!");
                    } catch (imgErr) {
                        console.error("Error loading enemyr_atlas image:", imgErr);
                    }
                } else {
                    console.log("enemyr_atlas data not found");
                }
        } catch (error) {
            console.error("Error fetching data from Firebase:", error);
        }

        // After Firebase data is loaded, switch to GameScene (temporarily "title-scene")
        this.scene.start("game-scene");
    }
}