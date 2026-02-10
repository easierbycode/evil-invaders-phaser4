import Phaser from "phaser";
import CONSTANTS from "./../constants";

const { GAME_WIDTH, GAME_HEIGHT } = CONSTANTS;

const RETRO_FONT_KEY = "highscore-font";
const CHAR_WIDTH = 8;
const CHAR_HEIGHT = 8;
const GRID_COLUMNS = 6;
const MAX_NAME_LENGTH = 3;

const BUTTONS = {
  bottom: 0,
  right: 1,
  select: 8,
  start: 9,
  dpadUp: 12,
  dpadDown: 13,
  dpadLeft: 14,
  dpadRight: 15,
};

export class HighScoreScene extends Phaser.Scene {
  private allowedChars: string[] = [];
  private selectedIndex = 0;
  private nameValue = "";
  private nameText!: Phaser.GameObjects.BitmapText;
  private cursor!: Phaser.GameObjects.Rectangle;
  private gridText!: Phaser.GameObjects.BitmapText;
  private gridBaseX = 0;
  private gridBaseY = 0;
  private gridScale = 2;

  constructor() {
    super("HighScoreScene");
  }

  create() {
    this.allowedChars = Phaser.GameObjects.RetroFont.TEXT_SET1.replace(/[^A-Z0-9]/g, "").split("");
    this.createFontTexture();
    this.registerRetroFont();

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000).setOrigin(0, 0);

    const title = this.add.bitmapText(GAME_WIDTH / 2, 36, RETRO_FONT_KEY, "HIGH SCORE", 8);
    title.setOrigin(0.5, 0.5);
    title.setScale(2.2);

    this.nameText = this.add.bitmapText(GAME_WIDTH / 2, 90, RETRO_FONT_KEY, "", 8);
    this.nameText.setOrigin(0.5, 0.5);
    this.nameText.setScale(2);
    this.updateNameText();

    this.gridText = this.add.bitmapText(0, 0, RETRO_FONT_KEY, this.buildGridText(), 8);
    this.gridText.setScale(this.gridScale);
    this.gridBaseX = Math.floor((GAME_WIDTH - this.gridText.width * this.gridScale) / 2);
    this.gridBaseY = 140;
    this.gridText.setPosition(this.gridBaseX, this.gridBaseY);

    const cursorSize = CHAR_WIDTH * this.gridScale;
    this.cursor = this.add.rectangle(0, 0, cursorSize, cursorSize);
    this.cursor.setStrokeStyle(2, 0xffff00);
    this.cursor.setOrigin(0.5, 0.5);
    this.updateCursorPosition();

    const instructions = [
      "DPAD = MOVE",
      "A = PICK",
      "B = DELETE",
      "START = DONE",
    ].join("\n");

    const help = this.add.bitmapText(GAME_WIDTH / 2, GAME_HEIGHT - 54, RETRO_FONT_KEY, instructions, 8);
    help.setOrigin(0.5, 0.5);
    help.setScale(1.5);

    this.input.gamepad.on("down", (_pad: Phaser.Input.Gamepad.Gamepad, _button: Phaser.Input.Gamepad.Button, index: number) => {
      if (index === BUTTONS.dpadUp) this.moveSelection(0, -1);
      if (index === BUTTONS.dpadDown) this.moveSelection(0, 1);
      if (index === BUTTONS.dpadLeft) this.moveSelection(-1, 0);
      if (index === BUTTONS.dpadRight) this.moveSelection(1, 0);
      if (index === BUTTONS.bottom) this.pickCharacter();
      if (index === BUTTONS.right) this.deleteCharacter();
      if (index === BUTTONS.start) this.completeEntry();
    });

