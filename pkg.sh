#!/bin/bash

npm run bundle
node --experimental-sea-config sea.config.json
cp $(command -v node) ./dist/server-tools
npx postject ./dist/server-tools NODE_SEA_BLOB ./dist/cli.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
