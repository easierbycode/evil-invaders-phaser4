import Phaser from "phaser";
import CONSTANTS from "../constants";
import PROPERTIES from "../properties";
import Sound from "../soundManager";

const { GAME_WIDTH, GAME_HEIGHT } = CONSTANTS;

// Phaser.GameObjects.RetroFont.TEXT_SET1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const TEXT_SET1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CHAR_WIDTH = 14;
const CHAR_HEIGHT = 8;
const MAX_NAME_LENGTH = 3;

// Gamepad button indices (standard mapping)
const BUTTON_A = 0;      // Bottom face button (A on Xbox, Cross on PS)
const BUTTON_B = 1;      // Right face button (B on Xbox, Circle on PS)
const BUTTON_SELECT = 8; // Select/Back button
const BUTTON_START = 9;  // Start button

// D-PAD axes and buttons
const AXIS_LEFT_X = 0;
const AXIS_LEFT_Y = 1;

export default class HighScoreScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private titleText!: Phaser.GameObjects.BitmapText;
  private charSelector!: Phaser.GameObjects.Container;
  private charCursor!: Phaser.GameObjects.Rectangle;
  private nameDisplay!: Phaser.GameObjects.Container;
  private scoreDisplay!: Phaser.GameObjects.Container;

  private currentCharIndex: number = 0;
  private enteredName: string = "";
  private isEnteringName: boolean = true;
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;

  // Input cooldown to prevent rapid repeated inputs
  private inputCooldown: number = 0;
  private readonly INPUT_DELAY: number = 150; // ms

  // Track previous button states for edge detection
  private prevButtonStates: Map<number, boolean> = new Map();
  private prevAxisStates: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    super("HighScoreScene");
  }

  create() {
    // Background
    this.bg = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "stars-bg");
    this.bg.setOrigin(0, 0);

    // Title
    this.add.text(GAME_WIDTH / 2, 30, "HIGH SCORES", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ffff00"
    }).setOrigin(0.5);

    // Create the retro font configuration
    this.createRetroFont();

    // Create character selector grid
    this.createCharacterSelector();

    // Create name display area
    this.createNameDisplay();

    // Create score display area
    this.createScoreDisplay();

    // Instructions
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, "D-PAD: Move  A: Select  B: Delete", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#888888"
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 45, "START: Confirm Entry", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#888888"
    }).setOrigin(0.5);

    // Setup gamepad
    this.setupGamepad();

    // Setup keyboard fallback
    this.setupKeyboard();

    // Play sound if available
    try {
      Sound.play("se_cursor");
    } catch (e) {
      // Ignore if sound not loaded
    }
  }

  createRetroFont() {
    // Create bitmap font from the retro-font texture
    // The texture contains TEXT_SET1 characters in a horizontal strip
    const config: Phaser.Types.GameObjects.BitmapText.RetroFontConfig = {
      image: "retro-font",
      width: CHAR_WIDTH,
      height: CHAR_HEIGHT,
      chars: TEXT_SET1,
      charsPerRow: 36,
      offsetX: 0,
      offsetY: 0,
      spacing: { x: 0, y: 0 }
    };

    // Create the retro font
    this.cache.bitmapFont.add(
      "retro-font",
      Phaser.GameObjects.RetroFont.Parse(this, config)
    );
  }

  createCharacterSelector() {
    this.charSelector = this.add.container(GAME_WIDTH / 2, 180);

    const charsPerRow = 9;
    const rows = Math.ceil(TEXT_SET1.length / charsPerRow);
    const cellWidth = 24;
    const cellHeight = 20;
    const startX = -((charsPerRow - 1) * cellWidth) / 2;
    const startY = -((rows - 1) * cellHeight) / 2;

    // Draw character grid
    for (let i = 0; i < TEXT_SET1.length; i++) {
      const row = Math.floor(i / charsPerRow);
      const col = i % charsPerRow;
      const x = startX + col * cellWidth;
      const y = startY + row * cellHeight;

      // Character background
      const bg = this.add.rectangle(x, y, cellWidth - 2, cellHeight - 2, 0x333333);
      bg.setStrokeStyle(1, 0x666666);
      this.charSelector.add(bg);

      // Character text using bitmap font
      const charText = this.add.bitmapText(x, y, "retro-font", TEXT_SET1[i]);
      charText.setOrigin(0.5);
      charText.setScale(1.5);
      this.charSelector.add(charText);
    }

    // Create cursor
    const cursorRow = Math.floor(this.currentCharIndex / charsPerRow);
    const cursorCol = this.currentCharIndex % charsPerRow;
    const cursorX = startX + cursorCol * cellWidth;
    const cursorY = startY + cursorRow * cellHeight;

    this.charCursor = this.add.rectangle(cursorX, cursorY, cellWidth - 2, cellHeight - 2);
    this.charCursor.setStrokeStyle(2, 0xffff00);
    this.charCursor.setFillStyle(0xffff00, 0.3);
    this.charSelector.add(this.charCursor);
  }

  createNameDisplay() {
    this.nameDisplay = this.add.container(GAME_WIDTH / 2, 80);

    // Label
    const label = this.add.text(0, -20, "ENTER NAME:", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#ffffff"
    }).setOrigin(0.5);
    this.nameDisplay.add(label);

    // Name boxes
    for (let i = 0; i < MAX_NAME_LENGTH; i++) {
      const box = this.add.rectangle(-30 + i * 30, 0, 24, 24, 0x222222);
      box.setStrokeStyle(2, 0x888888);
      box.setName(`namebox_${i}`);
      this.nameDisplay.add(box);
    }

    this.updateNameDisplay();
  }

  updateNameDisplay() {
    // Remove old character texts
    this.nameDisplay.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.BitmapText && child.name?.startsWith("namechar_")) {
        child.destroy();
      }
    });

    // Add current characters
    for (let i = 0; i < this.enteredName.length; i++) {
      const charText = this.add.bitmapText(-30 + i * 30, 0, "retro-font", this.enteredName[i]);
      charText.setOrigin(0.5);
      charText.setScale(2);
      charText.setName(`namechar_${i}`);
      this.nameDisplay.add(charText);
    }

    // Update box highlights
    for (let i = 0; i < MAX_NAME_LENGTH; i++) {
      const box = this.nameDisplay.getByName(`namebox_${i}`) as Phaser.GameObjects.Rectangle;
      if (box) {
        if (i === this.enteredName.length && this.isEnteringName) {
          box.setStrokeStyle(2, 0xffff00); // Highlight current position
        } else if (i < this.enteredName.length) {
          box.setStrokeStyle(2, 0x00ff00); // Filled positions
        } else {
          box.setStrokeStyle(2, 0x888888); // Empty positions
        }
      }
    }
  }

  createScoreDisplay() {
    this.scoreDisplay = this.add.container(GAME_WIDTH / 2, 320);

    // Label
    const label = this.add.text(0, -30, "TOP SCORES", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#ffff00"
    }).setOrigin(0.5);
    this.scoreDisplay.add(label);

    // Display existing high scores (placeholder for now)
    const highScores = this.getHighScores();
    for (let i = 0; i < 5; i++) {
      const score = highScores[i] || { name: "---", score: 0 };
      const y = i * 20;

      const rankText = this.add.text(-80, y, `${i + 1}.`, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffffff"
      }).setOrigin(0, 0.5);
      this.scoreDisplay.add(rankText);

      const nameText = this.add.text(-50, y, score.name.padEnd(3, " "), {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#00ffff"
      }).setOrigin(0, 0.5);
      this.scoreDisplay.add(nameText);

      const scoreText = this.add.text(80, y, score.score.toString().padStart(8, "0"), {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffffff"
      }).setOrigin(1, 0.5);
      this.scoreDisplay.add(scoreText);
    }
  }

  getHighScores(): Array<{ name: string; score: number }> {
    // Get high scores from localStorage or return defaults
    try {
      const stored = localStorage.getItem("evilinvaders_highscores");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return [
      { name: "AAA", score: 10000 },
      { name: "BBB", score: 8000 },
      { name: "CCC", score: 6000 },
      { name: "DDD", score: 4000 },
      { name: "EEE", score: 2000 }
    ];
  }

  saveHighScore(name: string, score: number) {
    const highScores = this.getHighScores();
    highScores.push({ name, score });
    highScores.sort((a, b) => b.score - a.score);
    highScores.splice(5); // Keep only top 5

    try {
      localStorage.setItem("evilinvaders_highscores", JSON.stringify(highScores));
    } catch (e) {
      // Ignore localStorage errors
    }

    // Also update cookie for backwards compatibility
    document.cookie = `evilinvaders_highScore=${highScores[0].score}`;
    PROPERTIES.highScore = highScores[0].score;
  }

  setupGamepad() {
    // Get connected gamepad
    const pads = this.input.gamepad.gamepads;
    if (pads && pads.length > 0) {
      this.gamepad = pads.find(p => p?.connected) || null;
    }

    // Listen for gamepad connection
    this.input.gamepad.on("connected", (pad: Phaser.Input.Gamepad.Gamepad) => {
      this.gamepad = pad;
    });
  }

  setupKeyboard() {
    // Arrow keys for navigation
    this.input.keyboard.on("keydown-LEFT", () => this.moveCursor(-1, 0));
    this.input.keyboard.on("keydown-RIGHT", () => this.moveCursor(1, 0));
    this.input.keyboard.on("keydown-UP", () => this.moveCursor(0, -1));
    this.input.keyboard.on("keydown-DOWN", () => this.moveCursor(0, 1));

    // Enter/Space to select
    this.input.keyboard.on("keydown-ENTER", () => this.selectCharacter());
    this.input.keyboard.on("keydown-SPACE", () => this.selectCharacter());

    // Backspace to delete
    this.input.keyboard.on("keydown-BACKSPACE", () => this.deleteCharacter());

    // Escape to confirm/exit
    this.input.keyboard.on("keydown-ESC", () => this.confirmEntry());
  }

  moveCursor(dx: number, dy: number) {
    if (!this.isEnteringName) return;

    const charsPerRow = 9;
    const totalChars = TEXT_SET1.length;
    const rows = Math.ceil(totalChars / charsPerRow);

    let row = Math.floor(this.currentCharIndex / charsPerRow);
    let col = this.currentCharIndex % charsPerRow;

    col += dx;
    row += dy;

    // Wrap horizontally
    if (col < 0) col = charsPerRow - 1;
    if (col >= charsPerRow) col = 0;

    // Wrap vertically
    if (row < 0) row = rows - 1;
    if (row >= rows) row = 0;

    let newIndex = row * charsPerRow + col;

    // Make sure we don't go past the last character
    if (newIndex >= totalChars) {
      newIndex = totalChars - 1;
    }

    this.currentCharIndex = newIndex;
    this.updateCursor();

    try {
      Sound.play("se_cursor_sub");
    } catch (e) {
      // Ignore
    }
  }

  updateCursor() {
    const charsPerRow = 9;
    const rows = Math.ceil(TEXT_SET1.length / charsPerRow);
    const cellWidth = 24;
    const cellHeight = 20;
    const startX = -((charsPerRow - 1) * cellWidth) / 2;
    const startY = -((rows - 1) * cellHeight) / 2;

    const row = Math.floor(this.currentCharIndex / charsPerRow);
    const col = this.currentCharIndex % charsPerRow;

    this.charCursor.setPosition(
      startX + col * cellWidth,
      startY + row * cellHeight
    );
  }

  selectCharacter() {
    if (!this.isEnteringName) return;
    if (this.enteredName.length >= MAX_NAME_LENGTH) return;

    this.enteredName += TEXT_SET1[this.currentCharIndex];
    this.updateNameDisplay();

    try {
      Sound.play("se_decision");
    } catch (e) {
      // Ignore
    }
  }

  deleteCharacter() {
    if (!this.isEnteringName) return;
    if (this.enteredName.length === 0) return;

    this.enteredName = this.enteredName.slice(0, -1);
    this.updateNameDisplay();

    try {
      Sound.play("se_cursor");
    } catch (e) {
      // Ignore
    }
  }

  confirmEntry() {
    if (!this.isEnteringName) {
      // Exit scene
      this.scene.start("TitleScene");
      return;
    }

    if (this.enteredName.length === 0) {
      this.enteredName = "AAA"; // Default name
    }

    // Pad name to 3 characters
    while (this.enteredName.length < MAX_NAME_LENGTH) {
      this.enteredName += " ";
    }

    // Save the high score (use current score from properties or default)
    const currentScore = PROPERTIES.score || 0;
    this.saveHighScore(this.enteredName.trim(), currentScore);

    this.isEnteringName = false;

    // Refresh score display
    this.scoreDisplay.destroy();
    this.createScoreDisplay();

    // Show completion message
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, "PRESS START TO CONTINUE", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#ffff00"
    }).setOrigin(0.5);

    try {
      Sound.play("se_correct");
    } catch (e) {
      // Ignore
    }
  }

  update(time: number, delta: number) {
    // Scroll background
    if (this.bg) {
      this.bg.tilePositionX -= 0.3;
    }

    // Update input cooldown
    if (this.inputCooldown > 0) {
      this.inputCooldown -= delta;
    }

    // Handle gamepad input
    this.handleGamepadInput();
  }

  handleGamepadInput() {
    if (!this.gamepad || this.inputCooldown > 0) return;

    // Get D-PAD input from axes or buttons
    const leftX = this.gamepad.axes.length > AXIS_LEFT_X ? this.gamepad.axes[AXIS_LEFT_X].getValue() : 0;
    const leftY = this.gamepad.axes.length > AXIS_LEFT_Y ? this.gamepad.axes[AXIS_LEFT_Y].getValue() : 0;

    // D-PAD buttons (buttons 12-15 on standard gamepad)
    const dpadUp = this.gamepad.buttons[12]?.pressed || leftY < -0.5;
    const dpadDown = this.gamepad.buttons[13]?.pressed || leftY > 0.5;
    const dpadLeft = this.gamepad.buttons[14]?.pressed || leftX < -0.5;
    const dpadRight = this.gamepad.buttons[15]?.pressed || leftX > 0.5;

    // Handle D-PAD movement with edge detection
    if (dpadLeft && this.prevAxisStates.x >= -0.5) {
      this.moveCursor(-1, 0);
      this.inputCooldown = this.INPUT_DELAY;
    } else if (dpadRight && this.prevAxisStates.x <= 0.5) {
      this.moveCursor(1, 0);
      this.inputCooldown = this.INPUT_DELAY;
    } else if (dpadUp && this.prevAxisStates.y >= -0.5) {
      this.moveCursor(0, -1);
      this.inputCooldown = this.INPUT_DELAY;
    } else if (dpadDown && this.prevAxisStates.y <= 0.5) {
      this.moveCursor(0, 1);
      this.inputCooldown = this.INPUT_DELAY;
    }

    // Store axis states for edge detection
    this.prevAxisStates.x = leftX;
    this.prevAxisStates.y = leftY;

    // Handle face buttons with edge detection
    const buttonA = this.gamepad.buttons[BUTTON_A]?.pressed || false;
    const buttonB = this.gamepad.buttons[BUTTON_B]?.pressed || false;
    const buttonStart = this.gamepad.buttons[BUTTON_START]?.pressed || false;

    // Bottom face button (A) - Select character
    if (buttonA && !this.prevButtonStates.get(BUTTON_A)) {
      this.selectCharacter();
      this.inputCooldown = this.INPUT_DELAY;
    }

    // Right face button (B) - Delete character
    if (buttonB && !this.prevButtonStates.get(BUTTON_B)) {
      this.deleteCharacter();
      this.inputCooldown = this.INPUT_DELAY;
    }

    // Start button - Confirm entry
    if (buttonStart && !this.prevButtonStates.get(BUTTON_START)) {
      this.confirmEntry();
      this.inputCooldown = this.INPUT_DELAY;
    }

    // Store button states for edge detection
    this.prevButtonStates.set(BUTTON_A, buttonA);
    this.prevButtonStates.set(BUTTON_B, buttonB);
    this.prevButtonStates.set(BUTTON_START, buttonStart);
  }
}

// Helper function to check for SELECT + D-PAD UP combo from any scene
export function checkHighScoreCombo(gamepad: Phaser.Input.Gamepad.Gamepad): boolean {
  if (!gamepad) return false;

  const selectPressed = gamepad.buttons[BUTTON_SELECT]?.pressed || false;
  const leftY = gamepad.axes.length > AXIS_LEFT_Y ? gamepad.axes[AXIS_LEFT_Y].getValue() : 0;
  const dpadUp = gamepad.buttons[12]?.pressed || leftY < -0.5;

  return selectPressed && dpadUp;
}
