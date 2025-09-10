
import { getDB, ref, get } from '../utils/firebase-config';
import PROPERTIES from "../properties";
import { AnimatedSprite } from '../game-objects/AnimatedSprite';
import CONSTANTS from "./../constants";
const { GAME_CENTER, GAME_MIDDLE } = CONSTANTS;
import Sound from './../soundManager';
// import bgData from '/assets/loading_bg.png?url&inline';  // Vite / Rollup
const png0Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAACRdJREFUeJztnGtsHUcVgL9x7fg2ju3rtJCCqjaoNDwKdpT8ooDyFNCIh5AQccVDqmiTCCKBBH8qHkLwB0QRQQTkNCB+odqVEEhFFUXkQWmDWhTIdSTEo0QhaeOkVRInTuJX7MOP2b07+7r2vb43u/f6fNFkd3ZnZs/OnDnn7Oz1gqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoecRkLUACknAsj3K2BO1ZC5DEsBws7w+ax9KKJSmKS9ZKs5B8kL2M+VQAAEEw6f0jALtP7GTzwDYMplz+6OghhgaGy2WWwqc3Fnj6+FTN9feUBtnUvzXxPioo9i0ltwpQYfAB27mb+7d5OfFKiz1WwleCyCAIYDgy+kcODIwArrWx54CyEvmDH7VISRYqemx3aWdZPleZF1DsW05b1gLUitu5aed8JQl3uLClfzt7SjvLeYtx6m9lT2nQqRG9RpD3ywVlJCSDbdkk7ueBXFqAxc0S8easic1CCQ1CMLMtxju3nSFGynm/jvH+39y/DSkJBwZGHFlcRbDtburfCiVCbihaJi/mPolcWoCgu9PduD/4i2lNEAbNYwyaXamtGQwPm12hMlucWexK5quKP+C+osVnugndw1PyJMNyMOQusiaXChDMwzISSc6JuJKYyPn4rAwjseNxt5DUvvHiibCVCdqJXtukyJsluXQBFtupdraIMyTWpLqDEK6VNJBh9xAd1rglieb9AQ6k8Af3wMAIpmQcn59U1zJodpXvJy/kWAHiPjU8UMH+sDxJYDXcgXLz0fNhR5Pku+OWICqLPT80MMxm2Up08P24YFgORhQzP4FgTl1AeCYHAxQcOzp6CPH+RTv0SOmQt2fKJWwMkByM+YMf+Gf/cfCwI0141iZdN5DWyufGBXmL/n1yaQEWEzUPDQxDyT6yubP46OghDqwf8UpJufvDJFsSH0H40+jh8loCxC1EutswCfKFlSBPcUAeFWCxU0WGBoYZYrhCEd+NVGwmduno4B8dPYyIOJJF3Ujyo+vC8mVPPu1SFfzq6w8JwIoVHXzqox8qHzcb9y65bTm+fyntNEXfNoWQlZDj+1Pt6bETr7Djiz8GYPzYT1Lb+OoPRvjFb15ILWc27m36fkojt0GgcmtQBVjmqAIsc/L4FFA31q29i19+95EFy33+4w/ygQ333wKJ8kfTBzeVgsB6oUGg0rI0vQKYjXuN2bjX0NG2OmtZmpGmVwBlabR0ELgQz/7uaQAeeM8G7l379oylyYZlrQDXr00AMDs7m7Ek2dE6LqD3nqwlaEpa5vFGRPqASwD87adLb/D+T0L3WwEoFuLz5Mq0tETftY4FUGqi6WOA3k4jEJ6l41Pz6RXeOAlnn7f7G77UUNmaAbUAy5ymtwCVmJqcZOzcufDBy2fh3Bt2v/e/sTpvu+8+AMbOvcbUZO1/F9gsNH0g47sAF98FHHvheXZs31xVe37dh7Zt4i8v/jm1nAaBSkvQ9FqcZAEqUSz2seYt9vFu3bsHABj9+1/536n/pNZJCiqNMU3fd6AWYNnTMkFgR0cHOz72idTzL7/0EgBdXatY1d0LwMTVcQBmZ6YbL2BOaXozVl4H6Ovj9NjF1HKf+8xnY8f+/Y8SABfGzjE+fjm1rroApWVpei1erAUo464Eerh/F+Dz7M++zIPrI6+I+78A7QVALYDSIjR/ECjyOEBPsXj7t7/x+LfcU/euXcsjj+6u37XGT3+HO985Wb8Gs6fpFeDKDN8DOPPPU337nvh+SAHe9/4P1lcBxo7sM296V3q02ISoC6iCkyfPZC1C3cl1ICMyJ3CTIBUI528Cc8Ac4+OXWXvXQEPlOXPhRXp6e7Dzph24LSG1x5Ixt+W2nzNzASI3BaaBGSfNYo/Neullwp05Fcl3EO74xjIvdwM9+EoH887+tLedJaqkIsfFytoBdHrbFU7qxJj2TJSk4RcVmRY7cG6axHaY3yGd2I7ocLZ2f6HZ09tpfu/tdgBbF5QHnjHIfpszz1V1M9Oy+gpUFQNYK+Yr9yzB/gy2L/x8J3A71soFyZjOho5RXaeNyLzAdWy64W1L2Bvzb+4Ogpuri9Z/uJrCBnP2yrT8AaC3sw5XX+h6izD/1hq6E2QCeB2YQuSkQBewErvtwpi2uinFkhsSmRG4ihX6qnd0FYHAK+tu3kSuCowDVygW+quq++ieLTyx72FAKBaqe0I4ff63FIurvNxK7H32AkWM6an7TLWK4U+kG8A170w31hX1YMyKJV235soiE2J/hHsJ2xndQDfGdNetI0SuC7wKXMAO+DXsDLmJL3qxkPb1zzDjUwdSz33tK0/x86GjC7Zx+vyPKBZXernoZ+XasZZtFVAE1gB3Y0xXnZV/Quxkm8AqxWpgdc39XrULsDP+deAU1pyvq+tNikwJnATOAMPYQMv9bl9eA+o5rIJeB84D/wLaEPm1wD3AezGmsGTh3YG2E+QycAqRVwXeXLVFqCEGGPO276jLDcV5DjvjIfzptejg33pl2PDAN2nz3O8rZ3/oyOETlXOewEq+Vnd5/IlnJ80FgrFZPDUowAVg/ZJ9TzrxL3InnzeRso3n0sVrTi4qR5qsjVdSYwrGWuYTVdetQQHWAGOITEljLMBHsC7gLNbvz3nH8+YCkj4lG5WvHRskWhfQKKwFGMOOTXVU3ZtBDHARGwP01T3QCa6VFgTOkWx6G03aV8cNdjGq8UGgi+0f38XcQS0xQK6fAtKvHTwGWqW4QbCoMkOwOjdLMFDRX/WkfRLeOMfavOSvON7plGv8Y2AS9X4KaNA6QJeT6r8OsFyw6wDuotp170wP/lpAZusAScRXAn2T7a4EusucqhiQtBLoL5dPYvstxyuBC1H5XYC/7l+g1ncBeafyu4BpZ1sgi3cBmXVu5beBM9jVvhmSXq8mv4r1/bW730bg0939kCReaovk5yP7fpqL7EdT/G1gWKmX2dvApRD/PUD4NwDJyR+Y6CC6eRdfOeYieUNceVzlao3fAyiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKkn/+D86zakWWBnoIAAAAAElFTkSuQmCC';
const png1Data = 'data:image/png;base64,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';
const png2Data = 'data:image/png;base64,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';

