#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

cd $DIR/server

RCF="/home/pi/.bash_profile"
if [[ -f $RCF ]]; then
    echo "init pi"
    source $RCF
fi

#npm run run
NODE_ENV=production node distPacked/mainServer.js # not ready yet....
