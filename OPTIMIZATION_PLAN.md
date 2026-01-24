# Optimization Plan for Evil Invaders (Phaser 4.0.0-rc.4)

## Sprite Animations
- Use texture atlases to pack sprites and reduce texture binds.
- Cache animation definitions during preload/boot to avoid recreating animations each scene.
- Skip animation updates when sprites are off-screen or inactive.
- Ensure animated sprites share the same atlas and blend modes to maximize batching.

## UI Elements
- Replace dynamic text with BitmapText where possible for better performance.
- Group related UI elements into Phaser containers for easier management and reduced draw calls.
- Avoid updating UI text or elements each frame; update only when values change.

## Game Physics
- Tune physics step rate and iterations: set arcade physics FPS to 60 and reduce iterations to lessen CPU load.
- Use broadphase culling or collision groups to limit collision checks to relevant entities.
- Implement object pools for bullets, explosions and other frequently created objects to avoid garbage collection.
- Simplify physics bodies where possible (e.g., rectangles instead of circles) and disable physics on static objects.
- Skip update logic for entities outside of the camera’s view to save processing.
