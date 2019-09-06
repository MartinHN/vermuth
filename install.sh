#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"


cd $DIR

cd API

npm install

cd ../viewer

npm install



cd ../server

npm install