    const cursors = this.input.keyboard?.createCursorKeys();
    cursors?.up?.on("down", () => this.moveSelection(0, -1));
    cursors?.down?.on("down", () => this.moveSelection(0, 1));
    cursors?.left?.on("down", () => this.moveSelection(-1, 0));
    cursors?.right?.on("down", () => this.moveSelection(1, 0));
    this.input.keyboard?.on("keydown-ENTER", () => this.completeEntry());
    this.input.keyboard?.on("keydown-SPACE", () => this.pickCharacter());
    this.input.keyboard?.on("keydown-BACKSPACE", () => this.deleteCharacter());
  }

  private buildGridText(): string {
    return this.allowedChars.reduce((rows, char, index) => {
      const rowIndex = Math.floor(index / GRID_COLUMNS);
      rows[rowIndex] = `${rows[rowIndex] ?? ""}${char}`;
      return rows;
    }, [] as string[]).join("\n");
  }

  private createFontTexture() {
    if (this.textures.exists(RETRO_FONT_KEY)) {
      return;
    }

    const width = CHAR_WIDTH * this.allowedChars.length;
    const height = CHAR_HEIGHT;
    const texture = this.textures.createCanvas(RETRO_FONT_KEY, width, height);
    const ctx = texture.getContext();

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#f2d048";
    ctx.font = "8px monospace";
    ctx.textBaseline = "top";

    this.allowedChars.forEach((char, index) => {
      ctx.fillText(char, index * CHAR_WIDTH, 0);
    });

    texture.refresh();
  }

  private registerRetroFont() {
    const fontData = Phaser.GameObjects.RetroFont.Parse(this, {
      image: RETRO_FONT_KEY,
      width: CHAR_WIDTH,
      height: CHAR_HEIGHT,
      chars: this.allowedChars.join(""),
      charsPerRow: this.allowedChars.length,
      "offset.x": 0,
      "offset.y": 0,
      "spacing.x": 0,
      "spacing.y": 0,
      lineSpacing: 0,
    });

    if (!this.cache.bitmapFont.has(RETRO_FONT_KEY)) {
      this.cache.bitmapFont.add(RETRO_FONT_KEY, fontData);
    }
  }

  private moveSelection(deltaX: number, deltaY: number) {
    const columns = GRID_COLUMNS;
    const rows = Math.ceil(this.allowedChars.length / columns);
    const currentRow = Math.floor(this.selectedIndex / columns);
    const currentCol = this.selectedIndex % columns;

    const nextRow = Phaser.Math.Wrap(currentRow + deltaY, 0, rows);
    const nextCol = Phaser.Math.Wrap(currentCol + deltaX, 0, columns);
    let nextIndex = nextRow * columns + nextCol;
    if (nextIndex >= this.allowedChars.length) {
      nextIndex = this.allowedChars.length - 1;
    }

    this.selectedIndex = nextIndex;
    this.updateCursorPosition();
  }

  private updateCursorPosition() {
    const column = this.selectedIndex % GRID_COLUMNS;
    const row = Math.floor(this.selectedIndex / GRID_COLUMNS);
    const charSize = CHAR_WIDTH * this.gridScale;

    const cursorX = this.gridBaseX + column * charSize + charSize / 2;
    const cursorY = this.gridBaseY + row * charSize + charSize / 2;

    this.cursor.setPosition(cursorX, cursorY);
  }

  private pickCharacter() {
    if (this.nameValue.length >= MAX_NAME_LENGTH) {
      return;
    }

    const char = this.allowedChars[this.selectedIndex];
    if (!char) {
      return;
    }

    this.nameValue += char;
    this.updateNameText();
  }

  private deleteCharacter() {
    if (this.nameValue.length === 0) {
      return;
    }

    this.nameValue = this.nameValue.slice(0, -1);
    this.updateNameText();
  }

  private completeEntry() {
    this.scene.start("LevelSelectScene");
  }

  private updateNameText() {
    const display = this.nameValue.padEnd(MAX_NAME_LENGTH, "_");
    this.nameText.setText(`NAME: ${display}`);
  }
}
