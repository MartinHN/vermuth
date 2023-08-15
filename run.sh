#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

cd $DIR/server

#npm run run
NODE_ENV=production /home/pi/.local/share/pnpm/node distPacked/mainServer.js # not ready yet....
