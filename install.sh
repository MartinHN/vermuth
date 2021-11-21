#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"


cd $DIR

cd API

pnpm install

cd ../viewer

pnpm install



cd ../server

pnpm install


