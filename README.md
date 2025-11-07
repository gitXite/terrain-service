# 🌍 Terrain-Service
Terrain-Service is a lightweight Node.js microservice for generating 3D terrain models in STL format from DEM data.
It integrates seamlessly with scape-backend and is based on Terrain2STL by ThatcherC.

---

## 🚀 Quick Start

Clone the repository and start the server:

```node start```

By default, the service runs at http://localhost:8080

⚠️ Note: This service requires .HGT DEM files, which are not included. 
You’ll need to download the appropriate files manually. 
Currently, this version supports terrain generation in Norway only.

---

## 🔧 Installation

**1.** Install Node.js dependencies:
```npm install```

**2.** Build the STL generator (written in C):
```sh
cd terrain-service
make
```

---

## 🐳 Docker Support

You can also run Terrain-Service inside a Docker container for easier setup and consistent environments.

**Build the Docker Image**
```bash
docker build -t terrain-service .
```

**Run the Container**
```bash
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/hgt_files:/app/hgt_files \
  --env-file .env \
  terrain-service
```

-p 8080:8080 — Maps the container’s port to your host machine.
-v $(pwd)/hgt_files:/app/hgt_files — Mounts your local .HGT data directory into the container.
--env-file .env — Loads environment variables from your .env file.

Once running, the service will be available at:
```plaintext
http://localhost:8080
```

---

## 📡 API Usage
Send a ```POST``` request to the ```/generate``` endpoint with the required parameters. 

### ```POST /generate```
Parameters of an API call (sent in body as JSON):

| Parameter     | Description                                 |
| ------------- | ------------------------------------------- |
| `lat`         | Latitude of the **northwest** corner        |
| `lng`         | Longitude of the **northwest** corner       |
| `zscale`      | Vertical scaling factor                     |
| `scale`       | Height & width scaling multiplier           |

Additional arguments for manual generation:

| celevstl args | Description                                 |
| ------------- | ------------------------------------------- |
| `width`       | Width of the model (arbitrary)              |
| `height`      | Height of the model in pixels               |
| `rotation`    | Rotation angle (degrees)                    |
| `waterdrop`   | Amount to lower sea level (in mm)           |
| `baseheight`  | Additional base thickness for model (in mm) |
| `step`        | Step size (HGT cells per model pixel)       |
| `outfile`     | Output STL file name                        |


The STL file will be generated and sent back as a response once complete. 

---

## 📁 Project Structure
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
├── Makefile                    # Simple Makefile to compile elevstl.c
├── Dockerfile                  # Builds the docker image
├── celevstl                    # Compiled C program for STL generation
├── server.js                   # Node.js server that handles requests and STL generation
├── example.env                 # Example .env file
├── package.json
└── README.md
```

---

## 📝 Notes

- STL generation is delegated to the C program elevstl.c, which accepts CLI arguments.
- The Node.js server (server.js) acts as a microservice wrapper around this program, receiving parameters from my backend and managing file generation and download.
- You must ensure the required .HGT files are available in the hgt_files/ directory.
