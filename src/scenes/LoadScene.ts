
import { getDB, ref, get, set } from '../utils/firebase-config';
import PROPERTIES from "../properties";
import bgData from '/assets/loading_bg.png?url&inline';  // Vite / Rollup
import gif0Data from '/assets/loading0.gif?url&inline';
import gif1Data from '/assets/loading1.gif?url&inline';
import gif2Data from '/assets/loading2.gif?url&inline';
import assetPackUrl from '/assets/asset-pack.json?url';

const files = [
  { type: 'image', key: 'loading_bg', url: bgData },  // ← data:image/png;base64,…
  { type: 'image', key: 'loading0', url: gif0Data },
  { type: 'image', key: 'loading1', url: gif1Data },
  { type: 'image', key: 'loading2', url: gif2Data }
];


export class LoadScene extends Phaser.Scene {

  constructor() {
    super({ key: 'LoadScene', pack: { files } });
  }

  // init() {
  //   var t;
  //   t = this;
  //   var o = ["loading0.gif", "loading1.gif", "loading2.gif"];
  //   return (
  //     (t.loadingG = new AnimatedSprite(this, o, undefined, true)),
  //     (t.loadingG.x = i.GAME_CENTER - 64),
  //     (t.loadingG.y = i.GAME_MIDDLE - 64),
  //     (t.loadingG.animationSpeed = 0.15),
  //     (t.loadingTexture = "loading_bg.png"),
  //     (t.loadingBg = this.add.image(0, 0, t.loadingTexture).setOrigin(0)),
  //     (t.loadingBg.alpha = 0.09),
  //     (t.loadingBgFlipCnt = 0),
  //     document.cookie.split(";").forEach(function (t) {
  //       var e = t.split("=");
  //       "afc2019_highScore" == e[0] && (D.highScore = +e[1]);
  //     }),
  //     t
  //   );
  // }

  async preload() {

    this.load.setPath('');
    this.load.pack('pack', assetPackUrl);

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