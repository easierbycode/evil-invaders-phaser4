
import PROPERTIES from "../properties";
import { getDB, ref, get } from '../utils/firebase-config';


export class OverloadScene extends Phaser.Scene {
    constructor() {
        super("OverloadScene");
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

    preload() {
        // override textures passed via URL
        const textureKeys = Object.keys(this.textures.list).filter(t => { if (t[0] != '_') { return t } });

        textureKeys.forEach((key) => {
            const url = new URL(window.location.href).searchParams.get(key);
            if (url)  this.fetchOverrideFromUrl(key, url);
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

        // After Firebase data is loaded, switch to GameScene
        // this.scene.start("GameScene");
        // this.scene.start("TitleScene");
        const sceneRequested = new URL(window.location.href).searchParams.get("scene");
        this.scene.start(sceneRequested || "TitleScene");
    }

    // --- Helpers ---

  private async fetchOverrideFromUrl(key: string, url: string) {
    try {
      // 1) Fetch to avoid tainted image / CORS issues
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) return;
      const blob = await res.blob();

      // 2) Convert to data URL so WebGL can safely upload it
      const dataUrl = await this.blobToDataURL(blob);

      // Clean up in case of HMR / re-entry
      if (this.textures.exists(key)) {
        this.textures.remove(key);
      }

      this.textures.addBase64(key, dataUrl);
    } catch (err) {
      console.warn(`[OverloadScene] ${key} override failed:`, err);
    }
  }

  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }
}
