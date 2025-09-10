const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

const HGT_DIR = path.join(__dirname, 'hgt_files');
const STL_DIR = path.join(__dirname, 'stl_files');

if (!fs.existsSync(HGT_DIR)) fs.mkdirSync(HGT_DIR, { recursive: true });
if (!fs.existsSync(STL_DIR)) fs.mkdirSync(STL_DIR, { recursive: true });

const CELEVS = path.join(__dirname, 'celevstl');

app.post('/generate', async (req, res) => {
    try {
        // northwest corner lat, northwest corner lng
        let { lat, lng, width, height, verticalScale } = req.body;
        if (!lat || !lng || !width || !height || !verticalScale) {
            return res.status(400).send("Missing required parameters");
        }

        const outputSTL = path.resolve(STL_DIR, `terrain_${Date.now()}.stl`);

        // Run celevstl using the HGT tile
        const cmd = `${CELEVS} ${lat} ${lng} ${width} ${height} ${verticalScale} 0 1 3 1 ${outputSTL}`;

        await new Promise((resolve, reject) => {
            exec(cmd, (err, stdout, stderr) => {
                if (err) return reject(`celevstl failed: ${stderr}`);
                console.log(stdout);
                resolve();
            });
        });

        // Return STL file
        res.download(outputSTL, err => {
            if (!err) fs.unlinkSync(outputSTL);
        });

    } catch (err) {
        console.error("Error in /generate:", err);
        res.status(500).send(err.toString());
    }
});

app.listen(PORT, () => console.log(`Terrain service running on port: ${PORT}`));
