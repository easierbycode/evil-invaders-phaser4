import Phaser from 'phaser';
import CONSTANTS from "../constants";
const { GAME_WIDTH, GAME_HEIGHT } = CONSTANTS;
import PROPERTIES from "../properties";
import Sound from '../soundManager';

interface HighScoreEntry {
    name: string;
    score: number;
}

export default class HighScoreScene extends Phaser.Scene {
    private highScores: HighScoreEntry[] = [];
    private currentName: string = "";
    private nameSprites: Phaser.GameObjects.Sprite[] = [];
    private selectorSprite!: Phaser.GameObjects.Sprite;
    private selectedCharIndex: number = 0;
    private allowedChars: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private lastInputTime: number = 0;
    private inputDelay: number = 150;

    constructor() {
        super({ key: 'HighScoreScene' });
    }

    init() {
        // Reset scene state to prevent issues on re-entry
        this.currentName = "";
        this.nameSprites = [];
        this.selectedCharIndex = 0;
        this.lastInputTime = 0;
    }

    create() {
        this.setupFrames();

        this.renderCenteredText(40, 'HIGH SCORES', 1.5);

        this.loadHighScores();
        this.displayHighScores();

        // Name Entry UI
        this.renderCenteredText(280, 'ENTER NAME', 1);

        // Placeholder for name
        const nameXStart = GAME_WIDTH / 2 - 45;
        for (let i = 0; i < 3; i++) {
            const s = this.add.sprite(nameXStart + i * 30, 320, 'goldFont', '0');
            s.setScale(2);
            s.setOrigin(0, 0.5);
            s.setAlpha(0.1);
            this.nameSprites.push(s);
        }

        this.selectorSprite = this.add.sprite(GAME_WIDTH / 2, 380, 'goldFont', '0');
        this.selectorSprite.setScale(2);
        this.selectorSprite.setTint(0xffff00);
        this.updateCharSelector();

        this.renderCenteredText(440, 'DPAD MOVE A SEL B DEL START OK', 0.5);

        this.updateNameDisplay();

        // Keyboard support for testing
        this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') this.moveSelector(-1);
            else if (event.key === 'ArrowRight') this.moveSelector(1);
            else if (event.key === 'Enter') this.selectChar();
            else if (event.key === 'Backspace') this.deleteChar();
        });
    }

    private setupFrames() {
        const texture = this.textures.get('goldFont');
        if (texture.has('0')) return;

        const totalWidth = 525;
        const count = 36;
        for (let i = 0; i < count; i++) {
            const x1 = Math.round(i * totalWidth / count);
            const x2 = Math.round((i + 1) * totalWidth / count);
            texture.add(i.toString(), 0, x1, 0, x2 - x1, 12);
        }
    }

    private renderText(x: number, y: number, text: string, scale: number = 1, tint?: number) {
        let currentX = x;
        for (let i = 0; i < text.length; i++) {
            const char = text[i].toUpperCase();
            if (char === " ") {
                currentX += 8 * scale;
                continue;
            }
            const index = this.allowedChars.indexOf(char);
            if (index >= 0) {
                const s = this.add.sprite(currentX, y, 'goldFont', index.toString());
                s.setScale(scale);
                s.setOrigin(0, 0.5);
                if (tint !== undefined) s.setTint(tint);

                const frame = s.frame;
                currentX += frame.width * scale + (1 * scale);
            }
        }
    }

    private getTextWidth(text: string, scale: number = 1) {
        let width = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text[i].toUpperCase();
            if (char === " ") {
                width += 8 * scale;
                continue;
            }
            const index = this.allowedChars.indexOf(char);
            if (index >= 0) {
                const frame = this.textures.getFrame('goldFont', index.toString());
                width += frame.width * scale + (1 * scale);
            }
        }
        return width;
    }

    private renderCenteredText(y: number, text: string, scale: number = 1, tint?: number) {
        const totalWidth = this.getTextWidth(text, scale);
        this.renderText((GAME_WIDTH - totalWidth) / 2, y, text, scale, tint);
    }

    private loadHighScores() {
        const savedScores = localStorage.getItem('highScores');
        if (savedScores) {
            this.highScores = JSON.parse(savedScores);
        } else {
            this.highScores = [
                { name: 'AAA', score: 10000 },
                { name: 'BBB', score: 8000 },
                { name: 'CCC', score: 6000 },
                { name: 'DDD', score: 4000 },
                { name: 'EEE', score: 2000 }
            ];
        }
    }

    private saveHighScores() {
        localStorage.setItem('highScores', JSON.stringify(this.highScores));
    }

    private displayHighScores() {
        this.highScores.slice(0, 5).forEach((entry, index) => {
            const y = 80 + index * 35;
            this.renderText(30, y, `${index + 1} ${entry.name}`, 1);
            this.renderText(150, y, `${entry.score}`, 1);
        });
    }

    private updateNameDisplay() {
        for (let i = 0; i < 3; i++) {
            if (i < this.currentName.length) {
                const char = this.currentName[i];
                const index = this.allowedChars.indexOf(char);
                this.nameSprites[i].setFrame(index.toString());
                this.nameSprites[i].setAlpha(1);
            } else {
                this.nameSprites[i].setFrame('0');
                this.nameSprites[i].setAlpha(0.1);
            }
        }
    }

    private updateCharSelector() {
        this.selectorSprite.setFrame(this.selectedCharIndex.toString());
    }

    private moveSelector(dir: number) {
        this.selectedCharIndex += dir;
        if (this.selectedCharIndex < 0) this.selectedCharIndex = this.allowedChars.length - 1;
        if (this.selectedCharIndex >= this.allowedChars.length) this.selectedCharIndex = 0;
        this.updateCharSelector();
        Sound.play('se_cursor');
    }

    private selectChar() {
        if (this.currentName.length < 3) {
            this.currentName += this.allowedChars[this.selectedCharIndex];
            this.updateNameDisplay();
            Sound.play('se_decision');
        }
    }

    private deleteChar() {
        if (this.currentName.length > 0) {
            this.currentName = this.currentName.slice(0, -1);
            this.updateNameDisplay();
            Sound.play('se_cursor_sub');
        }
    }

    private completeEntry() {
        if (this.currentName.length === 3) {
            if (PROPERTIES.score > 0) {
                this.highScores.push({ name: this.currentName, score: PROPERTIES.score });
                this.highScores.sort((a, b) => b.score - a.score);
                this.highScores = this.highScores.slice(0, 10);
                this.saveHighScores();
                PROPERTIES.score = 0;
            }
            Sound.play('se_correct');
            this.scene.start('TitleScene');
        } else if (this.currentName.length === 0) {
            this.scene.start('TitleScene');
        }
    }

    update(time: number) {
        const gamepads = this.input.gamepad.gamepads;
        const gamepad = gamepads.find(gp => gp && gp.connected);

        if (gamepad) {
            if (time > this.lastInputTime + this.inputDelay) {
                if (gamepad.buttons[14].pressed) { // Left
                    this.moveSelector(-1);
                    this.lastInputTime = time;
                }
                else if (gamepad.buttons[15].pressed) { // Right
                    this.moveSelector(1);
                    this.lastInputTime = time;
                }
                else if (gamepad.buttons[12].pressed) { // Up
                    this.moveSelector(-1);
                    this.lastInputTime = time;
                }
                else if (gamepad.buttons[13].pressed) { // Down
                    this.moveSelector(1);
                    this.lastInputTime = time;
                }
                else if (gamepad.buttons[0].pressed) { // A
                    this.selectChar();
                    this.lastInputTime = time;
                }
                else if (gamepad.buttons[1].pressed) { // B
                    this.deleteChar();
                    this.lastInputTime = time;
                }
                else if (gamepad.buttons[9].pressed) { // Start
                    this.completeEntry();
                    this.lastInputTime = time;
                }
            }
        }
    }
}
