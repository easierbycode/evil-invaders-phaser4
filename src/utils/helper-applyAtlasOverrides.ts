/******************************************************************
 * helper‑applyAtlasOverrides.ts
 * Rebuild the 'game_asset' atlas on‑the‑fly if localStorage
 * contains frame overrides.  Keeps the SAME texture key & frames.
 ******************************************************************/
export async function applyAtlasOverrides(scene: Phaser.Scene) {
  const overrides: Record<string, string> =
    JSON.parse(localStorage.getItem('atlasOverrides') || '{}');

  // Nothing stored?  Nothing to do.
  if (!Object.keys(overrides).length) return;

  const atlas = scene.textures.get('game_asset');
  if (!atlas) return; // safety

  // --- 1. Build an off‑screen canvas equal to the atlas size.
  const srcImg = atlas.getSourceImage() as HTMLImageElement;
  const canvas = document.createElement('canvas');
  canvas.width = srcImg.width;
  canvas.height = srcImg.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(srcImg, 0, 0);               // original atlas first

  // --- 2. Draw every override onto that canvas in the right spot.
  const loadPromises: Promise<void>[] = [];

  Object.entries(overrides).forEach(([frameName, dataURL]) => {
    const f = scene.textures.getFrame('game_asset', frameName);
    if (!f) return;                       // unknown name? skip

    const img = new Image();
    img.src = dataURL;

    loadPromises.push(
      new Promise(res => {
        img.onload = () => {
          // 1️⃣ wipe the old pixels in this frame’s rect
          ctx.clearRect(f.cutX, f.cutY, f.width, f.height);

          // 2️⃣ draw the new image, scaling if necessary
          ctx.drawImage(
            img,
            0, 0, img.width, img.height,   // src rect (full image)
            f.cutX, f.cutY,                // dest x,y in atlas
            f.width, f.height              // dest w,h (frame size)
          );
          res();
        };
      })
    );
  });

  await Promise.all(loadPromises);            // wait for all images

  // --- 3. Re‑create the atlas texture with SAME key & JSON.
  const rebuiltImg = new Image();
  rebuiltImg.src = canvas.toDataURL();

  await new Promise(res => { rebuiltImg.onload = () => res(null); });

  // Extract original JSON (preferred).  Fallback: auto‑rebuild.
  let originalJson = scene.cache.json.get('game_asset');
  if (!originalJson) {
    // Build a minimal hash‑style JSON from the live frames.
    originalJson = { frames: {}, meta: { scale: '1' } };
    atlas.getFrameNames().forEach(frameName => {
      // ✔ again, use the Texture Manager
      const f = scene.textures.getFrame('game_asset', frameName);
      originalJson.frames[frameName] = {
        frame: { x: f.cutX, y: f.cutY, w: f.width, h: f.height },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: f.width, h: f.height },
        sourceSize: { w: f.width, h: f.height },
        pivot: { x: 0.5, y: 0.5 }
      };
    });
  }

  // Hot‑swap the texture.
  scene.textures.remove('game_asset');
  scene.textures.addAtlas('game_asset', rebuiltImg, originalJson);
}