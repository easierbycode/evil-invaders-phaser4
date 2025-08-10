
import { getDB, ref, get, set } from '../utils/firebase-config';
import PROPERTIES from "../properties";
export class LoadScene extends Phaser.Scene {

  constructor() {
    super("LoadScene");
  }

  async preload() {

	  const baseUrl = import.meta.env.BASE_URL || '/';
    this.load.pack("pack", `${baseUrl}assets/asset-pack.json`);

    const db = getDB();

    // Helper to fetch a base64 png + json atlas from Firebase and queue it
    const queueAtlasFromFirebase = async (
      key: string,
      pngUrl: string,
      jsonUrl: string
    ): Promise<boolean> => {
      try {
        const [pngRes, jsonRes] = await Promise.all([fetch(pngUrl), fetch(jsonUrl)]);
        if (!pngRes.ok || !jsonRes.ok) throw new Error(`HTTP ${pngRes.status}/${jsonRes.status}`);

        const [base64Data, atlasJson] = await Promise.all([pngRes.json(), jsonRes.json()]);
        if (!base64Data || !atlasJson) throw new Error("Empty atlas data");

        const dataUri = "data:image/png;base64," + base64Data;
        this.load.atlas(key, dataUri, atlasJson);
        console.log(`Queued ${key} atlas from Firebase`);
        return true;
      } catch (err) {
        console.warn(`Failed to fetch ${key} atlas from Firebase:`, err);
        return false;
      }
    };

    /* ---------------- 1️⃣  Try loading atlases from Firebase (in parallel) ---------------- */
    const assetAtlasPromise = queueAtlasFromFirebase(
      "game_asset",
      "https://evil-invaders-default-rtdb.firebaseio.com/atlases/game_asset/png.json",
      "https://evil-invaders-default-rtdb.firebaseio.com/atlases/game_asset/json.json"
    );

    const uiAtlasPromise = queueAtlasFromFirebase(
      "game_ui",
      "https://evil-invaders-default-rtdb.firebaseio.com/atlases/game_ui/png.json",
      "https://evil-invaders-default-rtdb.firebaseio.com/atlases/game_ui/json.json"
    );

    // Also pull game.json from Firebase while atlases are fetching
    const gameDataPromise = (async () => {
      try {
        const snap = await get(ref(db, "game"));
        return snap.val();
      } catch (err) {
        console.error("Failed to fetch game.json from Firebase:", err);
        return null;
      }
    })();

    const [assetFromFB, uiFromFB, gameData] = await Promise.all([
      assetAtlasPromise,
      uiAtlasPromise,
      gameDataPromise,
    ]);

    /* ---------------- 2️⃣  Cache game.json (Firebase) or queue fallback ---------------- */
    if (gameData) {
      this.cache.json.add("game.json", gameData);
      if (!PROPERTIES.resource) (PROPERTIES as any).resource = {};
      PROPERTIES.resource.recipe = { data: gameData };
    }

    /* ---------------- 3️⃣  Start the loader once, wait for everything ---------------- */
    await new Promise<void>((resolve) => {
      this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      this.load.start();
    });

    /* ---------------- 4️⃣  Choose next scene ---------------- */
    if (gameData) {
      this.scene.start("OverloadScene");
    }
  }
}