const files = [
  // {
  //   type: "image",
  //   key: "loading_bg.png",
  //   url: bgData,
  // },
  {
    type: "image",
    key: "loading0.png",
    url: png0Data,
  },
  {
    type: "image",
    key: "loading1.png",
    url: png1Data,
  },
  {
    type: "image",
    key: "loading2.png",
    url: png2Data,
  },
];


export class LoadScene extends Phaser.Scene {

  baseUrl!: HTMLElement | null;
  loadingE!: AnimatedSprite;

  constructor() {
    super({ key: 'LoadScene', pack: { files } });

    if ((this.baseUrl = document.getElementById("baseUrl"))) {
      PROPERTIES.baseUrl = this.baseUrl.innerHTML;
    }
  }

  init() {
    var frameKeys = ["loading0.png", "loading1.png", "loading2.png"];
    this.loadingE = new AnimatedSprite(this, frameKeys);
    this.loadingE.x = GAME_CENTER - 64;
    this.loadingE.y = GAME_MIDDLE - 64;
    this.loadingE.animationSpeed = 0.15;
    // this.loadingTexture = "loading_bg.png";
    // this.loadingBg = this.add.image(0, 0, this.loadingTexture).setOrigin(0);
    // this.loadingBg.alpha = 0.09;
    // this.loadingBgFlipCnt = 0;
    document.cookie.split(";").forEach(function (t) {
      var e = t.split("=");
      "evilinvaders_highScore" == e[0] && (PROPERTIES.highScore = +e[1]);
    });
  }

  async preload() {

    let audioFiles: string[] = [];

    if (new URL(window.location.href).searchParams.get("audio") != "0") {
      let fileTypes = {
        jpg: "image",
        json: "json",
        mp3: "audio",
        png: "image"
      };

      for (var n in CONSTANTS.RESOURCE) {
        let fileType = CONSTANTS.RESOURCE[n].match(/\w+$/)[0];
        if (fileTypes[fileType] === "audio") audioFiles.push(n);
        this.load[fileTypes[fileType]](n, PROPERTIES.baseUrl + CONSTANTS.RESOURCE[n]);
      }
    }

    const base = PROPERTIES.baseUrl || "/"; // '/', '/evil-invaders-phaser4/', or './'
    const packUrl = (base.endsWith("/") ? base : base + "/") + "asset-pack.json";

    this.load.setPath(base + 'assets');
    this.load.pack("pack", packUrl);

    // Optional: log any misses
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (f: any) =>
      console.warn("Load error:", f.type, f.key, f.src)
    );

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
      this.load.once(Phaser.Loader.Events.COMPLETE, (loader, totalComplete, totalFailed) => {
        console.log('Load complete:', totalComplete, 'files,', totalFailed, 'failed');
        audioFiles.forEach((n) => {
          Sound.resource[n] = this.sound.add(n);
        });

        resolve();
      });

      this.load.start();
    });

    /* ---------------- 4️⃣  Choose next scene ---------------- */
    if (gameData) {
      this.scene.start("OverloadScene");
    }
  }
}
