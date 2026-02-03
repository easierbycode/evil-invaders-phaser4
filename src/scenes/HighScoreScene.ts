
import Sound from './../soundManager';
import CONSTANTS from "./../constants";
import PROPERTIES from "./../properties";
const { GAME_WIDTH, GAME_HEIGHT } = CONSTANTS;

export default class HighScoreScene extends Phaser.Scene {
    private fontMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private textSet = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private playerName: string = "";
    private cursorIndex: number = 1; // Start at 'A'
    private nameText!: any;
    private gridContainer!: Phaser.GameObjects.Container;
    private cursorRect!: Phaser.GameObjects.Graphics;
    private scores: { name: string, score: number }[] = [];
    private isEnteringName: boolean = true;

    constructor() {
        super("HighScoreScene");
    }

    preload() {
        // Assets are loaded in LoadScene
    }

    create() {
        // Background
        const bg = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "stars-bg");
        bg.setOrigin(0, 0);

        // Music
        Sound.bgmPlayLoop("title_bgm", 0.4);

        // Title
        const titleX = GAME_WIDTH / 2 - (11 * 14) / 2;
        this.addRetroText(titleX, 30, "HIGH SCORES");

        // Load scores
        this.loadScores();

        if (this.isEnteringName) {
            this.setupNameEntry();
        } else {
            this.displayScores();
        }

        // Gamepad listeners
        this.input.gamepad.on('down', (pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button) => {
            this.handleInput(button.index);
        });

