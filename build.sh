#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"


cd $DIR
cd API
GEN_ONCE=1 node gen.js

cd ../viewer

PKG_APP=1 npm run build


cd ../server

npm run build


