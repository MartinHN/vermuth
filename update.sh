#!/bin/bash
# !!!!!!!!! this script will KILL UI  on rpis !!!!!!!!!!!!!

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd $DIR

echo "GIT PULL"
git pull
#git reset --soft HEAD
sudo pkill x # Build process need Ram to avoid heap out of memory errors on poor Pi3s
echo "BUILD "
./build.sh
echo "UPDATE IS DONE"

