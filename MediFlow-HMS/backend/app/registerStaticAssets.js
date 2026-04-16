import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
const frontendPublicPath = path.resolve(__dirname, '../../frontend/public');

const registerStaticAssets = (app) => {
    app.use(express.static(frontendDistPath));

    app.get('/sw.js', (req, res) => {
        res.sendFile(path.join(frontendPublicPath, 'sw.js'));
    });

    app.get('/manifest.json', (req, res) => {
        res.sendFile(path.join(frontendPublicPath, 'manifest.json'));
    });
};

export { registerStaticAssets };
