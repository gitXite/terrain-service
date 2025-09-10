# Terrain-Service
A lightweight Node.js microservice that generates 3D terrain models in STL format from DEM data.
Based on Terrain2STL by ThatcherC.

### 🚀 Try It Out

Clone the repository and start the server:

```node start```

It will run at localhost:8080.

⚠️ Note: This service uses .HGT DEM files, which are not included. You'll need to download the appropriate files yourself.
Currently, this version only supports terrain generation in Norway.

### 🔧 Installation

**1.** Install Node.js dependencies:
```npm install```

**2.** Build the STL generator (written in C):
```sh
cd terrain-service
make
```

### 📡 API Usage
Send a ```POST``` request to the ```/generate``` endpoint with the required parameters. 

#### POST ```/generate```
Parameters (sent in body as JSON):

| Parameter    | Description                                 |
| ------------ | ------------------------------------------- |
| `lat`        | Latitude of the **northwest** corner        |
| `lon`        | Longitude of the **northwest** corner       |
| `width`      | Model width in "pixels"                     |
| `height`     | Model height in "pixels"                    |
| `zscale`     | Vertical scaling factor                     |
| `rotation`   | Rotation angle (degrees)                    |
| `waterdrop`  | Amount to lower sea level (in mm)           |
| `baseheight` | Additional base thickness for model (in mm) |
| `step`       | Step size (HGT cells per model pixel)       |
| `outfile`    | Output STL file name                        |


The STL file will be generated and sent back as a response once complete. 

### 📁 Project Structure
```plaintext
/
├── hgt_files/                  # Directory for .HGT elevation data
│                               # You can symlink this to your own DEM data folder
│
├── src/                        # Source code for STL generation
|   ├── middleware/             # Directory for middleware
|   |   ├── apiKey.js           # Logic for checking API key from backend
|   |   └── rateLimiter.js      # Rate limiter to prevent abusing the microservice
|   | 
│   └── elevstl.c               # C program for terrain-to-STL conversion and relevant helper files
│
├── celevstl                    # Compiled C program for STL generation
├── server.js                   # Node.js server that handles requests and STL generation
├── example.env                 # Example .env file
├── package.json
└── README.md
```

### Notes

STL generation is delegated to the C program elevstl.c, which accepts CLI arguments.

The Node.js server (server.js) acts as a microservice wrapper around this program, receiving parameters from my backend and managing file generation and download.

You must ensure the required .HGT files are available in the hgt_files/ directory.
