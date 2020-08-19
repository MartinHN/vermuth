#!/bin/bash
# this script may have to be run with sudo

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"


cd $DIR/server

#npm run run
NODE_ENV=production node distPacked/mainServer.js # not ready yet....

