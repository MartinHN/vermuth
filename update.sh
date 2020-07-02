#!/bin/bash
# !!!!!!!!! this script will KILL UI  on rpis !!!!!!!!!!!!!

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd $DIR

echo "GIT PULL"
git pull
#git reset --soft HEAD
arch=$(uname -m)
if [ "$arch" == 'armv*' ];
then
sudo systemctl stop lightdm # Build process need Ram to avoid heap out of memory errors on poor Pi3s
fi

echo "INSTALL"
./install.sh
echo "BUILD "
./build.sh
echo "UPDATE IS DONE"

