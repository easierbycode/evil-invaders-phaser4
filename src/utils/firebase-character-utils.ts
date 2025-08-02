import { getDB, ref, get, set } from './firebase-config';

export interface CharacterData {
    name: string;
    textureKey: string;
    texture: string[];
    size?: { x: number; y: number };
    anchor?: { x: number; y: number };
    body?: { x: number; y: number };
    
    // Properties from enemy data
    hp?: number;
    cagage?: number;
    interval?: number;
    score?: number;
    shadowOffsetY?: number;
    shadowReverse?: boolean;
    speed?: number;
    
    // Properties from player data
    barrier?: any;
    caDamage?: number;
    defaultShootName?: string;
    defaultShootSpeed?: string;
    maxHp?: number;
    shoot3way?: any;
    shootBig?: any;
    shootNormal?: any;
}

export interface AtlasData {
    json: object;
    png: string;
}

export interface SpriteData {
    name: string;
    png: string;
}

// Fetch all characters from Firebase
export async function fetchAllCharacters(): Promise<Record<string, CharacterData>> {
    const db = getDB();
    try {
        const snapshot = await get(ref(db, 'characters'));
        return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
        console.error('Error fetching characters:', error);
        return {};
    }
}

// Fetch a specific character
export async function fetchCharacter(characterId: string): Promise<CharacterData | null> {
    const db = getDB();
    try {
        const snapshot = await get(ref(db, `characters/${characterId}`));
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error(`Error fetching character ${characterId}:`, error);
        return null;
    }
}

// Fetch atlas data
export async function fetchAtlas(atlasKey: string): Promise<AtlasData | null> {
    const db = getDB();
    try {
        const snapshot = await get(ref(db, `atlases/${atlasKey}`));
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error(`Error fetching atlas ${atlasKey}:`, error);
        return null;
    }
}

// Fetch all sprites from Firebase
export async function fetchAllSprites(): Promise<Record<string, string | SpriteData>> {
    const db = getDB();
    try {
        const snapshot = await get(ref(db, 'sprites'));
        return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
        console.error('Error fetching sprites:', error);
        return {};
    }
}

// Save character data
export async function saveCharacter(characterId: string, data: CharacterData): Promise<void> {
    const db = getDB();
    try {
        await set(ref(db, `characters/${characterId}`), data);
    } catch (error) {
        console.error(`Error saving character ${characterId}:`, error);
        throw error;
    }
}

// Save atlas data
export async function saveAtlas(atlasKey: string, data: AtlasData): Promise<void> {
    const db = getDB();
    try {
        await set(ref(db, `atlases/${atlasKey}`), data);
    } catch (error) {
        console.error(`Error saving atlas ${atlasKey}:`, error);
        throw error;
    }
}

// Check if all character frames exist in atlas
export function validateCharacterFrames(character: CharacterData, atlasJson: any): string[] {
    const missingFrames: string[] = [];
    const atlasFrames = atlasJson.frames || atlasJson.textures?.[0]?.frames || {};
    
    character.texture.forEach(frameName => {
        if (!atlasFrames[frameName]) {
            missingFrames.push(frameName);
        }
    });
    
    return missingFrames;
}

// Create atlas JSON from selected sprites
export function createAtlasJson(sprites: Record<string, { width: number; height: number }>): any {
    const frames: any = {};
    let currentX = 0;
    let currentY = 0;
    let rowHeight = 0;
    const maxWidth = 2048; // Maximum atlas width
    
    Object.entries(sprites).forEach(([name, dimensions]) => {
        // Move to next row if we exceed max width
        if (currentX + dimensions.width > maxWidth) {
            currentX = 0;
            currentY += rowHeight;
            rowHeight = 0;
        }
        
        frames[name] = {
            frame: { x: currentX, y: currentY, w: dimensions.width, h: dimensions.height },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w: dimensions.width, h: dimensions.height },
            sourceSize: { w: dimensions.width, h: dimensions.height }
        };
        
        currentX += dimensions.width;
        rowHeight = Math.max(rowHeight, dimensions.height);
    });
    
    return {
        frames,
        meta: {
            app: "Evil Invaders Atlas Builder",
            version: "1.0",
            image: "atlas.png",
            format: "RGBA8888",
            size: { w: maxWidth, h: currentY + rowHeight },
            scale: "1"
        }
    };
}

// Create atlas PNG from selected sprites
export async function createAtlasPng(
    sprites: Record<string, string>,
    atlasJson: any
): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = atlasJson.meta.size.w;
    canvas.height = atlasJson.meta.size.h;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each sprite
    const loadPromises = Object.entries(sprites).map(([name, base64]) => {
        return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
                const frame = atlasJson.frames[name];
                if (frame) {
                    ctx.drawImage(img, frame.frame.x, frame.frame.y);
                }
                resolve();
            };
            img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
        });
    });
    
    await Promise.all(loadPromises);
    
    // Convert to base64
    return canvas.toDataURL('image/png').split(',')[1];
}