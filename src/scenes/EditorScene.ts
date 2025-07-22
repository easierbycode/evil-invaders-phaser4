import { fetchAtlasOverrides, saveAtlasOverrides, applyAtlasOverrides } from '../utils/helper-applyAtlasOverrides';
import {
    fetchAllCharacters,
    fetchCharacter,
    fetchAtlas,
    fetchAllSprites,
    saveCharacter,
    saveAtlas,
    validateCharacterFrames,
    createAtlasJson,
    createAtlasPng,
    CharacterData,
    AtlasData,
    SpriteData
} from '../utils/firebase-character-utils';
import PROPERTIES from "https://codepen.io/CodeMonkeyGames/pen/rNERbzw.js";

export class EditorScene extends Phaser.Scene {
    private editorDiv!: HTMLDivElement;
    private overrides: Record<string, string> = {};

    private selectedCharacter: CharacterData | null = null;
    private selectedCharacterId: string = '';
    private selectedTarget: 'playerData' | 'enemyData' = 'playerData';
    private selectedEnemyKey: string = '';
    private currentStep: 'character' | 'target' | 'atlas' | 'frames' = 'character';

    constructor() { super('editor-scene'); }

    async create() {
        // Pull any previously saved overrides from Firebase to pre-populate previews
        this.overrides = await fetchAtlasOverrides();

        // Start multi-step character editor
        this.buildCharacterSelectionUI();

        // Clean up DOM when scene shuts down.
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.editorDiv) document.body.removeChild(this.editorDiv);
        });
    }

    /** Step 1: Character Selection UI */
    private async buildCharacterSelectionUI() {
        this.currentStep = 'character';
        this.clearUI();

        const characters = await fetchAllCharacters();

        this.editorDiv = document.createElement('div');
        Object.assign(this.editorDiv.style, {
            position: 'absolute', top: '0', left: '0',
            width: '100%', height: '100%', overflow: 'auto',
            background: 'rgba(0,0,0,0.9)', color: '#fff', zIndex: '9999',
            fontFamily: 'sans-serif', padding: '20px'
        });

        const h1 = document.createElement('h2');
        h1.textContent = 'Step 1: Select Character';
        this.editorDiv.appendChild(h1);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Close';
        closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; padding: 5px 10px;';
        closeBtn.onclick = () => {
            this.scene.stop();
            this.scene.resume('game-scene');
        };
        this.editorDiv.appendChild(closeBtn);

        const grid = document.createElement('div');
        Object.assign(grid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px',
            marginTop: '20px'
        });

        Object.entries(characters).forEach(([id, character]) => {
            const card = document.createElement('div');
            card.style.cssText = `
                border: 2px solid #444;
                padding: 15px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            card.onmouseover = () => card.style.borderColor = '#0af';
            card.onmouseout = () => card.style.borderColor = '#444';

            const name = document.createElement('h3');
            name.textContent = character.name;
            name.style.margin = '0 0 10px 0';

            const info = document.createElement('div');
            info.style.fontSize = '12px';
            const typeDisplay = character.maxHp !== undefined ? 'Player' : 'Enemy';
            const hpDisplay = character.maxHp || character.hp || 'N/A';

            info.innerHTML = `
    <div>Type: ${typeDisplay}</div>
    <div>Texture Key: ${character.textureKey}</div>
    <div>Frames: ${character.texture.length}</div>
    <div>HP: ${hpDisplay}</div>
`;

            card.appendChild(name);
            card.appendChild(info);
            card.onclick = () => {
                this.selectedCharacter = character;
                this.selectedCharacterId = id;
                this.buildTargetSelectionUI();
            };

            grid.appendChild(card);
        });

        this.editorDiv.appendChild(grid);
        document.body.appendChild(this.editorDiv);
    }

    /** Step 2: Target Selection UI */
    private buildTargetSelectionUI() {
        this.currentStep = 'target';
        this.clearUI();

        const container = this.createContainer('Step 2: Select Target');

        const info = document.createElement('div');
        info.style.cssText = 'background: #222; padding: 15px; margin: 20px 0; border-radius: 5px;';
        info.innerHTML = `
            <strong>Selected Character:</strong> ${this.selectedCharacter!.name}<br>
            <strong>Texture Key:</strong> ${this.selectedCharacter!.textureKey}
        `;
        container.appendChild(info);

        const optionsDiv = document.createElement('div');
        optionsDiv.style.cssText = 'display: flex; gap: 20px; flex-wrap: wrap;';

        const playerBtn = this.createButton('Set as Player', () => {
            this.selectedTarget = 'playerData';
            this.checkAndProceedToAtlas();
        });
        playerBtn.style.cssText += 'padding: 20px 40px; font-size: 18px;';

        const enemyDiv = document.createElement('div');
        const enemyLabel = document.createElement('h3');
        enemyLabel.textContent = 'Or set as Enemy:';
        enemyDiv.appendChild(enemyLabel);

        const enemyKeys = Object.keys(PROPERTIES.resource.recipe.data.enemyData);
        const enemySelect = document.createElement('select');
        enemySelect.style.cssText = 'padding: 10px; margin: 10px 0; width: 200px;';

        enemyKeys.forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            enemySelect.appendChild(option);
        });

        const enemyBtn = this.createButton('Set as Enemy', () => {
            this.selectedTarget = 'enemyData';
            this.selectedEnemyKey = enemySelect.value;
            this.checkAndProceedToAtlas();
        });

        enemyDiv.appendChild(enemySelect);
        enemyDiv.appendChild(document.createElement('br'));
        enemyDiv.appendChild(enemyBtn);

        optionsDiv.appendChild(playerBtn);
        optionsDiv.appendChild(enemyDiv);

        container.appendChild(optionsDiv);

        const backBtn = this.createButton('← Back', () => this.buildCharacterSelectionUI());
        backBtn.style.cssText += 'margin-top: 20px;';
        container.appendChild(backBtn);
    }

    /** Check atlas and proceed */
    private async checkAndProceedToAtlas() {
        const atlasData = await fetchAtlas(this.selectedCharacter!.textureKey);

        if (atlasData) {
            const atlasJson = JSON.parse(atlasData.json);
            const missingFrames = validateCharacterFrames(this.selectedCharacter!, atlasJson);

            if (missingFrames.length === 0) {
                this.applyCharacterToTarget();
            } else {
                this.buildAtlasCreationUI(missingFrames);
            }
        } else {
            this.buildAtlasCreationUI(this.selectedCharacter!.texture);
        }
    }

    /** Step 3: Atlas Creation UI */
    private async buildAtlasCreationUI(requiredFrames: string[]) {
        this.currentStep = 'atlas';
        this.clearUI();

        const container = this.createContainer('Step 3: Create/Update Atlas');

        const info = document.createElement('div');
        info.style.cssText = 'background: #422; padding: 15px; margin: 20px 0; border-radius: 5px;';
        info.innerHTML = `
            <strong>⚠️ Atlas Issue Detected</strong><br>
            The character's texture key "${this.selectedCharacter!.textureKey}" is missing the following frames:<br>
            ${requiredFrames.join(', ')}<br><br>
            Select sprites below to build/update the atlas.
        `;
        container.appendChild(info);

        const sprites = await fetchAllSprites();
        const selectedSprites: Record<string, string> = {};

        const grid = document.createElement('div');
        Object.assign(grid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '10px',
            marginTop: '20px',
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid #444',
            padding: '10px'
        });

        Object.entries(sprites).forEach(([name, sprite]) => {
            const cell = document.createElement('div');
            cell.style.cssText = `
                border: 1px solid #333;
                padding: 5px;
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
            `;

            const spriteData = typeof sprite === 'string' ? sprite : sprite.png;
            const img = document.createElement('img');
            img.style.cssText = 'max-width: 100%; max-height: 80px;';
            img.src = spriteData.startsWith('data:') ? spriteData : `data:image/png;base64,${spriteData}`;

            const label = document.createElement('div');
            label.textContent = name;
            label.style.cssText = 'font-size: 10px; margin-top: 5px; word-break: break-all;';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = requiredFrames.includes(name);
            checkbox.onchange = () => {
                if (checkbox.checked) {
                    selectedSprites[name] = typeof sprite === 'string' ? sprite : sprite.png;
                    cell.style.borderColor = '#0f0';
                } else {
                    delete selectedSprites[name];
                    cell.style.borderColor = '#333';
                }
            };

            if (requiredFrames.includes(name)) {
                selectedSprites[name] = typeof sprite === 'string' ? sprite : sprite.png;
                cell.style.borderColor = '#0f0';
            }

            cell.appendChild(checkbox);
            cell.appendChild(img);
            cell.appendChild(label);
            grid.appendChild(cell);
        });

        container.appendChild(grid);

        const buildBtn = this.createButton('Build Atlas', async () => {
            if (Object.keys(selectedSprites).length === 0) {
                alert('Please select at least one sprite');
                return;
            }

            const spriteDimensions: Record<string, { width: number; height: number }> = {};
            await Promise.all(
                Object.entries(selectedSprites).map(([name, base64]) => {
                    return new Promise<void>((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            spriteDimensions[name] = { width: img.width, height: img.height };
                            resolve();
                        };
                        img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
                    });
                })
            );

            const atlasJson = createAtlasJson(spriteDimensions);
            const atlasPng = await createAtlasPng(selectedSprites, atlasJson);

            await saveAtlas(this.selectedCharacter!.textureKey, {
                json: JSON.stringify(atlasJson),
                png: atlasPng
            });

            this.buildFrameSelectionUI(Object.keys(selectedSprites));
        });
        buildBtn.style.cssText += 'margin-top: 20px;';

        const backBtn = this.createButton('← Back', () => this.buildTargetSelectionUI());

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';
        btnContainer.appendChild(backBtn);
        btnContainer.appendChild(buildBtn);
        container.appendChild(btnContainer);
    }

    /** Step 4: Frame Selection UI */
    private buildFrameSelectionUI(availableFrames: string[]) {
        this.currentStep = 'frames';
        this.clearUI();

        const container = this.createContainer('Step 4: Select Animation Frames');

        const info = document.createElement('div');
        info.style.cssText = 'background: #224; padding: 15px; margin: 20px 0; border-radius: 5px;';
        info.innerHTML = `
            Select frames for the character's default animation.<br>
            Drag to reorder frames.
        `;
        container.appendChild(info);

        const selectedFrames: string[] = [...this.selectedCharacter!.texture];

        const frameList = document.createElement('div');
        frameList.style.cssText = 'border: 1px solid #444; padding: 10px; margin: 20px 0; min-height: 100px;';

        const updateFrameList = () => {
            frameList.innerHTML = '<strong>Selected Frames (drag to reorder):</strong><br>';
            selectedFrames.forEach((frame, index) => {
                const frameItem = document.createElement('div');
                frameItem.style.cssText = `
                    display: inline-block;
                    padding: 5px 10px;
                    margin: 5px;
                    background: #333;
                    border: 1px solid #666;
                    cursor: move;
                `;
                frameItem.textContent = frame;
                frameItem.draggable = true;
                frameItem.ondragstart = (e) => e.dataTransfer!.setData('index', index.toString());
                frameItem.ondragover = (e) => e.preventDefault();
                frameItem.ondrop = (e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer!.getData('index'));
                    const [removed] = selectedFrames.splice(fromIndex, 1);
                    selectedFrames.splice(index, 0, removed);
                    updateFrameList();
                };
                frameList.appendChild(frameItem);
            });
        };
        updateFrameList();

        container.appendChild(frameList);

        const availableDiv = document.createElement('div');
        availableDiv.innerHTML = '<strong>Available Frames (click to add):</strong>';
        availableDiv.style.marginTop = '20px';

        const frameGrid = document.createElement('div');
        frameGrid.style.cssText = 'display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;';

        availableFrames.forEach(frame => {
            const btn = document.createElement('button');
            btn.textContent = frame;
            btn.style.cssText = 'padding: 5px 10px;';
            btn.onclick = () => {
                if (!selectedFrames.includes(frame)) {
                    selectedFrames.push(frame);
                    updateFrameList();
                }
            };
            frameGrid.appendChild(btn);
        });

        availableDiv.appendChild(frameGrid);
        container.appendChild(availableDiv);

        const saveBtn = this.createButton('Save & Apply', async () => {
            if (selectedFrames.length === 0) {
                alert('Please select at least one frame');
                return;
            }

            this.selectedCharacter!.texture = selectedFrames;
            await saveCharacter(this.selectedCharacterId, this.selectedCharacter!);

            this.applyCharacterToTarget();
        });
        saveBtn.style.cssText += 'margin-top: 20px;';

        const backBtn = this.createButton('← Back', () => this.checkAndProceedToAtlas());

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';
        btnContainer.appendChild(backBtn);
        btnContainer.appendChild(saveBtn);
        container.appendChild(btnContainer);
    }

    /** Apply character to selected target */
    private applyCharacterToTarget() {
        if (this.selectedTarget === 'playerData') {
            PROPERTIES.resource.recipe.data.playerData = this.selectedCharacter;
        } else {
            PROPERTIES.resource.recipe.data.enemyData[this.selectedEnemyKey] = this.selectedCharacter;
        }

        alert('Character successfully applied! Close editor to see changes.');

        this.buildCharacterSelectionUI();
    }

    /** Helper: Clear UI */
    private clearUI() {
        if (this.editorDiv) {
            document.body.removeChild(this.editorDiv);
        }
    }

    /** Helper: Create container with title */
    private createContainer(title: string): HTMLDivElement {
        this.editorDiv = document.createElement('div');
        Object.assign(this.editorDiv.style, {
            position: 'absolute', top: '0', left: '0',
            width: '100%', height: '100%', overflow: 'auto',
            background: 'rgba(0,0,0,0.9)', color: '#fff', zIndex: '9999',
            fontFamily: 'sans-serif', padding: '20px'
        });

        const h1 = document.createElement('h2');
        h1.textContent = title;
        this.editorDiv.appendChild(h1);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Close';
        closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; padding: 5px 10px;';
        closeBtn.onclick = () => {
            this.scene.stop();
            this.scene.resume('game-scene');
        };
        this.editorDiv.appendChild(closeBtn);

        document.body.appendChild(this.editorDiv);
        return this.editorDiv;
    }

    /** Helper: Create button */
    private createButton(text: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = 'padding: 10px 20px; font-size: 14px; cursor: pointer;';
        btn.onclick = onClick;
        return btn;
    }
}