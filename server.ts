import express from 'express';
import { glob } from 'glob';
import fs from 'fs';
import http from 'http';

const app = express();
const port = 3000;

const mcpLog = (message: string) => {
    fs.appendFileSync('mcp.log', `[${new Date().toISOString()}] ${message}\n`);
    console.log(message);
}

const sendError = (res: express.Response, message: string, code = 400) => {
    mcpLog(`Error: ${message}`);
    res.status(code).json({ error: message });
}

const sendSuccess = (res: express.Response, data: any) => {
    res.json({ result: data });
}

const findScenes = () => {
    const sceneFiles = glob.sync('src/scenes/**/*.{ts,scene}');
    const sceneKeys = sceneFiles.map(file => {
        if (file.endsWith('.scene')) {
            try {
                const sceneData = JSON.parse(fs.readFileSync(file, 'utf-8'));
                return sceneData.sceneKey;
            } catch (e) {
                mcpLog(`Error parsing ${file}: ${e}`);
                return null;
            }
        } else {
            const content = fs.readFileSync(file, 'utf-8');
            const match = content.match(/super\(['"](.*?)['"]\)/);
            if (match) {
                return match[1];
            }
        }
    }).filter(Boolean) as string[];

    return sceneKeys;
}

const commandHandlers: { [key: string]: (req: express.Request, res: express.Response) => void } = {
    'ide-get-all-scenes-in-project': (req, res) => {
        try {
            const scenes = findScenes();
            sendSuccess(res, scenes);
        } catch (error: any) {
            sendError(res, `Failed to get scenes: ${error.message}`, 500);
        }
    },
    'ide-get-active-scene': (req, res) => {
        // TODO: This is a temporary implementation.
        // It returns the first scene found.
        // A more robust solution would be to track the active scene in the IDE.
        try {
            const scenes = findScenes();
            if (scenes.length > 0) {
                sendSuccess(res, { sceneKey: scenes[0] });
            } else {
                sendError(res, 'No scenes found', 404);
            }
        } catch (error: any) {
            sendError(res, `Failed to get active scene: ${error.message}`, 500);
        }
    }
};

app.get('/mcp', (req, res) => {
    const command = req.query.command as string;
    mcpLog(`Received command: ${command}`);

    if (command && commandHandlers[command]) {
        commandHandlers[command](req, res);
    } else {
        sendError(res, 'Unknown or missing command');
    }
});

const server = http.createServer(app);

server.listen(port, () => {
    mcpLog(`MCP server listening at http://localhost:${port}`);
});

process.on('SIGTERM', () => {
    mcpLog('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        mcpLog('HTTP server closed');
    });
});
