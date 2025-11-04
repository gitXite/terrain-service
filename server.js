const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const checkApiKey = require('./src/middleware/apiKey');
const rateLimiter = require('./src/middleware/rateLimiter');


const app = express();
app.use(express.json());

app.use(checkApiKey);
app.use('/generate', rateLimiter);


const PORT = process.env.PORT || 8080;

const HGT_DIR = path.join(__dirname, 'hgt_files');
const STL_DIR = path.join(__dirname, 'stl_files');

if (!fs.existsSync(HGT_DIR)) fs.mkdirSync(HGT_DIR, { recursive: true });
if (!fs.existsSync(STL_DIR)) fs.mkdirSync(STL_DIR, { recursive: true });

const CELEVS = path.join(__dirname, 'celevstl');


app.post('/generate', async (req, res) => {
    try {
        // lat, lng for northwest corner
        let { lat, lng, verticalScale, scale } = req.body;
        if (!lat || !lng || !verticalScale || !scale) {
            return res.status(400).send("Missing required parameters");
        }

        console.log(`[${new Date().toISOString()}] POST /generate hit from ${req.ip}`);

        const outputSTL = path.resolve(STL_DIR, `terrain_${Date.now()}.stl`);

        // Run celevstl using the HGT tile
        // 500 316 0 1 3 1 represents: width, height, rotation angle, water drop, base height, step size
        const cmd = `${CELEVS} ${lat} ${lng} 500 316 ${verticalScale} 0 1 3 1 ${scale} ${outputSTL}`;

        await new Promise((resolve, reject) => {
            exec(cmd, (err, stdout, stderr) => {
                if (err) return reject(`celevstl failed: ${stderr}`);
                console.log(stdout);
                resolve();
            });
        });
        
        // res.download(outputSTL, err => {
        //     if (!err) fs.unlinkSync(outputSTL);
        // });

        // // Read STL file as binary
        const stlBuffer = fs.readFileSync(outputSTL);
        
        // Send binary STL in response
        res.setHeader('Content-Type', 'application/sla');
        res.setHeader('Content-Disposition', `attachment; filename="terrain.stl"`);
        res.send(stlBuffer);
        
        // Remove temp file after sending response
        fs.unlinkSync(outputSTL);

    } catch (err) {
        console.error("Error in microservice at /generate:", err);
        res.status(500).send(err.toString());
    }
});

app.listen(PORT, () => console.log(`Terrain service running on port: ${PORT}\n`));
