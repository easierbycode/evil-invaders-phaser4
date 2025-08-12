
import { getDB, ref, get, set } from '../utils/firebase-config';
import PROPERTIES from "../properties";
import { AnimatedSprite } from '../game-objects/AnimatedSprite';
import { GAME_CENTER, GAME_MIDDLE } from '../constants';
import bgData from '/assets/loading_bg.png?url&inline';  // Vite / Rollup
import png0Data from '/assets/loading0.png?url&inline';
import png1Data from '/assets/loading1.png?url&inline';
import png2Data from '/assets/loading2.png?url&inline';
import assetPackUrl from '/assets/asset-pack.json?url';

// const files = [
//   { type: 'image', key: 'loading_bg', url: bgData },  // ← data:image/png;base64,…
//   { type: 'image', key: 'loading0', url: png0Data },
//   { type: 'image', key: 'loading1', url: png1Data },
//   { type: 'image', key: 'loading2', url: png2Data }
// ];
const files = [
  {
    type: "image",
    key: "loading_bg.png",
    url: "assets/loading_bg.png",
  },
  {
    type: "image",
    key: "loading0.png",
    url: "assets/loading0.png",
  },
  {
    type: "image",
    key: "loading1.png",
    url: "assets/loading1.png",
  },
  {
    type: "image",
    key: "loading2.png",
    url: "assets/loading2.png",
  },
];


export class LoadScene extends Phaser.Scene {

  loadingE: AnimatedSprite;

  constructor() {
    super({ key: 'LoadScene', pack: { files } });
  }

  init() {
    var frameKeys = ["loading0.png", "loading1.png", "loading2.png"];
    this.loadingE = new AnimatedSprite(this, frameKeys);
    this.loadingE.x = GAME_CENTER - 64;
    this.loadingE.y = GAME_MIDDLE - 64;
    //   (this.loadingE.animationSpeed = 0.15),
    //   (this.loadingTexture = "loading_bg.png"),
    //   (this.loadingBg = this.add.image(0, 0, this.loadingTexture).setOrigin(0)),
    //   (this.loadingBg.alpha = 0.09),
    //   (this.loadingBgFlipCnt = 0),
    //   document.cookie.split(";").forEach(function (t) {
    //     var e = t.split("=");
    //     "afc2019_highScore" == e[0] && (D.highScore = +e[1]);
    //   }),
  }

  async preload() {

    this.load.setPath('');             // let the pack’s own "path" drive it
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
