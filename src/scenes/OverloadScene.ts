
import PROPERTIES from "../properties";
import { getDB, ref, get } from '../utils/firebase-config';


export class OverloadScene extends Phaser.Scene {
    constructor() {
        super("OverloadScene");
    }

    /**
     * Resolve the `overwriteLocal` feature flag from these sources (first match wins):
     *
     *   1. Scene start data  — this.scene.start('OverloadScene', { overwriteLocal: true })
     *   2. URL param         — ?overwriteLocal=1  (any value other than '0' / 'false' = on)
     *   3. Config file       — assets/overload-flags.json  (written by `set-overload-flag` MCP tool)
     *
     * Default: false  (existing behaviour — RTDB data is loaded into memory only)
     */
    private async resolveOverwriteLocal(data?: { overwriteLocal?: boolean }): Promise<boolean> {
        // 1) Scene data
        if (data?.overwriteLocal !== undefined) return Boolean(data.overwriteLocal);

        // 2) URL param
        const urlParam = new URL(window.location.href).searchParams.get('overwriteLocal');
        if (urlParam !== null) return urlParam !== '0' && urlParam !== 'false';

        // 3) Config file set by the `set-overload-flag` MCP tool
        try {
            const base = PROPERTIES.baseUrl || './';
            const sep  = base.endsWith('/') ? '' : '/';
            const res  = await fetch(`${base}${sep}assets/overload-flags.json`, { cache: 'no-store' });
            if (res.ok) {
                const flags = await res.json();
                if (typeof flags?.overwriteLocal === 'boolean') return flags.overwriteLocal;
            }
        } catch { /* file absent or parse error — fall through to default */ }

        return false;
    }

    /**
     * Trigger browser downloads of an atlas PNG + JSON so it can be used offline.
     * Handles both string-encoded and object-encoded JSON values from Firebase.
     */
    private downloadAtlasLocally(atlasName: string, atlasData: { json: string | object; png: string }): void {
        // Normalise JSON (Firebase sometimes stores it as a serialised string)
        const jsonObj = typeof atlasData.json === 'string'
            ? JSON.parse(atlasData.json)
            : atlasData.json;

        const jsonBlob = new Blob([JSON.stringify(jsonObj, null, 2)], { type: 'application/json' });
        const jsonUrl  = URL.createObjectURL(jsonBlob);
        const jsonA    = document.createElement('a');
        jsonA.href     = jsonUrl;
        jsonA.download = `${atlasName}.json`;
        jsonA.click();
        URL.revokeObjectURL(jsonUrl);

        let pngSrc = atlasData.png ?? '';
        if (!pngSrc.startsWith('data:')) pngSrc = `data:image/png;base64,${pngSrc}`;
        const pngA    = document.createElement('a');
        pngA.href     = pngSrc;
        pngA.download = `${atlasName}.png`;
        pngA.click();
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
        const textureKeys = Object.keys(this.textures.list).filter(t => t[0] !== '_');

        textureKeys.forEach((key) => {
            const url = new URL(window.location.href).searchParams.get(key);
            if (url)  this.fetchOverrideFromUrl(key, url);
        });
    }

    async create(data?: { overwriteLocal?: boolean }) {
        const overwriteLocal = await this.resolveOverwriteLocal(data);
        if (overwriteLocal) {
            console.log('[OverloadScene] overwriteLocal=true — RTDB atlas data will be saved as local files');
        }

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
                            if (overwriteLocal) this.downloadAtlasLocally(enemyChar.textureKey, atlasData);
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
                            if (overwriteLocal) this.downloadAtlasLocally(playerChar.textureKey, atlasData);
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

        // After Firebase data is loaded, switch to next scene
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
