#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

export NODE_ENV=production

cd $DIR
cd API
GEN_ONCE=1 node gen.js

cd ../viewer

#normal build
#PKG_APP=1 npm run buildFast
# # Raspberry3 build
#npx --max_old_space_size=700 vue-cli-service build

cd ../server

pnpm run build
