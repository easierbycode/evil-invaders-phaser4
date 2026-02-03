import Phaser from "phaser";
import CONSTANTS from "./../constants";
import PROPERTIES from "../properties";

const { GAME_WIDTH, GAME_HEIGHT } = CONSTANTS;

const BUTTONS = {
  bottom: 0,
  start: 9,
  select: 8,
  dpadUp: 12,
  dpadDown: 13,
};

export class LevelSelectScene extends Phaser.Scene {
  private options: string[] = [];
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private selectedIndex = 0;
  private comboLocked = false;
  private editorActive = false;

  constructor() {
    super("LevelSelectScene");
  }

  create() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000).setOrigin(0, 0);

    this.add.text(GAME_WIDTH / 2, 30, "LEVEL SELECT", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#f2d048",
    }).setOrigin(0.5, 0.5);

    this.options = this.getStageOptions();
    this.options.push("HIGH SCORES");

    const startY = 80;
    const lineHeight = 28;
    this.optionTexts = this.options.map((option, index) => {
      return this.add.text(GAME_WIDTH / 2, startY + index * lineHeight, option, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
      }).setOrigin(0.5, 0.5);
    });

    this.refreshSelection();

    const cursors = this.input.keyboard?.createCursorKeys();
    cursors?.up?.on("down", () => this.moveSelection(-1));
    cursors?.down?.on("down", () => this.moveSelection(1));
    this.input.keyboard?.on("keydown-ENTER", () => this.confirmSelection());
    this.input.keyboard?.on("keydown-SPACE", () => this.confirmSelection());

    this.input.gamepad.on("down", (_pad: Phaser.Input.Gamepad.Gamepad, _button: Phaser.Input.Gamepad.Button, index: number) => {
      if (index === BUTTONS.dpadUp) this.moveSelection(-1);
      if (index === BUTTONS.dpadDown) this.moveSelection(1);
      if (index === BUTTONS.bottom || index === BUTTONS.start) this.confirmSelection();
    });
  }

  update() {
    const pad = this.input.gamepad.gamepads.find((candidate) => candidate?.connected);
    if (!pad) {
      this.comboLocked = false;
      return;
    }

    const selectPressed = pad.buttons[BUTTONS.select]?.pressed;
    const upPressed = pad.buttons[BUTTONS.dpadUp]?.pressed;

    if (selectPressed && upPressed) {
      if (!this.comboLocked) {
        this.comboLocked = true;
        this.launchAtlasEditor();
      }
    } else {
      this.comboLocked = false;
    }
  }

  private getStageOptions(): string[] {
    const stageKeys = Object.keys(PROPERTIES.resource?.recipe?.data ?? {}).filter((key) => key.startsWith("stage"));
    if (stageKeys.length === 0) {
      return ["STAGE 1"];
    }

    stageKeys.sort();
    return stageKeys.map((_key, index) => `STAGE ${index + 1}`);
  }

  private moveSelection(direction: number) {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + direction, 0, this.options.length);
    this.refreshSelection();
  }

  private refreshSelection() {
    this.optionTexts.forEach((text, index) => {
      text.setColor(index === this.selectedIndex ? "#f2d048" : "#ffffff");
    });
  }

  private confirmSelection() {
    if (this.selectedIndex === this.options.length - 1) {
      this.scene.start("HighScoreScene");
      return;
    }

    PROPERTIES.stageId = this.selectedIndex;
    this.scene.start("GameScene");
  }

  private launchAtlasEditor() {
    if (this.editorActive) {
      return;
    }

    this.editorActive = true;
    this.scene.pause();
    this.scene.launch("PackerScene");

    const packerScene = this.scene.get("PackerScene");
    packerScene.events.once("shutdown", () => {
      this.editorActive = false;
      this.scene.resume();
    });
  }
}
