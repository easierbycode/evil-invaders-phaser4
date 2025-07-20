import express from 'express';
import { glob } from 'glob';
import fs from 'fs';

const app = express();
const port = 3000;

app.get('/mcp', (req, res) => {
    const command = req.query.command;

    if (command === 'ide-get-all-scenes-in-project') {
        const scenes = findScenes();
        res.json(scenes);
    } else {
        res.status(400).send('Unknown command');
    }
});

app.listen(port, () => {
    console.log(`MCP server listening at http://localhost:${port}`);
});

function findScenes() {
    const sceneFiles = glob.sync('src/scenes/**/*.{ts,scene}');
    const sceneKeys = sceneFiles.map(file => {
        if (file.endsWith('.scene')) {
            const sceneData = JSON.parse(fs.readFileSync(file, 'utf-8'));
            return sceneData.sceneKey;
        } else {
            const content = fs.readFileSync(file, 'utf-8');
            const match = content.match(/super\(['"](.*?)['"]\)/);
            if (match) {
                return match[1];
            }
        }
    }).filter(Boolean);

    return sceneKeys;
}
