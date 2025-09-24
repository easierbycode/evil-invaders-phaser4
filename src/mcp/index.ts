#!/usr/bin/env node

import { defineAssetTools } from "./tools/assets/assets-tools.js";
import { defineSceneTools } from "./tools/scene/scene-tools.js";
import { defineSystemTools } from "./tools/system-tools.js";
import { startServer, ToolsManager } from "./utils.js";

const manager = new ToolsManager();

defineSystemTools();
defineSceneTools(manager);
defineAssetTools(manager);

startServer().catch((error) => {

    console.error("Fatal error in main():", error);

    process.exit(1);
});