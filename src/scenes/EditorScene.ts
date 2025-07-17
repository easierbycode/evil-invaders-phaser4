import { fetchAtlasOverrides, saveAtlasOverrides, applyAtlasOverrides } from '../utils/helper-applyAtlasOverrides';

export class EditorScene extends Phaser.Scene {
    private editorDiv!: HTMLDivElement;
    private overrides: Record<string, string> = {};

    constructor() { super('editor-scene'); }

    async create() {
        // Pull any previously saved overrides from Firebase to pre-populate previews
        this.overrides = await fetchAtlasOverrides();

        // Build the overlay DOM.
        this.buildDomUI();

        // Clean up DOM when scene shuts down.
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.editorDiv) document.body.removeChild(this.editorDiv);
        });
    }

    /** Create the HTML overlay listing every frame with Replace/SAVE/PLAY. */
    private buildDomUI() {
        const atlas = this.textures.get('game_asset');
        const frames = atlas.getFrameNames()
            .filter(name => name !== '__BASE')   // ignore the atlas base frame, optional
            .sort((a, b) => a.localeCompare(b)); // ← alphabetize ▲          // all names
        this.editorDiv = document.createElement('div');
        Object.assign(this.editorDiv.style, {
            position: 'absolute', top: '0', left: '0',
            width: '100%', height: '100%', overflow: 'auto',
            background: 'rgba(0,0,0,0.85)', color: '#fff', zIndex: '9999',
            fontFamily: 'sans-serif', padding: '8px'
        });

        // Header & control buttons
        const h1 = document.createElement('h2');
        h1.textContent = 'Atlas Editor – click Replace to swap a frame';
        this.editorDiv.appendChild(h1);

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.style.marginRight = '12px';
        saveBtn.onclick = async () => {
            await saveAtlasOverrides(this.overrides);
            alert('Overrides saved to Firebase.');
        };

        const playBtn = document.createElement('button');
        playBtn.textContent = 'Play';
        playBtn.onclick = async () => {
            // Apply overrides before resuming game
            await applyAtlasOverrides(this.scene.get('game-scene'));
            // Close editor and resume game
            this.scene.stop();
            this.scene.resume('game-scene');
        };

        this.editorDiv.appendChild(saveBtn);
        this.editorDiv.appendChild(playBtn);

        // Grid of frames
        const grid = document.createElement('div');
        Object.assign(grid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: '8px',
            marginTop: '12px'
        });
        this.editorDiv.appendChild(grid);

        frames.forEach(frameName => {
            const cell = document.createElement('div');
            cell.style.border = '1px solid #444';
            cell.style.padding = '4px';
            cell.style.textAlign = 'center';

            // Current image preview (override if one exists)
            const img = document.createElement('img');
            img.style.maxWidth = '96px';
            img.style.maxHeight = '96px';
            img.alt = frameName;
            // ▼ FIX: pull the preview from TextureManager, not the Texture object
            img.src = this.overrides[frameName] ||
                this.textures.getBase64('game_asset', frameName);

            // Hidden file input + visible Replace button
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';

            const replaceBtn = document.createElement('button');
            replaceBtn.textContent = 'Replace';
            replaceBtn.style.marginTop = '4px';

            replaceBtn.onclick = () => fileInput.click();

            fileInput.onchange = e => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    const dataURL = ev.target?.result as string;
                    img.src = dataURL;                 // live preview
                    this.overrides[frameName] = dataURL;
                };
                reader.readAsDataURL(file);
            };

            const label = document.createElement('div');
            label.textContent = frameName;
            label.style.fontSize = '11px';
            label.style.wordBreak = 'break-all';
            label.style.marginTop = '4px';

            cell.appendChild(img);
            cell.appendChild(replaceBtn);
            cell.appendChild(fileInput);
            cell.appendChild(label);
            grid.appendChild(cell);
        });

        document.body.appendChild(this.editorDiv);
    }
}