const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
// const fetch = require('node-fetch');
require('dotenv').config();


const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;


const HGT_DIR = path.join(__dirname, 'hgt_files');
const STL_DIR = path.join(__dirname, 'stl_files');

if (!fs.existsSync(HGT_DIR)) fs.mkdirSync(HGT_DIR);
if (!fs.existsSync(STL_DIR)) fs.mkdirSync(STL_DIR);

const CELEVS = path.join(__dirname, 'celevstl');


app.post('/generate', async (req, res) => {
    const { lat, lng, width, height, verticalScale } = req.body;
    const tileName = `${lat}_${lng}.hgt`;
    const tilePath = path.join(HGT_DIR, tileName);
    const outputSTL = path.join(STL_DIR, `terrain_${Date.now()}.stl`);

    if (!fs.existsSync(tilePath)) {
        console.log(`Tile missing, fetching OpenTopography...`);
        const url = `https://portal.opentopography.org/API/globaldem?demtype=AW3D30&south=${lat-0.05}&north=${lat+0.05}&west=${lng-0.05}&east=${lng+0.05}&outputFormat=GTiff&API_Key=${API_KEY}`;
        let tifUrl;
        try {
            const resp = await fetch(url);
            const json = await resp.json();
            tifUrl = json.result.links[0].url;
        } catch (err) {
            console.error("Failed to fetch DEM:", err);
            return res.status(500).send("Failed to fetch DEM");
        }

        const tifResp = await fetch(tifUrl);
        const buffer = Buffer.from(await tifResp.arrayBuffer());
        const tifPath = path.join(HGT_DIR, 'tmp.tif');
        fs.writeFileSync(tifPath, buffer);

        await new Promise((resolve, reject) => {
            exec(`gdal_translate -of SRTMHGT ${tifPath} ${tilePath}`, (err, stdout, stderr) => {
                fs.unlinkSync(tifPath);
                if (err) return reject(err);
                resolve();
            });
        });
    }

    const cmd = `${CELEVS} ${lat} ${lng} ${width} ${height} ${verticalScale} 0 -2 2 1 ${outputSTL}`;
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.log("celevstl error:", stderr);
            return res.status(500).send(stderr);
        }
        console.log(stdout);
        res.download(outputSTL, err => {
            if (!err) fs.unlinkSync(outputSTL);
        });
    });
});


app.listen(PORT, () => console.log(`Terrain service running on port: ${PORT}`));