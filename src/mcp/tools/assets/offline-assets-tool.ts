import { mcpServer } from "../../utils.js";
import { z } from "zod";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * MCP tool: write/update assets/overload-flags.json to toggle OverloadScene's
 * `overwriteLocal` feature flag without touching source code or the URL.
 *
 * OverloadScene reads this file at runtime (after the URL param and scene-data
 * checks) so the flag persists across page reloads until cleared.
 */
export function defineOverloadFlagTool() {

    mcpServer.tool(
        "set-overload-flag",
        "Enable or disable OverloadScene's 'overwriteLocal' feature flag by writing " +
        "assets/overload-flags.json. When the flag is true, OverloadScene will trigger " +
        "browser downloads of every RTDB atlas it loads, saving them as local PNG + JSON files. " +
        "The flag is read after the URL param (?overwriteLocal=1) and scene-data sources, " +
        "so it acts as a persistent default that survives page reloads.",
        {
            overwriteLocal: z.boolean()
                .describe(
                    "true  → OverloadScene downloads RTDB atlas data as local files.\n" +
                    "false → OverloadScene loads into memory only (default behaviour)."
                ),
        },
        async ({ overwriteLocal }) => {
            const flagsPath = join(process.cwd(), "assets", "overload-flags.json");

            let flags: Record<string, unknown> = {};
            if (existsSync(flagsPath)) {
                try { flags = JSON.parse(readFileSync(flagsPath, "utf-8")); } catch { /* start fresh */ }
            }

            flags.overwriteLocal = overwriteLocal;
            writeFileSync(flagsPath, JSON.stringify(flags, null, 2), "utf-8");

            return { content: [{ type: "text", text:
                `Set overwriteLocal = ${overwriteLocal} → ${flagsPath}`
            }] };
        }
    );
}

const FIREBASE_DB_URL = "https://evil-invaders-default-rtdb.firebaseio.com";

/**
 * Read, add the atlas entry if missing, and rewrite an asset-pack.json.
 * Returns a human-readable status string, or null if the file was not found.
 */
function patchAssetPack(packPath: string, atlasName: string): string | null {
    if (!existsSync(packPath)) return null;

    let pack: Record<string, unknown>;
    try {
        pack = JSON.parse(readFileSync(packPath, "utf-8")) as Record<string, unknown>;
    } catch {
        return `  WARN: could not parse ${packPath}`;
    }

    // Find the first section (not "meta") that owns a files array
    const sectionKey = Object.keys(pack).find(
        k => k !== "meta" && Array.isArray((pack[k] as any)?.files)
    );
    if (!sectionKey) return `  WARN: no section with files[] found in ${packPath}`;

    const files = ((pack[sectionKey] as any).files as any[]);

    // Skip if already present
    if (files.some((f: any) => f.key === atlasName || f.textureURL === `${atlasName}.png`)) {
        return `  asset-pack.json already has '${atlasName}' (${packPath})`;
    }

    files.push({
        type: "atlas",
        key: atlasName,
        textureURL: `${atlasName}.png`,
        atlasURL: `${atlasName}.json`,
    });

    writeFileSync(packPath, JSON.stringify(pack, null, 4), "utf-8");
    return `  Patched asset-pack.json ← '${atlasName}' (${packPath})`;
}

/**
 * MCP tool: fetch an atlas (JSON + PNG) from Firebase RTDB and write local files.
 * Registered directly on mcpServer — runs entirely in Node.js, no Phaser Editor bridge.
 *
 * Platform → default outputDir mapping:
 *   web     → assets/            (Vite source; copied to dist/assets/ on build)
 *   cordova → cordova/www/assets/ (Cordova Android/iOS www output directory)
 *   pc      → assets/            (Vite source; used by Deno-compiled Mac/Windows binary)
 *
 * After writing the PNG + JSON the tool also patches assets/asset-pack.json
 * (and cordova/www/assets/asset-pack.json for the cordova platform) so that
 * Phaser's asset-pack loader registers the new atlas automatically.
 */
