Terrain-Service
===========

Node.js microservice to generate STL terrain models from DEM data. Based on Terrain2STL by ThatcherC

### Try it Out!

You can also download everything here and start the server with:

```node start```

It will run at localhost:8080.

Uses .HGT DEM data, which you need to download yourself. My iteration is currently only available in Norway. 

### Install
First install dependencies
```npm install```

Build the STL generator program with a simple `make`:
```sh
you@comp:~/.../Terrain2STL$ make
```
If that's successful, generate an STL file by hitting the /generate endpoint with a POST request with the following parameters
```

```

The arguments for the celevstl are:
- Northwest corner latitude
- Northwest corner longitude
- Model width ("pixels")
- Model height ("pixels")
- Vertical scaling factor
- Rotation angle (degrees)
- Water drop (mm) (how much the ocean should be lowered in models)
- Base height (mm) (how much extra height to add to the base of model)
- Step size (hgt cells per model pixel)
- Output file name


### Descriptions of Files
* `/hgt_files`

  * This directory contains the neccessary HGT files for STL generation. 
  * This could also be a made a symbolic link to another directory that contains your collection of HGT files

* `/src`

  * This is the source code for the part of the program that actually creates the STL files, didnt need to alter this that much

  * `/src/elevstl.c` - STL-creation program. Accept command line arguments

* `server.js`

  * Node.js server. Takes parameters from my frontend via my backend, and passes them to elevstl to create the STL.
  * Also handles client downloading of files.
