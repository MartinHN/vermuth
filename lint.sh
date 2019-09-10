#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"


cd $DIR

cd API

tslint --project . --fix

cd ../viewer

npm run lint



cd ../server

npm run lint


