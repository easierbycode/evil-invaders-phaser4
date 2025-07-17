import { getDB, ref, get, set, OVERRIDES_PATH } from './firebase-config';

/******************************************************************
 * helper‑applyAtlasOverrides.ts – Firebase edition (v2)
 *
 *  • Overrides are persisted in **Firebase Realtime Database** under
 *    `atlas-overrides/evil-invaders`.
 *  • Keys are now URL‑encoded before write so they never include the
 *    forbidden characters `. # $ / [ ]`.
 *  • When reading, we decode keys back to the exact frame names the
 *    game uses (e.g. `cyberLiberty0.png`).
 ******************************************************************/

/**
 * Encode keys so they don’t contain forbidden characters for Firebase
 * paths; URL‑encoding converts all but the period, so we also swap the
 * remaining `.` with its hex representation.
 */
const encodeKey = (key: string): string =>
  encodeURIComponent(key).replace(/\./g, "%2E");

/** Reverse of `encodeKey`. */
const decodeKey = (key: string): string => decodeURIComponent(key);

/**
 * Download the current overrides object from Firebase, decoding keys.
 */
export async function fetchAtlasOverrides(): Promise<Record<string, string>> {
  try {
    const snap = await get(ref(getDB(), OVERRIDES_PATH));
    if (!snap.exists()) return {};

    const raw = snap.val() as Record<string, string>;
    const decoded: Record<string, string> = {};
    Object.entries(raw).forEach(([k, v]) => {
      decoded[decodeKey(k)] = v;
    });
    return decoded;
  } catch (err) {
    console.warn("[applyAtlasOverrides] Firebase fetch failed", err);
    return {};
  }
}

/**
 * Persist the provided overrides object back to Firebase, encoding keys.
 */
export async function saveAtlasOverrides(
  overrides: Record<string, string>
): Promise<void> {
  try {
    const encoded: Record<string, string> = {};
    Object.entries(overrides).forEach(([k, v]) => {
      encoded[encodeKey(k)] = v;
    });

    await set(ref(getDB(), OVERRIDES_PATH), encoded);
  } catch (err) {
    console.error("[applyAtlasOverrides] Firebase save failed", err);
  }
}

/******************************************************************
 * applyAtlasOverrides(scene)
 *
 * Rebuild the "game_asset" texture atlas on‑the‑fly using the latest
 * overrides fetched from Firebase.  Frame names & JSON are preserved
 * so any in‑game references remain unchanged.
 ******************************************************************/
export async function applyAtlasOverrides(scene: Phaser.Scene) {
  // 1️⃣  Get the currently stored overrides (if any)
  const overrides = await fetchAtlasOverrides();
  if (!Object.keys(overrides).length) return; // nothing stored → nothing to do

  const atlas = scene.textures.get("game_asset");
  if (!atlas) return; // safety: atlas must already be loaded

  // --- 2. Build an off‑screen canvas equal to the atlas size.
  const srcImg = atlas.getSourceImage() as HTMLImageElement;
  const canvas = document.createElement("canvas");
  canvas.width = srcImg.width;
  canvas.height = srcImg.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(srcImg, 0, 0); // start with the original atlas

  // --- 3. Draw every override onto that canvas in the correct spot.
  const loadPromises: Promise<void>[] = [];

  Object.entries(overrides).forEach(([frameName, dataURL]) => {
    const f = scene.textures.getFrame("game_asset", frameName);
    if (!f) return; // unknown name? skip it

    const img = new Image();
    img.src = dataURL;

    loadPromises.push(
      new Promise((res) => {
        img.onload = () => {
          // wipe old pixels first
          ctx.clearRect(f.cutX, f.cutY, f.width, f.height);

          // draw the new image, scaling if necessary
          ctx.drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            f.cutX,
            f.cutY,
            f.width,
            f.height
          );
          res();
        };
      })
    );
  });

  await Promise.all(loadPromises); // wait for all individual images to load

  // --- 4. Re‑create the atlas texture with SAME key & JSON.
  const rebuiltImg = new Image();
  rebuiltImg.src = canvas.toDataURL();
  await new Promise((res) => {
    rebuiltImg.onload = () => res(null);
  });

  // Extract original JSON (preferred).  Fallback: auto‑rebuild.
  let originalJson = scene.cache.json.get("game_asset");
  if (!originalJson) {
    // Build a minimal hash‑style JSON from the live frames.local
    originalJson = { frames: {}, meta: { scale: "1" } } as any;
    atlas.getFrameNames().forEach((frameName) => {
      const f = scene.textures.getFrame("game_asset", frameName);
      originalJson.frames[frameName] = {
        frame: { x: f.cutX, y: f.cutY, w: f.width, h: f.height },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: f.width, h: f.height },
        sourceSize: { w: f.width, h: f.height },
        pivot: { x: 0.5, y: 0.5 },
      };
    });
  }

  // Hot‑swap the texture.
  scene.textures.remove("game_asset");
  scene.textures.addAtlas("game_asset", rebuiltImg, originalJson);
}
