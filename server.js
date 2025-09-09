const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

const HGT_DIR = path.join(__dirname, 'hgt_files');
const STL_DIR = path.join(__dirname, 'stl_files');

if (!fs.existsSync(HGT_DIR)) fs.mkdirSync(HGT_DIR, { recursive: true });
if (!fs.existsSync(STL_DIR)) fs.mkdirSync(STL_DIR, { recursive: true });

const CELEVS = path.join(__dirname, 'celevstl');

function getSRTMTileName(lat, lng) {
    const latPrefix = lat >= 0 ? 'N' : 'S';
    const lngPrefix = lng >= 0 ? 'E' : 'W';
    const latStr = String(Math.abs(Math.floor(lat))).padStart(2, '0');
    const lngStr = String(Math.abs(Math.floor(lng))).padStart(3, '0');
    return `${latPrefix}${latStr}${lngPrefix}${lngStr}.HGT`;
}

app.post('/generate', async (req, res) => {
    try {
        let { lat, lng, width, height, verticalScale } = req.body;
        if (!lat || !lng || !width || !height || !verticalScale) {
            return res.status(400).send("Missing required parameters");
        }

        // Align to integer tile
        const tileLat = Math.floor(lat);
        const tileLng = Math.floor(lng);
        const tileName = getSRTMTileName(tileLat, tileLng);
        const tilePath = path.join(HGT_DIR, tileName);
        const outputSTL = path.resolve(STL_DIR, `terrain_${Date.now()}.stl`);

        // Fetch and prepare HGT if missing
        if (!fs.existsSync(tilePath)) {
            console.log(`Tile ${tileName} missing, fetching GeoTIFF from OpenTopography...`);

            // Download GeoTIFF
            const url = `https://portal.opentopography.org/API/globaldem?demtype=AW3D30&south=${tileLat}&north=${tileLat+1}&west=${tileLng}&east=${tileLng+1}&outputFormat=GTiff&API_Key=${API_KEY}`;
            const resp = await fetch(url);
            if (!resp.ok) {
                console.error("Failed to fetch DEM:", resp.status, resp.statusText);
                return res.status(500).send("Failed to fetch DEM");
            }

            const buffer = Buffer.from(await resp.arrayBuffer());
            const tifPath = path.join(HGT_DIR, `tmp_${tileLat}_${tileLng}.tif`);
            fs.writeFileSync(tifPath, buffer);

            // Crop/resample to exact 1° 3601x3601 for HGT
            const croppedPath = path.join(HGT_DIR, `tmp_cropped_${tileLat}_${tileLng}.tif`);
            await new Promise((resolve, reject) => {
                exec(
                    `gdalwarp -te ${tileLng} ${tileLat} ${tileLng+1} ${tileLat+1} -ts 3601 3601 "${tifPath}" "${croppedPath}"`,
                    (err) => {
                        fs.unlinkSync(tifPath);
                        if (err) return reject(`gdalwarp failed: ${err}`);
                        resolve();
                    }
                );
            });

            // Convert to HGT with correct filename
            await new Promise((resolve, reject) => {
                exec(
                    `gdal_translate -of SRTMHGT "${croppedPath}" "${tilePath}"`,
                    (err, stdout, stderr) => {
                        fs.unlinkSync(croppedPath);
                        if (err) return reject(`gdal_translate failed: ${stderr}`);
                        resolve();
                    }
                );
            });

            console.log(`Tile saved: ${tilePath}`);
        } else {
            console.log(`Tile already exists: ${tilePath}`);
        }

        // Run celevstl using the HGT tile
        const cmd = `${CELEVS} ${lat} ${lng} ${width} ${height} ${verticalScale} 0 -2 2 1 "${outputSTL}"`;

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