export function defineOfflineAssetsTools() {

    mcpServer.tool(
        "offline-atlas",
        "Fetch a game atlas (JSON + PNG) from Firebase RTDB and write it as local asset files " +
        "under the requested atlas name. Reads from atlases/{atlasName} by default, or from " +
        "{game}/atlases/{atlasName} when a game namespace is supplied. " +
        "Automatically patches assets/asset-pack.json (and cordova/www/assets/asset-pack.json " +
        "for the cordova platform) so the atlas is loadable without Firebase.",
        {
            atlasName: z.string()
                .describe("Atlas key in Firebase RTDB (e.g. 'game_asset', 'game_ui')."),

            game: z.string().optional()
                .describe(
                    "Optional game namespace used as a RTDB path prefix, e.g. 'evil-invaders'. " +
                    "When omitted the tool reads directly from atlases/{atlasName}."
                ),

            platform: z.enum(["web", "cordova", "pc"]).optional()
                .describe(
                    "Target platform — controls the default output directory:\n" +
                    "  web     → assets/             (source; Vite copies to dist/assets/)\n" +
                    "  cordova → cordova/www/assets/  (Cordova Android/iOS www directory)\n" +
                    "  pc      → assets/             (source; Deno-compiled Mac/Windows binary)\n" +
                    "Defaults to 'web'."
                ),

            outputDir: z.string().optional()
                .describe(
                    "Override the output directory relative to the project root. " +
                    "When omitted it is derived from 'platform'."
                ),
        },

        async ({ atlasName, game, platform, outputDir }) => {

            // --- resolve output directory ---
            const resolvedPlatform = platform ?? "web";
            const defaultDir =
                resolvedPlatform === "cordova" ? "cordova/www/assets" : "assets";
            const outDir   = outputDir ?? defaultDir;
            const resolved = join(process.cwd(), outDir);

            // --- Firebase REST path ---
            const dbPath = game
                ? `${game}/atlases/${encodeURIComponent(atlasName)}`
                : `atlases/${encodeURIComponent(atlasName)}`;
            const url = `${FIREBASE_DB_URL}/${dbPath}.json`;

            // --- fetch from Firebase RTDB ---
            let atlasData: { json: unknown; png: string } | null = null;
            try {
                const res = await fetch(url);
                if (!res.ok) {
                    return { content: [{ type: "text", text:
                        `Firebase returned ${res.status} ${res.statusText} for path '${dbPath}'`
                    }] };
                }
                atlasData = await res.json() as { json: unknown; png: string } | null;
            } catch (err) {
                return { content: [{ type: "text", text:
                    `Network error fetching '${dbPath}': ${(err as Error).message}`
                }] };
            }

            if (!atlasData) {
                return { content: [{ type: "text", text:
                    `No data found at Firebase path: ${dbPath}`
                }] };
            }

            // --- write PNG + JSON ---
            const lines: string[] = [
                `Offline'd atlas '${atlasName}' [platform: ${resolvedPlatform}] from Firebase (${dbPath}):`,
            ];

            try {
                mkdirSync(resolved, { recursive: true });

                const jsonPath = join(resolved, `${atlasName}.json`);
                writeFileSync(jsonPath, JSON.stringify(atlasData.json, null, 2), "utf-8");
                lines.push(`  JSON → ${jsonPath}`);

                const pngPath = join(resolved, `${atlasName}.png`);
                let pngBase64 = atlasData.png ?? "";
                if (pngBase64.startsWith("data:")) {
                    pngBase64 = pngBase64.split(",")[1] ?? "";
                }
                const pngBuf = Buffer.from(pngBase64, "base64");
                writeFileSync(pngPath, pngBuf);
                lines.push(`  PNG  → ${pngPath} (${pngBuf.byteLength.toLocaleString()} bytes)`);

            } catch (err) {
                return { content: [{ type: "text", text:
                    `Failed to write files: ${(err as Error).message}`
                }] };
            }

            // --- patch asset-pack.json ---
            // Source asset-pack is always patched so subsequent builds include the atlas.
            const sourcePack = join(process.cwd(), "assets", "asset-pack.json");
            const sourceResult = patchAssetPack(sourcePack, atlasName);
            if (sourceResult) lines.push(sourceResult);

            // For Cordova, also patch the already-built www copy if present.
            if (resolvedPlatform === "cordova") {
                const cordovaPack = join(process.cwd(), "cordova", "www", "assets", "asset-pack.json");
                const cordovaResult = patchAssetPack(cordovaPack, atlasName);
                if (cordovaResult) lines.push(cordovaResult);
            }

            return { content: [{ type: "text", text: lines.join("\n") }] };
        }
    );
}
