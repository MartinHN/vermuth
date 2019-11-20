#!/bin/bash
# this script may have to be run with sudo

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"


cd $DIR/server/src/

#npm run run
NODE_ENV=production /usr/bin/node -r tsconfig-paths/register -r ts-node/register ./server.ts --public=$DIR/server/dist/server/public
#NODE_ENV=production node dist/server/src/server.js 