        // Keyboard fallbacks for testing
        this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
            if (event.key === 'ArrowUp') this.handleInput(12);
            if (event.key === 'ArrowDown') this.handleInput(13);
            if (event.key === 'ArrowLeft') this.handleInput(14);
            if (event.key === 'ArrowRight') this.handleInput(15);
            if (event.key === 'Enter') this.handleInput(9); // Start
            if (event.key === ' ') this.handleInput(0); // Select
            if (event.key === 'Backspace') this.handleInput(1); // Delete
        });
    }

    private loadScores() {
        const savedScores = localStorage.getItem('evilinvaders_scores');
        if (savedScores) {
            this.scores = JSON.parse(savedScores);
        } else {
            this.scores = [
                { name: "AAA", score: 1000 },
                { name: "BBB", score: 800 },
                { name: "CCC", score: 500 }
            ];
        }
    }

    private saveScores() {
        localStorage.setItem('evilinvaders_scores', JSON.stringify(this.scores));
    }

    private setupNameEntry() {
        const enterNameX = GAME_WIDTH / 2 - (10 * 14) / 2;
        this.addRetroText(enterNameX, 70, "ENTER NAME");

        const nameX = GAME_WIDTH / 2 - (3 * 14) / 2;
        this.nameText = this.addRetroText(nameX, 100, "___");

        this.createCharacterGrid();
    }

    private createCharacterGrid() {
        const cols = 6;
        const spacingX = 35;
        const spacingY = 30;
        const gridW = cols * spacingX;
        const startX = (GAME_WIDTH - gridW) / 2 + 10;

        this.gridContainer = this.add.container(startX, 150);

        this.textSet.split('').forEach((char, i) => {
            const x = (i % cols) * spacingX;
            const y = Math.floor(i / cols) * spacingY;
            this.addRetroText(x, y, char, this.gridContainer);
        });

        this.cursorRect = this.add.graphics();
        this.cursorRect.lineStyle(2, 0xffff00);
        this.cursorRect.strokeRect(-5, -5, 25, 25);
        this.gridContainer.add(this.cursorRect);

        this.updateCursor();
    }

    private updateCursor() {
        const cols = 6;
        const spacingX = 35;
        const spacingY = 30;
        this.cursorRect.x = (this.cursorIndex % cols) * spacingX;
        this.cursorRect.y = Math.floor(this.cursorIndex / cols) * spacingY;
    }

    private handleInput(index: number) {
        if (!this.isEnteringName) {
            if (index === 9) this.scene.start("TitleScene");
            return;
        }

        const cols = 6;
        if (index === 12) { // UP
            this.cursorIndex = (this.cursorIndex - cols + this.textSet.length) % this.textSet.length;
        } else if (index === 13) { // DOWN
            this.cursorIndex = (this.cursorIndex + cols) % this.textSet.length;
        } else if (index === 14) { // LEFT
            this.cursorIndex = (this.cursorIndex - 1 + this.textSet.length) % this.textSet.length;
        } else if (index === 15) { // RIGHT
            this.cursorIndex = (this.cursorIndex + 1) % this.textSet.length;
        } else if (index === 0) { // SELECT (Bottom Face)
            if (this.playerName.length < 3) {
                const char = this.textSet[this.cursorIndex];
                if (char !== ' ') {
                    this.playerName += char;
                    this.updateNameDisplay();
                }
            }
        } else if (index === 1) { // DELETE (Right Face)
            if (this.playerName.length > 0) {
                this.playerName = this.playerName.slice(0, -1);
                this.updateNameDisplay();
            }
        } else if (index === 9) { // COMPLETE (Start)
            if (this.playerName.length > 0) {
                this.completeEntry();
            }
        }

        this.updateCursor();
    }

    private updateNameDisplay() {
        let display = this.playerName;
        while (display.length < 3) display += "_";
        this.nameText.setText(display);
    }

    private completeEntry() {
        const currentScore = PROPERTIES.score || 0;
        this.scores.push({ name: this.playerName, score: currentScore });
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 10);
        this.saveScores();

        this.isEnteringName = false;
        this.gridContainer.destroy();
        this.nameText.container.destroy();
        // Reset score so we don't enter name again if we return to this scene
        PROPERTIES.score = 0;
        this.scene.restart({ isEnteringName: false });
    }

    // Override create to handle restart data
    init(data: any) {
        const urlParams = new URLSearchParams(window.location.search);
        if (data && data.isEnteringName !== undefined) {
            this.isEnteringName = data.isEnteringName;
        } else if (urlParams.has("forceNameEntry")) {
            this.isEnteringName = true;
        } else {
            // Check if we should be entering name (e.g. if we have a score to record)
            const currentScore = PROPERTIES.score || 0;
            this.isEnteringName = currentScore > 0;
        }
    }

    private displayScores() {
        this.scores.forEach((entry, i) => {
            const y = 100 + i * 30;
            this.addRetroText(30, y, `${i + 1}. ${entry.name}`);
            this.addRetroText(150, y, `${entry.score}`);
        });

        const info = this.addRetroText(GAME_WIDTH / 2 - 60, GAME_HEIGHT - 50, "PRESS START");
        this.tweens.add({
            targets: info.container,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    private addRetroText(x: number, y: number, text: string, parent?: Phaser.GameObjects.Container) {
        const container = this.add.container(x, y);
        if (parent) parent.add(container);

        const fontWidth = 525;
        const charCount = 36;
        const charWidthBase = fontWidth / charCount;

        const updateText = (newText: string) => {
            container.removeAll(true);
            let cursorX = 0;
            newText.split('').forEach(char => {
                const index = this.fontMap.indexOf(char.toUpperCase());
                if (index !== -1) {
                    const frameX = Math.floor(index * charWidthBase);
                    const nextFrameX = Math.floor((index + 1) * charWidthBase);
                    const width = nextFrameX - frameX;

                    const img = this.add.image(cursorX, 0, 'goldFont');
                    img.setOrigin(0);
                    img.setCrop(frameX, 0, width, 12);
                    container.add(img);
                    img.setScrollFactor(0);
                    cursorX += width + 1; // 1px gap
                } else {
                    cursorX += 10; // Space
                }
            });
        };

        updateText(text);

        return {
            container,
            setText: updateText
        };
    }
}
