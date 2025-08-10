import { getDB, ref, get, set } from '../utils/firebase-config';
import {
    createAtlasJson,
    createAtlasPng,
    AtlasData,
    SpriteData
} from '../utils/firebase-character-utils';

interface AtlasFrame {
    anchor: { x: number; y: number };
    filename: string;
    frame: { x: number; y: number; w: number; h: number };
    rotated: boolean;
    trimmed: boolean;
    spriteSourceSize: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
}

interface AtlasJsonData {
    meta: {
        app: string;
        version: string;
        smartupdate?: string;
    };
    textures: Array<{
        format: string;
        frames: AtlasFrame[] | Record<string, AtlasFrame>;
        image: string;
        scale: number;
        size: { w: number; h: number };
    }>;
    // Legacy format support
    frames?: AtlasFrame[] | Record<string, AtlasFrame>;
}

type CurrentStep = 'select' | 'edit';

interface SpriteDimensions {
    width: number;
    height: number;
}

export class PackerScene extends Phaser.Scene {
    private editorDiv!: HTMLDivElement;
    private selectedAtlasKey: string = '';
    private selectedAtlas: AtlasData | null = null;
    private atlasFrames: Record<string, AtlasFrame> = {};
    private currentStep: CurrentStep = 'select';
    private extractedSprites: Record<string, string> = {};

    constructor() { 
        super('PackerScene'); 
    }

