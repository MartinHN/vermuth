#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

NPM=npm

cd $DIR

cd API

$NPM install

cd ../viewer

$NPM install

cd ../server

$NPM install
