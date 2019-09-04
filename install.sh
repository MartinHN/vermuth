#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"


cd $DIR

cd API

npm install

cd ../viewer

npm install
npm run build


cd ../server

npm install
npm run build


