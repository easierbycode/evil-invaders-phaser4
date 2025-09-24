import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import { mcpServer } from "../utils.js";

export function defineSystemTools() {

    mcpServer.tool("get-system-instructions", "Get the system instructions. This is fully required for the LLM to know how to build the arguments of this MCP server tools. Tools like `scene-add-game-objects`, `scene-update-game-objects`, `scene-add-game-object-filters`, `scene-update-game-object-filters`, `scene-add-plain-objects`, and `scene-update-plain-objects` requires that the LLM get the system instructions first to know the tool arguments structure.", () => {

        const __filename = fileURLToPath(import.meta.url);


        const text1 = readFileSync(
            join(dirname(__filename), "prompts/system.md"), "utf-8");

        const text2 = readFileSync(
            join(dirname(__filename), "prompts/tools.md"), "utf-8");

        return {
            content: [
                { type: "text", text: `${text1}\n${text2}` }
            ],
        }
    });
}