    async create(): Promise<void> {
        this.buildAtlasSelectionUI();

        // Clean up DOM when scene shuts down
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.editorDiv) document.body.removeChild(this.editorDiv);
        });
    }

    /** Step 1: Atlas Selection/Creation UI */
    private async buildAtlasSelectionUI(): Promise<void> {
        this.currentStep = 'select';
        this.clearUI();

        const db = getDB();
        const atlasesSnapshot = await get(ref(db, 'atlases'));
        const atlases: Record<string, AtlasData> = atlasesSnapshot.val() || {};

        this.editorDiv = document.createElement('div');
        Object.assign(this.editorDiv.style, {
            position: 'absolute', 
            top: '0', 
            left: '0',
            width: '100%', 
            height: '100%', 
            overflow: 'auto',
            background: 'rgba(0,0,0,0.9)', 
            color: '#fff', 
            zIndex: '9999',
            fontFamily: 'sans-serif', 
            padding: '20px'
        });

        const h1 = document.createElement('h2');
        h1.textContent = 'Atlas Packer - Select or Create Atlas';
        this.editorDiv.appendChild(h1);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Close';
        closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; padding: 5px 10px;';
        closeBtn.onclick = () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        };
        this.editorDiv.appendChild(closeBtn);

        // Create new atlas section
        const createSection = document.createElement('div');
        createSection.style.cssText = 'background: #222; padding: 20px; margin: 20px 0; border-radius: 5px;';
        
        const createTitle = document.createElement('h3');
        createTitle.textContent = 'Create New Atlas';
        createSection.appendChild(createTitle);

        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = 'display: flex; gap: 10px; align-items: center;';

        const nameInput = document.createElement('input') as HTMLInputElement;
        nameInput.type = 'text';
        nameInput.placeholder = 'Enter atlas name...';
        nameInput.style.cssText = 'padding: 10px; flex: 1;';

        const createBtn = this.createButton('Create', async () => {
            const name = nameInput.value.trim();
            if (!name) {
                alert('Please enter an atlas name');
                return;
            }
            if (atlases[name]) {
                alert('Atlas already exists with this name');
                return;
            }

            // Create empty atlas
            const emptyAtlas: AtlasData = {
                json: {
                    meta: {
                        app: "Atlas Packer",
                        version: "1.0"
                    },
                    textures: [{
                        format: "RGBA8888",
                        frames: [],
                        image: `${name}.png`,
                        scale: 1,
                        size: { w: 1, h: 1 }
                    }]
                },
                png: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            };

            await set(ref(db, `atlases/${name}`), emptyAtlas);
            this.selectedAtlasKey = name;
            this.selectedAtlas = emptyAtlas;
            this.atlasFrames = {};
            this.buildAtlasEditUI();
        });

        inputContainer.appendChild(nameInput);
        inputContainer.appendChild(createBtn);
        createSection.appendChild(inputContainer);
        this.editorDiv.appendChild(createSection);

        // Existing atlases grid
        const existingTitle = document.createElement('h3');
        existingTitle.textContent = 'Existing Atlases';
        existingTitle.style.marginTop = '30px';
        this.editorDiv.appendChild(existingTitle);

        const grid = document.createElement('div');
        Object.assign(grid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '15px',
            marginTop: '20px'
        });

        Object.entries(atlases).forEach(([key, atlas]) => {
            const card = document.createElement('div');
            card.style.cssText = `
                border: 2px solid #444;
                padding: 15px;
                cursor: pointer;
                transition: all 0.2s;
                background: #111;
            `;
            card.onmouseover = () => card.style.borderColor = '#0af';
            card.onmouseout = () => card.style.borderColor = '#444';

            const name = document.createElement('h4');
            name.textContent = key;
            name.style.margin = '0 0 10px 0';

            const atlasData = atlas as AtlasData;
            const jsonData = atlasData.json as AtlasJsonData;
            const framesForCount = jsonData.frames ?? jsonData.textures?.[0]?.frames;
            const frameCount = Array.isArray(framesForCount)
                ? framesForCount.length
                : (framesForCount ? Object.keys(framesForCount).length : 0);

            const info = document.createElement('div');
            info.style.fontSize = '12px';
            info.innerHTML = `
                <div>Frames: ${frameCount}</div>
                <div>Size: ${jsonData.textures?.[0]?.size?.w || 0}x${jsonData.textures?.[0]?.size?.h || 0}</div>
            `;

            // Preview image
            const preview = document.createElement('img') as HTMLImageElement;
            preview.style.cssText = 'max-width: 100%; max-height: 100px; margin-top: 10px;';
            preview.src = atlasData.png.startsWith('data:') ? atlasData.png : `data:image/png;base64,${atlasData.png}`;

            card.appendChild(name);
            card.appendChild(info);
            card.appendChild(preview);
            card.onclick = () => {
                this.selectedAtlasKey = key;
                this.selectedAtlas = atlasData;
                const framesData = (jsonData as any).frames ?? jsonData.textures?.[0]?.frames;
                const framesArray: AtlasFrame[] = Array.isArray(framesData)
                    ? framesData
                    : (framesData
                        ? Object.entries(framesData as Record<string, AtlasFrame>)
                            .map(([fname, f]) => ({ ...f, filename: f.filename ?? fname }))
                        : []);
                this.atlasFrames = framesArray.reduce((acc, f) => {
                    acc[f.filename] = f;
                    return acc;
                }, {} as Record<string, AtlasFrame>);
                this.buildAtlasEditUI();
            };

            grid.appendChild(card);
        });

        this.editorDiv.appendChild(grid);
        document.body.appendChild(this.editorDiv);
    }

    /** Step 2: Atlas Edit UI */
    private async buildAtlasEditUI(): Promise<void> {
        this.currentStep = 'edit';
        this.clearUI();

        const container = this.createContainer(`Edit Atlas: ${this.selectedAtlasKey}`);

        // Current sprites in atlas
        const currentSection = document.createElement('div');
        currentSection.style.cssText = 'background: #222; padding: 20px; margin: 20px 0; border-radius: 5px;';
        
        const currentTitle = document.createElement('h3');
        currentTitle.textContent = 'Current Sprites in Atlas';
        currentSection.appendChild(currentTitle);

        const currentGrid = document.createElement('div');
        Object.assign(currentGrid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '10px',
            marginTop: '15px',
            maxHeight: '300px',
            overflowY: 'auto'
        });

        if (!this.selectedAtlas) {
            throw new Error('No atlas selected');
        }

        const atlasData = this.selectedAtlas!.json as AtlasJsonData;
        this.extractedSprites = {};
        const jsonData = typeof atlasData === 'string' ? JSON.parse(atlasData) : atlasData;
        const framesData = (jsonData as any).frames ?? jsonData.textures?.[0]?.frames;
        const frames: AtlasFrame[] = Array.isArray(framesData)
            ? framesData
            : (framesData
                ? Object.entries(framesData as Record<string, AtlasFrame>)
                    .map(([fname, f]) => ({ ...f, filename: f.filename ?? fname }))
                : []);
        const spritesToKeep: Set<string> = new Set(frames.map(f => f.filename));

        frames.forEach((frameData: AtlasFrame) => {
            const frameName = frameData.filename;
            const cell = document.createElement('div');
            cell.style.cssText = `
                border: 2px solid #444;
                padding: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
            `;

            // Extract sprite from atlas
            const canvas = document.createElement('canvas') as HTMLCanvasElement;
            canvas.width = frameData.frame.w;
            canvas.height = frameData.frame.h;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            
            const atlasImg = new Image();
            atlasImg.onload = () => {
                ctx.drawImage(
                    atlasImg,
                    frameData.frame.x, frameData.frame.y,
                    frameData.frame.w, frameData.frame.h,
                    0, 0,
                    frameData.frame.w, frameData.frame.h
                );
                
                const spriteDataUrl = canvas.toDataURL();
                this.extractedSprites[frameName] = spriteDataUrl;
                
                const spriteImg = document.createElement('img') as HTMLImageElement;
                spriteImg.style.cssText = 'max-width: 100%; max-height: 80px;';
                spriteImg.src = spriteDataUrl;
                cell.insertBefore(spriteImg, cell.firstChild);
            };
            atlasImg.src = this.selectedAtlas.png.startsWith('data:')
                ? this.selectedAtlas.png
                : `data:image/png;base64,${this.selectedAtlas.png}`;

            const label = document.createElement('div');
            label.textContent = frameName.replace('.png', '');
            label.style.cssText = 'font-size: 10px; margin-top: 5px; word-break: break-all;';

            const removeBtn = document.createElement('button') as HTMLButtonElement;
            removeBtn.textContent = '✕';
            removeBtn.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: #f44;
                border: none;
                color: white;
                padding: 2px 6px;
                cursor: pointer;
                border-radius: 3px;
            `;
            removeBtn.onclick = () => {
                spritesToKeep.delete(frameName);
                cell.style.opacity = '0.3';
                cell.style.borderColor = '#f44';
                removeBtn.disabled = true;
            };

            cell.appendChild(label);
            cell.appendChild(removeBtn);
            currentGrid.appendChild(cell);
        });

        currentSection.appendChild(currentGrid);
        container.appendChild(currentSection);

        // Available sprites to add
        const availableSection = document.createElement('div');
        availableSection.style.cssText = 'background: #222; padding: 20px; margin: 20px 0; border-radius: 5px;';
        
        const availableTitle = document.createElement('h3');
        availableTitle.textContent = 'Available Sprites to Add';
        availableSection.appendChild(availableTitle);

        const db = getDB();
        const spritesSnapshot = await get(ref(db, 'sprites'));
        const sprites: Record<string, SpriteData | string> = spritesSnapshot.val() || {};
        const spritesToAdd: Record<string, string> = {};

        const availableGrid = document.createElement('div');
        Object.assign(availableGrid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '10px',
            marginTop: '15px',
            maxHeight: '300px',
            overflowY: 'auto'
        });

        Object.entries(sprites).forEach(([name, sprite]) => {
            // Skip if already in atlas
            if (frames.some(f => f.filename === `${name}.png` || f.filename === name)) return;

            const cell = document.createElement('div');
            cell.style.cssText = `
                border: 2px solid #444;
                padding: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
            `;

            const spriteData: string = typeof sprite === 'string' ? sprite : (sprite as SpriteData).png;
            const img = document.createElement('img') as HTMLImageElement;
            img.style.cssText = 'max-width: 100%; max-height: 80px;';
            img.src = spriteData.startsWith('data:') ? spriteData : `data:image/png;base64,${spriteData}`;

            const label = document.createElement('div');
            label.textContent = name;
            label.style.cssText = 'font-size: 10px; margin-top: 5px; word-break: break-all;';

            const checkbox = document.createElement('input') as HTMLInputElement;
            checkbox.type = 'checkbox';
            checkbox.style.marginTop = '5px';
            checkbox.onchange = () => {
                if (checkbox.checked) {
                    spritesToAdd[`${name}.png`] = spriteData;
                    cell.style.borderColor = '#0f0';
                } else {
                    delete spritesToAdd[`${name}.png`];
                    cell.style.borderColor = '#444';
                }
            };

            cell.appendChild(img);
            cell.appendChild(label);
            cell.appendChild(checkbox);
            availableGrid.appendChild(cell);
        });

        availableSection.appendChild(availableGrid);
        container.appendChild(availableSection);

        // Action buttons
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';

        const backBtn = this.createButton('← Back', () => this.buildAtlasSelectionUI());
        
        const saveBtn = this.createButton('Save Atlas', async () => {
            // Get sprites we're keeping from the extracted data
            const existingSprites: Record<string, string> = {};
            
            for (const frameName of spritesToKeep) {
                if (this.extractedSprites[frameName]) {
                    existingSprites[frameName] = this.extractedSprites[frameName];
                }
            }

            // Combine with new sprites
            const allSprites: Record<string, string> = { ...existingSprites, ...spritesToAdd };

            if (Object.keys(allSprites).length === 0) {
                alert('Atlas must contain at least one sprite');
                return;
            }

            // Get sprite dimensions
            const spriteDimensions: Record<string, SpriteDimensions> = {};
            await Promise.all(
                Object.entries(allSprites).map(([name, base64]) => {
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

            // Create new atlas
            const newAtlasJson = createAtlasJson(spriteDimensions) as AtlasJsonData;
            const newAtlasPng = await createAtlasPng(allSprites, newAtlasJson);

            /* ---------- NEW BLOCK: Ensure image/format/size/scale are under textures[0] ---------- */
            if (newAtlasJson) {
                // Make sure textures array exists
                if (!Array.isArray(newAtlasJson.textures) || newAtlasJson.textures.length === 0) {
                    newAtlasJson.textures = [{
                        image: `${this.selectedAtlasKey}.png`,
                        format: 'RGBA8888',
                        size: { w: 0, h: 0 },
                        scale: 1,
                        frames: []
                    }];
                }

                const tex0: any = newAtlasJson.textures[0];

                // Keys we may need to relocate
                const relocateKeys: Array<keyof any> = ['image', 'format', 'size', 'scale', 'frames'];
                relocateKeys.forEach(key => {
                    if ((newAtlasJson as any)[key] !== undefined) {
                        tex0[key] = (newAtlasJson as any)[key];
                        delete (newAtlasJson as any)[key];
                    }
                    if (newAtlasJson.meta && (newAtlasJson.meta as any)[key] !== undefined) {
                        tex0[key] = (newAtlasJson.meta as any)[key];
                        delete (newAtlasJson.meta as any)[key];
                    }
                });

                // Guarantee defaults
                tex0.image = tex0.image ?? `${this.selectedAtlasKey}.png`;
                tex0.format = tex0.format ?? 'RGBA8888';
                tex0.scale = tex0.scale ?? 1;
                if (!tex0.size) {
                    tex0.size = { w: 0, h: 0 };
                }
                if (!tex0.frames) {
                    tex0.frames = [];
                }
            }
            /* ---------- END NEW BLOCK ---------- */

            // Helper to turn object frames into array with required fields
            const objectFramesToArray = (obj: Record<string, any> | undefined): AtlasFrame[] => {
                if (!obj) return [];
                return Object.entries(obj).map(([filename, frame]) => ({
                    filename,
                    anchor: frame.anchor ?? { x: 0.5, y: 0.5 },
                    rotated: frame.rotated ?? false,
                    trimmed: frame.trimmed ?? false,
                    sourceSize: frame.sourceSize ?? { w: frame.frame.w, h: frame.frame.h },
                    spriteSourceSize: frame.spriteSourceSize ?? { x: 0, y: 0, w: frame.frame.w, h: frame.frame.h },
                    ...frame
                }));
            };

            // Ensure frames are arrays with filename & anchor to satisfy Firebase rules
            if (newAtlasJson) {
                // Top-level frames
                if (newAtlasJson.frames) {
                    if (Array.isArray(newAtlasJson.frames)) {
                        newAtlasJson.frames = newAtlasJson.frames.map(f => ({
                            ...f,
                            filename: f.filename ?? '',
                            anchor: f.anchor ?? { x: 0.5, y: 0.5 }
                        }));
                    } else {
                        newAtlasJson.frames = objectFramesToArray(newAtlasJson.frames as any);
                    }
                }
                // Texture-level frames
                if (newAtlasJson.textures && newAtlasJson.textures[0]) {
                    const tex = newAtlasJson.textures[0];
                    if (tex.frames) {
                        if (Array.isArray(tex.frames)) {
                            tex.frames = tex.frames.map(f => ({
                                ...f,
                                filename: f.filename ?? '',
                                anchor: f.anchor ?? { x: 0.5, y: 0.5 }
                            }));
                        } else {
                            tex.frames = objectFramesToArray(tex.frames as any);
                        }
                    }
                }
            }

            // Save to Firebase
            await set(ref(db, `atlases/${this.selectedAtlasKey}`), {
                json: newAtlasJson,
                png: newAtlasPng
            });

            alert('Atlas saved successfully!');
            this.buildAtlasSelectionUI();
        });
        saveBtn.style.cssText += 'background: #0a0;';

        btnContainer.appendChild(backBtn);
        btnContainer.appendChild(saveBtn);
        container.appendChild(btnContainer);
    }

    /** Helper: Clear UI */
    private clearUI(): void {
        if (this.editorDiv) {
            document.body.removeChild(this.editorDiv);
        }
    }

    /** Helper: Create container with title */
    private createContainer(title: string): HTMLDivElement {
        this.editorDiv = document.createElement('div');
        Object.assign(this.editorDiv.style, {
            position: 'absolute', 
            top: '0', 
            left: '0',
            width: '100%', 
            height: '100%', 
            overflow: 'auto',
            background: 'rgba(0,0,0,0.9)', 
            color: '#fff', 
            zIndex: '9999',
            fontFamily: 'sans-serif', 
            padding: '20px'
        });

        const h1 = document.createElement('h2');
        h1.textContent = title;
        this.editorDiv.appendChild(h1);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Close';
        closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; padding: 5px 10px;';
        closeBtn.onclick = () => {
            this.scene.stop();
            this.scene.resume('GameScene');
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