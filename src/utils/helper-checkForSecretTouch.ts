export function setupSecretTouchHandler(scene: Phaser.Scene, width: number, height: number, callback: () => void) {
    let bottomLeftTouched = false;
    let topRightTouched = false;

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const touchX = pointer.x;
        const touchY = pointer.y;

        if (touchX < 50 && touchY > height - 50) {
            bottomLeftTouched = true;
        }
        if (touchX > width - 50 && touchY < 50) {
            topRightTouched = true;
        }

        if (bottomLeftTouched && topRightTouched) callback();
    });

    scene.input.on('pointerup', () => {
        bottomLeftTouched = false;
        topRightTouched = false;
    });
}